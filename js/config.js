/**
 * CONFIG.js — Sorveteria Encanto
 *
 * Projeto demonstrativo da Âncora (não é cliente real). Campo Alegre - MT
 * é uma cidade fictícia. Site pensado pro público de sorveteria de bairro:
 * visual bem colorido e animado, cardápio de sabores com preço, combo em
 * destaque e pedido fechando direto no WhatsApp.
 */

const CONFIG = {
  negocio: {
    nome: "Sorveteria Encanto",
    eyebrow: "Sorveteria artesanal · Campo Alegre - MT",
    slogan: "Sorvete cremoso, feito todo dia, com fruta de verdade e aquele sabor de infância.",
    whatsapp: "5566981403125",
    cidade: "Campo Alegre - MT",
    endereco: "Av. das Palmeiras, 245, Centro, Campo Alegre - MT",
    horario: [
      { dia: "Terça a Domingo", horas: "13h às 22h" },
      { dia: "Segunda", horas: "Fechado" },
    ],
    instagram: "@sorveteriaencanto",
  },

  promocao: {
    texto: "Toda quarta é dia de casquinha em dobro: leve 2 e pague 1 nas casquinhas simples.",
  },

  sabores: [
    { id: "chocolate", nome: "Chocolate Belga", desc: "Sorvete de chocolate meio-amargo com raspas crocantes", preco: "8,00", cor1: "#6b3a22", cor2: "#3c1d10", calda: "#2a140b" },
    { id: "morango", nome: "Morango do Sítio", desc: "Morango fresco batido na hora, bem cremoso", preco: "8,00", cor1: "#f4a3b8", cor2: "#e5678c", calda: "#c23b64" },
    { id: "chocoberry", nome: "Chocoberry", desc: "Metade chocolate, metade morango, com calda dupla", preco: "9,00", cor1: "#e88aa3", cor2: "#7a4128", calda: "#c23b64" },
    { id: "creme", nome: "Creme Baunilha", desc: "Clássico de baunilha, macio e aveludado", preco: "7,50", cor1: "#fbeecb", cor2: "#f3d99a", calda: "#d9a441" },
    { id: "maracuja", nome: "Maracujá", desc: "Azedinho na medida certa, com sementinhas de verdade", preco: "8,00", cor1: "#ffe27a", cor2: "#f4b942", calda: "#e08a1c" },
    { id: "ninho-nutela", nome: "Ninho com Nutella", desc: "Leite ninho cremoso com recheio de nutella", preco: "9,50", cor1: "#fff6e0", cor2: "#e8c98a", calda: "#5a3418" },
  ],

  combo: {
    nome: "Combo Família Encanto",
    descricao: "6 bolas à sua escolha + casquinha ou casca de chocolate + cobertura à vontade",
    preco: "24,90",
    precoNormal: "32,00",
  },

  sobre: {
    titulo: "Sorvete que a cidade toda ama há 12 anos",
    texto: "A Encanto começou numa carrocinha na praça de Campo Alegre e virou point da cidade. A receita não mudou: leite fresco da região, fruta de verdade e produção artesanal todo santo dia — nada de pó nem saborizante.",
  },

  depoimentos: [
    { texto: "Meus filhos só quer sorvete da Encanto, e olha que já provaram sorveteria grande de capital.", autor: "Marcela T." },
    { texto: "O sabor de maracujá é surreal, parece que estou comendo a fruta.", autor: "Diego R." },
    { texto: "Ambiente lindo, cheio de cor, e o atendimento é sempre com um sorriso.", autor: "Beatriz A." },
  ],
};
