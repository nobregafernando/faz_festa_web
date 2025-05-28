// lista de imagens padrão
const images = [
  "https://i.postimg.cc/jj89Y2qz/Foto-2-6.webp",
  "https://i.postimg.cc/mDsjPFZx/1.webp",
  "https://i.postimg.cc/VsBz2BQM/Foto-35.webp",
  "https://i.postimg.cc/9fjDn9mN/Foto-1-3.webp",
  "https://i.postimg.cc/MT7vwpTK/Jardim-das-bonecas.webp"
];

let currentTheme = 0;
const thumbnailsWrapper = document.querySelector('.thumbnails-wrapper');
const thumbnails = document.getElementById('thumbnails');

// montar as miniaturas
images.forEach((url, i) => {
  const img = document.createElement('img');
  img.src = url;
  img.dataset.index = i;
  img.addEventListener('click', () => {
    currentTheme = i;
    highlightThumbnail();
    updatePreview();
  });
  thumbnails.appendChild(img);
});
function highlightThumbnail() {
  thumbnails.querySelectorAll('img')
    .forEach(img => img.classList.toggle('selected', parseInt(img.dataset.index) === currentTheme));
}
highlightThumbnail();

// navegação da lista
document.getElementById('thumbPrev').addEventListener('click', () => {
  thumbnailsWrapper.scrollBy({ left: -100, behavior: 'smooth' });
});
document.getElementById('thumbNext').addEventListener('click', () => {
  thumbnailsWrapper.scrollBy({ left: 100, behavior: 'smooth' });
});

// upload de imagem customizada
document.getElementById('uploadImagem').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('convitePreview').dataset.upload = ev.target.result;
    currentTheme = 'upload';
    thumbnails.querySelectorAll('img').forEach(img => img.classList.remove('selected'));
    updatePreview();
  };
  reader.readAsDataURL(file);
});

// cores e paleta (removida a última cor para caber em uma linha)
const cores = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD',
  '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
  '#81C784', '#FFD54F', '#F8BBD0', '#F48FB1',
  '#000000'
];
cores.forEach(c => {
  const sw = document.createElement('div');
  sw.className = 'color-swatch';
  sw.style.backgroundColor = c;
  sw.onclick = () => { document.getElementById('corTexto').value = c; updatePreview(); };
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
  ['fonteTitulo','fonteSubtitulo'].forEach(id => {
    const sel = document.getElementById(id);
    fontList.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f.split(',')[0].replace(/'/g,'');
      opt.style.fontFamily = f;
      sel.appendChild(opt);
    });
  });
}
populateFonts();

// auxiliares de formatação
const diaSemana = d => {
  const [y,m,day] = d.split('-');
  return ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][new Date(y,m-1,day).getDay()];
};
const horaFmt = h => {
  if(!h) return '';
  const [hh,mm] = h.split(':');
  return `às ${parseInt(hh)}h${mm!=='00'?mm:''}`;
};

// atualiza preview
async function updatePreview() {
  const prev = document.getElementById('convitePreview');
  const blurBg = document.getElementById('blurBg');
  const panel = document.getElementById('panel');

  let src = (currentTheme === 'upload')
    ? prev.dataset.upload
    : images[currentTheme];

  prev.style.backgroundImage = `url('${src}')`;
  blurBg.style.backgroundImage = `url('${src}')`;

  // valores dos inputs
  const evento   = document.getElementById('evento').value;
  const subt     = document.getElementById('subtitulo').value;
  const data     = document.getElementById('data').value;
  const hora     = document.getElementById('hora').value;
  const local    = document.getElementById('local').value;
  const endereco = document.getElementById('endereco').value.replace(/\n/g,'<br>');
  const msg      = document.getElementById('mensagem').value.trim();
  const cor      = document.getElementById('corTexto').value;
  const ft       = document.getElementById('fonteTitulo').value;
  const fs       = document.getElementById('fonteSubtitulo').value;
  const szT      = document.getElementById('tamanhoTitulo').value + 'px';
  const szS      = document.getElementById('tamanhoSubtitulo').value + 'px';
  const dateStr  = data
    ? new Date(...data.split('-').map((v,i)=> i===1 ? v-1 : +v))
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
      ${data? `${diaSemana(data)}, ${horaFmt(hora)}` : ''}
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

// dispara update em todos os campos
['input','change'].forEach(evt =>
  document.querySelectorAll('input,select,textarea')
    .forEach(el => el.addEventListener(evt, updatePreview))
);
document.getElementById('colorPicker')
  .addEventListener('input', e=> {
    document.getElementById('corTexto').value = e.target.value;
    updatePreview();
  });

// download via html2canvas
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const prev  = document.getElementById('convitePreview');
  const panel = document.getElementById('panel');
  const pRect = prev.getBoundingClientRect();
  const tRect = panel.getBoundingClientRect();
  const scale = 3;

  const bgC = await html2canvas(prev, {
    backgroundColor: null, scale, useCORS: true,
    ignoreElements: el => el.id==='panel'
  });
  const tmpC = document.createElement('canvas');
  tmpC.width  = tRect.width * scale;
  tmpC.height = tRect.height * scale;
  const tctx = tmpC.getContext('2d');
  tctx.filter = 'blur(20px)';
  const x = (tRect.left - pRect.left) * scale;
  const y = (tRect.top  - pRect.top ) * scale;
  tctx.drawImage(bgC, x, y, tmpC.width, tmpC.height, 0, 0, tmpC.width, tmpC.height);

  const olC = await html2canvas(panel, { backgroundColor: null, scale, useCORS: true });
  const finalC = document.createElement('canvas');
  finalC.width  = prev.offsetWidth  * scale;
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

// inicializa tudo
updatePreview();
