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
    visStemmeknapp();
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

  /* Stemmeknappen i toppen. Den voksne skal kunne slå av robotstemmen med
   * ett trykk og lese selv i stedet. Lydeffektene – motor, stjerne, tut –
   * fortsetter, for de sier ingenting og er halve moroa. */
  function visStemmeknapp() {
    var pa = !!Lagring.innstilling('stemme');
    var knapp = el('stemmeknapp');
    el('stemmeikon').innerHTML = Figurer.ikon(pa ? 'stemmePa' : 'stemmeAv');
    knapp.classList.toggle('av', !pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
    knapp.title = pa ? 'Slå av stemmen – les selv i stedet' : 'Slå på stemmen';
    el('stemmetekst').textContent = knapp.title;
    /* «Hør igjen» har ingen jobb når stemmen er av. */
    var lytt = document.querySelectorAll('.lyttknapp');
    for (var i = 0; i < lytt.length; i++) {
      if (lytt[i].id !== 'inn-prov') lytt[i].classList.toggle('borte', !pa);
    }
  }

  function settStemme(pa) {
    Lagring.settInnstilling('stemme', pa);
    if (!pa) Tale.stopp();
    visStemmeknapp();
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
        '<span class="verdenkort-bilde">' +
          '<span class="verdenkort-scene" aria-hidden="true">' + Figurer.landskapFor(id) + '</span>' +
          Figurer.figurFor(id) +
        '</span>' +
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

    flis(Figurer.ikon(naVerden === 'oy' ? 'kart' : 'garasje'), v.utforsk,
      'Trykk på en bokstav og hør den', function () {
      Lyd.klikk();
      tilbakeHandling = function () { Moduser.Utforsk.stopp(); visMeny(); };
      Moduser.Utforsk.start(naVerden);
    });

    flis(Figurer.ikon('finn'), 'Finn bokstaven', 'Hør bokstaven, og velg riktig skilt', function () {
      Lyd.klikk();
      startOppgave('finn');
    });

    flis(Figurer.ikon('lyd'), 'Første lyd', 'Hvilken bokstav begynner ordet på? <em>Vanskeligst — kommer ofte først rundt fire år.</em>',
      function () {
        Lyd.klikk();
        startOppgave('forstelyd');
      });

    var antall = Lagring.mestrede().length;
    flis(Figurer.ikon('stjerne'), 'Samlingen din', antall + ' av ' + ALFABET.length + ' bokstaver er dine',
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
    el('panel-innhold').scrollTop = 0;

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
    tegnStemmevalg();
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

  /* Lister stemmene maskinen faktisk har. Norske først, resten under, slik at
   * den voksne kan høre seg fram til den minst robotaktige.
   *
   * Valget lagres på voiceURI, ikke på navn: en Mac har gjerne flere stemmer
   * som alle heter «Nora», og bare URI-en skiller dem fra hverandre. */
  function stemmeEtikett(v, erDuplikat) {
    var tekst = v.name;
    if (erDuplikat) {
      var uri = (v.voiceURI || '').toLowerCase();
      var art = uri.indexOf('premium') !== -1 ? 'premium'
              : uri.indexOf('enhanced') !== -1 ? 'forbedret'
              : uri.indexOf('compact') !== -1 ? 'enkel'
              : null;
      if (art) tekst += ' – ' + art;
    }
    return tekst + '  (' + v.lang + ')';
  }

  function tegnStemmevalg() {
    var velger = el('inn-stemmevalg');
    var norske = Tale.norskeStemmer();
    var alle = Tale.alleStemmer();
    var valgt = Lagring.innstilling('stemmenavn');

    /* Navn som går igjen må merkes, ellers ser lista ut som en feil. */
    var antallPerNavn = {};
    alle.forEach(function (v) {
      antallPerNavn[v.name] = (antallPerNavn[v.name] || 0) + 1;
    });

    velger.innerHTML = '';
    var auto = document.createElement('option');
    auto.value = '';
    auto.textContent = norske.length
      ? 'Velg beste norske automatisk (' + norske[0].name + ')'
      : 'Velg automatisk';
    velger.appendChild(auto);

    var norskeNokler = norske.map(Tale.nokkelFor);

    function gruppe(tittel, stemmer) {
      if (!stemmer.length) return;
      var g = document.createElement('optgroup');
      g.label = tittel;
      stemmer.forEach(function (v) {
        var o = document.createElement('option');
        o.value = Tale.nokkelFor(v);
        o.textContent = stemmeEtikett(v, antallPerNavn[v.name] > 1);
        g.appendChild(o);
      });
      velger.appendChild(g);
    }

    gruppe('Norske stemmer', norske);
    gruppe('Andre stemmer', alle.filter(function (v) {
      return norskeNokler.indexOf(Tale.nokkelFor(v)) === -1;
    }));

    velger.value = valgt || '';
    /* Den lagrede stemmen finnes ikke lenger – da skal det ikke se ut som
     * om den er i bruk. */
    if (velger.value !== (valgt || '')) velger.value = '';

    visIBruk();
  }

  /* Viser hvilken stemme som faktisk brukes akkurat nå. Uten dette er det
   * umulig å se om et valg har slått inn. */
  function visIBruk() {
    var felt = el('stemme-ibruk');
    var na = Tale.naStemme();
    if (!na) {
      felt.className = 'ibruk ibruk--advarsel';
      felt.textContent = Tale.stottes()
        ? 'Ingen stemme valgt — nettleseren bruker sin egen standard'
        : 'Nettleseren har ikke talesyntese';
      return;
    }
    felt.className = 'ibruk';
    felt.textContent = 'I bruk nå: ' + na.name + ' (' + na.lang + ')';
  }

  function visFart() {
    var v = parseFloat(el('inn-fart').value);
    el('ut-fart').textContent = v <= 0.8 ? 'rolig' : (v <= 0.95 ? 'vanlig' : 'rask');
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
    /* Samme høyttalerikon som i toppen, i stedet for en emoji som ser
     * forskjellig ut på hver maskin. */
    var lyttIkoner = document.querySelectorAll('.lytt-ikon');
    for (var i = 0; i < lyttIkoner.length; i++) {
      lyttIkoner[i].innerHTML = Figurer.ikon('stemmePa');
    }

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
    /* Trykk på merket avslører bokstaven, og sier den samtidig. */
    pa('oppgave-mal', 'click', function () {
      if (Moduser.Oppgave.visMal()) Moduser.Oppgave.gjentaSporsmal();
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

    /* Tannhjulet: ett trykk viser en liten bekreftelse, og trykk nummer to
     * åpner. To bevisste trykk holder barnet ute ved et uhell – og til
     * forskjell fra å holde inne utløser det ikke tekstmarkering og
     * hurtigmeny på telefon. */
    var bobleTimer = null;

    function visBoble(vis) {
      var boble = el('voksenboble');
      boble.hidden = !vis;
      window.clearTimeout(bobleTimer);
      if (vis) bobleTimer = window.setTimeout(function () { boble.hidden = true; }, 4000);
    }

    pa('tannhjul', 'click', function (e) {
      e.stopPropagation();
      visBoble(el('voksenboble').hidden);
    });

    pa('voksenboble-apne', 'click', function (e) {
      e.stopPropagation();
      visBoble(false);
      apneForeldre();
    });

    /* Trykk hvor som helst ellers lukker bekreftelsen igjen. */
    document.addEventListener('click', function () { visBoble(false); });

    pa('foreldre-lukk', 'click', lukkForeldre);
    pa('foreldre-lukk-x', 'click', lukkForeldre);

    pa('stemmeknapp', 'click', function () {
      Lyd.klikk();
      settStemme(!Lagring.innstilling('stemme'));
    });

    pa('inn-stemme', 'change', function () { settStemme(this.checked); });
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
    pa('inn-stemmevalg', 'change', function () {
      Tale.velgStemme(this.value || null);
      visIBruk();
      Tale.prov();
    });
    pa('inn-prov', 'click', function () { visIBruk(); Tale.prov(); });

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
      visStemmeknapp();
      visStart();
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () { Spill.start(); });
