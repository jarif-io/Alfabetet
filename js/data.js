/* Bokstavløpet – data
 *
 * Dette er filen dere kan endre. Vil dere bytte ut et ord med et ord fra boka
 * dere leser, så bytt bare "ord" og "ikon" på riktig bokstav. Ingenting annet
 * trenger å endres.
 *
 * Hvert felt betyr:
 *   ord   – ordet som sies og vises
 *   ikon  – en emoji som vises stort på skjermen
 *   lyd   – hvordan stemmen skal si SELVE LYDEN (ikke bokstavnavnet).
 *           Utelates den, lager spillet en av seg selv ("b-b-bil").
 */

var ALFABET = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M','N',
  'O','P','Q','R','S','T','U','V','W','X','Y','Z','Æ','Ø','Å'
];

/* Vokalene kan stemmen si som ren lyd. Konsonantene lages av ordet. */
var VOKALLYD = {
  'A': 'aaa', 'E': 'eee', 'I': 'iii', 'O': 'ooo',
  'U': 'uuu', 'Y': 'yyy', 'Æ': 'æææ', 'Ø': 'øøø', 'Å': 'ååå'
};

var VERDENER = {
  bane: {
    id: 'bane',
    navn: 'Racerbanen',
    ikon: '🏁',
    figur: 'bil',
    figurOrd: 'bilen',
    standardnavn: 'Turbo',
    navnesporsmal: 'Hva skal racerbilen hete?',
    samling: 'Garasjeveggen',
    oppdrag: 'Kjør til',
    ros: ['Bra kjørt', 'Full fart', 'Så flink du er', 'Det klarte du'],
    ord: {
      'A': { ord: 'Ambulanse',   ikon: '🚑' },
      'B': { ord: 'Bil',         ikon: '🚗' },
      'C': { ord: 'Cabriolet',   ikon: '🚙' },
      'D': { ord: 'Dumper',      ikon: '🚛' },
      'E': { ord: 'Elbil',       ikon: '🔋' },
      'F': { ord: 'Fart',        ikon: '💨' },
      'G': { ord: 'Garasje',     ikon: '🏠' },
      'H': { ord: 'Hjul',        ikon: '🛞' },
      'I': { ord: 'Isbil',       ikon: '🍦' },
      'J': { ord: 'Jekk',        ikon: '🔧' },
      'K': { ord: 'Kranbil',     ikon: '🏗️' },
      'L': { ord: 'Lastebil',    ikon: '🚚' },
      'M': { ord: 'Motor',       ikon: '⚙️' },
      'N': { ord: 'Nøkkel',      ikon: '🔑' },
      'O': { ord: 'Olje',        ikon: '🛢️' },
      'P': { ord: 'Politibil',   ikon: '🚓' },
      'Q': { ord: 'Quad',        ikon: '🏍️' },
      'R': { ord: 'Rødt lys',    ikon: '🚦' },
      'S': { ord: 'Sykkel',      ikon: '🚲' },
      'T': { ord: 'Traktor',     ikon: '🚜' },
      'U': { ord: 'Utrykning',   ikon: '🚨' },
      'V': { ord: 'Vei',         ikon: '🛣️' },
      'W': { ord: 'Watt',        ikon: '⚡' },
      'X': { ord: 'Xylofon',     ikon: '🎹' },
      'Y': { ord: 'Yoghurt',     ikon: '🥛' },
      'Z': { ord: 'Zebrastriper',ikon: '🦓' },
      'Æ': { ord: 'Ært',         ikon: '🫛' },
      'Ø': { ord: 'Øy',          ikon: '🏝️' },
      'Å': { ord: 'Åre',         ikon: '🛶' }
    }
  },

  oy: {
    id: 'oy',
    navn: 'Sjørøverøya',
    ikon: '🏴‍☠️',
    figur: 'skip',
    figurOrd: 'skipet',
    standardnavn: 'Kaptein Rødskjegg',
    navnesporsmal: 'Hva skal kapteinen hete?',
    samling: 'Skattekartet',
    oppdrag: 'Seil til',
    ros: ['Godt seilt', 'Land i sikte', 'Så flink du er', 'Det klarte du'],
    ord: {
      'A': { ord: 'Anker',       ikon: '⚓' },
      'B': { ord: 'Båt',         ikon: '⛵' },
      'C': { ord: 'Cowboyhatt',  ikon: '🤠' },
      'D': { ord: 'Delfin',      ikon: '🐬' },
      'E': { ord: 'Edelsten',    ikon: '💎' },
      'F': { ord: 'Flagg',       ikon: '🏴‍☠️' },
      'G': { ord: 'Gull',        ikon: '🪙' },
      'H': { ord: 'Hai',         ikon: '🦈' },
      'I': { ord: 'Is',          ikon: '🧊' },
      'J': { ord: 'Jolle',       ikon: '🛶' },
      'K': { ord: 'Kart',        ikon: '🗺️' },
      'L': { ord: 'Lykt',        ikon: '🏮' },
      'M': { ord: 'Måke',        ikon: '🐦' },
      'N': { ord: 'Nøkkel',      ikon: '🔑' },
      'O': { ord: 'Oter',        ikon: '🦦' },
      'P': { ord: 'Papegøye',    ikon: '🦜' },
      'Q': { ord: 'Quiz',        ikon: '❓' },
      'R': { ord: 'Regn',        ikon: '🌧️' },
      'S': { ord: 'Skip',        ikon: '🚢' },
      'T': { ord: 'Tønne',       ikon: '🛢️' },
      'U': { ord: 'Ugle',        ikon: '🦉' },
      'V': { ord: 'Vind',        ikon: '🌬️' },
      'W': { ord: 'Wok',         ikon: '🍳' },
      'X': { ord: 'Xylofon',     ikon: '🎹' },
      'Y': { ord: 'Yoghurt',     ikon: '🥛' },
      'Z': { ord: 'Zebra',       ikon: '🦓' },
      'Æ': { ord: 'Ært',         ikon: '🫛' },
      'Ø': { ord: 'Øy',          ikon: '🏝️' },
      'Å': { ord: 'Åre',         ikon: '🛶' }
    }
  }
};

/* Henter oppslaget for én bokstav i én verden. */
function ordFor(verdenId, bokstav) {
  return VERDENER[verdenId].ord[bokstav];
}

/* Teksten stemmen skal si for å vise lyden bokstaven lager. */
function lydFor(verdenId, bokstav) {
  var oppslag = ordFor(verdenId, bokstav);
  if (oppslag.lyd) return oppslag.lyd;
  if (VOKALLYD[bokstav]) return VOKALLYD[bokstav];
  var forste = oppslag.ord.charAt(0).toLowerCase();
  return forste + '-' + forste + '-' + oppslag.ord.toLowerCase();
}
