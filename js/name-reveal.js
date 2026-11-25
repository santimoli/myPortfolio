/*!
 * name-reveal.js
 * "Santiago M. Sánchez" → ao passar o rato (ou tocar) no "M.", escreve-se "olina"
 * letra a letra com um cursor coral, como a listagem da capa. É só visual: o nome
 * completo está no .sr-only do <h1>, para leitores de ecrã.
 * Ao sair, apaga-se para trás e o ponto volta.
 *
 * Funciona como um pequeno motor de estados: há um "alvo" (0 ou N letras visíveis)
 * e um único temporizador que dá um passo de cada vez em direção ao alvo.
 * Assim, entrar e sair rapidamente nunca deixa a animação num estado partido.
 */
(function () {
  "use strict";

  const TYPE_MS = 45;    // tempo por letra ao escrever
  const DELETE_MS = 28;  // tempo por letra ao apagar (mais rápido, como um backspace)
  const HOVER_LEAVE_MS = 120;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function init(trigger) {
    const restText = trigger.dataset.rest || "";       // "olina"
    const rest = trigger.querySelector(".name-rest");   // onde as letras aparecem
    const hero = trigger.closest(".hero");
    const hoverRegion = trigger.closest(".hero-name") || trigger;

    let shown = 0;       // letras atualmente visíveis
    let target = 0;      // letras que queremos visíveis
    let timer = null;
    let hoverCloseTimer = null;
    let mouseHovering = false;
    let mouseX = -1;
    let mouseY = -1;
    let lastPointerType = "mouse";

    function render() {
      rest.textContent = restText.slice(0, shown);
      // O ponto da abreviatura só aparece com o nome recolhido.
      trigger.classList.toggle("is-expanded", shown > 0);
      trigger.classList.toggle("is-typing", shown !== target);
    }

    function step() {
      timer = null;
      if (shown === target) {
        render();
        return;
      }
      shown += shown < target ? 1 : -1;
      render();
      timer = setTimeout(step, shown < target ? TYPE_MS : DELETE_MS);
    }

    function setOpen(open) {
      target = open ? restText.length : 0;
      trigger.classList.toggle("is-active", open);
      if (hero) hero.classList.toggle("name-active", open);

      if (prefersReducedMotion()) {
        clearTimeout(timer);
        timer = null;
        shown = target;
        render();
        return;
      }
      if (!timer) step();
      else render();
    }

    const isOpen = () => target > 0;

    function pointerIsInName() {
      const bounds = hoverRegion.getBoundingClientRect();
      return mouseX > bounds.left && mouseX < bounds.right &&
        mouseY > bounds.top && mouseY < bounds.bottom;
    }

    function scheduleHoverClose() {
      clearTimeout(hoverCloseTimer);
      hoverCloseTimer = setTimeout(() => {
        // O span muda de largura enquanto escreve: confirma a posição do rato contra o
        // título (que não muda) depois de o layout assentar, em vez de confiar no pointerleave.
        if (pointerIsInName()) return;
        mouseHovering = false;
        setOpen(false);
      }, HOVER_LEAVE_MS);
    }

    // Rato: hover. (Toque e caneta usam o clique, para não abrir e fechar no mesmo gesto.)
    trigger.addEventListener("pointerdown", (event) => {
      lastPointerType = event.pointerType || "mouse";
    });
    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      mouseHovering = true;
      clearTimeout(hoverCloseTimer);
      setOpen(true);
    });
    hoverRegion.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      scheduleHoverClose();
    });
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !mouseHovering) return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (pointerIsInName()) clearTimeout(hoverCloseTimer);
      else scheduleHoverClose();
    });

    // Toque: alterna.
    trigger.addEventListener("click", () => {
      if (lastPointerType !== "mouse") setOpen(!isOpen());
      lastPointerType = "mouse";
    });

    // Tocar fora fecha (telemóvel).
    document.addEventListener("pointerdown", (event) => {
      if (isOpen() && !trigger.contains(event.target)) {
        setOpen(false);
      }
    });

    render();
  }

  function autoInit() {
    document.querySelectorAll(".name-middle[data-rest]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
