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
  return fs.readFileSync(sti.join(rot, relativSti), 'utf8');
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
