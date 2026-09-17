/**
 * main.js — Sorveteria Encanto
 * Renderiza o conteúdo a partir de CONFIG e liga as animações/interações.
 */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function linkWhatsapp(mensagem) {
    const numero = CONFIG.negocio.whatsapp;
    const texto = encodeURIComponent(mensagem);
    return `https://wa.me/${numero}?text=${texto}`;
  }

  /* ---- Header / hero / textos fixos ---- */
  function preencherTextosBase() {
    $("#hero-eyebrow").textContent = CONFIG.negocio.eyebrow;
    $("#hero-slogan").textContent = CONFIG.negocio.slogan;

    const msgGeral = `Oi! Vim pelo site da ${CONFIG.negocio.nome} e queria fazer um pedido 🍦`;
    ["header-whatsapp", "menu-whatsapp", "hero-whatsapp", "cta-whatsapp", "local-whatsapp"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = linkWhatsapp(msgGeral);
    });
    $("#wa-flutuante").href = linkWhatsapp(msgGeral);
    $("#cta-mobile-whatsapp").href = linkWhatsapp(msgGeral);

    $("#sobre-titulo").textContent = CONFIG.sobre.titulo;
    $("#sobre-texto").textContent = CONFIG.sobre.texto;

    $("#local-endereco").textContent = "📍 " + CONFIG.negocio.endereco;
    $("#local-horario").innerHTML = CONFIG.negocio.horario
      .map((h) => `<span><strong>${h.dia}:</strong> ${h.horas}</span>`)
      .join("");
    $("#local-mapa").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.negocio.endereco);

    $("#ano-atual").textContent = new Date().getFullYear();
  }

  /* ---- Cone ilustrado (CSS puro) reutilizável ---- */
  function htmlCone(sabor, { pequeno = false } = {}) {
    return `
      <div class="cone-mini ${pequeno ? "cone-mini--pequeno" : ""}" style="--cor1:${sabor.cor1}; --cor2:${sabor.cor2}; --calda:${sabor.calda}">
        <span class="cone-mini__calda"></span>
        <span class="cone-mini__bola cone-mini__bola--2"></span>
        <span class="cone-mini__bola cone-mini__bola--1"></span>
        <span class="cone-mini__casquinha"></span>
      </div>`;
  }

  /* ---- Sabores ---- */
  function renderSabores() {
    const wrap = $("#lista-sabores");
    wrap.innerHTML = CONFIG.sabores
      .map(
        (s, i) => `
      <article class="sabor-card reveal" style="--atraso:${i * 0.06}s">
        <div class="sabor-card__preco">só R$${s.preco}</div>
        ${htmlCone(s)}
        <h3 class="sabor-card__nome">${s.nome}</h3>
        <p class="sabor-card__desc">${s.desc}</p>
        <a href="${linkWhatsapp(`Oi! Vim pelo site e quero pedir o sabor ${s.nome} 🍦`)}" class="sabor-card__pedir" target="_blank" rel="noopener noreferrer">Pedir esse</a>
      </article>`
      )
      .join("");
  }

  /* ---- Faixa de promoção (marquee) ---- */
  function renderFaixaPromo() {
    const trilho = $("#faixa-promo-trilho");
    const item = `<span class="faixa-promo__item">🍨 ${CONFIG.promocao.texto}</span>`;
    trilho.innerHTML = item.repeat(6);
  }

  /* ---- Combo (leque de bolas) ---- */
  function renderCombo() {
    $("#combo-descricao").textContent = CONFIG.combo.descricao;
    $("#combo-preco-de").textContent = `de R$${CONFIG.combo.precoNormal}`;
    $("#combo-preco-por").textContent = `por R$${CONFIG.combo.preco}`;
    $("#combo-whatsapp").href = linkWhatsapp(`Oi! Vim pelo site e quero pedir o ${CONFIG.combo.nome} 🍨`);

    const leque = $("#combo-leque");
    const cores = CONFIG.sabores;
    leque.innerHTML = cores
      .map((s, i) => {
        const angulo = (i - (cores.length - 1) / 2) * 15;
        return `<span class="leque-item reveal" style="--angulo:${angulo}deg; --atraso:${i * 0.08}s">${htmlCone(s)}</span>`;
      })
      .join("");
  }

  /* ---- Depoimentos ---- */
  function renderDepoimentos() {
    $("#lista-depoimentos").innerHTML = CONFIG.depoimentos
      .map(
        (d, i) => `
      <blockquote class="depoimento-card reveal" style="--atraso:${i * 0.08}s">
        <p>"${d.texto}"</p>
        <cite>${d.autor}</cite>
      </blockquote>`
      )
      .join("");
  }

  /* ---- Confetes flutuantes no hero ---- */
  function renderConfete() {
    const wrap = $("#hero-confete");
    const formas = ["🍒", "✦", "❉", "✧", "🍓"];
    let html = "";
    for (let i = 0; i < 14; i++) {
      const forma = formas[i % formas.length];
      const esquerda = Math.round(Math.random() * 100);
      const atraso = (Math.random() * 6).toFixed(2);
      const duracao = (8 + Math.random() * 6).toFixed(2);
      const escala = (0.6 + Math.random() * 0.7).toFixed(2);
      html += `<span class="hero__confete-item" style="left:${esquerda}%; animation-delay:${atraso}s; animation-duration:${duracao}s; --escala:${escala}">${forma}</span>`;
    }
    wrap.innerHTML = html;
  }

  /* ---- Menu mobile ---- */
  function ligarMenuMobile() {
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
      setTimeout(() => {
        menu.hidden = true;
        overlay.hidden = true;
      }, 220);
    }

    btn.addEventListener("click", () => {
      const aberto = btn.getAttribute("aria-expanded") === "true";
      aberto ? fechar() : abrir();
    });
    overlay.addEventListener("click", fechar);
    $$("#menu-mobile a").forEach((a) => a.addEventListener("click", fechar));
  }

  /* ---- Header com sombra ao rolar ---- */
  function ligarHeaderScroll() {
    const header = $(".header");
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("header--rolado", window.scrollY > 8),
      { passive: true }
    );
  }

  /* ---- Reveal on scroll ---- */
  function ligarReveal() {
    const alvos = $$(".reveal, .sabor-card, .depoimento-card");
    if (!("IntersectionObserver" in window)) {
      alvos.forEach((el) => el.classList.add("reveal--visivel"));
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal--visivel");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    alvos.forEach((el) => obs.observe(el));
  }

  function iniciar() {
    preencherTextosBase();
    renderSabores();
    renderFaixaPromo();
    renderCombo();
    renderDepoimentos();
    renderConfete();
    ligarMenuMobile();
    ligarHeaderScroll();
    ligarReveal();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
