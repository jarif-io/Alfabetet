/* Bokstavløpet – de tre modusene
 *
 * Alle tre deler samme regel: ingenting skjer av seg selv. Barnet trykker,
 * spillet svarer i under ett sekund, og så står skjermen stille igjen.
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

  var TALLORD = ['null', 'én', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte'];
  function tallord(n) { return TALLORD[n] || String(n); }

  /* «A, B og C» – slik en voksen ville lest det høyt. */
  function listetekst(deler) {
    if (deler.length === 1) return deler[0];
    return deler.slice(0, -1).join(', ') + ' og ' + deler[deler.length - 1];
  }

  /* Ord som «WC» er forkortelser. Gjøres de om til småbokstaver, mister
   * talesyntesen sporet og staver dem feil – de skal stå som de står. */
  function tilTale(ord) {
    return ord === ord.toUpperCase() ? ord : ord.toLowerCase();
  }

  /* «ell … ell for Løve» – samme formel som alfabetbøkene bruker, og kort nok
   * til at en treåring holder følge. Bokstavnavnet skrives ut («ell»), ellers
   * leser talesyntesen det store tegnet som «stor L».
   *
   * Er bokstavlyden slått på, legges selve lyden inn mellom: «ell … lll …
   * ell for Løve». Uten den hører han ingen sammenheng mellom navnet på
   * konsonanten, som begynner på en vokal, og lyden den lager i ordet – og
   * det er nettopp den sammenhengen «Første lyd» forutsetter. */
  function tegnrekke(verdenId, tegn, oppslag) {
    var navn = navnPaTegn(verdenId, tegn);
    /* Tallene sier «fire … fire bein». «fire for bein» ville vært tull, og
     * det er sammenhengen mellom tallet og mengden som er poenget. */
    if (domeneFor(verdenId) === 'tall') {
      return [navn + '.', 450, visningsordFor(verdenId, tegn) + '.'];
    }
    var lyd = Lagring.innstilling('bokstavlyd') ? bokstavlydFor(tegn) : null;
    var rekke = [navn + '.', 450];
    if (lyd) rekke = rekke.concat([lyd + '.', 450]);
    return rekke.concat([navn + ' for ' + tilTale(oppslag.ord) + '.']);
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

  /* ================= figuren på bakken ================= */

  var kjoreTimer = null;

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
    figur.style.transform = 'translateX(' + x + 'px)';

    if (verdenId === 'oy') Lyd.bolge(); else Lyd.motor();

    window.clearTimeout(kjoreTimer);
    kjoreTimer = window.setTimeout(function () {
      figur.classList.remove('kjorer');
    }, 1000);
  }

  function stillFigurTilStart() {
    var figur = el('figur');
    figur.classList.remove('speilet', 'kjorer');
    figur.style.transform = 'translateX(24px)';
  }

  /* Et lite hopp. Treåringer trykker på figuren fordi den er der, og da
   * skal det skje noe. */
  function hopp() {
    var figur = el('figur');
    if (!figur || el('figurbane').hidden) return;
    spillOm(figur, 'hopper', 620);
    Lyd.tut();
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
    return liten
      ? { antall: 5, maksValg: 3, bomForHjelp: 1, opprykk: 4 }
      : { antall: 8, maksValg: 4, bomForHjelp: 2, opprykk: 5 };
  }

  var MODUSTITTEL = {
    finn: 'Finn bokstaven',
    forstelyd: 'Første lyd',
    navn: 'Navnet mitt',
    tell: 'Tell'
  };

  var Oppgave = (function () {
    var okt = null;

    /* Bygger køen: bokstavene han kan minst kommer først i utvalget, men
     * noen kjente blandes inn som hvilepunkter. */
    function byggKo(verdenId, antall) {
      var aktive = Lagring.aktiveTegn(verdenId);
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

    function tegnPrikker() {
      var felt = el('oppgave-prikker');
      felt.innerHTML = '';
      for (var i = 0; i < okt.oppsett.antall; i++) {
        var p = document.createElement('span');
        p.className = 'prikk' + (i < okt.indeks ? ' tatt' : (i === okt.indeks ? ' na' : ''));
        felt.appendChild(p);
      }
    }

    /* Bokstavene det er lov å velge mellom. I «Navnet mitt» må navnets egne
     * bokstaver alltid være med: har foreldrene snevret inn til fire
     * bokstaver, ville runden ellers vært uspillbar. */
    function utvalg() {
      var aktive = Lagring.aktiveTegn(okt.verden);
      if (okt.type !== 'navn') return aktive;
      var ut = aktive.slice();
      okt.ko.forEach(function (b) { if (ut.indexOf(b) === -1) ut.push(b); });
      return ut;
    }

    function distraktorer(fasit, antall) {
      var andre = utvalg().filter(function (b) { return b !== fasit; });
      return bland(andre).slice(0, antall);
    }

    function sporsmalstale() {
      var v = VERDENER[okt.verden];
      if (okt.type === 'finn') {
        return [v.oppdrag + '…', 280, navnPaTegn(okt.verden, okt.fasit) + '.'];
      }
      if (okt.type === 'navn') {
        /* Første rute knytter oppgaven til navnet hans; resten holder tempoet
         * nede uten å gjenta hele setningen hver gang. */
        return okt.indeks === 0
          ? ['Navnet ditt begynner med…', 320, bokstavnavnFor(okt.fasit) + '.']
          : ['Så kommer…', 300, bokstavnavnFor(okt.fasit) + '.'];
      }
      if (okt.type === 'tell') {
        var o = ordFor(okt.verden, okt.fasit);
        return ['Hvor mange ' + o.ord + '?', 400, 'Trykk på hver enkelt og tell.'];
      }
      var oppslag = ordFor(okt.verden, okt.fasit);
      return [
        oppslag.ord + '.', 420,
        'Hvilken bokstav begynner ' + tilTale(oppslag.ord) + ' på?'
      ];
    }

    function visOppgave() {
      var v = VERDENER[okt.verden];
      okt.fasit = okt.ko[okt.indeks];
      okt.forsokPaDenne = 0;

      tegnPrikker();

      var mal = el('oppgave-mal');
      mal.className = 'oppdrag-mal oppdrag-mal--' +
        (okt.type === 'finn' ? 'bokstav' : okt.type === 'navn' ? 'navn'
          : okt.type === 'tell' ? 'tell' : 'ord');
      if (okt.type === 'tell') {
        el('oppgave-tekst').textContent = 'Hvor mange?';
        tegnTelleting();
      } else if (okt.type === 'finn' || okt.type === 'navn') {
        el('oppgave-tekst').textContent =
          okt.type === 'navn' ? 'Navnet ditt' : v.oppdrag;
        /* Bokstaven er skjult, ellers er oppgaven bare å finne to like.
         * Trykker han på merket, kommer den fram – hjelp når han trenger den. */
        okt.malVist = !!Lagring.innstilling('visMal');
        tegnMal();
      } else {
        var oppslag = ordFor(okt.verden, okt.fasit);
        el('oppgave-tekst').textContent = 'Hvilken bokstav begynner ordet på?';
        mal.innerHTML = '<span class="mal-ikon">' + oppslag.ikon + '</span>' +
                        '<span class="mal-ord">' + oppslag.ord + '</span>';
      }
      spillOm(mal, 'bytter', 460);

      var valgfelt = el('oppgave-valg');
      valgfelt.innerHTML = '';
      /* Har foreldrene valgt bare to bokstaver, finnes det ikke tre skilt. */
      var antallValg = Math.min(okt.antallValg, utvalg().length);
      var alternativer = bland([okt.fasit].concat(distraktorer(okt.fasit, antallValg - 1)));
      okt.visteValg = alternativer.length;
      alternativer.forEach(function (bokstav) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'skilt';
        b.textContent = bokstav;
        b.dataset.bokstav = bokstav;
        b.addEventListener('click', function () { svar(bokstav, b); });
        valgfelt.appendChild(b);
      });

      el('oppgave-videre').hidden = true;

      Tale.stopp();
      Tale.rekke(sporsmalstale());
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
      var oppslag = ordFor(okt.verden, okt.fasit);
      var antall = antallFor(okt.verden, okt.fasit);
      okt.talt = 0;
      tegnMengde(el('oppgave-mal'), oppslag.ikon, antall, 'oppdrag-mal oppdrag-mal--tell mengde');

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

    function tellTing(t) {
      if (t.classList.contains('talt')) {
        /* Allerede talt: si tallet den fikk, uten å telle den om igjen. */
        Tale.stopp();
        Tale.rekke([tellenavn(t.dataset.talltall) + '.']);
        return;
      }
      okt.talt += 1;
      t.classList.add('talt');
      t.dataset.talltall = String(okt.talt);
      spillOm(t, 'teller', 420);
      Lyd.klikk();
      Tale.stopp();

      var alle = antallFor(okt.verden, okt.fasit);
      if (okt.talt >= alle) {
        /* Det siste tallordet han sier *er* svaret. Uten den koblingen har han
         * bare ramset opp tallrekka mens han pekte. */
        Tale.rekke([tellenavn(okt.talt) + '.', 380,
                    'Det var ' + tellenavn(okt.talt) + ' ' +
                    ordFor(okt.verden, okt.fasit).ord + '.']);
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

    function visMal() {
      if (!okt || okt.type === 'forstelyd' || okt.type === 'tell') return false;
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
      if (knapp.disabled) return;

      if (bokstav === okt.fasit) { riktig(knapp); return; }

      /* Feil: skiltet vugger, tonen er lav og vennlig, og han prøver igjen. */
      okt.forsokPaDenne += 1;
      okt.paRad = 0;
      Lagring.registrerFeil(okt.fasit);
      knapp.classList.add('feil');
      spillOm(knapp, 'vugg', 500);
      knapp.disabled = true;
      Lyd.proveIgjen();

      if (okt.forsokPaDenne >= okt.oppsett.bomForHjelp) {
        hjelp();
      } else {
        Tale.stopp();
        Tale.rekke(['Prøv en gang til.', 300].concat(sporsmalstale()));
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
      riktigKnapp.classList.add('pekes');
      Tale.stopp();
      Tale.rekke(['Her er ' + navnPaTegn(okt.verden, okt.fasit) + '.', 300, 'Trykk på den.']);
    }

    function riktig(knapp) {
      var v = VERDENER[okt.verden];
      var forsteForsok = okt.forsokPaDenne === 0;

      lasAlle();
      knapp.classList.remove('pekes');
      knapp.classList.add('riktig');

      /* I «Navnet mitt» skal bokstaven falle på plass i navnet med én gang –
       * det er hele poenget med runden. */
      if (okt.type === 'navn') {
        okt.malVist = true;
        tegnMal();
        spillOm(el('oppgave-mal').querySelector('.navnrute.na'), 'lander', 520);
      }

      kjorTil(okt.verden, knapp);

      if (forsteForsok) {
        okt.riktigForste += 1;
        okt.paRad += 1;
        okt.bomPaRad = 0;
        var forMestret = Lagring.erMestret(okt.fasit);
        /* Antall skilt som faktisk sto på skjermen avgjør om treffet teller
         * mot mestring – med to er halvparten flaks. */
        Lagring.registrerRiktig(okt.fasit, okt.visteValg);
        var bleMestret = !forMestret && Lagring.erMestret(okt.fasit);
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
      var opp = !siste && okt.paRad >= okt.oppsett.opprykk &&
                okt.antallValg < okt.oppsett.maksValg;
      if (opp) {
        okt.antallValg += 1;
        okt.paRad = 0;
        /* Opprykket må overleve runden. Ble det nullstilt hver gang, ville
         * han aldri komme forbi to skilt, og hele vanskegraden vært bygget
         * uten at noen fikk se den. */
        Lagring.settAntallValg(okt.verden, okt.antallValg);
      }

      var ros = forsteForsok
        ? tilfeldig(v.ros) + ', ' + Lagring.navnFor(okt.verden) + '!'
        : 'Der ja! Det er ' + navnPaTegn(okt.verden, okt.fasit) + '.';

      Tale.stopp();
      Tale.rekke(opp ? [ros, 350, 'Nå prøver vi en vanskeligere en.'] : [ros]);

      var videre = el('oppgave-videre');
      videre.hidden = false;
      /* En treåring leser ikke «Videre». En pil i samme retning som bilen
       * kjører forstår han med én gang. */
      el('videre-ikon').innerHTML = Figurer.ikon(siste ? 'malflagg' : 'pil');
      el('videre-tekst').textContent = siste ? 'Se hvordan det gikk' : 'Videre';
      videre.setAttribute('aria-label', el('videre-tekst').textContent);
      videre.focus();
    }

    function videre() {
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

      /* Gikk det tungt to runder på rad, går vi ned et hakk igjen. «Navnet
       * mitt» holdes utenfor: den runden er like lang som navnet og sier
       * ingenting om hvor vanskelig bokstavene er. */
      if (okt.type !== 'navn') {
        Lagring.registrerRunde(okt.verden, okt.riktigForste, okt.oppsett.antall);
      }

      /* Navnet skrevet som et navn: «SOFIA» sendt til talesyntesen blir
       * stavet bokstav for bokstav, «Sofia» blir lest som navnet hans. */
      var navnet = okt.type === 'navn'
        ? okt.ko[0] + okt.ko.slice(1).join('').toLowerCase()
        : '';

      el('oppsum-flagg').textContent = okt.verden === 'oy' ? '🏝️' : '🏁';
      el('oppsum-tittel').textContent = okt.type === 'navn'
        ? navnet + '!'
        : tilfeldig(VERDENER[okt.verden].ros) + '!';

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
      /* I «Navnet mitt» er rekkefølgen hele poenget – der skal navnet stå
       * som et navn, ikke sortert alfabetisk slik de andre rundene gjør. */
      brikker.classList.toggle('oppsum-brikker--navn', okt.type === 'navn');
      var funnet = okt.type === 'navn'
        ? okt.ko.slice()
        : Object.keys(okt.telling).sort();
      funnet.forEach(function (b, n) {
        var brikke = document.createElement('span');
        brikke.className = 'oppsum-brikke';
        brikke.style.animationDelay = (okt.oppsett.antall * 130 + 160 + n * 90) + 'ms';
        brikke.innerHTML = okt.type === 'navn'
          ? '<b>' + b + '</b>'
          : '<b>' + b + '</b><i>' + ordFor(okt.verden, b).ikon + '</i>';
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
      if (okt.type === 'navn') {
        tekst = 'Bygde ' + navnet + '. ' + tekst;
      } else if (funnet.length) {
        tekst += ' Fant ' + listetekst(funnet) + ' selv.';
      }
      if (okt.nyeMestrede.length) {
        tekst += ' ' + listetekst(okt.nyeMestrede) + ' er nå truffet tre ulike dager.';
      }
      el('oppsum-tekst').textContent = tekst;

      Lyd.ferdig();
      var hilsen = okt.type === 'navn'
        ? navnet + '. Det er navnet ditt!'
        : okt.nyeMestrede.length
          ? 'Se her! ' + navnPaTegn(okt.verden, okt.nyeMestrede[0]) + ' kan du nå.'
          : 'Bra jobbet, ' + Lagring.navnFor(okt.verden) + '!';
      window.setTimeout(function () { Tale.rekke([hilsen]); }, 700);
      /* Figuren hopper av glede – det er den delen han skjønner uten ord. */
      window.setTimeout(function () { hopp(); }, 400);

      Spill.settOppsummering(okt.type);
    }

    return {
      /* «Navnet mitt» sender med bokstavene i navnet som kø; runden er da
       * nøyaktig så lang som navnet, og har en slutt barnet skjønner. */
      start: function (type, verdenId, navnkoe) {
        var opps = oppsett();
        var ko;
        if (type === 'navn') {
          ko = (navnkoe || []).slice();
          if (!ko.length) return false;
          opps = {
            antall: ko.length,
            maksValg: opps.maksValg,
            bomForHjelp: opps.bomForHjelp,
            opprykk: opps.opprykk
          };
        } else {
          ko = byggKo(verdenId, opps.antall);
        }

        okt = {
          type: type,
          verden: verdenId,
          oppsett: opps,
          ko: ko,
          indeks: 0,
          /* Der han slapp forrige runde, klippet mot taket på dagens nivå –
           * settes nivået ned i foreldremenyen, skal ikke et gammelt opprykk
           * overstyre det. */
          antallValg: Math.min(Lagring.antallValgFor(verdenId), opps.maksValg),
          visteValg: 2,
          paRad: 0,
          bomPaRad: 0,
          forsokPaDenne: 0,
          riktigForste: 0,
          telling: {},
          nyeMestrede: []
        };

        Spill.visSkjerm('skjerm-oppgave');
        /* «Finn bokstaven» heter «Finn tallet» i Dinodalen. */
        var tittel = MODUSTITTEL[type] || 'Finn bokstaven';
        if (type === 'finn' && domeneFor(verdenId) === 'tall') tittel = 'Finn tallet';
        Spill.settTopp(tittel, true);
        stillFigurTilStart();
        Spill.settTastLytter(tastesvar);
        visOppgave();
        return true;
      },

      videre: videre,
      visMal: visMal,

      gjentaSporsmal: function () {
        if (!okt) return;
        Tale.stopp();
        Tale.rekke(sporsmalstale());
      },

      stopp: function () { Spill.settTastLytter(null); Tale.stopp(); }
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

    /* Løypa går gjennom hele tegnsettet, også de sjeldne bokstavene: her er
     * det ingen oppgave, bare en tur fra start til slutt. */
    function rekka() { return tegnFor(verdenId); }

    function si() {
      var b = rekka()[indeks];
      Tale.stopp();
      Tale.rekke(tegnrekke(verdenId, b, ordFor(verdenId, b)));
    }

    function settKnapp(ikon, tekst) {
      el('loype-videre-ikon').innerHTML = Figurer.ikon(ikon);
      el('loype-videre-tekst').textContent = tekst;
      el('loype-videre').setAttribute('aria-label', tekst);
    }

    function tegn() {
      var b = rekka()[indeks];
      var oppslag = ordFor(verdenId, b);
      var siste = indeks + 1 >= rekka().length;

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
      settKnapp(siste ? 'malflagg' : 'pil', siste ? 'Se hvor langt du kom' : 'Neste');

      /* Figuren står der i alfabetet han er – framdriften synes i scenen. */
      kjorTil(verdenId, indeks / Math.max(1, rekka().length - 1));
      si();
      el('loype-videre').focus();
    }

    function avslutt() {
      ferdig = true;
      el('loype-bokstav').textContent = domeneFor(verdenId) === 'tall' ? '1–10' : 'A–Å';
      el('loype-bokstav').classList.add('smal');
      el('loype-ikon').className = 'ordkort-ikon';
      el('loype-ikon').textContent = VERDENER[verdenId].ikon;
      el('loype-ord').textContent = domeneFor(verdenId) === 'tall'
        ? 'Alle tallene!' : 'Hele alfabetet!';
      el('loype-teller').textContent = rekka().length + ' av ' + rekka().length;
      spillOm(el('loype-kort'), 'bytter', 460);
      settKnapp('malflagg', 'Tilbake');
      Spill.settTastLytter(null);
      Lyd.ferdig();
      hopp();
      Tale.stopp();
      Tale.rekke([domeneFor(verdenId) === 'tall'
        ? 'Der var alle tallene! Fra én til ti.'
        : 'Der var hele alfabetet! Fra a til å.']);
    }

    function videre() {
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
        tegn();
      },
      videre: videre,
      gjenta: function () { if (!ferdig) si(); },
      stopp: function () { Spill.settTastLytter(null); Tale.stopp(); }
    };
  })();

  return {
    Utforsk: Utforsk,
    Oppgave: Oppgave,
    Loype: Loype,
    kjorTil: kjorTil,
    hopp: hopp
  };
})();
