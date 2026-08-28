/* Oppdagerøya – språkpakken
 *
 * Hvorfor denne finnes: på iPhone og iPad gir Safari bare de enkle
 * systemstemmene til nettsider. De forbedrede norske stemmene man laster ned
 * under Innstillinger → Tilgjengelighet → Talt innhold kan ikke velges av en
 * nettside i det hele tatt. En Apple-ingeniør har svart at det er slik det
 * skal være. Det er altså ingen innstilling vi mangler – veien er stengt.
 *
 * Så vi går utenom: alt spillet sier er lest inn på forhånd med en norsk
 * nevral stemme og ligger som lydfiler i lyd/. Har vi et klipp for setningen,
 * spiller vi klippet i stedet for å be nettleseren snakke. Da høres spillet
 * likt ut overalt – iPhone, iPad, Mac, Windows, Android – uten at noen
 * trenger å gjøre noe.
 *
 * For de få replikkene pakken ikke dekker, snakker talesyntesen som før.
 */

var Lydbank = (function () {

  var lyd = null;            /* det ene <audio>-elementet vi spiller alt gjennom */
  var naSpiller = null;      /* avslutter det som spilles nå */

  function nokkel(tekst) {
    return String(tekst).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /* lyd/manifest.js definerer LYDFILER. Mangler filen, eller er den tom, står
   * vi igjen med talesyntesen – og alt annet skal virke som før. */
  function filer() {
    return (typeof LYDFILER !== 'undefined' && LYDFILER) || {};
  }

  /* Ett stumt klipp spilt av inne i et ekte trykk. Uten dette nekter iOS å
   * spille lyd senere, når avspillingen starter av seg selv etter at en
   * oppgave dukker opp. Samme grep som Lyd.lasOpp gjør for lydeffektene. */
  var STUMT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';

  function element() {
    if (!lyd) {
      lyd = new window.Audio();
      lyd.preload = 'auto';
    }
    return lyd;
  }

  function lasOpp() {
    var a = element();
    try {
      a.src = STUMT;
      var p = a.play();
      if (p && p.then) p.then(function () { a.pause(); }, function () {});
    } catch (e) {}
  }

  function stopp() {
    if (naSpiller) { var f = naSpiller; naSpiller = null; f(); }
    if (lyd) { try { lyd.pause(); } catch (e) {} }
  }

  /* Spiller klippet for teksten. Løftet innfris når klippet er ferdig, og
   * avvises hvis noe gikk galt – da tar talesyntesen over, slik at én
   * ødelagt fil aldri gjør spillet stumt. */
  function spill(tekst) {
    var fil = filer()[nokkel(tekst)];
    if (!fil) return Promise.reject();
    /* Enfil-utgaven har klippene som data-URL-er i stedet for filer. */
    var kilde = fil.indexOf('data:') === 0 ? fil : 'lyd/' + fil;

    return new Promise(function (ferdig, feil) {
      var a = element();
      stopp();
      var lost = false;
      function los(ok) {
        if (lost) return;
        lost = true;
        naSpiller = null;
        a.onended = a.onerror = null;
        window.clearTimeout(vakt);
        if (ok) ferdig(); else feil();
      }
      naSpiller = function () { los(true); };
      a.onended = function () { los(true); };
      a.onerror = function () { los(false); };
      /* Et klipp som aldri melder seg ferdig skal ikke stanse rekka. */
      var vakt = window.setTimeout(function () { los(true); }, 12000);
      try {
        a.src = kilde;
        a.currentTime = 0;
        var p = a.play();
        if (p && p.then) p.then(null, function () { los(false); });
      } catch (e) { los(false); }
    });
  }

  return {
    har: function (tekst) { return !!filer()[nokkel(tekst)]; },
    spill: spill,
    stopp: stopp,
    lasOpp: lasOpp,
    nokkel: nokkel,
    antallKlipp: function () { return Object.keys(filer()).length; }
  };
})();
