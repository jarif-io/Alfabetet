/* Oppdagerøya – testene
 *
 * Kjører spillet i en ekte nettleser (Chromium via Playwright), rett fra
 * file:// slik forelderen åpner det, og teller påstander. Ingen package.json
 * og ingenting å installere i spillet: Playwright hentes fra den globale
 * installasjonen.
 *
 *   NODE_PATH=$(npm root -g) node test/kjor.js           alle testene
 *   NODE_PATH=$(npm root -g) node test/kjor.js layout    bare layout.test.js
 *
 * Nettleserens klokke er falsk (side.clock): nedtellingen på tre sekunder
 * spoles fram i stedet for å ventes på, så en hel runde tar et øyeblikk.
 */
'use strict';

var fs = require('fs');
var sti = require('path');
var chromium = require('playwright').chromium;

var ROT = sti.resolve(__dirname, '..');
var ADRESSE = 'file://' + sti.join(ROT, 'index.html');
var NOKKEL = 'bokstavlopet.v1';

var antall = 0;
var feil = [];

function ok(betingelse, melding) {
  antall += 1;
  if (!betingelse) {
    feil.push(melding);
    console.log('  ✗ ' + melding);
  }
}

/* Lagret tilstand å starte fra. Tom = fersk installasjon. */
function lagring(felt) {
  return JSON.stringify(Object.assign({ versjon: 6 }, felt));
}

var nettleser = null;

/* En ny side i egen kontekst, så lagringen ikke lekker mellom testene.
 * `lagret` legges i localStorage før spillet laster – men bare første gang,
 * så en omlasting viser hva spillet selv skrev. */
async function nySide(valg) {
  valg = valg || {};
  var kontekst = await nettleser.newContext({
    viewport: valg.viewport || { width: 1024, height: 768 },
    hasTouch: !!valg.touch,
    isMobile: !!valg.mobil
  });
  if (valg.lagret !== undefined) {
    await kontekst.addInitScript(function (a) {
      if (sessionStorage.getItem('__seedet')) return;
      localStorage.setItem(a.nokkel, a.data);
      sessionStorage.setItem('__seedet', '1');
    }, { nokkel: NOKKEL, data: valg.lagret });
  }
  if (valg.forLast) await kontekst.addInitScript(valg.forLast);
  var side = await kontekst.newPage();
  side.feil = [];
  side.on('pageerror', function (e) { side.feil.push(e.message); });
  side.on('console', function (m) {
    if (m.type() === 'error' || m.type() === 'warning') side.feil.push(m.text());
  });
  await side.clock.install();
  await side.goto(ADRESSE);
  await side.clock.runFor(900);
  return side;
}

/* ---------- hjelpere som klikker slik et barn gjør ---------- */

