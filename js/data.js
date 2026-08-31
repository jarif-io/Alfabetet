/* Oppdagerøya – data
 *
 * Dette er filen dere kan endre. Vil dere bytte ut et ord med et ord fra boka
 * dere leser, så bytt bare "ord" og "ikon" på riktig bokstav. Ingenting annet
 * trenger å endres.
 *
 * To regler styrer ordvalget:
 *
 *   1. Ordet skal være noe en treåring kan peke på og si. Derfor «Fly» og
 *      ikke «Fart», «Ost» og ikke «Olje».
 *   2. Bildet må passe til ordet han faktisk ville brukt. Ser han 🍦 sier
 *      han «is», ikke «isbil» – da ville han lært feil bokstav. Derfor er
 *      det «Is», «Kran» og «Lastebil», ikke «Isbil», «Kranbil» og «Dumper».
 *
 * Noen bokstaver finnes nesten ikke i norske ord et lite barn kjenner:
 * Q, W, X, Y, Z, Æ og Å. Der står det samme ord i begge verdener, rett og
 * slett fordi det ikke finnes noe bedre å velge mellom. «Åre» ble vraket
 * til fordel for «Åtte» av samme grunn som over: bildet av en kano leser
 * han som «båt».
 *
 * De fire verste – Q, W, X og Z – står i SJELDNE_BOKSTAVER lenger nede og
 * er utenfor standardutvalget. To av ikonene her er ærlig talt svake:
 * «Xylofon 🎵» leser han som noter, og «Yoghurt 🥣» som grøt. Det finnes
 * ingen bedre emoji for dem – skal de bli gode, må de tegnes som SVG slik
 * figurene er. X er nå utenfor standardutvalget, så den dukker sjelden opp.
 *
 * Hvert felt betyr:
 *   ord   – ordet som sies og vises
 *   ikon  – en emoji som vises stort på skjermen
 *
 * Spillet sier «L … L for Løve» – samme formel som alfabetbøkene bruker.
 */

/* Versjonen vises nederst i foreldremenyen. Den finnes fordi feilsøking på
 * andres telefon er umulig uten å vite hva de faktisk kjører: Safari kan sitte
 * på en gammel kopi i timevis. Bump denne ved hver publisering. */
var SPILLVERSJON = '2026-08-31 · 13';

var ALFABET = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M','N',
  'O','P','Q','R','S','T','U','V','W','X','Y','Z','Æ','Ø','Å'
];

/* Bokstavnavnene skrevet ut. Får talesyntesen bare tegnet «Q», staver noen
 * stemmer det på engelsk eller sier «bokstaven Q». Skriver vi «ku», sier alle
 * norske stemmer det riktig. */
var BOKSTAVNAVN = {
  'A': 'a',   'B': 'be',  'C': 'se',  'D': 'de',  'E': 'e',
  'F': 'eff', 'G': 'ge',  'H': 'hå',  'I': 'i',   'J': 'je',
  'K': 'kå',  'L': 'ell', 'M': 'emm', 'N': 'enn', 'O': 'o',
  'P': 'pe',  'Q': 'ku',  'R': 'err', 'S': 'ess', 'T': 'te',
  'U': 'u',   'V': 've',  'W': 'dobbelt-ve',      'X': 'eks',
  'Y': 'y',   'Z': 'sett','Æ': 'æ',   'Ø': 'ø',   'Å': 'å'
};

function bokstavnavnFor(bokstav) { return BOKSTAVNAVN[bokstav] || bokstav; }

/* Bokstavene som knapt finnes i norske ord et lite barn kjenner. De er med i
 * spillet, men ikke i standardutvalget – ellers bruker han en sjuendedel av
 * øvingen på Q, W, X og Z. Foreldremenyen kan hake dem på igjen.
 *
 * Å står bevisst ikke her: «Åtte 8️⃣» er et svakt bilde, men Å er en vanlig
 * norsk bokstav han møter overalt, og å utelate den er noe helt annet enn å
 * utelate Q. Y står heller ikke her – «yoghurt» er et ord han faktisk sier. */
var SJELDNE_BOKSTAVER = ['Q', 'W', 'X', 'Z'];

/* Selve bokstavlyden, til bruk mellom bokstavnavnet og ordet:
 * «ell … lll … ell for Løve».
 *
 * Poenget er at bokstavnavnet til en konsonant begynner på en vokal («ell»,
 * «emm», «eff»), så et barn hører ingen kobling mellom «ell» og /l/-lyden i
 * «Løve». Vokalene trenger ingen oppføring – der er navn og lyd det samme.
 *
 * Bare lyder som kan holdes ut i tid står her. Plosivene (B, D, G, K, P, T)
 * er utelatt med vilje: de kan ikke uttales uten en vokal etterpå, og da er
 * man tilbake til bokstavnavnet.
 *
 * VIKTIG: dette er forslag som må høres på. Hvordan en stemme leser «sss»
 * varierer fra stemme til stemme, og en lyd som blir rot er verre enn ingen
 * lyd. Slå på «si bokstavlyden» i foreldremenyen, hør gjennom, og stryk
 * linjene som ikke funker. Det er derfor bryteren er av fra start. */
