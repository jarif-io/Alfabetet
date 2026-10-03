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
            '<g class="pupill"><circle cx="' + n(x + r * dx) + '" cy="' + n(y + r * dy) +
              '" r="' + n(r * 0.55) + '" fill="#23262d"/>' +
            '<circle cx="' + n(x + r * dx + r * 0.2) + '" cy="' + n(y + r * dy - r * 0.25) +
              '" r="' + n(r * 0.2) + '" fill="#fff"/></g>'
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

    var glad = '<path d="' + munn.glad + '" fill="#7a2a22" stroke="#23262d" stroke-width="' + sw +
      '" stroke-linejoin="round"/>';

    return '<g class="ansikt">' +
      '<g class="u-vanlig">' + apne(0.25, 0.1) + strek(munn.vanlig) + '</g>' +
      '<g class="u-glad">' + buer(true) + glad + '</g>' +
      '<g class="u-hmm">' + apne(-0.15, 0.35) + bryn() + strek(munn.hmm) + '</g>' +
      '<g class="u-trott">' + buer(false) + strek(munn.trott) + '</g>' +
    '</g>';
  }

  /* Myk skygge der figuren møter bakken, litt mørkere rett under hjulene. */
  function bakkeskygge(cx, cy, rx, punkter) {
    var g = unik('skygge');
    return '<defs><radialGradient id="' + g + '" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="#281e0f" stop-opacity=".36"/>' +
        '<stop offset="1" stop-color="#281e0f" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<ellipse class="fig-skygge" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="9" fill="url(#' + g + ')"/>' +
      punkter.map(function (x) {
        return '<ellipse cx="' + x + '" cy="' + (cy + 1) + '" rx="15" ry="3" fill="rgba(0,0,0,.25)"/>';
      }).join('');
  }

  /* ---------- bilene i 3D ----------
   *
   * Bilene er modellert som enkle 3D-former og tegnet med perspektiv fra ett
   * kamera, så alle delene har samme vinkel: karosseriet er tverrsnitt langs
   * bilen (som spantene i en båt), hjulene er sylindere, og kranen og
   * spoileren er bjelker. Hver flate får lys og lakkglans etter hvor den
   * vender, og flatene males bakfra og framover. Øynene fyller frontruta og
   * munnen sitter foran, som på bilene i filmene.
   *
   * Hver bil tegnes to ganger: på skrå mot barnet når den står (vis-sta), og
   * nesten rett fra siden mens den kjører bortover veien (vis-kjor, se
   * stil.css). Et hånd­tegnet forsøk på skrå fikk hver del sin egen vinkel.
   *
   * Koordinater: x langs bilen (fram er +x), y opp, z ut mot kameraet. */

  function r1(v) { return +v.toFixed(1); }
  function pluss(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function minus(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function gange(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function prikk(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vkryss(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function enhet(a) { return gange(a, 1 / (Math.sqrt(prikk(a, a)) || 1)); }
  function midten(pts) {
    return gange(pts.reduce(pluss, [0, 0, 0]), 1 / pts.length);
  }

  var LYS = enhet([0.35, 1, 0.6]);

  /* Kameraet ser mot mal fra avstand, dreid yaw grader fra siden (90 = rett
   * forfra) og pitch grader ovenfra. p() gir skjermpunktet og avstanden. */
  function kamera(yaw, pitch, avstand, mal) {
    var Y = yaw * Math.PI / 180, P = pitch * Math.PI / 180;
    var mot = [Math.sin(Y) * Math.cos(P), Math.sin(P), Math.cos(Y) * Math.cos(P)];
    var h = [Math.cos(Y), 0, -Math.sin(Y)], o = vkryss(mot, h);
    var oye = pluss(mal, gange(mot, avstand));
    return {
      oye: oye, avstand: avstand,
      p: function (q) {
        var r = minus(q, oye), d = -prikk(r, mot), s = avstand / d;
        return [prikk(r, h) * s, -prikk(r, o) * s, d];
      }
    };
  }
  var STAR = kamera(58, 12, 460, [0, 28, 0]);
  var KJORER = kamera(16, 9, 600, [0, 28, 0]);

  /* Fargen på en flate: litt lys overalt, mer der den vender mot lyset, og
   * et glansglimt der lyset speiles mot kameraet. */
  function farge(hex, n, punkt, kam, glans) {
    var v = enhet(minus(kam.oye, punkt));
    var dif = Math.max(0, prikk(n, LYS));
    var sp = (glans || 0) * Math.pow(Math.max(0, prikk(n, enhet(pluss(LYS, v)))), 40);
    var c = parseInt(hex.slice(1), 16);
    return 'rgb(' + [c >> 16, (c >> 8) & 255, c & 255].map(function (x) {
      return Math.min(255, Math.round(x * (0.5 + 0.58 * dif) + 255 * sp));
    }).join(',') + ')';
  }
  /* Normalen til en flate (Newell), snudd utover fra sentrum. */
  function normal(pts, sentrum) {
    var n = [0, 0, 0];
    pts.forEach(function (a, i) {
      var b = pts[(i + 1) % pts.length];
      n = pluss(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]);
    });
    n = enhet(n);
    return prikk(n, minus(midten(pts), sentrum)) < 0 ? gange(n, -1) : n;
  }
  function sti(kam, pts) {
    return 'M' + pts.map(function (q) { var s = kam.p(q); return r1(s[0]) + ' ' + r1(s[1]); }).join('L') + 'Z';
  }
  function flate(pts, hex, glans, sentrum) {
    return { pts: pts, hex: hex, glans: glans, n: normal(pts, sentrum || [0, 30, 0]) };
  }

  /* Glatt verdi k mellom stasjonene [x, …] (Hermite med helning fra naboene). */
  function glatt(st, k, x) {
    var i = 0;
    while (i < st.length - 2 && x > st[i + 1][0]) i++;
    var a = st[i], b = st[i + 1], h = b[0] - a[0], t = Math.max(0, Math.min(1, (x - a[0]) / h));
    function helning(j) {
      var f = st[Math.max(0, j - 1)], e = st[Math.min(st.length - 1, j + 1)];
      return (e[k] - f[k]) / (e[0] - f[0]);
    }
    var t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * h * helning(i) +
           (-2 * t3 + 3 * t2) * b[k] + (t3 - t2) * h * helning(i + 1);
  }

  /* Karosseri av tverrsnitt. stasjoner: [x, bunn, topp, halvbredde, hytte,
   * hyttebredde] – hytta er det som stikker opp over toppen (tak eller
   * panser). Hjulbuene [x, y, r] skjæres ut av bunnen. materiale(x, j) gir
   * [farge, glans] for flatebånd j (0 = bunnen, 7 = midt på taket). */
  function karosseri(st, buer, materiale) {
    function bunn(x) {
      var y = glatt(st, 1, x);
      buer.forEach(function (b) {
        var dx = x - b[0];
        if (Math.abs(dx) < b[2]) y = Math.max(y, b[1] + Math.sqrt(b[2] * b[2] - dx * dx));
      });
      return Math.min(y, glatt(st, 2, x) - 3);
    }
    var xs = [];
    for (var x = st[0][0]; x < st[st.length - 1][0]; x += 3) xs.push(x);
    st.forEach(function (s) { xs.push(s[0]); });
    buer.forEach(function (b) {
      var kant = Math.sqrt(Math.max(0, b[2] * b[2] - Math.pow(b[1] - glatt(st, 1, b[0]), 2)));
      [-kant - 0.3, -kant + 0.3, kant - 0.3, kant + 0.3].forEach(function (d) { xs.push(b[0] + d); });
    });
    xs = xs.filter(function (x) { return x >= st[0][0] && x <= st[st.length - 1][0]; })
      .sort(function (a, b) { return a - b; })
      .filter(function (x, i, l) { return !i || x - l[i - 1] > 0.1; });

    var ringer = xs.map(function (x) {
      var yb = bunn(x), yt = glatt(st, 2, x), w = glatt(st, 3, x), r = glatt(st, 4, x), cw = glatt(st, 5, x);
      var h = yt - yb;
      var halv = [[0, yb], [0.75 * w, yb], [w, yb + 0.3 * h], [w, yb + 0.75 * h], [0.86 * w, yt],
                  [cw, yt + 0.12 * r], [0.92 * cw, yt + 0.7 * r], [0.5 * cw, yt + r], [0, yt + r]];
      var ring = halv.map(function (p) { return [x, p[1], p[0]]; });
      for (var i = 7; i >= 1; i--) ring.push([x, halv[i][1], -halv[i][0]]);
      return { x: x, pts: ring, sentrum: [x, (yb + yt + r) / 2, 0] };
    });
    var flater = [];
    for (var i = 0; i < ringer.length - 1; i++) {
      var a = ringer[i], b = ringer[i + 1], xm = (a.x + b.x) / 2;
      for (var k = 0; k < 16; k++) {
        var k2 = (k + 1) % 16, m = materiale(xm, k < 8 ? k : 15 - k);
        flater.push(flate([a.pts[k], a.pts[k2], b.pts[k2], b.pts[k]], m[0], m[1],
                          midten([a.sentrum, b.sentrum])));
      }
    }
    var m0 = materiale(-999, 3), m1 = materiale(999, 3);
    flater.push(flate(ringer[0].pts, m0[0], m0[1], pluss(ringer[0].sentrum, [1, 0, 0])));
    flater.push(flate(ringer[ringer.length - 1].pts, m1[0], m1[1],
                      pluss(ringer[ringer.length - 1].sentrum, [-1, 0, 0])));
    return flater;
  }

  /* En bjelke fra a til b med halve tverrmål hv og hz, delt opp på langs
   * så flatene males i riktig rekkefølge. */
  function bjelke(a, b, hv, hz, hex, glans) {
    var u = enhet(minus(b, a));
    var side = Math.abs(u[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    var v = enhet(vkryss(side, u));
    var lengde = Math.sqrt(prikk(minus(b, a), minus(b, a)));
    var n = Math.max(1, Math.ceil(lengde / 10)), sentrum = midten([a, b]);
    var rundt = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    function hj(p, s) { return pluss(p, pluss(gange(v, s[0] * hv), gange(side, s[1] * hz))); }
    var flater = [];
    for (var i = 0; i < n; i++) {
      var p = pluss(a, gange(minus(b, a), i / n)), q = pluss(a, gange(minus(b, a), (i + 1) / n));
      var s = midten([p, q]);
      rundt.forEach(function (c, k) {
        var d = rundt[(k + 1) % 4];
        flater.push(flate([hj(p, c), hj(p, d), hj(q, d), hj(q, c)], hex, glans, s));
      });
    }
    flater.push(flate(rundt.map(function (c) { return hj(a, c); }), hex, glans, sentrum));
    flater.push(flate(rundt.map(function (c) { return hj(b, c); }), hex, glans, sentrum));
    return flater;
  }

  /* Et hjul: dekket er en sylinder, og siden mot oss (med felgen i en indre
   * .hjul-gruppe som ruller, se «rull» i stil.css) tegnes flatt i sitt eget
   * plan. ut = +1 for hjul på nærsiden, -1 på andre siden. */
  function hjul3d(x, y, z, r, b, ut, felg, klasse) {
    var N = 20, ytre = z + ut * b / 2, indre = z - ut * b / 2, sentrum = [x, y, z];
    function punkt(i, zz) {
      var v = i / N * 2 * Math.PI;
      return [x + r * Math.cos(v), y + r * Math.sin(v), zz];
    }
    var deler = [];
    for (var i = 0; i < N; i++) {
      deler.push(flate([punkt(i, ytre), punkt(i + 1, ytre), punkt(i + 1, indre), punkt(i, indre)],
                       '#2a2c31', 0.2, sentrum));
    }
    var innsida = [];
    for (i = 0; i < N; i++) innsida.push(punkt(i, indre));
    deler.push(flate(innsida, '#1c1d21', 0, sentrum));
    var midt = [x, y, ytre], n = [0, 0, ut];
    deler.push({ midt: midt, n: n, tegn: function (kam) {
      var c = kam.p(midt), ex = kam.p([x + 1, y, ytre]), ey = kam.p([x, y - 1, ytre]);
      var m = [ex[0] - c[0], ex[1] - c[1], ey[0] - c[0], ey[1] - c[1], c[0], c[1]];
      return '<g transform="matrix(' + m.map(function (t) { return +t.toFixed(3); }).join(' ') + ')">' +
        '<circle r="' + r + '" fill="' + farge('#2e3036', n, midt, kam, 0.25) + '"/>' +
        '<g class="hjul ' + klasse + '">' +
          '<circle r="' + r1(r - 1.5) + '" fill="none" stroke="#3d4047" stroke-width="1.4" stroke-dasharray="2.4 2"/>' +
          '<circle r="' + r1(r * 0.62) + '" fill="' + felg + '"/>' +
          '<circle r="' + r1(r * 0.5) + '" fill="rgba(0,0,0,.28)"/>' +
          '<g stroke="' + felg + '" stroke-width="' + r1(r * 0.13) + '" stroke-linecap="round">' +
            [0, 72, 144, 216, 288].map(function (g) {
              var v = g * Math.PI / 180;
              return '<path d="M0 0L' + r1(Math.cos(v) * r * 0.5) + ' ' + r1(Math.sin(v) * r * 0.5) + '"/>';
            }).join('') +
          '</g>' +
          '<circle r="' + r1(r * 0.17) + '" fill="#c9cdd3"/>' +
        '</g>' +
        '<path d="M' + r1(-r * 0.7) + ' ' + r1(-r * 0.45) + 'A' + r + ' ' + r + ' 0 0 1 ' +
          r1(-r * 0.15) + ' ' + r1(-r * 0.86) + '" stroke="rgba(255,255,255,.2)" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '</g>';
    } });
    return deler;
  }

  /* Et plan på bilen: origo O, lokal u langs A og v langs B. Punktene i
   * planet projiseres ett og ett, så perspektivet blir riktig. */
  function iPlan(O, A, B) {
    return function (u, v) { return pluss(O, pluss(gange(A, u), gange(B, v))); };
  }
  function flekk(kam, pl, punkter, attr) {
    return '<path d="' + sti(kam, punkter.map(function (p) { return pl(p[0], p[1]); })) + '" ' + attr + '/>';
  }
  function ring(u, v, ru, rv, n) {
    var ut = [];
    for (var i = 0; i < (n || 20); i++) {
      var a = i / (n || 20) * 2 * Math.PI;
      ut.push([u + ru * Math.cos(a), v + rv * Math.sin(a)]);
    }
    return ut;
  }
  function strek(kam, pl, punkter, farge_, bredde) {
    return '<path d="' + sti(kam, punkter.map(function (p) { return pl(p[0], p[1]); })).slice(0, -1) +
      '" fill="none" stroke="' + farge_ + '" stroke-width="' + bredde + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function kurve(u0, u1, f, n) {
    var ut = [];
    for (var i = 0; i <= (n || 12); i++) { var u = u0 + (u1 - u0) * i / (n || 12); ut.push([u, f(u)]); }
    return ut;
  }

  /* Øynene i frontruta og munnen foran, med de fire uttrykkene. Øyehvitten
   * fyller det meste av ruta, og lokkene er kanten på det hvite – ikke egne
   * flater som kunne stikke ut av den buede ruta. rute: planet til frontruta
   * (v = 0 nederst, h = høyden, u på tvers ±bredde). */
  function bilansikt(kam, rute, h, bredde, iris, munn) {
    var ir = h * 0.2, ex = bredde * 0.42, ey = h * 0.47, B = bredde * 0.92;
    /* Ruta buer nedover mot sidene, så det hvite gjør det samme. */
    function buet(u, v) { return rute(u, v * (1 - 0.3 * Math.pow(u / bredde, 2))); }
    function uttrykk(klasse, venstre, hoyre, dx, dy, kinn, munnSvg) {
      function topp(u) {
        var s = u < 0 ? venstre : hoyre;
        return Math.min(0.9, s[0] + (s[1] - s[0]) * Math.abs(u) / B) * h;
      }
      /* Kinnene skyver seg opp under øynene når bilen smiler. */
      function bunn(u) {
        return h * (0.1 + (kinn ? 0.17 * Math.pow(Math.cos(Math.min(1, Math.abs(Math.abs(u) - ex) / (bredde * 0.4)) * Math.PI / 2), 1.5) : 0));
      }
      var hvitt = kurve(-B, B, bunn, 24).concat(kurve(B, -B, topp, 24));
      var id = unik('oye');
      return '<g class="' + klasse + '">' +
        '<clipPath id="' + id + '"><path d="' + sti(kam, hvitt.map(function (p) { return buet(p[0], p[1]); })) + '"/></clipPath>' +
        flekk(kam, buet, hvitt, 'fill="#f6f8fa" stroke="#2a1d1b" stroke-width=".9" stroke-linejoin="round"') +
        '<g clip-path="url(#' + id + ')">' + [-1, 1].map(function (s) {
          return '<g class="pupill">' +
            flekk(kam, rute, ring(s * ex + dx * ir, ey + dy * ir, ir, ir), 'fill="' + iris + '"') +
            flekk(kam, rute, ring(s * ex + dx * ir, ey + dy * ir, ir * 0.5, ir * 0.5), 'fill="#15171b"') +
            flekk(kam, rute, ring(s * ex + dx * ir - ir * 0.3, ey + dy * ir + ir * 0.35, ir * 0.22, ir * 0.22, 10), 'fill="#fff"') +
          '</g>';
        }).join('') + '</g>' + munnSvg +
      '</g>';
    }
    return '<g class="ansikt">' +
      uttrykk('u-vanlig', [0.95, 0.88], [0.95, 0.88], 0.1, 0, false, munn.vanlig) +
      uttrykk('u-glad', [0.95, 0.9], [0.95, 0.9], 0, 0.15, true, munn.glad) +
      uttrykk('u-hmm', [0.6, 0.7], [0.95, 0.9], -0.2, -0.1, false, munn.hmm) +
      uttrykk('u-trott', [0.5, 0.48], [0.5, 0.48], 0, -0.45, false, munn.trott) +
    '</g>';
  }

  /* Tegner modellen fra ett kamera: skygge, alle flatene bakfra og fram,
   * så pynten (ansikt, lykter, merker). Gir svg og rammen rundt tegningen. */
  function visning(modell, kam) {
    var min = [1e9, 1e9], max = [-1e9, -1e9];
    function ramme(q) {
      var s = kam.p(q);
      min = [Math.min(min[0], s[0]), Math.min(min[1], s[1])];
      max = [Math.max(max[0], s[0]), Math.max(max[1], s[1])];
    }
    var ting = [];
    modell.flater.forEach(function (f) {
      var m = f.midt || midten(f.pts);
      if (prikk(f.n, minus(kam.oye, m)) <= 0) return;
      var avst = prikk(minus(m, kam.oye), minus(m, kam.oye));
      if (f.tegn) { ting.push({ a: avst, svg: f.tegn(kam) }); return; }
      f.pts.forEach(ramme);
      var c = farge(f.hex, f.n, m, kam, f.glans);
      ting.push({ a: avst, svg: '<path d="' + sti(kam, f.pts) + '" fill="' + c + '" stroke="' + c + '" stroke-width=".5" stroke-linejoin="round"/>' });
    });
    ting.sort(function (x, y) { return y.a - x.a; });
    var g = unik('skygge'), sk = modell.skygge, skygge = [];
    for (var i = 0; i < 24; i++) {
      var v = i / 24 * 2 * Math.PI;
      skygge.push([sk[0] + sk[1] * Math.cos(v), 0, sk[2] * Math.sin(v)]);
    }
    skygge.forEach(ramme);
    return {
      boks: [min[0], min[1], max[0], max[1]],
      svg: '<defs><radialGradient id="' + g + '"><stop offset="0" stop-color="#281e0f" stop-opacity=".4"/>' +
          '<stop offset=".65" stop-color="#281e0f" stop-opacity=".18"/><stop offset="1" stop-color="#281e0f" stop-opacity="0"/>' +
        '</radialGradient></defs>' +
        '<path class="fig-skygge" d="' + sti(kam, skygge) + '" fill="url(#' + g + ')"/>' +
        ting.map(function (t) { return t.svg; }).join('') + modell.pynt(kam)
    };
  }

  /* Bilen står på skrå og ser på barnet; mens den kjører, ses den fra siden.
   * Samme målestokk i begge, og bakken på samme linje. */
  function bil3d(modell, klasse, etikett) {
    var sta = visning(modell, STAR), kjor = visning(modell, KJORER);
    var S = 196 / (sta.boks[2] - sta.boks[0]);
    var H = Math.ceil((sta.boks[3] - sta.boks[1]) * S) + 4;
    function plasser(v, k) {
      return '<g class="' + k + '" transform="translate(' + r1(100 - (v.boks[0] + v.boks[2]) / 2 * S) + ' ' +
        r1(H - 2 - v.boks[3] * S) + ') scale(' + S.toFixed(4) + ')">' + v.svg + '</g>';
    }
    return '<svg class="fig ' + klasse + '" viewBox="0 0 200 ' + H + '" overflow="visible" role="img" aria-label="' +
      etikett + '">' + plasser(sta, 'vis-sta') + plasser(kjor, 'vis-kjor') + '</svg>';
  }

  /* ---------- racerbilen ---------- */

  /* Vår egen racerbil: rød og blank, med store øyne i frontruta, et bredt
   * smil og spoiler. I samme ånd som bilfilmene, men ingen andres figur –
   * ingen startnummer eller logoer, og barnet gir den navn selv. */
  function bil() {
    var RODT = '#e3281c';
    /* Kort, høyt panser som holder full bredde helt fram, og en butt front
     * med plass til et bredt smil – ikke en lang snute som smalner. */
    var st = [
      [-100, 16, 31, 21, 1, 14], [-96, 12, 38, 28, 1.5, 20], [-86, 10, 41, 31, 2, 23],
      [-68, 10, 42, 32.5, 2, 24], [-50, 10, 43, 31.5, 2.5, 24], [-36, 10, 43, 30.5, 11, 24],
      [-22, 10, 43, 30, 22, 23.5], [-2, 10, 43, 30, 24.5, 23.5], [16, 10, 43, 30.5, 23.5, 24],
      [32, 10, 42, 31, 12.5, 25], [48, 10, 41, 31.5, 2.5, 25.5], [60, 10, 40, 32.5, 2.5, 26],
      [74, 10, 38.5, 32.5, 2.5, 26], [84, 10, 36.5, 32, 2, 25.5], [90, 10.5, 33.5, 31, 1.5, 24.5],
      [93, 11.5, 30, 29.5, 1, 23]
    ];
    var flater = karosseri(st, [[-58, 17, 21], [58, 17, 21]], function (x, j) {
      if (j === 5 && x > -32 && x < 28) return ['#26303b', 0.9];
      if (j >= 6 && x > -36 && x < -16) return ['#26303b', 0.9];
      return [RODT, 0.6];
    }).concat(
      karosseri([[-90, 9, 32, 16, 0, 14], [82, 9, 30, 16, 0, 14]], [], function () { return ['#1b1c20', 0]; }),
      bjelke([-91, 41, 14], [-91, 52, 14], 1.6, 1.6, '#9c1c12', 0.3),
      bjelke([-91, 41, -14], [-91, 52, -14], 1.6, 1.6, '#9c1c12', 0.3),
      bjelke([-92, 53, -28], [-92, 53, 28], 1.8, 9, RODT, 0.5),
      hjul3d(-58, 17, 26, 17, 13, 1, '#d8261c', 'hjul--bak'), hjul3d(58, 17, 26, 17, 13, 1, '#d8261c', 'hjul--front'),
      hjul3d(-58, 17, -26, 17, 13, -1, '#d8261c', 'hjul--bak'), hjul3d(58, 17, -26, 17, 13, -1, '#d8261c', 'hjul--front')
    );
    /* frontruta fra underkanten (x 47) til toppen (x 17), midt på bilen */
    var ned = [47, glatt(st, 2, 47) + glatt(st, 4, 47), 0], opp = [17, glatt(st, 2, 17) + glatt(st, 4, 17), 0];
    var h = Math.sqrt(prikk(minus(opp, ned), minus(opp, ned)));
    var rute = iPlan(ned, [0, 0, -1], enhet(minus(opp, ned)));
    var front = iPlan([93.3, 21, 0], [0, 0, -1], [0, 1, 0]);
    var side = iPlan([-6, 27, 30.3], [1, 0, 0], [0, 1, 0]);
    var MUNN = '#4a120d';
    function smil(dybde, tenner) {
      return function (kam) {
        var over = kurve(-19, 19, function (u) { return 2 + 2.6 * Math.pow(u / 19, 2); });
        var under = kurve(19, -19, function (u) { return 2 + 2.6 * Math.pow(u / 19, 2) - dybde * (1 - Math.pow(u / 19, 2)); });
        return flekk(kam, front, over.concat(under), 'fill="' + MUNN + '"') +
          (tenner ? flekk(kam, front, kurve(-15, 15, function (u) { return 2 + 2.6 * Math.pow(u / 19, 2) - 0.2; })
              .concat(kurve(15, -15, function (u) { return 2 + 2.6 * Math.pow(u / 19, 2) - 2.8; })), 'fill="#fff"') : '');
      };
    }
    return bil3d({
      flater: flater,
      skygge: [-3, 103, 40],
      pynt: function (kam) {
        return flekk(kam, side, [[-9, 9], [4, 9.5], [-1, 3], [8, 3.5], [-11, -10], [-4, -0.5], [-12, 0]].map(function (p) {
            return [p[0] * 0.75, p[1] * 0.75]; }), 'fill="#fff" opacity=".94"') +
          [-1, 1].map(function (s) {
            return flekk(kam, front, ring(s * 19.5, 6.8, 4.4, 2.4), 'fill="#fff4cf" stroke="#7a150d" stroke-width=".6"');
          }).join('') +
          bilansikt(kam, rute, h, 22, '#2f9bd6', {
            vanlig: smil(7.5, true)(kam),
            glad: smil(11, true)(kam),
            hmm: strek(kam, front, kurve(-11, 11, function (u) { return 1 + Math.sin(u / 3.5) * 0.8; }), MUNN, 2),
            trott: strek(kam, front, kurve(-7, 7, function (u) { return 1.5 - 1.8 * (1 - Math.pow(u / 7, 2)); }), MUNN, 2)
          });
      }
    }, 'fig--bil', 'Racerbil');
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

  /* Vår egen tauebil: falmet oransje med rustflekker, store øyne i ruta og
   * et stort glis med tenner i grillen – en hjelpsom venn fra verkstedet.
   * Kranen og kroken bak gjør den til en tauebil; kroken svinger når den
   * kjører (rundt trinsa, origo i gruppa rundt .krok, se stil.css). */
  function tauebil() {
    var LAKK = '#cf6f2c';
    var st = [
      [0, 14, 50, 25, 26, 24], [3, 12, 50, 27, 28.5, 25], [20, 12, 50, 27, 30, 25],
      [36, 12, 50, 27, 29, 25], [41, 12, 49, 27.5, 18, 24], [45, 12, 44, 28.5, 7, 20],
      [50, 12, 41, 30, 9, 19], [66, 12, 40, 33, 10, 19], [84, 12, 38, 32, 11, 19],
      [96, 13, 34, 28, 12, 19], [100, 15, 30, 24, 13.5, 18.5], [102, 17, 28, 20, 14, 17]
    ];
    var tupp = [-86, 92, 0];
    var flater = karosseri(st, [[66, 17, 21]], function (x, j) {
      if (j === 5 && x > 6 && x < 36) return ['#26303b', 0.8];
      return [LAKK, 0.3];
    }).concat(
      karosseri([[-102, 20, 40, 28, 0.6, 26], [0, 20, 40, 28, 0.6, 26]], [[-55, 17, 21]], function () {
        return ['#6b7078', 0.25];
      }),
      karosseri([[-96, 10, 30, 14, 0, 12], [96, 10, 30, 14, 0, 12]], [], function () { return ['#1b1c20', 0]; }),
      bjelke([104, 13, -31], [104, 13, 31], 3.5, 3, '#9aa0a8', 0.6),
      bjelke([22, 80, 0], [22, 86, 0], 4, 4, '#f5b021', 0.6),
      bjelke([-60, 45, 0], [-38, 45, 0], 5, 9, '#4b5058', 0.3),
      bjelke([-46, 47, 0], tupp, 3.2, 3.2, '#5d636b', 0.3),
      hjul3d(-55, 17, 27, 17, 13, 1, '#8b9098', 'hjul--bak'), hjul3d(66, 17, 27, 17, 13, 1, '#8b9098', 'hjul--front'),
      hjul3d(-55, 17, -27, 17, 13, -1, '#8b9098', 'hjul--bak'), hjul3d(66, 17, -27, 17, 13, -1, '#8b9098', 'hjul--front')
    );
    var ned = [45, glatt(st, 2, 45) + glatt(st, 4, 45), 0], opp = [36.5, glatt(st, 2, 36.5) + glatt(st, 4, 36.5), 0];
    var h = Math.sqrt(prikk(minus(opp, ned), minus(opp, ned)));
    var rute = iPlan(ned, [0, 0, -1], enhet(minus(opp, ned)));
    var front = iPlan([102.3, 29, 0], [0, 0, -1], [0, 1, 0]);
    var husside = iPlan([0, 0, 27.3], [1, 0, 0], [0, 1, 0]);
    var benkside = iPlan([0, 0, 28.3], [1, 0, 0], [0, 1, 0]);
    var MUNN = '#3b1a0e';
    function glis(dybde) {
      return function (kam) {
        var over = kurve(-15, 15, function (u) { return 1.5 + 3 * Math.pow(u / 15, 2); });
        var under = kurve(15, -15, function (u) { return 1.5 + 3 * Math.pow(u / 15, 2) - dybde * (1 - Math.pow(u / 15, 2)); });
        /* fire tenner i overkjeven, med litt mellomrom */
        var tenner = [-9, -3, 3, 9].map(function (t) {
          return flekk(kam, front, [[t - 2.6, 1.4], [t + 2.6, 1.4], [t + 2.4, -2.4], [t - 2.4, -2.4]], 'fill="#fffbe9"');
        }).join('');
        return flekk(kam, front, over.concat(under), 'fill="' + MUNN + '"') + tenner;
      };
    }
    return bil3d({
      flater: flater,
      skygge: [0, 112, 42],
      pynt: function (kam) {
        var t = kam.p(tupp), s = kam.avstand / t[2];
        return (
          /* rustflekker på døra og skjermen, varselstriper bak på planet */
          [[14, 28, 5, 3.5], [24, 22, 3, 2.2], [10, 20, 2.2, 1.6], [30, 36, 2.6, 1.8]].map(function (f) {
            return flekk(kam, husside, ring(f[0], f[1], f[2], f[3], 12), 'fill="#7c3b17" opacity=".7"');
          }).join('') +
          flekk(kam, benkside, [[-102, 22], [-90, 22], [-90, 39], [-102, 39]], 'fill="#f2c33d"') +
          flekk(kam, benkside, [[-100, 22], [-96, 22], [-90, 30], [-90, 35]], 'fill="#23262d"') +
          flekk(kam, benkside, [[-102, 30], [-102, 36], [-100, 39], [-96, 39]], 'fill="#23262d"') +
          /* runde lykter oppå skjermene */
          [-1, 1].map(function (s_) {
            var l = iPlan([95, 40.5, s_ * -24], [0, 0, -1], [0, 1, 0]);
            return flekk(kam, l, ring(0, 0, 5, 5), 'fill="#c9ced4"') + flekk(kam, l, ring(0, 0, 3.8, 3.8), 'fill="#fff3c4"');
          }).join('') +
          /* kroken henger i wiren fra trinsa */
          '<g transform="translate(' + r1(t[0]) + ' ' + r1(t[1]) + ') scale(' + s.toFixed(3) + ')"><g class="krok">' +
            '<path d="M0 0v30" stroke="#2c3036" stroke-width="2"/>' +
            '<path d="M0 29v7a6 6 0 1 0 6 6" stroke="#8e939c" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
          '</g><circle r="5.5" fill="#3a3f47"/><circle r="2" fill="#8e939c"/></g>' +
          bilansikt(kam, rute, h, 21, '#6f9a3c', {
            vanlig: glis(9)(kam),
            glad: glis(12.5)(kam),
            hmm: strek(kam, front, kurve(-11, 11, function (u) { return Math.sin(u / 3.5) * 0.9; }), MUNN, 2.2),
            trott: strek(kam, front, kurve(-7, 7, function (u) { return 0.5 - 1.8 * (1 - Math.pow(u / 7, 2)); }), MUNN, 2.2)
          })
        );
      }
    }, 'fig--taue', 'Tauebil');
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
        /* Én gradient for hele dyret, regnet i figurens høyde: da blir det
           ingen skjøt der halsen går inn i kroppen. */
        '<linearGradient id="' + gHud + '" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="118">' +
          '<stop offset="0" stop-color="#86cf93"/>' +
          '<stop offset="0.6" stop-color="#4f9e63"/>' +
          '<stop offset="1" stop-color="#357a49"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gPlate + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#e0a127"/>' +
        '</linearGradient>' +
        /* Lyset fra oven til høyre, der sola står: en myk lysflekk på ryggen og hodet. */
        '<radialGradient id="' + gLys + '" cx=".5" cy=".5" r=".5">' +
          '<stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +

      bakkeskygge(100, 122, 74, [72, 122]) +

      /* Hale – bakerst, altså til venstre, siden dinoen ser mot høyre.
         Tykk der den møter kroppen, spiss ytterst. */
      '<path d="M56 88C36 92 18 88 4 74c16 2 26-2 32-10 6-8 14-12 24-10z"' +
            ' fill="url(#' + gHud + ')"/>' +

      /* Hals og hode i ett strøk, med en rund snute – ingen klosser som
         stikker ut. Tegnes før kroppen, så halsen kommer opp av den. */
      '<path d="M128 70C128 46 138 27 156 20C170 14 186 18 193 30C198 38 199 48 194 54' +
        'C188 61 174 62 162 60C156 65 150 73 141 80H128z" fill="url(#' + gHud + ')"/>' +
      '<ellipse cx="172" cy="25" rx="14" ry="6" fill="url(#' + gLys + ')"/>' +
      /* Bakbein bak kroppen, så dyret får dybde. */
      '<rect class="dino-bein dino-bein--bak" x="62" y="86" width="20" height="32" rx="10" fill="#2e6b40"/>' +
      '<rect class="dino-bein dino-bein--bak" x="104" y="86" width="20" height="32" rx="10" fill="#2e6b40"/>' +

      /* Kropp – én rund form, så silhuetten er lett å kjenne igjen. */
      '<ellipse cx="94" cy="76" rx="52" ry="34" fill="url(#' + gHud + ')"/>' +
      /* Lys på ryggen, skygge under magen, og noen flekker i huden. */
      '<ellipse cx="104" cy="60" rx="34" ry="14" fill="url(#' + gLys + ')"/>' +
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

      /* nesebor og rosa kinn */
      '<path d="M189 35.5q2.5-1.5 4 .5" stroke="#2e6b40" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="179" cy="47" rx="5.5" ry="3.2" fill="#ff9aa8" opacity=".8"/>' +

      ansikt('stor', [[170, 33, 7]], {
        vanlig: 'M193 48C187 56 175 57 167 50q-1.5-1.5-.5-3.5',
        glad: 'M194 46C189 61 172 61 165 48C175 53 186 51 194 46z',
        hmm: 'M190 51q-7 3-15 0',
        trott: 'M188 51q-6 3-12 0'
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