var hjelp = {
  lagring: lagring,
  NOKKEL: NOKKEL,

  /* Spoler klokka fram til betingelsen i siden er sann. */
  ventTil: async function (side, fn, arg, maksMs) {
    maksMs = maksMs || 15000;
    for (var t = 0; t <= maksMs; t += 100) {
      if (await side.evaluate(fn, arg)) return true;
      await side.clock.runFor(100);
    }
    return false;
  },

  /* Skiltene og tingene sover mens spørsmålet leses («lytt først»). */
  vaken: function (side) {
    return hjelp.ventTil(side, function () {
      return !document.getElementById('skjerm-oppgave').classList.contains('lytter');
    });
  },

  skjerm: function (side) {
    return side.evaluate(function () {
      var s = document.querySelector('.skjerm:not([hidden])');
      return s ? s.id : null;
    });
  },

  tilVerden: async function (side, navn) {
    await side.locator('#start-kart .kartsted', { hasText: navn }).click();
    await side.clock.runFor(400);
    if (await hjelp.skjerm(side) === 'skjerm-navn') {
      await side.locator('#navn-forslag button').first().click();
      await side.clock.runFor(400);
    }
  },

  velgModus: async function (side, navn) {
    await side.locator('#meny-valg .flis', { hasText: navn }).click();
    await side.clock.runFor(600);
  },

  tilbake: async function (side) {
    await side.locator('#tilbake').click();
    await side.clock.runFor(400);
  },

  /* Svaret på oppgaven som står framme, funnet på samme måte som barnet
   * kan: telle tingene, lese bildet, eller trykke på spørsmålstegnet. */
  fasit: async function (side) {
    await hjelp.vaken(side);
    var art = await side.evaluate(function () {
      var mal = document.getElementById('oppgave-mal');
      if (mal.classList.contains('oppdrag-mal--hent')) return 'hent';
      if (mal.classList.contains('oppdrag-mal--tell')) return 'tell';
      if (mal.classList.contains('oppdrag-mal--ord')) return 'ord';
      if (mal.classList.contains('oppdrag-mal--navn')) return 'navn';
      return 'finn';
    });
    /* «Hent»: tallet står på garasjen. Hent akkurat så mange biler. */
    if (art === 'hent') {
      var n = parseInt(await side.locator('#oppgave-valg .garasje-tall').textContent(), 10);
      for (var j = 0; j < n; j++) {
        await side.locator('#oppgave-mal .ting').nth(j).click();
        await side.clock.runFor(60);
      }
      return 'hent';
    }
    if (art === 'tell') {
      var ting = side.locator('#oppgave-mal .ting');
      var n = await ting.count();
      for (var i = 0; i < n; i++) {
        await ting.nth(i).click();
        await side.clock.runFor(60);
      }
      return String(n);
    }
    if (art === 'ord') {
      var ord = (await side.locator('#oppgave-mal .mal-ord').textContent()).trim();
      return ord.charAt(0).toUpperCase();
    }
    await side.locator('#oppgave-mal').click();
    await side.clock.runFor(200);
    if (art === 'navn') {
      return (await side.locator('#oppgave-mal .navnrute.na').textContent()).trim();
    }
    return (await side.locator('#oppgave-mal').textContent()).trim();
  },

  /* Venter til skiltene kan trykkes på, og trykker på riktig. */
  svarRiktig: async function (side) {
    var fasit = await hjelp.fasit(side);
    var velger = fasit === 'hent'
      ? '#oppgave-valg .skilt--garasje'
      : '#oppgave-valg .skilt[data-bokstav="' + fasit + '"]';
    var klar = await hjelp.ventTil(side, function (v) {
      var k = document.querySelector(v);
      return k && !k.disabled && getComputedStyle(k).pointerEvents !== 'none';
    }, velger);
    if (!klar) {
      throw new Error('fant ikke et trykkbart skilt for «' + fasit + '»: ' +
        await side.evaluate(function () {
          return document.getElementById('oppgave-mal').outerHTML + ' | ' +
                 document.getElementById('oppgave-valg').innerHTML;
        }));
    }
    await side.locator(velger).click();
    return fasit;
  },

  /* Hvilken oppgave i runden som står framme (0, 1, 2 …). */
  oppgaveNr: function (side) {
    return side.evaluate(function () {
      var p = document.querySelectorAll('#oppgave-prikker .prikk');
      for (var i = 0; i < p.length; i++) if (p[i].classList.contains('na')) return i;
      return -1;
    });
  },

  /* Hele runden fram til oppsummeringen. Etter hvert svar venter vi til
   * neste oppgave faktisk står framme – nedtellingen tar sin tid. */
  spillRunde: async function (side) {
    for (var i = 0; i < 12; i++) {
      if (await hjelp.skjerm(side) !== 'skjerm-oppgave') break;
      var nr = await hjelp.oppgaveNr(side);
      await hjelp.svarRiktig(side);
      await hjelp.ventTil(side, function (forrige) {
        if (!document.getElementById('skjerm-oppsummering').hidden) return true;
        var p = document.querySelectorAll('#oppgave-prikker .prikk');
        for (var i = 0; i < p.length; i++) if (p[i].classList.contains('na')) return i !== forrige;
        return false;
      }, nr);
      await side.clock.runFor(300);
    }
    return (await hjelp.skjerm(side)) === 'skjerm-oppsummering';
  },

  lest: function (side) {
    return side.evaluate(function (n) {
      return JSON.parse(localStorage.getItem(n) || 'null');
    }, NOKKEL);
  }
};

async function main() {
  var filtre = process.argv.slice(2);
  var filer = fs.readdirSync(__dirname)
    .filter(function (f) { return /\.test\.js$/.test(f); })
    .filter(function (f) {
      return !filtre.length || filtre.some(function (x) { return f.indexOf(x) === 0; });
    })
    .sort();

  nettleser = await chromium.launch();
  var tomme = [];
  for (var i = 0; i < filer.length; i++) {
    var for_ = antall;
    console.log('▶ ' + filer[i]);
    try {
      await require(sti.join(__dirname, filer[i]))({
        nySide: nySide, ok: ok, hjelp: hjelp, ROT: ROT, ADRESSE: ADRESSE
      });
    } catch (e) {
      ok(false, filer[i] + ' krasjet: ' + (e && e.stack || e));
    }
    var n = antall - for_;
    console.log('  ' + n + ' påstander');
    /* Et skript som «kjørte» uten påstander har ikke testet noe. */
    if (!n) tomme.push(filer[i]);
  }
  await nettleser.close();

  tomme.forEach(function (f) { ok(false, f + ' hadde ingen påstander'); });
  console.log('\n' + (antall - feil.length) + ' av ' + antall + ' påstander holdt.');
  if (feil.length) {
    console.log(feil.length + ' feilet.');
    process.exit(1);
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
