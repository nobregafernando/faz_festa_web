// public/compartilhado/checklist/convites.js
// Checklist da categoria “Convites”

export const checklistConvites = festaId => [
  {
    festa_id: festaId,
    categoria: "Convites",
    descricao: "Definir modelo / layout do convite",
    observacao: "Escolha fonte, cores e elementos gráficos adequados ao tema.",
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
    categoria: "Convites",
    descricao: "Selecionar método de envio (físico ou digital)",
    observacao: "Considere prazo de impressão e tempo de entrega por correio.",
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
    categoria: "Convites",
    descricao: "Contratar serviço de impressão ou plataforma digital",
    observacao: "Negocie orçamento e prazos com gráfica ou site de convites.",
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
    categoria: "Convites",
    descricao: "Revisar conteúdo e informações (data, endereço, RSVP)",
    observacao: "Verifique se telefone e endereço estão corretos.",
    prioridade: "média",
    dias_antes_evento: 50,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 4,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Convites",
    descricao: "Enviar convites aos convidados",
    observacao: "Confirme lista final de convidados antes do envio.",
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
    categoria: "Convites",
    descricao: "Acompanhar confirmação de presença (RSVP)",
    observacao: "Registrar resposta de cada convidado para planejamento.",
    prioridade: "média",
    dias_antes_evento: 30,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 6,
    concluido: false
  },
  {
    festa_id: festaId,
    categoria: "Convites",
    descricao: "Enviar lembrete para convidados que não responderam",
    observacao: "Lembrete 15 dias antes para confirmar presença faltante.",
    prioridade: "baixa",
    dias_antes_evento: 15,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 7,
    concluido: false
  }
];
