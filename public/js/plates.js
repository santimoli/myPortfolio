/*!
 * plates.js
 * Visor das pranchas (Fig. 1–4): clicar numa miniatura abre-a em grande
 * num <dialog> nativo; ← → passa entre os itens da mesma prancha, Esc fecha.
 * Itens com data-type="video" tocam no visor (com controlos). Na página, a
 * miniatura de vídeo toca sozinha, sem som e em loop, só enquanto está visível
 * (e só descarrega quando chega ao ecrã); com reduced-motion fica na capa.
 * Sem JS, cada miniatura continua a ser um link para o ficheiro.
 */
(function () {
  "use strict";

  function init() {
    const viewer = document.querySelector(".viewer");
    if (!viewer || typeof viewer.showModal !== "function") return;

    const image = viewer.querySelector(".viewer-img");
    const video = viewer.querySelector(".viewer-video");
    const caption = viewer.querySelector(".viewer-caption");
    const stepButtons = Array.from(viewer.querySelectorAll("[data-step]"));
    let items = [];
    let index = 0;
    let opener = null; // miniatura que abriu o visor: recebe o foco quando ele fecha

    function stopVideo() {
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load(); // liberta o ficheiro
      video.hidden = true;
    }

    function show(i) {
      index = (i + items.length) % items.length;
      const item = items[index];
      const media = item.querySelector("img, video");
      const description = media.getAttribute("alt") || media.getAttribute("aria-label") || "";
      caption.textContent = item.dataset.caption || "";

      if (item.dataset.type === "video" && video) {
        image.hidden = true;
        video.hidden = false;
        video.poster = item.dataset.poster || "";
        video.src = item.getAttribute("href");
        video.setAttribute("aria-label", description);
        video.play().catch(() => { /* o browser pode exigir o clique no play */ });
      } else {
        stopVideo();
        image.hidden = false;
        image.src = item.getAttribute("href");
        image.alt = description;
      }
    }

    document.querySelectorAll(".plate").forEach((plate) => {
      const plateItems = Array.from(plate.querySelectorAll(".plate-item"));
      plateItems.forEach((item, i) => {
        item.addEventListener("click", (event) => {
          event.preventDefault();
          items = plateItems;
          opener = item;
          // Com um só item não há para onde andar: sem botões ← →.
          stepButtons.forEach((button) => { button.hidden = items.length < 2; });
          show(i);
          viewer.showModal();
        });
      });
    });

    viewer.addEventListener("keydown", (event) => {
      // Nos controlos do vídeo, as setas avançam/recuam no vídeo; não mudam de item.
      if (items.length < 2 || event.target === video) return;
      if (event.key === "ArrowRight") show(index + 1);
      else if (event.key === "ArrowLeft") show(index - 1);
    });

    viewer.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button && button.dataset.step) show(index + Number(button.dataset.step));
      else if (button && "close" in button.dataset) viewer.close();
      else if (event.target === viewer) viewer.close(); // clique no fundo escurecido
    });

    // Fechar o visor (Esc, botão ou fundo) pára o vídeo e devolve o foco à miniatura.
    viewer.addEventListener("close", () => {
      stopVideo();
      if (opener) opener.focus();
    });

    // --- Miniaturas de vídeo a tocar na página ------------------------------------

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const thumbs = Array.from(document.querySelectorAll(".plate-video video"));
    if (thumbs.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const thumb = entry.target;
          const shouldPlay = entry.isIntersecting && !reducedMotion.matches && !viewer.open;
          if (shouldPlay) thumb.play().catch(() => { /* fica na capa */ });
          else thumb.pause();
          thumb.closest(".plate-video").classList.toggle("is-playing", shouldPlay);
        });
      }, { threshold: 0.25 });
      thumbs.forEach((thumb) => observer.observe(thumb));
      // Se o reduced-motion mudar com a página aberta, volta a decidir se toca.
      reducedMotion.addEventListener("change", () => thumbs.forEach((thumb) => {
        observer.unobserve(thumb);
        observer.observe(thumb);
      }));

      // Enquanto o visor está aberto, a miniatura não toca em paralelo.
      viewer.addEventListener("close", () => thumbs.forEach((thumb) => {
        observer.unobserve(thumb);
        observer.observe(thumb); // reavalia se volta a tocar
      }));
      document.querySelectorAll(".plate-video").forEach((item) => {
        item.addEventListener("click", () => thumbs.forEach((thumb) => thumb.pause()));
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
