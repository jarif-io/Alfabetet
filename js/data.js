/* Bokstavløpet – data
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
 * Hvert felt betyr:
 *   ord   – ordet som sies og vises
 *   ikon  – en emoji som vises stort på skjermen
 *
 * Spillet sier «L … L for Løve» – samme formel som alfabetbøkene bruker.
 */

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
      'H': { ord: 'Hjul',         ikon: '🛞' },
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
      'F': { ord: 'Flagg',        ikon: '🏴‍☠️' },
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
  }
};

/* Henter oppslaget for én bokstav i én verden. */
function ordFor(verdenId, bokstav) {
  return VERDENER[verdenId].ord[bokstav];
}
