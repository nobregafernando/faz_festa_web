/* ===================================================================== *
 *  checklist.js • FazFestas v5.4                                         *
 *  – Ordem fixa dos 4 cards (Local, Decoração, Convites, Mídia)          *
 *  – “Faltam X tarefas…” volta a atualizar em tempo real                 *
 *  – Sanitiza colunas desconhecidas, onConflict e autolimpeza            *
 * ===================================================================== */

import supabase from "../compartilhado/supabaseClient.js";

/* ───────────────────── Elementos DOM ───────────────────── */
const els = {
  headerFesta : document.getElementById("header-festa"),
  festaInfo   : document.getElementById("festa-info"),
  categoryCont: document.getElementById("category-container"),
  tasksSection: document.getElementById("tasks-container"),
  tasksHeader : document.getElementById("tasks-header"),
  tasksGrid   : document.getElementById("tasks-grid"),
  btnBack     : document.getElementById("btn-back"),
  searchInput : document.getElementById("search-festa-input"),
  festasList  : document.getElementById("festas-list"),
  conviteCont : document.getElementById("montar-convite-container"),
};

/* ───────────────────── Estado Global ───────────────────── */
let festasCache     = [];
let gruposGlobal    = {};
let festaId         = null;
let dataEventoISO   = null;
let currentCategory = null;
let fetchAborter    = new AbortController();

/* ───────── Configurações das categorias ───────── */
const categoryConfigs = [
  { nome: "Local",     module: "local.js",     icon:"fa-map-location-dot" },
  { nome: "Decoração", module: "decoracao.js", icon:"fa-palette"          },
  { nome: "Convites",  module: "convites.js",  icon:"fa-envelope-open-text"},
  { nome: "Mídia",     module: "midia.js",     icon:"fa-photo-video"      },
];

/* Campos realmente existentes em checklist_evento  */
const allowedCols = [
  "festa_id","categoria","descricao","observacao","prioridade",
  "dias_antes_evento","ocultar_antes","mensagem_pessoal",
  "tipo_execucao","url_acao","ordem","concluido"
];

/* ─────────────────── Utilidades ─────────────────── */
const normalize = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
const parseDateOnly = src => {
  const [y,m,d]=(typeof src==="string"?src:src.toISOString()).split("T")[0].split("-").map(Number);
  return new Date(y,m-1,d);
};

/* ─────────────── Banner de erro ─────────────── */
function showError(msg){
  document.querySelectorAll(".banner-erro").forEach(b=>b.remove());
  const div=document.createElement("div");
  div.className="banner-erro";
  div.innerHTML=`<i class="fa-solid fa-circle-exclamation"></i><span>${msg}</span>`;
  Object.assign(div.style,{
    background:"#e53e3e",color:"#fff",padding:"0.75rem 1rem",margin:"0.5rem 0",
    borderRadius:"0.5rem",display:"flex",alignItems:"center",gap:"0.5rem",
    fontWeight:"600",boxShadow:"0 3px 8px rgba(0,0,0,.15)",
  });
  els.headerFesta.after(div); setTimeout(()=>div.remove(),10000);
}
const hideLoader=()=>document.getElementById("loader-overlay")?.remove();

/* ╔══ Resumo global de tarefas ══════════════════════════════╗ */
function updateResumoTarefas(allItems){
  const pend=allItems.filter(t=>!t.concluido).length;
  const span=els.festaInfo.querySelector(".texto-resumo");
  if(span){
    span.textContent = pend
      ? `Faltam ${pend} tarefa${pend>1?"s":""}`
      : "Todas as tarefas concluídas";
  }
}

/* ╔══ 1) Carrega festas ══════════════════════════════╗ */
async function fetchFestas(userId){
  if(festasCache.length) return;
  const {data,error}=await supabase.from("festas")
    .select("id,nome,data_evento")
    .eq("usuario_id",userId)
    .order("data_evento");
  if(error){showError("Falha ao buscar festas.");console.error(error);return;}
  festasCache=data.map(f=>{
    const dt=parseDateOnly(f.data_evento);
    return{...f,dateSimple:dt.toISOString().split("T")[0],
      text:`${f.nome} – ${dt.toLocaleDateString("pt-BR")}`};
  });
}

