// convites.js

/**
 * Este script faz:
 * 1) Lê festaId da query string (?festaId=...)
 * 2) Busca nome e data do evento no Supabase → exibe em #evento-info
 * 3) Inicializa Firebase (Storage + Realtime Database)
 * 4) Carrega miniaturas de temas (images[]) → exibe carrossel
 * 5) Permite upload customizado de imagem
 * 6) Permite editar texto/fonte/tamanho/cores em tempo real (updatePreview)
 * 7) Salva convite via html2canvas → upload ao Firebase Storage
 *    → grava a URL no Realtime Database em convites/{festaId}/
 * 8) Escuta mudanças em convites/{festaId}/ → exibe automaticamente miniaturas
 */

import supabase from "../compartilhado/supabaseClient.js";

// ─────────────────────────── Variáveis Globais ──────────────────────────

// Lista de imagens-tema padrão
const images = [
  "https://i.postimg.cc/fRXmZ8sq/0.jpg",
  "https://i.postimg.cc/HnPqdQ53/1.webp",
  "https://i.postimg.cc/4dwdvSkd/2.jpg",
  "https://i.postimg.cc/J4CrD8Bq/3.jpg",
  "https://i.postimg.cc/qMGTN3rJ/4.jpg",
  "https://i.postimg.cc/ry16HrK1/5.jpg",
  "https://i.postimg.cc/k4ycQqgb/6.jpg",
  "https://i.postimg.cc/fL5c3C87/7.jpg",
  "https://i.postimg.cc/nrCDXJjZ/8.jpg",
  "https://i.postimg.cc/XvLGxJ94/9.jpg",
  "https://i.postimg.cc/K8y12LNm/10.jpg",
  "https://i.postimg.cc/NGSbvgzQ/11.jpg",
  "https://i.postimg.cc/JnBDNWcQ/12.jpg",
  "https://i.postimg.cc/RC7q4dPq/13.jpg",
  "https://i.postimg.cc/Kj8XXmqP/14.jpg",
  "https://i.postimg.cc/SKFwS61N/15.jpg",
  "https://i.postimg.cc/X7tPLKbc/16.jpg",
  "https://i.postimg.cc/QNFGqd7D/17.jpg",
  "https://i.postimg.cc/Y25VffkN/18.jpg"
];
let currentTheme = 0;   // índice da lista ‘images’, ou "upload" para imagem custom

// Referências DOM (Editor + Preview)
const thumbnailsWrapper = document.querySelector('.thumbnails-wrapper');
const thumbnailsContainer = document.getElementById('thumbnails');
const thumbPrevBtn = document.getElementById('thumbPrev');
const thumbNextBtn = document.getElementById('thumbNext');

const eventoInput       = document.getElementById('evento');
const subtituloInput    = document.getElementById('subtitulo');
const dataInput         = document.getElementById('data');
const horaInput         = document.getElementById('hora');
const localInput        = document.getElementById('local');
const enderecoInput     = document.getElementById('endereco');
const mensagemInput     = document.getElementById('mensagem');

const decTituloBtn      = document.getElementById('decTitulo');
const incTituloBtn      = document.getElementById('incTitulo');
const displayTituloSize = document.getElementById('displayTituloSize');
const hiddenTituloSize  = document.getElementById('tamanhoTitulo');

const decSubBtn         = document.getElementById('decSubtitulo');
const incSubBtn         = document.getElementById('incSubtitulo');
const displaySubSize    = document.getElementById('displaySubtituloSize');
const hiddenSubSize     = document.getElementById('tamanhoSubtitulo');

const fonteTituloSel    = document.getElementById('fonteTitulo');
const fonteSubtituloSel = document.getElementById('fonteSubtitulo');

const colorPicker       = document.getElementById('colorPicker');
const corTextoHidden    = document.getElementById('corTexto');

const downloadBtn       = document.getElementById('downloadBtn');
const convitePreview    = document.getElementById('convitePreview');
const blurBg            = document.getElementById('blurBg');
const panel             = document.getElementById('panel');

const eventoInfoDiv     = document.getElementById('evento-info');

// Container para mostrar convites gerados
const invitesListDiv    = document.getElementById('invites-list');

// Lê festaId da URL (?festaId=...)
const urlParams = new URLSearchParams(window.location.search);
const festaId   = urlParams.get('festaId') || null;

// Variáveis Firebase (setadas após init)
let storage, database;

