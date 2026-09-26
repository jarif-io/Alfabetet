/* Oppdagerøya – tegningene
 *
 * Alt er SVG som legges rett inn i siden, slik at delene kan animeres hver
 * for seg: hjulene ruller og beina tramper. Figurene har faste farger
 * (CSS-variabler virker ikke i stop-color); landskapene tar fargene sine
 * fra verdenens CSS-variabler.
 */

var Figurer = (function () {

  /* Samme figur tegnes flere steder samtidig. Gradientene må derfor ha hver
   * sin id, ellers plukker nettleseren den første og resten blir tomme. */
  var teller = 0;
  function unik(navn) { return navn + '-' + (++teller); }

  /* ---------- ansiktene ----------
   *
   * Hver figur har fire uttrykk tegnet oppå hverandre, og CSS viser ett av
   * dem ut fra data-uttrykk på #figur: vanlig, glad (riktig svar), hmm (bom)
   * og trøtt (pause). Ingenting blunker eller rører seg av seg selv – ansiktet
   * forandrer seg bare når noe har skjedd.
   *
   * stil 'stor': hvite øyne med pupill, som biler med øyne i frontruta.
   * stil 'prikk': mørke prikkøyne med et lysglimt, for dyr og folk.
   * oyne: [[x, y, r], …]. munn: path-data for hvert uttrykk; den glade er
   * lukket (z) og fylles, som en åpen munn. */
  function ansikt(stil, oyne, munn) {
    var stor = stil === 'stor';
    var sw = stor ? 2.2 : 1.7;
    function n(v) { return +v.toFixed(1); }

    function apne(dx, dy) {
      return oyne.map(function (o) {
        var x = o[0], y = o[1], r = o[2];
        return stor
          ? '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + n(r * 1.15) +
              '" fill="#fff" stroke="#23262d" stroke-width="1.5"/>' +
            '<circle class="pupill" cx="' + n(x + r * dx) + '" cy="' + n(y + r * dy) +
              '" r="' + n(r * 0.5) + '" fill="#23262d"/>'
          : '<g class="pupill"><circle cx="' + n(x + r * dx * 0.3) + '" cy="' + n(y + r * dy * 0.3) +
              '" r="' + r + '" fill="#243528"/>' +
            '<circle cx="' + n(x + r * 0.35) + '" cy="' + n(y - r * 0.4) + '" r="' + n(r * 0.36) +
              '" fill="#fff"/></g>';
      }).join('');
    }
    /* Lukkede øyne: ^ når figuren smiler med hele ansiktet, u når den sover. */
    function buer(opp) {
      return oyne.map(function (o) {
        var x = o[0], y = o[1], r = o[2];
        return '<path d="M' + n(x - r) + ' ' + n(y + (opp ? r * 0.3 : 0)) +
          'Q' + x + ' ' + n(opp ? y - r * 1.1 : y + r * 0.9) + ' ' + n(x + r) + ' ' +
          n(y + (opp ? r * 0.3 : 0)) + '" fill="none" stroke="#23262d" stroke-width="' + sw +
          '" stroke-linecap="round"/>';
      }).join('');
    }
    /* Et lite bryn over første øye – «hmm, var det den?». */
    function bryn() {
      var o = oyne[oyne.length - 1];
      return '<path d="M' + n(o[0] - o[2]) + ' ' + n(o[1] - o[2] * 1.5) + 'l' + n(o[2] * 2) +
        ' ' + n(-o[2] * 0.45) + '" stroke="#23262d" stroke-width="' + sw +
        '" stroke-linecap="round" fill="none"/>';
    }
    function strek(d) {
      return '<path d="' + d + '" fill="none" stroke="#23262d" stroke-width="' + sw +
        '" stroke-linecap="round" stroke-linejoin="round"/>';
    }

    return '<g class="ansikt">' +
      '<g class="u-vanlig">' + apne(0.25, 0.1) + strek(munn.vanlig) + '</g>' +
      '<g class="u-glad">' + buer(true) +
        '<path d="' + munn.glad + '" fill="#7a2a22" stroke="#23262d" stroke-width="' + sw +
        '" stroke-linejoin="round"/></g>' +
      '<g class="u-hmm">' + apne(-0.15, 0.35) + bryn() + strek(munn.hmm) + '</g>' +
      '<g class="u-trott">' + buer(false) + strek(munn.trott) + '</g>' +
    '</g>';
  }

  /* Myk skygge der figuren møter bakken, litt mørkere rett under hjulene. */
  function bakkeskygge(cx, cy, rx, punkter) {
    return '<ellipse class="fig-skygge" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="7"/>' +
      punkter.map(function (x) {
        return '<ellipse cx="' + x + '" cy="' + (cy + 1) + '" rx="17" ry="3" fill="rgba(0,0,0,.22)"/>';
      }).join('');
  }

  function hjul(cx, cy, r, klasse) {
    return '<g class="hjul ' + klasse + '">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#23262d"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 3) + '" fill="none" stroke="#3a3f47" stroke-width="2"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.round(r * 0.52) + '" fill="#d8dce2"/>' +
      '<g class="eiker" stroke="#9aa1ab" stroke-width="3" stroke-linecap="round">' +
        '<path d="M' + cx + ' ' + (cy - 9) + 'v18"/>' +
        '<path d="M' + (cx - 7.8) + ' ' + (cy - 5) + 'l15.6 10"/>' +
        '<path d="M' + (cx - 7.8) + ' ' + (cy + 5) + 'l15.6-10"/>' +
      '</g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#6d747e"/>' +
      '<path d="M' + (cx - r * 0.6) + ' ' + (cy - r * 0.55) + 'a' + (r * 0.8) + ' ' + (r * 0.8) +
        ' 0 0 1 ' + (r * 0.9) + '-' + (r * 0.25) + '" stroke="rgba(255,255,255,.18)" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '</g>';
  }

  /* ---------- racerbilen ---------- */

  /* Vår egen racerbil: rød, med lynmerke og øyne i frontruta. I samme ånd
   * som bilfilmene, men ingen andres figur – barnet gir den navn selv. */
  function bil() {
    var gLakk = unik('lakk'), gGlass = unik('glass'), gGlans = unik('glans');
    return '' +
    '<svg class="fig fig--bil" viewBox="0 0 200 104" role="img" aria-label="Racerbil">' +
      '<defs>' +
        /* Himmelen speiler seg i ruta: lys øverst, et mørkere bånd der
           horisonten ville ligget, og lysere igjen nederst. */
        '<linearGradient id="' + gGlass + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#eef9fe"/><stop offset=".55" stop-color="#a9d3ea"/>' +
          '<stop offset=".62" stop-color="#7fb2cf"/><stop offset="1" stop-color="#b9dcef"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gLakk + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ff6a5a"/>' +
          '<stop offset="0.45" stop-color="#e0362a"/>' +
          '<stop offset="1" stop-color="#9c1d0e"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gGlans + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
          '<stop offset=".5" stop-color="#fff" stop-opacity=".55"/>' +
          '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +

      bakkeskygge(100, 96, 80, [56, 150]) +

      /* karosseri */
      '<path d="M14 78c-6-2-8-9-6-16l9-13c4-6 10-9 18-9h21c9-14 22-21 39-21h20c15 0 26 6 34 18l25 6c10 2 15 9 15 19 0 8-5 12-13 12z"' +
            ' fill="url(#' + gLakk + ')"/>' +

      /* spoiler – bakerst, altså til venstre, siden bilen ser mot høyre.
         Tegnes etter karosseriet, ellers forsvinner staget bak det. */
      '<path d="M24 44h7v12h-7z" fill="#8d1a0c"/>' +
      '<path d="M45 44h7v12h-7z" fill="#8d1a0c"/>' +
      '<path d="M18 38h40a4 4 0 0 1 0 8H18a4 4 0 0 1 0-8z" fill="#a4200f"/>' +

      /* blank lakk: en lang glansstripe og lys langs taket og panseret */
      '<path d="M20 57h158" stroke="url(#' + gGlans + ')" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<path d="M86 21c10-2 20-2 30 0" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M152 46l24 6" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round" fill="none"/>' +

      /* frontruta, der øynene sitter */
      '<path d="M63 40c8-12 19-18 33-18h19c11 0 20 5 27 14l4 6z" fill="url(#' + gGlass + ')"/>' +
      '<path d="M90 22h6l-9 20h-7z" fill="rgba(255,255,255,.45)"/>' +

      /* lynmerke på døra – vårt eget, ikke noen andres */
      '<path class="fig-merke" d="M92 52l14-1-6 9 12-1-20 20 5-13-10 1z" fill="#fff" opacity=".92"/>' +

      /* Støtfangeren foran er der munnen sitter – karosseriet er for tynt
         der framme til å ha et ansikt uten. */
      '<path d="M168 64h20c4 0 7 3 6 7l-1.5 5c-1 3-3.5 5-6.5 5h-18z" fill="#b8271a"/>' +
      /* lykt og eksos */
      '<path d="M182 53h7a4.5 4.5 0 0 1 0 9h-7z" fill="#ffe9a0"/>' +
      '<rect x="8" y="66" width="10" height="7" rx="3.5" fill="#8e939c"/>' +

      hjul(56, 78, 21, 'hjul--bak') +
      hjul(150, 78, 21, 'hjul--front') +

      ansikt('stor', [[110, 32, 7], [127, 33, 7]], {
        vanlig: 'M174 70q8 6 16 0',
        glad: 'M173 68q9 11 18 0z',
        hmm: 'M176 73q6-2 12 1',
        trott: 'M178 71q5 3 10 0'
      }) +
    '</svg>';
  }

  /* ---------- sjørøverskipet ---------- */

  /* Skipet med kapteinen på dekk: trekantet hatt med hodeskalle, stort rødt
   * skjegg – han heter jo Kaptein Rødskjegg fra start – og en papegøye på
   * skulderen. Vår egen sjørøver, i samme ånd som dem i barnebøkene. */
  function skip() {
    var gSkrog = unik('skrog'), gSeil = unik('seil');
    return '' +
    '<svg class="fig fig--skip" viewBox="0 0 200 140" role="img" aria-label="Sjørøverskip">' +
      '<defs>' +
        '<linearGradient id="' + gSkrog + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#b37a45"/><stop offset="1" stop-color="#633d1f"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gSeil + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#e4d9c0"/>' +
        '</linearGradient>' +
      '</defs>' +

      '<ellipse class="fig-skygge" cx="100" cy="132" rx="72" ry="6"/>' +

      /* mast */
      '<rect x="96" y="14" width="7" height="82" rx="3.5" fill="#7d5330"/>' +
      '<path d="M98 16v78" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>' +

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

      /* kapteinen: frakk, hode, skjegg og hatt */
      '<g class="kaptein">' +
        '<path d="M145 92c0-15 6-24 15-24s15 9 15 24z" fill="#c8352c"/>' +
        '<path d="M160 70v20" stroke="#f2c33d" stroke-width="2" stroke-dasharray="2 4"/>' +
        '<circle cx="160" cy="56" r="11" fill="#f3c9a0"/>' +
        '<path d="M148 55c0 13 5 21 12 21s12-8 12-21c-3 5-7 8-12 8s-9-3-12-8z" fill="#d9532b"/>' +
        '<circle cx="162" cy="58.5" r="2.2" fill="#e8a882"/>' +
        '<path d="M143 48c6-3 11-11 17-11s11 8 17 11c-5 3-11 4-17 4s-12-1-17-4z" fill="#23262d"/>' +
        '<circle cx="160" cy="44.5" r="2.6" fill="#fff"/>' +
        ansikt('prikk', [[156.5, 53.5, 1.9], [164, 53.5, 1.9]], {
          vanlig: 'M156 63q4 3 8 0',
          glad: 'M155 61.5q5 7 10 0z',
          hmm: 'M157 64h6',
          trott: 'M158 63q3 2 6 0'
        }) +
      '</g>' +

      /* papegøyen på skulderen */
      '<g class="papegoye">' +
        '<path d="M174 70l-3 9 6-5z" fill="#d8392b"/>' +
        '<ellipse cx="177" cy="66" rx="5" ry="7" fill="#2f9e4f"/>' +
        '<circle cx="178.5" cy="58" r="4.6" fill="#35ad57"/>' +
        '<path d="M182.5 56.5l4 2.2-4 2z" fill="#f2c33d"/>' +
        '<circle cx="179.6" cy="57.2" r="1.1" fill="#23262d"/>' +
      '</g>' +

      /* skrog med planker */
      '<path d="M22 94h156l-14 28c-3 6-9 10-16 10H52c-7 0-13-4-16-10z" fill="url(#' + gSkrog + ')"/>' +
      '<path d="M18 88h164a5 5 0 0 1 0 10H18a5 5 0 0 1 0-10z" fill="#c8492f"/>' +
      '<g stroke="rgba(0,0,0,.14)" stroke-width="2" stroke-linecap="round" fill="none">' +
        '<path d="M30 104h140"/><path d="M38 116h124"/><path d="M48 126h104"/>' +
      '</g>' +
      '<path d="M26 99h148" stroke="rgba(255,255,255,.2)" stroke-width="2" stroke-linecap="round"/>' +
      '<g fill="#ffe9a0" stroke="#7d5330" stroke-width="1.5">' +
        '<circle cx="66" cy="110" r="5"/><circle cx="100" cy="110" r="5"/><circle cx="134" cy="110" r="5"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- tauebilen ---------- */

  /* Vår egen tauebil: oransje, litt skeiv antenne, noen rustprikker og et
   * stort glis – en hjelpsom venn fra verkstedet. Kranen og kroken bak er
   * det som gjør den til en tauebil; kroken svinger når den kjører. */
  function tauebil() {
    var gLakk = unik('tlakk'), gGlass = unik('tglass'), gBenk = unik('tbenk');
    return '' +
    '<svg class="fig fig--taue" viewBox="0 0 200 118" role="img" aria-label="Tauebil">' +
      '<defs>' +
        '<linearGradient id="' + gLakk + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffb35c"/><stop offset=".5" stop-color="#f07f1e"/>' +
          '<stop offset="1" stop-color="#b3560b"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gGlass + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#eef9fe"/><stop offset=".55" stop-color="#a9d3ea"/>' +
          '<stop offset=".62" stop-color="#7fb2cf"/><stop offset="1" stop-color="#b9dcef"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gBenk + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#737a84"/><stop offset="1" stop-color="#454a53"/>' +
        '</linearGradient>' +
      '</defs>' +

      bakkeskygge(100, 110, 82, [52, 152]) +

      /* kranen bakerst, med wire og krok */
      '<path d="M48 62L22 22" stroke="#5b616b" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M44 60L24 27" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-linecap="round"/>' +
      '<g class="krok">' +
        '<path d="M20 22v30" stroke="#3a3f47" stroke-width="2"/>' +
        '<path d="M20 51v7a6 6 0 1 0 6 6" stroke="#8e939c" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      '<circle cx="20" cy="21" r="5.5" fill="#3a3f47"/><circle cx="20" cy="21" r="2" fill="#8e939c"/>' +

      /* lasteplanet, med varselstriper bakerst */
      '<path d="M10 60h96v20H14c-2 0-4-2-4-4z" fill="url(#' + gBenk + ')"/>' +
      '<path d="M10 70h14v10H14c-2 0-4-2-4-4z" fill="#f2c33d"/>' +
      '<path d="M13 70l6 10M19 70l5 8" stroke="#23262d" stroke-width="2.4"/>' +

      /* førerhuset */
      '<path d="M100 82V46c0-11 8-19 19-19h32c9 0 15 4 19 11l12 20c3 4 4 8 4 12v12z" fill="url(#' + gLakk + ')"/>' +
      '<path d="M112 30c10-2 26-2 38 0" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M104 64h80" stroke="rgba(255,255,255,.25)" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M132 58v24" stroke="rgba(0,0,0,.18)" stroke-width="2"/>' +
      /* sidevindu og frontrute */
      '<rect x="108" y="34" width="22" height="20" rx="5" fill="url(#' + gGlass + ')"/>' +
      '<path d="M136 32h16c7 0 12 3 15 8l12 18h-43z" fill="url(#' + gGlass + ')"/>' +
      /* varsellys på taket, skeiv antenne og noen rustprikker */
      '<path d="M122 21h14l2 7h-18z" fill="#f2c33d"/><path d="M125 22h4l-1 5h-4z" fill="#fff6c8"/>' +
      '<path d="M110 28q-3-10 4-17" stroke="#3a3f47" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="114" cy="11" r="2.2" fill="#d8392b"/>' +
      '<g fill="#8e4410" opacity=".55"><circle cx="118" cy="68" r="2"/><circle cx="124" cy="73" r="1.4"/><circle cx="113" cy="75" r="1.2"/></g>' +

      /* lykt og støtfanger – munnen sitter på støtfangeren */
      '<circle cx="183" cy="62" r="4.5" fill="#ffe9a0"/>' +
      '<path d="M168 70h20c4 0 7 3 6 7l-1 3c-1 3-3 4-6 4h-19z" fill="#9aa1ab"/>' +

      hjul(52, 84, 19, 'hjul--bak') +
      hjul(152, 84, 19, 'hjul--front') +

      ansikt('stor', [[148, 45, 6], [162, 46, 6]], {
        vanlig: 'M173 75q8 5 16 0',
        glad: 'M172 73q9 10 18 0z',
        hmm: 'M175 77q6-2 12 1',
        trott: 'M177 76q5 3 10 0'
      }) +
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
          '<stop offset="0" stop-color="#86cf93"/>' +
          '<stop offset="0.6" stop-color="#4f9e63"/>' +
          '<stop offset="1" stop-color="#357a49"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gPlate + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#e0a127"/>' +
        '</linearGradient>' +
      '</defs>' +

      bakkeskygge(100, 122, 74, [72, 122]) +

      /* Hale – bakerst, altså til venstre, siden dinoen ser mot høyre.
         Tykk der den møter kroppen, spiss ytterst. */
      '<path d="M56 88C36 92 18 88 4 74c16 2 26-2 32-10 6-8 14-12 24-10z"' +
            ' fill="url(#' + gHud + ')"/>' +

      /* Bakbein bak kroppen, så dyret får dybde. */
      '<rect class="dino-bein dino-bein--bak" x="62" y="86" width="20" height="32" rx="10" fill="#2e6b40"/>' +
      '<rect class="dino-bein dino-bein--bak" x="104" y="86" width="20" height="32" rx="10" fill="#2e6b40"/>' +

      /* Kropp – én rund form, så silhuetten er lett å kjenne igjen. */
      '<ellipse cx="94" cy="76" rx="52" ry="34" fill="url(#' + gHud + ')"/>' +
      /* Lys på ryggen, og noen flekker i huden. */
      '<path d="M58 60c14-14 44-20 70-8" stroke="#fff" stroke-opacity=".28" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<g fill="#3f8b53" opacity=".45">' +
        '<circle cx="78" cy="70" r="4"/><circle cx="92" cy="64" r="3"/><circle cx="110" cy="70" r="3.5"/>' +
      '</g>' +

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
      /* nesebor */
      '<circle cx="188" cy="40" r="1.7" fill="#2e6b40"/>' +
      '<ellipse cx="178" cy="47" rx="4" ry="2.5" fill="#f08a8a" opacity=".5"/>' +

      ansikt('prikk', [[172, 36, 5.5]], {
        vanlig: 'M172 52c6 3 12 2 16-2',
        glad: 'M171 50q9 9 18-1z',
        hmm: 'M174 53q6-1 12 1',
        trott: 'M175 52q5 2 10 0'
      }) +
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



  /* ---------- bilder til menyen ----------
   *
   * Et strekikon av en garasjeport sier ingenting til en treåring. Det han
   * kjenner igjen, er skjermen han var på sist. Hvert bilde her er derfor et
   * lite bilde av selve spillet: bokstavveggen, kortet med pila, navnet hans
   * i ruter, høyttaleren over to skilt. Han velger på formen, ikke på ordet.
   */

  /* En brikke som ser ut som brikkene i spillet. */
  function brikke(x, y, b, h, tekst, klasse) {
    return '<g class="' + (klasse || 'mb-brikke') + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + b + '" height="' + h +
        '" rx="' + Math.round(Math.min(b, h) * 0.26) + '"/>' +
      '<text x="' + (x + b / 2) + '" y="' + (y + h / 2) + '" dy=".35em">' + tekst + '</text>' +
    '</g>';
  }

  function ramme(x, y, b, h, tekst) {
    return '<g class="mb-ramme">' +
      '<rect x="' + x + '" y="' + y + '" width="' + b + '" height="' + h +
        '" rx="' + Math.round(Math.min(b, h) * 0.26) + '"/>' +
      (tekst ? '<text x="' + (x + b / 2) + '" y="' + (y + h / 2) + '" dy=".35em">' +
               tekst + '</text>' : '') +
    '</g>';
  }

  function pil(x, y) {
    return '<path class="mb-pil" d="M' + x + ' ' + y + 'h13m-5-5 5 5-5 5"/>';
  }

  /* art: hvilken form spillet har. tegn: tegnene som skal stå i bildet. */
  function modusbilde(art, tegn) {
    var t = tegn || [];
    function n(i, res) { return t[i] !== undefined ? t[i] : (res || ''); }
    var inni;

    if (art === 'utforsk') {
      /* Veggen full av brikker han kan trykke på. */
      inni = brikke(8, 8, 24, 24, n(0, 'A')) + brikke(38, 8, 24, 24, n(1, 'B')) +
             brikke(68, 8, 24, 24, n(2, 'C')) +
             brikke(8, 38, 24, 24, n(3, 'D')) + brikke(38, 38, 24, 24, n(4, 'E')) +
             brikke(68, 38, 24, 24, n(5, 'F'));

    } else if (art === 'loype') {
      /* Ett tegn om gangen, framover. */
      inni = brikke(4, 20, 30, 30, n(0, 'A')) + pil(38, 35) +
             brikke(56, 20, 30, 30, n(1, 'B')) +
             '<circle class="mb-prikk" cx="94" cy="35" r="3"/>';

    } else if (art === 'navn') {
      /* Navnet hans, i ruter. Ingenting er lettere å kjenne igjen. */
      var antall = Math.min(t.length || 3, 4);
      var bredde = 21, luft = 4;
      var total = antall * bredde + (antall - 1) * luft;
      var x0 = Math.round((100 - total) / 2);
      inni = '';
      for (var i = 0; i < antall; i++) {
        inni += brikke(x0 + i * (bredde + luft), 21, bredde, 30, n(i, '?'));
      }

    } else if (art === 'finn') {
      /* Hør, og velg. Høyttaleren over to skilt. */
      inni =
        '<g class="mb-hoyttaler">' +
          '<path d="M30 12h8l10-8v26l-10-8h-8z"/>' +
          '<path class="mb-bolge" d="M54 12a9 9 0 0 1 0 10M60 8a15 15 0 0 1 0 18" fill="none"/>' +
        '</g>' +
        brikke(20, 38, 26, 26, n(0, 'A')) + brikke(54, 38, 26, 26, n(1, 'B'));

    } else if (art === 'forstelyd') {
      /* Et bilde, og spørsmålet om hvilken bokstav det begynner på. */
      inni =
        '<text class="mb-ikon" x="30" y="36" dy=".35em">' + n(0, '🍎') + '</text>' +
        pil(50, 34) +
        ramme(68, 20, 28, 30, '?');

    } else if (art === 'tell') {
      /* Ting på rekke med tallene de fikk – nøyaktig slik de ser ut når han
       * har pekt på dem. Tomme ruter sa ingenting; tingen i ruta gjør det. */
      inni = '';
      for (var k = 0; k < 3; k++) {
        var x = 9 + k * 31;
        inni += '<g class="mb-ting"><rect x="' + x + '" y="24" width="25" height="25" rx="7"/></g>' +
                '<text class="mb-ting-ikon" x="' + (x + 12.5) + '" y="37" dy=".35em">' +
                  n(0, '🍎') + '</text>' +
                '<circle class="mb-merke" cx="' + (x + 23) + '" cy="24" r="7.5"/>' +
                '<text class="mb-merketall" x="' + (x + 23) + '" y="24" dy=".35em">' +
                  (k + 1) + '</text>';
      }

    } else if (art === 'hent') {
      /* Biler som hentes inn i garasjen: to biler, pila, og garasjen som
       * sier hvor mange den vil ha. */
      inni =
        '<text class="mb-ikon mb-ikon--liten" x="17" y="24" dy=".35em">' + n(0, '🚗') + '</text>' +
        '<text class="mb-ikon mb-ikon--liten" x="17" y="50" dy=".35em">' + n(0, '🚗') + '</text>' +
        pil(34, 37) +
        '<path class="mb-garasje" d="M54 32l20-15 20 15v28H54z"/>' +
        '<text class="mb-garasje-tall" x="74" y="44" dy=".35em">2</text>';

    } else {
      inni = brikke(35, 20, 30, 30, n(0, '?'));
    }

    return '<svg class="modusbilde" viewBox="0 0 100 72" role="img" aria-hidden="true">' +
             inni + '</svg>';
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

      /* Ringene inn mot land. Selve havet males av siden bak kartet, slik
         at det dekker hele skjermen og øya flyter midt i det. */
      kystlag(1.34, 0, '#63c7c9') +
      kystlag(1.21, 0, '#80d4d1') +
      kystlag(1.10, 0, '#a4e2dc') +

      /* Stranda, og den brune kanten under landet. */
      /* Kystlinja får en klasse, så en test kan spørre tegningen selv om et
         punkt ligger på øya eller i vannet. */
      kystlag(1.00, 0, '#f4dcaa', ' class="kart-kyst"') +
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

      /* Verkstedet i nord, med vei ned til racerbanen. Tauebilen står
         foran garasjeporten (se KARTSTEDER i spill.js). */
      '<path d="M396 262C402 316 410 362 402 414" fill="none" stroke="#8d9299" stroke-width="26" stroke-linecap="round"/>' +
      '<path d="M396 262C402 316 410 362 402 414" fill="none" stroke="#fdfaf2" stroke-width="3" stroke-dasharray="12 16" opacity=".8"/>' +
      '<g>' +
        '<rect x="322" y="196" width="118" height="70" rx="6" fill="#ecdcb6"/>' +
        '<path d="M310 202L381 158l71 44z" fill="#b85a2a"/>' +
        '<rect x="352" y="214" width="58" height="52" rx="4" fill="#9aa1ab"/>' +
        '<path d="M356 226h50M356 238h50M356 250h50" stroke="#7d838d" stroke-width="3"/>' +
        '<rect x="362" y="170" width="38" height="18" rx="5" fill="#e07a1f"/>' +
        '<circle cx="381" cy="179" r="4.5" fill="none" stroke="#fff" stroke-width="3"/>' +
      '</g>' +
      /* Brygga som peker ut mot skipet. */
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
      palme(244, 352, 1.05, false) +
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
    /* Et hus: veien hjem til menyen i verdenen. */
    hjem:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<path d="M4 15L16 5l12 10v11a2 2 0 0 1-2 2h-6v-8h-8v8H6a2 2 0 0 1-2-2z" fill="currentColor"/>' +
      '</svg>',
    /* En pil rundt: én gang til. */
    igjen:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<path d="M26 16a10 10 0 1 1-2.9-7.1" fill="none" stroke="currentColor"' +
          ' stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M27.5 3.5v9h-9z" fill="currentColor"/>' +
      '</svg>',
    malflagg:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<rect x="5" y="3" width="4" height="26" rx="2" fill="currentColor"/>' +
        '<path d="M9 5h19l-4 6 4 6H9z" fill="currentColor"/>' +
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
      '</svg>'
  };

  /* Badgen som erstattet «Videre»-knappen og pila i den: en ring som tømmes
   * etter hvert som tiden går, med tallet som står igjen midt i – samme idé
   * som et lite stoppeklokke-ur. Ikke en knapp, ikke trykkbar. Bygges én
   * gang når nedtellingen starter; js/moduser.js oppdaterer så bare ringen
   * og tallteksten videre for hvert sekund, slik at CSS-overgangen på ringen
   * får noe å animere fra og til. */
  var NEDTELLING_OMKRETS = 2 * Math.PI * 15;
  function nedtelling(n) {
    return '<svg viewBox="0 0 38 38" aria-hidden="true">' +
      '<circle cx="19" cy="19" r="15" fill="none" stroke="currentColor"' +
        ' stroke-width="3" opacity=".32"/>' +
      '<circle class="nedtelling-ring" cx="19" cy="19" r="15" fill="none"' +
        ' stroke="currentColor" stroke-width="3" stroke-linecap="round"' +
        ' transform="rotate(-90 19 19)" stroke-dasharray="' +
        NEDTELLING_OMKRETS.toFixed(1) + '" stroke-dashoffset="0"/>' +
      '<text class="nedtelling-tall" x="19" y="20" text-anchor="middle"' +
        ' dy=".35em" font-size="16" font-weight="800" fill="currentColor">' +
        n + '</text>' +
    '</svg>';
  }

  return {
    kart: kart,
    modusbilde: modusbilde,
    ikon: function (navn) { return IKONER[navn] || ''; },
    nedtelling: nedtelling,
    nedtellingOmkrets: NEDTELLING_OMKRETS,
    figurFor: function (verdenId) {
      return ({ bil: bil, skip: skip, dino: dino, tauebil: tauebil })[VERDENER[verdenId].figur]();
    },
    landskapFor: function (verdenId) {
      return ({ aser: aser, oy: oy, dal: dal })[VERDENER[verdenId].landskap]();
    }
  };
})();
