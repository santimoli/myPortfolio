# Portfólio de Santiago Molina Sánchez

O meu portfólio, publicado em https://santiagomoli.pages.dev. Sou licenciado em Engenharia Informática e estou a fazer o mestrado em Informática. A área de que mais gosto é engenharia de software.

É uma página única em HTML, CSS e JavaScript, sem frameworks e sem build. O aspeto imita um manual técnico de fabricante, com secções numeradas, figuras com legenda e uma folha de especificações. Impressa, sai como um documento A4.

Tem cinco projetos: o MyMOB (plataforma clínica, o meu projeto final de licenciatura), o controlo de um reator de hidrogénio com PLC, uma app Flutter de partilha de localização, uma interface tangível para realidade virtual, feita num programa Erasmus, e um CRM de leads em Next.js, feito num desafio técnico.

## Correr localmente

Não há dependências para instalar. Serve-se a pasta `public`, por exemplo com:

```
npx serve public
```

A extensão Live Server do VS Code também serve. Se abrires o `public/index.html` diretamente no browser, a página funciona, mas os ícones das teclas G e L aparecem como letras, porque o browser bloqueia máscaras CSS em ficheiros locais.

## Estrutura

Tudo o que é publicado está em `public/`. O Cloudflare Pages serve só essa pasta, por isso este README e o `.gitignore` não ficam online.

```
public/
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
    plates.js           visor das imagens e dos vídeos
    belt.js             passadeira de tecnologias
  assets/
    img/  video/  cv/  icons/  fonts/
    img/badges/   insígnias Cisco da Credly (ligam à página de verificação)
```

O JavaScript não usa bibliotecas, e há um ficheiro por funcionalidade. Os comentários no código estão em português.

Tudo é servido a partir do próprio site. As fontes estão em `public/assets/fonts` e não há scripts nem estilos inline, por isso a Content Security Policy em `_headers` pode ser estrita. As animações param quando o sistema pede menos movimento (`prefers-reduced-motion`).

## Créditos

Fontes IBM Plex Sans e IBM Plex Mono, da IBM, com a licença SIL Open Font License (`public/assets/fonts/OFL.txt`).

Os logótipos das tecnologias vêm do Simple Icons (CC0) e as marcas pertencem aos respetivos donos. Os ícones de Drools, REST, Ladder, Grafcet, HMI e Modbus desenhei-os eu.

## Direitos

Este repositório não tem licença. O código, os textos, as imagens e os CVs são meus e não podem ser reutilizados sem autorização.
