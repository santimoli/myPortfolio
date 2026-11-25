/*!
 * social-keys.js
 * Comportamento das teclas 3D das redes sociais:
 *  - carrega os ícones (e mostra a letra se o ficheiro não existir);
 *  - a tecla de email copia o endereço e oferece "Abrir no email";
 *  - atalhos de teclado reais (G, L, E) que afundam a tecla e executam a ação.
 * Sem dependências. Inicializa-se sozinho para cada <nav class="social-keys">.
 * Os atalhos usam apenas a PRIMEIRA fila de teclas da página (evita abrir duas abas).
 */
(function () {
  "use strict";

  const COPIED_VISIBLE_MS = 2500;   // tempo do balão "Email copiado"
  const FALLBACK_VISIBLE_MS = 8000; // tempo do balão quando a cópia falha

  // Ícone genérico de envelope (desenhado aqui; os logótipos vêm dos ficheiros oficiais).
  const ENVELOPE_SVG =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' " +
    "stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
    "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='m3 7 9 6 9-6'/></svg>";
  const BUILT_IN_ICONS = {
    envelope: "data:image/svg+xml," + encodeURIComponent(ENVELOPE_SVG),
  };

  // ---------------------------------------------------------------------------
  // Ícones
  // ---------------------------------------------------------------------------

  // data-icon pode ser um caminho (icons/github.svg) ou um ícone interno ("envelope").
  function loadIcon(key) {
    const source = key.dataset.icon;
    if (!source) {
      key.classList.add("icon-missing");
      return;
    }
    // URL absoluto: um url() relativo dentro de --icon seria resolvido a partir de
    // css/social-keys.css (onde a máscara é usada), não a partir da página.
    const url = BUILT_IN_ICONS[source] || new URL(source, document.baseURI).href;

    // Aberto como ficheiro local (file://), o browser bloqueia máscaras de outros
    // ficheiros: mostra a letra em vez de uma tecla vazia.
    if (location.protocol === "file:" && !BUILT_IN_ICONS[source]) {
      key.classList.add("icon-missing");
      return;
    }
    key.style.setProperty("--icon", 'url("' + url + '")');

    // Se o ficheiro falhar, mostra a letra em vez de um quadrado colorido.
    const probe = new Image();
    probe.onerror = () => key.classList.add("icon-missing");
    probe.src = url;
  }

  // ---------------------------------------------------------------------------
  // Email: copiar + balão
  // ---------------------------------------------------------------------------

  function createPopContent(email, copied) {
    const parts = [];

    if (copied) {
      const status = document.createElement("span");
      status.textContent = "Email copied ✓";
      parts.push(status);
    } else {
      // A cópia foi bloqueada pelo browser: mostra o endereço para seleção manual.
      const address = document.createElement("span");
      address.className = "key-pop-address";
      address.textContent = email;
      parts.push(address);
    }

    const mailLink = document.createElement("a");
    mailLink.href = "mailto:" + email;
    mailLink.textContent = "Open in mail app";
    parts.push(mailLink);

    return parts;
  }

  function createEmailHandler(nav, pop) {
    let hideTimer = null;

    function hidePop() {
      clearTimeout(hideTimer);
      pop.hidden = true;
      nav.classList.remove("pop-open");
    }

    function showPop(email, copied) {
      clearTimeout(hideTimer);
      pop.replaceChildren(...createPopContent(email, copied));
      pop.hidden = false;
      nav.classList.add("pop-open");
      hideTimer = setTimeout(hidePop, copied ? COPIED_VISIBLE_MS : FALLBACK_VISIBLE_MS);
    }

    // Esc fecha o balão; um clique fora também.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !pop.hidden) hidePop();
    });
    document.addEventListener("click", (event) => {
      if (!pop.hidden && !nav.contains(event.target)) hidePop();
    });

    return function copyEmail(key) {
      const email = key.dataset.email;
      // writeText tem de ser chamado diretamente no gesto do utilizador.
      const copyAttempt = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(email)
        : Promise.reject(new Error("Clipboard API indisponível"));

      copyAttempt.then(
        () => showPop(email, true),
        () => showPop(email, false)
      );
    };
  }

  // ---------------------------------------------------------------------------
  // Atalhos de teclado (G, L, E)
  // ---------------------------------------------------------------------------

  function isTypingTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
  }

  function shouldIgnore(event) {
    // Com o visor de imagens aberto, as teclas pertencem ao visor.
    const dialogOpen = Boolean(document.querySelector("dialog[open]"));
    return event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target) || dialogOpen;
  }

  function bindShortcuts(keys) {
    const findKey = (event) => {
      const pressed = (event.key || "").toLowerCase();
      return keys.find((key) => key.dataset.key === pressed);
    };

    // keydown afunda a tecla; keyup "solta-a" e executa a ação (como uma tecla real).
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
      key.click(); // link: abre o separador; botão de email: copia
    });

    // Se a janela perder o foco com uma tecla carregada, solta-a.
    window.addEventListener("blur", () => {
      keys.forEach((key) => key.classList.remove("is-pressed"));
    });
  }

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------

  function initNav(nav) {
    const keys = Array.from(nav.querySelectorAll(".key"));
    keys.forEach(loadIcon);

    const pop = nav.querySelector(".key-pop");
    if (pop) {
      const copyEmail = createEmailHandler(nav, pop);
      keys
        .filter((key) => key.dataset.email)
        .forEach((key) => key.addEventListener("click", () => copyEmail(key)));
    }
    return keys;
  }

  function autoInit() {
    const keys = Array.from(document.querySelectorAll(".social-keys")).flatMap(initNav);
    // Só a fila com data-key (a do In short) responde aos atalhos.
    bindShortcuts(keys.filter((key) => key.dataset.key));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