/* ───────────────────────────────────────────────────────────────────────── *
   █ Inicialização geral após DOMContentLoaded █
 * ───────────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Verifica se há festaId válido
  if (!festaId) {
    showToast("ID da festa ausente na URL. Volte ao checklist e clique em 'Montar Convite'.", { type: "warning" });
    return;
  }

  // 2) Busca dados básicos da festa no Supabase e exibe em #evento-info
  await carregarInfoFesta();

  // 3) Inicializa Firebase (Storage + Realtime Database)
  initFirebaseSDK();

  // 4) Monta carrossel de miniaturas
  setupThumbnails();

  // 5) Configura upload customizado
  document.getElementById('uploadImagem').addEventListener('change', handleUploadImagem);

  // 6) Configura controles de tamanho de fonte
  setupFontControls();

  // 7) Popula selects de fontes
  populateFonts();

  // 8) Configura listeners gerais de input/select/textarea para atualizar preview
  ['input', 'change'].forEach(evt => {
    document.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener(evt, updatePreview);
    });
  });

  // 9) Controlador de colorPicker
  colorPicker.addEventListener('input', e => {
    corTextoHidden.value = e.target.value;
    updatePreview();
  });

  // 10) Botão de salvar convite → geração + upload
  downloadBtn.addEventListener('click', salvarConvite);

  // 11) Exibe convites já gerados para essa festa
  fetchAndShowGeneratedInvites();

  // 12) Primeira renderização do preview
  highlightThumbnail();
  updatePreview();
});

/* ===================================================================== *
 *  Função: carregarInfoFesta()                                          *
 *  Busca nome e data do evento no Supabase, exibe em #evento-info       *
 * ===================================================================== */
async function carregarInfoFesta() {
  try {
    const { data: festa, error } = await supabase
      .from('festas')
      .select('nome, data_evento')
      .eq('id', festaId)
      .single();
    if (error || !festa) {
      console.error("Erro ao carregar dados da festa:", error);
      return;
    }
    const dataBR = new Date(festa.data_evento).toLocaleDateString('pt-BR');
    eventoInfoDiv.innerHTML = `
      <p><strong>${festa.nome}</strong> — ${dataBR}</p>
    `;
  } catch (err) {
    console.error("Erro supabase ao buscar festa:", err);
  }
}

/* ===================================================================== *
 *  Função: initFirebaseSDK()                                             *
 *  Inicializa Storage e Realtime Database                               *
 * ===================================================================== */
function initFirebaseSDK() {
  // As funções e configs já foram expostas globalmente em convites.html
  const app    = window.initializeApp(window.firebaseConfig);
  storage      = window.getStorage(app);
  database     = window.getDatabase(app);
}

/* ===================================================================== *
 *  Função: setupThumbnails()                                             *
 *  Prepara e exibe miniaturas do carrossel de temas                      *
 * ===================================================================== */
function setupThumbnails() {
  const windowSize = 4;
  const THUMB_WIDTH = 80;
  const THUMB_GAP = 8;

  Object.assign(thumbnailsWrapper.style, {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'x mandatory',
    cursor: 'grab',
    userSelect: 'none',
    width: `${windowSize * THUMB_WIDTH + (windowSize - 1) * THUMB_GAP}px`,
    paddingBottom: '4px'
  });
  Object.assign(thumbnailsContainer.style, {
    display: 'flex',
    gap: `${THUMB_GAP}px`
  });

  images.forEach((url, i) => {
    const img = document.createElement('img');
    img.src = url;
    img.dataset.index = i;
    Object.assign(img.style, {
      flex: '0 0 auto',
      width: `${THUMB_WIDTH}px`,
      height: `${THUMB_WIDTH}px`,
      objectFit: 'cover',
      borderRadius: '4px',
      cursor: 'pointer',
      scrollSnapAlign: 'start',
      border: '2px solid transparent',
      transition: 'border 0.2s'
    });
    img.addEventListener('click', () => {
      currentTheme = i;
      highlightThumbnail();
      updatePreview();
    });
    thumbnailsContainer.appendChild(img);
  });

  thumbPrevBtn.addEventListener('click', () => {
    const thumbStep = THUMB_WIDTH + THUMB_GAP;
    thumbnailsWrapper.scrollBy({ left: -thumbStep, behavior: 'smooth' });
  });
  thumbNextBtn.addEventListener('click', () => {
    const thumbStep = THUMB_WIDTH + THUMB_GAP;
    thumbnailsWrapper.scrollBy({ left: thumbStep, behavior: 'smooth' });
  });
}

/* ===================================================================== *
 *  Função: highlightThumbnail()                                         *
 *  Destaca miniatura selecionada                                         *
 * ===================================================================== */
function highlightThumbnail() {
  const imgs = Array.from(thumbnailsContainer.querySelectorAll('img'));
  imgs.forEach(img => {
    const isSelected = parseInt(img.dataset.index, 10) === currentTheme;
    img.style.border = isSelected ? '2px solid #f8c102' : '2px solid transparent';
  });
}