/* ╔══ 2) Datalist + Calendário ═══════════════════════╗ */
function popularDatalist(){
  els.festasList.replaceChildren(...festasCache.map(f=>Object.assign(document.createElement("option"),{value:f.text})));
}
let calendarRefDate=new Date();
function renderCalendar(){
  const cal=document.getElementById("calendar-container"); if(!cal) return;
  cal.innerHTML="";
  const m=calendarRefDate.getMonth(),y=calendarRefDate.getFullYear();
  const header=document.createElement("div");
  header.className="calendar-header";
  header.innerHTML=`<button id="prev"><i class="fa-solid fa-chevron-left"></i></button>
    <span class="month-year">${["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][m]} ${y}</span>
    <button id="next"><i class="fa-solid fa-chevron-right"></i></button>`;
  cal.appendChild(header);

  const grid=document.createElement("div");grid.className="calendar-grid";
  ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].forEach(dn=>{
    const e=document.createElement("div");e.className="day-name";e.textContent=dn;grid.appendChild(e);
  });

  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),prevLast=new Date(y,m,0).getDate();
  for(let i=first-1;i>=0;i--){grid.appendChild(nDay(prevLast-i,"inactive"));}
  for(let d=1;d<=days;d++){
    const dateObj=new Date(y,m,d),simple=parseDateOnly(dateObj).toISOString().split("T")[0];
    const cell=nDay(d,"");
    const festa=festasCache.find(f=>f.dateSimple===simple);
    if(festa){
      cell.classList.add("festa");cell.dataset.simple=simple;
      cell.onclick=()=>{selectFesta(festa);markSelected(simple);els.searchInput.value=festa.text;};
    }else cell.classList.add("inactive");
    grid.appendChild(cell);
  }
  const total=Math.ceil((first+days)/7)*7,nextFill=total-(first+days);
  for(let i=1;i<=nextFill;i++){grid.appendChild(nDay(i,"inactive"));}

  cal.appendChild(grid);
  header.querySelector("#prev").onclick=()=>{calendarRefDate.setMonth(m-1);renderCalendar();};
  header.querySelector("#next").onclick=()=>{calendarRefDate.setMonth(m+1);renderCalendar();};
  markSelected(dataEventoISO?dataEventoISO.split("T")[0]:null);

  function nDay(txt,cls){const d=document.createElement("div");d.textContent=txt;d.className=`day ${cls}`;return d;}
}
const markSelected=simple=>{
  document.querySelectorAll("#calendar-container .day.selected").forEach(el=>el.classList.remove("selected"));
  if(!simple) return;
  document.querySelector(`#calendar-container .day.festa[data-simple="${simple}"]`)?.classList.add("selected");
};

/* ╔══ 3) Seleciona festa ═══════════════════════════════════╗ */
async function selectFesta(f){
  festaId=f.id;dataEventoISO=f.data_evento;
  els.headerFesta.innerHTML=`<h2 class="festa-title">${f.text}</h2>`;
  els.festaInfo.classList.remove("hidden");
  await loadFestaInfo();
  await ensureCategories();
  await fetchAndRenderChecklist();
}

/* ╔══ 4) Garante categorias (sanitiza campos) ═══════════════╗ */
async function ensureCategories(){
  const {data:exist,error}=await supabase.from("checklist_evento")
    .select("categoria").eq("festa_id",festaId);
  if(error){showError("Erro ao validar categorias.");console.error(error);return;}
  const existSet=new Set(exist.map(c=>normalize(c.categoria)));

  const results=await Promise.allSettled(categoryConfigs.map(async({nome,module})=>{
    if(existSet.has(normalize(nome))) return "ok";

    try{
      await supabase.from("checklist_evento") // limpa resíduos nulos
        .delete().eq("festa_id",festaId).eq("categoria",nome).is("descricao",null);

      const mod=await import(`../compartilhado/checklist/${module}`);
      const factory=Object.values(mod).find(fn=>typeof fn==="function");
      if(!factory) throw new Error("Factory não encontrada no módulo "+module);

      const tarefas=factory(festaId).map(t=>Object.fromEntries(
        Object.entries(t).filter(([k])=>allowedCols.includes(k))
      ));

      const {error:insErr}=await supabase.from("checklist_evento").insert(
        tarefas,{ignoreDuplicates:true,onConflict:"festa_id,categoria,ordem"}
      );
      if(insErr) throw insErr;
      return "inserido";
    }catch(e){
      console.error(`Falha em ${nome}:`,e);
      return {erro:e};
    }
  }));

  results.forEach((r,idx)=>{
    if(r.status==="rejected"||r.value?.erro){
      showError(`Categoria “${categoryConfigs[idx].nome}” não pôde ser criada: ${r.value?.erro?.message||r.reason?.message||"Erro desconhecido"}`);
    }
  });
}

