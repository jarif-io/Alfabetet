/* Oppdagerøya – tale
 *
 * Spillet snakker utelukkende med sin egen norske språkpakke – ferdig
 * innleste lydklipp i lyd/. Det finnes bevisst ingen vei tilbake til
 * nettleserens eller operativsystemets egen talesyntese: iOS Safari gir
 * nettsider bare de enkle systemstemmene uansett hva som er lastet ned i
 * Innstillinger, og «den beste stemmen den aktuelle maskinen tilfeldigvis
 * har» skal ikke avgjøre hvordan spillet høres ut. Finnes det ikke et klipp
 * for noe, er svaret stillhet for akkurat den setningen – ikke en stemme som
 * plutselig høres helt annerledes ut.
 */

var Tale = (function () {

  /* Hver gang noe avbrytes teller vi opp. En rekke som ble påbegynt før
   * avbruddet stopper da av seg selv i stedet for å snakke oppå den nye.
   * Uten dette snakker spillet i munnen på seg selv når barnet trykker fort. */
  var generasjon = 0;

  /* Spillet kan si noe hvis stemmen er slått på og pakken faktisk er lastet. */
  function pa() {
    return !!Lagring.innstilling('stemme') &&
           typeof Lydbank !== 'undefined' && Lydbank.antallKlipp() > 0;
  }

  /* Sier én tekst. Har vi ikke et klipp for den, sier vi rett og slett
   * ingenting for akkurat den setningen og fortsetter til neste – se
   * toppkommentaren for hvorfor det ikke finnes noen stemme å falle
   * tilbake på. */
  function si(tekst) {
    if (!pa() || !tekst || !Lydbank.har(tekst)) return Promise.resolve();
    return Lydbank.spill(tekst).then(null, function () { return null; });
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

    /* Velger den første varianten vi har lydklipp for. Finnes ingen av dem,
     * velges den siste – som regel den enkleste, navneløse varianten – i
     * stedet for den rikeste: bedre stille enn å risikere en hel setning
     * uten klipp midt i en rekke.
     *
     * Rosen sier navnet figuren fikk – «Bra kjørt, Turbo!». Navnene barnet
     * kan velge fra lista ligger i språkpakken, men et navn forelderen
     * skriver inn selv kan umulig ligge der – da sier vi rosen uten navn. */
    velg: function () {
      var varianter = Array.prototype.slice.call(arguments);
      for (var i = 0; i < varianter.length; i++) {
        if (typeof Lydbank !== 'undefined' && Lydbank.har(varianter[i])) {
          return varianter[i];
        }
      }
      return varianter[varianter.length - 1];
    },

    stopp: function () {
      generasjon += 1;
      if (typeof Lydbank !== 'undefined') Lydbank.stopp();
    }
  };
})();