var BOKSTAVLYD = {
  'F': 'fff', 'J': 'jjj', 'L': 'lll', 'M': 'mmm',
  'N': 'nnn', 'R': 'rrr', 'S': 'sss', 'V': 'vvv'
};

function bokstavlydFor(bokstav) { return BOKSTAVLYD[bokstav] || null; }

/* ================= uttale ================= */

/* Stemmen i språkpakken leser fra skrift, og noen ord blir feil når de leses
 * som de skrives. Her står hvordan ordet må skrives for at det skal *høres*
 * riktig ut. Teksten på skjermen er den samme som før – dette gjelder bare
 * lyden, og bare når lydpakken lages.
 *
 * Alle oppføringene er funnet ved å be talesyntesen om lydskriften og
 * sammenligne med hvordan ordet faktisk sies på norsk. Legger dere til nye
 * ord i verdenene under, er det verdt å gjøre det samme:
 *   python3 lag-lydpakke.py --uttale «ordet»
 */
var UTTALE = {
  /* Bokstaven D. Skrevet «de» leser stemmen pronomenet, altså «di». */
  'de': 'dé',
  /* Bokstaven R heter «ærr». Skrevet «err» blir det «arr». */
  'err': 'er',
  /* Fremmedord som leses bokstavelig hvis de får stå som de skrives. */
  'juice': 'jus',
  'yoghurt': 'jogurt',
  'quiz': 'kviss',
  'cowboy': 'kauboi'
};

/* Hvordan ett ord skal skrives for stemmen. Ukjente ord går rett gjennom. */
function uttaleFor(ord) {
  return UTTALE[String(ord).toLowerCase()] || ord;
}

/* ================= tallene ================= */

/* Dinodalen bruker tall i stedet for bokstaver. Vi starter på 1–10: det er
 * så langt en treåring kommer med å telle ting han kan se på én gang, og
 * ti er et mål han kan nå. */
var TALL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/* Tallnavnene skrevet ut, av samme grunn som bokstavnavnene: talesyntesen
 * kan lese «10» som «ti», men også som «en null» avhengig av stemme. */
var TALLNAVN = {
  '1': 'én', '2': 'to',  '3': 'tre', '4': 'fire', '5': 'fem',
  '6': 'seks', '7': 'sju', '8': 'åtte', '9': 'ni', '10': 'ti'
};

function tallnavnFor(tall) { return TALLNAVN[tall] || tall; }

/* Tingene «Tell» teller. Trekkes tilfeldig for hver oppgave, og med vilje ikke
 * fra tallets egen oppføring: hadde ballene alltid vært tre, kunne han svart
 * riktig ved å kjenne igjen ballen i stedet for å telle. Her sier tingen
 * ingenting om svaret. */
var TELLETING = [
  { ord: 'egg',      ikon: '🥚' },
  { ord: 'baller',   ikon: '⚽' },
  { ord: 'biler',    ikon: '🚗' },
  { ord: 'epler',    ikon: '🍎' },
  { ord: 'fisker',   ikon: '🐟' },
  { ord: 'blomster', ikon: '🌸' },
  { ord: 'stjerner', ikon: '⭐' },
  { ord: 'bananer',  ikon: '🍌' },
  { ord: 'jordbær',  ikon: '🍓' },
  { ord: 'bøtter',   ikon: '🪣' },
  { ord: 'ballonger', ikon: '🎈' },
  { ord: 'sko',      ikon: '👟' }
];

/* Å telle høyt: «én, to, tre …». Egen liste fordi barnet teller fra én,
 * og fordi det er formen han hører når vi teller sammen med ham. */
function tellenavn(n) { return TALLNAVN[String(n)] || String(n); }

/* Gjør barnets navn om til bokstavene «Navnet mitt» skal bygge.
 *
 * Bare det første leddet brukes: «Ida Marie» blir IDA og «Ole-Martin» blir
 * OLE. Et helt dobbeltnavn er for langt for én runde, og fornavnet er uansett
 * det barnet kjenner igjen først. Tegn spillet ikke har en bokstav for – som
 * é i «Zoé» – faller bort, og lengre navn kuttes ved ti bokstaver.
 *
 * Blir resultatet tomt, finnes det ikke noe navn å bygge, og modusen holdes
 * utenfor menyen.
 */
