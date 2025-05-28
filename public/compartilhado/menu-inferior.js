// menu-inferior.js — FOOTER completo (HTML, CSS e JS)
;(function(){
  document.addEventListener("DOMContentLoaded", () => {
    // 1) Define as páginas
    const pages = [
      { icon: "fa-house",          label: "Início",    href: "painel.html"    },
      { icon: "fa-calendar-days",  label: "Festas",    href: "festas.html"    },
      { icon: "fa-list-check",     label: "Checklist", href: "checklist.html" },
      { icon: "fa-envelope",       label: "Convites",  href: "convites.html"  }, // ícone trocado aqui
      { icon: "fa-utensils",       label: "Cardápios", href: "cardapios.html" },
    ];

    // 2) Injeta o estilo
    if (!document.getElementById("mi-style")) {
      const style = document.createElement("style");
      style.id = "mi-style";
      style.textContent = `
        #bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: var(--bg-white);
          border-top: 1px solid #E2E8F0;
          height: var(--nav-height);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }
        .nav-list {
          display: flex;
          width: 100%;
          max-width: 480px;
          justify-content: space-around;
        }
        .nav-item {
          flex: 1;
          text-align: center;
          color: var(--text-light);
          font-size: 0.75rem;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          cursor: pointer;
          transition: color var(--transition);
        }
        .nav-item i {
          font-size: 1.25rem;
        }
        .nav-item.active,
        .nav-item:hover {
          color: var(--clr-primary);
        }
      `;
      document.head.appendChild(style);
    }

    // 3) Injeta o HTML
    if (!document.getElementById("bottom-nav")) {
      const nav = document.createElement("nav");
      nav.id = "bottom-nav";

      const ul = document.createElement("ul");
      ul.className = "nav-list";

      const current = location.pathname.split("/").pop();

      pages.forEach((p) => {
        const li = document.createElement("li");
        li.className = "nav-item" + (current === p.href ? " active" : "");
        li.innerHTML = `<i class="fa-solid ${p.icon}"></i><span>${p.label}</span>`;
        li.addEventListener("click", () => {
          if (current !== p.href) location.href = p.href;
        });
        ul.appendChild(li);
      });

      nav.appendChild(ul);
      document.body.appendChild(nav);
    }
  });
})();
