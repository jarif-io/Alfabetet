/* Oppdagerøya – replikkene
 *
 * Hver eneste ting spillet sier høyt, samlet på ett sted.
 *
 * Grunnen er iPhone. Apple slipper bare de enkle systemstemmene til på
 * nettsider – de forbedrede stemmene man laster ned i Innstillinger kan ikke
 * velges av en nettside, og Apple sier selv at det er meningen. Da er eneste
 * vei til god norsk på iPhone å ikke bruke iPhonens talesyntese, men spille
 * av ferdige lydklipp i stedet.
 *
 * For at det skal virke må vi vite nøyaktig hvilke setninger spillet lager.
 * Lista bygges derfor av de samme dataene og de samme formlene som talen
 * bruker – ikke skrevet av for hånd, som ville råtnet første gang et ord ble
 * byttet. En test i nettleseren høster det spillet faktisk sier og krever at
 * alt finnes her.
 *
 * Navnene på figurene kommer utenfra, siden de er ulike hos hver familie.
 * Uten dem hopper vi over de replikkene – rosen sies da uten navn i stedet,
 * se Tale.velg(). Barnets eget navn i «Navnet mitt» er ikke med her: det
 * staves bokstav for bokstav med bokstavnavn-klippene i stedet for å sies
 * som ett ord, så det trenger ingen egen oppføring.
 */

