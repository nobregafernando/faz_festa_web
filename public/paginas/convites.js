// convites.js
// FazFestas – Gerador de Convites
// versão 2025-06-07 (com seleção de festa, modal, exclusão, preview, download e upload)
// -----------------------------------------------------------

import supabase from "../compartilhado/supabaseClient.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// html2canvas é carregado via <script> no HTML

/* ───── 1. Configuração Firebase ───── */
const firebaseConfig = {
  apiKey:            "AIzaSyBCXGROCEjPw2AKwrkSrvJwoyT0eX5ZiDk",
  authDomain:        "fazfestasapp.firebaseapp.com",
  databaseURL:       "https://fazfestasapp-default-rtdb.firebaseio.com",
  projectId:         "fazfestasapp",
  storageBucket:     "fazfestasapp.firebasestorage.app",
  messagingSenderId: "587597050441",
  appId:             "1:587597050441:web:95aa6d63f73e3073ca0598",
  measurementId:     "G-SNG49SH2YB"
};
const fbApp     = initializeApp(firebaseConfig);
const fbStorage = getStorage(fbApp);

// Debug no console
window._fbStorage  = fbStorage;
window._storageRef = storageRef;
window._listAll    = listAll;

/* ───── 2. Estado Global ───── */
let uid = "anon";
let festaId = null;
let currentTheme = 0;
let modalCurrentPath = "";

/* ───── 3. DOM Helpers ───── */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ───── 4. Elementos ───── */
const selectFesta      = $("#selectFesta");
const eventoInfoDiv    = $("#evento-info");
const thumbnailsWrapper   = $(".thumbnails-wrapper");
const thumbnailsContainer = $("#thumbnails");
const thumbPrevBtn        = $("#thumbPrev");
const thumbNextBtn        = $("#thumbNext");

const eventoInput       = $("#evento");
const subtituloInput    = $("#subtitulo");
const dataInput         = $("#data");
const horaInput         = $("#hora");
const localInput        = $("#local");
const enderecoInput     = $("#endereco");
const mensagemInput     = $("#mensagem");

const decTituloBtn      = $("#decTitulo");
const incTituloBtn      = $("#incTitulo");
const displayTituloSize = $("#displayTituloSize");
const hiddenTituloSize  = $("#tamanhoTitulo");

const decSubBtn         = $("#decSubtitulo");
const incSubBtn         = $("#incSubtitulo");
const displaySubSize    = $("#displaySubtituloSize");
const hiddenSubSize     = $("#tamanhoSubtitulo");

const fonteTituloSel    = $("#fonteTitulo");
const fonteSubtituloSel = $("#fonteSubtitulo");

const colorPicker       = $("#colorPicker");
const corTextoHidden    = $("#corTexto");

const downloadBtn       = $("#downloadBtn");
const convitePreview    = $("#convitePreview");
const blurBg            = $("#blurBg");
const panel             = $("#panel");
const invitesListDiv    = $("#invites-list");

const modal             = $("#inviteModal");
const modalImg          = $("#modalImg");
const modalClose        = $("#modalClose");
const modalDeleteBtn    = $("#modalDelete");

/* ╔══ BOOTSTRAP ══════════════════════════════════════════╗ */
document.addEventListener("DOMContentLoaded", async () => {
  // Carrega usuário
  const { data:{ user } } = await supabase.auth.getUser();
  if (user) uid = user.id;

  // Carrega lista de festas
  await loadFestas();

  // Seleção de festa
  selectFesta.onchange = () => {
    festaId = selectFesta.value;
    loadEventoInfo();
    carregarConvitesStorage();
  };
  // Seleciona automaticamente a primeira
  if (selectFesta.options.length) {
    festaId = selectFesta.options[0].value;
    loadEventoInfo();
    carregarConvitesStorage();
  }

  // Inicializa editor e preview
  montarThumbnails();
  vincularControles();
  atualizarPreview();

  // Modal
  modalClose.onclick     = () => modal.classList.add("hidden");
  modalDeleteBtn.onclick = handleDeleteInvite;
});
/* ╚═══════════════════════════════════════════════════════╝ */

