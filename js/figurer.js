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
  function ansikt(stil, oyne, munn, oyePlan, munnPlan) {
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

    /* Øynene og munnen kan ligge i hvert sitt plan (frontruta og
     * støtfangeren på bilene) – da får de hver sin matrise, se lag3d. */
    function i(plan, innhold) {
      return plan ? '<g transform="' + plan + '">' + innhold + '</g>' : innhold;
    }
    var glad = '<path d="' + munn.glad + '" fill="#7a2a22" stroke="#23262d" stroke-width="' + sw +
      '" stroke-linejoin="round"/>';

    return '<g class="ansikt">' +
      '<g class="u-vanlig">' + i(oyePlan, apne(0.25, 0.1)) + i(munnPlan, strek(munn.vanlig)) + '</g>' +
      '<g class="u-glad">' + i(oyePlan, buer(true)) + i(munnPlan, glad) + '</g>' +
      '<g class="u-hmm">' + i(oyePlan, apne(-0.15, 0.35) + bryn()) + i(munnPlan, strek(munn.hmm)) + '</g>' +
      '<g class="u-trott">' + i(oyePlan, buer(false)) + i(munnPlan, strek(munn.trott)) + '</g>' +
    '</g>';
  }

  /* Myk skygge der figuren møter bakken, litt mørkere rett under hjulene. */
  function bakkeskygge(cx, cy, rx, punkter) {
    var g = unik('skygge');
    return '<defs><radialGradient id="' + g + '" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="#000" stop-opacity=".36"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<ellipse class="fig-skygge" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="9" fill="url(#' + g + ')"/>' +
      punkter.map(function (x) {
        return '<ellipse cx="' + x + '" cy="' + (cy + 1) + '" rx="15" ry="3" fill="rgba(0,0,0,.25)"/>';
      }).join('');
  }

  /* ---------- en liten 3D-tegner for bilene ----------
   *
   * Bilene er bygget som enkle 3D-former – en sideprofil trukket ut i
   * bredden, som en kakeform – og tegnet fra ett og samme kamera. Da stemmer
   * vinklene på alle delene med hverandre av seg selv: siden, panseret,
   * ruta, lyktene, hjulene og skyggen ses fra nøyaktig samme sted. Tegnet for
   * hånd fikk hver del sin egen vinkel.
   *
   * Kameraet står litt foran til høyre og litt over. Det er ortografisk (uten
   * forsvinningspunkt), så et plan i 3D blir en ren SVG-matrise – derfor kan
   * øyne, munn og hjul tegnes flatt i sitt eget plan og legges på plass, og
   * hjulene ruller i sitt eget plan, ikke i skjermens.
   *
   * Koordinater: x langs bilen (fram er +x), y opp, z ut mot oss (nærsiden). */
  var KAMERA = (function () {
    var yaw = 32 * Math.PI / 180, pitch = 13 * Math.PI / 180;
    var st = Math.sin(yaw), ct = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    return {
      h: [ct, 0, -st],              /* skjermens høyre */
      o: [-st * sp, cp, -ct * sp],  /* skjermens opp */
      mot: [st * cp, sp, ct * cp]   /* mot kameraet */
    };
  })();
  /* Lyset kommer ovenfra, litt fra venstre og forfra. */
  var LYS = [-0.33, 0.83, 0.45];
  function prikk(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function r1(v) { return +v.toFixed(1); }

  /* En tegner for én figur. boks = [[x0,y0,z0],[x1,y1,z1]] rundt figuren;
   * den plasseres midt i bredden, med det laveste punktet på bunn. */
  function lag3d(boks, bredde, bunn) {
    var hjorner = [];
    [0, 1].forEach(function (a) { [0, 1].forEach(function (b) { [0, 1].forEach(function (c) {
      hjorner.push([boks[a][0], boks[b][1], boks[c][2]]);
    }); }); });
    var xs = hjorner.map(function (p) { return prikk(p, KAMERA.h); });
    var ys = hjorner.map(function (p) { return -prikk(p, KAMERA.o); });
    var ox = (bredde - (Math.max.apply(null, xs) - Math.min.apply(null, xs))) / 2 - Math.min.apply(null, xs);
    var oy = bunn - Math.max.apply(null, ys);

    function p2(p) { return [ox + prikk(p, KAMERA.h), oy - prikk(p, KAMERA.o)]; }
    function sti(punkter) {
      return 'M' + punkter.map(function (p) { var q = p2(p); return r1(q[0]) + ' ' + r1(q[1]); })
        .join('L') + 'Z';
    }
    /* En flate får farge etter hvor mye den vender mot lyset. */
    function skygge(hex, normal) {
      var k = 0.6 + 0.45 * Math.max(0, prikk(normal, LYS));
      var v = parseInt(hex.slice(1), 16);
      return 'rgb(' + [v >> 16, (v >> 8) & 255, v & 255].map(function (c) {
        return Math.min(255, Math.round(c * k));
      }).join(',') + ')';
    }
    /* En profil (mot klokka, y opp) trukket ut fra z0 til z1. Kantflatene
     * som vender mot kameraet tegnes bakerst først, så nærsiden over. */
    function uttrukket(profil, z0, z1, farge, nerFyll) {
      var flater = [];
      profil.forEach(function (a, i) {
        var b = profil[(i + 1) % profil.length];
        var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy);
        var nrm = [dy / l, -dx / l, 0];
        if (prikk(nrm, KAMERA.mot) <= 0.01) return;
        var q = [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]];
        flater.push({ d: sti(q), dybde: prikk(q[0], KAMERA.mot) + prikk(q[2], KAMERA.mot),
                      fyll: skygge(farge, nrm) });
      });
      flater.sort(function (x, y) { return x.dybde - y.dybde; });
      return flater.map(function (f) {
        /* streken i samme farge tetter hårfine sprekker mellom flatene */
        return '<path d="' + f.d + '" fill="' + f.fyll + '" stroke="' + f.fyll + '" stroke-width=".6" stroke-linejoin="round"/>';
      }).join('') +
        '<path d="' + sti(profil.map(function (p) { return [p[0], p[1], z1]; })) +
        '" fill="' + (nerFyll || skygge(farge, [0, 0, 1])) + '"/>';
    }
    /* Et plan som SVG-matrise: origo O, lokal x langs A, lokal y langs B. */
    function plan(O, A, B) {
      var o = p2(O);
      return 'matrix(' + [prikk(A, KAMERA.h), -prikk(A, KAMERA.o),
                          prikk(B, KAMERA.h), -prikk(B, KAMERA.o), o[0], o[1]]
        .map(function (v) { return +v.toFixed(3); }).join(' ') + ')';
    }
    /* Et punkt på en kant, t fra 0 (a) til 1 (b). */
    function langs(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    /* Planet til en kant i profilen, med lokal x på tvers av bilen (mot
     * høyre på skjermen) og lokal y nedover kanten fra b mot a. */
    function kantplan(a, b, t, z) {
      var p = langs(a, b, t), dx = a[0] - b[0], dy = a[1] - b[1], l = Math.sqrt(dx * dx + dy * dy);
      return plan([p[0], p[1], z || 0], [0, 0, -1], [dx / l, dy / l, 0]);
    }
    /* Sidens plan i dybden z, med origo i (x, y) og lokal y nedover. */
    function side(x, y, z) { return plan([x, y, z], [1, 0, 0], [0, -1, 0]); }
    /* Et hjul i sidens plan (z), med dekkets tykkelse innover. */
    function hjul(x, y, z, r, klasse, tykk) {
      return '<g transform="' + side(x, y, z - (tykk || 6)) + '"><circle r="' + r + '" fill="#111317"/></g>' +
        '<g transform="' + side(x, y, z) + '">' + hjulInnmat(r, klasse) + '</g>';
    }
    /* Hjulbuen: en halvsirkel over hjulet, ned til underkanten (ned under
     * navet) av karosseriet. */
    function hjulbue(x, y, z, r, ned) {
      return '<path transform="' + side(x, y, z) + '" d="M' + -r + ' ' + ned + 'V0A' + r + ' ' + r +
        ' 0 0 1 ' + r + ' 0V' + ned + 'Z" fill="#3b0b05" fill-opacity=".85"/>';
    }
    /* Runder av hjørnene i en profil (Chaikin): hver kant beholder midten
     * sin, så planene til lykter og ruter ligger der de lå. */
    function rund(profil) {
      return [].concat.apply([], profil.map(function (a, i) {
        var b = profil[(i + 1) % profil.length];
        return [[a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25],
                [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]];
      }));
    }
    return { sti: sti, uttrukket: uttrukket, plan: plan, langs: langs, side: side, rund: rund,
             kantplan: kantplan, hjul: hjul, hjulbue: hjulbue };
  }

  /* Hjulet flatt, med sentrum i origo: eikene og dekkmønsteret roterer i den
   * indre gruppa (.hjul, se «rull» i stil.css). Glimtet i dekket roterer ikke. */
  function hjulInnmat(r, klasse) {
    return '<g class="hjul ' + klasse + '">' +
        '<circle r="' + r + '" fill="#262a31"/>' +
        '<circle r="' + r1(r - 2.4) + '" fill="none" stroke="#3b4048" stroke-width="3.2" stroke-dasharray="3.2 2.6"/>' +
        '<circle r="' + r1(r * 0.6) + '" fill="#eef0f3"/>' +
        '<circle r="' + r1(r * 0.48) + '" fill="#b9bfc7"/>' +
        '<g stroke="#eef0f3" stroke-width="3" stroke-linecap="round">' +
          '<path d="M0 ' + r1(-r * 0.46) + 'V' + r1(r * 0.46) + '"/>' +
          '<path d="M' + r1(-r * 0.4) + ' ' + r1(-r * 0.23) + 'L' + r1(r * 0.4) + ' ' + r1(r * 0.23) + '"/>' +
          '<path d="M' + r1(-r * 0.4) + ' ' + r1(r * 0.23) + 'L' + r1(r * 0.4) + ' ' + r1(-r * 0.23) + '"/>' +
        '</g>' +
        '<circle r="' + r1(r * 0.16) + '" fill="#6d747e"/>' +
      '</g>' +
      '<path d="M' + r1(-r * 0.72) + ' ' + r1(-r * 0.4) + 'A' + r + ' ' + r + ' 0 0 1 ' +
        r1(-r * 0.2) + ' ' + r1(-r * 0.86) +
        '" stroke="rgba(255,255,255,.22)" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }

  /* Myk skygge på bakken (y = 0), i samme perspektiv som resten. */
  function bakkeskygge3d(t, lengde, bredde) {
    var g = unik('skygge');
    return '<defs><radialGradient id="' + g + '" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="#000" stop-opacity=".38"/>' +
        '<stop offset=".7" stop-color="#000" stop-opacity=".16"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<g transform="' + t.plan([0, 0, 0], [1, 0, 0], [0, 0, 1]) + '">' +
        '<ellipse class="fig-skygge" rx="' + lengde + '" ry="' + bredde + '" fill="url(#' + g + ')"/></g>';
  }

  /* ---------- racerbilen ---------- */

  /* Vår egen racerbil: rød, med lynmerke og øyne i frontruta. I samme ånd
   * som bilfilmene, men ingen andres figur – barnet gir den navn selv. */
  function bil() {
    var gSide = unik('side'), gGlass = unik('glass');
    var t = lag3d([[-97, 0, -34], [99, 62, 34]], 200, 100);
    /* Sideprofilene, mot klokka med y opp: underdelen og kupeen. */
    var kropp = [[-90, 8], [84, 8], [93, 14], [96, 24], [92, 32], [64, 36], [38, 38],
                 [-60, 40], [-86, 38], [-94, 28], [-95, 16]];
    var kupe = [[-58, 38], [38, 37], [14, 58], [-28, 60], [-48, 52]];
    var W = 31, K = 24;
    /* frontruta: kanten fra panseret opp til taket */
    var ruteA = [38, 37], ruteB = [14, 58];
    function rute(a, b, t0, t1, z) {
      var p = t.langs(a, b, t0), q = t.langs(a, b, t1);
      return t.sti([[p[0], p[1], -z], [q[0], q[1], -z], [q[0], q[1], z], [p[0], p[1], z]]);
    }
    return '' +
    '<svg class="fig fig--bil" viewBox="0 0 200 104" role="img" aria-label="Racerbil">' +
      '<defs>' +
        '<linearGradient id="' + gSide + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ff6a5a"/><stop offset=".5" stop-color="#df3528"/>' +
          '<stop offset="1" stop-color="#8f1a0d"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gGlass + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#f2fbff"/><stop offset=".5" stop-color="#aad6ee"/>' +
          '<stop offset=".58" stop-color="#6f9fbf"/><stop offset="1" stop-color="#a9d2ea"/>' +
        '</linearGradient>' +
      '</defs>' +

      bakkeskygge3d(t, 104, 40) +
      /* hjulene på andre siden */
      t.hjul(-56, 15, -W - 1, 15.5, 'hjul--bak', -6) +
      t.hjul(56, 15, -W - 1, 15.5, 'hjul--front', -6) +
      /* spoilerstagene, bak kroppen */
      t.uttrukket([[-91, 38], [-87, 38], [-87, 46], [-91, 46]], 14, 19, '#8d1a0c') +
      t.uttrukket([[-91, 38], [-87, 38], [-87, 46], [-91, 46]], -19, -14, '#8d1a0c') +

      t.uttrukket(t.rund(kropp), -W, W, '#e2382b', 'url(#' + gSide + ')') +
      /* glansstripe langs siden og lynmerket på døra */
      '<g transform="' + t.side(0, 0, W + 0.3) + '">' +
        '<path d="M-84 -31H86" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>' +
        '<path class="fig-merke" d="M-12 -34l14-1-6 9 12-1-20 20 5-13-10 1z" fill="#fff" opacity=".94"/>' +
        '<rect x="-98" y="-22" width="8" height="5" rx="2.5" fill="#8e939c"/>' +
      '</g>' +

      /* hjulbuene på nærsiden – de bryter glansstripa */
      t.hjulbue(-56, 15, W + 0.2, 19, 7) + t.hjulbue(56, 15, W + 0.2, 19, 7) +
      t.uttrukket(t.rund(kupe), -K, K, '#d8342a', '#c22c21') +
      /* sidevinduer i kupeens nærside */
      '<path d="' + t.sti([[31, 40, K + .2], [12, 55, K + .2], [-8, 56, K + .2], [-8, 40.5, K + .2]]) + '" fill="url(#' + gGlass + ')"/>' +
      '<path d="' + t.sti([[-12, 40.5, K + .2], [-12, 56, K + .2], [-27, 57, K + .2], [-44, 50, K + .2], [-51, 40.5, K + .2]]) + '" fill="url(#' + gGlass + ')"/>' +
      /* frontruta og bakruta */
      '<path d="' + rute(ruteA, ruteB, 0.2, 0.8, K - 3) + '" fill="url(#' + gGlass + ')"/>' +
      '<path d="' + rute([-28, 60], [-48, 52], 0.25, 0.75, K - 3) + '" fill="url(#' + gGlass + ')"/>' +

      /* spoilervingen */
      t.uttrukket([[-97, 45], [-80, 45], [-80, 49], [-97, 49]], -30, 30, '#b8271a') +

      /* fronten: lykter oppe, grill og støtfanger nede */
      '<g transform="' + t.kantplan([96, 24], [92, 32], 0.5) + '">' +
        '<ellipse cx="-21" rx="5.5" ry="2.8" fill="#ffeeb0"/><ellipse cx="21" rx="5.5" ry="2.8" fill="#ffeeb0"/>' +
      '</g>' +
      '<g transform="' + t.kantplan([93, 14], [96, 24], 0.5) + '">' +
        '<rect x="-17" y="-4" width="34" height="8" rx="3" fill="#7d170b"/>' +
      '</g>' +

      t.hjul(-56, 15, W + 1.5, 15.5, 'hjul--bak') +
      t.hjul(56, 15, W + 1.5, 15.5, 'hjul--front') +

      ansikt('stor', [[-10, 0, 6.2], [10, 0, 6.2]], {
        vanlig: 'M-10 -1q10 7 20 0',
        glad: 'M-11 -2q11 11 22 0z',
        hmm: 'M-8 1q8-3 16 1',
        trott: 'M-5 0q5 3 10 0'
      }, t.kantplan(ruteA, ruteB, 0.5), t.kantplan([93, 14], [96, 24], 0.5)) +
    '</svg>';
  }

  /* ---------- sjørøverskipet ---------- */

  /* Skipet med kapteinen på dekk: trekantet hatt med hodeskalle, stort rødt
   * skjegg – han heter jo Kaptein Rødskjegg fra start – og en papegøye på
   * skulderen. Vår egen sjørøver, i samme ånd som dem i barnebøkene. */
  function skip() {
    var gSkrog = unik('skrog'), gSeil = unik('seil'), gSeil2 = unik('seil2');
    return '' +
    '<svg class="fig fig--skip" viewBox="0 0 200 140" role="img" aria-label="Sjørøverskip">' +
      '<defs>' +
        '<linearGradient id="' + gSkrog + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#c08850"/><stop offset=".5" stop-color="#8a5a2e"/>' +
          '<stop offset="1" stop-color="#4f3018"/>' +
        '</linearGradient>' +
        /* Seilene buler ut: lyst der vinden fyller dem, skygge mot kanten. */
        '<radialGradient id="' + gSeil + '" cx=".65" cy=".45" r=".75">' +
          '<stop offset="0" stop-color="#fffef8"/><stop offset=".7" stop-color="#f1e8d2"/>' +
          '<stop offset="1" stop-color="#d4c6a4"/>' +
        '</radialGradient>' +
        '<radialGradient id="' + gSeil2 + '" cx=".35" cy=".45" r=".75">' +
          '<stop offset="0" stop-color="#fffef8"/><stop offset=".7" stop-color="#efe5cc"/>' +
          '<stop offset="1" stop-color="#cfc09c"/>' +
        '</radialGradient>' +
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
        '<path d="M106 34c26 8 39 28 41 54h-41z" fill="url(#' + gSeil2 + ')"/>' +
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

      /* skrog med planker, og dekket sett litt ovenfra */
      '<path d="M22 94h156l-14 28c-3 6-9 10-16 10H52c-7 0-13-4-16-10z" fill="url(#' + gSkrog + ')"/>' +
      '<path d="M16 90c22-10 146-10 168 0-22-5-146-5-168 0z" fill="#d9a86c"/>' +
      '<path d="M18 88h164a5 5 0 0 1 0 10H18a5 5 0 0 1 0-10z" fill="#c8492f"/>' +
      '<path d="M20 89h160" stroke="#e8735a" stroke-width="1.5" stroke-linecap="round"/>' +
      '<g stroke="rgba(0,0,0,.14)" stroke-width="2" stroke-linecap="round" fill="none">' +
        '<path d="M30 104h140"/><path d="M38 116h124"/><path d="M48 126h104"/>' +
      '</g>' +
      '<path d="M26 99h148" stroke="rgba(255,255,255,.2)" stroke-width="2" stroke-linecap="round"/>' +
      /* vannlinja: skroget blir mørkere der det møter sjøen */
      '<path d="M44 124h112c-3 5-8 8-14 8H58c-6 0-11-3-14-8z" fill="rgba(0,0,0,.2)"/>' +
      '<g fill="#ffe9a0" stroke="#7d5330" stroke-width="1.5">' +
        '<circle cx="66" cy="110" r="5"/><circle cx="100" cy="110" r="5"/><circle cx="134" cy="110" r="5"/>' +
      '</g>' +
    '</svg>';
  }

  /* ---------- tauebilen ---------- */

  /* Vår egen tauebil: oransje, litt skeiv antenne, noen rustprikker og et
   * stort glis – en hjelpsom venn fra verkstedet. Kranen og kroken bak er
   * det som gjør den til en tauebil; kroken svinger når den kjører.
   * Tegnet med samme kamera som racerbilen (lag3d). */
  function tauebil() {
    var gLakk = unik('tlakk'), gGlass = unik('tglass');
    var t = lag3d([[-94, 0, -33], [101, 88, 33]], 200, 120);
    var W = 30, L = 28;
    /* førerhuset med panseret, og lasteplanet bak (mot klokka, y opp) */
    var hus = [[16, 9], [90, 9], [95, 14], [95, 37], [90, 42], [60, 44], [52, 73], [48, 77],
               [22, 77], [16, 72]];
    var ruteA = [60, 44], ruteB = [52, 73];
    /* Kranarmen er en bjelke fra foten på lasteplanet skrått opp og bakover. */
    var fot = [-44, 34], tupp = [-78, 82];
    var dx = tupp[0] - fot[0], dy = tupp[1] - fot[1], l = Math.sqrt(dx * dx + dy * dy);
    var nx = dy / l * 3.5, ny = -dx / l * 3.5;
    var arm = [[fot[0] - nx, fot[1] - ny], [tupp[0] - nx, tupp[1] - ny],
               [tupp[0] + nx, tupp[1] + ny], [fot[0] + nx, fot[1] + ny]];
    function rute(t0, t1, z) {
      var p = t.langs(ruteA, ruteB, t0), q = t.langs(ruteA, ruteB, t1);
      return t.sti([[p[0], p[1], -z], [q[0], q[1], -z], [q[0], q[1], z], [p[0], p[1], z]]);
    }
    return '' +
    '<svg class="fig fig--taue" viewBox="0 0 200 124" role="img" aria-label="Tauebil">' +
      '<defs>' +
        '<linearGradient id="' + gLakk + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffb35c"/><stop offset=".5" stop-color="#f07f1e"/>' +
          '<stop offset="1" stop-color="#a94f0a"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gGlass + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#eef9fe"/><stop offset=".55" stop-color="#a9d3ea"/>' +
          '<stop offset=".62" stop-color="#7fb2cf"/><stop offset="1" stop-color="#b9dcef"/>' +
        '</linearGradient>' +
      '</defs>' +

      bakkeskygge3d(t, 104, 40) +
      /* hjulene på andre siden */
      t.hjul(-50, 16, -L - 1, 16, 'hjul--bak', -6) +
      t.hjul(62, 16, -W - 1, 16, 'hjul--front', -6) +

      /* rammen under, og lasteplanet med varselstriper bakerst */
      t.uttrukket([[-86, 9], [16, 9], [16, 16], [-86, 16]], -18, 18, '#3a3f47') +
      t.uttrukket([[-92, 16], [16, 16], [16, 34], [-92, 34]], -L, L, '#646b75') +
      t.hjulbue(-50, 16, L + 0.2, 19, 0) +
      '<g transform="' + t.side(-92, 34, L + 0.2) + '">' +
        '<rect width="14" height="18" fill="#f2c33d"/>' +
        '<path d="M2 0l6 18M8 0l6 14" stroke="#23262d" stroke-width="2.6"/>' +
      '</g>' +

      /* kranen: foten, armen, kroken som henger i wiren, og trinsa ytterst */
      t.uttrukket([[-54, 34], [-34, 34], [-38, 44], [-50, 44]], -8, 8, '#4a5058') +
      t.uttrukket(arm, -4, 4, '#5b616b') +
      '<g transform="' + t.side(tupp[0], tupp[1], 0) + '"><g class="krok">' +
        '<path d="M0 0v28" stroke="#2c3036" stroke-width="2"/>' +
        '<path d="M0 27v7a6 6 0 1 0 6 6" stroke="#8e939c" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
      '</g></g>' +
      '<g transform="' + t.side(tupp[0], tupp[1], 4.2) + '">' +
        '<circle r="5.5" fill="#3a3f47"/><circle r="2" fill="#8e939c"/>' +
      '</g>' +

      /* førerhuset */
      t.uttrukket(t.rund(hus), -W, W, '#f07f1e', 'url(#' + gLakk + ')') +
      t.hjulbue(62, 16, W + 0.2, 19, 7) +
      '<g transform="' + t.side(0, 0, W + 0.2) + '">' +
        '<path d="M20 -38H88" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>' +
        '<g fill="#8e4410" opacity=".55"><circle cx="30" cy="-26" r="2"/><circle cx="36" cy="-21" r="1.4"/><circle cx="25" cy="-18" r="1.2"/></g>' +
      '</g>' +
      '<path d="' + t.sti([[22, 48, W + .2], [54, 48, W + .2], [48, 70, W + .2], [22, 70, W + .2]]) + '" fill="url(#' + gGlass + ')"/>' +
      '<path d="' + rute(0.2, 0.8, W - 4) + '" fill="url(#' + gGlass + ')"/>' +
      /* varsellys på taket og en skeiv antenne */
      t.uttrukket([[30, 77], [42, 77], [41, 82], [31, 82]], -5, 5, '#f2c33d') +
      '<g transform="' + t.side(21, 77, W - 3) + '">' +
        '<path d="M0 0q-3-9 4-15" stroke="#3a3f47" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="4" cy="-15" r="2.2" fill="#d8392b"/>' +
      '</g>' +

      /* fronten: lykter oppe, og støtfangeren under munnen */
      '<g transform="' + t.kantplan([95, 14], [95, 37], 0.72) + '">' +
        '<ellipse cx="-20" rx="5" ry="3.6" fill="#ffeeb0"/><ellipse cx="20" rx="5" ry="3.6" fill="#ffeeb0"/>' +
      '</g>' +
      t.uttrukket([[93, 5], [101, 5], [101, 13], [93, 13]], -33, 33, '#9aa1ab') +

      t.hjul(-50, 16, L + 1.5, 16, 'hjul--bak') +
      t.hjul(62, 16, W + 1.5, 16, 'hjul--front') +

      ansikt('stor', [[-10, 0, 5.8], [10, 0, 5.8]], {
        vanlig: 'M-13 -2q13 9 26 0',
        glad: 'M-14 -3q14 14 28 0z',
        hmm: 'M-10 1q10-3 20 1',
        trott: 'M-6 0q6 3 12 0'
      }, t.kantplan(ruteA, ruteB, 0.5), t.kantplan([95, 14], [95, 37], 0.3)) +
    '</svg>';
  }

  /* ---------- dinosauren ---------- */

  /* Vår egen dinosaur – en rolig, rund planteeter med plater på ryggen.
   * Samme oppskrift som bilen og skipet: ingen andres figur, og barnet gir
   * den navn selv. */
  function dino() {
    var gHud = unik('hud'), gPlate = unik('plate'), gLys = unik('lys');
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
        /* Lyset fra oven til venstre: en myk lysflekk på ryggen og hodet. */
        '<radialGradient id="' + gLys + '" cx=".5" cy=".5" r=".5">' +
          '<stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
        '</radialGradient>' +
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
      /* Lys på ryggen, skygge under magen, og noen flekker i huden. */
      '<ellipse cx="84" cy="60" rx="34" ry="14" fill="url(#' + gLys + ')"/>' +
      '<path d="M48 90c20 18 70 20 96 2-8 16-30 20-50 20s-40-8-46-22z" fill="rgba(0,0,0,.14)"/>' +
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
      '<ellipse cx="162" cy="33" rx="12" ry="6" fill="url(#' + gLys + ')"/>' +
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

  /* En overraskelse på kartet: tegningen, pluss en usynlig treffsirkel rundt
   * den. Sirkelen er så stor at den er minst 44 px også der kartet er minst
   * (liggende telefon), for det er ikke bare tegningen han sikter på. Hva som
   * skjer ved trykk, står i CSS (.overraskelse.spiller) og i Spill: ett
   * lite øyeblikk, så stille igjen. */
  var TREFF = 125;
  function overraskelse(hva, cx, cy, innhold) {
    return '<g class="overraskelse" data-hva="' + hva + '">' +
      '<circle class="treff" cx="' + cx + '" cy="' + cy + '" r="' + TREFF + '"/>' +
      innhold + '</g>';
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
      overraskelse('vulkan', 600, 112,
        '<g class="rok" fill="#e4dfda">' +
          '<circle cx="588" cy="126" r="11"/><circle cx="606" cy="118" r="13"/>' +
          '<circle cx="597" cy="104" r="9"/>' +
        '</g>') +

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
      overraskelse('palme', 556, 575,
        palme(556, 596, 0.95, true) +
        '<circle class="kokos" cx="548" cy="569" r="5.5" fill="#6b4322"/>') +
      palme(742, 452, 1, false) +
      palme(778, 336, 0.85, true) +
      stein(556, 340, 1) +
      stein(300, 552, 0.85) +
      stein(626, 618, 0.9) +
      kryss(276, 380, 1) +
      kryss(568, 636, 0.9) +
      overraskelse('skatt', 768, 418,
        kryss(768, 418, 0.85) +
        '<g class="kiste">' +
          '<rect x="750" y="396" width="36" height="22" rx="3" fill="#a9713f"/>' +
          '<path d="M750 398c0-12 8-16 18-16s18 4 18 16z" fill="#8d5a2c"/>' +
          '<rect x="750" y="396" width="36" height="4" fill="#f2c33d"/>' +
          '<rect x="765" y="400" width="6" height="8" rx="1.5" fill="#f2c33d"/>' +
          '<g fill="#ffe27a"><circle cx="744" cy="380" r="3"/><circle cx="794" cy="376" r="3.5"/>' +
          '<circle cx="770" cy="368" r="2.5"/></g>' +
        '</g>') +

      /* Havet rundt: skvalpesteiner, bølger og et kompass i hjørnet. */
      stein(140, 626, 1.1) +
      overraskelse('maake', 902, 196,
        stein(902, 206, 1) +
        '<g class="maake">' +
          '<path d="M896 196v6M903 196v6" stroke="#ea7a33" stroke-width="2" stroke-linecap="round"/>' +
          '<ellipse cx="899" cy="189" rx="11" ry="7.5" fill="#fff"/>' +
          '<path d="M890 187q9-7 18 0" stroke="#9aa7ad" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<circle cx="909" cy="180" r="5.5" fill="#fff"/>' +
          '<path d="M913 180l7 2-7 2z" fill="#f2c33d"/>' +
          '<circle cx="910.5" cy="179" r="1.2" fill="#23262d"/>' +
        '</g>') +
      bolge(78, 214) +
      bolge(880, 470) +
      bolge(196, 108) +
      overraskelse('fisk', 360, 770,
        bolge(330, 764) +
        '<g class="fisk">' +
          '<path d="M346 770l-12-8v16z" fill="#e0701a"/>' +
          '<ellipse cx="360" cy="770" rx="15" ry="8.5" fill="#f08a24"/>' +
          '<circle cx="368" cy="768" r="1.8" fill="#23262d"/>' +
        '</g>' +
        '<g class="plask" fill="#e6f8f4">' +
          '<circle cx="432" cy="772" r="4"/><circle cx="444" cy="764" r="3"/><circle cx="420" cy="766" r="3"/>' +
        '</g>') +
      overraskelse('kompass', 122, 714,
        '<g transform="translate(122,714)">' +
          '<circle r="46" fill="rgba(255,253,244,.88)"/>' +
          '<circle r="46" fill="none" stroke="#b07a44" stroke-width="4"/>' +
          '<g class="nal">' +
            '<path d="M-34 0L0-10 34 0 0 10z" fill="#7a5b45" opacity=".7"/>' +
            '<path d="M0-34L10 0 0 34-10 0z" fill="#ea7a33"/>' +
          '</g>' +
        '</g>') +
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