function navnBokstaver(navn) {
  var forste = String(navn || '').trim().split(/[\s\-–—]+/)[0] || '';
  var ut = [];
  var store = forste.toUpperCase();
  for (var i = 0; i < store.length && ut.length < 10; i++) {
    if (ALFABET.indexOf(store[i]) !== -1) ut.push(store[i]);
  }
  return ut;
}

var VERDENER = {
  bane: {
    id: 'bane',
    navn: 'Racerbanen',
    ikon: '🏁',
    figur: 'bil',
    figurOrd: 'bilen',
    standardnavn: 'Turbo',
    navneforslag: ['Turbo', 'Lynet', 'Bulder', 'Rappen'],
    navnesporsmal: 'Hva skal racerbilen hete?',
    utforsk: 'Garasjen',
    samling: 'Garasjeveggen',
    oppdrag: 'Kjør til',
    ros: ['Bra kjørt', 'Full fart', 'Så flink du er', 'Det klarte du'],
    ord: {
      'A': { ord: 'Ambulanse',    ikon: '🚑' },
      'B': { ord: 'Bil',          ikon: '🚗' },
      'C': { ord: 'Campingbil',   ikon: '🚐' },
      'D': { ord: 'Dinosaur',     ikon: '🦕' },
      'E': { ord: 'Elefant',      ikon: '🐘' },
      'F': { ord: 'Fly',          ikon: '✈️' },
      'G': { ord: 'Gris',         ikon: '🐷' },
      'H': { ord: 'Hus',          ikon: '🏠' },
      'I': { ord: 'Is',           ikon: '🍦' },
      'J': { ord: 'Jordbær',      ikon: '🍓' },
      'K': { ord: 'Kran',         ikon: '🏗️' },
      'L': { ord: 'Lastebil',     ikon: '🚚' },
      'M': { ord: 'Motorsykkel',  ikon: '🏍️' },
      'N': { ord: 'Nøkkel',       ikon: '🔑' },
      'O': { ord: 'Ost',          ikon: '🧀' },
      'P': { ord: 'Politibil',    ikon: '🚓' },
      'Q': { ord: 'Quiz',         ikon: '❔' },
      'R': { ord: 'Rakett',       ikon: '🚀' },
      'S': { ord: 'Sykkel',       ikon: '🚲' },
      'T': { ord: 'Traktor',      ikon: '🚜' },
      'U': { ord: 'Ugle',         ikon: '🦉' },
      'V': { ord: 'Vaffel',       ikon: '🧇' },
      'W': { ord: 'WC',           ikon: '🚽' },
      'X': { ord: 'Xylofon',      ikon: '🎵' },
      'Y': { ord: 'Yoghurt',      ikon: '🥣' },
      'Z': { ord: 'Zebra',        ikon: '🦓' },
      'Æ': { ord: 'Æsj',          ikon: '🤢' },
      'Ø': { ord: 'Øye',          ikon: '👁️' },
      'Å': { ord: 'Åtte',         ikon: '8️⃣' }
    }
  },

  oy: {
    id: 'oy',
    navn: 'Sjørøverøya',
    ikon: '🏴‍☠️',
    figur: 'skip',
    figurOrd: 'skipet',
    standardnavn: 'Kaptein Rødskjegg',
    navneforslag: ['Kaptein Rødskjegg', 'Kaptein Krok', 'Kaptein Bart', 'Kaptein Kalle'],
    navnesporsmal: 'Hva skal kapteinen hete?',
    utforsk: 'Skattekartet',
    samling: 'Skattekista',
    oppdrag: 'Seil til',
    ros: ['Godt seilt', 'Land i sikte', 'Så flink du er', 'Det klarte du'],
    ord: {
      'A': { ord: 'Anker',        ikon: '⚓' },
      'B': { ord: 'Båt',          ikon: '⛵' },
      'C': { ord: 'Cowboy',       ikon: '🤠' },
      'D': { ord: 'Delfin',       ikon: '🐬' },
      'E': { ord: 'Eple',         ikon: '🍎' },
      'F': { ord: 'Flagg',        ikon: '🚩' },
      'G': { ord: 'Gull',         ikon: '🪙' },
      'H': { ord: 'Hai',          ikon: '🦈' },
      'I': { ord: 'Isbjørn',      ikon: '🐻‍❄️' },
      'J': { ord: 'Juice',        ikon: '🧃' },
      'K': { ord: 'Kart',         ikon: '🗺️' },
      'L': { ord: 'Løve',         ikon: '🦁' },
      'M': { ord: 'Måne',         ikon: '🌙' },
      'N': { ord: 'Nese',         ikon: '👃' },
      'O': { ord: 'Oter',         ikon: '🦦' },
      'P': { ord: 'Papegøye',     ikon: '🦜' },
      'Q': { ord: 'Quiz',         ikon: '❔' },
      'R': { ord: 'Rev',          ikon: '🦊' },
      'S': { ord: 'Skip',         ikon: '🚢' },
      'T': { ord: 'Tiger',        ikon: '🐯' },
      'U': { ord: 'Ulv',          ikon: '🐺' },
      'V': { ord: 'Vulkan',       ikon: '🌋' },
      'W': { ord: 'WC',           ikon: '🚽' },
      'X': { ord: 'Xylofon',      ikon: '🎵' },
      'Y': { ord: 'Yoghurt',      ikon: '🥣' },
      'Z': { ord: 'Zebra',        ikon: '🦓' },
      'Æ': { ord: 'Æsj',          ikon: '🤢' },
      'Ø': { ord: 'Øy',           ikon: '🏝️' },
      'Å': { ord: 'Åtte',         ikon: '8️⃣' }
    }
  },

  /* Tallverdenen. Den ligger for seg selv med vilje: tall og bokstaver skal
   * ikke blandes på samme skjerm, og et barn skjønner «her bor tallene»
   * raskere enn noen forklaring.
   *
   * Her betyr «ord» navnet på tingen som telles, i den formen som passer
   * akkurat det tallet – «to egg», men «tre baller». Spillet setter sammen
   * tallnavnet og ordet selv: «fire … fire biler».
   *
   * Hvert tall har sin egen ting, så Reiret og Tallrekka blir variert. Ordene
   * er hverdagsord en treåring sier selv – ball, bil, eple – ikke ord han
   * må lære for å skjønne oppgaven. Alle emojiene er enkle kodepunkt, så de
   * ikke faller fra hverandre på eldre telefoner. */
  dino: {
    id: 'dino',
    navn: 'Dinodalen',
    domene: 'tall',
    tegn: TALL,
    ikon: '🦕',
    figur: 'dino',
    figurOrd: 'dinosauren',
    standardnavn: 'Rex',
    navneforslag: ['Rex', 'Tass', 'Brumle', 'Piggen'],
    navnesporsmal: 'Hva skal dinosauren hete?',
    utforsk: 'Reiret',
    samling: 'Eggsamlingen',
    oppdrag: 'Tramp til',
    ros: ['Kjempebra', 'Bra trampet', 'Så flink du er', 'Det klarte du'],
    ord: {
      '1':  { ord: 'dinosaur',  ikon: '🦕' },
      '2':  { ord: 'egg',       ikon: '🥚' },
      '3':  { ord: 'baller',    ikon: '⚽' },
      '4':  { ord: 'biler',     ikon: '🚗' },
      '5':  { ord: 'epler',     ikon: '🍎' },
      '6':  { ord: 'fisker',    ikon: '🐟' },
      '7':  { ord: 'blomster',  ikon: '🌸' },
      '8':  { ord: 'stjerner',  ikon: '⭐' },
      '9':  { ord: 'bananer',   ikon: '🍌' },
      '10': { ord: 'jordbær',   ikon: '🍓' }
    }
  }
};

