/*!
 * code-background.js
 * "Listing 0" da capa: escreve a mesma frase em 5 linguagens, em loop, com números de linha.
 * Santiago Molina Sánchez · "Make it work, make it right, make it fast." (Kent Beck)
 *
 * Sem dependências. Usa o <div id="code-bg"> e corre só quando a listagem está à vista
 * (ecrã com 1000px ou mais, onde o CSS a mostra). Com prefers-reduced-motion mostra
 * um snippet completo, parado. Os estilos (.cb-*) estão em css/styles.css.
 * Opção: data-speed no contentor multiplica a velocidade de escrita (por omissão: 1).
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. Dados: snippets pré-tokenizados
  // ---------------------------------------------------------------------------
  // Cada linha é uma lista de tokens [texto, tipo]. Sem tipo = "plain".
  // Tipos: keyword, type, string, function, punctuation, plain.
  // Assim cada token tem a cor certa desde a primeira letra escrita.

  const QUOTE = "Make it work, make it right, make it fast.";

  // Cada snippet cabe em ~54 colunas: a frase fica numa linha própria,
  // para a listagem se ler a ~13px sem scroll horizontal.
  const SNIPPETS = [
    {
      file: "quote.py",
      lines: [
        [["quote"], [" = ", "punctuation"], ['"' + QUOTE + '"', "string"]],
        [["print", "function"], ["(", "punctuation"], ["quote"], [")", "punctuation"]],
      ],
    },
    {
      file: "Quote.java",
      lines: [
        [["public", "keyword"], [" "], ["class", "keyword"], [" "], ["Quote", "type"], [" {", "punctuation"]],
        [["    "], ["static", "keyword"], [" "], ["final", "keyword"], [" "], ["String", "type"], [" QUOTE "], ["=", "punctuation"]],
        [["        "], ['"' + QUOTE + '"', "string"], [";", "punctuation"]],
        [
          ["    "], ["public", "keyword"], [" "], ["static", "keyword"], [" "], ["void", "keyword"], [" "],
          ["main", "function"], ["(", "punctuation"], ["String", "type"], ["[] ", "punctuation"], ["args"], [") {", "punctuation"],
        ],
        [
          ["        "], ["System", "type"], [".", "punctuation"], ["out"], [".", "punctuation"],
          ["println", "function"], ["(", "punctuation"], ["QUOTE"], [");", "punctuation"],
        ],
        [["    "], ["}", "punctuation"]],
        [["}", "punctuation"]],
      ],
    },
    {
      file: "Quote.cs",
      lines: [
        [["const", "keyword"], [" "], ["string", "keyword"], [" Quote "], ["=", "punctuation"]],
        [["    "], ['"' + QUOTE + '"', "string"], [";", "punctuation"]],
        [["Console", "type"], [".", "punctuation"], ["WriteLine", "function"], ["(", "punctuation"], ["Quote"], [");", "punctuation"]],
      ],
    },
    {
      file: "quote.dart",
      lines: [
        [["void", "keyword"], [" "], ["main", "function"], ["() {", "punctuation"]],
        [["  "], ["const", "keyword"], [" quote "], ["=", "punctuation"]],
        [["      "], ["'" + QUOTE + "'", "string"], [";", "punctuation"]],
        [["  "], ["print", "function"], ["(", "punctuation"], ["quote"], [");", "punctuation"]],
        [["}", "punctuation"]],
      ],
    },
    {
      file: "quote.js",
      lines: [
        [["const", "keyword"], [" quote "], ["=", "punctuation"]],
        [["  "], ['"' + QUOTE + '"', "string"], [";", "punctuation"]],
        [["console"], [".", "punctuation"], ["log", "function"], ["(", "punctuation"], ["quote"], [");", "punctuation"]],
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // 2. Tempos (em milissegundos; só a escrita é afetada por data-speed)
  // ---------------------------------------------------------------------------

  const TIMING = {
    charMin: 25,           // atraso mínimo por caractere
    charMax: 45,           // atraso máximo por caractere
    afterPunctuation: 120, // micro-pausa extra depois de , ; e do ponto final da frase
    afterNewline: 200,     // pausa extra ao mudar de linha
    hold: 2500,            // pausa com o código completo
    selection: 400,        // tempo do "Ctrl+A" visível antes de apagar
    betweenSnippets: 350,  // ecrã vazio antes da linguagem seguinte
  };

  // Sinal interno usado para sair do loop quando a listagem é parada.
  const CANCELLED = Symbol("cancelled");

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createElement(tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  }

  // ---------------------------------------------------------------------------
  // 3. Motor da animação
  // ---------------------------------------------------------------------------

  class Listing {
    constructor(root, reducedMotion) {
      const speed = parseFloat(root.dataset.speed);
      this.root = root;
      this.speed = speed > 0 ? speed : 1;
      this.alive = true;
      this.index = 0;
      this.pendingTimer = null;    // timeout atual (para o stop o cancelar)
      this.pendingResolve = null;  // promessa atual do sleep
      this.resumeVisible = null;   // promessa à espera de a aba voltar a ficar visível

      this.buildDom();

      // Quando a aba volta a ficar visível, o loop continua onde parou.
      this.onVisibilityChange = () => {
        if (!document.hidden && this.resumeVisible) {
          const resume = this.resumeVisible;
          this.resumeVisible = null;
          resume();
        }
      };
      document.addEventListener("visibilitychange", this.onVisibilityChange);

      if (reducedMotion) this.showStatic(SNIPPETS[0]);
      else this.run();
    }

    buildDom() {
      this.root.classList.add("cb-root");
      this.root.setAttribute("aria-hidden", "true");

      this.block = createElement("div", "cb-block");
      this.label = createElement("div", "cb-label");
      this.gutter = createElement("pre", "cb-gutter");
      this.code = createElement("pre", "cb-code");
      this.cursor = createElement("span", "cb-cursor");

      this.code.appendChild(this.cursor);
      const body = createElement("div", "cb-body");
      body.append(this.gutter, this.code);
      this.block.append(this.label, body);
      this.root.replaceChildren(this.block);
    }

    // --- Controlo do tempo ---------------------------------------------------

    waitUntilVisible() {
      if (!document.hidden) return Promise.resolve();
      return new Promise((resolve) => {
        this.resumeVisible = resolve;
      });
    }

    // Espera "ms" milissegundos e depois, se a aba estiver escondida, espera que volte.
    async sleep(ms) {
      await new Promise((resolve) => {
        this.pendingResolve = resolve;
        this.pendingTimer = setTimeout(resolve, ms);
      });
      await this.waitUntilVisible();
      if (!this.alive) throw CANCELLED;
    }

    // Atraso depois de escrever "character". "nextCharacter" é o seguinte no mesmo token
    // (undefined no fim do token). O ponto só pausa no fim de uma frase ("fast."),
    // não em acessos como System.out.println, que se escrevem de seguida.
    charDelay(character, nextCharacter) {
      let delay = randomBetween(TIMING.charMin, TIMING.charMax);
      const endsSentence = character === "." && (nextCharacter === " " || nextCharacter === '"' || nextCharacter === "'");
      if (character === "," || character === ";" || endsSentence) {
        delay += TIMING.afterPunctuation;
      }
      return delay / this.speed;
    }

    // --- Manipulação do DOM --------------------------------------------------

    // Cria um <span> colorido antes do cursor e devolve-o para ser preenchido.
    createToken(type) {
      const span = createElement("span", "cb-" + type);
      this.code.insertBefore(span, this.cursor);
      return span;
    }

    insertText(text, type) {
      this.createToken(type).textContent = text;
    }

    clearCode() {
      while (this.code.firstChild !== this.cursor) {
        this.code.removeChild(this.code.firstChild);
      }
      this.setLineCount(1);
    }

    // A coluna de números acompanha as linhas já escritas.
    setLineCount(count) {
      this.gutter.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
    }

    // --- Ciclo principal -----------------------------------------------------

    async run() {
      try {
        while (this.alive) {
          await this.typeSnippet(SNIPPETS[this.index]);
          this.index = (this.index + 1) % SNIPPETS.length;
        }
      } catch (error) {
        if (error !== CANCELLED) throw error;
      }
    }

    // Escrever, pausar, "Ctrl+A + Delete".
    async typeSnippet(snippet) {
      this.clearCode();
      this.label.textContent = snippet.file;
      this.root.classList.add("is-typing");

      for (let lineIndex = 0; lineIndex < snippet.lines.length; lineIndex++) {
        if (lineIndex > 0) {
          this.insertText("\n", "plain");
          this.setLineCount(lineIndex + 1);
          await this.sleep(TIMING.afterNewline / this.speed);
        }

        const line = snippet.lines[lineIndex];
        for (let tokenIndex = 0; tokenIndex < line.length; tokenIndex++) {
          const [text, type = "plain"] = line[tokenIndex];

          // A indentação no início da linha aparece de uma vez (auto-indent do editor).
          if (tokenIndex === 0 && text.trim() === "") {
            this.insertText(text, type);
            continue;
          }

          const span = this.createToken(type);
          for (let charIndex = 0; charIndex < text.length; charIndex++) {
            span.textContent += text[charIndex];
            await this.sleep(this.charDelay(text[charIndex], text[charIndex + 1]));
          }
        }
      }

      this.root.classList.remove("is-typing");
      await this.sleep(TIMING.hold);

      this.code.classList.add("is-selected");
      await this.sleep(TIMING.selection);
      this.clearCode();
      this.code.classList.remove("is-selected");
      await this.sleep(TIMING.betweenSnippets);
    }

    // prefers-reduced-motion: um snippet completo, parado, sem cursor.
    showStatic(snippet) {
      this.root.classList.add("is-static");
      this.clearCode();
      this.label.textContent = snippet.file;
      snippet.lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) this.insertText("\n", "plain");
        line.forEach(([text, type = "plain"]) => this.insertText(text, type));
      });
      this.setLineCount(snippet.lines.length);
    }

    stop() {
      this.alive = false;
      clearTimeout(this.pendingTimer);
      if (this.pendingResolve) this.pendingResolve();
      if (this.resumeVisible) this.resumeVisible();
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      this.root.replaceChildren();
      this.root.classList.remove("cb-root", "is-typing", "is-static");
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Arranque: só com a listagem à vista; recomeça se o reduced-motion mudar
  // ---------------------------------------------------------------------------

  function init() {
    const root = document.getElementById("code-bg");
    if (!root) return;

    const wide = window.matchMedia("(min-width: 1000px)"); // o mesmo limite do CSS
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let listing = null;

    function sync() {
      if (listing) {
        listing.stop();
        listing = null;
      }
      if (wide.matches) listing = new Listing(root, reducedMotion.matches);
    }

    wide.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);
    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
