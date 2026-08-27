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
    lyd:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<path d="M8 19h8l10-8v26l-10-8H8z" fill="var(--aksent)"/>' +
        '<g fill="none" stroke="var(--aksent-mork)" stroke-width="3.2" stroke-linecap="round">' +
          '<path d="M32 18c3 3 3 9 0 12"/>' +
          '<path d="M37 14c5 5 5 15 0 20"/>' +
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
    ikon: function (navn) { return IKONER[navn] || ''; },
    figurFor: function (verdenId) {
      return VERDENER[verdenId].figur === 'skip' ? skip() : bil();
    },
    landskapFor: function (verdenId) {
      return verdenId === 'oy' ? oy() : aser();
    }
  };
})();
