// convites.js

// lista de imagens padrão
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

let currentTheme = 0;

// Seleciona elementos do DOM
const thumbnailsWrapper = document.querySelector('.thumbnails-wrapper');
const thumbnailsContainer = document.getElementById('thumbnails');
const thumbPrevBtn = document.getElementById('thumbPrev');
const thumbNextBtn = document.getElementById('thumbNext');

// Número de miniaturas visíveis ao mesmo tempo (4)
const windowSize = 4;
// Largura fixa de cada miniatura (em px) e gap entre elas (em px)
const THUMB_WIDTH = 80;
const THUMB_GAP = 8;

// Ajustes de estilo para o carrossel usando overflow-x nativo e scroll-snap
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

// Pré-criar miniaturas e anexar ao container
const thumbnailElements = images.map((url, i) => {
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
  return img;
});

function highlightThumbnail() {
  thumbnailElements.forEach(img => {
    const isSelected = parseInt(img.dataset.index, 10) === currentTheme;
    img.style.border = isSelected ? '2px solid #f8c102' : '2px solid transparent';
  });
}
highlightThumbnail();
updatePreview();

// Função para atualizar o preview principal com base em currentTheme
async function updatePreview() {
  const prev = document.getElementById('convitePreview');
  const blurBg = document.getElementById('blurBg');
  const panel = document.getElementById('panel');

  const src = (currentTheme === 'upload')
    ? prev.dataset.upload
    : images[currentTheme];

  prev.style.backgroundImage = `url('${src}')`;
  blurBg.style.backgroundImage = `url('${src}')`;

  // valores dos inputs
  const evento = document.getElementById('evento').value;
  const subt = document.getElementById('subtitulo').value;
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;
  const local = document.getElementById('local').value;
  const endereco = document.getElementById('endereco').value.replace(/\n/g, '<br>');
  const msg = document.getElementById('mensagem').value.trim();
  const cor = document.getElementById('corTexto').value;
  const ft = document.getElementById('fonteTitulo').value;
  const fs = document.getElementById('fonteSubtitulo').value;
  const szT = document.getElementById('tamanhoTitulo').value + 'px';
  const szS = document.getElementById('tamanhoSubtitulo').value + 'px';
  const dateStr = data
    ? new Date(...data.split('-').map((v, i) => i === 1 ? v - 1 : +v))
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
      ${data ? `${diaSemana(data)}, ${horaFmt(hora)}` : ''}
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

// auxiliares de formatação
const diaSemana = d => {
  const [y, m, day] = d.split('-');
  return ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][
    new Date(y, m - 1, day).getDay()
  ];
};
const horaFmt = h => {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  return `às ${parseInt(hh, 10)}h${mm !== '00' ? mm : ''}`;
};

// Navegação por botões (avanço/volta uma miniatura)
thumbPrevBtn.addEventListener('click', () => {
  const thumbStep = THUMB_WIDTH + THUMB_GAP;
  thumbnailsWrapper.scrollBy({ left: -thumbStep, behavior: 'smooth' });
});
thumbNextBtn.addEventListener('click', () => {
  const thumbStep = THUMB_WIDTH + THUMB_GAP;
  thumbnailsWrapper.scrollBy({ left: thumbStep, behavior: 'smooth' });
});

// Controles de tamanho de fonte (Título)
const decTituloBtn = document.getElementById('decTitulo');
const incTituloBtn = document.getElementById('incTitulo');
const displayTituloSize = document.getElementById('displayTituloSize');
const hiddenTituloSize = document.getElementById('tamanhoTitulo');

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

// Controles de tamanho de fonte (Subtítulo)
const decSubBtn = document.getElementById('decSubtitulo');
const incSubBtn = document.getElementById('incSubtitulo');
const displaySubSize = document.getElementById('displaySubtituloSize');
const hiddenSubSize = document.getElementById('tamanhoSubtitulo');

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

// upload de imagem customizada
document.getElementById('uploadImagem').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('convitePreview').dataset.upload = ev.target.result;
    currentTheme = 'upload';
    thumbnailElements.forEach(img => img.style.border = '2px solid transparent');
    updatePreview();
  };
  reader.readAsDataURL(file);
});

// cores e paleta
const cores = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD',
  '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
  '#81C784', '#FFD54F', '#F8BBD0', '#F48FB1',
  '#000000', '#FFFFFF'
];
cores.forEach(c => {
  const sw = document.createElement('div');
  sw.className = 'color-swatch';
  sw.style.backgroundColor = c;
  sw.onclick = () => {
    document.getElementById('corTexto').value = c;
    updatePreview();
  };
  document.getElementById('predefinedColors').appendChild(sw);
});

// fontes
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
populateFonts();

// dispara update em todos os campos de input/select/textarea
['input', 'change'].forEach(evt =>
  document.querySelectorAll('input, select, textarea')
    .forEach(el => el.addEventListener(evt, updatePreview))
);
document.getElementById('colorPicker')
  .addEventListener('input', e => {
    document.getElementById('corTexto').value = e.target.value;
    updatePreview();
  });

// download via html2canvas
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const prev = document.getElementById('convitePreview');
  const panel = document.getElementById('panel');
  const pRect = prev.getBoundingClientRect();
  const tRect = panel.getBoundingClientRect();
  const scale = 3;

  const bgC = await html2canvas(prev, {
    backgroundColor: null, scale, useCORS: true,
    ignoreElements: el => el.id === 'panel'
  });
  const tmpC = document.createElement('canvas');
  tmpC.width = tRect.width * scale;
  tmpC.height = tRect.height * scale;
  const tctx = tmpC.getContext('2d');
  tctx.filter = 'blur(20px)';
  const x = (tRect.left - pRect.left) * scale;
  const y = (tRect.top - pRect.top) * scale;
  tctx.drawImage(bgC, x, y, tmpC.width, tmpC.height, 0, 0, tmpC.width, tmpC.height);

  const olC = await html2canvas(panel, { backgroundColor: null, scale, useCORS: true });
  const finalC = document.createElement('canvas');
  finalC.width = prev.offsetWidth * scale;
  finalC.height = prev.offsetHeight * scale;
  const ctx = finalC.getContext('2d');
  ctx.drawImage(bgC, 0, 0);
  ctx.drawImage(tmpC, x, y);
  ctx.drawImage(olC, x, y, tmpC.width, tmpC.height);

  const a = document.createElement('a');
  a.href = finalC.toDataURL('image/png');
  a.download = 'convite.png';
  a.click();
});
