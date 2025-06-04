// public/compartilhado/checklist/midia.js
// Checklist da categoria “Mídia” (Fotografia, Filmagem, Som)

export const checklistMidia = festaId => [
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Definir necessidades de fotografia e filmagem",
    observacao: "Estilo, quantidade de fotógrafos e câmeras necessárias.",
    prioridade: "alta",
    dias_antes_evento: 90,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 1,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Pesquisar e cotar fotógrafos e cinegrafistas",
    observacao: "Peça portfólio e referências antes de fechar contrato.",
    prioridade: "alta",
    dias_antes_evento: 75,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 2,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Contratar serviços de fotografia e filmagem",
    observacao: "Defina horários e locais de cada sessão no cronograma.",
    prioridade: "média",
    dias_antes_evento: 60,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 3,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Verificar equipamentos de iluminação e lentes",
    observacao: "Teste previamente câmeras, tripés e iluminação no local.",
    prioridade: "média",
    dias_antes_evento: 30,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 4,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Definir repertório e equipamento de som / DJ",
    observacao: "Confirme sistema de som, microfones e playlist do DJ.",
    prioridade: "alta",
    dias_antes_evento: 45,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 5,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Testar som e microfones no local",
    observacao: "Faça teste de áudio com antecedência para evitar falhas.",
    prioridade: "média",
    dias_antes_evento: 7,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 6,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Mídia",
    descricao: "Providenciar backup de bateria e cartões de memória",
    observacao: "Leve baterias extras, cartões SD e HDs externos.",
    prioridade: "baixa",
    dias_antes_evento: 3,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 7,
    concluido: false
  }
];