/* ╔══ 5) Busca checklist + render ═══════════════════════════╗ */
async function fetchAndRenderChecklist(){
  fetchAborter.abort();fetchAborter=new AbortController();
  const {data,error}=await supabase.from("checklist_evento")
    .select("*").eq("festa_id",festaId)
    .order("categoria").order("ordem")
    .abortSignal(fetchAborter.signal);
  if(error){showError("Erro ao carregar tarefas.");console.error(error);return;}

  /* Atualiza resumo global aqui */
  updateResumoTarefas(data);

  gruposGlobal={};data.forEach(i=>(gruposGlobal[i.categoria]??=[]).push(i));
  categoryConfigs.forEach(({nome})=>gruposGlobal[nome]??=[]);
  renderCategoryCards();
}

/* ───────── Cards de categoria (ordem fixa) ───────── */
function renderCategoryCards(){
  els.categoryCont.innerHTML="";
  categoryConfigs.forEach(({nome,icon})=>{
    els.categoryCont.appendChild(buildCategoryCard(
      nome,gruposGlobal[nome]||[],icon
    ));
  });
  els.categoryCont.classList.remove("hidden");
  els.tasksSection.classList.add("hidden");
}
function buildCategoryCard(nome,tarefas,icon){
  const pend=tarefas.filter(t=>!t.concluido).length;
  const prog=pend?`Restam ${pend} tarefa${pend>1?"s":""}`:"Todas concluídas";
  const card=document.createElement("div");
  card.className="category-card";card.dataset.categoria=nome;
  card.innerHTML=`<i class="fa-solid ${icon}"></i><h2>${nome}</h2><p class="progress">${prog}</p>`;
  card.onclick=()=>{
    if(currentCategory===nome&&!els.tasksSection.classList.contains("hidden")){els.btnBack.click();return;}
    document.querySelectorAll(".category-card.selected").forEach(c=>c.classList.remove("selected"));
    card.classList.add("selected");currentCategory=nome;showTasks(nome);
  };
  return card;
}

/* ───────── Tarefas de categoria ───────── */
function showTasks(cat){
  els.categoryCont.classList.add("hidden");
  els.tasksSection.classList.remove("hidden");
  els.tasksHeader.textContent=cat;
  els.tasksGrid.innerHTML="";els.conviteCont.innerHTML="";
  if(normalize(cat)==="convites"){
    const b=document.createElement("button");
    b.className="btn-montar-convite";b.textContent="Montar Convite";
    b.onclick=()=>window.location.href=`convites.html?festaId=${festaId}`;els.conviteCont.appendChild(b);
  }
  gruposGlobal[cat].forEach(t=>els.tasksGrid.appendChild(buildTaskCard(t)));
}
function buildTaskCard(item){
  const card=document.createElement("div");
  card.className=`task-card${item.concluido?" completed":""} priority-${normalize(item.prioridade)}`;
  const chk=Object.assign(document.createElement("input"),{type:"checkbox",checked:item.concluido});
  chk.onchange=async()=>{await updateItem(item.id,{concluido:chk.checked});card.classList.toggle("completed",chk.checked);refreshCategoryProgress(item.categoria);};
  card.appendChild(chk);

  const info=document.createElement("div");info.className="task-info";
  info.insertAdjacentHTML("beforeend",`<p class="task-desc">${item.descricao}</p>${item.observacao?`<p class="task-note">${item.observacao}</p>`:""}`);
  const icon=document.createElement("i");icon.className="fa-regular fa-note-sticky icon-note";
  const ta=document.createElement("textarea");ta.className="note-edit";ta.placeholder="Digite sua anotação…";ta.value=item.mensagem_pessoal||"";ta.style.display="none";
  ta.onblur=()=>updateItem(item.id,{mensagem_pessoal:ta.value});
  icon.onclick=()=>{ta.style.display=ta.style.display==="none"?"block":"none";ta.style.display==="block"&&ta.focus();};
  info.appendChild(icon);info.appendChild(ta);card.appendChild(info);

  if(item.ocultar_antes&&dataEventoISO){
    const lim=parseDateOnly(dataEventoISO);lim.setDate(lim.getDate()-(item.dias_antes_evento||0));
    if(Date.now()<lim.getTime()) card.style.display="none";
  }
  return card;
}

