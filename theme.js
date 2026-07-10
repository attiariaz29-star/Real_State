(function() {
  const saved = localStorage.getItem("nestfinder_theme") || "light";
  document.documentElement.setAttribute("data-bs-theme", saved);
  
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("themeToggle");
    const icon = document.getElementById("themeIcon");
    if (!toggle || !icon) return;
    
    function updateIcon(t) {
      icon.className = t === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      toggle.classList.toggle("btn-outline-warning", t === "dark");
      toggle.classList.toggle("btn-outline-light",   t !== "dark");
    }
    
    updateIcon(saved);
    
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-bs-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-bs-theme", next);
      localStorage.setItem("nestfinder_theme", next);
      updateIcon(next);
      // Dispatch custom event to let other scripts know the theme changed (e.g. charts)
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    });
  });
})();
