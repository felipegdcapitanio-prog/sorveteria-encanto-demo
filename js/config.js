/**
 * CONFIG.js — Sorveteria Encanto
 *
 * Projeto demonstrativo da Âncora (não é cliente real). Campo Alegre - MT
 * é uma cidade fictícia. Este é o ÚNICO arquivo que se edita por cliente:
 * nome, sabores, preços, horário e textos saem todos daqui.
 *
 * Paleta de cada sabor (usada pra desenhar a bola de sorvete em 3D):
 *   cor1   = cor principal da bola (a que aparece na maior parte)
 *   cor2   = cor da sombra (lado que a luz não bate) — uns 25% mais escura
 *   luz    = cor do lado iluminado — a cor1 bem clareada, quase pastel
 *   calda  = cor da calda/casquinha combinando, e do destaque no cardápio
 */

const CONFIG = {

  negocio: {
    nome: "Sorveteria Encanto",
    eyebrow: "Sorveteria artesanal · Campo Alegre - MT",
    slogan: "Sorvete cremoso, feito todo dia, com fruta de verdade e aquele sabor de infância.",
    whatsapp: "5566981403125",
    cidade: "Campo Alegre - MT",
    endereco: "Av. das Palmeiras, 245, Centro, Campo Alegre - MT",
    instagram: "@sorveteriaencanto",

    // Horário de funcionamento. `dias` usa o padrão do JavaScript:
    // 0 = domingo, 1 = segunda ... 6 = sábado.
    // É daqui que sai o selo "Aberto agora" / "Fechado" do topo do site.
    expediente: {
      dias: [0, 2, 3, 4, 5, 6], // fecha só na segunda (1)
      abre: "13:00",
      fecha: "22:00",
    },
    horario: [
      { dia: "Terça a Domingo", horas: "13h às 22h" },
      { dia: "Segunda", horas: "Fechado" },
    ],
  },

  entrega: {
    tempoRetirada: "10 a 15 min",
    tempoEntrega: "30 a 45 min",
    taxa: 5,
    minimoEntrega: 20,
    bairros: ["Centro", "Jardim Primavera", "Vila Rica", "Setor Norte"],
  },

  promocao: {
    texto: "Toda quarta é dia de casquinha em dobro: leve 2 e pague 1 nas casquinhas simples.",
  },

  // ---------- SABORES ----------
  // `categoria` alimenta os filtros da vitrine: creme · fruta · chocolate · especial
  // `tags` aparecem como selinho no card (ex: "Mais pedido", "Vegano")
  sabores: [
    {
      id: "chocolate", nome: "Chocolate Belga", categoria: "chocolate",
      desc: "Chocolate meio-amargo batido lentamente, com raspas crocantes no final.",
      preco: "8,00", tags: ["Mais pedido"],
      cor1: "#6b3a22", cor2: "#35190c", luz: "#9c5f38", calda: "#2a140b",
    },
    {
      id: "morango", nome: "Morango do Sítio", categoria: "fruta",
      desc: "Morango colhido na região, batido na hora com pedaços da fruta.",
      preco: "8,00", tags: ["Vegano"],
      cor1: "#f2879f", cor2: "#c2415f", luz: "#ffc0cf", calda: "#c23b64",
    },
    {
      id: "creme", nome: "Creme Baunilha", categoria: "creme",
      desc: "Baunilha de verdade, com aquelas sementinhas pretas espalhadas.",
      preco: "7,50", tags: [],
      cor1: "#f7e3b4", cor2: "#d4ad6c", luz: "#fff8e6", calda: "#d9a441",
    },
    {
      id: "maracuja", nome: "Maracujá", categoria: "fruta",
      desc: "Azedinho na medida certa, com as sementinhas inteiras no meio.",
      preco: "8,00", tags: ["Vegano"],
      cor1: "#fdd85f", cor2: "#d19a1c", luz: "#fff0a8", calda: "#e08a1c",
    },
    {
      id: "pistache", nome: "Pistache", categoria: "creme",
      desc: "Pistache torrado e moído aqui, sem corante e sem essência.",
      preco: "9,50", tags: ["Novo"],
      cor1: "#bdd196", cor2: "#82a05a", luz: "#e2efc4", calda: "#6b8442",
    },
    {
      id: "ninho-nutella", nome: "Ninho com Nutella", categoria: "chocolate",
      desc: "Leite ninho bem cremoso com veios de nutella passando por dentro.",
      preco: "9,50", tags: ["Mais pedido"],
      cor1: "#f6e6c8", cor2: "#c9a878", luz: "#fffaf0", calda: "#5a3418",
    },
    {
      id: "acai", nome: "Açaí do Norte", categoria: "fruta",
      desc: "Açaí puro batido com um toque de guaraná, do jeito paraense.",
      preco: "9,00", tags: ["Vegano"],
      cor1: "#6b4a8f", cor2: "#3a2153", luz: "#9973bd", calda: "#2a1a3d",
    },
    {
      id: "doce-leite", nome: "Doce de Leite", categoria: "creme",
      desc: "Doce de leite argentino cozido devagar até pegar cor de caramelo.",
      preco: "8,50", tags: [],
      cor1: "#dda75f", cor2: "#a06c2c", luz: "#f5cf95", calda: "#7a4a1a",
    },
    {
      id: "coco", nome: "Coco Queimado", categoria: "especial",
      desc: "Coco fresco ralado e levemente tostado, com lascas no final.",
      preco: "8,50", tags: [],
      cor1: "#f8ecdb", cor2: "#cdb69a", luz: "#fffdf8", calda: "#a8763f",
    },
    {
      id: "limao", nome: "Limão Siciliano", categoria: "fruta",
      desc: "Sorbet de limão siciliano com raspas da casca, refrescante de verdade.",
      preco: "8,00", tags: ["Vegano", "Novo"],
      cor1: "#e2efb4", cor2: "#aac76a", luz: "#f6fbdf", calda: "#9bbf3f",
    },
    {
      id: "cookies", nome: "Cookies & Cream", categoria: "especial",
      desc: "Creme branco com biscoito quebrado na mão, nunca triturado.",
      preco: "9,00", tags: [],
      cor1: "#ece1d2", cor2: "#b9a68d", luz: "#fffaf2", calda: "#3a2a1e",
    },
    {
      id: "chocoberry", nome: "Chocoberry", categoria: "chocolate",
      desc: "Metade chocolate, metade morango, com calda dupla por cima.",
      preco: "9,00", tags: ["Mais pedido"],
      cor1: "#d47b86", cor2: "#7a3a35", luz: "#f3a9ad", calda: "#c23b64",
    },
  ],

  // ---------- MONTE SUA CASQUINHA ----------
  montador: {
    titulo: "Monte a sua do seu jeito",
    intro: "Escolha a base, o tamanho, os sabores e o que vai por cima. O preço vai se montando junto e o pedido sai pronto no WhatsApp.",
    bases: [
      { id: "casquinha", nome: "Casquinha", adicional: 0, desc: "A clássica, crocante" },
      { id: "cascao", nome: "Cascão", adicional: 3, desc: "Maior e mais crocante" },
      { id: "casquinha-choco", nome: "Casquinha de chocolate", adicional: 2, desc: "Banhada por dentro" },
      { id: "copinho", nome: "Copinho", adicional: 0, desc: "Pra comer com colher" },
    ],
    tamanhos: [
      { id: "p", nome: "1 bola", bolas: 1, preco: 9 },
      { id: "m", nome: "2 bolas", bolas: 2, preco: 14, destaque: true },
      { id: "g", nome: "3 bolas", bolas: 3, preco: 18 },
    ],
    extras: [
      { id: "calda-choco", nome: "Calda de chocolate", preco: 2, cor: "#3a1d0e" },
      { id: "calda-morango", nome: "Calda de morango", preco: 2, cor: "#c23b64" },
      { id: "granulado", nome: "Granulado", preco: 1.5, cor: "#4a2c1a" },
      { id: "pacoca", nome: "Paçoca esfarelada", preco: 2, cor: "#c9924f" },
      { id: "chantilly", nome: "Chantilly", preco: 3, cor: "#fffaf0" },
      { id: "cereja", nome: "Cereja", preco: 1, cor: "#c1122f" },
    ],
  },

  combo: {
    nome: "Combo Família Encanto",
    descricao: "6 bolas à sua escolha + casquinha ou casca de chocolate + cobertura à vontade",
    preco: "24,90",
    precoNormal: "32,00",
    itens: ["6 bolas dos sabores que quiser", "Casquinha ou casca de chocolate", "Cobertura à vontade", "Serve de 3 a 4 pessoas"],
  },

  sobre: {
    titulo: "Sorvete que a cidade toda ama há 12 anos",
    texto: "A Encanto começou numa carrocinha na praça de Campo Alegre e virou point da cidade. A receita não mudou: leite fresco da região, fruta de verdade e produção artesanal todo santo dia — nada de pó nem saborizante.",
    numeros: [
      { valor: 12, sufixo: "", rotulo: "anos de história" },
      { valor: 12, sufixo: "", rotulo: "sabores na vitrine" },
      { valor: 100, sufixo: "%", rotulo: "feito aqui na loja" },
    ],
  },

  depoimentos: [
    { texto: "Meus filhos só querem sorvete da Encanto, e olha que já provaram sorveteria grande de capital.", autor: "Marcela T.", nota: 5 },
    { texto: "O sabor de maracujá é surreal, parece que estou comendo a fruta direto do pé.", autor: "Diego R.", nota: 5 },
    { texto: "Ambiente lindo, cheio de cor, e o atendimento é sempre com um sorriso.", autor: "Beatriz A.", nota: 5 },
  ],

  faq: [
    { pergunta: "Vocês entregam?", resposta: "Entregamos sim, nos bairros Centro, Jardim Primavera, Vila Rica e Setor Norte. A taxa é R$5 e o pedido mínimo para entrega é R$20." },
    { pergunta: "Tem opção vegana ou sem lactose?", resposta: "Tem! Todos os sabores de fruta (morango, maracujá, açaí e limão) são feitos à base de água, sem nenhum derivado de leite." },
    { pergunta: "Dá pra encomendar pra festa?", resposta: "Dá sim, trabalhamos com potes de 1,5L e 2L e também com carrinho de sorvete pra evento. Chama no WhatsApp que a gente monta um orçamento." },
    { pergunta: "Como funciona o pedido pelo site?", resposta: "Você monta a sua casquinha ou escolhe os sabores, adiciona no carrinho e toca em finalizar. A mensagem chega prontinha no nosso WhatsApp com tudo que você pediu." },
  ],
};