/* ---------- verdenen som helhet ---------- */

/* «bokstav» eller «tall». Alt som skiller de to verdenstypene henger på
 * denne, så modusene kan være felles. */
function domeneFor(verdenId) {
  return VERDENER[verdenId].domene || 'bokstav';
}

/* Tegnsettet verdenen øver på: alfabetet, eller tallene. */
function tegnFor(verdenId) {
  return VERDENER[verdenId].tegn || ALFABET;
}

/* Hva tegnet heter når det sies høyt: «ell» eller «fire». */
function navnPaTegn(verdenId, tegn) {
  return domeneFor(verdenId) === 'tall'
    ? tallnavnFor(tegn)
    : bokstavnavnFor(tegn);
}

/* Hvor mange ting tegnet står for. Bokstaver teller ingenting. */
function antallFor(verdenId, tegn) {
  return domeneFor(verdenId) === 'tall' ? parseInt(tegn, 10) : 0;
}

/* Henter oppslaget for ett tegn i én verden – en bokstav eller et tall. */
function ordFor(verdenId, tegn) {
  return VERDENER[verdenId].ord[tegn];
}

/* Teksten under bildet: «Lastebil» i bokstavverdenene, «fire bein» i
 * tallverdenen, der ordet alene ikke sier noe uten tallet foran. */
function visningsordFor(verdenId, tegn) {
  var oppslag = ordFor(verdenId, tegn);
  if (!oppslag) return '';
  if (domeneFor(verdenId) !== 'tall') return oppslag.ord;
  return tallnavnFor(tegn) + ' ' + oppslag.ord;
}