/* ───── Funções de Festa ───── */
async function loadFestas() {
  const { data, error } = await supabase
    .from("festas")
    .select("id,nome,data_evento")
    .eq("usuario_id", uid)
    .order("data_evento");
  if (error) {
    console.error(error);
    return;
  }
  data.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = `${f.nome} – ${new Date(f.data_evento).toLocaleDateString("pt-BR")}`;
    selectFesta.appendChild(opt);
  });
}

async function loadEventoInfo() {
  const { data: festa } = await supabase
    .from("festas")
    .select("nome,data_evento,convidados")
    .eq("id", festaId)
    .single();
  eventoInfoDiv.textContent =
    `Evento: ${festa.nome} | Data: ${new Date(festa.data_evento).toLocaleDateString("pt-BR")} | Convidados: ${festa.convidados}`;
}

/* ───── Miniaturas ───── */
const fundos = [
  "https://i.postimg.cc/fRXmZ8sq/0.jpg","https://i.postimg.cc/HnPqdQ53/1.webp",
  "https://i.postimg.cc/4dwdvSkd/2.jpg","https://i.postimg.cc/J4CrD8Bq/3.jpg",
  "https://i.postimg.cc/qMGTN3rJ/4.jpg","https://i.postimg.cc/ry16HrK1/5.jpg",
  "https://i.postimg.cc/k4ycQqgb/6.jpg","https://i.postimg.cc/fL5c3C87/7.jpg",
  "https://i.postimg.cc/nrCDXJjZ/8.jpg","https://i.postimg.cc/XvLGxJ94/9.jpg",
  "https://i.postimg.cc/K8y12LNm/10.jpg","https://i.postimg.cc/NGSbvgzQ/11.jpg",
  "https://i.postimg.cc/JnBDNWcQ/12.jpg","https://i.postimg.cc/RC7q4dPq/13.jpg",
  "https://i.postimg.cc/Kj8XXmqP/14.jpg","https://i.postimg.cc/SKFwS61N/15.jpg",
  "https://i.postimg.cc/X7tPLKbc/16.jpg","https://i.postimg.cc/QNFGqd7D/17.jpg",
  "https://i.postimg.cc/Y25VffkN/18.jpg"
];
const PLACEHOLDER =
  "data:image/svg+xml;base64,"+
  "PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8v"+
  "d3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdo"+
  "dD0iMTAwJSIgZmlsbD0iI2U2ZThlZiIvPjwvc3ZnPg==";

function miniatura(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.referrerPolicy = "no-referrer";
  img.src = src;
  img.onerror = () => img.src = PLACEHOLDER;
  return img;
}

function montarThumbnails() {
  thumbnailsContainer.innerHTML = "";
  const W = 80, G = 8, win = 4;
  Object.assign(thumbnailsWrapper.style, {
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    width: `${win*W + (win-1)*G}px`
  });
  Object.assign(thumbnailsContainer.style, {
    display: "flex",
    gap: `${G}px`
  });
  fundos.forEach((url, i) => {
    const img = miniatura(url);
    img.dataset.index = i;
    Object.assign(img.style, {
      flex: "0 0 auto",
      width: `${W}px`,
      height: `${W}px`,
      objectFit: "cover",
      borderRadius: "4px",
      border: "2px solid transparent",
      cursor: "pointer",
      scrollSnapAlign: "start"
    });
    img.onclick = () => {
      currentTheme = i;
      destacarThumb();
      atualizarPreview();
    };
    thumbnailsContainer.appendChild(img);
  });
  thumbPrevBtn.onclick = () => thumbnailsWrapper.scrollBy({ left: -88, behavior: "smooth" });
  thumbNextBtn.onclick = () => thumbnailsWrapper.scrollBy({ left:  88, behavior: "smooth" });
  destacarThumb();
}

function destacarThumb() {
  thumbnailsContainer.querySelectorAll("img").forEach(img => {
    img.style.border = (parseInt(img.dataset.index, 10) === currentTheme)
      ? "2px solid #f8c102"
      : "2px solid transparent";
  });
}

