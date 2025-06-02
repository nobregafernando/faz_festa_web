import supabase from "../compartilhado/supabaseClient.js";
import { checklistLocal } from "../compartilhado/checklist/local.js";
/*
  Futuramente, importe outros módulos de checklist, por ex:
    import { checklistDecoracao } from "../compartilhado/checklist/decoracao.js";
*/

// Elementos do DOM
const headerFestaDiv = document.getElementById("header-festa");
const festaInfoDiv   = document.getElementById("festa-info");
const categoryCont   = document.getElementById("category-container");
const tasksSection   = document.getElementById("tasks-container");
const tasksHeader    = document.getElementById("tasks-header");
const tasksGrid      = document.getElementById("tasks-grid");
const btnBack        = document.getElementById("btn-back");

// Variáveis globais
let allFestas       = [];   // Array de festas do usuário
let festaId         = null; // ID da festa selecionada
let dataEventoParam = null; // Data da festa selecionada (string ISO)
let gruposGlobal    = {};   // Objeto agrupando tarefas por categoria
let currentCategory = null; // Categoria atualmente aberta

/* ===== 1. Ao carregar a página, valida sessão e carrega festas ===== */
document.addEventListener("DOMContentLoaded", async () => {
  // 1.1) Verifica sessão Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    // Se não estiver logado, redireciona para login
    window.location.replace("../autenticacao/login.html");
    return;
  }

  // 1.2) Carrega todas as festas do usuário (para marcar no calendário)
  await fetchFestas(session.user.id);

  // 1.3) Renderiza o calendário com as festas marcadas
  renderCalendar();

  // 1.4) Estado inicial: só a mensagem “Selecione uma festa...”
  headerFestaDiv.classList.remove("hidden");
  festaInfoDiv.classList.add("hidden");
  categoryCont.classList.add("hidden");
  tasksSection.classList.add("hidden");
});

/* ===== 2. Busca todas as festas do usuário e popula allFestas ===== */
async function fetchFestas(userId) {
  const { data: festas, error } = await supabase
    .from("festas")
    .select("id, nome, data_evento")
    .eq("usuario_id", userId)
    .order("data_evento", { ascending: true });

  if (error) {
    console.error("Erro ao carregar festas:", error);
    return;
  }

  // Monta um array com { id, nome, data_evento, text } para uso no calendário
  allFestas = festas.map((f) => ({
    id: f.id,
    nome: f.nome,
    data_evento: f.data_evento,
    text: `${f.nome} – ${new Date(f.data_evento).toLocaleDateString("pt-BR")}`
  }));
}

/* ===== 3. Renderiza o calendário com as festas marcadas ===== */
let currentCalendarDate = new Date(); // mês e ano atualmente exibidos