var Replikker = (function () {

  /* Samme formel som moduser.js bruker. Står her også, fordi lista må kunne
   * bygges i node uten å laste hele spillet. */
  function tilTale(ord) {
    return ord === ord.toUpperCase() ? ord : ord.toLowerCase();
  }

  /* Filnavn av en replikk. Æ, Ø og Å skrives om, alt annet enn bokstaver og
   * tall blir bindestrek. Skal være til å lese i en filliste. */
  function slugg(s) {
    var t = String(s).toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa');
    /* «én» skal bli «en», ikke «n». Aksenter skilles fra bokstaven og
     * kastes; æ, ø og å står igjen etter oversettelsen over. */
    if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';
  }

  /* Gruppene i den rekkefølgen det er verdt å spille dem inn.
   *
   * «kjerne» er det han hører hele tiden – bokstavnavnene, ordene og de faste
   * setningene. Det er rundt hundre korte klipp, og de alene løfter hele
   * spillet. Resten er fint å ha, men ikke verdt en kveld med opptak. */
  var GRUPPER = [
    { id: 'bokstavnavn', navn: 'Bokstavnavn' },
    { id: 'tallnavn',    navn: 'Tallnavn' },
    { id: 'ord',         navn: 'Bokstav og ord' },
    { id: 'ordet',       navn: 'Ordene alene' },
    { id: 'forstelyd',   navn: 'Første lyd' },
    { id: 'telling',     navn: 'Telling' },
    { id: 'setning',     navn: 'Faste setninger' },
    { id: 'ros',         navn: 'Ros og hilsener' }
  ];

  /* navn: { bane: 'Turbo', oy: '…', dino: '…' } – tomme felt hopper over
   * replikkene som trenger dem.
   *
   * Hvert felt kan også være en liste. Det bruker skriptet som lager
   * språkpakken: der lages rosen for alle navnene figuren kan få, slik at
   * den ferdige pakken passer uansett hvilket navn barnet velger. */
  /* Ett navn eller en liste med navn – begge deler skal virke. */
  function liste(v) {
    if (!v) return [];
    return (typeof v === 'string' ? [v] : v).filter(Boolean);
  }

  function alle(navn) {
    navn = navn || {};
    var ut = [];
    var sett = {};

    var brukteIder = {};

    function legg(gruppe, tekst, uttale) {
      if (!tekst) return;
      var n = nokkel(tekst);
      if (sett[n]) return;              /* samme setning to steder = ett klipp */
      sett[n] = true;
      /* Id-en blir et filnavn. To replikker som kortes ned til det samme –
       * lange setninger kuttes ved 60 tegn – ville ellers skrevet over
       * hverandres lydklipp uten at noe sa fra. */
      var id = gruppe + '-' + slugg(tekst), grunn = id, teller = 2;
      while (brukteIder[id]) id = grunn + '-' + (teller++);
      brukteIder[id] = true;
      /* «tekst» er det spillet sier, og nøkkelen klippet slås opp på.
       * «uttale» er det stemmen får høre – som regel det samme, men noen ord
       * må skrives om for å bli lest riktig. Se UTTALE i data.js. */
      ut.push({ id: id, gruppe: gruppe, tekst: tekst, uttale: uttale || tekst });
    }

    /* --- bokstavene --- */
    ALFABET.forEach(function (b) {
      legg('bokstavnavn', bokstavnavnFor(b) + '.',
           uttaleFor(bokstavnavnFor(b)) + '.');
    });

    /* --- tallene --- */
    TALL.forEach(function (t) { legg('tallnavn', tallnavnFor(t) + '.'); });

    /* --- ord, verden for verden --- */
    Object.keys(VERDENER).forEach(function (id) {
      var v = VERDENER[id];
      var tall = domeneFor(id) === 'tall';
      tegnFor(id).forEach(function (tegn) {
        var oppslag = ordFor(id, tegn);
        if (!oppslag) return;
        if (tall) {
          legg('ord', visningsordFor(id, tegn) + '.');
        } else {
          var navn = bokstavnavnFor(tegn), ord = tilTale(oppslag.ord);
          legg('ord', navn + ' for ' + ord + '.',
               uttaleFor(navn) + ' for ' + uttaleFor(ord) + '.');
          legg('ordet', oppslag.ord + '.', uttaleFor(oppslag.ord) + '.');
          legg('forstelyd', 'Hvilken bokstav begynner ' + ord + ' på?',
               'Hvilken bokstav begynner ' + uttaleFor(ord) + ' på?');
        }
      });
      legg('setning', v.oppdrag + '…');
      legg('setning', v.navnesporsmal);
      /* Rosen sier navnet figuren fikk, så den kan bare lages når navnet
       * finnes. Gjør den det, er det bare fire setninger per verden. */
      /* Uten navn i det hele tatt. Disse er redningen når forelderen har
       * skrevet inn et eget navn på figuren: da finnes det ikke noe klipp med
       * navnet i, og spillet sier rosen uten navn med den gode stemmen i
       * stedet for med navn og robotstemme. Se Tale.velg. */
      v.ros.forEach(function (r) { legg('ros', r + '!'); });
      legg('ros', 'Hei!');
      legg('ros', 'Bra jobbet!');

      liste(navn[id]).forEach(function (n) {
        v.ros.forEach(function (r) { legg('ros', r + ', ' + n + '!'); });
        legg('ros', 'Hei, ' + n + '!');
        legg('ros', 'Bra jobbet, ' + n + '!');
      });
    });

    /* --- tellingen --- */
    TELLETING.forEach(function (t) {
      legg('telling', 'Hvor mange ' + t.ord + '?',
           'Hvor mange ' + uttaleFor(t.ord) + '?');
      legg('telling', t.ord + '.', uttaleFor(t.ord) + '.');
    });

    /* --- faste setninger --- */
    [
      'Hva vil du gjøre?',
      'Prøv en gang til.',
      'Her er…',
      'Trykk på den.',
      'Der ja! Det er…',
      'Nå prøver vi en vanskeligere en.',
      'Navnet ditt begynner med…',
      'Så kommer…',
      'Trykk på hver enkelt og tell.',
      'Det var…',
      'Se her!',
      'Den kan du nå!',
      'Det er navnet ditt!',
      'Der var hele alfabetet! Fra a til å.',
      'Der var alle tallene! Fra én til ti.'
    ].forEach(function (t) { legg('setning', t); });

    return ut;
  }

  /* Oppslagsnøkkelen. Talen kan komme med ulik store bokstaver og ekstra
   * mellomrom fra ulike steder i spillet; klippet er det samme. */
  function nokkel(tekst) {
    return String(tekst).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  return {
    alle: alle,
    grupper: GRUPPER,
    nokkel: nokkel,
    slugg: slugg
  };
})();

/* Så node kan bruke den samme lista til å lage lydfilene. */
if (typeof module !== 'undefined' && module.exports) module.exports = Replikker;
