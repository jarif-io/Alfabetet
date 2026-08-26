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

  /* Kort animasjon som kan spilles om igjen: klassen må fjernes først. */
  function spillOm(element, klasse, ms) {
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
      Lagring.aktiveBokstaver().forEach(function (bokstav, i) {
        var oppslag = ordFor(verdenId, bokstav);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bokstav' + (Lagring.erMestret(bokstav) ? ' mestret' : '');
        b.dataset.bokstav = bokstav;
        b.title = bokstav + ' som i ' + oppslag.ord;
        b.innerHTML = '<span class="bokstav-tegn">' + bokstav + '</span>' +
                      '<span class="bokstav-bilde" aria-hidden="true">' + oppslag.ikon + '</span>';
        b.setAttribute('aria-label', bokstav + ' som i ' + oppslag.ord);
        b.style.animation = 'trinn-inn 320ms cubic-bezier(.2,.8,.3,1) ' + (i * 12) + 'ms backwards';
        b.addEventListener('click', function () { velg(bokstav); });
        rutenett.appendChild(b);
      });

      el('utforsk-bokstav').textContent = '?';
      el('utforsk-ikon').textContent = VERDENER[verdenId].ikon;
      el('utforsk-ord').textContent = 'Trykk på en bokstav';
      el('utforsk-lytt').hidden = true;
      sisteBokstav = null;
    }

    function velg(bokstav) {
      var aktive = Lagring.aktiveBokstaver();
      if (aktive.indexOf(bokstav) === -1) return;

      var oppslag = ordFor(verdenId, bokstav);
      sisteBokstav = bokstav;

      var knapper = el('utforsk-rutenett').querySelectorAll('.bokstav');
      for (var i = 0; i < knapper.length; i++) {
        knapper[i].classList.toggle('aktiv', knapper[i].dataset.bokstav === bokstav);
      }

      el('utforsk-bokstav').textContent = bokstav;
      el('utforsk-ikon').textContent = oppslag.ikon;
      el('utforsk-ord').textContent = oppslag.ord;
      el('utforsk-lytt').hidden = false;
      spillOm(el('utforsk-bokstav'), 'bytter', 460);
      spillOm(el('utforsk-kort').querySelector('.ordkort-innhold'), 'bytter', 420);

      /* Figuren kjører dit bokstaven står i alfabetet. */
      var andel = aktive.length > 1 ? aktive.indexOf(bokstav) / (aktive.length - 1) : 0;
      kjorTil(verdenId, andel);

      si(bokstav, oppslag);
    }

    function si(bokstav, oppslag) {
      Tale.stopp();
      /* «L» … «L for Løve» – samme formel som i alfabetbøkene, og kort nok
       * til at en treåring holder følge. Bokstavnavnet skrives ut («ell»),
       * ellers leser talesyntesen det store tegnet som «stor L». */
      var navn = bokstavnavnFor(bokstav);
      Tale.rekke([
        navn + '.', 450,
        navn + ' for ' + oppslag.ord.toLowerCase() + '.'
      ]);
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

  var Oppgave = (function () {
    var okt = null;

    /* Bygger køen: bokstavene han kan minst kommer først i utvalget, men
     * noen kjente blandes inn som hvilepunkter. */
    function byggKo(antall) {
      var aktive = Lagring.aktiveBokstaver();
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
        ko.push(pott.pop());
        if (ko.length < antall && lettePott.length && ko.length % 3 === 2) {
          ko.push(lettePott.pop());
        }
      }
      return ko.slice(0, antall);
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
      var andre = Lagring.aktiveBokstaver().filter(function (b) { return b !== fasit; });
      return bland(andre).slice(0, antall);
    }

    function sporsmalstale() {
      var v = VERDENER[okt.verden];
      if (okt.type === 'finn') {
        return [v.oppdrag + '…', 280, bokstavnavnFor(okt.fasit) + '.'];
      }
      var oppslag = ordFor(okt.verden, okt.fasit);
      return [
        oppslag.ord + '.', 420,
        'Hvilken bokstav begynner ' + oppslag.ord.toLowerCase() + ' på?'
      ];
    }

    function visOppgave() {
      var v = VERDENER[okt.verden];
      okt.fasit = okt.ko[okt.indeks];
      okt.forsokPaDenne = 0;

      tegnPrikker();

      var mal = el('oppgave-mal');
      mal.className = 'oppdrag-mal ' +
        (okt.type === 'finn' ? 'oppdrag-mal--bokstav' : 'oppdrag-mal--ord');
      if (okt.type === 'finn') {
        el('oppgave-tekst').textContent = v.oppdrag;
        mal.textContent = Lagring.innstilling('visMal') ? okt.fasit : '?';
      } else {
        var oppslag = ordFor(okt.verden, okt.fasit);
        el('oppgave-tekst').textContent = 'Hvilken bokstav begynner ordet på?';
        mal.innerHTML = '<span class="mal-ikon">' + oppslag.ikon + '</span>' +
                        '<span class="mal-ord">' + oppslag.ord + '</span>';
      }
      spillOm(mal, 'bytter', 460);

      var valgfelt = el('oppgave-valg');
      valgfelt.innerHTML = '';
      var alternativer = bland([okt.fasit].concat(distraktorer(okt.fasit, okt.antallValg - 1)));
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
        if (alle[i] !== riktigKnapp) { alle[i].disabled = true; alle[i].classList.add('feil'); }
      }
      riktigKnapp.classList.add('pekes');
      Tale.stopp();
      Tale.rekke(['Her er ' + bokstavnavnFor(okt.fasit) + '.', 300, 'Trykk på den.']);
    }

    function riktig(knapp) {
      var v = VERDENER[okt.verden];
      var forsteForsok = okt.forsokPaDenne === 0;

      lasAlle();
      knapp.classList.remove('pekes');
      knapp.classList.add('riktig');

      kjorTil(okt.verden, knapp);

      if (forsteForsok) {
        okt.riktigForste += 1;
        okt.paRad += 1;
        okt.bomPaRad = 0;
        var forMestret = Lagring.erMestret(okt.fasit);
        Lagring.registrerRiktig(okt.fasit);
        var bleMestret = !forMestret && Lagring.erMestret(okt.fasit);
        if (bleMestret) okt.nyeMestrede.push(okt.fasit);
        okt.telling[okt.fasit] = (okt.telling[okt.fasit] || 0) + 1;

        window.setTimeout(function () {
          Lyd.stjerne();
          if (bleMestret) feirMestret(knapp); else stjerneLander(knapp);
        }, 380);
      }

      var opp = okt.paRad >= okt.oppsett.opprykk && okt.antallValg < okt.oppsett.maksValg;
      if (opp) { okt.antallValg += 1; okt.paRad = 0; }

      var ros = forsteForsok
        ? tilfeldig(v.ros) + ', ' + Lagring.navnFor(okt.verden) + '!'
        : 'Der ja! Det er ' + bokstavnavnFor(okt.fasit) + '.';

      Tale.stopp();
      Tale.rekke(opp ? [ros, 350, 'Nå prøver vi en vanskeligere en.'] : [ros]);

      var videre = el('oppgave-videre');
      videre.hidden = false;
      videre.querySelector('span').textContent =
        okt.indeks + 1 >= okt.oppsett.antall ? 'Se hvordan det gikk' : 'Videre';
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

      el('oppsum-flagg').textContent = okt.verden === 'oy' ? '🏝️' : '🏁';
      el('oppsum-tittel').textContent = tilfeldig(VERDENER[okt.verden].ros) + '!';

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
      var funnet = Object.keys(okt.telling).sort();
      funnet.forEach(function (b, n) {
        var brikke = document.createElement('span');
        brikke.className = 'oppsum-brikke';
        brikke.style.animationDelay = (okt.oppsett.antall * 130 + 160 + n * 90) + 'ms';
        brikke.innerHTML = '<b>' + b + '</b><i>' + ordFor(okt.verden, b).ikon + '</i>';
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
      if (funnet.length) {
        tekst += ' Fant ' + listetekst(funnet) + ' selv.';
      }
      if (okt.nyeMestrede.length) {
        tekst += ' ' + listetekst(okt.nyeMestrede) +
                 (okt.nyeMestrede.length === 1 ? ' er nå truffet' : ' er nå truffet') +
                 ' tre ulike dager.';
      }
      el('oppsum-tekst').textContent = tekst;

      Lyd.ferdig();
      var hilsen = okt.nyeMestrede.length
        ? 'Se her! ' + bokstavnavnFor(okt.nyeMestrede[0]) + ' kan du nå.'
        : 'Bra jobbet, ' + Lagring.navnFor(okt.verden) + '!';
      window.setTimeout(function () { Tale.rekke([hilsen]); }, 700);
      /* Figuren hopper av glede – det er den delen han skjønner uten ord. */
      window.setTimeout(function () { hopp(); }, 400);

      Spill.settOppsummering(okt.type);
    }

    return {
      start: function (type, verdenId) {
        var opps = oppsett();
        okt = {
          type: type,
          verden: verdenId,
          oppsett: opps,
          ko: byggKo(opps.antall),
          indeks: 0,
          antallValg: 2,
          paRad: 0,
          bomPaRad: 0,
          forsokPaDenne: 0,
          riktigForste: 0,
          telling: {},
          nyeMestrede: []
        };

        Spill.visSkjerm('skjerm-oppgave');
        Spill.settTopp(type === 'finn' ? 'Finn bokstaven' : 'Første lyd', true);
        stillFigurTilStart();
        Spill.settTastLytter(tastesvar);
        visOppgave();
      },

      videre: videre,

      gjentaSporsmal: function () {
        if (!okt) return;
        Tale.stopp();
        Tale.rekke(sporsmalstale());
      },

      stopp: function () { Spill.settTastLytter(null); Tale.stopp(); }
    };
  })();

  return {
    Utforsk: Utforsk,
    Oppgave: Oppgave,
    kjorTil: kjorTil,
    hopp: hopp
  };
})();