/* ===================================================================== *
 *  Função: handleUploadImagem()                                          *
 *  Lê imagem custom, salva em data-upload do preview, marca currentTheme *
 * ===================================================================== */
function handleUploadImagem(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    convitePreview.dataset.upload = ev.target.result;
    currentTheme = "upload";
    thumbnailsContainer.querySelectorAll('img').forEach(img => {
      img.style.border = '2px solid transparent';
    });
    updatePreview();
  };
  reader.readAsDataURL(file);
}

/* ===================================================================== *
 *  Função: updatePreview()                                               *
 *  Atualiza preview de acordo com inputs                                  *
 * ===================================================================== */
function updatePreview() {
  const src = (currentTheme === "upload")
    ? convitePreview.dataset.upload
    : images[currentTheme];

  convitePreview.style.backgroundImage = `url('${src}')`;
  blurBg.style.backgroundImage = `url('${src}')`;

  // Lê valores de inputs
  const evento  = eventoInput.value;
  const subt    = subtituloInput.value;
  const dataVal = dataInput.value;
  const horaVal = horaInput.value;
  const local   = localInput.value;
  const endereco = enderecoInput.value.replace(/\n/g, '<br>');
  const msg     = mensagemInput.value.trim();
  const cor     = corTextoHidden.value;
  const ft      = fonteTituloSel.value;
  const fs      = fonteSubtituloSel.value;
  const szT     = hiddenTituloSize.value + 'px';
  const szS     = hiddenSubSize.value + 'px';

  // Formata data local
  const dateStr = dataVal
    ? new Date(...dataVal.split('-').map((v,i) => i === 1 ? v - 1 : +v))
        .toLocaleDateString('pt-BR')
    : '';

  panel.innerHTML = `
    <div style="letter-spacing:2px;font-size:clamp(0.85rem,2.5vw,1rem);color:${cor}">
      CONVITE
    </div>
    <h2 class="title" style="font-family:${ft};font-size:${szT};color:${cor}">
      ${evento}
    </h2>
    <h3 class="subtitle" style="font-family:${fs};font-size:${szS};color:${cor}">
      ${subt}
    </h3>
    <div class="data-ornamento" style="color:${cor}">${dateStr}</div>
    <div class="legend" style="color:${cor}">
      ${dataVal ? `${diaSemana(dataVal)}, ${horaFmt(horaVal)}` : ''}
    </div>
    <div class="location" style="color:${cor}">
      ${local}
    </div>
    <div class="address" style="color:${cor}">
      ${endereco}
    </div>
    ${msg
      ? `<p style="margin-top:0.5rem;color:${cor}">
           ${msg.startsWith('“') ? msg : `“${msg}”`}
         </p>`
      : ''
    }
  `;
}

/* ===================================================================== *
 *  Auxiliar: diaSemana(d)                                                *
 * ===================================================================== */
const diaSemana = d => {
  const [y, m, day] = d.split('-');
  return ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][
    new Date(y, m - 1, day).getDay()
  ];
};

/* ===================================================================== *
 *  Auxiliar: horaFmt(h)                                                  *
 * ===================================================================== */
const horaFmt = h => {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  return `às ${parseInt(hh, 10)}h${mm !== '00' ? mm : ''}`;
};

/* ===================================================================== *
 *  Função: setupFontControls()                                            *
 *  Configura botões de diminuir/aumentar fonte                             *
 * ===================================================================== */
function setupFontControls() {
  // Título
  decTituloBtn.addEventListener('click', () => {
    let size = parseInt(hiddenTituloSize.value, 10);
    if (size > 12) size -= 2;
    hiddenTituloSize.value = size;
    displayTituloSize.textContent = size;
    updatePreview();
  });
  incTituloBtn.addEventListener('click', () => {
    let size = parseInt(hiddenTituloSize.value, 10);
    if (size < 100) size += 2;
    hiddenTituloSize.value = size;
    displayTituloSize.textContent = size;
    updatePreview();
  });

  // Subtítulo
  decSubBtn.addEventListener('click', () => {
    let size = parseInt(hiddenSubSize.value, 10);
    if (size > 12) size -= 2;
    hiddenSubSize.value = size;
    displaySubSize.textContent = size;
    updatePreview();
  });
  incSubBtn.addEventListener('click', () => {
    let size = parseInt(hiddenSubSize.value, 10);
    if (size < 100) size += 2;
    hiddenSubSize.value = size;
    displaySubSize.textContent = size;
    updatePreview();
  });
}

