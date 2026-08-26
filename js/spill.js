/* Bokstavløpet – navigasjon og oppsett
 *
 * Holder styr på hvilken skjerm som vises, hvilken verden som er valgt,
 * scenen bak, tastaturet og foreldremenyen.
 */

var Spill = (function () {

  function el(id) { return document.getElementById(id); }

  /* Skjermene der figuren skal stå på bakken. */
  var MED_FIGUR = {
    'skjerm-meny': true,
    'skjerm-utforsk': true,
    'skjerm-oppgave': true,
    'skjerm-oppsummering': true,
    'skjerm-samling': true
  };

  var naVerden = null;
  var tastLytter = null;
  var tilbakeHandling = null;
  var sisteModus = null;
  var sisteTast = 0;

  /* ---------- skjermbytte ---------- */

  function visSkjerm(id) {
    var alle = document.querySelectorAll('.skjerm');
    for (var i = 0; i < alle.length; i++) alle[i].hidden = (alle[i].id !== id);
    el('figurbane').hidden = !MED_FIGUR[id];
  }

  function settTopp(tittel, visTilbake) {
    el('topp-tittel').textContent = tittel;
    el('tilbake').hidden = !visTilbake;
  }

  function settTastLytter(fn) { tastLytter = fn; }

  /* Telleren i toppen viser hvor mange bokstaver som er blitt hans. */
  function oppdaterTeller(medSmell) {
    var teller = el('stjerneteller');
    var antall = Lagring.mestrede().length;
    el('teller-tall').textContent = antall;
    el('teller-av').textContent = '/' + ALFABET.length;
    if (medSmell) {
      teller.classList.remove('smell');
      void teller.offsetWidth;
      teller.classList.add('smell');
    }
  }

  /* Bytter himmel, landskap og bakke. */
  function settScene(verdenId) {
    if (verdenId) document.body.setAttribute('data-verden', verdenId);
    else document.body.removeAttribute('data-verden');
    el('scene-landskap').innerHTML = Figurer.landskapFor(verdenId || 'bane');
    el('figur').innerHTML = '<div class="figur-vipp">' +
      Figurer.figurFor(verdenId || 'bane') + '</div>';
    el('figur').style.transform = 'translateX(24px)';
  }

  function settBevegelse() {
    document.body.classList.toggle('bevegelse', !!Lagring.innstilling('bevegelse'));
  }

  /* ---------- skjermene ---------- */

  function visStart() {
    Tale.stopp();
    settTastLytter(null);
    tilbakeHandling = null;
    naVerden = null;
    settScene(null);
    el('start-figur').innerHTML = Figurer.bil();
    oppdaterTeller(false);
    settTopp('Bokstavløpet', false);
    visSkjerm('skjerm-start');
  }

  function visVerden() {
    Tale.stopp();
    settTastLytter(null);
    tilbakeHandling = visStart;
    naVerden = null;
    settScene(null);
    oppdaterTeller(false);
    settTopp('Bokstavløpet', true);
    visSkjerm('skjerm-verden');

    var felt = el('verden-valg');
    felt.innerHTML = '';
    ['bane', 'oy'].forEach(function (id) {
      var v = VERDENER[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'verdenkort verdenkort--' + id;
      b.innerHTML =
        '<span class="verdenkort-bilde">' + Figurer.figurFor(id) + '</span>' +
        '<span class="verdenkort-under">' +
          '<span class="verdenkort-navn">' + v.navn + '</span>' +
          '<span class="verdenkort-tekst">' +
            (Lagring.harNavn(id)
              ? 'Sammen med ' + Lagring.navnFor(id)
              : 'Bokstaver med ' + (id === 'bane' ? 'biler og motor' : 'skip og skatter')) +
          '</span>' +
        '</span>';
      b.addEventListener('click', function () { Lyd.klikk(); velgVerden(id); });
      felt.appendChild(b);
    });
  }

  function velgVerden(id) {
    naVerden = id;
    settScene(id);
    if (Lagring.harNavn(id)) visMeny();
    else visNavn();
  }

  /* Første gang i en verden får barnet døpe figuren sin. Navnet brukes
   * gjennom hele spillet, og gjør figuren til hans egen. */
  function visNavn() {
    var v = VERDENER[naVerden];
    tilbakeHandling = visVerden;
    settTopp(v.navn, true);
    visSkjerm('skjerm-navn');

    el('navn-figur').innerHTML = Figurer.figurFor(naVerden);
    el('navn-sporsmal').textContent = v.navnesporsmal;

    /* Barnet kan ikke skrive, så navnene ligger klare til å trykkes på.
     * Skrivefeltet er der for den voksne som vil finne på noe eget. */
    var forslag = el('navn-forslag');
    forslag.innerHTML = '';
    v.navneforslag.forEach(function (navn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'navnbrikke';
      b.textContent = navn;
      b.addEventListener('click', function () { lagreNavn(navn); });
      forslag.appendChild(b);
    });

    var felt = el('navn-felt');
    felt.value = '';
    felt.placeholder = v.standardnavn;

    Tale.stopp();
    Tale.rekke([v.navnesporsmal]);
  }

  function lagreNavn(navn) {
    var valgt = navn || VERDENER[naVerden].standardnavn;
    Lagring.settNavn(naVerden, valgt);
    Lyd.klikk();
    visMeny();
    Tale.stopp();
    Tale.rekke(['Hei, ' + valgt + '!']);
  }

  function visMeny() {
    Tale.stopp();
    settTastLytter(null);
    var v = VERDENER[naVerden];
    tilbakeHandling = visVerden;
    settTopp(v.navn + ' · ' + Lagring.navnFor(naVerden), true);
    visSkjerm('skjerm-meny');
    oppdaterTeller(false);

    var felt = el('meny-valg');
    felt.innerHTML = '';

    function flis(ikon, navn, tekst, nar) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'flis';
      b.innerHTML =
        '<span class="flis-stripe" aria-hidden="true"></span>' +
        '<span class="flis-merke" aria-hidden="true">' + ikon + '</span>' +
        '<span class="flis-navn">' + navn + '</span>' +
        '<span class="flis-tekst">' + tekst + '</span>';
      b.addEventListener('click', nar);
      felt.appendChild(b);
    }

    flis(v.utforskIkon, v.utforsk, 'Trykk på en bokstav og hør den', function () {
      Lyd.klikk();
      tilbakeHandling = function () { Moduser.Utforsk.stopp(); visMeny(); };
      Moduser.Utforsk.start(naVerden);
    });

    flis('🎯', 'Finn bokstaven', 'Hør bokstaven, og velg riktig skilt', function () {
      Lyd.klikk();
      startOppgave('finn');
    });

    flis('👂', 'Første lyd', 'Hvilken bokstav begynner ordet på? <em>Vanskeligst — kommer ofte først rundt fire år.</em>',
      function () {
        Lyd.klikk();
        startOppgave('forstelyd');
      });

    var antall = Lagring.mestrede().length;
    flis('⭐', 'Samlingen din', antall + ' av ' + ALFABET.length + ' bokstaver er dine',
      function () { Lyd.klikk(); visSamling(); });
  }

  function startOppgave(type) {
    sisteModus = type;
    tilbakeHandling = function () { Moduser.Oppgave.stopp(); visMeny(); };
    Moduser.Oppgave.start(type, naVerden);
  }

  function settOppsummering(type) {
    sisteModus = type;
    tilbakeHandling = visMeny;
    oppdaterTeller(false);
  }

  function visSamling() {
    Tale.stopp();
    settTastLytter(null);
    var v = VERDENER[naVerden];
    tilbakeHandling = visMeny;
    settTopp(v.navn + ' · ' + Lagring.navnFor(naVerden), true);
    visSkjerm('skjerm-samling');

    var mestrede = Lagring.mestrede();
    el('samling-tittel').textContent = v.samling;
    el('samling-undertekst').textContent = mestrede.length === 0
      ? 'Her samler du bokstavene du klarer.'
      : 'Du har ' + mestrede.length + ' av ' + ALFABET.length + ' bokstaver.';

    var felt = el('samling-rutenett');
    felt.innerHTML = '';
    ALFABET.forEach(function (bokstav, i) {
      var dager = Lagring.dagerFor(bokstav);
      var mestret = Lagring.erMestret(bokstav);
      var rute = document.createElement('div');
      rute.className = 'samling-rute' + (mestret ? ' tatt' : (dager > 0 ? ' pa-vei' : ''));
      rute.style.animationDelay = (i * 14) + 'ms';
      rute.innerHTML =
        '<div class="stor">' + bokstav + '</div>' +
        '<div class="liten">' +
          (mestret ? '★ din' : (dager > 0 ? dager + ' av 3 dager' : '&nbsp;')) +
        '</div>';
      felt.appendChild(rute);
    });

    /* Stolpen fylles etter at skjermen er tegnet, så bevegelsen synes. */
    var fyll = el('framdrift-fyll');
    fyll.style.width = '0';
    window.setTimeout(function () {
      fyll.style.width = (mestrede.length / ALFABET.length * 100) + '%';
    }, 60);
  }

  /* ---------- foreldremeny ---------- */

  function apneForeldre() {
    el('foreldre').hidden = false;

    el('inn-stemme').checked = Lagring.innstilling('stemme');
    el('inn-lyd').checked = Lagring.innstilling('lyd');
    el('inn-vis-mal').checked = Lagring.innstilling('visMal');
    el('inn-bevegelse').checked = Lagring.innstilling('bevegelse');
    el('inn-fart').value = Lagring.innstilling('talefart');
    visFart();

    var merknad = el('stemme-merknad');
    if (!Tale.stottes()) {
      merknad.hidden = false;
      merknad.className = 'merknad advarsel';
      merknad.textContent = 'Denne nettleseren har ikke talesyntese. Spillet fungerer, ' +
        'men uten stemme – da må en voksen si bokstavlyden ved siden av.';
    } else if (!Tale.harNorskStemme()) {
      merknad.hidden = false;
      merknad.className = 'merknad advarsel';
      merknad.textContent = 'Fant ingen norsk stemme på denne maskinen. Spillet leser ' +
        'med den stemmen som finnes, noe som kan høres rart ut. En norsk stemme kan ' +
        'legges til i innstillingene til operativsystemet (språk og tale).';
    } else {
      merknad.hidden = true;
    }

    el('inn-navn-bane').value = Lagring.harNavn('bane') ? Lagring.navnFor('bane') : '';
    el('inn-navn-bane').placeholder = VERDENER.bane.standardnavn;
    el('inn-navn-oy').value = Lagring.harNavn('oy') ? Lagring.navnFor('oy') : '';
    el('inn-navn-oy').placeholder = VERDENER.oy.standardnavn;

    tegnNiva();
    tegnBokstavvelger();
    tegnStatus();
  }

  function tegnNiva() {
    var na = Lagring.innstilling('niva') === 'storre' ? 'storre' : 'liten';
    var knapper = el('inn-niva').querySelectorAll('button');
    for (var i = 0; i < knapper.length; i++) {
      knapper[i].classList.toggle('valgt', knapper[i].dataset.niva === na);
    }
  }

  function visFart() {
    var v = parseFloat(el('inn-fart').value);
    el('ut-fart').textContent = v <= 0.65 ? 'veldig rolig' : (v <= 0.85 ? 'rolig' : 'vanlig');
  }

  function tegnBokstavvelger() {
    var valgt = Lagring.innstilling('bokstaver') || [];
    var felt = el('inn-bokstaver');
    felt.innerHTML = '';
    ALFABET.forEach(function (bokstav) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = bokstav;
      if (valgt.indexOf(bokstav) !== -1) b.classList.add('valgt');
      b.addEventListener('click', function () {
        var na = (Lagring.innstilling('bokstaver') || []).slice();
        var i = na.indexOf(bokstav);
        if (i === -1) na.push(bokstav); else na.splice(i, 1);
        Lagring.settInnstilling('bokstaver', na.length ? na : null);
        tegnBokstavvelger();
      });
      felt.appendChild(b);
    });
    /* Med bare én bokstav valgt finnes det ingen alternativer å velge mellom,
     * og spillet faller tilbake til alle. Det skal ikke skje i stillhet. */
    el('bokstav-merknad').hidden = valgt.length !== 1;
  }

  function tegnStatus() {
    var felt = el('foreldre-status');
    felt.innerHTML = '';
    ALFABET.forEach(function (bokstav) {
      var dager = Lagring.dagerFor(bokstav);
      var s = document.createElement('span');
      s.className = 'status-bokstav' +
        (Lagring.erMestret(bokstav) ? ' mestret' : (dager > 0 ? ' pa-vei' : ''));
      s.textContent = bokstav;
      s.title = bokstav + ': ' + Lagring.riktigeFor(bokstav) + ' riktige, ' +
                dager + ' ulike dager';
      felt.appendChild(s);
    });
  }

  function lukkForeldre() {
    var navnBane = el('inn-navn-bane').value.trim();
    var navnOy = el('inn-navn-oy').value.trim();
    if (navnBane) Lagring.settNavn('bane', navnBane);
    if (navnOy) Lagring.settNavn('oy', navnOy);
    el('foreldre').hidden = true;
    /* Tilbake til et trygt sted – innstillingene kan ha endret bokstavutvalget. */
    if (naVerden) visMeny(); else visVerden();
  }

  /* ---------- oppstart ---------- */

  /* Kobler en hendelse til et element. Mangler elementet, sier vi fra i
   * konsollen i stedet for å kaste – ellers stopper resten av oppkoblingen,
   * og da virker plutselig ingenting. */
  function pa(id, hendelse, fn, valg) {
    var e = el(id);
    if (!e) {
      if (window.console) window.console.warn('Bokstavløpet: fant ikke #' + id);
      return null;
    }
    e.addEventListener(hendelse, fn, valg);
    return e;
  }

  function koble() {
    /* Det første trykket låser opp lyden i nettleseren. */
    pa('knapp-start', 'click', function () {
      Lyd.lasOpp();
      Lyd.klikk();
      visVerden();
    });

    pa('tilbake', 'click', function () {
      Lyd.klikk();
      if (tilbakeHandling) tilbakeHandling();
    });

    pa('navn-ok', 'click', function () {
      lagreNavn(el('navn-felt').value.trim());
    });
    pa('navn-felt', 'keydown', function (e) {
      if (e.key === 'Enter') lagreNavn(el('navn-felt').value.trim());
    });

    pa('oppgave-videre', 'click', function () {
      Lyd.klikk();
      Moduser.Oppgave.videre();
    });
    pa('oppgave-lytt', 'click', function () {
      Moduser.Oppgave.gjentaSporsmal();
    });
    pa('utforsk-lytt', 'click', function () {
      Moduser.Utforsk.gjenta();
    });

    pa('oppsum-igjen', 'click', function () {
      Lyd.klikk();
      startOppgave(sisteModus || 'finn');
    });
    pa('oppsum-tilbake', 'click', function () {
      Lyd.klikk();
      visMeny();
    });

    /* Tannhjulet må holdes inne i to sekunder, så barnet ikke havner her. */
    var holdTimer = null;
    var tannhjul = el('tannhjul');
    function startHold(e) {
      e.preventDefault();
      tannhjul.classList.add('holdes');
      holdTimer = window.setTimeout(function () {
        tannhjul.classList.remove('holdes');
        apneForeldre();
      }, 2000);
    }
    function avbrytHold() {
      tannhjul.classList.remove('holdes');
      if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = null; }
    }
    tannhjul.addEventListener('mousedown', startHold);
    tannhjul.addEventListener('touchstart', startHold, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(function (h) {
      tannhjul.addEventListener(h, avbrytHold);
    });

    pa('foreldre-lukk', 'click', lukkForeldre);
    pa('foreldre-lukk-x', 'click', lukkForeldre);

    pa('inn-stemme', 'change', function () {
      Lagring.settInnstilling('stemme', this.checked);
      if (!this.checked) Tale.stopp();
    });
    pa('inn-lyd', 'change', function () {
      Lagring.settInnstilling('lyd', this.checked);
    });
    pa('inn-vis-mal', 'change', function () {
      Lagring.settInnstilling('visMal', this.checked);
    });
    pa('inn-bevegelse', 'change', function () {
      Lagring.settInnstilling('bevegelse', this.checked);
      settBevegelse();
    });
    pa('inn-fart', 'input', function () {
      Lagring.settInnstilling('talefart', parseFloat(this.value));
      visFart();
    });
    var nivaKnapper = el('inn-niva').querySelectorAll('button');
    for (var n = 0; n < nivaKnapper.length; n++) {
      nivaKnapper[n].addEventListener('click', function () {
        Lagring.settInnstilling('niva', this.dataset.niva);
        tegnNiva();
      });
    }

    /* Trykk på bilen eller skipet: den tuter og hopper. Ingen læring i det,
     * men det er det første en treåring prøver, og da skal noe skje. */
    pa('figur', 'click', function () { Moduser.hopp(); });

    pa('inn-alle', 'click', function () {
      Lagring.settInnstilling('bokstaver', null);
      tegnBokstavvelger();
    });
    pa('inn-nullstill', 'click', function () {
      if (window.confirm('Slette all framgang og starte helt på nytt?')) {
        Lagring.nullstill();
        el('foreldre').hidden = true;
        settBevegelse();
        visStart();
      }
    });

    /* Tastaturet: bokstavtastene velger bokstaven direkte. På en PC er det
     * den beste koblingen mellom tegnet på skjermen og fingeren hans. */
    document.addEventListener('keydown', function (e) {
      if (!el('foreldre').hidden) {
        if (e.key === 'Escape') lukkForeldre();
        return;
      }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        if (tilbakeHandling) { e.preventDefault(); tilbakeHandling(); }
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      /* En treåring holder tasten nede og hamrer på tastaturet. Uten dette
       * blir det hundre svar i sekundet og stemmer som snakker i munnen
       * på hverandre. */
      if (e.repeat) return;

      var tegn = (e.key || '').toUpperCase();
      if (tegn.length === 1 && ALFABET.indexOf(tegn) !== -1 && tastLytter) {
        e.preventDefault();
        var na = Date.now();
        if (na - sisteTast < 400) return;
        sisteTast = na;
        tastLytter(tegn);
      }
    });

    /* Figuren står på bakken – den må finne plassen sin på nytt ved omskalering. */
    window.addEventListener('resize', function () {
      el('figur').style.transform = 'translateX(24px)';
    });
  }

  return {
    visSkjerm: visSkjerm,
    settTopp: settTopp,
    settTastLytter: settTastLytter,
    settOppsummering: settOppsummering,
    oppdaterTeller: oppdaterTeller,
    start: function () {
      koble();
      settBevegelse();
      visStart();
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () { Spill.start(); });
