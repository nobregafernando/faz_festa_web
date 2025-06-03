// Checklist.js – FazFestas (v2.3 corrigido • 02 jun 2025)
import supabase               from "../compartilhado/supabaseClient.js";
import { checklistLocal }     from "../compartilhado/checklist/local.js";
import { checklistDecoracao } from "../compartilhado/checklist/decoracao.js";
import { checklistConvites }  from "../compartilhado/checklist/convites.js";

/* ───────────────────── Elementos DOM ───────────────────── */
const headerFestaDiv   = document.getElementById("header-festa");
const festaInfoDiv     = document.getElementById("festa-info");
const categoryCont     = document.getElementById("category-container");
const tasksSection     = document.getElementById("tasks-container");
const tasksHeader      = document.getElementById("tasks-header");
const tasksGrid        = document.getElementById("tasks-grid");
const btnBack          = document.getElementById("btn-back");
const searchFestaInput = document.getElementById("search-festa-input");
const festasDatalist   = document.getElementById("festas-list");

/* ────────────────────── Estado Global ────────────────────── */
let allFestas       = [];
let festaId         = null;
let dataEventoParam = null;
let gruposGlobal    = {};
let currentCategory = null;

/* ───────── Remove overlay/loader (toast.js) ───────── */
function hideLoader() {
  const loader = document.getElementById("loader-overlay");
  if (loader) loader.remove();
}