function renderCalendar() {
  const calDiv = document.getElementById("calendar-container");
  if (!calDiv) return;
  calDiv.innerHTML = ""; // limpa antes de redesenhar

  const month = currentCalendarDate.getMonth();
  const year  = currentCalendarDate.getFullYear();

  // 3.1) Cabeçalho (mês/ano) com botões < e >
  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <button id="prev-month"><i class="fa-solid fa-chevron-left"></i></button>
    <span class="month-year">${formatMonthYear(month, year)}</span>
    <button id="next-month"><i class="fa-solid fa-chevron-right"></i></button>
  `;
  calDiv.appendChild(header);

  // 3.2) Dias da semana
  const diasNome = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const gridDiasNome = document.createElement("div");
  gridDiasNome.className = "calendar-grid";
  diasNome.forEach((dn) => {
    const dnDiv = document.createElement("div");
    dnDiv.className = "day-name";
    dnDiv.textContent = dn;
    gridDiasNome.appendChild(dnDiv);
  });
  calDiv.appendChild(gridDiasNome);

  // 3.3) Dias do mês (incluindo “inativos” para alinhamento)
  const gridDias = document.createElement("div");
  gridDias.className = "calendar-grid";

  const firstDay      = new Date(year, month, 1).getDay();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const prevDaysCount = new Date(year, month, 0).getDate();

  // 3.3.1) Dias finais do mês anterior (para alinhar início de semana)
  for (let i = firstDay - 1; i >= 0; i--) {
    const div = document.createElement("div");
    div.className = "day inactive";
    div.textContent = prevDaysCount - i;
    gridDias.appendChild(div);
  }

  // 3.3.2) Dias deste mês
  for (let d = 1; d <= daysInMonth; d++) {
    const diaData = new Date(year, month, d);
    const div     = document.createElement("div");
    div.className = "day";
    div.textContent = d;

    // Se existir alguma festa nesta data, marca com classe .festa
    const temFesta = allFestas.some((f) => {
      const dt = new Date(f.data_evento);
      return (
        dt.getDate() === diaData.getDate() &&
        dt.getMonth() === diaData.getMonth() &&
        dt.getFullYear() === diaData.getFullYear()
      );
    });
    if (temFesta) {
      div.classList.add("festa");
      div.dataset.date = diaData.toISOString();

      // Clique em dia “.festa”: seleciona a primeira festa daquele dia
      div.addEventListener("click", async () => {
        const festasNoDia = allFestas.filter((f) => {
          const dt = new Date(f.data_evento);
          return (
            dt.getDate() === diaData.getDate() &&
            dt.getMonth() === diaData.getMonth() &&
            dt.getFullYear() === diaData.getFullYear()
          );
        });
        if (festasNoDia.length === 0) return;

        // Seleciona a primeira festa do dia
        const fEscolhida = festasNoDia[0];
        await selectFesta(fEscolhida);
        marcarDiaNoCalendar(diaData);
      });
    }

    // Se esse dia coincide com dataEventoParam, marca como “.selected”
    if (
      dataEventoParam &&
      new Date(dataEventoParam).toDateString() === diaData.toDateString()
    ) {
      div.classList.add("selected");
    }

    gridDias.appendChild(div);
  }

  // 3.3.3) Dias iniciais do próximo mês (para completar a grade)
  const totalFills =
    Math.ceil((firstDay + daysInMonth) / 7) * 7 - (firstDay + daysInMonth);
  for (let i = 1; i <= totalFills; i++) {
    const div = document.createElement("div");
    div.className = "day inactive";
    div.textContent = i;
    gridDias.appendChild(div);
  }

  calDiv.appendChild(gridDias);

  // 3.4) Navegação mês anterior/próximo
  document.getElementById("prev-month").onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  };
  document.getElementById("next-month").onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  };
}

/* ===== Formata “Junho 2025” ===== */
function formatMonthYear(m, y) {
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${nomes[m]} ${y}`;
}

/* ===== Marca um dia como “.selected” no calendário ===== */
function marcarDiaNoCalendar(dateObj) {
  document
    .querySelectorAll("#calendar-container .day.selected")
    .forEach((el) => el.classList.remove("selected"));

  const isoStr = new Date(dateObj).toISOString();
  document
    .querySelectorAll("#calendar-container .day.festa")
    .forEach((el) => {
      if (el.dataset.date === isoStr) {
        el.classList.add("selected");
      }
    });
}

/* ===== 4. Seleciona uma festa: exibe título (no header-festa) e detalhes ===== */
async function selectFesta(f) {
  festaId = f.id;
  dataEventoParam = f.data_evento;

  // 4.1) Substitui o texto de “Selecione uma festa…” pelo título da festa
  headerFestaDiv.innerHTML = `
    <h2 class="festa-title">${f.text}</h2>
  `;

  // 4.2) Exibe e preenche o painel de detalhes da festa
  festaInfoDiv.classList.remove("hidden");
  await loadFestaInfo(f);

  // 4.3) Exibe cards de categoria
  await showCategories(festaId);
}

