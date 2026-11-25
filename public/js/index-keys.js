/*!
 * index-keys.js
 * Índice flutuante operado como um teclado:
 *  - a tecla da secção que está a ser lida acende (aria-current);
 *  - premir 0–4 no teclado afunda a tecla e salta para a secção,
 *    com o foco no título dela (para quem usa leitor de ecrã).
 */
(function () {
  "use strict";

  function init() {
    const keys = Array.from(document.querySelectorAll(".ikey[data-key]"));
    if (keys.length === 0) return;

    const sectionOf = (key) => document.querySelector(key.getAttribute("href"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // --- Tecla acesa -----------------------------------------------------------

    function setCurrent(id) {
      keys.forEach((key) => {
        if (key.getAttribute("href") === "#" + id) key.setAttribute("aria-current", "true");
        else key.removeAttribute("aria-current");
      });
    }

    if ("IntersectionObserver" in window) {
      // Conta como "a ser lida" a secção que atravessa uma faixa estreita a ~40% da altura.
      // A capa também é observada: lá, nenhuma tecla fica acesa.
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      }, { rootMargin: "-40% 0px -55% 0px" });

      const hero = document.querySelector(".hero");
      if (hero) observer.observe(hero);
      keys.map(sectionOf).filter(Boolean).forEach((section) => observer.observe(section));
    }

    // A última secção é curta: no fim da página nunca chega à faixa dos 40%.
    // Quando já não há mais para descer, acende a última tecla.
    const lastKey = keys[keys.length - 1];
    window.addEventListener("scroll", () => {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atBottom) setCurrent(sectionOf(lastKey).id);
    }, { passive: true });

    // --- Atalhos 0–4 -----------------------------------------------------------

    function go(key) {
      const section = sectionOf(key);
      if (!section) return;
      setCurrent(section.id);
      section.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      // URL completo: "#id" sozinho seria resolvido contra um eventual <base href>.
      history.replaceState(null, "", location.href.split("#")[0] + key.getAttribute("href"));
      const heading = section.querySelector("h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    }

    function shouldIgnore(event) {
      const target = event.target;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      // Com o visor de imagens aberto, as teclas pertencem ao visor.
      const dialogOpen = Boolean(document.querySelector("dialog[open]"));
      return event.ctrlKey || event.metaKey || event.altKey || typing || dialogOpen;
    }

    const findKey = (event) => keys.find((key) => key.dataset.key === event.key);

    // keydown afunda a tecla; keyup solta-a e navega (como uma tecla real).
    document.addEventListener("keydown", (event) => {
      if (event.repeat || shouldIgnore(event)) return;
      const key = findKey(event);
      if (!key) return;
      event.preventDefault();
      key.classList.add("is-pressed");
    });

    document.addEventListener("keyup", (event) => {
      const key = findKey(event);
      if (!key || !key.classList.contains("is-pressed")) return;
      key.classList.remove("is-pressed");
      go(key);
    });

    window.addEventListener("blur", () => keys.forEach((key) => key.classList.remove("is-pressed")));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
