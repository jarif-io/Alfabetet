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
      '<path d="M20 46h9v14h-9z" fill="#8d1a0c"/>' +
      '<path d="M44 46h9v14h-9z" fill="#8d1a0c"/>' +
      '<path d="M10 38h54a4.5 4.5 0 0 1 0 9H10a4.5 4.5 0 0 1 0-9z" fill="#a4200f"/>' +

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
    '<svg class="lag lag--bak" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 240V150c90-46 170-40 240-6s150 40 236 2 168-44 254-8 156 34 230-8 148-40 240 6v104z" fill="var(--as-bak)"/>' +
    '</svg>' +
    '<svg class="lag lag--fram" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 200v-64c110-52 196-36 268 6s154 44 244 4 176-34 250 6 152 32 236-14 132-42 202-8v70z" fill="var(--as-fram)"/>' +
    '</svg>';
  }

  function oy() {
    return '' +
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

  return {
    bil: bil,
    skip: skip,
    figurFor: function (verdenId) {
      return VERDENER[verdenId].figur === 'skip' ? skip() : bil();
    },
    landskapFor: function (verdenId) {
      return verdenId === 'oy' ? oy() : aser();
    }
  };
})();
