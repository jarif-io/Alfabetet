/* Oppdagerøya – modusene: Utforsk, Oppgave og Løype
 *
 * Alle deler samme regel: ingenting skjer av seg selv mens han tenker.
 * Barnet trykker, spillet svarer i under ett sekund, og så står skjermen
 * stille igjen.
 */

var Moduser = (function () {

  /* ================= felles småting ================= */

  function el(id) { return document.getElementById(id); }

  function bland(liste) {
    var ut = liste.slice();
    for (var i = ut.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = ut[i]; ut[i] = ut[j]; ut[j] = t;
    }
    return ut;
  }

  function tilfeldig(liste) { return liste[Math.floor(Math.random() * liste.length)]; }

  /* «A, B og C» – slik en voksen ville lest det høyt. */
  function listetekst(deler) {
    if (deler.length === 1) return deler[0];
    return deler.slice(0, -1).join(', ') + ' og ' + deler[deler.length - 1];
  }

  /* «ell … ell for Løve» – samme formel som alfabetbøkene bruker, og kort nok
   * til at en treåring holder følge. Bokstavnavnet skrives ut («ell»), ellers
   * leser talesyntesen det store tegnet som «stor L». */
  function tegnrekke(verdenId, tegn, oppslag) {
    var navn = navnPaTegn(verdenId, tegn);
    /* Tallene sier «fire … fire bein». «fire for bein» ville vært tull, og
     * det er sammenhengen mellom tallet og mengden som er poenget. */
    if (domeneFor(verdenId) === 'tall') {
      return [navn + '.', 450, visningsordFor(verdenId, tegn) + '.'];
    }
    return [navn + '.', 450, navn + ' for ' + tilTale(oppslag.ord) + '.'];
  }

  /* Navnet sagt bokstav for bokstav – «i … de … a» – med de samme klippene
   * som resten av runden allerede har brukt. Et vilkårlig navn en forelder
   * skriver inn kan ingen stemme ha innspilt ferdig som ett ord, mens hver
   * enkelt bokstav alltid finnes i språkpakken. Det er også nøyaktig det han
   * nettopp gjorde, bokstav for bokstav – å høre det igjen samlet er selve
   * poenget med runden. */
  function navnetTalt(bokstaver) {
    var rekke = [];
    bokstaver.forEach(function (b, i) {
      if (i) rekke.push(180);
      rekke.push(bokstavnavnFor(b) + '.');
    });
    return rekke.concat([350, 'Det er navnet ditt!']);
  }

  /* Hva merket heter når vi omtaler det: «Bokstaven» eller «Tallet». */
  function merkeNavn(verdenId) {
    return domeneFor(verdenId) === 'tall' ? 'Tallet' : 'Bokstaven';
  }

  /* Tegner en mengde ting å telle. Tingene står på rekke og rad i en fast
   * rekkefølge, ikke strødd utover: skal han telle dem, må han kunne peke på
   * dem én etter én uten å miste tellingen. */
  function tegnMengde(vertEl, ikon, antall, klasse) {
    vertEl.innerHTML = '';
    vertEl.className = klasse || 'mengde';
    /* Over seks ting brytes rekka i to, ellers blir tingene bittesmå på en
     * telefon – og en rad på ti er uansett for lang til å holde oversikt i. */
    vertEl.classList.toggle('mengde--to-rader', antall > 6);
    for (var i = 0; i < antall; i++) {
      var t = document.createElement('span');
      t.className = 'ting';
      t.dataset.nummer = String(i + 1);
      t.textContent = ikon;
      t.style.animationDelay = (i * 55) + 'ms';
      vertEl.appendChild(t);
    }
  }

  /* Kort animasjon som kan spilles om igjen: klassen må fjernes først. */
  function spillOm(element, klasse, ms) {
    if (!element) return;
    element.classList.remove(klasse);
    void element.offsetWidth;
    element.classList.add(klasse);
    window.setTimeout(function () { element.classList.remove(klasse); }, ms);
  }

  /* ================= nedtelling før spillet går videre av seg selv =================
   *
   * Pila «Videre» krevde et trykk for hver eneste oppgave. I stedet teller
   * badgen ned fra 3 til 0 og går videre av seg selv, i alle moduser der noe
   * før krevde et trykk. Den er ikke lenger en knapp og har ingen klikk-
   * håndtering – et trykk på den gjør ingenting, og de tre sekundene kan
   * ikke hoppes over. Det er bevisst: et barn som ikke leser skal aldri
   * kunne trykke seg forbi en oppgave ved et uhell.
   *
   * `ikonEl` er elementet badgen tegnes i. `handler` er det som skjer ved
   * null – nøyaktig det et trykk på den gamle knappen ville gjort. Kalles
   * unikt for hver runde med tallet; returnerer en avbryter som MÅ kalles
   * før noe annet skjer med den samme badgen (en ny oppgave, eller at runden
   * forlates) – ellers kan et gammelt tikk komme og gå videre et sted han
   * ikke lenger er.
   *
   * Badgen er selv aria-hidden – den skal ikke lese opp «3, 2, 1» hvert
   * sekund. En som bruker skjermleser skal likevel ikke oppleve at skjermen
   * bare bytter innhold uten forvarsel (slik den gamle, fokuserbare
   * «Videre»-knappen ga et varsel gjennom fokus), så ett varsel går ut idet
   * nedtellingen starter – ikke ett per tikk. */
  var NEDTELLING_START = 3;
  function nedtelling(ikonEl, handler) {
    var n = NEDTELLING_START;
    ikonEl.innerHTML = Figurer.nedtelling(n);
    var kunngjoring = el('nedtelling-kunngjoring');
    if (kunngjoring) kunngjoring.textContent = 'Går videre om ' + n + ' sekunder.';
    var ring = ikonEl.querySelector('.nedtelling-ring');
    var tekst = ikonEl.querySelector('.nedtelling-tall');
    var timer = window.setTimeout(function tikk() {
      n -= 1;
      if (n < 0) { timer = null; handler(); return; }
      if (tekst) tekst.textContent = String(n);
      if (ring) {
        ring.setAttribute('stroke-dashoffset',
          (Figurer.nedtellingOmkrets * (1 - n / NEDTELLING_START)).toFixed(1));
      }
      timer = window.setTimeout(tikk, 1000);
    }, 1000);
    return function () {
      if (timer) { window.clearTimeout(timer); timer = null; }
    };
  }

  /* ================= figuren på bakken ================= */

  var kjoreTimer = null;
  var uttrykkTimer = null;
  var varigUttrykk = null;

  /* Ansiktet på figuren: 'glad', 'hmm', 'trott' eller null (vanlig). Uten ms
   * blir det stående (glad på oppsummeringen, trøtt i pausen). Med ms går det
   * tilbake dit etter en stund – et kort uttrykk varer bare så lenge det
   * hører til noe som skjedde, og visker ikke ut det som står. */
  function uttrykk(navn, ms) {
    var figur = el('figur');
    window.clearTimeout(uttrykkTimer);
    if (!ms) varigUttrykk = navn;
    var vis = navn || varigUttrykk;
    if (vis) figur.dataset.uttrykk = vis; else delete figur.dataset.uttrykk;
    if (ms) uttrykkTimer = window.setTimeout(function () { uttrykk(varigUttrykk); }, ms);
  }

  /* Hvor langt figuren har kjørt. Landskapet bak glir etter i dybden, se
   * .scene-landskap i stil.css. */
  function settPosisjon(figur, x) {
    figur.style.transform = 'translateX(' + x + 'px)';
    document.body.style.setProperty('--kjort', (x - 24) + 'px');
  }

  function naVaerendeX(figur) {
    var m = /translateX\((-?[\d.]+)px\)/.exec(figur.style.transform || '');
    return m ? parseFloat(m[1]) : 24;
  }

  function stovSky(fraX, tilX) {
    var stov = el('stov');
    var bakover = tilX < fraX;
    for (var i = 0; i < 5; i++) {
      (function (n) {
        window.setTimeout(function () {
          var s = document.createElement('span');
          s.style.left = (fraX + (bakover ? 150 : 40) + n * 9) + 'px';
          stov.appendChild(s);
          window.setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 850);
        }, n * 70);
      })(i);
    }
  }

  /* Flytter figuren dit noe står, og lar hjulene rulle mens den er i fart. */
  function kjorTil(verdenId, andelEllerElement) {
    var bane = el('figurbane');
    var figur = el('figur');
    var rB = bane.getBoundingClientRect();
    var bredde = figur.offsetWidth || 200;
    var maks = Math.max(24, rB.width - bredde - 24);
    var x;

    if (typeof andelEllerElement === 'number') {
      x = 24 + andelEllerElement * (maks - 24);
    } else {
      var rM = andelEllerElement.getBoundingClientRect();
      x = (rM.left + rM.width / 2) - rB.left - bredde / 2;
      x = Math.max(24, Math.min(maks, x));
    }

    var fra = naVaerendeX(figur);
    figur.classList.toggle('speilet', x < fra - 4);
    figur.classList.add('kjorer');
    stovSky(fra, x);
    settPosisjon(figur, x);
    uttrykk('glad', 1100);

    if (VERDENER[verdenId].figur === 'skip') Lyd.bolge(); else Lyd.motor();

    window.clearTimeout(kjoreTimer);
    kjoreTimer = window.setTimeout(function () {
      figur.classList.remove('kjorer');
    }, 1000);
  }

  /* Bare posisjonen: ansiktet nullstilles når modusen forlates (stoppAlt).
   * Kalles også ved omskalering – og på iPhone er det nok at adresselinja
   * skjules, så den må ikke viske ut pausen på oppsummeringen. */
  function stillFigurTilStart() {
    var figur = el('figur');
    figur.classList.remove('speilet', 'kjorer');
    settPosisjon(figur, 24);
  }

  /* Et lite hopp. Treåringer trykker på figuren fordi den er der, og da
   * skal det skje noe. */
  function hopp() {
    var figur = el('figur');
    if (!figur || el('figurbane').hidden) return;
    spillOm(figur, 'hopper', 680);
    uttrykk('glad', 900);
    var v = document.body.getAttribute('data-verden');
    Lyd.tut(v ? VERDENER[v].figur : 'bil');
  }

  /* ================= belønninger ================= */

  /* Vanlig riktig svar: en stjerne lander på skiltet og blir borte igjen. */
  function stjerneLander(vertEl) {
    /* Skjermen kan være forlatt før forsinkelsen slår til – da er knappen
     * borte eller skjult, og stjernen ville landet i hjørnet av vinduet. */
    if (!vertEl.isConnected || vertEl.offsetWidth === 0) return;
    var r = vertEl.getBoundingClientRect();
    var s = document.createElement('span');
    s.className = 'flystjerne';
    s.textContent = '★';
    s.style.left = (r.left + r.width / 2) + 'px';
    s.style.top = (r.top + 14) + 'px';
    s.style.transform = 'translate(-50%, -50%) scale(.3)';
    s.style.opacity = '0';
    document.body.appendChild(s);
    requestAnimationFrame(function () {
      s.style.transform = 'translate(-50%, -50%) scale(1)';
      s.style.opacity = '1';
    });
    window.setTimeout(function () {
      s.style.opacity = '0';
      s.style.transform = 'translate(-50%, -140%) scale(.8)';
    }, 620);
    window.setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1400);
  }

  /* Ny mestret bokstav er den sjeldne hendelsen, og den eneste som får
   * fanfare: stjerna flyr opp i telleren, og det kommer litt konfetti. */
  function feirMestret(vertEl) {
    if (!vertEl.isConnected || vertEl.offsetWidth === 0) { Spill.oppdaterTeller(true); return; }
    var teller = el('stjerneteller');
    var r = vertEl.getBoundingClientRect();
    var fraX = r.left + r.width / 2;
    var fraY = r.top + r.height / 2;

    var s = document.createElement('span');
    s.className = 'flystjerne';
    s.textContent = '★';
    s.style.left = fraX + 'px';
    s.style.top = fraY + 'px';
    document.body.appendChild(s);

    var mal = teller && !teller.hidden ? teller.getBoundingClientRect() : null;
    var dx = mal ? (mal.left + mal.width / 2) - fraX : 0;
    var dy = mal ? (mal.top + mal.height / 2) - fraY : -180;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        s.style.transform = 'translate(-50%, -50%) translate(' + dx + 'px, ' + dy + 'px) scale(.45)';
        s.style.opacity = '.25';
      });
    });

    window.setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
      Spill.oppdaterTeller(true);
    }, 740);

    konfetti(fraX, fraY);
  }

  function konfetti(x, y) {
    var farger = ['#e2a017', '#dc3327', '#2e8055', '#3f8fc4', '#f2c33d'];
    for (var i = 0; i < 14; i++) {
      var k = document.createElement('span');
      k.className = 'konfetti';
      k.style.left = x + 'px';
      k.style.top = y + 'px';
      k.style.background = farger[i % farger.length];
      k.style.setProperty('--dx', (Math.random() * 260 - 130).toFixed(0) + 'px');
      k.style.setProperty('--dy', (Math.random() * 150 + 90).toFixed(0) + 'px');
      k.style.setProperty('--dr', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      document.body.appendChild(k);
      (function (node) {
        window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1200);
      })(k);
    }
  }

  /* ================= 1. Utforsk ================= */

  var Utforsk = (function () {
    var verdenId = null;
    var sisteBokstav = null;

    function tegn() {
      var rutenett = el('utforsk-rutenett');
      rutenett.innerHTML = '';
      /* Bildet under bokstaven gjør veggen mulig å navigere for en som ikke
       * kan lese: han finner traktoren, og lærer at den bor på T. */
      Lagring.aktiveTegn(verdenId).forEach(function (bokstav, i) {
        var oppslag = ordFor(verdenId, bokstav);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bokstav' + (Lagring.erMestret(bokstav) ? ' mestret' : '');
        b.dataset.bokstav = bokstav;
        var beskrivelse = domeneFor(verdenId) === 'tall'
          ? visningsordFor(verdenId, bokstav)
          : bokstav + ' som i ' + oppslag.ord;
        b.title = beskrivelse;
        b.innerHTML = '<span class="bokstav-tegn">' + bokstav + '</span>' +
                      '<span class="bokstav-bilde" aria-hidden="true">' + oppslag.ikon + '</span>';
        b.setAttribute('aria-label', beskrivelse);
        b.style.animation = 'trinn-inn 320ms cubic-bezier(.2,.8,.3,1) ' + (i * 12) + 'ms backwards';
        b.addEventListener('click', function () { velg(bokstav); });
        rutenett.appendChild(b);
      });

      el('utforsk-bokstav').textContent = '?';
      el('utforsk-ikon').className = 'ordkort-ikon';
      el('utforsk-ikon').textContent = VERDENER[verdenId].ikon;
      el('utforsk-ord').textContent = domeneFor(verdenId) === 'tall'
        ? 'Trykk på et tall' : 'Trykk på en bokstav';
      el('utforsk-lytt').hidden = true;
      sisteBokstav = null;
    }

    function velg(bokstav) {
      var aktive = Lagring.aktiveTegn(verdenId);
      if (aktive.indexOf(bokstav) === -1) return;

      var oppslag = ordFor(verdenId, bokstav);
      sisteBokstav = bokstav;

      var knapper = el('utforsk-rutenett').querySelectorAll('.bokstav');
      for (var i = 0; i < knapper.length; i++) {
        knapper[i].classList.toggle('aktiv', knapper[i].dataset.bokstav === bokstav);
      }

      el('utforsk-bokstav').textContent = bokstav;
      visIkonfelt(el('utforsk-ikon'), bokstav, oppslag);
      el('utforsk-ord').textContent = visningsordFor(verdenId, bokstav);
      el('utforsk-lytt').hidden = false;
      spillOm(el('utforsk-bokstav'), 'bytter', 460);
      spillOm(el('utforsk-kort').querySelector('.ordkort-innhold'), 'bytter', 420);

      /* Figuren kjører dit bokstaven står i alfabetet. */
      var andel = aktive.length > 1 ? aktive.indexOf(bokstav) / (aktive.length - 1) : 0;
      kjorTil(verdenId, andel);

      si(bokstav, oppslag);
    }

    /* Bokstavene har ett bilde. Tallene har like mange bilder som tallet sier
     * – det er hele poenget: han skal se at 4 betyr fire ting. */
    function visIkonfelt(vertEl, tegn, oppslag) {
      if (domeneFor(verdenId) !== 'tall') {
        vertEl.className = 'ordkort-ikon';
        vertEl.textContent = oppslag.ikon;
        return;
      }
      tegnMengde(vertEl, oppslag.ikon, antallFor(verdenId, tegn), 'ordkort-ikon mengde');
    }

    function si(bokstav, oppslag) {
      Tale.stopp();
      Tale.rekke(tegnrekke(verdenId, bokstav, oppslag));
    }

    return {
      start: function (id) {
        verdenId = id;
        Spill.visSkjerm('skjerm-utforsk');
        Spill.settTopp(VERDENER[id].utforsk, true);
        stillFigurTilStart();
        tegn();
        Spill.settTastLytter(velg);
      },
      gjenta: function () {
        if (sisteBokstav) si(sisteBokstav, ordFor(verdenId, sisteBokstav));
      },
      stopp: function () { Spill.settTastLytter(null); Tale.stopp(); }
    };
  })();

  /* ================= 2. og 3. Oppgavemodusene ================= */

  /* Alt som skiller en treåring fra en femåring ligger her. En treåring
   * orker en kortere runde, trenger færre valg å se på, og skal ha hjelp
   * med én gang i stedet for å bomme to ganger på rad. */
  function oppsett() {
    var liten = Lagring.innstilling('niva') !== 'storre';
    /* hentTall: hvor mange biler «Hent» kan be om. Små mengder først –
     * to, tre og fire er det en treåring faktisk kan hente riktig.
     * farger: hvor mange av FARGER «Mal bilen» bruker – de fire første er
     * de en treåring lærer først. */
    return liten
      ? { antall: 5, maksValg: 3, bomForHjelp: 1, opprykk: 4, hentTall: TALL.slice(1, 4), farger: 4 }
      : { antall: 8, maksValg: 4, bomForHjelp: 2, opprykk: 5, hentTall: TALL.slice(1, 7), farger: FARGER.length };
  }

  /* Etter noen runder på rad foreslår figuren en pause: den er trøtt på
   * oppsummeringen, og pila rundt («en runde til») er borte. Det er ingen
   * lås – han kan gå et annet sted – men spillet ber aldri om mer. Telles i
   * fanen (sessionStorage) og nullstilles etter en halvtime uten runder. */
  var PAUSE_ETTER = 4;
  var PAUSE_NULLSTILL_MS = 30 * 60 * 1000;
  function rundeFerdig() {
    try {
      var lagret = JSON.parse(window.sessionStorage.getItem('oppdageroya.runder') || 'null');
      var n = lagret && Date.now() - lagret.sist < PAUSE_NULLSTILL_MS ? lagret.antall : 0;
      n += 1;
      window.sessionStorage.setItem('oppdageroya.runder',
        JSON.stringify({ antall: n, sist: Date.now() }));
      return n >= PAUSE_ETTER;
    } catch (e) {
      return false;
    }
  }

  var Oppgave = (function () {
    var okt = null;
    var nedtellingAv = null;
    function stoppNedtelling() {
      if (nedtellingAv) { nedtellingAv(); nedtellingAv = null; }
    }

    /* ---------- modusene ----------
     *
     * Alle oppgavemodusene deler samme motor: kø, «lytt først», skilt, hjelp,
     * ros, nedtelling og oppsummering. Det som skiller dem, står her – hver
     * type overstyrer bare det som er annerledes enn STANDARD. En ny modus er
     * en ny oppføring i TYPER (og en flis i Spill), ikke nye forgreininger i
     * motoren. okt.typ er standarden med typens egne felter lagt over. */
    var STANDARD = {
      tittel: 'Finn bokstaven',
      mal: 'bokstav',               /* klassen på merket: oppdrag-mal--… */
      /* Køen og oppsettet for runden. */
      forbered: function (opps) { return { ko: byggKo(okt.verden, opps.antall), oppsett: opps }; },
      /* Det som kan stå på skiltene. */
      utvalg: function () { return Lagring.aktiveTegn(okt.verden); },
      /* Teksten over og merket i midten. */
      tegn: function () {},
      kanVise: false,               /* kan merket avsløres med et trykk */
      sover: false,                 /* skiltene sover til noe er gjort */
      /* Skiltene: tegner valgene og gir antallet som faktisk sto der. */
      valg: skilt,
      skiltInnhold: function (verdi, knapp) { knapp.textContent = verdi; },
      navnPa: function (verdi) { return navnPaTegn(okt.verden, verdi); },
      sporsmal: function () { return []; },
      vedRiktig: function () {},
      ros: function (ros) { return ros; },
      opprykk: true,                /* flere skilt når det går godt */
      mestring: true,               /* svarene teller mot framgangen */
      runde: true,                  /* runden teller mot vanskegraden */
      /* Oppsummeringen. */
      brikker: function () {
        return Object.keys(okt.telling).sort(function (a, b) {
          /* Tegnsettets egen rekkefølge: 2 før 10, og Æ Ø Å til slutt. */
          return tegnFor(okt.verden).indexOf(a) - tegnFor(okt.verden).indexOf(b);
        });
      },
      brikke: function (b) { return '<b>' + b + '</b><i>' + ordFor(okt.verden, b).ikon + '</i>'; },
      oppsumTittel: null,
      oppsumTekst: function (tekst) { return tekst; },
      hilsen: null
    };

    var TYPER = {
      finn: {
        /* «Finn bokstaven» heter «Finn tallet» i tallverdenene. */
        tittel: function () { return domeneFor(okt.verden) === 'tall' ? 'Finn tallet' : 'Finn bokstaven'; },
        tegn: function () {
          el('oppgave-tekst').textContent = VERDENER[okt.verden].oppdrag;
          /* Bokstaven er skjult, ellers er oppgaven bare å finne to like.
           * Trykker han på merket, kommer den fram – hjelp når han trenger den. */
          okt.malVist = !!Lagring.innstilling('visMal');
          tegnMal();
        },
        kanVise: true,
        sporsmal: function () {
          return [VERDENER[okt.verden].oppdrag + '…', 280, navnPaTegn(okt.verden, okt.fasit) + '.'];
        }
      },

      /* «Navnet mitt»: køen er bokstavene i navnet hans, så runden er
       * nøyaktig så lang som navnet og har en slutt barnet skjønner. */
      navn: {
        tittel: 'Navnet mitt',
        mal: 'navn',
        forbered: function (opps, navnkoe) {
          var ko = (navnkoe || []).slice();
          return {
            ko: ko,
            oppsett: { antall: ko.length, maksValg: opps.maksValg,
                       bomForHjelp: opps.bomForHjelp, opprykk: opps.opprykk }
          };
        },
        /* Navnets egne bokstaver må alltid være med: har foreldrene snevret
         * inn til fire bokstaver, ville runden ellers vært uspillbar. */
        utvalg: function () {
          var ut = Lagring.aktiveTegn(okt.verden).slice();
          okt.ko.forEach(function (b) { if (ut.indexOf(b) === -1) ut.push(b); });
          return ut;
        },
        tegn: function () {
          el('oppgave-tekst').textContent = 'Navnet ditt';
          okt.malVist = !!Lagring.innstilling('visMal');
          tegnMal();
        },
        kanVise: true,
        sporsmal: function () {
          /* Første rute knytter oppgaven til navnet hans; resten holder
           * tempoet nede uten å gjenta hele setningen hver gang. */
          return okt.indeks === 0
            ? ['Navnet ditt begynner med…', 320, bokstavnavnFor(okt.fasit) + '.']
            : ['Så kommer…', 300, bokstavnavnFor(okt.fasit) + '.'];
        },
        /* Bokstaven faller på plass i navnet med én gang – det er hele
         * poenget med runden. */
        vedRiktig: function () {
          okt.malVist = true;
          tegnMal();
          spillOm(el('oppgave-mal').querySelector('.navnrute.na'), 'lander', 520);
        },
        /* Runden er like lang som navnet og sier ingenting om hvor
         * vanskelig bokstavene er. */
        runde: false,
        /* Navnet står som et navn, i sin egen rekkefølge – «SOFIA» ville
         * sett ut som et rop, «Sofia» leses som navnet hans. */
        brikker: function () { return okt.ko.slice(); },
        brikke: function (b) { return '<b>' + b + '</b>'; },
        brikkerKlasse: 'oppsum-brikker--navn',
        oppsumTittel: function () { return navnetSomNavn() + '!'; },
        oppsumTekst: function (tekst) { return 'Bygde ' + navnetSomNavn() + '. ' + tekst; },
        hilsen: function () { return navnetTalt(okt.ko); }
      },

      tell: {
        tittel: 'Tell',
        mal: 'tell',
        tegn: function () {
          el('oppgave-tekst').textContent = 'Hvor mange?';
          tegnTelleting();
        },
        /* «Tell først»: tallskiltene våkner når alt er talt. Da er svaret
         * det siste tallordet han sa – telling er veien til svaret, ikke en
         * omvei rundt det. */
        sover: true,
        sporsmal: function () {
          return ['Hvor mange ' + okt.telleting.ord + '?', 400, 'Trykk på hver enkelt og tell.'];
        }
      },

      /* «Hent»: tallet står på garasjen, og han henter akkurat så mange. */
      hent: {
        tittel: 'Hent',
        mal: 'tell',
        forbered: function (opps) {
          return { ko: byggKo(okt.verden, opps.antall, opps.hentTall), oppsett: opps };
        },
        tegn: function () {
          el('oppgave-tekst').textContent = 'Hent';
          tegnTelleting();
        },
        /* Ingen skilt å velge mellom – bare garasjen han leverer bilene i.
         * Alle bilene han kunne tatt, var valget – og det er alltid minst tre. */
        valg: function (valgfelt) {
          var garasje = document.createElement('button');
          garasje.type = 'button';
          garasje.className = 'skilt skilt--garasje';
          garasje.setAttribute('aria-label', 'Garasjen – trykk når du har hentet nok');
          garasje.addEventListener('click', function () { lever(garasje); });
          valgfelt.appendChild(garasje);
          tegnGarasje();
          return el('oppgave-mal').querySelectorAll('.ting').length;
        },
        sporsmal: function () {
          return okt.indeks === 0
            ? [hentSetning(okt.verden, okt.fasit), 400, 'Trykk på garasjen når du er ferdig.']
            : [hentSetning(okt.verden, okt.fasit)];
        },
        /* Det siste tallordet er svaret: «tre biler» – så rosen. */
        ros: function (ros) { return [hentSvar(okt.verden, okt.fasit), 300].concat(ros); },
        /* Ingen skilt, og derfor ikke noe opprykk; tallene er valgt for
         * alderen, ikke etter hvor godt det går. */
        opprykk: false,
        runde: false,
        brikke: function (b) { return '<b>' + b + '</b><i>' + VERDENER[okt.verden].hent.ikon + '</i>'; }
      },

      /* «Mal bilen»: fargene. Bilen står grunnet i midten, stemmen sier
       * hvilken farge, og han velger riktig malingsbøtte. Fargene er ikke
       * bokstaver eller tall, så de teller ikke mot samlingen eller
       * vanskegraden der – runden er like lett hver gang. */
      maling: {
        tittel: 'Mal bilen',
        mal: 'maling',
        forbered: function (opps) {
          var farger = FARGER.slice(0, opps.farger)
            .map(function (f) { return f.id; });
          var ko = [];
          while (ko.length < opps.antall) {
            var f = tilfeldig(farger);
            if (f !== ko[ko.length - 1]) ko.push(f);
          }
          okt.farger = farger;
          return { ko: ko, oppsett: opps, antallValg: opps.maksValg };
        },
        utvalg: function () { return okt.farger; },
        tegn: function () {
          var mal = el('oppgave-mal');
          el('oppgave-tekst').textContent = 'Mal bilen';
          mal.innerHTML = Figurer.malbil('#d5d9df');
          mal.dataset.farge = okt.fasit;
          mal.setAttribute('aria-label', 'Mal bilen ' + okt.fasit);
        },
        skiltInnhold: function (farge, knapp) {
          knapp.classList.add('skilt--botte');
          knapp.innerHTML = Figurer.malingsbotte(fargeFor(farge).hex);
          knapp.setAttribute('aria-label', farge);
        },
        navnPa: function (farge) { return farge; },
        sporsmal: function () { return [malSetning(okt.fasit)]; },
        /* Bilen får fargen med én gang – det er belønningen. */
        vedRiktig: function () {
          var mal = el('oppgave-mal');
          mal.innerHTML = Figurer.malbil(fargeFor(okt.fasit).hex);
          spillOm(mal, 'bytter', 460);
        },
        opprykk: false,
        mestring: false,
        runde: false,
        brikke: function (f) {
          return '<b><span class="fargeklatt" style="--farge: ' + fargeFor(f).hex + '"></span></b>';
        }
      },

      forstelyd: {
        tittel: 'Første lyd',
        mal: 'ord',
        tegn: function () {
          var oppslag = ordFor(okt.verden, okt.fasit);
          el('oppgave-tekst').textContent = 'Hvilken bokstav begynner ordet på?';
          el('oppgave-mal').innerHTML = '<span class="mal-ikon">' + oppslag.ikon + '</span>' +
                                        '<span class="mal-ord">' + oppslag.ord + '</span>';
        },
        sporsmal: function () {
          var oppslag = ordFor(okt.verden, okt.fasit);
          return [oppslag.ord + '.', 420, 'Hvilken bokstav begynner ' + tilTale(oppslag.ord) + ' på?'];
        }
      }
    };

    function navnetSomNavn() {
      return okt.ko[0] + okt.ko.slice(1).join('').toLowerCase();
    }

    /* Standardvalgene: fasiten og noen andre fra utvalget, på hvert sitt
     * skilt. Har foreldrene valgt bare to bokstaver, finnes det ikke tre. */
    function skilt(valgfelt) {
      var antallValg = Math.min(okt.antallValg, okt.typ.utvalg().length);
      var alternativer = bland([okt.fasit].concat(distraktorer(okt.fasit, antallValg - 1)));
      alternativer.forEach(function (verdi) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'skilt';
        okt.typ.skiltInnhold(verdi, b);
        b.dataset.bokstav = verdi;
        b.addEventListener('click', function () { svar(verdi, b); });
        valgfelt.appendChild(b);
      });
      return alternativer.length;
    }

    /* Bygger køen: bokstavene han kan minst kommer først i utvalget, men
     * noen kjente blandes inn som hvilepunkter. */
    function byggKo(verdenId, antall, aktive) {
      aktive = aktive || Lagring.aktiveTegn(verdenId);
      var sortert = aktive.slice().sort(function (a, b) {
        var da = Lagring.dagerFor(a), db = Lagring.dagerFor(b);
        if (da !== db) return da - db;
        return Lagring.riktigeFor(a) - Lagring.riktigeFor(b);
      });
      var trengsMest = sortert.slice(0, Math.max(4, Math.ceil(sortert.length / 2)));
      var resten = sortert.slice(trengsMest.length);

      var ko = [];
      var pott = bland(trengsMest);
      var lettePott = bland(resten);
      while (ko.length < antall) {
        if (!pott.length) pott = bland(trengsMest);
        var neste = pott.pop();
        /* Samme bokstav to ganger på rad kjennes som at spillet står fast. */
        if (neste === ko[ko.length - 1] && (pott.length || trengsMest.length > 1)) {
          if (!pott.length) pott = bland(trengsMest);
          pott.unshift(neste);
          neste = pott.pop();
          if (neste === ko[ko.length - 1] && pott.length) neste = pott.shift();
        }
        ko.push(neste);
        if (ko.length < antall && lettePott.length && ko.length % 3 === 2) {
          ko.push(lettePott.pop());
        }
      }
      ko = ko.slice(0, antall);

      /* Bokstavene som står på to av tre dager er de som kan bli hans i dag.
       * De havner midt mellom «trengs mest» og «kan godt», og kan derfor bli
       * hoppet over runde etter runde. Er ingen av dem med, byttes én inn –
       * da kommer mestringsøyeblikkene jevnere i stedet for i klumper. */
      var naerMestring = aktive.filter(function (b) {
        return Lagring.dagerFor(b) === 2 && !Lagring.erMestret(b);
      });
      if (naerMestring.length && !ko.some(function (b) {
        return naerMestring.indexOf(b) !== -1;
      })) {
        var inn = tilfeldig(naerMestring);
        /* Ikke på første plass, og ikke slik at samme bokstav kommer to
         * ganger etter hverandre. */
        for (var i = 1; i < ko.length; i++) {
          if (ko[i - 1] !== inn && ko[i + 1] !== inn) { ko[i] = inn; break; }
        }
      }
      return ko;
    }

    /* «Lytt først». Skiltene sover mens spørsmålet leses, og våkner når det
     * er ferdig – et barn som trykker tilfeldig mens stemmen snakker, treffer
     * ingenting, og et som lytter, ser dem sprette opp. Uten stemme våkner de
     * etter litt over ett sekund. Nummeret gjør at et avbrutt spørsmål (han
     * trykket «Hør igjen», eller gikk ut) aldri vekker skiltene for et nytt. */
    function lyttForst(tale, etterpa) {
      var denne = okt, nr = ++okt.spmNr;
      okt.lytter = true;
      el('skjerm-oppgave').classList.add('lytter');
      Tale.stopp();
      var minst = Tale.kanSnakke() ? 400 : 1200;
      Promise.race([Promise.all([Tale.rekke(tale), Tale.vent(minst)]), Tale.vent(10000)])
        .then(function () {
          if (okt !== denne || nr !== okt.spmNr) return;
          okt.lytter = false;
          el('skjerm-oppgave').classList.remove('lytter');
          if (etterpa) etterpa();
        });
    }

    function tegnPrikker() {
      var felt = el('oppgave-prikker');
      felt.innerHTML = '';
      for (var i = 0; i < okt.oppsett.antall; i++) {
        var p = document.createElement('span');
        p.className = 'prikk' + (i < okt.indeks ? ' tatt' : (i === okt.indeks ? ' na' : ''));
        felt.appendChild(p);
      }
    }

    function distraktorer(fasit, antall) {
      var andre = okt.typ.utvalg().filter(function (b) { return b !== fasit; });
      return bland(andre).slice(0, antall);
    }

    function sporsmalstale() { return okt.typ.sporsmal(); }

    function visOppgave() {
      okt.fasit = okt.ko[okt.indeks];
      okt.forsokPaDenne = 0;
      okt.ferdigMedDenne = false;
      okt.hjelpHent = false;

      tegnPrikker();

      var mal = el('oppgave-mal');
      mal.className = 'oppdrag-mal oppdrag-mal--' + okt.typ.mal;
      okt.typ.tegn();
      spillOm(mal, 'bytter', 460);

      var valgfelt = el('oppgave-valg');
      valgfelt.innerHTML = '';
      okt.visteValg = okt.typ.valg(valgfelt);

      el('oppgave-videre').hidden = true;
      valgfelt.classList.toggle('sover', !!okt.typ.sover);

      lyttForst(sporsmalstale());
    }

    /* «Tell»: tingene han skal telle. Han kan trykke på hver enkelt, og da
     * sier spillet «én … to … tre». Det er dette som *er* å telle – å peke på
     * hver ting nøyaktig én gang og sette ett tallord til hver. Å bare se en
     * haug og gjette tallet er noe helt annet, og går ikke lenger enn til
     * tre–fire ting.
     *
     * Trykker han på nytt på en han allerede har tatt, sies tallet igjen uten
     * at tellingen går videre. Rekkefølgen er fri; det er antallet trykkede
     * ting som bestemmer hva som sies. */
    function tegnTelleting() {
      var antall = antallFor(okt.verden, okt.fasit);
      /* Tingen trekkes tilfeldig, ikke fra tallets egen oppføring. Var det
       * alltid tre baller, kunne han svart riktig ved å kjenne igjen ballen
       * i stedet for å telle – og da måler vi hukommelse, ikke telling. */
      okt.telleting = tilfeldig(tellingFor(okt.verden));
      /* I «Hent» står det flere biler enn han skal hente – én til tre
       * ekstra. Oppgaven er å vite når han skal stoppe. */
      if (okt.type === 'hent') {
        var h = VERDENER[okt.verden].hent;
        okt.telleting = { ord: h.flertall, ikon: h.ikon };
        antall = Math.min(10, antall + 1 + Math.floor(Math.random() * 3));
      }
      okt.talt = 0;
      okt.telt = [];
      tegnMengde(el('oppgave-mal'), okt.telleting.ikon, antall,
                 'oppdrag-mal oppdrag-mal--tell' + (okt.type === 'hent' ? ' oppdrag-mal--hent' : '') + ' mengde');

      var ting = el('oppgave-mal').querySelectorAll('.ting');
      for (var i = 0; i < ting.length; i++) {
        (function (t) {
          t.addEventListener('click', function (e) {
            e.stopPropagation();
            tellTing(t);
          });
        })(ting[i]);
      }
    }

    /* Nummererer det som er talt, i den rekkefølgen han faktisk pekte. Kalles
     * etter at noe er tatt bort igjen, så tallene alltid går 1, 2, 3 … uten
     * hull. Et hull i rekka er nettopp det telling ikke tåler. */
    function nummererPaNytt() {
      okt.telt.forEach(function (t, i) { t.dataset.talltall = String(i + 1); });
      okt.talt = okt.telt.length;
    }

    function tellTing(t) {
      if (okt.ferdigMedDenne || okt.lytter) return;
      /* Trykk på noe som alt er talt: ta det bort igjen. Han skal kunne
       * angre og telle om, uten å måtte begynne på en ny oppgave – det er
       * halve poenget med å telle med fingeren. */
      if (t.classList.contains('talt')) {
        t.classList.remove('talt');
        delete t.dataset.talltall;
        okt.telt = okt.telt.filter(function (x) { return x !== t; });
        nummererPaNytt();
        Lyd.klikk();
        Tale.stopp();
        if (okt.type === 'hent') tegnGarasje();
        if (okt.type === 'tell') el('oppgave-valg').classList.add('sover');
        return;
      }
      /* Med hjelp i «Hent» er garasjen full når den er full – da kan han
       * ikke hente flere, og runden ender alltid med at han klarte det. */
      if (okt.type === 'hent' && okt.hjelpHent &&
          okt.talt >= antallFor(okt.verden, okt.fasit)) {
        spillOm(t, 'vugg', 500);
        Lyd.proveIgjen();
        return;
      }
      okt.telt.push(t);
      okt.talt = okt.telt.length;
      t.classList.add('talt');
      t.dataset.talltall = String(okt.talt);
      spillOm(t, 'teller', 420);
      Lyd.klikk();
      Tale.stopp();

      /* «Hent»: tauebilen kjører bort og henter den, og spillet teller. */
      if (okt.type === 'hent') {
        Tale.rekke([tellenavn(okt.talt) + '.']);
        kjorTil(okt.verden, t);
        tegnGarasje();
        return;
      }

      var alle = antallFor(okt.verden, okt.fasit);
      el('oppgave-valg').classList.toggle('sover', okt.talt < alle);
      if (okt.talt >= alle) {
        /* Det siste tallordet han sier *er* svaret. Uten den koblingen har han
         * bare ramset opp tallrekka mens han pekte. */
        Tale.rekke([tellenavn(okt.talt) + '.', 380, 'Det var…', 240,
                    tellenavn(okt.talt) + '.', 200,
                    okt.telleting.ord + '.']);
      } else {
        Tale.rekke([tellenavn(okt.talt) + '.']);
      }
    }

    /* Tegner oppdragsmerket: enten et spørsmålstegn å trykke på, eller
     * bokstaven når den er avslørt. */
    function tegnMal() {
      var mal = el('oppgave-mal');
      if (okt.type === 'finn') {
        mal.classList.toggle('skjult', !okt.malVist);
        mal.textContent = okt.malVist ? okt.fasit : '?';
        mal.setAttribute('aria-label', okt.malVist
          ? merkeNavn(okt.verden) + ' er ' + navnPaTegn(okt.verden, okt.fasit)
          : 'Trykk for å se ' + merkeNavn(okt.verden).toLowerCase());
        return;
      }
      if (okt.type !== 'navn') return;

      /* Navnet som ruter: det han har bygd står, ruten han holder på med er
       * et spørsmålstegn, og resten er tomme. Sto bokstavene der ferdig,
       * ville oppgaven vært å avskrive i stedet for å kjenne igjen. */
      mal.classList.toggle('skjult', !okt.malVist);
      mal.innerHTML = okt.ko.map(function (b, i) {
        if (i < okt.indeks) return '<span class="navnrute full">' + b + '</span>';
        if (i === okt.indeks) {
          return '<span class="navnrute na">' + (okt.malVist ? b : '?') + '</span>';
        }
        return '<span class="navnrute"></span>';
      }).join('');
      mal.setAttribute('aria-label', okt.malVist
        ? merkeNavn(okt.verden) + ' er ' + navnPaTegn(okt.verden, okt.fasit)
        : 'Trykk for å se ' + merkeNavn(okt.verden).toLowerCase());
    }

    /* Garasjen i «Hent»: tallet den vil ha, og bilene som er hentet. Med
     * hjelp står det tomme plasser for resten, så han ser hvor mange som
     * mangler, og garasjen pulserer når den er full. */
    function tegnGarasje() {
      var g = el('oppgave-valg').querySelector('.skilt--garasje');
      if (!g) return;
      var n = antallFor(okt.verden, okt.fasit);
      var ikon = VERDENER[okt.verden].hent.ikon;
      var vis = okt.hjelpHent ? n : okt.talt;
      var plasser = '';
      for (var i = 0; i < vis; i++) {
        plasser += i < okt.talt
          ? '<span class="garasje-plass full">' + ikon + '</span>'
          : '<span class="garasje-plass"></span>';
      }
      g.innerHTML = '<span class="garasje-tall">' + okt.fasit + '</span>' +
                    '<span class="garasje-plasser">' + plasser + '</span>';
      g.classList.toggle('pekes', okt.hjelpHent && okt.talt === n);
    }

    /* Han trykker på garasjen: er det riktig antall, er oppgaven løst. For
     * få: vi trenger flere, og det han har hentet blir stående. For mange:
     * bilene kjøres ut igjen, og vi teller sammen fra start. */
    function lever(knapp) {
      if (okt.ferdigMedDenne || okt.lytter) return;
      var n = antallFor(okt.verden, okt.fasit);
      if (!okt.talt) {
        Tale.stopp();
        Tale.rekke(sporsmalstale());
        return;
      }
      if (okt.talt === n) { riktig(knapp); return; }

      okt.forsokPaDenne += 1;
      okt.paRad = 0;
      Lagring.registrerFeil(okt.fasit);
      spillOm(knapp, 'vugg', 500);
      Lyd.proveIgjen();
      uttrykk('hmm', 1400);
      var forMange = okt.talt > n;
      if (forMange) {
        okt.telt.forEach(function (t) {
          t.classList.remove('talt');
          delete t.dataset.talltall;
        });
        okt.telt = [];
        okt.talt = 0;
      }
      if (okt.forsokPaDenne >= okt.oppsett.bomForHjelp) okt.hjelpHent = true;
      tegnGarasje();
      Tale.stopp();
      Tale.rekke(forMange
        ? ['Det ble for mange.', 300, 'Vi teller sammen.']
        : ['Vi trenger flere.']);
    }

    function visMal() {
      if (!okt || !okt.typ.kanVise) return false;
      if (okt.malVist) return false;
      okt.malVist = true;
      tegnMal();
      spillOm(el('oppgave-mal'), 'bytter', 460);
      Lyd.klikk();
      return true;
    }

    function knappFor(bokstav) {
      return el('oppgave-valg').querySelector('[data-bokstav="' + bokstav + '"]');
    }

    function lasAlle() {
      var knapper = el('oppgave-valg').querySelectorAll('.skilt');
      for (var i = 0; i < knapper.length; i++) knapper[i].disabled = true;
      Spill.settTastLytter(null);
    }

    function svar(bokstav, knapp) {
      /* Tastaturet går utenom CSS, så søvnen sjekkes her også. */
      if (knapp.disabled || okt.lytter || el('oppgave-valg').classList.contains('sover')) return;

      if (bokstav === okt.fasit) { riktig(knapp); return; }

      /* Feil: skiltet vugger, tonen er lav og vennlig, og han prøver igjen. */
      okt.forsokPaDenne += 1;
      okt.paRad = 0;
      if (okt.typ.mestring) Lagring.registrerFeil(okt.fasit);
      knapp.classList.add('feil');
      spillOm(knapp, 'vugg', 500);
      knapp.disabled = true;
      Lyd.proveIgjen();
      uttrykk('hmm', 1400);

      if (okt.forsokPaDenne >= okt.oppsett.bomForHjelp) {
        hjelp();
      } else {
        lyttForst(['Prøv en gang til.', 300].concat(sporsmalstale()));
      }
    }

    /* Etter to bom viser vi svaret og lar ham trykke på det selv, så runden
     * aldri ender med at han ikke fikk det til. */
    function hjelp() {
      okt.bomPaRad += 1;
      if (okt.bomPaRad >= 2 && okt.antallValg > 2) {
        okt.antallValg -= 1;
        okt.bomPaRad = 0;
      }
      var riktigKnapp = knappFor(okt.fasit);
      var alle = el('oppgave-valg').querySelectorAll('.skilt');
      for (var i = 0; i < alle.length; i++) {
        if (alle[i] === riktigKnapp) continue;
        alle[i].disabled = true;
        /* Bare skiltet han faktisk trykket på er «feil» – det har allerede
         * fått klassen i svar(). De andre tones bare ned. Å farge et skilt
         * han aldri rørte som feil er å gi ham skylden for noe han ikke
         * gjorde. */
        if (!alle[i].classList.contains('feil')) alle[i].classList.add('borte');
      }
      /* Navnet sies for seg. Det er samme ytring som ellers i spillet, og
       * kan derfor gjenbruke det samme innspilte klippet – i tillegg til at
       * det blir en pause rett foran det han skal høre etter. Skiltet
       * sover mens det sies, og pulsen starter når det våkner – også om
       * han ber om å høre det igjen underveis. */
      riktigKnapp.classList.add('pekes');
      lyttForst(['Her er…', 260, okt.typ.navnPa(okt.fasit) + '.',
                 300, 'Trykk på den.']);
    }

    function riktig(knapp) {
      var v = VERDENER[okt.verden];
      var forsteForsok = okt.forsokPaDenne === 0;
      okt.ferdigMedDenne = true;

      lasAlle();
      knapp.classList.remove('pekes');
      knapp.classList.add('riktig');

      okt.typ.vedRiktig(knapp);

      /* Riktig på første forsøk: figuren kjører dit og blir glad. Etter
       * hjelp: bare et rolig grønt skilt. Hjelpen skal aldri være morsommere
       * enn å klare det selv, ellers lønner det seg å bomme med vilje. */
      if (forsteForsok) kjorTil(okt.verden, knapp);
      else knapp.classList.add('rolig');

      if (forsteForsok) {
        okt.riktigForste += 1;
        okt.paRad += 1;
        okt.bomPaRad = 0;
        var forMestret = Lagring.erMestret(okt.fasit);
        /* Antall skilt som faktisk sto på skjermen avgjør om treffet teller
         * mot mestring – med to er halvparten flaks. */
        if (okt.typ.mestring) Lagring.registrerRiktig(okt.fasit, okt.visteValg);
        var bleMestret = okt.typ.mestring && !forMestret && Lagring.erMestret(okt.fasit);
        if (bleMestret) okt.nyeMestrede.push(okt.fasit);
        okt.telling[okt.fasit] = (okt.telling[okt.fasit] || 0) + 1;

        window.setTimeout(function () {
          Lyd.stjerne();
          if (bleMestret) feirMestret(knapp); else stjerneLander(knapp);
        }, 380);
      }

      /* Ikke lov noe vanskeligere på siste oppgave – runden slutter ved neste
       * trykk, og løftet ville aldri blitt innfridd. */
      var siste = okt.indeks + 1 >= okt.oppsett.antall;
      var opp = !siste && okt.typ.opprykk && okt.paRad >= okt.oppsett.opprykk &&
                okt.antallValg < okt.oppsett.maksValg;
      if (opp) {
        okt.antallValg += 1;
        okt.paRad = 0;
        /* Opprykket må overleve runden. Ble det nullstilt hver gang, ville
         * han aldri komme forbi to skilt, og hele vanskegraden vært bygget
         * uten at noen fikk se den. */
        Lagring.settAntallValg(okt.verden, okt.antallValg);
      }

      var rosord = tilfeldig(v.ros);
      var ros = forsteForsok
        ? [Tale.velg(rosord + ', ' + Lagring.navnFor(okt.verden) + '!',
                     rosord + '!')]
        : ['Der ja! Det er…', 260, okt.typ.navnPa(okt.fasit) + '.'];
      if (forsteForsok) ros = okt.typ.ros(ros);

      Tale.stopp();
      Tale.rekke(opp ? ros.concat([350, 'Nå prøver vi en vanskeligere en.']) : ros);

      /* Ingen knapp å trykke på lenger – nedtellingen viser seg selv og går
       * videre av seg selv når den når null. */
      var nedtellingEl = el('oppgave-videre');
      nedtellingEl.hidden = false;
      stoppNedtelling();
      nedtellingAv = nedtelling(nedtellingEl, videre);
    }

    function videre() {
      stoppNedtelling();
      okt.indeks += 1;
      if (okt.indeks >= okt.oppsett.antall) { avslutt(); return; }
      Spill.settTastLytter(tastesvar);
      visOppgave();
    }

    function tastesvar(bokstav) {
      var knapp = knappFor(bokstav);
      if (knapp && !knapp.disabled) svar(bokstav, knapp);
    }

    function avslutt() {
      Spill.settTastLytter(null);
      Tale.stopp();
      Spill.visSkjerm('skjerm-oppsummering');
      Spill.settTopp('Ferdig', true);

      /* Gikk det tungt to runder på rad, går vi ned et hakk igjen – for de
       * modusene der runden sier noe om vanskegraden. */
      if (okt.typ.runde) {
        Lagring.registrerRunde(okt.verden, okt.riktigForste, okt.oppsett.antall);
      }

      var pause = rundeFerdig();
      el('oppsum-flagg').textContent = VERDENER[okt.verden].flagg;
      el('oppsum-tittel').textContent = pause ? 'Nå tar vi en pause'
        : okt.typ.oppsumTittel ? okt.typ.oppsumTittel()
        : tilfeldig(VERDENER[okt.verden].ros) + '!';
      el('oppsum-igjen').hidden = pause;

      /* En treåring kan ikke lese en resultatliste. Han kan telle stjerner
       * og kjenne igjen bokstavene sine, så det er det oppsummeringen viser.
       * Setningen nederst er til den voksne som sitter ved siden av. */
      var stjerner = el('oppsum-stjerner');
      stjerner.innerHTML = '';
      for (var i = 0; i < okt.oppsett.antall; i++) {
        var st = document.createElement('span');
        st.className = 'oppsum-stjerne' + (i < okt.riktigForste ? ' tent' : '');
        st.textContent = '★';
        st.style.animationDelay = (140 + i * 130) + 'ms';
        stjerner.appendChild(st);
      }

      var brikker = el('oppsum-brikker');
      brikker.innerHTML = '';
      brikker.className = 'oppsum-brikker' + (okt.typ.brikkerKlasse ? ' ' + okt.typ.brikkerKlasse : '');
      var funnet = okt.typ.brikker();
      funnet.forEach(function (b, n) {
        var brikke = document.createElement('span');
        brikke.className = 'oppsum-brikke';
        brikke.style.animationDelay = (okt.oppsett.antall * 130 + 160 + n * 90) + 'ms';
        brikke.innerHTML = okt.typ.brikke(b);
        brikker.appendChild(brikke);
      });

      var ny = el('oppsum-ny');
      if (okt.nyeMestrede.length) {
        ny.hidden = false;
        ny.innerHTML = okt.nyeMestrede.map(function (b) {
          return '<span class="ny-bokstav">' + b + '</span>';
        }).join('') +
        '<span class="ny-tekst">' +
          (okt.nyeMestrede.length === 1 ? 'er din nå!' : 'er dine nå!') +
        '</span>';
      } else {
        ny.hidden = true;
        ny.innerHTML = '';
      }

      var tekst = 'Klarte ' + okt.riktigForste + ' av ' + okt.oppsett.antall +
                  ' med én gang.';
      if (!okt.typ.brikkerKlasse && funnet.length) {
        tekst += ' Fant ' + listetekst(funnet) + ' selv.';
      }
      tekst = okt.typ.oppsumTekst(tekst);
      if (okt.nyeMestrede.length) {
        tekst += ' ' + listetekst(okt.nyeMestrede) + ' er nå truffet tre ulike dager.';
      }
      el('oppsum-tekst').textContent = tekst;

      Lyd.ferdig();
      /* Slutten av runden: figuren kjører helt bort, over målstreken. Den er
       * glad – eller trøtt, når det er tid for en pause. */
      kjorTil(okt.verden, 1);
      uttrykk(pause ? 'trott' : 'glad');
      var hilsen = okt.typ.hilsen
        ? okt.typ.hilsen()
        : okt.nyeMestrede.length
          ? ['Se her!', 280, navnPaTegn(okt.verden, okt.nyeMestrede[0]) + '.',
             280, 'Den kan du nå!']
          : [Tale.velg('Bra jobbet, ' + Lagring.navnFor(okt.verden) + '!',
                       'Bra jobbet!')];
      if (pause) hilsen = hilsen.concat([400, 'Nå trenger vi en pause.']);
      /* Rosen og hoppet kommer litt etter, med vilje. Har han allerede gått
       * videre – en ny runde, eller tilbake – hører de ikke hjemme der han
       * er nå, og da blir de borte. */
      var denne = okt;
      function fortsattHer() {
        return okt === denne && !el('skjerm-oppsummering').hidden;
      }
      window.setTimeout(function () { if (fortsattHer()) Tale.rekke(hilsen); }, 700);
      /* Figuren hopper av glede – det er den delen han skjønner uten ord. */
      window.setTimeout(function () {
        if (fortsattHer() && !pause) { hopp(); uttrykk('glad'); }
      }, 1000);

      Spill.settOppsummering(okt.type);
    }

    return {
      /* «Navnet mitt» sender med bokstavene i navnet som kø; runden er da
       * nøyaktig så lang som navnet, og har en slutt barnet skjønner. */
      start: function (type, verdenId, navnkoe) {
        okt = {
          type: type,
          typ: Object.assign({}, STANDARD, TYPER[type]),
          verden: verdenId,
          indeks: 0,
          /* Der han slapp forrige runde, klippet mot taket på dagens nivå –
           * settes nivået ned i foreldremenyen, skal ikke et gammelt opprykk
           * overstyre det. */
          antallValg: 2,
          visteValg: 2,
          paRad: 0,
          bomPaRad: 0,
          forsokPaDenne: 0,
          riktigForste: 0,
          telling: {},
          nyeMestrede: [],
          spmNr: 0
        };
        var runde = okt.typ.forbered(oppsett(), navnkoe);
        if (!runde.ko.length) { okt = null; return false; }
        okt.ko = runde.ko;
        okt.oppsett = runde.oppsett;
        okt.antallValg = runde.antallValg ||
          Math.min(Lagring.antallValgFor(verdenId), runde.oppsett.maksValg);

        Spill.visSkjerm('skjerm-oppgave');
        var tittel = typeof okt.typ.tittel === 'function' ? okt.typ.tittel() : okt.typ.tittel;
        /* Er runden låst, er pila tilbake borte helt til «Se hvordan det
         * gikk» – se innstillingen «Fullfør runden» og startOppgave() i
         * spill.js, som også lar tilbakeHandling stå tom mens den er der. */
        Spill.settTopp(tittel, !Lagring.innstilling('laasUnderveis'));
        stillFigurTilStart();
        Spill.settTastLytter(tastesvar);
        visOppgave();
        return true;
      },

      visMal: visMal,

      gjentaSporsmal: function () {
        if (!okt) return;
        if (okt.ferdigMedDenne) {
          Tale.stopp();
          Tale.rekke(sporsmalstale());
          return;
        }
        lyttForst(sporsmalstale());
      },

      stopp: function () {
        stoppNedtelling();
        Spill.settTastLytter(null);
        Tale.stopp();
        if (okt) okt.spmNr += 1;
        el('skjerm-oppgave').classList.remove('lytter');
      }
    };
  })();

  /* ================= 4. Alfabetløypa ================= */

  /* En rolig tur fra A til Å, ett trykk per bokstav. Dette er ikke en
   * oppgave: han blir lest for, slik dere leser alfabetboka sammen. Derfor
   * ingen valg, ingen feil og ingen stjerner – bare bokstaven, bildet og
   * ordet, og en figur som kommer litt lenger for hvert trykk. */
  var Loype = (function () {
    var verdenId = 'bane';
    var indeks = 0;
    var ferdig = false;
    var naarFerdig = null;
    var nedtellingAv = null;
    function stoppNedtelling() {
      if (nedtellingAv) { nedtellingAv(); nedtellingAv = null; }
    }

    /* Løypa går gjennom hele tegnsettet, også de sjeldne bokstavene: her er
     * det ingen oppgave, bare en tur fra start til slutt. */
    function rekka() { return tegnFor(verdenId); }

    function si() {
      var b = rekka()[indeks];
      Tale.stopp();
      Tale.rekke(tegnrekke(verdenId, b, ordFor(verdenId, b)));
    }

    function tegn() {
      var b = rekka()[indeks];
      var oppslag = ordFor(verdenId, b);

      el('loype-bokstav').textContent = b;
      el('loype-bokstav').classList.remove('smal');
      if (domeneFor(verdenId) === 'tall') {
        tegnMengde(el('loype-ikon'), oppslag.ikon, antallFor(verdenId, b), 'ordkort-ikon mengde');
      } else {
        el('loype-ikon').className = 'ordkort-ikon';
        el('loype-ikon').textContent = oppslag.ikon;
      }
      el('loype-ord').textContent = visningsordFor(verdenId, b);
      el('loype-teller').textContent = (indeks + 1) + ' av ' + rekka().length;
      el('loype-fyll').style.width =
        ((indeks + 1) / rekka().length * 100) + '%';
      spillOm(el('loype-kort'), 'bytter', 460);

      /* Figuren står der i alfabetet han er – framdriften synes i scenen. */
      kjorTil(verdenId, indeks / Math.max(1, rekka().length - 1));
      si();
      /* Ingen knapp underveis – bare nedtellingen, som går videre av seg
       * selv når den når null. Den manuelle «Tilbake»-knappen kommer først
       * når han er ferdig, i avslutt(). */
      stoppNedtelling();
      nedtellingAv = nedtelling(el('loype-nedtelling'), videre);
    }

    function avslutt() {
      ferdig = true;
      stoppNedtelling();
      el('loype-nedtelling').hidden = true;
      el('loype-bokstav').textContent = domeneFor(verdenId) === 'tall' ? '1–10' : 'A–Å';
      el('loype-bokstav').classList.add('smal');
      el('loype-ikon').className = 'ordkort-ikon';
      el('loype-ikon').textContent = VERDENER[verdenId].ikon;
      el('loype-ord').textContent = domeneFor(verdenId) === 'tall'
        ? 'Alle tallene!' : 'Hele alfabetet!';
      el('loype-teller').textContent = rekka().length + ' av ' + rekka().length;
      spillOm(el('loype-kort'), 'bytter', 460);
      /* Her, og bare her, er det en ekte knapp å trykke på: han skal velge
       * selv når han vil ut, ikke bli sendt til menyen av en nedtelling. */
      el('loype-videre-ikon').innerHTML = Figurer.ikon('malflagg');
      el('loype-videre').hidden = false;
      el('loype-videre').focus();
      Spill.settTastLytter(null);
      Lyd.ferdig();
      hopp();
      Tale.stopp();
      Tale.rekke([domeneFor(verdenId) === 'tall'
        ? 'Der var alle tallene! Fra én til ti.'
        : 'Der var hele alfabetet! Fra a til å.']);
    }

    function videre() {
      stoppNedtelling();
      if (ferdig) { if (naarFerdig) naarFerdig(); return; }
      if (indeks + 1 >= rekka().length) { avslutt(); return; }
      indeks += 1;
      tegn();
    }

    /* Trykker han på en bokstavtast, hopper løypa dit. Samme kobling mellom
     * tast og tegn som i Garasjen. */
    function hoppTil(bokstav) {
      var n = rekka().indexOf(bokstav);
      if (n === -1 || ferdig) return;
      indeks = n;
      tegn();
    }

    return {
      start: function (id, ferdigHandling) {
        verdenId = id;
        indeks = 0;
        ferdig = false;
        naarFerdig = ferdigHandling || null;
        Spill.visSkjerm('skjerm-loype');
        Spill.settTopp(domeneFor(id) === 'tall' ? 'Tallrekka' : 'Alfabetløypa', true);
        stillFigurTilStart();
        Spill.settTastLytter(hoppTil);
        /* Fra forrige gang han var ferdig kan «Tilbake»-knappen stå igjen –
         * nå starter han på nytt, og det er nedtellingen sin tur. */
        el('loype-videre').hidden = true;
        el('loype-nedtelling').hidden = false;
        tegn();
      },
      videre: videre,
      /* Hører han bokstaven en gang til, skal han ikke bli dratt videre
       * midt i det – nedtellingen starter forfra etter at den er sagt. */
      gjenta: function () {
        if (ferdig) return;
        si();
        stoppNedtelling();
        nedtellingAv = nedtelling(el('loype-nedtelling'), videre);
      },
      stopp: function () { stoppNedtelling(); Spill.settTastLytter(null); Tale.stopp(); }
    };
  })();

  return {
    Utforsk: Utforsk,
    Oppgave: Oppgave,
    Loype: Loype,
    hopp: hopp,
    stillFigurTilStart: stillFigurTilStart,
    /* Alle veier ut av en modus går gjennom dette – se Spill.visSkjerm.
     * Uten det tikket nedtellingen videre i bakgrunnen når man gikk ut via
     * foreldremenyen, og hoppet over en oppgave i neste runde. */
    stoppAlt: function () {
      Utforsk.stopp();
      Oppgave.stopp();
      Loype.stopp();
      uttrykk(null);
    }
  };
})();