/* ===== 5. Carrega e exibe cards de categoria ===== */
async function showCategories(festaIdParam) {
  currentCategory = null;
  tasksSection.classList.add("hidden");
  tasksGrid.innerHTML = "";
  categoryCont.innerHTML = "";
  categoryCont.classList.remove("hidden");

  // 5.1) Se não houver tarefas no banco, insere o padrão
  const { data: existentes } = await supabase
    .from("checklist_evento")
    .select("id, categoria, concluido")
    .eq("festa_id", festaIdParam);

  if (!existentes || existentes.length === 0) {
    const tarefas = [...checklistLocal(festaIdParam)];
    await supabase.from("checklist_evento").insert(tarefas);
  }

  // 5.2) Busca todos os itens do checklist
  const { data: itens } = await supabase
    .from("checklist_evento")
    .select("*")
    .eq("festa_id", festaIdParam)
    .order("ordem", { ascending: true });

  if (!itens || itens.length === 0) {
    categoryCont.innerHTML =
      "<p>Este checklist não possui tarefas cadastradas.</p>";
    return;
  }

  // 5.3) Agrupa as tarefas por categoria
  gruposGlobal = itens.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});

  // 5.4) Atualiza o resumo geral de tarefas (no topo de festa-info)
  updateResumoTarefas(itens);

  // 5.5) Cria card para cada categoria
  Object.entries(gruposGlobal).forEach(([categoria, tarefas]) => {
    const card = buildCategoryCard(categoria, tarefas);
    categoryCont.appendChild(card);
  });
}

/* ===== 6. Atualiza texto “Faltam X tarefas para concluir” ===== */
function updateResumoTarefas(itens) {
  const restantesTotal = itens.filter((t) => !t.concluido).length;
  const textoResumo = restantesTotal > 0
    ? `Faltam ${restantesTotal} tarefa${restantesTotal > 1 ? "s" : ""} para concluir`
    : "Todas as tarefas concluídas";

  const resumoSpan = festaInfoDiv.querySelector(".resumo-tarefas .texto-resumo");
  if (resumoSpan) {
    resumoSpan.textContent = textoResumo;
  }
}

/* ===== 7. Cria Card de Categoria ===== */
function buildCategoryCard(nome, tarefas) {
  const restantes = tarefas.filter((t) => !t.concluido).length;
  const textoProgress =
    restantes > 0
      ? `Resta${restantes > 1 ? "m" : ""} ${restantes} tarefa${restantes > 1 ? "s" : ""} a realizar`
      : "Todas as tarefas concluídas";

  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.categoria = nome;

  card.innerHTML = `
    <i class="fa-solid fa-box-open"></i>
    <h2>${nome}</h2>
    <p class="progress">${textoProgress}</p>
  `;

  // Toggle expand/contrair
  card.addEventListener("click", () => {
    if (
      currentCategory === nome &&
      !tasksSection.classList.contains("hidden")
    ) {
      tasksSection.classList.add("hidden");
      categoryCont.classList.remove("hidden");
      tasksGrid.innerHTML = "";
      currentCategory = null;
    } else {
      currentCategory = nome;
      showTasks(nome, gruposGlobal[nome]);
    }
  });

  return card;
}

/* ===== 8. Exibe Cards de Tarefa de uma Categoria ===== */
function showTasks(categoria, tarefas) {
  categoryCont.classList.add("hidden");
  tasksSection.classList.remove("hidden");

  tasksHeader.textContent = categoria;
  tasksGrid.innerHTML = "";

  tarefas.forEach((item) => {
    const taskCard = buildTaskCard(item);
    tasksGrid.appendChild(taskCard);
  });
}