/* ───── Controles ───── */
function vincularControles() {
  $("#uploadImagem").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      convitePreview.dataset.upload = ev.target.result;
      currentTheme = "upload";
      destacarThumb();
      atualizarPreview();
    };
    r.readAsDataURL(f);
  });

  decTituloBtn.onclick = () => ajustaFonte(hiddenTituloSize, displayTituloSize, -2);
  incTituloBtn.onclick = () => ajustaFonte(hiddenTituloSize, displayTituloSize, +2);
  decSubBtn.onclick = () => ajustaFonte(hiddenSubSize, displaySubSize, -2);
  incSubBtn.onclick = () => ajustaFonte(hiddenSubSize, displaySubSize, +2);

  ["input","change"].forEach(ev => {
    $$("input,select,textarea").forEach(el => el.addEventListener(ev, atualizarPreview));
  });
  colorPicker.oninput = e => {
    corTextoHidden.value = e.target.value;
    atualizarPreview();
  };

  const fontes = [
    "'Great Vibes',cursive","'Lora',serif","'Playfair Display',serif",
    "'Dancing Script',cursive","'Pacifico',cursive","'Roboto',sans-serif",
    "'Quicksand',sans-serif","'Caveat',cursive","'Raleway',sans-serif",
    "'Courgette',cursive","'Indie Flower',cursive"
  ];
  ["fonteTitulo","fonteSubtitulo"].forEach(id => {
    const sel = $("#"+id);
    fontes.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f.split(",")[0].replace(/'/g,"");
      opt.style.fontFamily = f;
      sel.appendChild(opt);
    });
  });

  downloadBtn.onclick = salvarConvite;
}

function ajustaFonte(hidden, disp, delta) {
  let v = parseInt(hidden.value,10)+delta;
  v = Math.max(12,Math.min(100,v));
  hidden.value = v;
  disp.textContent = v;
  atualizarPreview();
}

/* ───── Preview ───── */
const diaSemana = d => {
  const [y,m,dd] = d.split("-");
  return ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][new Date(y,m-1,dd).getDay()];
};
const horaFmt = h => !h ? "" : (() => {
  const [hh,mm] = h.split(":");
  return `às ${+hh}h${mm!=="00"?mm:""}`;
})();
const fundoAtual = () =>
  (currentTheme==="upload")
    ? convitePreview.dataset.upload
    : fundos[currentTheme]||PLACEHOLDER;

function atualizarPreview() {
  const bg = fundoAtual();
  convitePreview.style.backgroundImage = `url('${bg}')`;
  blurBg.style.backgroundImage    = `url('${bg}')`;

  const evento  = eventoInput.value.trim();
  const subt    = subtituloInput.value.trim();
  const dataVal = dataInput.value;
  const horaVal = horaInput.value;
  const local   = localInput.value.trim();
  const ender   = enderecoInput.value.trim().replace(/\n/g,"<br>");
  const msg     = mensagemInput.value.trim();
  const cor     = corTextoHidden.value;
  const fTit    = fonteTituloSel.value;
  const fSub    = fonteSubtituloSel.value;
  const szTit   = `${hiddenTituloSize.value}px`;
  const szSub   = `${hiddenSubSize.value}px`;
  const dataStr = dataVal
    ? new Date(...dataVal.split("-").map((v,i)=>(i===1?v-1:+v))).toLocaleDateString("pt-BR")
    : "";

  panel.innerHTML = `
    <div style="letter-spacing:2px;font-size:clamp(.8rem,2.5vw,1rem);color:${cor}">CONVITE</div>
    <h2 style="font-family:${fTit};font-size:${szTit};color:${cor};margin:0">${evento||"&nbsp;"}</h2>
    <h3 style="font-family:${fSub};font-size:${szSub};color:${cor};margin:0">${subt||"&nbsp;"}</h3>
    <div class="data-ornamento" style="color:${cor}">${dataStr}</div>
    <div class="legend" style="color:${cor}">${dataVal?`${diaSemana(dataVal)}, ${horaFmt(horaVal)}`:""}</div>
    <div class="location" style="color:${cor}">${local}</div>
    <div class="address" style="color:${cor}">${ender}</div>
    ${msg?`<p style="margin-top:.5rem;color:${cor}">${msg.startsWith("“")?msg:`“${msg}”`}</p>`:""}
  `;
}

