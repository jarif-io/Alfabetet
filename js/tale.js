/* Oppdagerøya – tale
 *
 * Bruker nettleserens egen talesyntese (speechSynthesis). Ingen lydfiler,
 * ingen nedlasting, ingen nettforbindelse. Vi leter etter en norsk stemme;
 * finnes ingen, går spillet videre uten tale og sier fra i foreldremenyen.
 */

var Tale = (function () {
  var stotte = typeof window.speechSynthesis !== 'undefined';
  var stemme = null;
  var lette = false;

  /* Hver gang noe avbrytes teller vi opp. En rekke som ble påbegynt før
   * avbruddet stopper da av seg selv i stedet for å snakke oppå den nye.
   * Uten dette snakker spillet i munnen på seg selv når barnet trykker fort. */
  var generasjon = 0;

  /* Stemmer med disse ordene i navnet er nyere, nevrale stemmer og høres
   * langt mindre robotaktige ut enn de gamle innebygde. På Windows heter de
   * gjerne «Microsoft Iselin Online (Natural)», på Mac «Nora (Premium)». */
  var KVALITETSORD = ['premium', 'enhanced', 'neural', 'natural', 'online', 'siri'];

  function erNorsk(v) {
    var kode = (v.lang || '').replace('_', '-').toLowerCase();
    return kode.indexOf('nb') === 0 || kode.indexOf('no') === 0 || kode.indexOf('nn') === 0;
  }

  function poeng(v) {
    var p = 0;
    var kode = (v.lang || '').replace('_', '-').toLowerCase();
    if (kode.indexOf('nb') === 0) p += 40;        /* bokmål først */
    else if (kode.indexOf('no') === 0) p += 30;
    else if (kode.indexOf('nn') === 0) p += 20;

    var navn = (v.name || '').toLowerCase();
    for (var i = 0; i < KVALITETSORD.length; i++) {
      if (navn.indexOf(KVALITETSORD[i]) !== -1) { p += 25; break; }
    }
    /* En stemme som hentes over nett er som regel den nyere, nevrale. */
    if (v.localService === false) p += 8;
    if (v.default) p += 2;
    return p;
  }

  /* Alle norske stemmer maskinen har, best først. Brukes av foreldremenyen. */
  function norskeStemmer() {
    if (!stotte) return [];
    var alle = window.speechSynthesis.getVoices() || [];
    return alle.filter(erNorsk).sort(function (a, b) { return poeng(b) - poeng(a); });
  }

  /* Nøkkelen vi lagrer på. Flere stemmer kan hete det samme – en Mac har
   * gjerne både «Nora», «Nora (Enhanced)» og «Nora (Premium)», og to av dem
   * kan rapportere nøyaktig samme navn. voiceURI skiller dem. */
  function nokkel(v) { return v.voiceURI || v.name; }

  function finnStemme() {
    if (!stotte) return null;
    var alle = window.speechSynthesis.getVoices();
    if (!alle || !alle.length) return null;
    lette = true;

    /* Har den voksne valgt en stemme selv, gjelder den. */
    var valgt = Lagring.innstilling('stemmenavn');
    if (valgt) {
      for (var i = 0; i < alle.length; i++) {
        if (nokkel(alle[i]) === valgt) return alle[i];
      }
      /* Navn som nøkkel var det vi lagret i en tidligere utgave. */
      for (var j = 0; j < alle.length; j++) {
        if (alle[j].name === valgt) return alle[j];
      }
    }

    var norske = norskeStemmer();
    return norske.length ? norske[0] : null;
  }

  /* Andre deler av spillet vil vite når stemmelista endrer seg. På iOS kommer
   * den ofte flere sekunder etter at siden er lastet, og noen ganger først
   * etter at noe er sagt høyt. */
  var lyttere = [];
  var forrigeAntall = -1;

  function oppdater() {
    stemme = finnStemme();
    var antall = stotte ? (window.speechSynthesis.getVoices() || []).length : 0;
    if (antall !== forrigeAntall) {
      forrigeAntall = antall;
      for (var i = 0; i < lyttere.length; i++) lyttere[i]();
    }
  }

  if (stotte) {
    oppdater();
    /* Stemmelista lastes asynkront, og på Mac kommer de nedlastede
     * premiumstemmene ofte et lite øyeblikk etter de innebygde. */
    window.speechSynthesis.onvoiceschanged = oppdater;
    window.setTimeout(oppdater, 300);
    window.setTimeout(oppdater, 1200);
    window.setTimeout(oppdater, 3000);
  }

  /* Spillet kan si noe hvis det finnes en talesyntese – eller hvis vi har
   * lydklipp. En iPad uten talesyntese er fortsatt stum i dag; med en
   * lydbank snakker den. */
  function pa() {
    if (!Lagring.innstilling('stemme')) return false;
    if (stotte) return true;
    return typeof Lydbank !== 'undefined' && Lydbank.antallKlipp() > 0;
  }

  /* Har vi et ferdig klipp for setningen, spiller vi det i stedet for å be
   * nettleseren snakke. Det er hele poenget med lydbanken: på iPhone gir
   * Safari bare de enkle systemstemmene, og de forbedrede stemmene man
   * laster ned kan ikke velges av en nettside. Et klipp går utenom hele
   * problemet, og spillet høres likt ut på alle maskiner. */
  function brukBank() {
    return typeof Lydbank !== 'undefined' &&
           Lagring.innstilling('lydbank') !== false;
  }

  /* Sier én tekst: klipp om vi har det, ellers talesyntesen. */
  function si(tekst) {
    if (!pa() || !tekst) return Promise.resolve();
    if (brukBank() && Lydbank.har(tekst)) {
      return Lydbank.spill(tekst).then(null, function () {
        /* Klippet lot seg ikke spille – da er en robotstemme bedre enn
         * stillhet, og barnet merker ingenting annet enn at den ene
         * setningen hørtes annerledes ut. */
        return snakk(tekst);
      });
    }
    return snakk(tekst);
  }

  /* Sier én tekst med nettleserens talesyntese. Løftet innfris når stemmen er
   * ferdig – eller etter en beregnet maksimaltid, siden enkelte nettlesere
   * glemmer å melde fra. */
  function snakk(tekst) {
    return new Promise(function (ferdig) {
      if (!pa() || !tekst) { ferdig(); return; }

      var ytring = new window.SpeechSynthesisUtterance(tekst);
      /* Rekkefølgen er ikke likegyldig: setter man lang etterpå, eller til
       * noe annet enn stemmens eget språk, ignorerer Safari på Mac stemmen
       * og bruker systemets standard i stedet. */
      if (stemme) {
        try {
          ytring.voice = stemme;
          ytring.lang = stemme.lang || 'nb-NO';
        } catch (e) {
          /* Stemmelista kan ha blitt byttet ut under føttene på oss. Da er
           * det bedre å snakke med standardstemmen enn å tie helt. */
          stemme = null;
          ytring.lang = 'nb-NO';
          oppdater();
        }
      } else {
        ytring.lang = 'nb-NO';
      }
      /* Under ca. 0,8 begynner de fleste talesynteser å slure og høres mer
       * robotaktige ut, ikke roligere. Roen kommer fra pausene mellom
       * setningene i stedet – se Tale.rekke. */
      ytring.rate = Math.max(0.75, Lagring.innstilling('talefart') || 0.9);
      ytring.pitch = 1;
      ytring.volume = 1;

      var lost = false;
      function los() {
        if (lost) return;
        lost = true;
        window.clearTimeout(vakt);
        ferdig();
      }

      ytring.onend = los;
      ytring.onerror = los;

      /* Grovt anslag: ca. 12 tegn i sekundet ved normal fart, pluss slingring. */
      var anslag = 1200 + (tekst.length / 12) * 1000 / (ytring.rate || 1);
      var vakt = window.setTimeout(los, anslag);

      try {
        window.speechSynthesis.speak(ytring);
        /* iOS fyller av og til stemmelista først etter at noe er sagt. */
        window.setTimeout(oppdater, 400);
      } catch (e) {
        los();
      }
    });
  }

  function vent(ms) {
    return new Promise(function (f) { window.setTimeout(f, ms); });
  }

  return {
    /* Sier en rekke tekster etter hverandre, med rolige pauser mellom.
     * Godtar strenger og tall (tall tolkes som pause i millisekunder). */
    rekke: function (deler) {
      var min = generasjon;
      var kjede = Promise.resolve();
      deler.forEach(function (del) {
        kjede = kjede.then(function () {
          if (min !== generasjon) return;
          return typeof del === 'number' ? vent(del) : si(del);
        });
      });
      return kjede;
    },

    si: si,

    /* Velger den første varianten vi har lydklipp for.
     *
     * Rosen sier navnet figuren fikk – «Bra kjørt, Turbo!». Navnene barnet
     * kan velge fra lista ligger i språkpakken, men et navn forelderen
     * skriver inn selv kan umulig ligge der. Da er en ros uten navn, sagt med
     * den gode stemmen, bedre enn en ros med navn sagt av robotstemmen.
     *
     * Er lydbanken slått av, gjelder den rikeste varianten: talesyntesen kan
     * si hvilket som helst navn. */
    velg: function () {
      var varianter = Array.prototype.slice.call(arguments);
      if (brukBank()) {
        for (var i = 0; i < varianter.length; i++) {
          if (Lydbank.har(varianter[i])) return varianter[i];
        }
      }
      return varianter[0];
    },


    stopp: function () {
      generasjon += 1;
      if (stotte) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      if (typeof Lydbank !== 'undefined') Lydbank.stopp();
    },

    /* Brukes av foreldremenyen. */
    norskeStemmer: norskeStemmer,
    /* Kalles hver gang nettleseren melder om en ny stemmeliste. */
    naarStemmerEndres: function (fn) { lyttere.push(fn); },
    letEtterStemmer: function () {
      forrigeAntall = -1;
      oppdater();
    },
    alleStemmer: function () {
      return stotte ? (window.speechSynthesis.getVoices() || []) : [];
    },
    naStemme: function () { return stemme; },
    velgStemme: function (nokkelverdi) {
      Lagring.settInnstilling('stemmenavn', nokkelverdi || null);
      oppdater();
      return stemme;
    },
    nokkelFor: nokkel,
    /* Prøvesetning, så den voksne kan høre forskjell mellom stemmene. */
    prov: function () {
      this.stopp();
      return this.rekke(['Hei! Skal vi finne bokstaven be?']);
    },
    harNorskStemme: function () { return !!stemme && erNorsk(stemme); },
    stottes: function () { return stotte; },
    harLett: function () { return lette; }
  };
})();