/* ===== 9. Cria Card de Tarefa ===== */
function buildTaskCard(item) {
  const card = document.createElement("div");
  card.className = `task-card priority-${item.prioridade}`;
  if (item.concluido) {
    card.classList.add("completed");
  }

  // Checkbox
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = item.concluido;
  chk.addEventListener("change", async () => {
    const done = chk.checked;
    await updateItem(item.id, { concluido: done });
    if (done) {
      card.classList.add("completed");
    } else {
      card.classList.remove("completed");
    }
    atualizarProgressoCategoria(item.categoria);
  });
  card.appendChild(chk);

  // Info (descrição e observação)
  const info = document.createElement("div");
  info.className = "task-info";

  const desc = document.createElement("p");
  desc.className = "task-desc";
  desc.textContent = item.descricao;
  info.appendChild(desc);

  if (item.observacao) {
    const note = document.createElement("p");
    note.className = "task-note";
    note.textContent = item.observacao;
    info.appendChild(note);
  }

  // Ícone para expandir/collapse da anotação
  const iconNote = document.createElement("i");
  iconNote.className = "fa-regular fa-note-sticky icon-note";
  iconNote.title = "Adicionar anotação";
  iconNote.addEventListener("click", () => {
    textarea.style.display =
      textarea.style.display === "none" ? "block" : "none";
  });
  card.appendChild(iconNote);

  // Campo de anotação (textarea), escondido por padrão
  const textarea = document.createElement("textarea");
  textarea.className = "note-edit";
  textarea.placeholder = "Digite sua anotação aqui…";
  textarea.value = item.mensagem_pessoal || "";
  textarea.addEventListener("blur", async () => {
    await updateItem(item.id, { mensagem_pessoal: textarea.value });
  });
  info.appendChild(textarea);
  card.appendChild(info);

  // Se “ocultar_antes” estiver ativo e a data atual for anterior, esconde o card
  if (item.ocultar_antes && dataEventoParam) {
    const ev = new Date(dataEventoParam);
    const liber = new Date(ev);
    liber.setDate(ev.getDate() - (item.dias_antes_evento || 0));
    if (Date.now() < liber.getTime()) {
      card.style.display = "none";
    }
  }

  return card;
}

/* ===== 10. “Voltar às Categorias” ===== */
btnBack.addEventListener("click", () => {
  tasksSection.classList.add("hidden");
  categoryCont.classList.remove("hidden");
  tasksGrid.innerHTML = "";
  currentCategory = null;
});

/* ===== 11. Atualiza um item no Supabase ===== */
async function updateItem(id, fields) {
  const { error } = await supabase
    .from("checklist_evento")
    .update(fields)
    .eq("id", id);
  if (error) console.error("Erro ao atualizar item:", error);
}

/* ===== 12. Atualiza o texto de progresso no card da categoria ===== */
async function atualizarProgressoCategoria(categoria) {
  // Rebusca itens apenas daquela categoria
  const { data: itensCat } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId)
    .eq("categoria", categoria);

  if (!itensCat) return;

  const restantes = itensCat.filter((t) => !t.concluido).length;
  const progressoTexto =
    restantes > 0
      ? `Resta${restantes > 1 ? "m" : ""} ${restantes} tarefa${
          restantes > 1 ? "s" : ""
        } a realizar`
      : "Todas as tarefas concluídas";

  // Atualiza o card daquela categoria
  const cards = categoryCont.querySelectorAll(".category-card");
  cards.forEach((card) => {
    if (card.dataset.categoria === categoria) {
      const p = card.querySelector("p.progress");
      if (p) p.textContent = progressoTexto;
    }
  });

  // Rebusca todas as tarefas para atualizar o resumo geral
  const { data: todosItens } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId);

  if (todosItens) updateResumoTarefas(todosItens);
}

