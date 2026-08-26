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

  function finnStemme() {
    if (!stotte) return null;
    var alle = window.speechSynthesis.getVoices();
    if (!alle || !alle.length) return null;
    lette = true;

    /* Norsk bokmål først, så nynorsk/norsk generelt, så ingenting. */
    var rekkefolge = ['nb-NO', 'nb_NO', 'nb', 'no-NO', 'no', 'nn-NO', 'nn'];
    for (var i = 0; i < rekkefolge.length; i++) {
      for (var j = 0; j < alle.length; j++) {
        var kode = (alle[j].lang || '').replace('_', '-').toLowerCase();
        if (kode === rekkefolge[i].replace('_', '-').toLowerCase()) return alle[j];
      }
    }
    for (var k = 0; k < alle.length; k++) {
      if ((alle[k].lang || '').toLowerCase().indexOf('n') === 0) {
        var l = alle[k].lang.toLowerCase();
        if (l.indexOf('nb') === 0 || l.indexOf('nn') === 0 || l.indexOf('no') === 0) {
          return alle[k];
        }
      }
    }
    return null;
  }

  function oppdater() { stemme = finnStemme(); }

  if (stotte) {
    oppdater();
    /* Stemmelista lastes ofte asynkront – vi prøver igjen når den kommer. */
    window.speechSynthesis.onvoiceschanged = oppdater;
    window.setTimeout(oppdater, 300);
    window.setTimeout(oppdater, 1200);
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
      ytring.rate = Lagring.innstilling('talefart') || 0.75;
      ytring.pitch = 1.05;
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
      var kjede = Promise.resolve();
      deler.forEach(function (del) {
        kjede = kjede.then(function () {
          return typeof del === 'number' ? vent(del) : si(del);
        });
      });
      return kjede;
    },

    si: si,

    stopp: function () {
      if (stotte) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    },

    /* Brukes av foreldremenyen for å si fra om stemmen mangler. */
    harNorskStemme: function () { return !!stemme; },
    stottes: function () { return stotte; },
    harLett: function () { return lette; }
  };
})();
