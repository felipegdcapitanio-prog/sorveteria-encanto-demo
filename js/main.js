/**
 * main.js — Sorveteria Encanto
 *
 * Monta o site inteiro a partir do CONFIG e liga as interações.
 * Nada aqui precisa ser editado pra trocar de cliente — o conteúdo todo
 * mora em config.js.
 *
 * Organização:
 *   1. Utilidades
 *   2. Sistema de luz (uma fonte de luz só, o site todo reage a ela)
 *   3. Desenho do sorvete em 3D
 *   4. Hero, vitrine, montador, combo, sobre, depoimentos, FAQ, local
 *   5. Carrinho e checkout no WhatsApp
 *   6. Interações (menu, tilt, reveal, partículas, scroll spy)
 */

(function () {
  "use strict";

  /* ======================================================================
     1. UTILIDADES
     ====================================================================== */

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  const MOV_REDUZIDO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TOQUE = window.matchMedia("(hover: none)").matches;

  const CHAVE_CARRINHO = "encanto_carrinho";
  const CHAVE_FAVORITOS = "encanto_favoritos";

  /** Lê JSON do localStorage sem quebrar em aba anônima ou storage bloqueado. */
  function lerStorage(chave, padrao) {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
      return padrao;
    }
  }
  function gravarStorage(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      /* aba anônima ou storage cheio — o site continua funcionando sem salvar */
    }
  }

  const moeda = (n) => "R$ " + n.toFixed(2).replace(".", ",");
  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /** Escurece ou clareia um hex. fator < 1 escurece, > 1 clareia. */
  function ajustarCor(hex, fator) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const lim = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const r = lim(((n >> 16) & 255) * fator);
    const g = lim(((n >> 8) & 255) * fator);
    const b = lim((n & 255) * fator);
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  function linkWhatsapp(mensagem) {
    return `https://wa.me/${CONFIG.negocio.whatsapp}?text=${encodeURIComponent(mensagem)}`;
  }

  const saborPorId = (id) => CONFIG.sabores.find((s) => s.id === id);
  const basePorId = (id) => CONFIG.montador.bases.find((b) => b.id === id);
  const tamanhoPorId = (id) => CONFIG.montador.tamanhos.find((t) => t.id === id);
  const extraPorId = (id) => CONFIG.montador.extras.find((e) => e.id === id);

  /* ======================================================================
     2. SISTEMA DE LUZ
     Existe uma fonte de luz só na página. Ela vira quatro variáveis CSS:
       --luz-x / --luz-y : posição na tela (move o halo e os reflexos)
       --lx / --ly       : direção normalizada (-1 a 1), usada por cada bola
                           de sorvete pra saber de que lado vem o brilho e
                           pra que lado jogar a sombra.
     É isso que faz as peças parecerem estar na mesma cena.
     ====================================================================== */

  const luz = { x: 0.5, y: 0.15, alvoX: 0.5, alvoY: 0.15 };

  function aplicarLuz() {
    const raiz = document.documentElement.style;
    // deslocamento do halo em px, aplicado via transform (compositor)
    raiz.setProperty("--luz-tx", ((luz.x - 0.5) * window.innerWidth).toFixed(0) + "px");
    raiz.setProperty("--luz-ty", ((luz.y - 0.3) * window.innerHeight * 0.5).toFixed(0) + "px");
    // direção: converte a posição (0..1) em vetor de -1 a 1
    raiz.setProperty("--lx", ((luz.x - 0.5) * 2).toFixed(3));
    raiz.setProperty("--ly", ((luz.y - 0.5) * 2 - 0.35).toFixed(3));
  }

  function ligarLuz() {
    aplicarLuz();

    // No celular a luz fica parada. Mover a luz repinta todas as bolas de
    // sorvete da página, e fazer isso a cada frame de scroll derrubava a
    // rolagem pra 17fps num aparelho fraco. A cena continua iluminada — só
    // não persegue o dedo.
    if (MOV_REDUZIDO || TOQUE) return;

    window.addEventListener("pointermove", (e) => {
      luz.alvoX = e.clientX / window.innerWidth;
      luz.alvoY = Math.min(0.6, e.clientY / window.innerHeight);
      acordar();
    }, { passive: true });

    // Suaviza o movimento: a luz "persegue" o alvo em vez de saltar nele
    let rodando = false;
    function passo() {
      luz.x += (luz.alvoX - luz.x) * 0.08;
      luz.y += (luz.alvoY - luz.y) * 0.08;
      aplicarLuz();
      if (Math.abs(luz.alvoX - luz.x) > 0.002 || Math.abs(luz.alvoY - luz.y) > 0.002) {
        requestAnimationFrame(passo);
      } else {
        rodando = false;
      }
    }
    function acordar() {
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }
  }

  /* ======================================================================
     3. DESENHO DO SORVETE EM 3D
     Cada bola é montada com 5 camadas de CSS: silhueta irregular, degradê
     posicionado pela luz, brilho especular, luz de rebote e textura de
     raspa. As cores derivadas (sombra, rebote) saem calculadas daqui pra
     não depender de color-mix no CSS.
     ====================================================================== */

  function varsDaBola(sabor) {
    return [
      `--cor1:${sabor.cor1}`,
      `--cor2:${sabor.cor2}`,
      `--luz:${sabor.luz}`,
      `--cor-escura:${ajustarCor(sabor.cor2, 0.68)}`,
      `--rebote:${ajustarCor(sabor.cor1, 1.25)}`,
    ].join(";");
  }

  /**
   * Monta o HTML de um sorvete inteiro.
   * @param {object} opts
   * @param {object[]} opts.sabores  sabores de baixo pra cima
   * @param {string}   opts.base     id da base (casquinha, cascao, copinho…)
   * @param {string[]} opts.extras   ids dos extras
   * @param {number}   opts.escala   1 = tamanho cheio
   * @param {boolean}  opts.animar   anima as bolas entrando
   */
  function htmlSorvete(opts) {
    const sabores = opts.sabores || [];
    const baseId = opts.base || "casquinha";
    const extras = opts.extras || [];
    const escala = opts.escala || 1;
    const animar = Boolean(opts.animar);

    const D = Math.round(96 * escala);
    const larguraBase = Math.round(86 * escala);
    const ehCopo = baseId === "copinho";
    const alturaBase = Math.round((ehCopo ? 94 : 132) * escala);
    const passo = Math.round(D * 0.5);
    const afunda = Math.round(D * 0.3);
    const inicio = alturaBase - afunda;

    let html = "";

    // Sombra de contato no chão
    html += `<span class="sombra-chao" style="width:${Math.round(D * 1.5)}px;height:${Math.round(D * 0.5)}px;bottom:${Math.round(-D * 0.1)}px" aria-hidden="true"></span>`;

    const vazias = opts.vazias || 0;
    const topo = sabores.length - 1;
    const bottomTopo = inicio + Math.max(0, topo) * passo;
    const temChantilly = extras.includes("chantilly");
    const temCereja = extras.includes("cereja");

    // Espaços ainda não preenchidos, desenhados acima das bolas escolhidas
    for (let v = sabores.length + vazias - 1; v >= sabores.length; v--) {
      html += `<span class="bola bola--vazia ${["bola--f1", "bola--f2", "bola--f3"][v % 3]}"
        style="--d:${D}px;bottom:${inicio + v * passo}px" aria-hidden="true"></span>`;
    }

    // --- Bolas: do topo pra base, pra ordem de pintura empilhar certo.
    // A bola de baixo é pintada por último e cobre a de cima, que é como a
    // pilha real se lê: cada colherada se encaixa na de baixo. ---
    for (let i = topo; i >= 0; i--) {
      const s = sabores[i];
      if (!s) continue;
      const forma = ["bola--f1", "bola--f2", "bola--f3"][i % 3];
      const atraso = animar ? `animation-delay:${i * 0.07}s;` : "";
      html += `<span class="bola ${forma} ${animar ? "bola--entrando" : ""}"
        style="--d:${D}px;${varsDaBola(s)};bottom:${inicio + i * passo}px;${atraso}" aria-hidden="true"></span>`;

      // Tudo que vai POR CIMA entra logo depois da bola do topo, nesta
      // ordem: calda, confeitos, chantilly e cereja. Pintar antes da bola
      // deixaria a cereja enterrada dentro do sorvete.
      if (i === topo) {
        const calda = extras.find((id) => id === "calda-choco" || id === "calda-morango");
        if (calda) {
          const cor = extraPorId(calda).cor;
          html += `<span class="calda" style="--d:${D}px;--cor-calda:${cor};bottom:${bottomTopo + Math.round(D * 0.24)}px" aria-hidden="true"></span>`;
        }

        extras.filter((id) => id === "granulado" || id === "pacoca").forEach((id) => {
          const cor = extraPorId(id).cor;
          for (let c = 0; c < 9; c++) {
            const ang = (c / 9) * Math.PI * 2 + (id === "pacoca" ? 0.35 : 0);
            const x = Math.cos(ang) * D * 0.3;
            const y = Math.sin(ang) * D * 0.3 * 0.42;
            html += `<span class="confeito" style="--c:${cor};left:calc(50% + ${x.toFixed(0)}px);bottom:${bottomTopo + Math.round(D * 0.56 + y)}px;transform:rotate(${(ang * 57).toFixed(0)}deg)" aria-hidden="true"></span>`;
          }
        });

        if (temChantilly) {
          html += `<span class="chantilly" style="--d:${D}px;bottom:${bottomTopo + Math.round(D * 0.58)}px" aria-hidden="true"></span>`;
        }
        if (temCereja) {
          const lado = Math.round(20 * escala);
          const temCalda = extras.some((id) => id.startsWith("calda-"));
          const alturaCereja = bottomTopo + Math.round(D * (temChantilly ? 1.12 : temCalda ? 0.8 : 0.7));
          html += `<span class="cereja" style="left:50%;margin-left:${-lado / 2}px;bottom:${alturaCereja}px;width:${lado}px;height:${lado}px" aria-hidden="true"></span>`;
        }
      }
    }

    // --- Base (pintada por último: fica na frente da bola de baixo) ---
    if (ehCopo) {
      html += `<span class="copinho" style="--w:${larguraBase}px;--h:${alturaBase}px;bottom:0" aria-hidden="true">
        <span class="copinho__borda" style="--w:${larguraBase}px"></span>
      </span>`;
    } else {
      const corCasquinha = baseId === "casquinha-choco" ? "filter:hue-rotate(-14deg) saturate(1.5) brightness(0.62);" : "";
      const escalaBase = baseId === "cascao" ? 1.16 : 1;
      const w = Math.round(larguraBase * escalaBase);
      html += `<span class="casquinha" style="--w:${w}px;--h:${Math.round(alturaBase * escalaBase)}px;bottom:0;${corCasquinha}" aria-hidden="true">
        <span class="casquinha__borda" style="--w:${w}px"></span>
      </span>`;
    }

    return html;
  }

  /** Versão miniatura usada nos cards da vitrine. */
  function htmlSorveteMini(sabor, escala) {
    return htmlSorvete({ sabores: [sabor], base: "casquinha", extras: [], escala: escala || 0.72 });
  }

  /* ======================================================================
     4. SEÇÕES
     ====================================================================== */

  /* ---- Textos fixos, links de WhatsApp e status ---- */
  function preencherBase() {
    $("#hero-eyebrow").textContent = CONFIG.negocio.eyebrow;
    $("#hero-slogan").textContent = CONFIG.negocio.slogan;
    $("#sobre-titulo").textContent = CONFIG.sobre.titulo;
    $("#sobre-texto").textContent = CONFIG.sobre.texto;
    $("#montador-titulo").textContent = CONFIG.montador.titulo;
    $("#montador-intro").textContent = CONFIG.montador.intro;
    $("#ano-atual").textContent = new Date().getFullYear();

    $$("[data-nome-negocio]").forEach((el) => { el.textContent = CONFIG.negocio.nome; });

    const msg = `Oi! Vim pelo site da ${CONFIG.negocio.nome} e queria fazer um pedido 🍦`;
    $$("[data-wa]").forEach((el) => { el.href = linkWhatsapp(msg); });

    $("#local-endereco").textContent = CONFIG.negocio.endereco;
    $("#local-mapa").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.negocio.endereco);
    $("#local-horario").innerHTML = CONFIG.negocio.horario
      .map((h) => `<span><strong>${escapar(h.dia)}</strong> <span>${escapar(h.horas)}</span></span>`)
      .join("");
    $("#local-bairros").textContent =
      `Entregamos em ${CONFIG.entrega.bairros.join(", ")} · taxa ${moeda(CONFIG.entrega.taxa)} · pedido mínimo ${moeda(CONFIG.entrega.minimoEntrega)}`;

    $("#hero-prova-entrega").innerHTML = `Entrega em <strong>${escapar(CONFIG.entrega.tempoEntrega)}</strong>`;
    $("#hero-prova-sabores").innerHTML = `<strong>${CONFIG.sabores.length} sabores</strong> na vitrine`;
  }

  /* ---- Selo aberto / fechado, calculado do horário ---- */
  function minutosDe(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  /** "22:00" -> "22h" · "13:30" -> "13h30" */
  function horaCurta(hhmm) {
    const [h, m] = hhmm.split(":");
    return Number(m) === 0 ? `${Number(h)}h` : `${Number(h)}h${m}`;
  }

  function estadoLoja() {
    const exp = CONFIG.negocio.expediente;
    const agora = new Date();
    const diaOk = exp.dias.includes(agora.getDay());
    const minAgora = agora.getHours() * 60 + agora.getMinutes();
    const abre = minutosDe(exp.abre);
    const fecha = minutosDe(exp.fecha);
    const aberto = diaOk && minAgora >= abre && minAgora < fecha;

    let recado;
    if (aberto) {
      const faltam = fecha - minAgora;
      recado = faltam <= 60 ? `Fecha em ${faltam} min` : `Aberto até ${horaCurta(exp.fecha)}`;
    } else if (diaOk && minAgora < abre) {
      recado = `Abre às ${horaCurta(exp.abre)}`;
    } else {
      recado = "Fechado agora";
    }
    return { aberto, recado };
  }

  function renderStatus() {
    const { aberto, recado } = estadoLoja();
    $$("[data-status]").forEach((el) => {
      el.className = "selo-status " + (aberto ? "selo-status--aberto" : "selo-status--fechado");
      el.innerHTML = `<span class="selo-status__ponto"></span><span>${escapar(recado)}</span>`;
    });
  }

  /* ---- Faixa de promoção ---- */
  function renderFaixaPromo() {
    const item = `<span class="faixa-promo__item">🍨 ${escapar(CONFIG.promocao.texto)}</span>`;
    // duplicado: o segundo bloco entra onde o primeiro sai, o loop fica sem emenda
    $("#faixa-promo-trilho").innerHTML = item.repeat(8);
  }

  /* ---- Vitrine de sabores ---- */
  const CATEGORIAS = [
    { id: "todos", nome: "Todos" },
    { id: "creme", nome: "Cremes" },
    { id: "fruta", nome: "Frutas" },
    { id: "chocolate", nome: "Chocolates" },
    { id: "especial", nome: "Especiais" },
  ];

  let filtroAtual = "todos";
  let soFavoritos = false;
  let favoritos = lerStorage(CHAVE_FAVORITOS, []);

  function renderFiltros() {
    const wrap = $("#vitrine-filtros");
    const conta = (id) => (id === "todos" ? CONFIG.sabores.length : CONFIG.sabores.filter((s) => s.categoria === id).length);
    wrap.innerHTML =
      CATEGORIAS.filter((c) => conta(c.id) > 0)
        .map((c) => `<button type="button" class="chip ${c.id === filtroAtual ? "is-ativo" : ""}" data-filtro="${c.id}" aria-pressed="${c.id === filtroAtual}">
          ${c.nome} <span class="chip__contador">${conta(c.id)}</span>
        </button>`)
        .join("") +
      `<button type="button" class="chip" data-so-favoritos aria-pressed="${soFavoritos}">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20.5 4.5 13a4.6 4.6 0 0 1 6.5-6.5l1 1 1-1A4.6 4.6 0 1 1 19.5 13z"/></svg>
        Favoritos
      </button>`;

    $$("[data-filtro]", wrap).forEach((b) => b.addEventListener("click", () => {
      filtroAtual = b.dataset.filtro;
      renderFiltros();
      renderSabores();
    }));
    $("[data-so-favoritos]", wrap).addEventListener("click", () => {
      soFavoritos = !soFavoritos;
      renderFiltros();
      renderSabores();
    });
  }

  function saboresVisiveis() {
    return CONFIG.sabores.filter((s) => {
      if (filtroAtual !== "todos" && s.categoria !== filtroAtual) return false;
      if (soFavoritos && !favoritos.includes(s.id)) return false;
      return true;
    });
  }

  function renderSabores() {
    const grade = $("#vitrine-grade");
    const lista = saboresVisiveis();

    if (!lista.length) {
      grade.innerHTML = `<p class="vitrine__vazio">${soFavoritos ? "Você ainda não favoritou nenhum sabor. Toque no coração de um card pra guardar aqui." : "Nenhum sabor nessa categoria."}</p>`;
      return;
    }

    grade.innerHTML = lista
      .map((s, i) => {
        const fav = favoritos.includes(s.id);
        const tags = (s.tags || [])
          .map((t) => {
            const classe = t === "Vegano" ? "tag--vegano" : t === "Novo" ? "tag--novo" : "";
            return `<span class="tag ${classe}">${escapar(t)}</span>`;
          })
          .join("");
        return `
        <article class="sabor-card reveal" style="--atraso:${(i % 4) * 0.07}s" data-tilt data-sabor="${s.id}">
          <div class="sabor-card__tags">${tags}</div>
          <button type="button" class="btn-favorito" data-fav="${s.id}" aria-pressed="${fav}"
            aria-label="${fav ? "Remover" : "Guardar"} ${escapar(s.nome)} dos favoritos">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="${fav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M12 20.5 4.5 13a4.6 4.6 0 0 1 6.5-6.5l1 1 1-1A4.6 4.6 0 1 1 19.5 13z"/></svg>
          </button>
          <div class="sabor-card__palco cena-3d">
            <div class="sorvete">${htmlSorveteMini(s)}</div>
          </div>
          <h3 class="sabor-card__nome">${escapar(s.nome)}</h3>
          <p class="sabor-card__desc">${escapar(s.desc)}</p>
          <div class="sabor-card__rodape">
            <span class="sabor-card__preco tabular">R$ ${escapar(s.preco)} <small>/bola</small></span>
            <button type="button" class="btn-add" data-add-sabor="${s.id}">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>
              Add
            </button>
          </div>
        </article>`;
      })
      .join("");

    $$("[data-fav]", grade).forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.fav;
        const i = favoritos.indexOf(id);
        if (i >= 0) favoritos.splice(i, 1);
        else {
          favoritos.push(id);
          b.classList.add("btn-favorito--pulo");
          setTimeout(() => b.classList.remove("btn-favorito--pulo"), 460);
        }
        gravarStorage(CHAVE_FAVORITOS, favoritos);
        const ativo = favoritos.includes(id);
        b.setAttribute("aria-pressed", ativo);
        b.querySelector("svg").setAttribute("fill", ativo ? "currentColor" : "none");
        renderFiltros();
        if (soFavoritos) renderSabores();
      })
    );

    $$("[data-add-sabor]", grade).forEach((b) =>
      b.addEventListener("click", () => {
        const s = saborPorId(b.dataset.addSabor);
        adicionarAoCarrinho({
          tipo: "sabor",
          nome: `1 bola de ${s.nome}`,
          detalhes: ["Na casquinha"],
          preco: parseFloat(s.preco.replace(",", ".")),
          cor1: s.cor1, cor2: s.cor2, luz: s.luz,
        });
      })
    );

    ligarTilt(grade);
    ligarReveal(grade);
  }

  /* ---- Monte sua casquinha ---- */
  const montagem = {
    base: CONFIG.montador.bases[0].id,
    tamanho: (CONFIG.montador.tamanhos.find((t) => t.destaque) || CONFIG.montador.tamanhos[0]).id,
    sabores: [],
    extras: [],
  };

  function limiteBolas() {
    return tamanhoPorId(montagem.tamanho).bolas;
  }

  function precoMontagem() {
    let total = tamanhoPorId(montagem.tamanho).preco + basePorId(montagem.base).adicional;
    montagem.extras.forEach((id) => { total += extraPorId(id).preco; });
    return total;
  }

  function renderMontadorOpcoes() {
    // Base
    $("#montador-bases").innerHTML = CONFIG.montador.bases
      .map((b) => `<button type="button" class="opcao" data-base="${b.id}" aria-pressed="${b.id === montagem.base}">
        <span class="opcao__nome">${escapar(b.nome)}</span>
        <span class="opcao__desc">${escapar(b.desc)}</span>
        ${b.adicional ? `<span class="opcao__preco">+ ${moeda(b.adicional)}</span>` : ""}
      </button>`)
      .join("");

    // Tamanho
    $("#montador-tamanhos").innerHTML = CONFIG.montador.tamanhos
      .map((t) => `<button type="button" class="opcao" data-tamanho="${t.id}" aria-pressed="${t.id === montagem.tamanho}">
        ${t.destaque ? '<span class="opcao__selo">Mais pedido</span>' : ""}
        <span class="opcao__nome">${escapar(t.nome)}</span>
        <span class="opcao__preco">${moeda(t.preco)}</span>
      </button>`)
      .join("");

    // Sabores
    const limite = limiteBolas();
    const cheio = montagem.sabores.length >= limite;
    $("#montador-sabores").innerHTML = CONFIG.sabores
      .map((s) => {
        const qtd = montagem.sabores.filter((id) => id === s.id).length;
        const bloqueado = cheio && qtd === 0;
        return `<button type="button" class="bolinha-sabor" data-sabor-add="${s.id}"
          aria-pressed="${qtd > 0}" ${bloqueado ? "disabled" : ""}
          aria-label="${escapar(s.nome)}${qtd ? ` (${qtd} na casquinha)` : ""}">
          ${qtd > 1 ? `<span class="bolinha-sabor__qtd">${qtd}</span>` : ""}
          <span class="bolinha-sabor__disco" style="${varsDaBola(s)}"></span>
          <span class="bolinha-sabor__nome">${escapar(s.nome)}</span>
        </button>`;
      })
      .join("");

    const dica = $("#montador-dica-sabores");
    const faltam = limite - montagem.sabores.length;
    dica.textContent = faltam > 0 ? `escolha ${faltam} ${faltam === 1 ? "bola" : "bolas"}` : "tudo escolhido ✓";
    dica.classList.toggle("passo__dica--alerta", faltam > 0);

    // Extras
    $("#montador-extras").innerHTML = CONFIG.montador.extras
      .map((e) => `<button type="button" class="extra-linha" data-extra="${e.id}" aria-pressed="${montagem.extras.includes(e.id)}">
        <span class="extra-linha__caixa">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.4"><path d="m5 13 4 4L19 7"/></svg>
        </span>
        <span class="extra-linha__cor" style="--c:${e.cor}"></span>
        <span class="extra-linha__nome">${escapar(e.nome)}</span>
        <span class="extra-linha__preco">+ ${moeda(e.preco)}</span>
      </button>`)
      .join("");

    ligarEventosMontador();
  }

  function ligarEventosMontador() {
    $$("[data-base]").forEach((b) => b.addEventListener("click", () => {
      montagem.base = b.dataset.base;
      renderMontadorOpcoes();
      renderPrevia(true);
    }));

    $$("[data-tamanho]").forEach((b) => b.addEventListener("click", () => {
      montagem.tamanho = b.dataset.tamanho;
      // Se diminuiu o tamanho, corta as bolas que sobraram
      montagem.sabores = montagem.sabores.slice(0, limiteBolas());
      renderMontadorOpcoes();
      renderPrevia(true);
    }));

    $$("[data-sabor-add]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.saborAdd;
      const qtd = montagem.sabores.filter((s) => s === id).length;
      if (qtd > 0 && montagem.sabores.length >= limiteBolas()) {
        // já está cheio e esse sabor já está lá: um toque tira uma bola dele
        montagem.sabores.splice(montagem.sabores.indexOf(id), 1);
      } else if (montagem.sabores.length < limiteBolas()) {
        montagem.sabores.push(id);
      } else {
        return;
      }
      renderMontadorOpcoes();
      renderPrevia(true);
    }));

    $$("[data-extra]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.extra;
      const i = montagem.extras.indexOf(id);
      if (i >= 0) montagem.extras.splice(i, 1);
      else {
        // calda é uma só: escolher uma troca a outra
        if (id.startsWith("calda-")) {
          montagem.extras = montagem.extras.filter((e) => !e.startsWith("calda-"));
        }
        montagem.extras.push(id);
      }
      renderMontadorOpcoes();
      renderPrevia(true);
    }));
  }

  function descricaoMontagem() {
    const base = basePorId(montagem.base);
    const tam = tamanhoPorId(montagem.tamanho);
    const nomes = montagem.sabores.map((id) => saborPorId(id).nome);
    const extras = montagem.extras.map((id) => extraPorId(id).nome);
    return { base, tam, nomes, extras };
  }

  function renderPrevia(animar) {
    const { base, tam, nomes, extras } = descricaoMontagem();
    const palco = $("#montador-sorvete");

    palco.innerHTML = htmlSorvete({
      sabores: montagem.sabores.map(saborPorId),
      base: montagem.base,
      extras: montagem.extras,
      escala: 0.92,
      vazias: limiteBolas() - montagem.sabores.length,
      animar: animar && !MOV_REDUZIDO,
    });

    const resumo = $("#montador-resumo");
    if (!montagem.sabores.length) {
      // "aí do lado" só vale no desktop — no celular os passos ficam embaixo
      resumo.innerHTML = `<strong>${escapar(base.nome)}</strong> · ${escapar(tam.nome)}<br>Agora é só escolher os sabores 🍨`;
    } else {
      resumo.innerHTML =
        `<strong>${escapar(base.nome)}</strong> · ${escapar(tam.nome)}<br>` +
        escapar(nomes.join(" + ")) +
        (extras.length ? `<br><span style="opacity:.75">com ${escapar(extras.join(", "))}</span>` : "");
    }

    const valor = $("#montador-total");
    valor.textContent = moeda(precoMontagem());
    valor.classList.add("montador__total-valor--muda");
    setTimeout(() => valor.classList.remove("montador__total-valor--muda"), 320);

    const btn = $("#montador-add");
    const faltam = limiteBolas() - montagem.sabores.length;
    btn.disabled = faltam > 0;
    btn.textContent = faltam > 0
      ? (faltam === 1 ? "Escolha mais 1 sabor" : `Escolha mais ${faltam} sabores`)
      : `Adicionar ao carrinho · ${moeda(precoMontagem())}`;
  }

  function ligarMontador() {
    renderMontadorOpcoes();
    renderPrevia(false);

    $("#montador-add").addEventListener("click", () => {
      const { base, tam, nomes, extras } = descricaoMontagem();
      const primeiro = saborPorId(montagem.sabores[0]);
      adicionarAoCarrinho({
        tipo: "montado",
        nome: `${base.nome} · ${tam.nome}`,
        detalhes: [`Sabores: ${nomes.join(", ")}`].concat(extras.length ? [`Extras: ${extras.join(", ")}`] : []),
        preco: precoMontagem(),
        cor1: primeiro.cor1, cor2: primeiro.cor2, luz: primeiro.luz,
      });
      // Limpa os sabores pra pessoa montar a próxima sem apagar um por um
      montagem.sabores = [];
      montagem.extras = [];
      renderMontadorOpcoes();
      renderPrevia(true);
    });

    // "Me surpreenda": sorteia uma combinação completa
    $("#btn-sorteio").addEventListener("click", (ev) => {
      const btn = ev.currentTarget;
      btn.classList.add("btn-sorteio--girando");
      setTimeout(() => btn.classList.remove("btn-sorteio--girando"), 720);

      const sorteia = (arr) => arr[Math.floor(Math.random() * arr.length)];
      montagem.base = sorteia(CONFIG.montador.bases).id;
      montagem.tamanho = sorteia(CONFIG.montador.tamanhos).id;
      montagem.sabores = [];
      for (let i = 0; i < limiteBolas(); i++) montagem.sabores.push(sorteia(CONFIG.sabores).id);
      montagem.extras = Math.random() > 0.35 ? [sorteia(CONFIG.montador.extras).id] : [];

      renderMontadorOpcoes();
      renderPrevia(true);
      avisar("Sorteamos uma pra você 🎲");
    });
  }

  /* ---- Combo ---- */
  function renderCombo() {
    $("#combo-nome").textContent = CONFIG.combo.nome;
    $("#combo-descricao").textContent = CONFIG.combo.descricao;
    $("#combo-preco-de").textContent = `de R$ ${CONFIG.combo.precoNormal}`;
    $("#combo-preco-por").textContent = `R$ ${CONFIG.combo.preco}`;

    const economia = parseFloat(CONFIG.combo.precoNormal.replace(",", ".")) - parseFloat(CONFIG.combo.preco.replace(",", "."));
    $("#combo-economia").textContent = `economize ${moeda(economia)}`;

    $("#combo-lista").innerHTML = CONFIG.combo.itens.map((i) => `<li>${escapar(i)}</li>`).join("");

    // Leque de casquinhas abrindo
    const cores = CONFIG.sabores.slice(0, 6);
    $("#combo-leque").innerHTML = cores
      .map((s, i) => {
        const ang = (i - (cores.length - 1) / 2) * 13;
        return `<span class="leque-item" style="--angulo:${ang}deg">
          <span class="sorvete">${htmlSorvete({ sabores: [s], base: "casquinha", extras: [], escala: 0.52 })}</span>
        </span>`;
      })
      .join("");

    $("#combo-add").addEventListener("click", () => {
      adicionarAoCarrinho({
        tipo: "combo",
        nome: CONFIG.combo.nome,
        detalhes: [CONFIG.combo.descricao],
        preco: parseFloat(CONFIG.combo.preco.replace(",", ".")),
        cor1: cores[0].cor1, cor2: cores[0].cor2, luz: cores[0].luz,
      });
    });
  }

  /* ---- Sobre: números que sobem ---- */
  function renderNumeros() {
    $("#sobre-numeros").innerHTML = CONFIG.sobre.numeros
      .map((n) => `<div class="numero-card reveal">
        <span class="numero-card__valor" data-contar="${n.valor}" data-sufixo="${n.sufixo}">0${n.sufixo}</span>
        <span class="numero-card__rotulo">${escapar(n.rotulo)}</span>
      </div>`)
      .join("");

    const alvos = $$("[data-contar]");
    if (!("IntersectionObserver" in window) || MOV_REDUZIDO) {
      alvos.forEach((el) => { el.textContent = el.dataset.contar + el.dataset.sufixo; });
      return;
    }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const el = e.target;
        const fim = Number(el.dataset.contar);
        const suf = el.dataset.sufixo;
        const inicio = performance.now();
        const dur = 1300;
        (function anima(agora) {
          const p = Math.min(1, (agora - inicio) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(fim * eased) + suf;
          if (p < 1) requestAnimationFrame(anima);
        })(inicio);
      });
    }, { threshold: 0.5 });
    alvos.forEach((el) => obs.observe(el));
  }

  /* ---- Depoimentos ---- */
  function renderDepoimentos() {
    $("#lista-depoimentos").innerHTML = CONFIG.depoimentos
      .map((d, i) => `<blockquote class="depoimento-card reveal" style="--atraso:${i * 0.08}s">
        <div class="depoimento-card__estrelas" aria-label="${d.nota} de 5 estrelas">${"★".repeat(d.nota)}</div>
        <p>${escapar(d.texto)}</p>
        <cite><span class="depoimento-card__avatar">${escapar(d.autor.charAt(0))}</span>${escapar(d.autor)}</cite>
      </blockquote>`)
      .join("");
  }

  /* ---- FAQ ---- */
  function renderFaq() {
    $("#faq-lista").innerHTML = CONFIG.faq
      .map((f, i) => `<div class="faq-item">
        <button type="button" class="faq-item__botao" aria-expanded="false" aria-controls="faq-corpo-${i}">
          ${escapar(f.pergunta)}
          <span class="faq-item__seta" aria-hidden="true">+</span>
        </button>
        <div class="faq-item__corpo" id="faq-corpo-${i}"><div><p>${escapar(f.resposta)}</p></div></div>
      </div>`)
      .join("");

    $$("#faq-lista .faq-item__botao").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".faq-item");
        const aberto = item.classList.contains("is-aberto");
        // sanfona: abre um, fecha os outros
        $$("#faq-lista .faq-item").forEach((outro) => {
          outro.classList.remove("is-aberto");
          outro.querySelector(".faq-item__botao").setAttribute("aria-expanded", "false");
        });
        if (!aberto) {
          item.classList.add("is-aberto");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ======================================================================
     5. CARRINHO
     ====================================================================== */

  let carrinho = lerStorage(CHAVE_CARRINHO, []);
  let modoEntrega = "retirada";

  function totalItens() {
    return carrinho.reduce((s, i) => s + i.qtd, 0);
  }
  function subtotal() {
    return carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);
  }
  function taxaAtual() {
    return modoEntrega === "entrega" && carrinho.length ? CONFIG.entrega.taxa : 0;
  }
  function totalGeral() {
    return subtotal() + taxaAtual();
  }

  function adicionarAoCarrinho(item) {
    // Itens idênticos viram quantidade em vez de linha repetida
    const assinatura = item.nome + "|" + (item.detalhes || []).join("|");
    const existente = carrinho.find((i) => i.nome + "|" + (i.detalhes || []).join("|") === assinatura);
    if (existente) {
      existente.qtd += 1;
    } else {
      carrinho.push(Object.assign({ uid: Date.now() + "-" + Math.random().toString(36).slice(2, 7), qtd: 1 }, item));
    }
    salvarCarrinho();
    avisar(`${item.nome} no carrinho 🍦`);

    const btn = $("#btn-carrinho");
    btn.classList.add("btn-carrinho--pulsa");
    setTimeout(() => btn.classList.remove("btn-carrinho--pulsa"), 520);
  }

  function salvarCarrinho() {
    gravarStorage(CHAVE_CARRINHO, carrinho);
    renderCarrinho();
  }

  function renderCarrinho() {
    const n = totalItens();
    const contador = $("#carrinho-contador");
    contador.textContent = n;
    contador.hidden = n === 0;

    $("#barra-total").textContent = moeda(totalGeral());
    $("#barra-rotulo").textContent = n ? `${n} ${n === 1 ? "item" : "itens"} no carrinho` : "Carrinho vazio";

    const corpo = $("#carrinho-corpo");
    if (!carrinho.length) {
      corpo.innerHTML = `<div class="carrinho__vazio">
        <div class="carrinho__vazio-icone">🍨</div>
        <p><strong>Seu carrinho está vazio</strong></p>
        <p>Monte a sua casquinha ou escolha um sabor da vitrine.</p>
      </div>`;
    } else {
      corpo.innerHTML = carrinho
        .map((i) => `<div class="item-carrinho">
          <span class="item-carrinho__disco" style="--cor1:${i.cor1};--cor2:${i.cor2};--luz:${i.luz}"></span>
          <div class="item-carrinho__info">
            <div class="item-carrinho__nome">${escapar(i.nome)}</div>
            ${(i.detalhes || []).map((d) => `<div class="item-carrinho__detalhe">${escapar(d)}</div>`).join("")}
            <div class="item-carrinho__preco tabular">${moeda(i.preco * i.qtd)}</div>
            <div class="item-carrinho__qtd">
              <button type="button" class="qtd-btn" data-menos="${i.uid}" aria-label="Diminuir quantidade">−</button>
              <span class="qtd-valor">${i.qtd}</span>
              <button type="button" class="qtd-btn" data-mais="${i.uid}" aria-label="Aumentar quantidade">+</button>
              <button type="button" class="item-carrinho__remover" data-remover="${i.uid}">remover</button>
            </div>
          </div>
        </div>`)
        .join("");

      $$("[data-mais]", corpo).forEach((b) => b.addEventListener("click", () => {
        carrinho.find((i) => i.uid === b.dataset.mais).qtd += 1;
        salvarCarrinho();
      }));
      $$("[data-menos]", corpo).forEach((b) => b.addEventListener("click", () => {
        const item = carrinho.find((i) => i.uid === b.dataset.menos);
        item.qtd -= 1;
        if (item.qtd <= 0) carrinho = carrinho.filter((i) => i.uid !== item.uid);
        salvarCarrinho();
      }));
      $$("[data-remover]", corpo).forEach((b) => b.addEventListener("click", () => {
        carrinho = carrinho.filter((i) => i.uid !== b.dataset.remover);
        salvarCarrinho();
      }));
    }

    // Resumo de valores
    $("#carrinho-subtotal").textContent = moeda(subtotal());
    const linhaTaxa = $("#carrinho-linha-taxa");
    linhaTaxa.hidden = modoEntrega !== "entrega";
    $("#carrinho-taxa").textContent = moeda(taxaAtual());
    $("#carrinho-total").textContent = moeda(totalGeral());
    $("#carrinho-tempo").textContent = modoEntrega === "entrega" ? CONFIG.entrega.tempoEntrega : CONFIG.entrega.tempoRetirada;

    // Aviso de pedido mínimo pra entrega
    const faltaMinimo = modoEntrega === "entrega" && subtotal() > 0 && subtotal() < CONFIG.entrega.minimoEntrega;
    const aviso = $("#carrinho-aviso");
    aviso.hidden = !faltaMinimo;
    if (faltaMinimo) {
      aviso.textContent = `Faltam ${moeda(CONFIG.entrega.minimoEntrega - subtotal())} pro pedido mínimo de entrega.`;
    }

    $("#carrinho-finalizar").disabled = carrinho.length === 0 || faltaMinimo;
  }

  function abrirCarrinho() {
    $("#carrinho").classList.add("carrinho--aberto");
    $("#overlay-carrinho").hidden = false;
    requestAnimationFrame(() => $("#overlay-carrinho").classList.add("overlay--visivel"));
    $("#carrinho").setAttribute("aria-hidden", "false");
    $("#carrinho-fechar").focus();
  }
  function fecharCarrinho() {
    $("#carrinho").classList.remove("carrinho--aberto");
    $("#overlay-carrinho").classList.remove("overlay--visivel");
    $("#carrinho").setAttribute("aria-hidden", "true");
    setTimeout(() => { $("#overlay-carrinho").hidden = true; }, 340);
  }

  function mensagemPedido() {
    let txt = `Oi! Quero fazer um pedido no site da ${CONFIG.negocio.nome} 🍦\n\n*MEU PEDIDO*\n`;
    carrinho.forEach((i) => {
      txt += `\n${i.qtd}x ${i.nome}\n`;
      (i.detalhes || []).forEach((d) => { txt += `   ${d}\n`; });
      txt += `   ${moeda(i.preco * i.qtd)}\n`;
    });
    txt += `\n————————————\n`;
    txt += `Subtotal: ${moeda(subtotal())}\n`;
    if (modoEntrega === "entrega") {
      txt += `Entrega: ${moeda(taxaAtual())}\n`;
      txt += `*Total: ${moeda(totalGeral())}*\n\n`;
      txt += `📍 *Entrega* (${CONFIG.entrega.tempoEntrega})\nMeu endereço: `;
    } else {
      txt += `*Total: ${moeda(totalGeral())}*\n\n`;
      txt += `🏠 *Retirada na loja* (${CONFIG.entrega.tempoRetirada})`;
    }
    return txt;
  }

  function ligarCarrinho() {
    $("#btn-carrinho").addEventListener("click", abrirCarrinho);
    $("#carrinho-fechar").addEventListener("click", fecharCarrinho);
    $("#overlay-carrinho").addEventListener("click", fecharCarrinho);
    $("#barra-abrir").addEventListener("click", abrirCarrinho);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#carrinho").classList.contains("carrinho--aberto")) fecharCarrinho();
    });

    $$("[data-entrega]").forEach((b) =>
      b.addEventListener("click", () => {
        modoEntrega = b.dataset.entrega;
        $$("[data-entrega]").forEach((o) => {
          o.classList.toggle("is-ativo", o === b);
          o.setAttribute("aria-pressed", o === b);
        });
        renderCarrinho();
      })
    );

    $("#carrinho-finalizar").addEventListener("click", () => {
      if (!carrinho.length) return;
      window.open(linkWhatsapp(mensagemPedido()), "_blank", "noopener");
    });

    renderCarrinho();
  }

  /* ---- Aviso flutuante ---- */
  let timerAviso;
  function avisar(texto) {
    const el = $("#aviso");
    el.innerHTML = `<span>${escapar(texto)}</span>`;
    el.classList.add("aviso--visivel");
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => el.classList.remove("aviso--visivel"), 2600);
  }

  /* ======================================================================
     6. INTERAÇÕES
     ====================================================================== */

  /* ---- Menu mobile ---- */
  function ligarMenu() {
    const btn = $("#btn-menu");
    const menu = $("#menu-mobile");
    const overlay = $("#overlay-menu");

    function abrir() {
      menu.hidden = false;
      overlay.hidden = false;
      requestAnimationFrame(() => {
        menu.classList.add("menu-mobile--aberto");
        overlay.classList.add("overlay--visivel");
      });
      btn.setAttribute("aria-expanded", "true");
    }
    function fechar() {
      menu.classList.remove("menu-mobile--aberto");
      overlay.classList.remove("overlay--visivel");
      btn.setAttribute("aria-expanded", "false");
      setTimeout(() => { menu.hidden = true; overlay.hidden = true; }, 360);
    }

    btn.addEventListener("click", () => {
      btn.getAttribute("aria-expanded") === "true" ? fechar() : abrir();
    });
    overlay.addEventListener("click", fechar);
    $("#menu-fechar").addEventListener("click", fechar);
    $$("#menu-mobile a").forEach((a) => a.addEventListener("click", fechar));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") fechar();
    });
  }

  /* ---- Header com sombra + link ativo conforme a seção ---- */
  function ligarHeader() {
    const header = $(".header");
    window.addEventListener("scroll", () => {
      header.classList.toggle("header--rolado", window.scrollY > 8);
    }, { passive: true });

    if (!("IntersectionObserver" in window)) return;
    const links = $$(".header__nav a");
    const secoes = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-ativo", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secoes.forEach((s) => obs.observe(s));
  }

  /* ---- Tilt 3D nos cards ---- */
  function ligarTilt(raiz) {
    if (TOQUE || MOV_REDUZIDO) return;
    $$("[data-tilt]", raiz || document).forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateY(${((px - 0.5) * 11).toFixed(2)}deg) rotateX(${((0.5 - py) * 11).toFixed(2)}deg) translateY(-5px)`;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---- Reveal ao rolar ---- */
  function ligarReveal(raiz) {
    const alvos = $$(".reveal:not(.reveal--visivel)", raiz || document);
    if (!("IntersectionObserver" in window) || MOV_REDUZIDO) {
      alvos.forEach((el) => el.classList.add("reveal--visivel"));
      return;
    }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("reveal--visivel");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    alvos.forEach((el) => obs.observe(el));
  }

  /* ---- Partículas de luz no hero (canvas) ---- */
  function ligarParticulas() {
    if (MOV_REDUZIDO) return;
    const canvas = $("#hero-particulas");
    const ctx = canvas.getContext("2d");
    let larg = 0, alt = 0, particulas = [], rodando = true, raf;

    function medir() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      larg = r.width; alt = r.height;
      canvas.width = larg * dpr;
      canvas.height = alt * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function semear() {
      const qtd = larg < 600 ? 22 : 40;
      particulas = Array.from({ length: qtd }, () => ({
        x: Math.random() * larg,
        y: Math.random() * alt,
        r: 0.8 + Math.random() * 2.4,
        vy: -(0.08 + Math.random() * 0.32),
        vx: (Math.random() - 0.5) * 0.14,
        a: 0.12 + Math.random() * 0.4,
        fase: Math.random() * Math.PI * 2,
      }));
    }

    function desenhar(t) {
      if (!rodando) return;
      ctx.clearRect(0, 0, larg, alt);
      particulas.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(t / 2600 + p.fase) * 0.16;
        if (p.y < -12) { p.y = alt + 12; p.x = Math.random() * larg; }
        if (p.x < -12) p.x = larg + 12;
        if (p.x > larg + 12) p.x = -12;

        const cintila = 0.72 + Math.sin(t / 700 + p.fase) * 0.28;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.4);
        g.addColorStop(0, `rgba(255, 238, 198, ${(p.a * cintila).toFixed(3)})`);
        g.addColorStop(1, "rgba(255, 216, 150, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(desenhar);
    }

    medir();
    semear();
    raf = requestAnimationFrame(desenhar);

    window.addEventListener("resize", () => { medir(); semear(); }, { passive: true });

    // Para de desenhar quando o hero sai da tela — não gasta bateria à toa
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((e) => {
        const visivel = e[0].isIntersecting;
        if (visivel && !rodando) { rodando = true; raf = requestAnimationFrame(desenhar); }
        if (!visivel && rodando) { rodando = false; cancelAnimationFrame(raf); }
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { rodando = false; cancelAnimationFrame(raf); }
      else if (!rodando) { rodando = true; raf = requestAnimationFrame(desenhar); }
    });
  }

  /* ---- Sorvete do hero ---- */
  function renderHeroSorvete() {
    const destaques = CONFIG.sabores.filter((s) => (s.tags || []).includes("Mais pedido")).slice(0, 3);
    const escolha = destaques.length === 3 ? destaques : CONFIG.sabores.slice(0, 3);
    $("#hero-sorvete").innerHTML = htmlSorvete({
      sabores: escolha,
      base: "casquinha",
      extras: ["calda-choco", "cereja"],
      escala: 1.08,
    });
  }

  /* ======================================================================
     INÍCIO
     ====================================================================== */

  function iniciar() {
    preencherBase();
    renderStatus();
    setInterval(renderStatus, 60000); // mantém o selo certo sem recarregar

    ligarLuz();
    renderHeroSorvete();
    renderFaixaPromo();
    renderFiltros();
    renderSabores();
    ligarMontador();
    renderCombo();
    renderNumeros();
    renderDepoimentos();
    renderFaq();
    ligarCarrinho();

    ligarMenu();
    ligarHeader();
    ligarReveal();
    ligarTilt();
    ligarParticulas();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
