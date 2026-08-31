/* Oppdagerøya – navigasjon og oppsett
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
    'skjerm-loype': true,
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
    var medFigur = !!MED_FIGUR[id];
    el('figurbane').hidden = !medFigur;
    /* Skjermene uten figur på bakken skal ikke reservere plass til bakken
     * heller. Uten dette sto det over hundre piksler tomt nederst på
     * forsiden og verdensvelgeren – plass det tredje verdenskortet trengte. */
    document.body.classList.toggle('uten-bakke', !medFigur);
    /* Forsiden er ett bilde: havet dekker hele skjermen, og øya ligger midt
     * i det. Da slås himmel, landskap og bakke av. */
    document.body.classList.toggle('pa-havet', id === 'skjerm-start');
    visStemmeknapp();
  }

  function settTopp(tittel, visTilbake) {
    el('topp-tittel').textContent = tittel;
    el('tilbake').hidden = !visTilbake;
  }

  function settTastLytter(fn) { tastLytter = fn; }

  /* Telleren i toppen viser hvor mange bokstaver som er blitt hans.
   *
   * Nevneren er bokstavene som er i bruk nå, ikke alltid 29. Foreldremenyen
   * oppfordrer til å begrense utvalget – «velg gjerne bare bokstavene i navnet
   * hans» – og følger man det rådet, skal ikke målet være uoppnåelig i samme
   * øyeblikk. Fire av fire er en seier; fire av 29 ser ut som nesten ingenting. */
  function oppdaterTeller(medSmell) {
    var teller = el('stjerneteller');
    /* Telleren gjelder verdenen han står i. Tall og bokstaver samles hver for
     * seg – ti tall blandet inn blant bokstavene ville gjort begge tallene
     * meningsløse. */
    var antall = Lagring.mestrede(naVerden).length;
    el('teller-tall').textContent = antall;
    el('teller-av').textContent = '/' + Lagring.aktiveTegn(naVerden).length;
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
    tegnStartskjerm();
    oppdaterTeller(false);
    settTopp('Oppdagerøya', false);
    visSkjerm('skjerm-start');
  }

  /* Stedene på forsidekartet, i prosent av kartflaten. Tallene følger
   * tegningen i Figurer.kart(): banen ligger på sletta i vest, dinosauren
   * ved vulkanen i øst, og skipet ute på åpent hav – på sjøen, der et skip
   * hører hjemme. */
  var KARTSTEDER = {
    bane: { x: 37, y: 61 },
    dino: { x: 70, y: 33 },
    oy:   { x: 83.5, y: 78 }
  };

  /* Forsiden er et kart. Hvert sted er både en tegning å peke på og en
   * snarvei rett inn i verdenen. Under kartet står en håndfull bokstaver og
   * tall, så det er tydelig uten å lese hva spillet handler om. */
  function tegnStartskjerm() {
    var felt = el('start-kart');
    felt.innerHTML = Figurer.kart();
    Object.keys(VERDENER).forEach(function (id, i) {
      var v = VERDENER[id];
      var sted = KARTSTEDER[id] || { x: 50, y: 50 };
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kartsted kartsted--' + id;
      b.style.left = sted.x + '%';
      b.style.top = sted.y + '%';
      b.style.animationDelay = (240 + i * 120) + 'ms';
      b.setAttribute('aria-label', v.navn);
      b.innerHTML =
        '<span class="kartsted-figur">' + Figurer.figurFor(id) + '</span>' +
        '<span class="kartsted-navn">' + v.navn + '</span>';
      /* Samme handling som Start-knappen, pluss at vi hopper rett dit. Trykket
       * er den brukerhandlingen nettleseren krever før lyd kan spilles. */
      b.addEventListener('click', function () {
        Lyd.lasOpp();
        /* Språkpakken må også låses opp inne i et ekte trykk, ellers nekter
         * iOS å spille klippene senere når de starter av seg selv. */
        Lydbank.lasOpp();
        Lyd.klikk();
        velgVerden(id);
      });
      felt.appendChild(b);
    });

    /* Noen bokstaver og tall som smakebit. Faste, ikke tilfeldige – forsiden
     * skal se lik ut hver gang han kommer hit. */
    var brikker = el('start-brikker');
    brikker.innerHTML = '';
    ['A', 'B', 'C', '1', '2', '3'].forEach(function (tegn, i) {
      var s = document.createElement('span');
      s.className = 'startbrikke' + (/\d/.test(tegn) ? ' startbrikke--tall' : '');
      s.textContent = tegn;
      s.style.animationDelay = (420 + i * 55) + 'ms';
      brikker.appendChild(s);
    });
  }

  /* Kartet er det eneste stedet man velger verden. Det fantes en egen
   * «Hvor vil du leke?»-skjerm med tre kort, men den sa det samme som kartet
   * en gang til – og et barn som nettopp har trykket på dinosauren skjønner
   * ikke hvorfor han må velge den om igjen. Tilbakeknappen går derfor helt
   * hjem til øya. */
  function velgVerden(id) {
    naVerden = id;
    tilbakeHandling = visStart;
    settScene(id);
    if (Lagring.harNavn(id)) visMeny();
    else visNavn();
  }

  /* Første gang i en verden får barnet døpe figuren sin. Navnet brukes
   * gjennom hele spillet, og gjør figuren til hans egen. */
  function visNavn() {
    var v = VERDENER[naVerden];
    tilbakeHandling = visStart;
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
    Tale.rekke([Tale.velg('Hei, ' + valgt + '!', 'Hei!')]);
  }

  function visMeny() {
    Tale.stopp();
    settTastLytter(null);
    var v = VERDENER[naVerden];
    tilbakeHandling = visStart;
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

    /* Menyen slipper til én modus om gangen, i stigende vanskegrad. Åtte
     * fliser på én gang er en vegg av valg for en treåring.
     *
     * Låsingen går bare én vei: så snart en modus har vist seg, låses den
     * opp for godt. At noe han fant i går er borte i dag, kan han ikke lese
     * seg til forklaringen på – da er det bare vekk. */
    moduser().forEach(function (m) {
      /* En modus som ikke kan kjøres i det hele tatt – «Navnet mitt» uten et
       * navn – skal ikke stå der som en flis som ikke gjør noe. */
      if (m.mulig && !m.mulig()) return;
      if (m.apen()) Lagring.laasOpp(m.id);
      if (!Lagring.erLaastOpp(m.id) && !Lagring.innstilling('visAlleModuser')) return;
      flis(Figurer.ikon(m.ikon), m.navn, m.tekst, m.start);
    });

    var antall = Lagring.mestrede(naVerden).length;
    var ordet = domeneFor(naVerden) === 'tall' ? 'tall' : 'bokstaver';
    flis(Figurer.ikon('stjerne'), 'Samlingen din',
      antall + ' av ' + Lagring.aktiveTegn(naVerden).length + ' ' + ordet + ' er dine',
      function () { Lyd.klikk(); visSamling(); });

    /* Menyen var den eneste skjermen som ikke sa noe. For en som ikke leser,
     * er fire–seks tekstetiketter ingen hjelp; spørsmålet forteller ham i det
     * minste hva skjermen er til for. Å lese opp hver flis når han trykker
     * nytter ikke – modusen starter og stopper talen i samme øyeblikk. */
    Tale.rekke(['Hva vil du gjøre?']);
  }

  /* Modusene i den rekkefølgen han møter dem, med regelen for når hver av
   * dem slipper til. */
  function moduser() {
    return domeneFor(naVerden) === 'tall' ? tallmoduser() : bokstavmoduser();
  }

  /* Dinodalen. Samme maskineri som bokstavverdenene – utforsk, løype, finn –
   * pluss «Tell», som er den egentlige telleferdigheten. */
  function tallmoduser() {
    var v = VERDENER[naVerden];
    return [
      {
        id: 'reiret',
        ikon: 'reir',
        navn: v.utforsk,
        tekst: 'Trykk på et tall og se hvor mange det er',
        apen: function () { return true; },
        start: function () {
          Lyd.klikk();
          tilbakeHandling = function () { Moduser.Utforsk.stopp(); visMeny(); };
          Moduser.Utforsk.start(naVerden);
        }
      },
      {
        id: 'tallrekka',
        ikon: 'loype',
        navn: 'Tallrekka',
        tekst: 'Fra 1 til 10, ett trykk om gangen',
        apen: function () { return true; },
        start: function () {
          Lyd.klikk();
          tilbakeHandling = function () { Moduser.Loype.stopp(); visMeny(); };
          Moduser.Loype.start(naVerden, function () {
            Moduser.Loype.stopp();
            visMeny();
          });
        }
      },
      {
        id: 'tell',
        ikon: 'tell',
        navn: 'Tell',
        tekst: 'Trykk på hver ting og tell dem, og velg tallet',
        apen: function () { return true; },
        start: function () { Lyd.klikk(); startOppgave('tell'); }
      },
      {
        id: 'finntall',
        ikon: 'finn',
        navn: 'Finn tallet',
        tekst: 'Hør tallet, og velg riktig skilt',
        /* Å kjenne igjen tallsymbolet er vanskeligere enn å telle ting, så
         * den kommer når han har talt seg gjennom noen runder. */
        apen: function () { return Lagring.mestrede('dino').length >= 3; },
        start: function () { Lyd.klikk(); startOppgave('finn'); }
      }
    ];
  }

  function bokstavmoduser() {
    var v = VERDENER[naVerden];
    return [
      {
        id: 'utforsk',
        ikon: naVerden === 'oy' ? 'kart' : 'garasje',
        navn: v.utforsk,
        tekst: 'Trykk på en bokstav og hør den',
        apen: function () { return true; },
        start: function () {
          Lyd.klikk();
          tilbakeHandling = function () { Moduser.Utforsk.stopp(); visMeny(); };
          Moduser.Utforsk.start(naVerden);
        }
      },
      {
        id: 'loype',
        ikon: 'loype',
        navn: 'Alfabetløypa',
        tekst: 'Hele alfabetet, ett trykk om gangen',
        apen: function () { return true; },
        start: function () {
          Lyd.klikk();
          tilbakeHandling = function () { Moduser.Loype.stopp(); visMeny(); };
          Moduser.Loype.start(naVerden, function () {
            Moduser.Loype.stopp();
            visMeny();
          });
        }
      },
      {
        id: 'navn',
        ikon: 'navn',
        navn: 'Navnet mitt',
        tekst: 'Bygg navnet ditt, bokstav for bokstav',
        /* Uten et navn i foreldremenyen finnes det ingenting å bygge. */
        mulig: function () { return navnBokstaver(Lagring.barnenavn()).length > 0; },
        apen: function () { return true; },
        start: function () { Lyd.klikk(); startOppgave('navn'); }
      },
      {
        id: 'finn',
        ikon: 'finn',
        navn: 'Finn bokstaven',
        tekst: 'Hør bokstaven, og velg riktig skilt',
        apen: function () { return true; },
        start: function () { Lyd.klikk(); startOppgave('finn'); }
      },
      {
        id: 'forstelyd',
        ikon: 'lyd',
        navn: 'Første lyd',
        tekst: 'Hvilken bokstav begynner ordet på? <em>Vanskeligst — kommer ofte først rundt fire år.</em>',
        /* Lydanalyse krever at bokstavene sitter først. */
        apen: function () { return Lagring.mestrede().length >= 8; },
        start: function () { Lyd.klikk(); startOppgave('forstelyd'); }
      }
    ];
  }

  function startOppgave(type) {
    var navnkoe = type === 'navn' ? navnBokstaver(Lagring.barnenavn()) : null;
    /* Er navnet tatt bort igjen i foreldremenyen, finnes det ingen runde å
     * starte. Da blir vi stående i menyen framfor å vise en tom skjerm. */
    if (type === 'navn' && !navnkoe.length) { visMeny(); return; }
    sisteModus = type;
    tilbakeHandling = function () { Moduser.Oppgave.stopp(); visMeny(); };
    Moduser.Oppgave.start(type, naVerden, navnkoe);
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

    var mestrede = Lagring.mestrede(naVerden);
    /* Veggen viser bokstavene som er i bruk nå. Er utvalget begrenset til
     * fem, er det de fem som er målet – ikke 29 ruter der 24 aldri kan
     * fylles. */
    var aktive = Lagring.aktiveTegn(naVerden);
    var ordet = domeneFor(naVerden) === 'tall' ? 'tall' : 'bokstaver';
    el('samling-tittel').textContent = v.samling;
    el('samling-undertekst').textContent = mestrede.length === 0
      ? 'Her samler du ' + (ordet === 'tall' ? 'tallene' : 'bokstavene') + ' du klarer.'
      : 'Du har ' + mestrede.length + ' av ' + aktive.length + ' ' + ordet + '.';

    var felt = el('samling-rutenett');
    felt.innerHTML = '';
    aktive.forEach(function (bokstav, i) {
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
      fyll.style.width = (mestrede.length / aktive.length * 100) + '%';
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
    el('inn-alle-moduser').checked = Lagring.innstilling('visAlleModuser');
    el('inn-bokstavlyd').checked = Lagring.innstilling('bokstavlyd');
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

    el('inn-barnenavn').value = Lagring.barnenavn();
    visBarnenavn();

    el('versjon').textContent = 'Versjon ' + SPILLVERSJON;

    el('inn-navn-dino').value = Lagring.harNavn('dino') ? Lagring.navnFor('dino') : '';
    el('inn-navn-dino').placeholder = VERDENER.dino.standardnavn;

    el('inn-navn-bane').value = Lagring.harNavn('bane') ? Lagring.navnFor('bane') : '';
    el('inn-navn-bane').placeholder = VERDENER.bane.standardnavn;
    el('inn-navn-oy').value = Lagring.harNavn('oy') ? Lagring.navnFor('oy') : '';
    el('inn-navn-oy').placeholder = VERDENER.oy.standardnavn;

    el('inn-lydbank').checked = Lagring.innstilling('lydbank') !== false;

    tegnNiva();
    tegnStemmevalg();
    tegnLydbank();
    tegnBokstavvelger();
    tegnStatus();
  }

  function tegnNiva() {
    var na = Lagring.innstilling('niva') === 'storre' ? 'storre' : 'liten';
    var knapper = alle('inn-niva', 'button');
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

  /* iPad melder seg som Mac i nyere iOS, så berøringspunkter må med. */
  function erIOS() {
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return /Mac/.test(navigator.platform || '') && navigator.maxTouchPoints > 1;
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

    /* Å vise hva nettleseren faktisk tilbyr gjør det mulig å se forskjell på
     * «stemmene har ikke kommet ennå» og «nettleseren gir oss dem ikke». */
    el('stemme-tall').textContent = alle.length
      ? 'Nettleseren tilbyr ' + alle.length + (alle.length === 1 ? ' stemme, ' : ' stemmer, ') +
        (norske.length === 0 ? 'ingen norske'
          : norske.length === 1 ? 'én norsk' : norske.length + ' norske')
      : 'Nettleseren har ikke meldt om noen stemmer ennå';
    el('ios-merknad').hidden = !erIOS();

    visIBruk();
  }

  /* ---------- språkpakken ----------
   *
   * Her ligger svaret på iPhone-problemet: Apple slipper ikke de nedlastede
   * stemmene til på nettsider, så i stedet for å be nettleseren snakke
   * spiller spillet ferdige klipp som følger med. */

  function tegnLydbank() {
    /* Nevneren er replikkene *denne* familien kan møte, med navnene de har
     * valgt. Har de skrevet inn et eget navn på figuren, finnes det ikke
     * klipp for rosen – og da skal ikke tallet late som om alt er dekket. */
    var liste = Replikker.alle({
      bane: Lagring.harNavn('bane') ? Lagring.navnFor('bane') : '',
      oy: Lagring.harNavn('oy') ? Lagring.navnFor('oy') : '',
      dino: Lagring.harNavn('dino') ? Lagring.navnFor('dino') : '',
      barn: Lagring.barnenavn()
    });
    var har = liste.filter(function (r) { return Lydbank.har(r.tekst); }).length;

    var felt = el('lydbank-status');
    if (!har) {
      felt.className = 'ibruk ibruk--advarsel';
      felt.textContent = 'Språkpakken mangler — spillet bruker talesyntesen.';
      return;
    }
    felt.className = 'ibruk';
    felt.textContent = har + ' av ' + liste.length + ' replikker har lydklipp.';
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

  /* Viser hvilke bokstaver spillet faktisk kommer til å bruke, så den voksne
   * ser resultatet med én gang: «Ida Marie» blir I·D·A. */
  function visBarnenavn() {
    var bokstaver = navnBokstaver(el('inn-barnenavn').value);
    var linje = el('barnenavn-vis');
    if (!el('inn-barnenavn').value.trim()) {
      linje.textContent = '';
    } else if (!bokstaver.length) {
      linje.textContent = 'Fant ingen bokstaver spillet kjenner igjen her.';
    } else {
      linje.textContent = 'Spiller med: ' + bokstaver.join('·') +
        ' (' + bokstaver.length + ' oppgaver)';
    }
  }

  function lukkForeldre() {
    /* Tomt felt lagres også: da faller navnet tilbake til standardnavnet,
     * og barnet får døpe figuren på nytt neste gang han velger verdenen.
     * Plassholderen lover det, så feltet skal oppføre seg slik. */
    Lagring.settNavn('bane', el('inn-navn-bane').value.trim());
    Lagring.settNavn('oy', el('inn-navn-oy').value.trim());
    Lagring.settNavn('dino', el('inn-navn-dino').value.trim());
    /* Barnets navn lagres også når det tømmes – den voksne skal kunne ta
     * bort «Navnet mitt» igjen. */
    Lagring.settBarnenavn(el('inn-barnenavn').value);
    el('foreldre').hidden = true;
    /* Tilbake til et trygt sted – innstillingene kan ha endret bokstavutvalget. */
    if (naVerden) visMeny(); else visStart();
  }

  /* ---------- oppstart ---------- */

  /* Kobler en hendelse til et element. Mangler elementet, sier vi fra i
   * konsollen i stedet for å kaste – ellers stopper resten av oppkoblingen,
   * og da virker plutselig ingenting. */
  /* Søsteren til pa() for et sett elementer inne i et element. Uten den
   * kaster et oppslag med querySelectorAll hvis id-en mangler – akkurat det pa()
   * ble skrevet for å hindre, bare et annet sted i samme funksjon. */
  function alle(id, velger) {
    var e = document.getElementById(id);
    if (!e) { console.warn('Fant ikke element:', id); return []; }
    return e.querySelectorAll(velger);
  }

  function pa(id, hendelse, fn, valg) {
    var e = el(id);
    if (!e) {
      if (window.console) window.console.warn('Oppdagerøya: fant ikke #' + id);
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

    pa('loype-videre', 'click', function () {
      Lyd.klikk();
      Moduser.Loype.videre();
    });
    pa('loype-lytt', 'click', function () {
      Moduser.Loype.gjenta();
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
    pa('inn-alle-moduser', 'change', function () {
      Lagring.settInnstilling('visAlleModuser', this.checked);
    });
    pa('inn-bokstavlyd', 'change', function () {
      Lagring.settInnstilling('bokstavlyd', this.checked);
    });
    pa('inn-barnenavn', 'input', visBarnenavn);
    pa('inn-stemmevalg', 'change', function () {
      Tale.velgStemme(this.value || null);
      visIBruk();
      Tale.prov();
    });
    pa('inn-prov', 'click', function () { visIBruk(); Tale.prov(); });

    pa('inn-lydbank', 'change', function () {
      Lagring.settInnstilling('lydbank', this.checked);
      tegnLydbank();
    });

    pa('inn-let', 'click', function () {
      Tale.letEtterStemmer();
      tegnStemmevalg();
    });

    /* Stemmelista kommer ofte etter at panelet er åpnet – særlig på iOS.
     * Uten dette ble lista stående som den var da panelet ble tegnet. */
    Tale.naarStemmerEndres(function () {
      if (!el('foreldre').hidden) tegnStemmevalg();
    });

    pa('inn-fart', 'input', function () {
      Lagring.settInnstilling('talefart', parseFloat(this.value));
      visFart();
    });
    var nivaKnapper = alle('inn-niva', 'button');
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
    /* Nullstilling bak to sekunders hold. Før lå den bak window.confirm –
     * ett trykk til på en knapp barnet ikke kan lese, altså tre tilfeldige
     * trykk fra å slette ukevis med framgang. Å holde inne er derimot
     * ingenting en treåring gjør ved et uhell, og fyllingen viser den voksne
     * at noe faktisk skjer. */
    (function () {
      var knapp = el('inn-nullstill');
      if (!knapp) { console.warn('Fant ikke element: inn-nullstill'); return; }
      var tekst = el('nullstill-tekst');
      var timer = null;

      function slipp() {
        window.clearTimeout(timer);
        timer = null;
        knapp.classList.remove('holder');
        tekst.textContent = 'Nullstill all framgang';
      }

      knapp.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        knapp.classList.add('holder');
        tekst.textContent = 'Hold inne …';
        timer = window.setTimeout(function () {
          slipp();
          Lagring.nullstill();
          Tale.stopp();
          el('foreldre').hidden = true;
          settBevegelse();
          visStemmeknapp();
          visStart();
        }, 2000);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (h) {
        knapp.addEventListener(h, slipp);
      });
    })();

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

      /* I tallverdenen er det sifrene som gjelder – 0 står for 10, slik det
       * gjør på et tastatur der 10 ikke har egen tast. */
      var tegn = (e.key || '').toUpperCase();
      if (naVerden && domeneFor(naVerden) === 'tall') {
        if (tegn === '0') tegn = '10';
      }
      if (tastLytter && tegnFor(naVerden || 'bane').indexOf(tegn) !== -1) {
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
