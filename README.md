# Portfólio de Santiago Molina Sánchez

O meu portfólio, em https://santiagomolina.pages.dev. Sou licenciado em Engenharia Informática e estou a fazer o mestrado em Informática, com foco em engenharia de software.

É uma página única feita em HTML, CSS e JavaScript, sem frameworks nem passo de build. O desenho segue o de um manual técnico de fabricante: secções numeradas, figuras com legenda e uma folha de especificações. Também se imprime como documento A4.

Tem cinco projetos: o MyMOB (plataforma clínica, o meu projeto final de licenciatura), o controlo de um reator de hidrogénio com PLC, uma app Flutter de partilha de localização, uma interface tangível para realidade virtual, feita num programa Erasmus, e um CRM de leads em Next.js, feito num desafio técnico.

## Correr localmente

Não há dependências para instalar. Basta servir a pasta, por exemplo:

```
npx serve .
```

Também funciona com a extensão Live Server do VS Code. Abrir o `index.html` diretamente no browser também dá, mas os ícones das teclas G e L aparecem como letras, porque o browser bloqueia máscaras CSS em ficheiros locais.

## Estrutura

```
index.html          a página
404.html            página de erro
_headers            cabeçalhos HTTP de segurança (Cloudflare Pages / Netlify)
css/
  styles.css        estilos, fontes e versão de impressão
  social-keys.css   teclas 3D do GitHub, LinkedIn e email
js/
  code-background.js  listagem de código animada na capa
  name-reveal.js      o "M." que se escreve como "Molina"
  index-keys.js       índice flutuante e atalhos 0 a 4
  social-keys.js      teclas G, L e E
  plates.js           visor das imagens e do vídeo
  belt.js             passadeira de tecnologias
assets/
  img/  video/  cv/  icons/  fonts/
  img/badges/   insígnias Cisco da Credly (ligam à página de verificação)
```

O JavaScript não usa bibliotecas e cada ficheiro trata de uma coisa. Os comentários no código estão em português.

O site não carrega nada de fora: as fontes estão na pasta `assets/fonts` e não há scripts nem estilos inline, o que permite uma Content Security Policy estrita (ver `_headers`). As animações param quando o sistema pede menos movimento (`prefers-reduced-motion`).

## Créditos

Fontes IBM Plex Sans e IBM Plex Mono, da IBM, com a licença SIL Open Font License (`assets/fonts/OFL.txt`).

Logótipos das tecnologias do Simple Icons (CC0). As marcas pertencem aos respetivos donos. Os ícones de Drools, REST, Ladder, Grafcet, HMI e Modbus foram desenhados por mim.

## Direitos

Este repositório não tem licença. O código, os textos, as imagens e os CVs são meus e não podem ser reutilizados sem autorização.
