// menu-superior.js — HEADER completo (HTML, CSS e JS)
import supabase from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Injeta o estilo
  if (!document.getElementById("ms-style")) {
    const style = document.createElement("style");
    style.id = "ms-style";
    style.textContent = `
      .app-header {
        position: sticky;
        top: 0; left: 0; right: 0;
        z-index: 100;
        background: var(--bg-light);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--gutter) calc(2 * var(--gutter));
        margin: 0 calc(-1 * var(--gutter));
        width: calc(100% + 2 * var(--gutter));
        border-bottom-left-radius: var(--radius);
        border-bottom-right-radius: var(--radius);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      .app-header .header-left {
        display: flex;
        align-items: center;
        font-size: 1rem;
        color: var(--text-dark);
      }
      .app-header .logo-text {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--clr-primary);
      }
      .app-header .greeting {
        margin-left: 0.5rem;
      }
      .app-header .greeting strong {
        color: var(--clr-secondary);
        font-weight: 600;
      }
      .app-header .user-card {
        width: 2.4rem; height: 2.4rem;
        border-radius: 50%;
        background: var(--bg-white);
        border: 1px solid #E2E8F0;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: box-shadow var(--transition);
      }
      .app-header .user-card i {
        font-size: 1rem;
        color: var(--text-dark);
      }
      .app-header .user-card:hover {
        box-shadow: 0 0 0 3px rgba(159,122,234,0.35);
      }
    `;
    document.head.appendChild(style);
  }

  // 2) Injeta o HTML
  if (!document.querySelector(".app-header")) {
    const header = document.createElement("header");
    header.className = "app-header";
    header.innerHTML = `
      <div class="header-left">
        <span class="logo-text">fazFestas</span>
        <span class="greeting">Olá,&nbsp;<strong id="user-name">Usuário</strong>!</span>
      </div>
      <div class="header-right">
        <button class="user-card" id="btn-profile" title="Perfil / Sair">
          <i class="fa-solid fa-user"></i>
        </button>
      </div>
    `;
    document.body.prepend(header);
  }

  // 3) Puxa o nome real do Supabase
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const firstName = session?.user?.user_metadata?.nome_completo?.split(" ")[0];
    if (firstName) document.getElementById("user-name").textContent = firstName;
  } catch {
    /* falhou, fica “Usuário” */
  }

  // 4) Logout no clique do avatar
  document.getElementById("btn-profile").addEventListener("click", async () => {
    if (confirm("Deseja sair da conta?")) {
      await supabase.auth.signOut();
      location.href = new URL("/autenticacao/login.html", location.origin);
    }
  });
});
