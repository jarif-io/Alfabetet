/* Bokstavløpet – tale
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

  function finnStemme() {
    if (!stotte) return null;
    var alle = window.speechSynthesis.getVoices();
    if (!alle || !alle.length) return null;
    lette = true;

    /* Har den voksne valgt en stemme selv, gjelder den. */
    var valgt = Lagring.innstilling('stemmenavn');
    if (valgt) {
      for (var i = 0; i < alle.length; i++) {
        if (alle[i].name === valgt) return alle[i];
      }
    }

    var norske = norskeStemmer();
    return norske.length ? norske[0] : null;
  }

  function pa() {
    return stotte && Lagring.innstilling('stemme');
  }

  /* Sier én tekst. Løftet innfris når stemmen er ferdig – eller etter en
   * beregnet maksimaltid, siden enkelte nettlesere glemmer å melde fra. */
  function si(tekst) {
    return new Promise(function (ferdig) {
      if (!pa() || !tekst) { ferdig(); return; }

      var ytring = new window.SpeechSynthesisUtterance(tekst);
      ytring.lang = 'nb-NO';
      if (stemme) ytring.voice = stemme;
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

    stopp: function () {
      generasjon += 1;
      if (stotte) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    },

    /* Brukes av foreldremenyen. */
    norskeStemmer: norskeStemmer,
    alleStemmer: function () {
      return stotte ? (window.speechSynthesis.getVoices() || []) : [];
    },
    naStemme: function () { return stemme; },
    velgStemme: function (navn) {
      Lagring.settInnstilling('stemmenavn', navn || null);
      oppdater();
    },
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
