/* Oppdagerøya – bygger én enkelt HTML-fil
 *
 * Spillet består normalt av index.html pluss CSS og JS i egne mapper. Denne
 * lille byggefila limer alt sammen til én fil du kan sende på e-post,
 * AirDrope til en iPad, legge på en minnepinne eller publisere hvor som helst.
 *
 * Kjør:  node bygg-enfil.js
 * Ut:    oppdageroya.html   – åpnes ved å dobbeltklikke, virker uten nett
 *        artefakt-kropp.html – samme innhold uten <html>/<head>/<body>,
 *                              til publisering som Claude-artefakt
 *
 * Kjør den på nytt hver gang du har endret ordene i js/data.js.
 */

var fs = require('fs');
var sti = require('path');

var rot = __dirname;
var html = fs.readFileSync(sti.join(rot, 'index.html'), 'utf8');

/* Tekst som legges inne i <script> eller <style> må ikke få lov til å
 * avslutte taggen for tidlig. Det skjer bare hvis kildekoden inneholder
 * «</script>», men vi tar det for sikkerhets skyld. */
function trygg(tekst) {
  return tekst.replace(/<\/(script|style)/gi, '<\\/$1');
}

function les(relativSti) {
  if (relativSti === 'lyd/manifest.js') return lydbankInnbakt();
  return fs.readFileSync(sti.join(rot, relativSti), 'utf8');
}

/* Lydbanken peker normalt på filer i lyd/. I enfil-utgaven finnes ingen mappe
 * å peke på, så hvert klipp legges inn som en data-URL i stedet. Da virker
 * den gode stemmen også når filen er AirDropet til en iPad. */
function lydbankInnbakt() {
  var kilde = fs.readFileSync(sti.join(rot, 'lyd/manifest.js'), 'utf8');
  var treff = kilde.match(/var LYDFILER = ([\s\S]*?);\s*$/);
  if (!treff) return kilde;
  var kart;
  try { kart = JSON.parse(treff[1]); } catch (e) { return kilde; }

  var typer = { '.m4a': 'audio/mp4', '.aiff': 'audio/aiff', '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav', '.caf': 'audio/x-caf' };
  var ut = {}, tatt = 0, hoppet = 0, bytes = 0;
  Object.keys(kart).forEach(function (n) {
    var verdi = kart[n];
    if (verdi.indexOf('data:') === 0) { ut[n] = verdi; tatt++; return; }
    var fil = sti.join(rot, 'lyd', verdi);
    if (!fs.existsSync(fil)) { hoppet++; return; }
    var data = fs.readFileSync(fil);
    bytes += data.length;
    ut[n] = 'data:' + (typer[sti.extname(verdi).toLowerCase()] || 'audio/mp4') +
            ';base64,' + data.toString('base64');
    tatt++;
  });
  if (tatt) {
    console.log('lydbank: ' + tatt + ' klipp lagt inn (' +
                Math.round(bytes / 1024) + ' KB lyd)' +
                (hoppet ? ', ' + hoppet + ' filer manglet' : ''));
  }
  return kilde.slice(0, treff.index) + 'var LYDFILER = ' +
         JSON.stringify(ut) + ';\n';
}

/* Bytt <link rel="stylesheet" href="..."> mot <style>…</style> */
html = html.replace(/[ \t]*<link rel="stylesheet" href="([^"]+)">\n?/g, function (_, fil) {
  return '<style>\n/* ' + fil + ' */\n' + trygg(les(fil)) + '\n</style>\n';
});

/* Bytt <script src="..."></script> mot <script>…</script> */
html = html.replace(/[ \t]*<script src="([^"]+)"><\/script>\n?/g, function (_, fil) {
  return '<script>\n/* ' + fil + ' */\n' + trygg(les(fil)) + '\n</script>\n';
});

fs.writeFileSync(sti.join(rot, 'oppdageroya.html'), html);

/* Artefaktversjonen: bare innholdet, uten ytterskallet. Stilene ligger i
 * <head> og må flyttes med, ellers blir siden helt naken. */
/* Uten sjekken blir en endret <head>-formatering til «Cannot read properties
 * of null», som ikke sier noe om hva som er galt. */
var hodeTreff = html.match(/<head>([\s\S]*?)<\/head>/i);
if (!hodeTreff) {
  console.error('Fant ingen <head> i index.html – har formateringen endret seg?');
  process.exit(1);
}
var hode = hodeTreff[1];
var stiler = (hode.match(/<style>[\s\S]*?<\/style>/gi) || []).join('\n');

var kropp = '<title>Oppdagerøya</title>\n' + stiler + '\n' +
  html.replace(/^[\s\S]*?<body>\n?/i, '').replace(/<\/body>[\s\S]*$/i, '');

fs.writeFileSync(sti.join(rot, 'artefakt-kropp.html'), kropp);

var kb = function (f) { return Math.round(fs.statSync(sti.join(rot, f)).size / 1024) + ' KB'; };
console.log('oppdageroya.html   ' + kb('oppdageroya.html'));
console.log('artefakt-kropp.html ' + kb('artefakt-kropp.html'));
