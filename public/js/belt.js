/*!
 * belt.js
 * Passadeira de tecnologias no §2: cada fila desliza em loop (CSS), em sentidos alternados.
 *  - duplica o conteúdo de cada fila para o loop não ter emenda (a cópia é escondida
 *    de leitores de ecrã e não recebe foco);
 *  - pára com hover, com foco e com a tecla Pause;
 *  - mostra numa linha fixa em que projeto cada tecnologia foi usada (só as ligadas a um projeto).
 * Sem JS, ou com prefers-reduced-motion, os chips ficam parados em linhas normais.
 */
(function () {
  "use strict";

  function init() {
    const belt = document.querySelector(".belt");
    if (!belt) return;

    const readout = belt.querySelector(".belt-readout");
    const pauseButton = belt.querySelector(".belt-pause");
    const defaultText = readout.textContent;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // --- Loop sem emenda --------------------------------------------------------

    belt.querySelectorAll(".belt-track").forEach((track) => {
      Array.from(track.children).forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("a").forEach((link) => link.setAttribute("tabindex", "-1"));
        track.appendChild(copy);
      });
    });

    function updateMotion() {
      belt.classList.toggle("is-running", !reducedMotion.matches);
      pauseButton.hidden = reducedMotion.matches;
    }
    reducedMotion.addEventListener("change", updateMotion);
    updateMotion();

    // --- Pausa ------------------------------------------------------------------

    pauseButton.addEventListener("click", () => {
      const paused = belt.classList.toggle("is-paused");
      pauseButton.setAttribute("aria-pressed", String(paused));
      pauseButton.textContent = paused ? "Play" : "Pause";
    });

    // --- Onde foi usada ----------------------------------------------------------

    // Só os chips ligados a um projeto (data-used) mudam a linha; os outros não afirmam nada.
    function describe(chip) {
      readout.textContent = chip && chip.dataset.used
        ? `${chip.textContent}: used in ${chip.dataset.used}`
        : defaultText;
    }

    belt.addEventListener("pointerover", (event) => describe(event.target.closest(".chip")));
    belt.addEventListener("focusin", (event) => describe(event.target.closest(".chip")));
    belt.addEventListener("pointerleave", () => describe(null));
    belt.addEventListener("focusout", (event) => {
      if (!belt.contains(event.relatedTarget)) describe(null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
