// public/compartilhado/toast.js
;(function(){
  // 1. Injeta o CSS de Toast, Modal e Loader
  const css = `
    /* Toast Container */
    #toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 10000;
    }
    /* Toast Item */
    .toast {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 200px;
      max-width: 350px;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      color: #fff;
      background: #4299E1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: 'Poppins', sans-serif;
      animation: slideIn 0.3s ease;
      opacity: 1;
      transition: opacity 0.3s ease;
      touch-action: pan-y;
      user-select: none;
    }
    .toast span { flex: 1; font-size: 0.95rem; }
    .toast .close-btn {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .toast.info    { background: #4299E1; }
    .toast.success { background: #48BB78; }
    .toast.warning { background: #ED8936; }
    .toast.error   { background: #F56565; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    /* Loader Overlay */
    #loader-overlay {
      position: fixed;
      inset: 0;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #9F7AEA;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    /* Modal Overlay */
    #modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    #modal-box {
      background: #fff;
      border-radius: 0.5rem;
      padding: 1.5rem;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-family: 'Poppins', sans-serif;
    }
    #modal-box p {
      margin-bottom: 1.25rem;
      color: #2D3748;
      font-size: 1rem;
    }
    #modal-box .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    #modal-box .confirm {
      background: #4299E1;
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
    }
    #modal-box .cancel {
      background: #E2E8F0;
      color: #2D3748;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
    }
    /* Responsivo */
    @media (max-width: 480px) {
      #toast-container { top: 0.5rem; right: 0.5rem; }
      .toast { font-size: 0.9rem; min-width: 160px; }
      #modal-box { padding: 1rem; }
      #modal-box p { font-size: 0.95rem; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // 2. Cria container de toasts e loader
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);

  const loader = document.createElement('div');
  loader.id = 'loader-overlay';
  loader.innerHTML = `<div class="spinner"></div>`;
  document.body.appendChild(loader);

  // 3. Loader até tudo carregar
  window.addEventListener('load', () => {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 300);
  });

  // 4. Fila e throttling
  const queue = [];
  const MAX_VISIBLE = 3;

  function processQueue() {
    while (container.children.length < MAX_VISIBLE && queue.length) {
      const { message, options } = queue.shift();
      createToast(message, options);
    }
  }

  function removeToast(el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      processQueue();
    }, 300);
  }

  // 5. Criação de um único toast com ARIA, swipe e foco
  let focusIndex = 0;
  function createToast(message, options) {
    const { type = 'info', duration = 3000 } = options;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role','alert');
    toast.setAttribute('aria-live','assertive');
    toast.setAttribute('tabindex','0');
    toast.innerHTML = `
      <span>${message}</span>
      <button class="close-btn" aria-label="Fechar">&times;</button>
    `;
    container.appendChild(toast);

    // Remoção manual
    toast.querySelector('.close-btn').addEventListener('click', () => removeToast(toast));

    // Remoção automática
    const timer = setTimeout(() => removeToast(toast), duration);

    // Pausa timer no hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(() => removeToast(toast), duration));

    // Swipe para remover (mobile)
    let startX = 0;
    toast.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    toast.addEventListener('touchend', e => {
      const deltaX = e.changedTouches[0].clientX - startX;
      if (Math.abs(deltaX) > 50) removeToast(toast);
    });

    // Foco para teclas
    toast.addEventListener('focus', () => {
      focusIndex = Array.from(container.children).indexOf(toast);
    });
  }

  // 6. API de showToast
  window.showToast = (message, options = {}) => {
    queue.push({ message, options });
    processQueue();
  };

  // 7. Fechar com Esc e navegar com setas
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      Array.from(container.children).forEach(el => removeToast(el));
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const toasts = Array.from(container.children);
      if (!toasts.length) return;
      focusIndex = e.key === 'ArrowDown'
        ? Math.min(focusIndex + 1, toasts.length - 1)
        : Math.max(focusIndex - 1, 0);
      toasts[focusIndex].focus();
    }
  });

  // 8. API de Modal de confirmação (sem alterações)
  window.showConfirm = message => new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div id="modal-box">
        <p>${message}</p>
        <div class="modal-buttons">
          <button class="cancel">Não</button>
          <button class="confirm">Sim</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const box = overlay.querySelector('#modal-box'),
          clean = res => { overlay.remove(); resolve(res); };
    box.querySelector('.confirm').addEventListener('click', () => clean(true));
    box.querySelector('.cancel').addEventListener('click',  () => clean(false));
    overlay.addEventListener('click', e => e.target === overlay && clean(false));
  });

  // Remove toast interno para uso de teclado navigation
  function removeToast(el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      processQueue();
    }, 300);
  }
})();
