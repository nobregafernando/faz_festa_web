import supabase from "../compartilhado/supabaseClient.js";
import flatpickr from "https://cdn.jsdelivr.net/npm/flatpickr/+esm";
import "https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pt.js";

const toast = (m, t = "success") =>
  window.showToast
    ? window.showToast(m, { type: t })
    : alert(`${t}: ${m}`);
const $ = (s) => document.querySelector(s);

let step = 0,
  editId = null;
const tiposMap = {};

const updateStep = () =>
  [...document.querySelectorAll(".wizard-step")].forEach((el, i) =>
    el.classList.toggle("active", i === step)
  );
const overlay = (sel, hide) =>
  document.querySelector(sel).classList.toggle("hidden", hide);

// converte array vindo do Postgres
const parseArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      const m = raw.match(/^\{(.+)\}$/);
      if (m) return m[1].split(",").map((s) => s.trim());
    }
  }
  return [];
};

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    supabase.auth.onAuthStateChange((_, s) =>
      s?.user
        ? init(s.user)
        : window.location.replace("../autenticacao/login.html")
    );
  } else {
    init(session.user);
  }
});

async function init(user) {
  // flatpickr
  ["#fld-data", "#flt-data-start", "#flt-data-end"].forEach((sel, i) =>
    flatpickr(sel, {
      locale: flatpickr.l10ns.pt,
      dateFormat: "d/m/Y",
      minDate: i === 0 ? "today" : null,
    })
  );

  // popula tipos de evento
  try {
    const { data: tipos } = await supabase
      .from("tipos_evento")
      .select("id,nome")
      .order("nome");
    const sel = $("#fld-tipo-evento"),
      flt = $("#flt-tipo");
    sel.innerHTML = '<option value="">Selecione...</option>';
    flt.innerHTML = '<option value="">Todos</option>';
    (tipos || []).forEach((t) => {
      sel.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
      flt.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
      tiposMap[t.id] = t.nome;
    });
  } catch {
    toast("Erro ao carregar tipos", "error");
  }

  // botões topo
  $("#btn-new").onclick = () => {
    editId = null;
    $("#wizard-form").reset();
    $("#wizard-title").textContent = "Nova festa";
    step = 0;
    updateStep();
    overlay("#wizard-overlay", false);
  };
  $("#btn-filter").onclick = () => overlay("#filter-overlay", false);
  ["#filter-overlay", "#wizard-overlay"].forEach((sel) =>
    document.querySelector(sel).onclick = (e) => {
      if (e.target.id === sel.slice(1)) overlay(sel, true);
    }
  );
  $("#wizard-close").onclick = () => overlay("#wizard-overlay", true);
  document.querySelectorAll(".btn-next").forEach((b) =>
    (b.onclick = () => {
      if (step < 3) {
        step++;
        updateStep();
      }
    })
  );
  document.querySelectorAll(".btn-back").forEach((b) =>
    (b.onclick = () => {
      if (step > 0) {
        step--;
        updateStep();
      }
    })
  );

  // filtro
  $("#flt-clear").onclick = (e) => {
    e.preventDefault();
    $("#filter-form").reset();
    renderFestas(user.id);
    overlay("#filter-overlay", true);
  };
  $("#filter-form").onsubmit = async (e) => {
    e.preventDefault();
    const start = $("#flt-data-start").value
      .split("/")
      .reverse()
      .join("-") || null;
    const end = $("#flt-data-end").value
      .split("/")
      .reverse()
      .join("-") || null;
    const tipo = $("#flt-tipo").value || null;
    await renderFestas(user.id, { start, end, tipo });
    overlay("#filter-overlay", true);
  };

  $("#wizard-form").onsubmit = (e) => saveFesta(e, user);
  renderFestas(user.id);
}

async function renderFestas(uid, filter = {}) {
  const cont = $("#festas-container");
  cont.innerHTML = "";

  let festas = [];
  try {
    let q = supabase
      .from("festas")
      .select("id,nome,data_evento,convidados")
      .eq("usuario_id", uid);
    if (filter.start) q = q.gte("data_evento", filter.start);
    if (filter.end) q = q.lte("data_evento", filter.end);
    const { data } = await q.order("data_evento");
    festas = data;
  } catch {
    toast("Erro ao listar", "error");
    return;
  }

  if (!festas.length) {
    cont.innerHTML = "<p>Nenhuma festa cadastrada.</p>";
    return;
  }

  const ids = festas.map((f) => f.id);
  const { data: prefs = [] } = await supabase
    .from("festa_preferencias")
    .select(
      "festa_id,duracao_horas,categorias,tipo_evento_id,tipo_prato,bebidas_alcool"
    )
    .in("festa_id", ids);

  const prefsById = Object.fromEntries(
    prefs.map((p) => [p.festa_id, p])
  );

  const lista = filter.tipo
    ? festas.filter(
        (f) => prefsById[f.id]?.tipo_evento_id == filter.tipo
      )
    : festas;

  lista.forEach((f) =>
    cont.appendChild(buildCard(f, prefsById[f.id] || {}))
  );
}