/* ===================================================================== *
 *  Função: populateFonts()                                                *
 *  Popula selects de fontes                                                  *
 * ===================================================================== */
const fontList = [
  "'Great Vibes', cursive", "'Lora', serif", "'Playfair Display', serif",
  "'Dancing Script', cursive", "'Pacifico', cursive", "'Roboto', sans-serif",
  "'Quicksand', sans-serif", "'Caveat', cursive", "'Raleway', sans-serif",
  "'Courgette', cursive", "'Indie Flower', cursive"
];
function populateFonts() {
  ['fonteTitulo', 'fonteSubtitulo'].forEach(id => {
    const sel = document.getElementById(id);
    fontList.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f.split(',')[0].replace(/'/g, '');
      opt.style.fontFamily = f;
      sel.appendChild(opt);
    });
  });
}

/* ===================================================================== *
 *  Função: salvarConvite()                                                *
 *  Gera imagem via html2canvas, faz upload + grava URL no Realtime DB     *
 * ===================================================================== */
async function salvarConvite() {
  try {
    const prev       = document.getElementById('convitePreview');
    const panelRect  = panel.getBoundingClientRect();
    const previewRect= prev.getBoundingClientRect();
    const scale      = 3;

    // 1a) Renderiza fundo (sem painel)
    const bgCanvas = await window.html2canvas(prev, {
      backgroundColor: null,
      scale,
      useCORS: true,
      ignoreElements: (el) => el.id === 'panel'
    });

    // 1b) Prepara blur do painel
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width  = panelRect.width * scale;
    tmpCanvas.height = panelRect.height * scale;
    const tctx = tmpCanvas.getContext('2d');
    tctx.filter = 'blur(20px)';
    const xOff = (panelRect.left - previewRect.left) * scale;
    const yOff = (panelRect.top - previewRect.top) * scale;
    tctx.drawImage(
      bgCanvas,
      xOff, yOff,
      tmpCanvas.width, tmpCanvas.height,
      0, 0,
      tmpCanvas.width, tmpCanvas.height
    );

    // 1c) Renderiza somente painel (texto + ornamentação)
    const overlayCanvas = await window.html2canvas(panel, {
      backgroundColor: null,
      scale,
      useCORS: true
    });

    // 1d) Combina no canvas final
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width  = previewRect.width * scale;
    finalCanvas.height = previewRect.height * scale;
    const ctx = finalCanvas.getContext('2d');
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(tmpCanvas, xOff, yOff, tmpCanvas.width, tmpCanvas.height);
    ctx.drawImage(overlayCanvas, xOff, yOff, tmpCanvas.width, tmpCanvas.height);

    // 2) Converte para blob e envia ao Firebase Storage
    finalCanvas.toBlob(async (blob) => {
      const timestamp = Date.now();
      const filePath  = `convites/${festaId}/${timestamp}.png`;
      const storageReference = window.storageRef(storage, filePath);

      // 2a) Upload
      await window.uploadBytes(storageReference, blob);

      // 2b) URL pública
      const downloadURL = await window.getDownloadURL(storageReference);

      // 2c) Grava URL no Realtime Database em convites/{festaId}/
      const convitesRef  = window.dbRef(database, `convites/${festaId}`);
      const newInviteRef = window.push(convitesRef);
      await window.set(newInviteRef, {
        url: downloadURL,
        createdAt: timestamp
      });

      showToast("Convite salvo com sucesso!", { type: "success" });
    }, 'image/png');

  } catch (err) {
    console.error("Erro ao gerar/baixar convite:", err);
    showToast("Falha ao salvar convite.", { type: "error" });
  }
}

/* ===================================================================== *
 *  Função: fetchAndShowGeneratedInvites()                                 *
 *  Lê convites/{festaId} e exibe miniaturas                               *
 * ===================================================================== */
function fetchAndShowGeneratedInvites() {
  const convitesRef = window.dbRef(database, `convites/${festaId}`);
  window.onValue(convitesRef, (snapshot) => {
    invitesListDiv.innerHTML = ""; // limpa lista
    const data = snapshot.val();
    if (!data) {
      invitesListDiv.innerHTML = "<p>Nenhum convite gerado ainda.</p>";
      return;
    }
    // Ordena pelo createdAt para exibir do mais recente ao mais antigo
    const entries = Object.entries(data).sort((a, b) => b[1].createdAt - a[1].createdAt);
    entries.forEach(([key, obj]) => {
      const thumb = document.createElement('div');
      thumb.className = "invite-thumb";
      thumb.style.backgroundImage = `url('${obj.url}')`;
      thumb.addEventListener('click', () => {
        window.open(obj.url, '_blank');
      });
      invitesListDiv.appendChild(thumb);
    });
  });
}
