// public/paginas/painel.js

document.addEventListener("DOMContentLoaded", () => {
  // 1) SLIDER
  const slider = document.querySelector(".banner-slider");
  if (slider) {
    const slides = Array.from(slider.querySelectorAll(".slide"));
    const dots   = Array.from(slider.querySelectorAll(".dot"));
    if (slides.length === dots.length && slides.length) {
      let current = 0, interval;

      const showSlide = idx => {
        slides.forEach((s,i) => s.classList.toggle("active", i===idx));
        dots.forEach((d,i)   => d.classList.toggle("active", i===idx));
        current = idx;
      };
      const start = () => interval = setInterval(() => showSlide((current+1)%slides.length), 5000);
      const stop  = () => clearInterval(interval);

      start();
      dots.forEach(dot => dot.addEventListener("click", () => {
        stop(); showSlide(+dot.dataset.index); start();
      }));
      document.addEventListener("visibilitychange", () =>
        document.hidden ? stop() : start()
      );
    }
  }

  // 2) USUÁRIO (Supabase)
  (async ()=>{
    try {
      const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"
      );
      const supabase = createClient(
        "https://zrfgitzipulplvxihpik.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      );
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        const nome = data.user.user_metadata?.nome_completo || data.user.email;
        document.getElementById("user-name").textContent = nome;
      }
    } catch(e) {
      console.error("Supabase error:", e);
    }
  })();

  // 3) GRÁFICO (Chart.js)
  const canvas = document.getElementById("overviewChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jan","Fev","Mar","Abr","Mai","Jun"],
        datasets: [{
          label: "Festas",
          data: [3,5,2,8,6,4],
          borderColor: "#9F7AEA",
          backgroundColor: "rgba(159,122,234,0.2)",
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "#eee" } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
});