function buildCard(f, p) {
  const d = new Date(f.data_evento),
    diff = Math.ceil((d - new Date()) / 86400000),
    cd = diff > 0 ? `Faltam ${diff} dia${diff > 1 ? "s" : ""}` : "Hoje!",
    dataTxt = d.toLocaleDateString("pt-BR"),
    durTxt = p.duracao_horas ? `${p.duracao_horas}h` : "-",
    evtTxt = tiposMap[p.tipo_evento_id] || "-",
    catsTxt = (() => {
      const a = parseArray(p.categorias);
      return a.length ? a.join(", ") : "-";
    })(),
    pratoTxt =
      p.tipo_prato === "coquetel"
        ? "Coquetel"
        : p.tipo_prato === "almoco_jantar"
        ? "Almoço/Jantar"
        : "-",
    bebTxt =
      p.bebidas_alcool === true
        ? "Com álcool"
        : p.bebidas_alcool === false
        ? "Sem álcool"
        : "-";

  const div = document.createElement("div");
  div.className = "card-festa";
  div.innerHTML = `
    <div class="actions">
      <button class="edit"><i class="fa-solid fa-pen"></i></button>
      <button class="del"><i class="fa-solid fa-trash"></i></button>
    </div>
    <h3><i class="fa-solid fa-calendar-days"></i>${f.nome}</h3>
    <p class="countdown">${cd}</p>
    <ul class="card-info">
      <li><span>Data:</span> ${dataTxt}</li>
      <li><span>Duração:</span> ${durTxt}</li>
      <li><span>Convidados:</span> ${f.convidados} convid.</li>
      <li><span>Evento:</span> ${evtTxt}</li>
      <li><span>Categorias:</span> ${catsTxt}</li>
      <li><span>Prato principal:</span> ${pratoTxt}</li>
      <li><span>Bebidas:</span> ${bebTxt}</li>
    </ul>
  `;
  div.querySelector(".edit").onclick = () => openEdit(f, p);
  div.querySelector(".del").onclick = () => confirmDelete(f.id);
  return div;
}

function openEdit(f, p) {
  editId = f.id;
  $("#wizard-title").textContent = "Editar festa";
  $("#wizard-form").reset();

  $("#fld-nome").value = f.nome;
  $("#fld-data")._flatpickr.setDate(new Date(f.data_evento));
  $("#fld-duracao").value = p.duracao_horas || "";
  $("#fld-convidados").value = f.convidados;
  $("#fld-tipo-evento").value = p.tipo_evento_id || "";

  const cats = parseArray(p.categorias);
  document
    .querySelectorAll("input[name='fld-categoria']")
    .forEach((cb) => {
      cb.checked = cats.includes(cb.value);
    });

  document.querySelector(
    `input[name='fld-prato'][value='${p.tipo_prato || "coquetel"}']`
  ).checked = true;
  document.querySelector(
    `input[name='fld-alcool'][value='${p.bebidas_alcool}']`
  ).checked = true;

  step = 0;
  updateStep();
  overlay("#wizard-overlay", false);
}

async function confirmDelete(id) {
  if (!(await window.showConfirm?.("Excluir esta festa?"))) return;
  try {
    await supabase
      .from("festa_preferencias")
      .delete()
      .eq("festa_id", id);
    await supabase.from("festas").delete().eq("id", id);
    toast("Festa excluída");
  } catch {
    toast("Erro ao excluir", "error");
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  renderFestas(session.user.id);
}

async function saveFesta(e, user) {
  e.preventDefault();
  const btn = e.submitter;
  btn.classList.add("btn-loading");

  const nome = $("#fld-nome").value.trim();
  const iso = $("#fld-data")
    .value.split("/")
    .reverse()
    .join("-");
  const duracao = parseInt($("#fld-duracao").value, 10) || 0;
  const convidados = parseInt($("#fld-convidados").value, 10);
  const tipoEvento = parseInt($("#fld-tipo-evento").value, 10) || 0;

  let categorias = Array.from(
    document.querySelectorAll(
      "input[name='fld-categoria']:checked:not([disabled])"
    )
  ).map((cb) => cb.value);
  // garante sempre o prato principal
  if (!categorias.includes("Prato Principal"))
    categorias.push("Prato Principal");

  const prato = document.querySelector(
    "input[name='fld-prato']:checked"
  ).value;
  const alcool =
    document.querySelector("input[name='fld-alcool']:checked").value ===
    "true";

  if (!nome || !iso || !duracao || !convidados || !tipoEvento) {
    toast("Preencha todos os campos obrigatórios", "error");
    btn.classList.remove("btn-loading");
    return;
  }

  try {
    if (editId) {
      await supabase
        .from("festas")
        .update({ nome, data_evento: iso, convidados })
        .eq("id", editId);
      await supabase.from("festa_preferencias").upsert({
        festa_id: editId,
        duracao_horas: duracao,
        categorias,
        tipo_evento_id: tipoEvento,
        tipo_prato: prato,
        bebidas_alcool: alcool,
      });
      toast("Festa atualizada");
    } else {
      const { data: f, error } = await supabase
        .from("festas")
        .insert({
          usuario_id: user.id,
          nome,
          data_evento: iso,
          convidados,
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("festa_preferencias").insert({
        festa_id: f.id,
        duracao_horas: duracao,
        categorias,
        tipo_evento_id: tipoEvento,
        tipo_prato: prato,
        bebidas_alcool: alcool,
      });
      toast("Festa criada");
    }

    overlay("#wizard-overlay", true);
    renderFestas(user.id);
  } catch (err) {
    console.error(err);
    toast("Erro ao salvar", "error");
  } finally {
    btn.classList.remove("btn-loading");
  }
}
