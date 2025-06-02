(function () {
  // ── 1. INJETANDO ESTILOS CSS DO PAINEL COM CORES DO SISTEMA ──
  const style = document.createElement("style");
  style.textContent = `
    /* ===== FONT FAMILY GLOBAL ===== */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

    /* ===== BOTÃO DE ACESSIBILIDADE ===== */
    .acessibilidade-btn {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background-color: #9f7aea;           /* cor primária */
      color: #fff;                         /* ícone branco */
      font-size: 20px;                     /* tamanho do ícone */
      padding: 12px;
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
      font-family: 'Poppins', sans-serif;
    }
    .acessibilidade-btn:hover {
      background-color: #6b46c1;           /* tom escuro da cor primária */
    }
    .acessibilidade-btn i {
      pointer-events: none;
    }

    /* ===== PAINEL DE ACESSIBILIDADE ===== */
    .acessibilidade-panel {
      position: fixed;
      top: 50%;
      right: 48px;
      transform: translateY(-50%);
      background-color: #ffffff;           /* fundo branco */
      color: #2d3748;                      /* texto escuro */
      font-family: 'Poppins', sans-serif;
      padding: 18px 22px;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      z-index: 10000;
      display: none;
      min-width: 300px;
      max-height: 80vh;
      overflow-y: auto;
      line-height: 1.4;
    }
    .acessibilidade-panel.ativa {
      display: block;
      animation: fadeInPanel 0.2s ease-out;
    }
    @keyframes fadeInPanel {
      from { opacity: 0; transform: translateY(-48%) scale(0.95); }
      to   { opacity: 1; transform: translateY(-50%) scale(1); }
    }

    /* ===== ESTILO DOS FIELDSETS ===== */
    .acessibilidade-panel fieldset {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px 16px;
      margin-bottom: 14px;
    }
    .acessibilidade-panel legend {
      font-weight: 600;
      padding: 0 6px;
      font-size: 1em;
      color: #6b46c1;                   /* destaque com cor secundária */
    }

    /* ===== ESTILO DOS LABELS (CHECKBOX + TEXTO) ===== */
    .acessibilidade-panel label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      margin: 4px 0;
      padding: 0;
    }
    .acessibilidade-panel label input[type="checkbox"] {
      margin: 0;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .acessibilidade-panel label span {
      display: inline-block;
      font-weight: 400;
      white-space: nowrap;
      color: #2d3748;
    }

    /* ===== BOTÕES A+ / A− E RÓTULO DE "Fonte: XX%" ===== */
    .acessibilidade-panel .button-group {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 240px;
      flex-wrap: nowrap;
    }
    .acessibilidade-panel button {
      background-color: #9f7aea;         /* cor primária */
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-size: 0.95em;
      color: #fff;                       /* texto branco */
      white-space: nowrap;
      font-family: 'Poppins', sans-serif;
    }
    .acessibilidade-panel button:hover {
      background-color: #6b46c1;         /* tom escuro da cor primária */
    }
    .acessibilidade-panel button:focus {
      outline: 2px dashed #6b46c1;
      outline-offset: 2px;
    }
    .acessibilidade-panel select {
      width: 100%;
      padding: 6px 8px;
      margin-top: 6px;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 1em;
      background-color: #fff;
      font-family: 'Poppins', sans-serif;
      color: #2d3748;
    }

    /* ===== DESTAQUE AO PASSAR MOUSE / FOCO ===== */
    .acessibilidade-hover-highlight {
      outline: 2px dashed #6b46c1 !important;
    }

    /* ===== ESTILOS DE ALTO CONTRASTE ===== */
    .acessibilidade-contrast-high-dark * {
      background-color: #000 !important;
      color: #FFF !important;
      border-color: #FFF !important;
    }
    .acessibilidade-contrast-high-dark img {
      filter: brightness(0.8) contrast(1.2);
    }

    .acessibilidade-contrast-high-light * {
      background-color: #FFF !important;
      color: #000 !important;
      border: 2px solid #000 !important;
    }
    .acessibilidade-contrast-high-light img {
      filter: brightness(1) contrast(1);
    }

    /* ===== RESPONSIVIDADE DO PAINEL (TELAS < 600px) ===== */
    @media (max-width: 600px) {
      .acessibilidade-panel {
        min-width: 220px;
        right: 8px;
      }
      .acessibilidade-panel .button-group {
        min-width: 180px;
      }
      .acessibilidade-panel button {
        padding: 4px 8px;
        font-size: 0.9em;
      }
    }
  `;
  document.head.appendChild(style);

  // ── 2. CRIAÇÃO DO BOTÃO E DO PAINEL COM ÍCONE FONT-AWESOME ──
  const botao = document.createElement("div");
  botao.className = "acessibilidade-btn";
  botao.setAttribute("aria-label", "Abrir opções de acessibilidade");
  botao.innerHTML = `<i class="fa-solid fa-wheelchair"></i>`;
  document.body.appendChild(botao);

  const painel = document.createElement("div");
  painel.className = "acessibilidade-panel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.innerHTML = `
    <form>
      <!-- === LEITURA DE CONTEÚDO === -->
      <fieldset>
        <legend>Leitura de Conteúdo</legend>
        <label for="chkLeitura">
          <input type="checkbox" id="chkLeitura" />
          <span>Ativar leitura ao passar o mouse</span>
        </label>
      </fieldset>

      <!-- === ALTO CONTRASTE === -->
      <fieldset>
        <legend>Alto Contraste</legend>
        <label for="contrastSelect">Selecionar modo:</label>
        <select id="contrastSelect">
          <option value="none">Padrão</option>
          <option value="high-dark">Escuro (Fundo preto)</option>
          <option value="high-light">Claro (Fundo branco)</option>
        </select>
      </fieldset>

      <!-- === ALERTAS DE NOTIFICAÇÃO === -->
      <fieldset>
        <legend>Alertas de Notificação</legend>
        <label for="chkAlerts">
          <input type="checkbox" id="chkAlerts" />
          <span>Alertas sonoros/vibrar em notificações</span>
        </label>
      </fieldset>

      <!-- === TAMANHO DA FONTE === -->
      <fieldset>
        <legend>Tamanho da Fonte</legend>
        <div class="button-group">
          <button type="button" id="btnFontAumentar" aria-label="Aumentar fonte">A+</button>
          <button type="button" id="btnFontDiminuir" aria-label="Diminuir fonte">A−</button>
          <span id="fontLabel">Fonte: 100%</span>
        </div>
      </fieldset>

      <!-- === SELEÇÃO DE VOZ === -->
      <fieldset>
        <legend>Seleção de Voz</legend>
        <label for="voiceSelect">Escolha a voz:</label>
        <select id="voiceSelect"></select>
      </fieldset>
    </form>
  `;
  document.body.appendChild(painel);

  // ── 3. VARIÁVEIS DE ESTADO (localStorage) ──
  let leituraAtiva = localStorage.getItem("acessibilidadeAtiva") === "true";
  let contrasteSelecionado = localStorage.getItem("acessibilidadeContrast") || "none";
  let fontScale = parseFloat(localStorage.getItem("acessibilidadeFontScale")) || 1.0;
  let alertsAtivos = localStorage.getItem("acessibilidadeAlerts") === "true";
  let vozSelecionadaIndex = parseInt(localStorage.getItem("acessibilidadeVozIndex"), 10);
  if (isNaN(vozSelecionadaIndex)) vozSelecionadaIndex = null;

  // Elementos do painel
  const chkLeitura = painel.querySelector("#chkLeitura");
  const contrastSelect = painel.querySelector("#contrastSelect");
  const chkAlerts = painel.querySelector("#chkAlerts");
  const btnFontAumentar = painel.querySelector("#btnFontAumentar");
  const btnFontDiminuir = painel.querySelector("#btnFontDiminuir");
  const fontLabel = painel.querySelector("#fontLabel");
  const voiceSelect = painel.querySelector("#voiceSelect");

  // Ajusta os estados iniciais do painel
  chkLeitura.checked = leituraAtiva;
  contrastSelect.value = contrasteSelecionado;
  chkAlerts.checked = alertsAtivos;
  document.documentElement.style.fontSize = fontScale + "em";
  fontLabel.textContent = "Fonte: " + Math.round(fontScale * 100) + "%";
  aplicarContraste(contrasteSelecionado);

  // ── 4. CARREGAR VOZES PARA O <select> ──
  let vozesDisponiveis = [];
  function carregarVozes() {
    vozesDisponiveis = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";
    vozesDisponiveis.forEach((voz, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${voz.name} (${voz.lang})`;
      if (vozSelecionadaIndex === index) option.selected = true;
      voiceSelect.appendChild(option);
    });
  }
  window.speechSynthesis.onvoiceschanged = carregarVozes;

  // “Destrava” o TTS em mobile, falando um utterance vazio
  function initVozesMobile() {
    const tempUtter = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(tempUtter);
    setTimeout(carregarVozes, 200);
  }

  // ── 5. FUNÇÃO TEXT-TO-SPEECH ──
  function speak(texto) {
    if (!window.speechSynthesis || !texto) return;
    if (vozesDisponiveis.length === 0) {
      carregarVozes();
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (
      vozSelecionadaIndex !== null &&
      vozesDisponiveis[vozSelecionadaIndex]
    ) {
      utterance.voice = vozesDisponiveis[vozSelecionadaIndex];
    }
    window.speechSynthesis.speak(utterance);
  }

  // ── 6. EXTRAIR TEXTO PARA SER LIDO ──
  function extrairTextoParaLeitura(elemento) {
    if (elemento.hasAttribute("aria-label")) {
      return elemento.getAttribute("aria-label").trim();
    }
    if (elemento.tagName.toLowerCase() === "img" && elemento.alt) {
      return elemento.alt.trim();
    }
    if (
      (elemento.tagName.toLowerCase() === "button" ||
       elemento.tagName.toLowerCase() === "a") &&
      elemento.title
    ) {
      return elemento.title.trim();
    }
    const tag = elemento.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      const val = elemento.value;
      if (val && val.trim().length > 0) {
        return val.trim();
      }
      if (elemento.placeholder) {
        return elemento.placeholder.trim();
      }
      return null;
    }
    const texto = elemento.innerText || elemento.textContent;
    if (texto && texto.trim().length > 0) {
      return texto.trim();
    }
    return null;
  }

  // ── 7. LEITURA AO PASSAR MOUSE / FOCAR ──
  let ultimoElementoLido = null;
  function onElementRead(e) {
    if (!leituraAtiva) return;
    const alvo = e.target;
    if (painel.contains(alvo) || botao.contains(alvo)) return;
    if (alvo === ultimoElementoLido) return;
    const texto = extrairTextoParaLeitura(alvo);
    if (texto) {
      alvo.classList.add("acessibilidade-hover-highlight");
      speak(texto);
      ultimoElementoLido = alvo;
    }
  }
  function onElementOut(e) {
    if (!leituraAtiva) return;
    const alvo = e.target;
    alvo.classList.remove("acessibilidade-hover-highlight");
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    ultimoElementoLido = null;
  }

  // ── 8. ATIVAR/DESATIVAR LEITURA ──
  function aplicarModoLeitura(ativar) {
    leituraAtiva = ativar;
    localStorage.setItem("acessibilidadeAtiva", ativar ? "true" : "false");
    if (ativar) {
      document.body.addEventListener("mouseover", onElementRead, true);
      document.body.addEventListener("mouseout", onElementOut, true);
      document.body.addEventListener("focusin", onElementRead, true);
      document.body.addEventListener("focusout", onElementOut, true);
    } else {
      document.body.removeEventListener("mouseover", onElementRead, true);
      document.body.removeEventListener("mouseout", onElementOut, true);
      document.body.removeEventListener("focusin", onElementRead, true);
      document.body.removeEventListener("focusout", onElementOut, true);
      document
        .querySelectorAll(".acessibilidade-hover-highlight")
        .forEach((el) => el.classList.remove("acessibilidade-hover-highlight"));
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      ultimoElementoLido = null;
    }
  }

  // ── 9. APLICAR CONTRASTE ──
  function aplicarContraste(mode) {
    document.body.classList.remove(
      "acessibilidade-contrast-high-dark",
      "acessibilidade-contrast-high-light"
    );
    contrasteSelecionado = mode;
    localStorage.setItem("acessibilidadeContrast", mode);
    if (mode === "high-dark") {
      document.body.classList.add("acessibilidade-contrast-high-dark");
    } else if (mode === "high-light") {
      document.body.classList.add("acessibilidade-contrast-high-light");
    }
  }

  // ── 10. AJUSTAR TAMANHO DE FONTE ──
  function ajustarFonte(factor) {
    fontScale = Math.max(0.5, Math.min(2.0, fontScale * factor));
    localStorage.setItem("acessibilidadeFontScale", fontScale.toString());
    document.documentElement.style.fontSize = fontScale + "em";
    fontLabel.textContent = "Fonte: " + Math.round(fontScale * 100) + "%";
  }

  // ── 11. ALERTAS SONOROS/VIBRAÇÃO EM TOASTS ──
  function aplicarAlerts(ativar) {
    alertsAtivos = ativar;
    localStorage.setItem("acessibilidadeAlerts", ativar ? "true" : "false");
  }
  const observer = new MutationObserver((mutations) => {
    if (!alertsAtivos) return;
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (
          node.nodeType === 1 &&
          node.classList.contains("toast") &&
          node.innerText.trim()
        ) {
          speak(node.innerText.trim());
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── 12. CONFIGURAÇÃO INICIAL (localStorage) ──
  if (leituraAtiva) aplicarModoLeitura(true);
  aplicarContraste(contrasteSelecionado);

  // ── 13. ABRIR/FECHAR O PAINEL (SOBREPONDO) ──
  botao.addEventListener("click", (e) => {
    e.stopPropagation();
    painel.classList.toggle("ativa");

    // Toda vez que abrir o painel, destrava TTS em mobile:
    if (vozesDisponiveis.length === 0) {
      initVozesMobile();
    }

    if (painel.classList.contains("ativa")) {
      setTimeout(() => chkLeitura.focus(), 50);
    }
  });

  chkLeitura.addEventListener("change", () => {
    aplicarModoLeitura(chkLeitura.checked);
  });

  contrastSelect.addEventListener("change", () => {
    aplicarContraste(contrastSelect.value);
  });

  chkAlerts.addEventListener("change", () => {
    aplicarAlerts(chkAlerts.checked);
  });

  btnFontAumentar.addEventListener("click", () => {
    ajustarFonte(1.1);
  });

  btnFontDiminuir.addEventListener("click", () => {
    ajustarFonte(0.9);
  });

  voiceSelect.addEventListener("change", () => {
    vozSelecionadaIndex = parseInt(voiceSelect.value, 10);
    localStorage.setItem("acessibilidadeVozIndex", vozSelecionadaIndex);
    speak("Este é um teste de voz.");
  });

  // Fecha painel ao clicar fora
  document.addEventListener("click", (e) => {
    if (
      painel.classList.contains("ativa") &&
      !painel.contains(e.target) &&
      !botao.contains(e.target)
    ) {
      painel.classList.remove("ativa");
    }
  });

  // Fecha painel ao pressionar ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && painel.classList.contains("ativa")) {
      painel.classList.remove("ativa");
      botao.focus();
    }
  });
})();
