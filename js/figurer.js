/* Bokstavløpet – tegningene
 *
 * Alt er SVG som legges rett inn i siden, slik at delene kan animeres hver
 * for seg: hjulene roterer, seilet vaier, flagget blafrer. Fargene styres
 * av CSS-variabler, så samme tegning kan skifte lakk.
 */

var Figurer = (function () {

  /* Samme figur tegnes flere steder samtidig. Gradientene må derfor ha hver
   * sin id, ellers plukker nettleseren den første og resten blir tomme. */
  var teller = 0;
  function unik(navn) { return navn + '-' + (++teller); }

  /* ---------- racerbilen ---------- */

  function bil() {
    var gLakk = unik('lakk'), gGlass = unik('glass');
    return '' +
    '<svg class="fig fig--bil" viewBox="0 0 200 104" role="img" aria-label="Racerbil">' +
      '<defs>' +
        '<linearGradient id="' + gGlass + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#dff2fb"/><stop offset="1" stop-color="#9cc9e4"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gLakk + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#f4574a"/>' +
          '<stop offset="0.55" stop-color="#dc3327"/>' +
          '<stop offset="1" stop-color="#a4200f"/>' +
        '</linearGradient>' +
      '</defs>' +

      '<ellipse class="fig-skygge" cx="100" cy="95" rx="76" ry="7"/>' +

      /* karosseri */
      '<path d="M14 78c-6-2-8-9-6-16l9-13c4-6 10-9 18-9h21c9-14 22-21 39-21h20c15 0 26 6 34 18l25 6c10 2 15 9 15 19 0 8-5 12-13 12z"' +
            ' fill="url(#' + gLakk + ')"/>' +

      /* spoiler – bakerst, altså til venstre, siden bilen ser mot høyre.
         Tegnes etter karosseriet, ellers forsvinner staget bak det. */
      '<path d="M24 44h7v12h-7z" fill="#8d1a0c"/>' +
      '<path d="M45 44h7v12h-7z" fill="#8d1a0c"/>' +
      '<path d="M18 38h40a4 4 0 0 1 0 8H18a4 4 0 0 1 0-8z" fill="#a4200f"/>' +

      /* skulderlinje */
      '<path d="M20 58h158" stroke="rgba(255,255,255,.28)" stroke-width="3" stroke-linecap="round" fill="none"/>' +

      /* kupé */
      '<path d="M63 40c8-12 19-18 33-18h19c11 0 20 5 27 14l4 6z" fill="url(#' + gGlass + ')"/>' +
      '<path d="M96 22h6l-9 20h-7z" fill="rgba(255,255,255,.45)"/>' +

      /* lynmerke på døra – vårt eget, ikke noen andres */
      '<path class="fig-merke" d="M92 52l14-1-6 9 12-1-20 20 5-13-10 1z" fill="#fff" opacity=".92"/>' +

      /* lykt og eksos */
      '<path d="M182 62h9a5 5 0 0 1 0 10h-9z" fill="#ffe9a0"/>' +
      '<rect x="8" y="66" width="10" height="7" rx="3.5" fill="#8e939c"/>' +

      /* hjul */
      '<g class="hjul hjul--bak">' +
        '<circle cx="56" cy="78" r="21" fill="#23262d"/>' +
        '<circle cx="56" cy="78" r="11" fill="#d8dce2"/>' +
        '<g class="eiker" stroke="#9aa1ab" stroke-width="3" stroke-linecap="round">' +
          '<path d="M56 69v18"/><path d="M47.2 73l17.6 10"/><path d="M47.2 83l17.6-10"/>' +
        '</g>' +
        '<circle cx="56" cy="78" r="4" fill="#6d747e"/>' +
      '</g>' +
      '<g class="hjul hjul--front">' +
        '<circle cx="150" cy="78" r="21" fill="#23262d"/>' +
        '<circle cx="150" cy="78" r="11" fill="#d8dce2"/>' +
        '<g class="eiker" stroke="#9aa1ab" stroke-width="3" stroke-linecap="round">' +
          '<path d="M150 69v18"/><path d="M141.2 73l17.6 10"/><path d="M141.2 83l17.6-10"/>' +
        '</g>' +
        '<circle cx="150" cy="78" r="4" fill="#6d747e"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- sjørøverskipet ---------- */

  function skip() {
    var gSkrog = unik('skrog'), gSeil = unik('seil');
    return '' +
    '<svg class="fig fig--skip" viewBox="0 0 200 140" role="img" aria-label="Sjørøverskip">' +
      '<defs>' +
        '<linearGradient id="' + gSkrog + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#a9713f"/><stop offset="1" stop-color="#6b4322"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gSeil + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#e4d9c0"/>' +
        '</linearGradient>' +
      '</defs>' +

      '<ellipse class="fig-skygge" cx="100" cy="132" rx="72" ry="6"/>' +

      /* mast */
      '<rect x="96" y="14" width="7" height="82" rx="3.5" fill="#7d5330"/>' +

      /* flagg */
      '<g class="flagg">' +
        '<path d="M103 16h34l-9 10 9 10h-34z" fill="#23262d"/>' +
        '<circle cx="116" cy="26" r="4.2" fill="#fff"/>' +
        '<path d="M110 32l12-12M110 20l12 12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g>' +

      /* storseil */
      '<g class="seil">' +
        '<path d="M93 30C64 40 50 60 48 88h45z" fill="url(#' + gSeil + ')"/>' +
        '<path d="M106 34c26 8 39 28 41 54h-41z" fill="url(#' + gSeil + ')"/>' +
        '<path d="M62 66h30M56 78h37" stroke="rgba(140,120,84,.5)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M112 68h30M112 80h34" stroke="rgba(140,120,84,.5)" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g>' +

      /* skrog */
      '<path d="M22 94h156l-14 28c-3 6-9 10-16 10H52c-7 0-13-4-16-10z" fill="url(#' + gSkrog + ')"/>' +
      '<path d="M18 88h164a5 5 0 0 1 0 10H18a5 5 0 0 1 0-10z" fill="#c8492f"/>' +
      '<path d="M34 108h132" stroke="rgba(0,0,0,.16)" stroke-width="3" stroke-linecap="round"/>' +
      '<g fill="#ffe9a0">' +
        '<circle cx="66" cy="110" r="5"/><circle cx="100" cy="110" r="5"/><circle cx="134" cy="110" r="5"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- dinosauren ---------- */

  /* Vår egen dinosaur – en rolig, rund planteeter med plater på ryggen.
   * Samme oppskrift som bilen og skipet: ingen andres figur, og barnet gir
   * den navn selv. */
  function dino() {
    var gHud = unik('hud'), gPlate = unik('plate');
    return '' +
    '<svg class="fig fig--dino" viewBox="0 0 200 130" role="img" aria-label="Dinosaur">' +
      '<defs>' +
        '<linearGradient id="' + gHud + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#7cc48a"/>' +
          '<stop offset="0.6" stop-color="#4f9e63"/>' +
          '<stop offset="1" stop-color="#357a49"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gPlate + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#e0a127"/>' +
        '</linearGradient>' +
      '</defs>' +

      '<ellipse class="fig-skygge" cx="100" cy="122" rx="74" ry="7"/>' +

      /* Hale – bakerst, altså til venstre, siden dinoen ser mot høyre.
         Tykk der den møter kroppen, spiss ytterst. */
      '<path d="M56 88C36 92 18 88 4 74c16 2 26-2 32-10 6-8 14-12 24-10z"' +
            ' fill="url(#' + gHud + ')"/>' +

      /* Bakbein bak kroppen, så dyret får dybde. */
      '<rect class="dino-bein dino-bein--bak" x="62" y="86" width="20" height="32" rx="10" fill="#2e6b40"/>' +
      '<rect class="dino-bein dino-bein--bak" x="104" y="86" width="20" height="32" rx="10" fill="#2e6b40"/>' +

      /* Kropp – én rund form, så silhuetten er lett å kjenne igjen. */
      '<ellipse cx="94" cy="76" rx="52" ry="34" fill="url(#' + gHud + ')"/>' +

      /* Buk. Holdes godt innenfor kroppen, ellers leses den som en bjelke. */
      '<ellipse cx="96" cy="88" rx="34" ry="16" fill="#b6e2bd" opacity=".55"/>' +

      /* Forbein foran kroppen. */
      '<rect class="dino-bein dino-bein--fram" x="74" y="92" width="21" height="30" rx="10.5" fill="#3f8b53"/>' +
      '<rect class="dino-bein dino-bein--fram" x="112" y="92" width="21" height="30" rx="10.5" fill="#3f8b53"/>' +

      /* Rygglater langs ryggen. */
      '<g fill="url(#' + gPlate + ')">' +
        '<path d="M62 56l7-15 8 13z"/>' +
        '<path d="M80 47l9-17 9 15z"/>' +
        '<path d="M100 45l10-15 8 16z"/>' +
        '<path d="M120 50l9-12 6 14z"/>' +
      '</g>' +

      /* Hals og hode. */
      '<path d="M132 62c0-18 10-30 26-32 6-1 10 2 10 8v26z" fill="url(#' + gHud + ')"/>' +
      '<ellipse cx="168" cy="42" rx="24" ry="19" fill="url(#' + gHud + ')"/>' +
      '<path d="M186 44h10a5 5 0 0 1 0 10h-8z" fill="#4f9e63"/>' +
      '<circle cx="172" cy="36" r="5.5" fill="#243528"/>' +
      '<circle cx="174" cy="34" r="2" fill="#fff" opacity=".95"/>' +
      '<path d="M172 52c6 3 12 2 16-2" fill="none" stroke="#243528"' +
            ' stroke-width="2.6" stroke-linecap="round"/>' +
      /* to små nesebor */
      '<g fill="#2e6b40"><circle cx="188" cy="40" r="1.7"/></g>' +

    '</svg>';
  }

  /* Dinodalen: bregneskog og en vulkan i det fjerne. */
  function dal() {
    return '' +
    '<svg class="lag lag--fjern" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      /* Vulkanen. Rolig, uten utbrudd – bakgrunnen skal ikke stjele blikket. */
      '<path d="M812 240l108-150 108 150z" fill="var(--as-fjern)"/>' +
      '<path d="M884 128h72l-16 18h-40z" fill="var(--as-bak)" opacity=".7"/>' +
      '<path d="M0 240V128c80-30 160-32 240-6s170 20 250-8 180-26 270 4v122z" fill="var(--as-fjern)"/>' +
    '</svg>' +
    '<svg class="lag lag--bak" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 240V158c96-42 176-32 244 4s154 38 240 0 172-38 256-4 152 30 232-10v92z" fill="var(--as-bak)"/>' +
    '</svg>' +
    '<svg class="lag lag--fram" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 200v-58c116-48 200-30 272 12s150 40 240 0 178-30 252 10 148 28 236-18v54z" fill="var(--as-fram)"/>' +
      /* Bregner i to grupper – dinosaurenes skog. */
      '<g fill="var(--bregne, #3f8f5a)">' +
        '<path d="M150 168c-30-6-46-26-44-52 22 6 38 22 44 52zM150 168c30-6 46-26 44-52-22 6-38 22-44 52zM150 168c-4-30 4-52 22-64-6 24-8 44-6 64z"/>' +
        '<path d="M1040 172c-24-5-38-22-36-43 18 5 31 18 36 43zM1040 172c24-5 38-22 36-43-18 5-31 18-36 43z"/>' +
      '</g>' +
    '</svg>';
  }


  /* ---------- forsidens øykart ---------- */

  /* Kartet på forsiden. Formspråket er flatt og enkelt, som på et tegnet
   * skattekart: havet legger seg i lysere ringer inn mot stranda, sanden går
   * rundt hele øya, og der landet stuper ned i sanden står en brun kant.
   * Kystlinja tegnes derfor bare én gang og gjenbrukes skalert – da følger
   * alle kantene hverandre slik de gjør på et ekte kart.
   *
   * Selve stedene – banen, vulkanen og skipet – legges oppå som knapper i
   * HTML, ikke i tegningen, slik at de kan trykkes på og få navn. */

  var KYST =
    'M818 300' +
    'C842 360 826 420 780 452' +
    'C726 490 690 520 660 566' +
    'C620 630 560 668 480 664' +
    'C400 660 330 634 292 592' +
    'C240 536 176 496 172 428' +
    'C168 348 192 268 232 218' +
    'C282 156 372 130 472 130' +
    'C586 128 668 148 716 196' +
    'C756 236 800 252 818 300Z';

  /* Kystlinja én gang til: skalert om øyas midtpunkt og eventuelt flyttet
   * litt ned, som når kanten skal stikke fram under landet. */
  function kystlag(skala, dy, farge, ekstra) {
    var t = 'translate(0,' + (dy || 0) + ') translate(505,398) scale(' +
            skala + ') translate(-505,-398)';
    return '<path d="' + KYST + '" transform="' + t + '" fill="' + farge + '"' +
           (ekstra || '') + '/>';
  }

  function palme(x, y, s, speil) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' +
           (speil ? -s : s) + ',' + s + ')">' +
      '<ellipse cx="1" cy="3" rx="17" ry="5" fill="rgba(52,86,58,.18)"/>' +
      '<path d="M-4 2c1-15 3-26 8-37l6 2c-6 11-8 22-8 35z" fill="#a9743c"/>' +
      '<g fill="#3f8f5a">' +
        '<path d="M9-35c15-7 26-3 30 6-11-5-20-4-29 1z"/>' +
        '<path d="M9-35c13-13 26-15 34-8-12 0-20 4-28 12z"/>' +
        '<path d="M7-37c-3-15 4-26 15-29-7 9-9 18-9 28z"/>' +
        '<path d="M5-35c-14-7-25-3-29 6 11-5 20-4 28 1z"/>' +
        '<path d="M5-35c-12-12-25-14-33-7 12 0 20 4 28 11z"/>' +
      '</g>' +
      '<circle cx="7" cy="-34" r="4" fill="#2f7a49"/>' +
    '</g>';
  }

  function stein(x, y, s) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<path d="M-24 9c-5-11 2-21 13-23 13-3 24 4 26 15 1 6-3 8-10 8z" fill="#9aa7ad"/>' +
      '<path d="M-3 0c4-6 11-8 17-5" fill="none" stroke="#c6d1d4" stroke-width="4" stroke-linecap="round"/>' +
    '</g>';
  }

  /* Kryssene er kartets «her er det noe» – de peker ikke på noe spillet
   * bruker, de er der for at det skal være noe å oppdage og peke på. */
  function kryss(x, y, s) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' +
           ' stroke="#ea7a33" stroke-width="9" stroke-linecap="round">' +
      '<path d="M-15-15L15 15M15-15L-15 15"/></g>';
  }

  function bolge(x, y) {
    return '<path d="M' + x + ' ' + y + 'c9-8 18-8 27 0 9 8 18 8 27 0"' +
           ' fill="none" stroke="#e6f8f4" stroke-width="6"' +
           ' stroke-linecap="round" opacity=".75"/>';
  }

  function kart() {
    return '' +
    '<svg class="kart-flate" viewBox="0 0 1000 820" role="img"' +
        ' aria-label="Kart over øya">' +

      /* Havet, og ringene inn mot land. */
      '<rect width="1000" height="820" fill="#4fbcc0"/>' +
      kystlag(1.34, 0, '#63c7c9') +
      kystlag(1.21, 0, '#80d4d1') +
      kystlag(1.10, 0, '#a4e2dc') +

      /* Stranda, og den brune kanten under landet. */
      kystlag(1.00, 0, '#f4dcaa') +
      kystlag(0.925, 9, '#b07a44') +
      kystlag(0.925, 0, '#6bb567') +

      /* Sletta i vest, der banen ligger. */
      '<path d="M210 470c20-92 112-122 212-100s140 98 100 178c-40 78-180 90-250 38' +
             '-56-42-74-58-62-116z" fill="#7ec471" opacity=".75"/>' +

      /* Høylandet i øst: et platå med brun kant, med vulkanen på toppen. */
      '<path d="M486 348c0-66 62-122 154-126s138 38 138 100c2 56-52 90-130 90' +
             '-92 0-162-10-162-64z" transform="translate(0,8)" fill="#b07a44"/>' +
      '<path d="M486 348c0-66 62-122 154-126s138 38 138 100c2 56-52 90-130 90' +
             '-92 0-162-10-162-64z" fill="#88c977"/>' +

      /* Vulkanen. Rolig, med bare et pust av glo i toppen. */
      '<path d="M512 270L584 138h30l76 132z" fill="#8f6b57"/>' +
      '<path d="M599 138h15l76 132h-56z" fill="#77543f" opacity=".38"/>' +
      '<path d="M508 270h186l-8 10H516z" fill="#7a5b45" opacity=".3"/>' +
      '<path d="M578 142h42l11 17c-21 8-45 8-64 0z" fill="#ea7a33"/>' +
      '<path d="M586 164l-8 30M608 164l7 25M598 168l0 34" stroke="#ea7a33"' +
            ' stroke-width="6" stroke-linecap="round" fill="none" opacity=".75"/>' +

      /* Racerbanen: asfalt, midtstripe og målstrek. */
      '<ellipse cx="370" cy="500" rx="123" ry="71" fill="#8ecb7f" opacity=".8"/>' +
      '<ellipse cx="370" cy="500" rx="140" ry="88" fill="none" stroke="#8d9299" stroke-width="34"/>' +
      '<ellipse cx="370" cy="500" rx="140" ry="88" fill="none" stroke="#fdfaf2"' +
             ' stroke-width="3" stroke-dasharray="16 20" opacity=".8"/>' +
      '<g>' +
        '<rect x="213" y="484" width="34" height="30" fill="#fdfaf2"/>' +
        '<g fill="#3a3f45">' +
          '<rect x="213" y="484" width="11" height="10"/>' +
          '<rect x="236" y="484" width="11" height="10"/>' +
          '<rect x="224" y="494" width="11" height="10"/>' +
          '<rect x="213" y="504" width="11" height="10"/>' +
          '<rect x="236" y="504" width="11" height="10"/>' +
        '</g>' +
      '</g>' +

      /* Stier mellom stedene, prikket som på kart. */
      '<g fill="none" stroke="#b07a44" stroke-width="8" stroke-linecap="round"' +
        ' stroke-dasharray="1 22" opacity=".85">' +
        '<path d="M508 452c46-30 70-74 104-118"/>' +
        '<path d="M474 566c48 20 100 12 168-16"/>' +
      '</g>' +

      /* Hytta på sletta, og brygga som peker ut mot skipet. */
      '<g>' +
        '<path d="M416 302l34-28 34 28z" fill="#c0763f"/>' +
        '<rect x="426" y="302" width="48" height="30" rx="5" fill="#f4e5c2"/>' +
        '<rect x="442" y="313" width="16" height="19" rx="3" fill="#a9743c"/>' +
      '</g>' +
      '<g>' +
        '<path d="M642 542l78 40-8 15-78-40z" fill="#c08a4f"/>' +
        '<g stroke="#96612f" stroke-width="3.5" stroke-linecap="round">' +
          '<path d="M652 543l-8 16M670 552l-8 16M688 561l-8 16M706 570l-8 16"/>' +
        '</g>' +
        '<g fill="#8d5f31">' +
          '<rect x="662" y="566" width="6" height="16" rx="3"/>' +
          '<rect x="700" y="586" width="6" height="16" rx="3"/>' +
        '</g>' +
      '</g>' +

      /* Palmer, steiner og kryss – noe å peke på i mellomrommene. */
      palme(252, 318, 1.05, false) +
      palme(300, 236, 0.9, true) +
      palme(432, 196, 0.95, false) +
      palme(238, 470, 1, true) +
      palme(322, 622, 1.05, false) +
      palme(556, 596, 0.95, true) +
      palme(742, 452, 1, false) +
      palme(778, 336, 0.85, true) +
      stein(556, 340, 1) +
      stein(300, 552, 0.85) +
      stein(626, 618, 0.9) +
      kryss(276, 380, 1) +
      kryss(568, 636, 0.9) +
      kryss(768, 418, 0.85) +

      /* Havet rundt: skvalpesteiner, bølger og et kompass i hjørnet. */
      stein(140, 626, 1.1) +
      stein(902, 206, 1) +
      bolge(78, 214) +
      bolge(880, 470) +
      bolge(430, 736) +
      bolge(196, 108) +
      '<g transform="translate(122,714)">' +
        '<circle r="46" fill="rgba(255,253,244,.88)"/>' +
        '<circle r="46" fill="none" stroke="#b07a44" stroke-width="4"/>' +
        '<path d="M-34 0L0-10 34 0 0 10z" fill="#7a5b45" opacity=".7"/>' +
        '<path d="M0-34L10 0 0 34-10 0z" fill="#ea7a33"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- landskapet bak ---------- */

  /* Åser i to lag gir dybde uten å ta oppmerksomhet. */
  function aser() {
    return '' +
    /* Fjern ås, nesten i himmelfarge – gir dybde uten å ta plass. */
    '<svg class="lag lag--fjern" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 240V120c70-38 150-46 240-18s170 26 250-6 180-34 270 0 160 30 240-4 130-24 200 4v144z" fill="var(--as-fjern)"/>' +
    '</svg>' +
    '<svg class="lag lag--bak" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 240V150c90-46 170-40 240-6s150 40 236 2 168-44 254-8 156 34 230-8 148-40 240 6v104z" fill="var(--as-bak)"/>' +
    '</svg>' +
    '<svg class="lag lag--fram" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 200v-64c110-52 196-36 268 6s154 44 244 4 176-34 250 6 152 32 236-14 132-42 202-8v70z" fill="var(--as-fram)"/>' +
      /* Trær i to grupper. Runde, rolige former i samme grønnfamilie. */
      '<g fill="var(--tre,#4c8a63)">' +
        '<rect x="146" y="128" width="9" height="34" rx="4" fill="var(--stamme,#7a5230)"/>' +
        '<circle cx="150" cy="112" r="26"/>' +
        '<rect x="210" y="140" width="8" height="28" rx="4" fill="var(--stamme,#7a5230)"/>' +
        '<circle cx="214" cy="128" r="19"/>' +
        '<rect x="986" y="124" width="9" height="36" rx="4" fill="var(--stamme,#7a5230)"/>' +
        '<circle cx="990" cy="106" r="28"/>' +
        '<rect x="1064" y="142" width="8" height="26" rx="4" fill="var(--stamme,#7a5230)"/>' +
        '<circle cx="1068" cy="130" r="18"/>' +
      '</g>' +
    '</svg>';
  }

  function oy() {
    return '' +
    '<svg class="lag lag--fjern" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      /* Måker og et seil i det fjerne – havet skal kjennes stort. */
      '<g fill="none" stroke="var(--as-fjern)" stroke-width="5" stroke-linecap="round">' +
        '<path d="M170 96c10-11 22-11 30 0M200 96c10-11 22-11 30 0"/>' +
        '<path d="M640 62c8-9 18-9 25 0M665 62c8-9 18-9 25 0"/>' +
      '</g>' +
      '<g fill="var(--as-fjern)">' +
        '<path d="M1042 176l0-52 34 52z"/>' +
        '<rect x="1038" y="176" width="42" height="8" rx="4"/>' +
      '</g>' +
    '</svg>' +
    '<svg class="lag lag--bak" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 240v-40c120-30 210-22 300 8s180 30 268 0 176-26 262 8 168 26 250-16h120v40z" fill="var(--as-bak)"/>' +
    '</svg>' +
    '<svg class="lag lag--fram" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<g fill="var(--as-fram)">' +
        '<path d="M840 200c0-52 34-86 78-86s78 34 78 86z"/>' +
        '<path d="M120 200c0-40 26-66 60-66s60 26 60 66z"/>' +
      '</g>' +
      '<g fill="var(--palme)">' +
        '<rect x="914" y="96" width="9" height="46" rx="4.5"/>' +
        '<path d="M918 100c-22-14-40-12-52 4 18-4 32-2 44 6zM918 100c22-14 40-12 52 4-18-4-32-2-44 6zM918 98c-6-22 2-38 20-46-8 16-10 30-8 44z"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- menyikoner ----------
   *
   * Tegnet selv i stedet for emoji: emoji ser forskjellig ut på hver
   * maskin, og det er den forskjellen som får en meny til å se hjemmesnekret
   * ut. Fargene arves fra verdenens aksentfarge via CSS-variabler. */

  var IKONER = {
    garasje:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M6 22L24 8l18 14v16a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="var(--aksent)"/>' +
        '<rect x="13" y="24" width="22" height="17" rx="2" fill="#fffdf8"/>' +
        '<g stroke="var(--aksent-mork)" stroke-width="2.6" stroke-linecap="round">' +
          '<path d="M16 29h16M16 34h16"/>' +
        '</g>' +
      '</svg>',
    kart:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M7 12l11-4 12 4 11-4v28l-11 4-12-4-11 4z" fill="#fffdf8" stroke="var(--aksent)" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M14 24c5-6 12 4 19-3" fill="none" stroke="var(--aksent)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 5"/>' +
        '<path d="M33 28l6 6M39 28l-6 6" stroke="var(--aksent-mork)" stroke-width="3.4" stroke-linecap="round"/>' +
      '</svg>',
    finn:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<rect x="9" y="6" width="4" height="37" rx="2" fill="var(--aksent-mork)"/>' +
        '<path d="M13 8h26l-5 8 5 8H13z" fill="#fffdf8" stroke="var(--aksent)" stroke-width="2.4"/>' +
        '<g fill="var(--aksent)">' +
          '<rect x="15" y="10" width="6" height="6"/><rect x="27" y="10" width="6" height="6"/>' +
          '<rect x="21" y="16" width="6" height="6"/><rect x="33" y="15" width="4" height="7"/>' +
        '</g>' +
      '</svg>',
    /* Reiret: tre egg i et rede. */
    reir:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<ellipse cx="24" cy="34" rx="19" ry="9" fill="none" stroke="var(--aksent)" stroke-width="3.4"/>' +
        '<g fill="#fffdf8" stroke="var(--aksent)" stroke-width="2.4">' +
          '<ellipse cx="16" cy="27" rx="6" ry="7.5"/>' +
          '<ellipse cx="32" cy="27" rx="6" ry="7.5"/>' +
          '<ellipse cx="24" cy="22" rx="6.5" ry="8"/>' +
        '</g>' +
      '</svg>',
    /* Tell: tre ting og en pekefinger. */
    tell:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<g fill="var(--aksent)">' +
          '<circle cx="12" cy="16" r="7"/><circle cx="26" cy="16" r="7"/><circle cx="40" cy="16" r="7"/>' +
        '</g>' +
        '<g fill="none" stroke="var(--aksent-mork)" stroke-width="3" stroke-linecap="round">' +
          '<path d="M12 30v4M26 30v4M40 30v4"/>' +
        '</g>' +
        '<path d="M20 44l8-8 4 4" fill="none" stroke="var(--aksent-mork)"' +
          ' stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>',
    /* Alfabetløypa: en vei som svinger fra start til mål. */
    loype:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M12 40c0-12 26-9 26-19 0-5-5-8-11-8" fill="none"' +
          ' stroke="var(--aksent)" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M12 40c0-12 26-9 26-19 0-5-5-8-11-8" fill="none"' +
          ' stroke="#fffdf8" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 6"/>' +
        '<circle cx="12" cy="40" r="4.5" fill="var(--aksent-mork)"/>' +
        '<circle cx="27" cy="13" r="5.5" fill="var(--aksent-mork)"/>' +
      '</svg>',
    /* Navnet mitt: to bokstaver på plass og én rute igjen. */
    navn:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<rect x="5" y="12" width="38" height="24" rx="4" fill="#fffdf8"' +
          ' stroke="var(--aksent)" stroke-width="3"/>' +
        '<g fill="var(--aksent)">' +
          '<rect x="11" y="19" width="7" height="10" rx="1.5"/>' +
          '<rect x="20.5" y="19" width="7" height="10" rx="1.5"/>' +
        '</g>' +
        '<rect x="30" y="19" width="7" height="10" rx="1.5" fill="none"' +
          ' stroke="var(--aksent)" stroke-width="2.4" stroke-dasharray="2.5 2.5"/>' +
      '</svg>',
    lyd:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M8 19h8l10-8v26l-10-8H8z" fill="var(--aksent)"/>' +
        '<g fill="none" stroke="var(--aksent-mork)" stroke-width="3.2" stroke-linecap="round">' +
          '<path d="M32 18c3 3 3 9 0 12"/>' +
          '<path d="M37 14c5 5 5 15 0 20"/>' +
        '</g>' +
      '</svg>',
    pil:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M5 16h20"/><path d="M18 8l8 8-8 8"/>' +
        '</g>' +
      '</svg>',
    malflagg:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<rect x="5" y="3" width="4" height="26" rx="2" fill="currentColor"/>' +
        '<path d="M9 5h19l-4 6 4 6H9z" fill="currentColor"/>' +
      '</svg>',
    oye:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<path d="M2 16c4-7 9-10 14-10s10 3 14 10c-4 7-9 10-14 10S6 23 2 16z"' +
          ' fill="none" stroke="currentColor" stroke-width="3"/>' +
        '<circle cx="16" cy="16" r="5" fill="currentColor"/>' +
      '</svg>',
    stemmePa:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<path d="M4 12h5l7-6v20l-7-6H4z" fill="currentColor"/>' +
        '<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">' +
          '<path d="M21 12.5c2 2 2 5 0 7"/><path d="M25 9c4 4 4 10 0 14"/>' +
        '</g>' +
      '</svg>',
    stemmeAv:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<path d="M4 12h5l7-6v20l-7-6H4z" fill="currentColor"/>' +
        '<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">' +
          '<path d="M21 11l8 10M29 11l-8 10"/>' +
        '</g>' +
      '</svg>',
    stjerne:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M24 5l5.6 11.6L42 18.4l-9 8.9 2.1 12.7L24 34l-11.1 6 2.1-12.7-9-8.9 12.4-1.8z" fill="#e2a017"/>' +
        '<path d="M24 10.5l3.9 8 8.7 1.2-6.3 6.2 1.5 8.8L24 30.6z" fill="#f2c33d"/>' +
      '</svg>'
  };

  return {
    bil: bil,
    skip: skip,
    kart: kart,
    ikon: function (navn) { return IKONER[navn] || ''; },
    figurFor: function (verdenId) {
      var f = VERDENER[verdenId].figur;
      if (f === 'skip') return skip();
      if (f === 'dino') return dino();
      return bil();
    },
    landskapFor: function (verdenId) {
      if (verdenId === 'oy') return oy();
      if (verdenId === 'dino') return dal();
      return aser();
    }
  };
})();
