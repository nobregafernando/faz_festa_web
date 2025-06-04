/* ===================================================================== *
 *  Checklist.js – FazFestas (v4.2 • 05 jun 2025) – Versão com Convites  *
 *  e Mídia adicionados                                                  *
 *  
 *  - Carrega categorias dinamicamente via import() de módulos JS
 *  - Remove campo "cor", compatibilizando com o esquema atual do BD
 *  - Novas categorias: Convites e Mídia
 * ===================================================================== */

import supabase from "../compartilhado/supabaseClient.js";

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

/* ───────────────────── Estado Global ───────────────────── */
let allFestas       = [];  // { id, nome, data_evento, text, dateSimple }
let festaId         = null;
let dataEventoParam = null; // string ISO completa
let gruposGlobal    = {};
let currentCategory = null;

/* ─────────────────── Configuração de Categorias ───────────────────
 * Cada objeto nesta lista indica:
 *  - nome: nome exato da categoria (como será gravado no BD)
 *  - module: caminho relativo ao arquivo que exporta a factory
 *            Exemplo: "local.js" => export const checklistLocal = festaId => [...]
 * Para adicionar futura categoria, basta criar arquivo em
 * public/compartilhado/checklist e adicionar aqui:
 *
 *  { nome: "Novo Tema", module: "novoTema.js" }
 *
 * As novas categorias "Convites" e "Mídia" foram adicionadas:
 *  - public/compartilhado/checklist/convites.js
 *  - public/compartilhado/checklist/midia.js
 * ==================================================================== */
const categoryConfigs = [
  { nome: "Local",     module: "local.js" },
  { nome: "Decoração", module: "decoracao.js" },
  { nome: "Convites",  module: "convites.js" },
  { nome: "Mídia",     module: "midia.js" }
];

/* ───────── Remove overlay/loader (toast.js) se existente ───────── */
function hideLoader() {
  const loader = document.getElementById("loader-overlay");
  if (loader) loader.remove();
}

/* ─────────────────── Inicialização da página ─────────────────── */
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

  // 3) Renderiza calendário e lista de busca
  renderCalendar();
  popularDatalistFestas();

  // 4) Sincroniza campo de busca: ao focar limpa; ao mudar, seleciona festa
  searchFestaInput.addEventListener("focus", () => {
    searchFestaInput.value = "";
  });
  searchFestaInput.addEventListener("change", () => {
    const txt = searchFestaInput.value.trim();
    if (!txt) return;
    const festSel = allFestas.find(f => f.text === txt);
    if (festSel) {
      selectFesta(festSel);
      marcarDiaNoCalendar(festSel.dateSimple);
    }
  });

  // 5) Visibilidade inicial
  headerFestaDiv.classList.remove("hidden");
  festaInfoDiv.classList.add("hidden");
  categoryCont.classList.add("hidden");
  tasksSection.classList.add("hidden");
});

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 1) Busca todas as festas do usuário                                ║
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

  // mapeia e adiciona “dateSimple” (YYYY-MM-DD) para cada festa
  allFestas = data.map(f => {
    const iso = new Date(f.data_evento).toISOString();
    const simple = iso.split("T")[0];
    return {
      id: f.id,
      nome: f.nome,
      data_evento: f.data_evento,
      text: `${f.nome} – ${new Date(f.data_evento).toLocaleDateString("pt-BR")}`,
      dateSimple: simple
    };
  });
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 2) Preenche o datalist (lista de busca)                             ║
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
   ║ 3) Renderiza calendário completo                                     ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
let currentCalendarDate = new Date();