/* ───────────────── Inicialização ───────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  hideLoader();

  // 1) Verifica sessão Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    window.location.replace("../autenticacao/login.html");
    return;
  }

  // 2) Carrega todas as festas do usuário
  await fetchFestas(session.user.id);

  // 3) Renderiza calendário e preenche lista de busca
  renderCalendar();
  popularDatalistFestas();

  // 4) Sincroniza lista <-> calendário
  searchFestaInput.addEventListener("focus", () => (searchFestaInput.value = ""));
  searchFestaInput.addEventListener("change", () => {
    const txt = searchFestaInput.value.trim();
    if (!txt) return;
    const festSel = allFestas.find(f => f.text === txt);
    if (festSel) {
      selectFesta(festSel);
      marcarDiaNoCalendar(new Date(festSel.data_evento));
    }
  });

  // 5) Estado inicial de visibilidade
  headerFestaDiv.classList.remove("hidden");
  festaInfoDiv.classList.add("hidden");
  categoryCont.classList.add("hidden");
  tasksSection.classList.add("hidden");
});

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 1. Busca todas as festas do usuário                                 ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function fetchFestas(userId) {
  const { data, error } = await supabase
    .from("festas")
    .select("id, nome, data_evento")
    .eq("usuario_id", userId)
    .order("data_evento", { ascending: true });

  if (error) {
    console.error("Erro ao carregar festas:", error);
    return;
  }

  allFestas = data.map(f => ({
    ...f,
    text: `${f.nome} – ${new Date(f.data_evento).toLocaleDateString("pt-BR")}`
  }));
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 2. Preenche o datalist (lista de busca)                             ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
function popularDatalistFestas() {
  festasDatalist.innerHTML = "";
  allFestas.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.text;
    festasDatalist.appendChild(opt);
  });
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 3. Renderiza calendário completo                                     ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
let currentCalendarDate = new Date();

function renderCalendar() {
  const calDiv = document.getElementById("calendar-container");
  if (!calDiv) return;
  calDiv.innerHTML = "";

  const m = currentCalendarDate.getMonth();
  const y = currentCalendarDate.getFullYear();

  // Cabeçalho mês/ano
  calDiv.insertAdjacentHTML(
    "afterbegin",
    `<div class="calendar-header">
       <button id="prev-month"><i class="fa-solid fa-chevron-left"></i></button>
       <span class="month-year">${formatMonthYear(m, y)}</span>
       <button id="next-month"><i class="fa-solid fa-chevron-right"></i></button>
     </div>`
  );

  // Dias da semana
  const dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const row   = document.createElement("div");
  row.className = "calendar-grid";
  dias.forEach(d =>
    row.insertAdjacentHTML("beforeend", `<div class="day-name">${d}</div>`)
  );
  calDiv.appendChild(row);

  // Dias do mês
  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const firstDay = new Date(y, m, 1).getDay();
  const daysIn   = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();

  // Preenche dias do mês anterior (cinza)
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.insertAdjacentHTML("beforeend", `<div class="day inactive">${prevDays - i}</div>`);
  }

  // Preenche dias deste mês
  for (let d = 1; d <= daysIn; d++) {
    const dateObj = new Date(y, m, d);
    const iso     = dateObj.toISOString();
    const hasFesta = allFestas.some(f =>
      new Date(f.data_evento).toDateString() === dateObj.toDateString()
    );
    grid.insertAdjacentHTML("beforeend",
      `<div class="day ${hasFesta ? "festa" : ""}" data-date="${iso}">${d}</div>`
    );
  }

  // Preenche dias do próximo mês (cinza) para completar a grade
  const fills = Math.ceil((firstDay + daysIn) / 7) * 7 - (firstDay + daysIn);
  for (let i = 1; i <= fills; i++) {
    grid.insertAdjacentHTML("beforeend", `<div class="day inactive">${i}</div>`);
  }

  calDiv.appendChild(grid);

  // Navegação: mês anterior e próximo
  calDiv.querySelector("#prev-month").onclick = () => {
    currentCalendarDate.setMonth(m - 1);
    renderCalendar();
  };
  calDiv.querySelector("#next-month").onclick = () => {
    currentCalendarDate.setMonth(m + 1);
    renderCalendar();
  };

  // Clique em dia com festa
  calDiv.querySelectorAll(".day.festa").forEach(el => {
    el.onclick = () => {
      const fest = allFestas.find(f =>
        new Date(f.data_evento).toISOString() === el.dataset.date
      );
      if (fest) {
        selectFesta(fest);
        marcarDiaNoCalendar(new Date(fest.data_evento));
        searchFestaInput.value = fest.text;
      }
    };
  });

  marcarDiaNoCalendar(new Date(dataEventoParam));
}

function formatMonthYear(m, y) {
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${meses[m]} ${y}`;
}

function marcarDiaNoCalendar(dateObj) {
  document.querySelectorAll(".day.selected").forEach(d => d.classList.remove("selected"));
  document.querySelectorAll(".day.festa").forEach(d => {
    if (d.dataset.date === dateObj?.toISOString()) d.classList.add("selected");
  });
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 4. Seleciona (ou recarrega) uma festa                              ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function selectFesta(f) {
  festaId         = f.id;
  dataEventoParam = f.data_evento;

  headerFestaDiv.innerHTML = `<h2 class="festa-title">${f.text}</h2>`;
  festaInfoDiv.classList.remove("hidden");

  await loadFestaInfo(f);
  await showCategories(festaId);
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 5. Gera / carrega categorias Local, Decoração e Convites           ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function showCategories(fid) {
  currentCategory = null;
  tasksSection.classList.add("hidden");
  tasksGrid.innerHTML    = "";
  categoryCont.innerHTML = "";
  categoryCont.classList.remove("hidden");

  const CATS = [
    { nome: "Local",     factory: checklistLocal },
    { nome: "Decoração", factory: checklistDecoracao },
    { nome: "Convites",  factory: checklistConvites }
  ];

  gruposGlobal = {};

  for (const { nome, factory } of CATS) {
    // 5.1) Busca todas as tarefas já gravadas dessa categoria
    let { data: tarefas, error } = await supabase
      .from("checklist_evento")
      .select("*")
      .eq("festa_id", fid)
      .eq("categoria", nome);

    if (error) {
      console.error(`Erro ao buscar ${nome}:`, error);
      tarefas = [];
    }
    console.log(`Categoria ‘${nome}’: tarefas buscadas =`, tarefas.length);

    // 5.2) Se não houver nenhuma, tenta inserir sem colisão
    if (!tarefas?.length) {
      console.log(`– Nenhuma tarefa encontrada para ${nome}. Executando safeInsert...`);
      tarefas = await safeInsert(fid, factory(fid), nome);
      console.log(`– safeInsert retornou ${tarefas.length} tarefas para ${nome}`);
    }

    // 5.3) Re-busca qualquer tarefa criada (para garantir consistência)
    ({ data: tarefas } = await supabase
      .from("checklist_evento")
      .select("*")
      .eq("festa_id", fid)
      .eq("categoria", nome)
    );
    console.log(`– Depois da re-busca, ${tarefas?.length} tarefas restantes em ${nome}`);
    gruposGlobal[nome] = tarefas || [];
  }

  // 5.4) Atualiza o resumo geral “Faltam X tarefas”
  updateResumoTarefas(Object.values(gruposGlobal).flat());

  // 5.5) Cria um card para cada categoria na grade
  CATS.forEach(({ nome }) => {
    const card = buildCategoryCard(nome, gruposGlobal[nome]);
    categoryCont.appendChild(card);
  });
}

/* ───────── Helper: insere tarefas sem colisão de `ordem` ───────── */
async function safeInsert(fid, tarefasInit, nomeCat) {
  let { data, error } = await supabase
    .from("checklist_evento")
    .insert(tarefasInit)
    .select();

  if (!error) return data; // inseriu normalmente

  console.warn(`Colisão de ordem em ${nomeCat}. Renumerando…`);

  // Busca maior ordem existente para essa festa
  const { data: maxRow } = await supabase
    .from("checklist_evento")
    .select("ordem")
    .eq("festa_id", fid)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = (maxRow?.ordem ?? 0) + 1;
  const renum = tarefasInit.map((t, i) => ({ ...t, ordem: base + i }));

  ({ data, error } = await supabase
    .from("checklist_evento")
    .insert(renum)
    .select());

  if (error) {
    console.error(`Falha final ao inserir ${nomeCat}:`, error);
    return [];
  }
  return data;
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 6. Funções auxiliares de texto                                     ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
const normalize = s => s
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim();

const titleCase = s =>
  s.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 7. Atualiza texto “Faltam X tarefas”                                ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
function updateResumoTarefas(todas) {
  const pend = todas.filter(t => !t.concluido).length;
  const txt  = pend
    ? `Faltam ${pend} tarefa${pend > 1 ? "s" : ""} para concluir`
    : "Todas as tarefas concluídas";

  const span = festaInfoDiv.querySelector(".texto-resumo");
  if (span) span.textContent = txt;
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 8. Geração dos “cards” de categoria e tarefas                      ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
function buildCategoryCard(nome, tarefas) {
  const key   = normalize(nome);
  const pend  = tarefas.filter(t => !t.concluido).length;
  const prog  = pend
    ? `Resta${pend > 1 ? "m" : ""} ${pend} tarefa${pend > 1 ? "s" : ""}`
    : "Todas as tarefas concluídas";

  let iconClass = "fa-box-open";
  if (key === "local")     iconClass = "fa-map-location-dot";
  if (key === "decoracao") iconClass = "fa-palette";
  if (key === "convites")  iconClass = "fa-envelope";

  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.categoria = nome;
  card.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <h2>${nome}</h2>
    <p class="progress">${prog}</p>`;

  card.onclick = () => {
    if (currentCategory === nome && !tasksSection.classList.contains("hidden")) {
      // Se já está aberto, fecha a seção de tarefas
      tasksSection.classList.add("hidden");
      categoryCont.classList.remove("hidden");
      tasksGrid.innerHTML = "";
      currentCategory = null;
    } else {
      currentCategory = nome;
      showTasks(nome, tarefas);
    }
  };

  return card;
}

function showTasks(categoria, tarefas) {
  categoryCont.classList.add("hidden");
  tasksSection.classList.remove("hidden");

  tasksHeader.textContent = categoria;
  tasksGrid.innerHTML = "";

  tarefas.forEach(item => tasksGrid.appendChild(buildTaskCard(item)));
}

function buildTaskCard(item) {
  const card = document.createElement("div");
  card.className = "task-card";
  if (item.concluido) card.classList.add("completed");
  card.classList.add(`priority-${normalize(item.prioridade)}`);

  // Checkbox
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = item.concluido;
  chk.onchange = async () => {
    await updateItem(item.id, { concluido: chk.checked });
    card.classList.toggle("completed", chk.checked);
    atualizarProgressoCategoria(item.categoria);
  };
  card.appendChild(chk);

  // Descrição e observação
  const info = document.createElement("div");
  info.className = "task-info";
  info.insertAdjacentHTML("beforeend", `<p class="task-desc">${item.descricao}</p>`);
  if (item.observacao) {
    info.insertAdjacentHTML("beforeend", `<p class="task-note">${item.observacao}</p>`);
  }

  // Ícone + textarea de anotação pessoal
  const noteIcon = document.createElement("i");
  noteIcon.className = "fa-regular fa-note-sticky icon-note";
  const ta = document.createElement("textarea");
  ta.className = "note-edit";
  ta.placeholder = "Digite sua anotação aqui…";
  ta.value = item.mensagem_pessoal || "";
  ta.onblur = () => updateItem(item.id, { mensagem_pessoal: ta.value });
  ta.style.display = "none";

  noteIcon.onclick = () => {
    ta.style.display = ta.style.display === "none" ? "block" : "none";
    if (ta.style.display === "block") ta.focus();
  };

  info.appendChild(noteIcon);
  info.appendChild(ta);
  card.appendChild(info);

  // Ocultar tarefas antes de X dias (se configurado)
  if (item.ocultar_antes && dataEventoParam) {
    const ev = new Date(dataEventoParam);
    ev.setDate(ev.getDate() - (item.dias_antes_evento || 0));
    if (Date.now() < ev.getTime()) card.style.display = "none";
  }

  return card;
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 9. Botão “Voltar às Categorias”, updateItem e progresso             ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
btnBack.onclick = () => {
  tasksSection.classList.add("hidden");
  categoryCont.classList.remove("hidden");
  tasksGrid.innerHTML = "";
  currentCategory = null;
};

async function updateItem(id, fields) {
  const { error } = await supabase
    .from("checklist_evento")
    .update(fields)
    .eq("id", id);
  if (error) console.error("Erro ao atualizar item:", error);
}

async function atualizarProgressoCategoria(cat) {
  const { data } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId)
    .eq("categoria", cat);

  const pend = data.filter(t => !t.concluido).length;
  const prog = pend
    ? `Resta${pend > 1 ? "m" : ""} ${pend} tarefa${pend > 1 ? "s" : ""}`
    : "Todas as tarefas concluídas";

  document.querySelectorAll(".category-card").forEach(card => {
    if (card.dataset.categoria === cat) {
      card.querySelector(".progress").textContent = prog;
    }
  });

  const { data: all } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId);
  if (all) updateResumoTarefas(all);
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 10. Carrega detalhes resumidos da festa                             ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function loadFestaInfo(f) {
  festaId         = f.id;
  dataEventoParam = f.data_evento;

  const { data: festa, error: errFesta } = await supabase
    .from("festas")
    .select("nome,data_evento,convidados")
    .eq("id", festaId)
    .single();
  if (errFesta || !festa) {
    console.error("Erro ao carregar dados da festa:", errFesta);
    return;
  }

  const { data: pref } = await supabase
    .from("festa_preferencias")
    .select("duracao_horas,categorias,tipo_evento_id,tipo_prato,bebidas_alcool")
    .eq("festa_id", festaId)
    .single();

  let tipoNome = "-";
  if (pref?.tipo_evento_id) {
    const { data: tipoEvt } = await supabase
      .from("tipos_evento")
      .select("nome")
      .eq("id", pref.tipo_evento_id)
      .single();
    if (tipoEvt) tipoNome = tipoEvt.nome;
  }

  const dataBR  = new Date(festa.data_evento).toLocaleDateString("pt-BR");
  const catsTxt = Array.isArray(pref?.categorias) && pref.categorias.length
    ? pref.categorias.join(", ")
    : "-";
  const pratoTxt = pref?.tipo_prato === "coquetel"
    ? "Coquetel"
    : pref?.tipo_prato === "almoco_jantar"
    ? "Almoço/Jantar"
    : "-";
  const bebTxt   = pref?.bebidas_alcool === true
    ? "Com álcool"
    : pref?.bebidas_alcool === false
    ? "Sem álcool"
    : "-";

  festaInfoDiv.innerHTML = `
    <p class="resumo-tarefas">
      <i class="fa-solid fa-list-check"></i>
      <span class="texto-resumo">Calculando tarefas…</span>
    </p>
    <div class="info-grid">
      <div class="info-item"><i class="fa-solid fa-calendar-days"></i><span class="label">Data:</span><span class="value">${dataBR}</span></div>
      <div class="info-item"><i class="fa-solid fa-clock"></i><span class="label">Duração:</span><span class="value">${pref?.duracao_horas ? pref.duracao_horas + "h" : "-"}</span></div>
      <div class="info-item"><i class="fa-solid fa-users"></i><span class="label">Convidados:</span><span class="value">${festa.convidados}</span></div>
      <div class="info-item"><i class="fa-solid fa-cake-candles"></i><span class="label">Evento:</span><span class="value">${tipoNome}</span></div>
      <div class="info-item"><i class="fa-solid fa-tags"></i><span class="label">Categorias:</span><span class="value">${catsTxt}</span></div>
      <div class="info-item"><i class="fa-solid fa-utensils"></i><span class="label">Prato:</span><span class="value">${pratoTxt}</span></div>
      <div class="info-item"><i class="fa-solid fa-glass-whiskey"></i><span class="label">Bebidas:</span><span class="value">${bebTxt}</span></div>
    </div>`;

  const { data: all } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId);
  if (all) updateResumoTarefas(all);
}

/* ===================================================================== *
 *  Fim do Checklist.js                                                  *
 * ===================================================================== */
