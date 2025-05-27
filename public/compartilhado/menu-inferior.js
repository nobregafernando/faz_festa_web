// public/compartilhado/menu-inferior.js
;(function(){
  document.addEventListener("DOMContentLoaded", () => {
    const pages = [
      { icon: "fa-house",            label: "Início",     href: "painel.html"    },
      { icon: "fa-calendar-days",    label: "Festas",     href: "festas.html"    },
      { icon: "fa-list-check",       label: "Checklist",  href: "checklist.html" },
      { icon: "fa-handshake-angle",  label: "Parceiros",  href: "parceiros.html" },
      { icon: "fa-utensils",         label: "Cardápios",  href: "cardapios.html" },
    ];

    const nav = document.createElement("nav");
    nav.id = "bottom-nav";
    const ul = document.createElement("ul");
    ul.className = "nav-list";

    const current = window.location.pathname.split("/").pop();
    pages.forEach(p => {
      const li = document.createElement("li");
      li.className = "nav-item" + (current === p.href ? " active" : "");
      li.innerHTML = `<i class="fa-solid ${p.icon}"></i><span>${p.label}</span>`;
      li.addEventListener("click", () => {
        if (current !== p.href) window.location.href = p.href;
      });
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    document.body.appendChild(nav);
  });
})();
