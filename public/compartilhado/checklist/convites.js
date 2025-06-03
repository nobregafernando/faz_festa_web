// public/compartilhado/checklist/convites.js

/**
 * Checklist da categoria “Convites”
 * (mesmo estilo de local.js e decoracao.js)
 */
export const checklistConvites = festaId => [
  {
    festa_id: festaId,
    categoria: "Convites",
    descricao: "Criar convite personalizado",
    observacao: "Escolha layout e texto conforme o tema.",
    prioridade: "alta",
    cor: "#3498db",
    dias_antes_evento: 60,
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
    descricao: "Montar lista de convidados",
    observacao: "Inclua nome, e-mail e/ou telefone.",
    prioridade: "alta",
    cor: "#3498db",
    dias_antes_evento: 50,
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
    descricao: "Enviar convites (e-mail / WhatsApp)",
    observacao: "Reforce data, hora e local.",
    prioridade: "média",
    cor: "#3498db",
    dias_antes_evento: 30,
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
    descricao: "Confirmar presença dos convidados",
    observacao: "Revise respostas 1 semana antes.",
    prioridade: "média",
    cor: "#3498db",
    dias_antes_evento: 7,
    ocultar_antes: false,
    mensagem_pessoal: null,
    tipo_execucao: "manual",
    url_acao: null,
    ordem: 4,
    concluido: false
  }
];
