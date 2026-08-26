/* Bokstavløpet – de tre modusene
 *
 * Alle tre deler den samme regelen: ingenting skjer av seg selv. Barnet
 * trykker, spillet svarer, og så står skjermen stille til neste trykk.
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

  /* Kjørelyden hører til verdenen. */
  function beveglyd(verdenId) {
    if (verdenId === 'oy') Lyd.bolge(); else Lyd.motor();
  }

  /* Flytter figuren vannrett til midten av et element, innenfor banen. */
  function flyttFigurTil(baneEl, figurEl, malEl) {
    var bane = baneEl.getBoundingClientRect();
    var figur = figurEl.getBoundingClientRect();
    var mal = malEl.getBoundingClientRect();
    var x = (mal.left + mal.width / 2) - bane.left - figur.width / 2;
    var maks = bane.width - figur.width - 8;
    figurEl.style.transform = 'translateX(' + Math.max(8, Math.min(maks, x)) + 'px)';
  }

  function flyttFigurTilAndel(baneEl, figurEl, andel) {
    var bane = baneEl.getBoundingClientRect();
    var figur = figurEl.getBoundingClientRect();
    var maks = Math.max(8, bane.width - figur.width - 8);
    figurEl.style.transform = 'translateX(' + (8 + andel * (maks - 8)) + 'px)';
  }

  function slippStjerne(vertEl) {
    var s = document.createElement('span');
    s.className = 'stjerne-lander';
    s.textContent = '★';
    s.style.left = '50%';
    s.style.top = '8px';
    vertEl.appendChild(s);
    window.setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 1400);
  }

  /* ================= 1. Utforsk ================= */

  var Utforsk = (function () {
    var verdenId = null;

    function tegn() {
      var rutenett = el('utforsk-rutenett');
      rutenett.innerHTML = '';
      Lagring.aktiveBokstaver().forEach(function (bokstav) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bokstav' + (Lagring.erMestret(bokstav) ? ' mestret' : '');
        b.textContent = bokstav;
        b.dataset.bokstav = bokstav;
        b.addEventListener('click', function () { velg(bokstav); });
        rutenett.appendChild(b);
      });

      el('utforsk-figur').innerHTML = Spill.figurMerke(verdenId);
      el('utforsk-figur').style.transform = 'translateX(8px)';
      el('utforsk-bokstav').textContent = '?';
      el('utforsk-ikon').textContent = VERDENER[verdenId].ikon;
      el('utforsk-ord').textContent = 'Trykk på en bokstav';
    }

    function velg(bokstav) {
      var aktive = Lagring.aktiveBokstaver();
      if (aktive.indexOf(bokstav) === -1) return;

      var oppslag = ordFor(verdenId, bokstav);

      var knapper = el('utforsk-rutenett').querySelectorAll('.bokstav');
      for (var i = 0; i < knapper.length; i++) {
        knapper[i].classList.toggle('aktiv', knapper[i].dataset.bokstav === bokstav);
      }

      el('utforsk-bokstav').textContent = bokstav;
      el('utforsk-ikon').textContent = oppslag.ikon;
      el('utforsk-ord').textContent = oppslag.ord;

      var andel = aktive.length > 1 ? aktive.indexOf(bokstav) / (aktive.length - 1) : 0;
      flyttFigurTilAndel(el('utforsk-bane'), el('utforsk-figur'), andel);
      beveglyd(verdenId);

      Tale.stopp();
      Tale.rekke([bokstav, 250, lydFor(verdenId, bokstav), 250, 'som i ' + oppslag.ord]);
    }

    return {
      start: function (id) {
        verdenId = id;
        Spill.visSkjerm('skjerm-utforsk');
        Spill.settTopp(VERDENER[id].samling === 'Skattekartet' ? 'Skattekartet' : 'Garasjen', true);
        tegn();
        Spill.settTastLytter(velg);
      },
      stopp: function () { Spill.settTastLytter(null); }
    };
  })();

  /* ================= 2. og 3. Oppgavemodusene ================= */

  var OPPGAVER_I_RUNDEN = 8;

  var Oppgave = (function () {
    var okt = null;

    /* Bygger køen: bokstavene han kan minst kommer først i utvalget. */
    function byggKo() {
      var aktive = Lagring.aktiveBokstaver();
      var sortert = aktive.slice().sort(function (a, b) {
        var da = Lagring.dagerFor(a), db = Lagring.dagerFor(b);
        if (da !== db) return da - db;
        return Lagring.riktigeFor(a) - Lagring.riktigeFor(b);
      });
      /* Trekk fra den halvdelen han trenger mest, men ikke bare de aller
       * vanskeligste – noen kjente bokstaver innimellom gir hvilepunkter. */
      var trengsMest = sortert.slice(0, Math.max(4, Math.ceil(sortert.length / 2)));
      var resten = sortert.slice(trengsMest.length);

      var ko = [];
      var pott = bland(trengsMest);
      var lettePott = bland(resten);
      while (ko.length < OPPGAVER_I_RUNDEN) {
        if (!pott.length) pott = bland(trengsMest);
        ko.push(pott.pop());
        if (ko.length < OPPGAVER_I_RUNDEN && lettePott.length && ko.length % 3 === 2) {
          ko.push(lettePott.pop());
        }
      }
      return ko.slice(0, OPPGAVER_I_RUNDEN);
    }

    function tegnPrikker() {
      var felt = el('oppgave-prikker');
      felt.innerHTML = '';
      for (var i = 0; i < OPPGAVER_I_RUNDEN; i++) {
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
      var bokstav = okt.fasit;
      if (okt.type === 'finn') {
        return [v.oppdrag, 200, bokstav];
      }
      var oppslag = ordFor(okt.verden, bokstav);
      return [oppslag.ord, 350, 'Hvilken bokstav begynner ' + oppslag.ord.toLowerCase() + ' på?'];
    }

    function visOppgave() {
      var v = VERDENER[okt.verden];
      okt.fasit = okt.ko[okt.indeks];
      okt.forsokPaDenne = 0;

      tegnPrikker();

      var mal = el('oppgave-mal');
      if (okt.type === 'finn') {
        el('oppgave-tekst').textContent = v.oppdrag;
        mal.textContent = Lagring.innstilling('visMal') ? okt.fasit : '?';
      } else {
        var oppslag = ordFor(okt.verden, okt.fasit);
        el('oppgave-tekst').textContent = 'Hvilken bokstav begynner ordet på?';
        mal.innerHTML = '<span class="mal-ikon">' + oppslag.ikon + '</span>' +
                        '<span class="mal-ord">' + oppslag.ord + '</span>';
      }

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

      el('oppgave-figur').style.transform = 'translateX(8px)';
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

      if (bokstav === okt.fasit) {
        riktig(knapp);
        return;
      }

      /* Feil: skiltet vugger, tonen er lav og vennlig, og han prøver igjen. */
      okt.forsokPaDenne += 1;
      okt.paRad = 0;
      Lagring.registrerFeil(okt.fasit);
      knapp.classList.add('feil', 'vugg');
      knapp.disabled = true;
      Lyd.proveIgjen();
      window.setTimeout(function () { knapp.classList.remove('vugg'); }, 450);

      if (okt.forsokPaDenne >= 2) {
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
      var andre = el('oppgave-valg').querySelectorAll('.skilt');
      for (var i = 0; i < andre.length; i++) {
        if (andre[i] !== riktigKnapp) { andre[i].disabled = true; andre[i].classList.add('feil'); }
      }
      riktigKnapp.classList.add('pekes');
      Tale.stopp();
      Tale.rekke(['Her er ' + okt.fasit + '. Trykk på den.']);
    }

    function riktig(knapp) {
      var v = VERDENER[okt.verden];
      var forsteForsok = okt.forsokPaDenne === 0;

      lasAlle();
      knapp.classList.remove('pekes');
      knapp.classList.add('riktig');

      flyttFigurTil(el('oppgave-bane'), el('oppgave-figur'), knapp);
      beveglyd(okt.verden);

      if (forsteForsok) {
        okt.riktigForste += 1;
        okt.paRad += 1;
        okt.bomPaRad = 0;
        var forMestret = Lagring.erMestret(okt.fasit);
        Lagring.registrerRiktig(okt.fasit);
        if (!forMestret && Lagring.erMestret(okt.fasit)) okt.nyeMestrede.push(okt.fasit);
        okt.telling[okt.fasit] = (okt.telling[okt.fasit] || 0) + 1;
        window.setTimeout(function () { Lyd.stjerne(); slippStjerne(knapp); }, 380);
      }

      var opp = okt.paRad >= 5 && okt.antallValg < 4;
      if (opp) { okt.antallValg += 1; okt.paRad = 0; }

      var ros = forsteForsok
        ? tilfeldig(v.ros) + ', ' + Lagring.navnFor(okt.verden) + '!'
        : 'Der ja! Det er ' + okt.fasit + '.';

      Tale.stopp();
      Tale.rekke(opp ? [ros, 350, 'Nå prøver vi en vanskeligere en.'] : [ros]);

      el('oppgave-videre').hidden = false;
      el('oppgave-videre').textContent =
        okt.indeks + 1 >= OPPGAVER_I_RUNDEN ? 'Se hvordan det gikk' : 'Videre';
      el('oppgave-videre').focus();
    }

    function videre() {
      okt.indeks += 1;
      if (okt.indeks >= OPPGAVER_I_RUNDEN) { avslutt(); return; }
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

      var liste = el('oppsum-liste');
      liste.innerHTML = '';

      function linje(html, klasse) {
        var li = document.createElement('li');
        if (klasse) li.className = klasse;
        li.innerHTML = html;
        liste.appendChild(li);
      }

      linje('Du klarte <b>' + okt.riktigForste + ' av ' + OPPGAVER_I_RUNDEN + '</b> med én gang');

      /* Konkret er bedre enn et tall: si hvilke bokstaver han fant selv. */
      var funnet = Object.keys(okt.telling).sort(function (a, b) {
        return okt.telling[b] - okt.telling[a];
      });
      funnet.filter(function (b) { return okt.telling[b] >= 2; }).forEach(function (b) {
        linje('Du fant <b>' + b + '</b> ' + tallord(okt.telling[b]) + ' ganger');
      });
      var enkle = funnet.filter(function (b) { return okt.telling[b] === 1; }).slice(0, 5);
      if (enkle.length) {
        linje('Du fant ' + listetekst(enkle.map(function (b) { return '<b>' + b + '</b>'; })) +
              ' helt selv');
      }

      okt.nyeMestrede.forEach(function (b) {
        linje('<b>' + b + '</b> har du nå klart tre ulike dager – den er din!', 'ny-mestret');
      });

      Lyd.ferdig();
      var hilsen = okt.nyeMestrede.length
        ? 'Bra jobbet! ' + okt.nyeMestrede[0] + ' kan du nå.'
        : 'Bra jobbet, ' + Lagring.navnFor(okt.verden) + '!';
      window.setTimeout(function () { Tale.rekke([hilsen]); }, 900);

      Spill.settOppsummering(okt.type, okt.verden);
    }

    return {
      start: function (type, verdenId) {
        okt = {
          type: type,
          verden: verdenId,
          ko: byggKo(),
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
        Spill.settTopp(type === 'finn' ? 'Finn bokstaven' : 'Førstelyd', true);
        el('oppgave-figur').innerHTML = Spill.figurMerke(verdenId);
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
    OPPGAVER_I_RUNDEN: OPPGAVER_I_RUNDEN,
    bland: bland
  };
})();