/* ===== 13. Carrega e exibe os detalhes resumidos da festa ===== */
async function loadFestaInfo(f) {
  // f: objeto { id, nome, data_evento, text }
  festaId = f.id;
  dataEventoParam = f.data_evento;

  // 13.2) Dados principais da festa (nome, data, convidados)
  const { data: festaData, error: errFesta } = await supabase
    .from("festas")
    .select("nome, data_evento, convidados")
    .eq("id", festaId)
    .single();
  if (errFesta || !festaData) {
    console.error("Erro ao buscar dados da festa:", errFesta);
    return;
  }

  // 13.3) Preferências da festa
  const { data: prefData, error: errPref } = await supabase
    .from("festa_preferencias")
    .select("duracao_horas, categorias, tipo_evento_id, tipo_prato, bebidas_alcool")
    .eq("festa_id", festaId)
    .single();
  if (errPref) console.error("Erro ao buscar preferências:", errPref);

  // 13.4) Nome do tipo de evento (caso exista)
  let nomeTipoEvento = "-";
  if (prefData?.tipo_evento_id) {
    const { data: tipoEvt, error: errTipo } = await supabase
      .from("tipos_evento")
      .select("nome")
      .eq("id", prefData.tipo_evento_id)
      .single();
    if (!errTipo && tipoEvt) nomeTipoEvento = tipoEvt.nome;
  }

  // 13.5) Formatação de data em PT-BR
  const dataBR = new Date(festaData.data_evento).toLocaleDateString("pt-BR");

  // 13.6) Formatação de categorias: exibimos em linha, separadas por vírgula
  let categoriasTxt = "-";
  if (Array.isArray(prefData?.categorias) && prefData.categorias.length > 0) {
    categoriasTxt = prefData.categorias.join(", ");
  }

  // 13.7) Formatação de prato principal
  let pratoTxt = "-";
  if (prefData?.tipo_prato === "coquetel") pratoTxt = "Coquetel";
  else if (prefData?.tipo_prato === "almoco_jantar") pratoTxt = "Almoço/Jantar";

  // 13.8) Formatação de bebidas
  let bebTxt = "-";
  if (prefData?.bebidas_alcool === true)  bebTxt = "Com álcool";
  else if (prefData?.bebidas_alcool === false) bebTxt = "Sem álcool";

  // 13.9) Monta o HTML do painel de detalhes (com categorias em linha)
  const festaInfoContent = `
    <!-- Resumo de tarefas -->
    <p class="resumo-tarefas">
      <i class="fa-solid fa-list-check"></i>
      <span class="texto-resumo">Calculando tarefas…</span>
    </p>

    <!-- Grid de informações em colunas -->
    <div class="info-grid">
      <div class="info-item">
        <i class="fa-solid fa-calendar-days"></i>
        <span class="label">Data:</span>
        <span class="value">${dataBR}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-clock"></i>
        <span class="label">Duração:</span>
        <span class="value">${prefData?.duracao_horas ? prefData.duracao_horas + "h" : "-"}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-users"></i>
        <span class="label">Convidados:</span>
        <span class="value">${festaData.convidados} convid.</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-cake-candles"></i>
        <span class="label">Evento:</span>
        <span class="value">${nomeTipoEvento}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-tags"></i>
        <span class="label">Categorias:</span>
        <span class="value">${categoriasTxt}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-utensils"></i>
        <span class="label">Prato principal:</span>
        <span class="value">${pratoTxt}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-glass-whiskey"></i>
        <span class="label">Bebidas:</span>
        <span class="value">${bebTxt}</span>
      </div>
    </div>
  `;
  festaInfoDiv.innerHTML = festaInfoContent;

  // 13.10) Busca todas as tarefas para atualizar “Faltam X tarefas…”
  const { data: todosItens } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId);

  if (todosItens) {
    const restantesTotal = todosItens.filter((t) => !t.concluido).length;
    const textoResumo = restantesTotal > 0
      ? `Faltam ${restantesTotal} tarefa${restantesTotal > 1 ? "s" : ""} para concluir`
      : "Todas as tarefas concluídas";

    const resumoSpan = festaInfoDiv.querySelector(".resumo-tarefas .texto-resumo");
    if (resumoSpan) resumoSpan.textContent = textoResumo;
  }
}
