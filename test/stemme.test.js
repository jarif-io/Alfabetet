/* Språkpakken er spillets eneste stemme. Hver setning spillet sier må ha et
 * klipp – ellers er det bare stille – og hver id koden slår opp må finnes. */
'use strict';

var fs = require('fs');
var sti = require('path');
var vm = require('vm');

/* Laster data.js, replikker.js og manifestet i node, slik lag-lydpakke.py gjør. */
function lastData(rot) {
  var ctx = { module: { exports: {} }, console: console };
  vm.createContext(ctx);
  ['js/data.js', 'js/replikker.js', 'lyd/manifest.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(sti.join(rot, f), 'utf8'), ctx);
  });
  return ctx;
}

module.exports = async function (t) {
  var ok = t.ok, hjelp = t.hjelp;

  /* ---------- statisk: pakken og lista er de samme ---------- */
  var c = lastData(t.ROT);
  var navn = {};
  Object.keys(c.VERDENER).forEach(function (id) { navn[id] = c.VERDENER[id].navneforslag; });
  var lista = c.Replikker.alle(navn).map(function (r) { return c.Replikker.nokkel(r.tekst); });
  var pakken = Object.keys(c.LYDFILER);
  var mangler = lista.filter(function (n) { return !c.LYDFILER[n]; });
  var foreldet = pakken.filter(function (n) { return lista.indexOf(n) === -1; });
  ok(mangler.length === 0, 'hver replikk har et klipp (mangler: ' + mangler.slice(0, 8).join(' | ') + ')');
  ok(foreldet.length === 0, 'ingen klipp som ingen replikk bruker (' + foreldet.slice(0, 8).join(' | ') + ')');
  var borte = pakken.filter(function (n) {
    return !fs.existsSync(sti.join(t.ROT, 'lyd', c.LYDFILER[n]));
  });
  ok(borte.length === 0, 'hver fil i manifestet finnes i lyd/ (' + borte.slice(0, 5).join(', ') + ')');

  /* Hver el('x') i js/ må finnes som id i index.html – én manglende id
   * stopper all hendelseskobling etter seg. */
  var html = fs.readFileSync(sti.join(t.ROT, 'index.html'), 'utf8');
  var ider = {};
  fs.readdirSync(sti.join(t.ROT, 'js')).forEach(function (f) {
    var kode = fs.readFileSync(sti.join(t.ROT, 'js', f), 'utf8');
    var re = /\b(?:el|pa|alle)\('([^']+)'/g, m;
    while ((m = re.exec(kode))) ider[m[1]] = true;
  });
  var uten = Object.keys(ider).filter(function (id) { return html.indexOf('id="' + id + '"') === -1; });
  ok(uten.length === 0, 'hver id koden slår opp finnes i index.html (' + uten.join(', ') + ')');

  /* ---------- i nettleseren: hør hva spillet faktisk sier ---------- */
  var lagret = hjelp.lagring({ barnenavn: 'Ida', innstillinger: { visAlleModuser: true } });
  var side = await t.nySide({ lagret: lagret });
  await side.evaluate(function () {
    window.__sagt = [];
    window.__mangler = [];
    var har = Lydbank.har;
    Lydbank.har = function (tekst) {
      var svar = har(tekst);
      if (!svar) window.__mangler.push(tekst);
      return svar;
    };
    /* Klippene «spilles» på 50 ms i den falske klokka. */
    Lydbank.spill = function (tekst) {
      window.__sagt.push(tekst);
      return new Promise(function (f) { setTimeout(f, 50); });
    };
  });
  function sagt() { return side.evaluate(function () { return window.__sagt.slice(); }); }
  function nullstill() { return side.evaluate(function () { window.__sagt = []; }); }

  var steder = await side.locator('#start-kart .kartsted .kartsted-navn').allTextContents();
  for (var i = 0; i < steder.length; i++) {
    await nullstill();
    await hjelp.tilVerden(side, steder[i]);
    await side.clock.runFor(1500);
    var hilsen = await sagt();
    ok(hilsen.some(function (x) { return /^Hei/.test(x); }) &&
       hilsen.indexOf('Hva vil du gjøre?') !== -1,
       steder[i] + ': etter navnevalget hilser figuren og spør hva han vil gjøre (' + hilsen.join(' / ') + ')');

    var moduser = await side.locator('#meny-valg .flis .flis-navn').allTextContents();
    for (var m = 0; m < moduser.length; m++) {
      await hjelp.velgModus(side, moduser[m]);
      var skjerm = await hjelp.skjerm(side);
      if (skjerm === 'skjerm-utforsk') {
        var n = await side.locator('#utforsk-rutenett .bokstav').count();
        for (var k = 0; k < n; k++) {
          await side.locator('#utforsk-rutenett .bokstav').nth(k).click();
          await side.clock.runFor(1200);
        }
      } else if (skjerm === 'skjerm-loype') {
        await side.clock.runFor(4200 * 3);
      } else if (skjerm === 'skjerm-oppgave') {
        await hjelp.spillRunde(side);
        await side.clock.runFor(2000);
        /* Går man rett videre, skal ikke rosen fra forrige runde komme etter. */
        await nullstill();
        await side.locator('#oppsum-tilbake').click();
        await side.clock.runFor(1500);
        var etter = await sagt();
        ok(!etter.some(function (x) { return /^Bra jobbet|Den kan du nå|Det er navnet ditt/.test(x); }),
           steder[i] + '/' + moduser[m] + ': ingen ros fra runden etter at man gikk tilbake (' + etter.join(' / ') + ')');
        continue;
      }
      await hjelp.tilbake(side);
    }
    await hjelp.tilbake(side);
  }

  /* Rask vei ut av oppsummeringen: rosen er forsinket med vilje, og skal
   * ikke komme midt i det neste han gjør. */
  await hjelp.tilVerden(side, 'Racerbanen');
  await hjelp.velgModus(side, 'Finn bokstaven');
  await hjelp.spillRunde(side);
  await side.clock.runFor(100);
  await side.locator('#oppsum-igjen').click();
  await nullstill();
  await side.clock.runFor(2500);
  var nyRunde = await sagt();
  ok(!nyRunde.some(function (x) { return /^Bra jobbet|Den kan du nå/.test(x); }),
     'ingen ros fra forrige runde inn i den neste (' + nyRunde.join(' / ') + ')');

  var tause = await side.evaluate(function () { return window.__mangler; });
  var unike = tause.filter(function (x, i) { return tause.indexOf(x) === i; });
  ok(unike.length === 0, 'alt spillet prøvde å si har et klipp (' + unike.join(' | ') + ')');
  ok(side.feil.length === 0, 'ingen feil i konsollen' + (side.feil.length ? ' – ' + side.feil.join(' | ') : ''));
  await side.context().close();
};