/* ───── Atualizações simples ───── */
async function updateItem(id,fields){
  const {error}=await supabase.from("checklist_evento").update(fields).eq("id",id);
  if(error){showError("Erro ao atualizar tarefa.");console.error(error);}
}
async function refreshCategoryProgress(cat){
  const {data}=await supabase.from("checklist_evento")
    .select("concluido").eq("festa_id",festaId).eq("categoria",cat);
  const pend=(data||[]).filter(t=>!t.concluido).length;
  document.querySelectorAll(`.category-card[data-categoria="${cat}"] .progress`)
    .forEach(p=>p.textContent=pend?`Restam ${pend} tarefa${pend>1?"s":""}`:"Todas concluídas");

  /* Atualiza também o resumo global */
  const {data:all}=await supabase.from("checklist_evento")
    .select("concluido").eq("festa_id",festaId);
  updateResumoTarefas(all||[]);
}

/* ╔══ 8) Infos rápidas da festa ═══════════════════════════════╗ */
async function loadFestaInfo(){
  const {data:festa}=await supabase.from("festas")
    .select("nome,data_evento,convidados").eq("id",festaId).single();
  const {data:pref}=await supabase.from("festa_preferencias")
    .select("duracao_horas,categorias,tipo_prato,bebidas_alcool")
    .eq("festa_id",festaId).single();
  const dataBR=parseDateOnly(festa.data_evento).toLocaleDateString("pt-BR");
  els.festaInfo.innerHTML=`<p class="resumo-tarefas"><i class="fa-solid fa-list-check"></i><span class="texto-resumo">Carregando...</span></p>
  <div class="info-grid">
    <div class="info-item"><i class="fa-solid fa-calendar-days"></i><span class="label">Data:</span><span class="value">${dataBR}</span></div>
    <div class="info-item"><i class="fa-solid fa-clock"></i><span class="label">Duração:</span><span class="value">${pref?.duracao_horas?pref.duracao_horas+"h":"-"}</span></div>
    <div class="info-item"><i class="fa-solid fa-users"></i><span class="label">Convidados:</span><span class="value">${festa.convidados??"-"}</span></div>
    <div class="info-item"><i class="fa-solid fa-tags"></i><span class="label">Categorias:</span><span class="value">${pref?.categorias?.join(", ")||"-"}</span></div>
    <div class="info-item"><i class="fa-solid fa-utensils"></i><span class="label">Prato:</span><span class="value">${pref?.tipo_prato==="coquetel"?"Coquetel":pref?.tipo_prato==="almoco_jantar"?"Almoço/Jantar":"-"}</span></div>
    <div class="info-item"><i class="fa-solid fa-glass-whiskey"></i><span class="label">Bebidas:</span><span class="value">${pref?.bebidas_alcool===true?"Com álcool":pref?.bebidas_alcool===false?"Sem álcool":"-"}</span></div>
  </div>`;
}

/* ╔══ 9) Navegação UI ══════════════════════════════════════════╗ */
els.btnBack.onclick=()=>{
  document.querySelectorAll(".category-card.selected").forEach(c=>c.classList.remove("selected"));
  els.tasksSection.classList.add("hidden");els.categoryCont.classList.remove("hidden");
  els.tasksGrid.innerHTML="";els.tasksHeader.textContent="";els.conviteCont.innerHTML="";currentCategory=null;
};
els.searchInput.onfocus=()=>els.searchInput.value="";
els.searchInput.onchange=()=>{
  const festa=festasCache.find(f=>f.text===els.searchInput.value.trim());
  if(festa){selectFesta(festa);markSelected(festa.dateSimple);}
};

/* ╔══ 10) Bootstrap ═══════════════════════════════════════════╗ */
document.addEventListener("DOMContentLoaded",async()=>{
  hideLoader();
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.user) return window.location.replace("../autenticacao/login.html");
  await fetchFestas(session.user.id);popularDatalist();renderCalendar();
  els.headerFesta.classList.remove("hidden");
  els.festaInfo.classList.add("hidden");els.categoryCont.classList.add("hidden");els.tasksSection.classList.add("hidden");
});