function renderCalendar() {
  const calDiv = document.getElementById("calendar-container");
  if (!calDiv) return;
  calDiv.innerHTML = "";

  const m = currentCalendarDate.getMonth();
  const y = currentCalendarDate.getFullYear();

  // ▸ Cabeçalho (mês e botões)
  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <button id="prev-month"><i class="fa-solid fa-chevron-left"></i></button>
    <span class="month-year">${formatMonthYear(m, y)}</span>
    <button id="next-month"><i class="fa-solid fa-chevron-right"></i></button>
  `;
  calDiv.appendChild(header);

  // ▸ Nomes dos dias da semana
  const diasNome = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const rowDias = document.createElement("div");
  rowDias.className = "calendar-grid";
  diasNome.forEach(d => {
    const dn = document.createElement("div");
    dn.className = "day-name";
    dn.textContent = d;
    rowDias.appendChild(dn);
  });
  calDiv.appendChild(rowDias);

  // ▸ Grid de dias
  const gridDias = document.createElement("div");
  gridDias.className = "calendar-grid";

  const firstDay    = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();

  // 3.1) Preenche dias finais do mês anterior (inativos)
  for (let i = firstDay - 1; i >= 0; i--) {
    const div = document.createElement("div");
    div.className = "day inactive";
    div.textContent = prevMonthDays - i;
    gridDias.appendChild(div);
  }

  // 3.2) Cria cada dia deste mês
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj   = new Date(y, m, d);
    const isoFull   = dateObj.toISOString();
    const dateSimple = isoFull.split("T")[0];

    const div = document.createElement("div");
    div.textContent = d;
    // verifica se há festa nesta data (compara dateSimple)
    const hasFesta = allFestas.some(f => f.dateSimple === dateSimple);
    if (hasFesta) {
      div.className = "day festa";
      div.dataset.dateSimple = dateSimple;
      // listener direto no elemento
      div.addEventListener("click", () => {
        const fest = allFestas.find(f => f.dateSimple === dateSimple);
        if (fest) {
          selectFesta(fest);
          marcarDiaNoCalendar(dateSimple);
          searchFestaInput.value = fest.text;
        }
      });
    } else {
      div.className = "day inactive";
    }
    gridDias.appendChild(div);
  }

  // 3.3) Preenche dias iniciais do próximo mês (inativos) até completar a grade
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const nextFill = totalCells - (firstDay + daysInMonth);
  for (let i = 1; i <= nextFill; i++) {
    const div = document.createElement("div");
    div.className = "day inactive";
    div.textContent = i;
    gridDias.appendChild(div);
  }

  calDiv.appendChild(gridDias);

  // ▸ Botões de navegação de mês
  header.querySelector("#prev-month").onclick = () => {
    currentCalendarDate.setMonth(m - 1);
    renderCalendar();
  };
  header.querySelector("#next-month").onclick = () => {
    currentCalendarDate.setMonth(m + 1);
    renderCalendar();
  };

  // ▸ Marca dia selecionado, se houver
  marcarDiaNoCalendar(dataEventoParam ? dataEventoParam.split("T")[0] : null);
}

function formatMonthYear(m, y) {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];
  return `${meses[m]} ${y}`;
}

function marcarDiaNoCalendar(simpleDate) {
  // remove destaque de qualquer .day.selected anterior
  document.querySelectorAll("#calendar-container .day.selected").forEach(el => {
    el.classList.remove("selected");
  });
  if (!simpleDate) return;
  // encontra o dia.festa com data igual e adiciona .selected
  document.querySelectorAll("#calendar-container .day.festa").forEach(el => {
    if (el.dataset.dateSimple === simpleDate) {
      el.classList.add("selected");
    }
  });
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 4) Quando o usuário seleciona uma festa                           ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function selectFesta(f) {
  festaId         = f.id;
  dataEventoParam = f.data_evento; // ISO completa

  // ▸ Atualiza header (título da festa)
  headerFestaDiv.innerHTML = `<h2 class="festa-title">${f.text}</h2>`;
  festaInfoDiv.classList.remove("hidden");

  // ▸ Carrega detalhes + resumo
  await loadFestaInfo(f);

  // ▸ Garante que todas as categorias configuradas existam no BD
  await ensureCategories(festaId);

  // ▸ Busca e renderiza todos os itens agrupados por categoria
  await fetchAndRenderChecklist(festaId);
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 5) Garante que todas as categorias definidas existam no BD         ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function ensureCategories(fid) {
  // Busca categorias existentes já criadas para esta festa
  const { data: existentes, error: errExist } = await supabase
    .from("checklist_evento")
    .select("categoria")
    .eq("festa_id", fid);

  if (errExist) {
    console.error("Erro ao buscar categorias existentes:", errExist);
    return;
  }

  const existentesSet = new Set(
    (existentes || []).map(item => item.categoria.trim().toLowerCase())
  );

  // Para cada configuração de categoria, se não existir, importa o módulo e insere
  for (const { nome, module } of categoryConfigs) {
    const chaveNorm = nome.trim().toLowerCase();
    if (!existentesSet.has(chaveNorm)) {
      try {
        // Carrega dinamicamente o módulo (ex.: "../compartilhado/checklist/local.js")
        const módulo = await import(`../compartilhado/checklist/${module}`);
        // Deriva o nome da factory: ex: "local.js" → "checklistLocal"
        const factoryName = Object.keys(módulo).find(k =>
          k.toLowerCase().includes("checklist")
        );
        if (factoryName && typeof módulo[factoryName] === "function") {
          const tarefas = módulo[factoryName](fid);
          const { error: errInsert } = await supabase
            .from("checklist_evento")
            .insert(tarefas);
          if (errInsert) {
            console.error(`Erro ao inserir categoria ${nome}:`, errInsert);
          }
        } else {
          console.warn(`Factory não encontrada em módulo ${module}`);
        }
      } catch (errImport) {
        console.error(`Falha ao importar módulo ${module}:`, errImport);
      }
    }
  }
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 6) Busca e renderiza todos os itens agrupados por categoria        ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function fetchAndRenderChecklist(fid) {
  const { data: itens, error: errItens } = await supabase
    .from("checklist_evento")
    .select("*")
    .eq("festa_id", fid)
    .order("categoria", { ascending: true })
    .order("ordem", { ascending: true });

  if (errItens) {
    console.error("Erro ao buscar itens do checklist:", errItens);
    categoryCont.innerHTML = "<p>Erro ao carregar tarefas.</p>";
    return;
  }

  if (!itens || itens.length === 0) {
    categoryCont.innerHTML = "<p>Este checklist não possui tarefas cadastradas.</p>";
    return;
  }

  // Agrupa itens por categoria em um objeto { categoria: [itens...] }
  gruposGlobal = {};
  itens.forEach(item => {
    const cat = item.categoria.trim();
    if (!gruposGlobal[cat]) {
      gruposGlobal[cat] = [];
    }
    gruposGlobal[cat].push(item);
  });

  updateResumoTarefas(itens);

  // Limpa container de categorias e adiciona um card para cada grupo
  categoryCont.innerHTML = "";
  Object.entries(gruposGlobal).forEach(([categoria, tarefas]) => {
    const card = buildCategoryCard(categoria, tarefas);
    categoryCont.appendChild(card);
  });

  categoryCont.classList.remove("hidden");
  tasksSection.classList.add("hidden");
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 7) Normalização de texto                                           ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 8) Atualiza texto “Faltam X tarefas”                                ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
function updateResumoTarefas(allItems) {
  const restantes = allItems.filter(t => !t.concluido).length;
  const texto = restantes
    ? `Faltam ${restantes} tarefa${restantes > 1 ? "s" : ""} para concluir`
    : "Todas as tarefas concluídas";

  const span = festaInfoDiv.querySelector(".texto-resumo");
  if (span) {
    span.textContent = texto;
  }
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 9) Cria card de categoria na tela                                   ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
function buildCategoryCard(nome, tarefas) {
  const keyLower = normalize(nome);
  const pendentes = tarefas.filter(t => !t.concluido).length;
  const progresso = pendentes
    ? `Resta${pendentes > 1 ? "m" : ""} ${pendentes} tarefa${pendentes > 1 ? "s" : ""}`
    : "Todas as tarefas concluídas";

  // Escolhe ícone baseado no nome (pode expandir o mapeamento aqui)
  let iconClass = "fa-box-open";
  if (keyLower === "local") {
    iconClass = "fa-map-location-dot";
  } else if (keyLower === "decoração" || keyLower === "decoracao") {
    iconClass = "fa-palette";
  } else if (keyLower === "convites") {
    iconClass = "fa-envelope-open-text";
  } else if (keyLower === "mídia" || keyLower === "midia") {
    iconClass = "fa-photo-video";
  }

  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.categoria = nome;
  card.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <h2>${nome}</h2>
    <p class="progress">${progresso}</p>
  `;

  card.addEventListener("click", () => {
    // Remove todos os destaques anteriores
    document.querySelectorAll(".category-card.selected").forEach(c => {
      c.classList.remove("selected");
    });

    if (currentCategory === nome && !tasksSection.classList.contains("hidden")) {
      // Se já aberto, fecha e limpa título inferior
      tasksSection.classList.add("hidden");
      categoryCont.classList.remove("hidden");
      tasksGrid.innerHTML = "";
      tasksHeader.textContent = "";   // limpa título da seção de tarefas
      currentCategory = null;
      card.classList.remove("selected");
    } else {
      // Destaca este card e mostra tarefas
      card.classList.add("selected");
      currentCategory = nome;
      showTasks(nome, gruposGlobal[nome]);
    }
  });

  return card;
}