/* ───── Salvar Convite ───── */
function nomeSeguro(str) {
  return (str||"convite")
    .toLowerCase()
    .replace(/\s+/g,"_")
    .replace(/[^a-z0-9_-]/g,"")
    .slice(0,40)||"convite";
}

async function salvarConvite() {
  const toast = showToast("Gerando PNG…",{ type:"info",autoClose:false });
  try {
    const scale    = 3;
    const prevRect = convitePreview.getBoundingClientRect();
    const pnlRect  = panel.getBoundingClientRect();

    const bg = await html2canvas(convitePreview,{
      backgroundColor:null, scale, useCORS:true, allowTaint:true,
      ignoreElements: el => el.id==="panel"
    });

    const mask = document.createElement("canvas");
    mask.width  = pnlRect.width  * scale;
    mask.height = pnlRect.height * scale;
    const mctx = mask.getContext("2d");
    mctx.filter = "blur(20px)";
    const dx = (pnlRect.left - prevRect.left) * scale;
    const dy = (pnlRect.top  - prevRect.top ) * scale;
    mctx.drawImage(bg, dx, dy, mask.width, mask.height, 0, 0, mask.width, mask.height);

    const overlay = await html2canvas(panel,{backgroundColor:null, scale, useCORS:true, allowTaint:true});
    const final = document.createElement("canvas");
    final.width  = prevRect.width  * scale;
    final.height = prevRect.height * scale;
    const ctx = final.getContext("2d");
    ctx.drawImage(bg,     0,   0);
    ctx.drawImage(mask,   dx,  dy);
    ctx.drawImage(overlay,dx,  dy);

    final.toBlob(async blob => {
      // Download imediato
      const tmpURL = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = tmpURL;
      const base = nomeSeguro(eventoInput.value);
      const ts   = Date.now();
      a.download = `${base}_${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(tmpURL);

      // Upload
      const path = `convites/${uid}/${festaId}/${base}_${ts}.png`;
      const ref  = storageRef(fbStorage, path);
      await uploadBytes(ref, blob);
      showToast("Upload concluído!", { type:"success" });

      // Recarrega lista
      carregarConvitesStorage();
    }, "image/png");
  } catch(err) {
    console.error(err);
    showToast("Erro ao salvar convite.", { type:"error" });
  } finally {
    if (typeof hideToast === "function") hideToast(toast);
  }
}

/* ───── Carregar Convites ───── */
async function carregarConvitesStorage() {
  invitesListDiv.innerHTML = "Carregando convites…";
  try {
    const pasta = storageRef(fbStorage, `convites/${uid}/${festaId}`);
    const { items } = await listAll(pasta);
    invitesListDiv.innerHTML = "";
    if (items.length === 0) {
      invitesListDiv.textContent = "Nenhum convite ainda.";
      return;
    }
    await Promise.all(items.map(async itemRef => {
      const url = await getDownloadURL(itemRef);
      const wrapper = document.createElement("div");
      wrapper.className = "invite-thumb-wrapper";

      const card = document.createElement("div");
      card.className = "invite-thumb";
      card.style.backgroundImage = `url('${url}')`;
      card.onclick = () => openModal(url, itemRef.fullPath);

      const delBtn = document.createElement("button");
      delBtn.className = "btn-delete-thumb";
      delBtn.innerHTML = `<i class="fa fa-trash"></i>`;
      delBtn.onclick = e => {
        e.stopPropagation();
        openModal(url, itemRef.fullPath);
      };

      wrapper.appendChild(card);
      wrapper.appendChild(delBtn);
      invitesListDiv.appendChild(wrapper);
    }));
  } catch(err) {
    console.error("Erro listar storage:", err);
    invitesListDiv.textContent = "Erro ao carregar convites.";
  }
}

/* ───── Modal ───── */
function openModal(imageUrl, path) {
  modalCurrentPath = path;
  modalImg.src      = imageUrl;
  modal.classList.remove("hidden");
}

async function handleDeleteInvite() {
  try {
    await deleteObject(storageRef(fbStorage, modalCurrentPath));
    showToast("Convite excluído!", { type:"success" });
    modal.classList.add("hidden");
    carregarConvitesStorage();
  } catch(err) {
    console.error(err);
    showToast("Erro ao excluir convite.", { type:"error" });
  }
}