function showTasks(categoria, tarefas) {
  categoryCont.classList.add("hidden");
  tasksSection.classList.remove("hidden");

  tasksHeader.textContent = categoria;
  tasksGrid.innerHTML = "";

  tarefas.forEach(item => {
    const taskCard = buildTaskCard(item);
    tasksGrid.appendChild(taskCard);
  });
}

function buildTaskCard(item) {
  const card = document.createElement("div");
  card.className = "task-card";
  if (item.concluido) {
    card.classList.add("completed");
  }
  card.classList.add(`priority-${normalize(item.prioridade)}`);

  // ► Checkbox
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = item.concluido;
  chk.addEventListener("change", async () => {
    await updateItem(item.id, { concluido: chk.checked });
    card.classList.toggle("completed", chk.checked);
    atualizarProgressoCategoria(item.categoria);
  });
  card.appendChild(chk);

  // ► Descrição e observação
  const infoDiv = document.createElement("div");
  infoDiv.className = "task-info";
  infoDiv.insertAdjacentHTML("beforeend", `<p class="task-desc">${item.descricao}</p>`);
  if (item.observacao) {
    infoDiv.insertAdjacentHTML("beforeend", `<p class="task-note">${item.observacao}</p>`);
  }

  // ► Ícone de anotação + textarea oculto
  const noteIcon = document.createElement("i");
  noteIcon.className = "fa-regular fa-note-sticky icon-note";
  noteIcon.title = "Adicionar anotação";

  const ta = document.createElement("textarea");
  ta.className = "note-edit";
  ta.placeholder = "Digite sua anotação aqui…";
  ta.value = item.mensagem_pessoal || "";
  ta.addEventListener("blur", () => {
    updateItem(item.id, { mensagem_pessoal: ta.value });
  });
  ta.style.display = "none";

  noteIcon.addEventListener("click", () => {
    ta.style.display = ta.style.display === "none" ? "block" : "none";
    if (ta.style.display === "block") {
      ta.focus();
    }
  });

  infoDiv.appendChild(noteIcon);
  infoDiv.appendChild(ta);
  card.appendChild(infoDiv);

  // ► Se item.ocultar_antes = true e dataEventoParam, esconde antes da data
  if (item.ocultar_antes && dataEventoParam) {
    const ev = new Date(dataEventoParam);
    ev.setDate(ev.getDate() - (item.dias_antes_evento || 0));
    if (Date.now() < ev.getTime()) {
      card.style.display = "none";
    }
  }

  return card;
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 10) Botão “Voltar às Categorias”, updateItem e progresso           ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
btnBack.addEventListener("click", () => {
  // Limpa todos os destaques de cards de categoria
  document.querySelectorAll(".category-card.selected").forEach(c => {
    c.classList.remove("selected");
  });

  tasksSection.classList.add("hidden");
  categoryCont.classList.remove("hidden");
  tasksGrid.innerHTML = "";
  tasksHeader.textContent = "";  // limpa título que ficava exibido
  currentCategory = null;
});

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
      const p = card.querySelector(".progress");
      if (p) p.textContent = prog;
    }
  });

  const { data: allItens } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId);
  if (allItens) updateResumoTarefas(allItens);
}

/* ╔═══════════════════════════════════════════════════════════════════╗
   ║ 11) Carrega detalhes resumidos da festa                             ║
   ╚═══════════════════════════════════════════════════════════════════╝ */
async function loadFestaInfo(f) {
  festaId         = f.id;
  dataEventoParam = f.data_evento; // ISO completa

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

  let nomeTipo = "-";
  if (pref?.tipo_evento_id) {
    const { data: tipoEvt } = await supabase
      .from("tipos_evento")
      .select("nome")
      .eq("id", pref.tipo_evento_id)
      .single();
    if (tipoEvt) nomeTipo = tipoEvt.nome;
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
      <div class="info-item">
        <i class="fa-solid fa-calendar-days"></i>
        <span class="label">Data:</span>
        <span class="value">${dataBR}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-clock"></i>
        <span class="label">Duração:</span>
        <span class="value">${pref?.duracao_horas ? pref.duracao_horas + "h" : "-"}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-users"></i>
        <span class="label">Convidados:</span>
        <span class="value">${festa.convidados}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-cake-candles"></i>
        <span class="label">Evento:</span>
        <span class="value">${nomeTipo}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-tags"></i>
        <span class="label">Categorias:</span>
        <span class="value">${catsTxt}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-utensils"></i>
        <span class="label">Prato:</span>
        <span class="value">${pratoTxt}</span>
      </div>
      <div class="info-item">
        <i class="fa-solid fa-glass-whiskey"></i>
        <span class="label">Bebidas:</span>
        <span class="value">${bebTxt}</span>
      </div>
    </div>`;

  const { data: allItens } = await supabase
    .from("checklist_evento")
    .select("concluido")
    .eq("festa_id", festaId);
  if (allItens) updateResumoTarefas(allItens);
}

/* ===================================================================== *
 *  Fim de Checklist.js                                                  *
 * ===================================================================== */
