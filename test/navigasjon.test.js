/* Hvert sted på kartet, hver modus på menyen, og en hel runde der det finnes
 * en. Pluss feilene som bare synes når man går ut og inn igjen. */
'use strict';

module.exports = async function (t) {
  var ok = t.ok, hjelp = t.hjelp;
  /* Alle modusene framme, et navn til «Navnet mitt», og stemmen av – her
   * testes flyten, stemmen har sin egen test. */
  var lagret = hjelp.lagring({
    barnenavn: 'Ida',
    innstillinger: { stemme: false, visAlleModuser: true }
  });

  var steder = await (async function () {
    var s = await t.nySide({ lagret: lagret });
    var navn = await s.locator('#start-kart .kartsted .kartsted-navn').allTextContents();
    await s.context().close();
    return navn;
  })();
  ok(steder.length >= 3, 'kartet har minst tre steder (fant ' + steder.join(', ') + ')');

  for (var i = 0; i < steder.length; i++) {
    var sted = steder[i];
    var side = await t.nySide({ lagret: lagret });
    await hjelp.tilVerden(side, sted);
    ok(await hjelp.skjerm(side) === 'skjerm-meny', sted + ': menyen vises etter navnevalget');

    var moduser = await side.locator('#meny-valg .flis .flis-navn').allTextContents();
    ok(moduser.length >= 4, sted + ': minst fire moduser på menyen (' + moduser.join(', ') + ')');

    for (var m = 0; m < moduser.length; m++) {
      var modus = moduser[m];
      await hjelp.velgModus(side, modus);
      var skjerm = await hjelp.skjerm(side);

      if (skjerm === 'skjerm-utforsk') {
        await side.locator('#utforsk-rutenett .bokstav').nth(1).click();
        await side.clock.runFor(300);
        var vist = (await side.locator('#utforsk-bokstav').textContent()).trim();
        var ventet = await side.locator('#utforsk-rutenett .bokstav').nth(1).getAttribute('data-bokstav');
        ok(vist === ventet, sted + '/' + modus + ': kortet viser tegnet som ble trykket (' + vist + ')');
      } else if (skjerm === 'skjerm-loype') {
        await side.clock.runFor(3600);
        var teller = await side.locator('#loype-teller').textContent();
        ok(/^2 av/.test(teller), sted + '/' + modus + ': nedtellingen går videre av seg selv (' + teller + ')');
      } else if (skjerm === 'skjerm-oppgave') {
        ok(await hjelp.spillRunde(side), sted + '/' + modus + ': runden kan spilles helt til oppsummeringen');
        var tente = await side.locator('#oppsum-stjerner .tent').count();
        var alle = await side.locator('#oppsum-stjerner .oppsum-stjerne').count();
        ok(alle > 0 && tente === alle, sted + '/' + modus + ': alle stjernene tent når alt satt første gang (' + tente + '/' + alle + ')');
        var rekkefolge = await side.evaluate(function () {
          var tegn = Array.prototype.map.call(document.querySelectorAll('#oppsum-brikker .oppsum-brikke b'),
            function (b) { return b.textContent; });
          var verden = document.body.getAttribute('data-verden');
          var sortert = tegn.slice().sort(function (a, b) {
            return tegnFor(verden).indexOf(a) - tegnFor(verden).indexOf(b);
          });
          return { tegn: tegn.join(','), riktig: document.getElementById('oppsum-brikker').classList.contains('oppsum-brikker--navn') || tegn.join() === sortert.join() };
        });
        ok(rekkefolge.riktig, sted + '/' + modus + ': oppsummeringen står i tegnsettets rekkefølge (' + rekkefolge.tegn + ')');
      } else {
        ok(false, sted + '/' + modus + ': ukjent skjerm ' + skjerm);
      }

      await hjelp.tilbake(side);
      ok(await hjelp.skjerm(side) === 'skjerm-meny', sted + '/' + modus + ': pila tilbake fører til menyen');
    }

    await hjelp.tilbake(side);
    ok(await hjelp.skjerm(side) === 'skjerm-start', sted + ': pila fra menyen fører hjem til kartet');
    ok(side.feil.length === 0, sted + ': ingen feil i konsollen' + (side.feil.length ? ' – ' + side.feil.join(' | ') : ''));
    await side.context().close();
  }

  /* ---------- nedtellingen skal dø når man forlater runden ----------
   *
   * Går man ut gjennom foreldremenyen, ble nedtellingen stående og tikke. En
   * gammel tikk hoppet da over en oppgave i neste runde. */
  var s2 = await t.nySide({ lagret: lagret });
  await hjelp.tilVerden(s2, 'Racerbanen');
  await hjelp.velgModus(s2, 'Finn bokstaven');
  await hjelp.svarRiktig(s2);
  await s2.clock.runFor(500);
  await s2.locator('#tannhjul').click();
  await s2.locator('#voksenboble-apne').click();
  var etiketter = (await s2.locator('#inn-navn-figurer label').allTextContents()).join(', ');
  ok(/Racerbilen/.test(etiketter) && /Kapteinen/.test(etiketter) && /Dinosauren/.test(etiketter) && /Tauebilen/.test(etiketter),
     'foreldremenyen har ett navnefelt per figur, merket med figuren (' + etiketter + ')');
  await s2.locator('#foreldre-lukk').click();
  await s2.clock.runFor(200);
  ok(await hjelp.skjerm(s2) === 'skjerm-meny', 'foreldremenyen lukkes til menyen');
  await hjelp.velgModus(s2, 'Finn bokstaven');
  await s2.clock.runFor(4000);
  var naIndeks = await hjelp.oppgaveNr(s2);
  ok(naIndeks === 0, 'ny runde etter foreldremenyen står fortsatt på første oppgave (sto på ' + naIndeks + ')');

  /* Samme for løypa: den skal ikke gå videre i bakgrunnen og flytte figuren
   * rundt på menyen. */
  await hjelp.tilbake(s2);
  await hjelp.velgModus(s2, 'Alfabetløypa');
  await s2.locator('#tannhjul').click();
  await s2.locator('#voksenboble-apne').click();
  await s2.locator('#foreldre-lukk').click();
  await s2.clock.runFor(200);
  var for_ = await s2.locator('#figur').evaluate(function (f) { return f.style.transform; });
  await s2.clock.runFor(7000);
  var etter = await s2.locator('#figur').evaluate(function (f) { return f.style.transform; });
  ok(for_ === etter, 'løypa står stille etter at man gikk ut via foreldremenyen (' + for_ + ' → ' + etter + ')');
  ok(s2.feil.length === 0, 'ingen feil i konsollen etter foreldremenyen' + (s2.feil.length ? ' – ' + s2.feil.join(' | ') : ''));
  await s2.context().close();

  /* ---------- «Hent»: for mange, for få, og hjelpen som sørger for at
   * runden alltid ender med at han klarte det ---------- */
  var s6 = await t.nySide({ lagret: lagret });
  await hjelp.tilVerden(s6, 'Verkstedet');
  await hjelp.velgModus(s6, 'Hent');
  function hentTilstand() {
    return s6.evaluate(function () {
      var g = document.querySelector('#oppgave-valg .skilt--garasje');
      return {
        n: parseInt(g.querySelector('.garasje-tall').textContent, 10),
        biler: document.querySelectorAll('#oppgave-mal .ting').length,
        hentet: document.querySelectorAll('#oppgave-mal .ting.talt').length,
        plasser: g.querySelectorAll('.garasje-plass').length,
        pekes: g.classList.contains('pekes'),
        riktig: g.classList.contains('riktig')
      };
    });
  }
  await hjelp.vaken(s6);
  var h = await hentTilstand();
  ok(h.biler > h.n && h.biler <= Math.min(10, h.n + 3), 'Hent: flere biler enn han skal hente (' + h.biler + ' biler, hent ' + h.n + ')');
  var biler = s6.locator('#oppgave-mal .ting');
  for (var b = 0; b <= h.n; b++) { await biler.nth(b).click(); await s6.clock.runFor(60); }
  await s6.locator('#oppgave-valg .skilt--garasje').click();
  await s6.clock.runFor(200);
  h = await hentTilstand();
  ok(h.hentet === 0, 'Hent: for mange – bilene kjøres ut igjen (' + h.hentet + ' igjen)');
  ok(h.plasser === h.n, 'Hent: med hjelp viser garasjen ' + h.n + ' plasser (' + h.plasser + ')');
  for (var c = 0; c <= h.n; c++) { await biler.nth(c).click(); await s6.clock.runFor(60); }
  h = await hentTilstand();
  ok(h.hentet === h.n, 'Hent: med hjelp kan han ikke hente flere enn garasjen vil ha (' + h.hentet + '/' + h.n + ')');
  ok(h.pekes, 'Hent: garasjen viser at den er full');
  await s6.locator('#oppgave-valg .skilt--garasje').click();
  await s6.clock.runFor(200);
  h = await hentTilstand();
  ok(h.riktig, 'Hent: riktig antall levert er riktig svar');

  /* For få: det han har hentet blir stående, og garasjen ber om flere. */
  await hjelp.ventTil(s6, function (forrige) {
    var p = document.querySelectorAll('#oppgave-prikker .prikk');
    return p[1] && p[1].classList.contains('na');
  });
  await s6.clock.runFor(300);
  await hjelp.vaken(s6);
  h = await hentTilstand();
  await biler.nth(0).click();
  await s6.clock.runFor(60);
  if (h.n > 1) {
    await s6.locator('#oppgave-valg .skilt--garasje').click();
    await s6.clock.runFor(200);
    var fa = await hentTilstand();
    ok(fa.hentet === 1 && !fa.riktig, 'Hent: for få – det han har hentet blir stående (' + fa.hentet + ')');
  }
  ok(s6.feil.length === 0, 'Hent: ingen feil i konsollen' + (s6.feil.length ? ' – ' + s6.feil.join(' | ') : ''));
  await s6.context().close();

  /* ---------- figuren viser hva som skjedde ----------
   * Glad ved riktig svar, «hmm» ved bom, vanlig igjen på menyen – og
   * pupillene ser mot fingeren. */
  var s4 = await t.nySide({ lagret: lagret });
  await hjelp.tilVerden(s4, 'Racerbanen');
  await hjelp.velgModus(s4, 'Finn bokstaven');
  function ansikt() {
    return s4.evaluate(function () { return document.getElementById('figur').dataset.uttrykk || 'vanlig'; });
  }
  var fasit = await hjelp.fasit(s4);
  await hjelp.vaken(s4);
  await s4.locator('#oppgave-valg .skilt:not([data-bokstav="' + fasit + '"])').first().click();
  await s4.clock.runFor(200);
  ok(await ansikt() === 'hmm', 'figuren ser «hmm» ut etter et bom (' + await ansikt() + ')');
  /* Ber han om å høre det igjen mens hjelpen sies, skal pulsen likevel
   * komme når skiltene våkner. */
  await s4.evaluate(function () { Moduser.Oppgave.gjentaSporsmal(); });
  await s4.clock.runFor(2000);
  ok(await ansikt() === 'vanlig', '«hmm» går over av seg selv (' + await ansikt() + ')');
  await hjelp.ventTil(s4, function (v) {
    var k = document.querySelector(v); return k && !k.disabled;
  }, '#oppgave-valg .skilt[data-bokstav="' + fasit + '"]');
  await hjelp.vaken(s4);
  ok(await s4.locator('#oppgave-valg .skilt.pekes').count() === 1, 'hjelpen peker fortsatt på svaret etter «hør igjen»');
  var forHjelp = await s4.locator('#figur').evaluate(function (f) { return f.style.transform; });
  await s4.locator('#oppgave-valg .skilt[data-bokstav="' + fasit + '"]').click();
  await s4.clock.runFor(200);
  /* Riktig etter hjelp er bevisst roligere enn å klare det selv. */
  ok(await ansikt() === 'vanlig', 'etter hjelp blir figuren ikke glad (' + await ansikt() + ')');
  var etterHjelp = await s4.locator('#figur').evaluate(function (f) { return f.style.transform; });
  ok(forHjelp === etterHjelp, 'etter hjelp kjører ikke figuren (' + forHjelp + ' → ' + etterHjelp + ')');
  ok(await s4.locator('#oppgave-valg .skilt.riktig.rolig').count() === 1, 'etter hjelp spretter ikke skiltet');
  await hjelp.ventTil(s4, function () {
    var p = document.querySelectorAll('#oppgave-prikker .prikk');
    return p[1] && p[1].classList.contains('na');
  });
  await hjelp.svarRiktig(s4);
  await s4.clock.runFor(200);
  ok(await ansikt() === 'glad', 'figuren blir glad ved riktig svar på første forsøk (' + await ansikt() + ')');
  await hjelp.tilbake(s4);
  ok(await ansikt() === 'vanlig', 'på menyen er ansiktet vanlig igjen (' + await ansikt() + ')');

  var blikk = await s4.evaluate(function () {
    var f = document.querySelector('#figur svg.fig');
    var r = f.getBoundingClientRect();
    document.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.right + 300, clientY: r.top }));
    return parseFloat(f.style.getPropertyValue('--se-x'));
  });
  ok(blikk > 0 && blikk <= 1.6, 'pupillene ser mot fingeren, og ikke ut av øyet (--se-x ' + blikk + ')');
  await s4.clock.runFor(1700);
  var tilbakeIgjen = await s4.evaluate(function () {
    return document.querySelector('#figur svg.fig').style.getPropertyValue('--se-x');
  });
  ok(tilbakeIgjen === '', 'etter litt ser pupillene rett fram igjen (' + tilbakeIgjen + ')');
  ok(s4.feil.length === 0, 'ingen feil i konsollen med ansikt og blikk' + (s4.feil.length ? ' – ' + s4.feil.join(' | ') : ''));
  await s4.context().close();

  /* ---------- «lytt først» og «tell først» ----------
   * Skiltene sover mens spørsmålet leses, og i Tell til alt er talt. Et
   * trykk – også fra tastaturet – gjør ingenting da. */
  var s7 = await t.nySide({ lagret: lagret });
  await hjelp.tilVerden(s7, 'Racerbanen');
  await hjelp.velgModus(s7, 'Finn bokstaven');
  var sover = await s7.evaluate(function () {
    var skjerm = document.getElementById('skjerm-oppgave');
    var skilt = document.querySelector('#oppgave-valg .skilt');
    var r = skilt.getBoundingClientRect();
    var under = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    skilt.click();
    return { lytter: skjerm.classList.contains('lytter'), treff: under === skilt,
             svart: skilt.classList.contains('feil') || skilt.classList.contains('riktig') };
  });
  ok(sover.lytter && !sover.treff && !sover.svart, 'mens spørsmålet leses, sover skiltene og et trykk gjør ingenting (' + JSON.stringify(sover) + ')');
  var tast = await s7.locator('#oppgave-valg .skilt').first().getAttribute('data-bokstav');
  /* Sendt direkte: Playwright kjenner ikke Æ, Ø og Å som taster. */
  await s7.evaluate(function (k) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  }, tast);
  ok(await s7.locator('#oppgave-valg .skilt.feil, #oppgave-valg .skilt.riktig').count() === 0, 'tastaturet kan heller ikke svare mens spørsmålet leses');
  await s7.clock.runFor(1400);
  ok(await s7.evaluate(function () { return !document.getElementById('skjerm-oppgave').classList.contains('lytter'); }),
     'uten stemme våkner skiltene etter litt over ett sekund');
  /* «Hør igjen» er skjult når stemmen er av; spørsmålstegnet gjør det samme. */
  await s7.locator('#oppgave-mal').click();
  ok(await s7.evaluate(function () { return document.getElementById('skjerm-oppgave').classList.contains('lytter'); }),
     'å høre spørsmålet igjen legger skiltene til å sove til det er lest');
  await hjelp.tilbake(s7);
  await hjelp.tilbake(s7);

  await hjelp.tilVerden(s7, 'Dinodalen');
  await hjelp.velgModus(s7, 'Tell');
  await hjelp.vaken(s7);
  ok(await s7.locator('#oppgave-valg.sover').count() === 1, 'i Tell sover tallskiltene før han har talt');
  var ting = s7.locator('#oppgave-mal .ting');
  var antallTing = await ting.count();
  for (var k = 0; k < antallTing; k++) { await ting.nth(k).click(); await s7.clock.runFor(60); }
  ok(await s7.locator('#oppgave-valg.sover').count() === 0, 'når alt er talt, våkner tallskiltene');
  await ting.nth(0).click();
  ok(await s7.locator('#oppgave-valg.sover').count() === 1, 'angrer han en, sover de igjen til alt er talt');
  ok(s7.feil.length === 0, 'lytt først / tell først: ingen feil' + (s7.feil.length ? ' – ' + s7.feil.join(' | ') : ''));
  await s7.context().close();

  /* ---------- pausen ----------
   * Etter fire runder er figuren trøtt, og «en runde til» er borte. */
  var s8 = await t.nySide({ lagret: lagret });
  await hjelp.tilVerden(s8, 'Racerbanen');
  await hjelp.velgModus(s8, 'Finn bokstaven');
  for (var runde = 1; runde <= 4; runde++) {
    await hjelp.spillRunde(s8);
    await s8.clock.runFor(1500);
    var oppsum = await s8.evaluate(function () {
      return { igjen: !document.getElementById('oppsum-igjen').hidden,
               ansikt: document.getElementById('figur').dataset.uttrykk || 'vanlig' };
    });
    if (runde < 4) {
      ok(oppsum.igjen && oppsum.ansikt === 'glad', 'runde ' + runde + ': glad figur, og en runde til går an (' + JSON.stringify(oppsum) + ')');
      await s8.locator('#oppsum-igjen').click();
      await s8.clock.runFor(300);
    } else {
      ok(!oppsum.igjen && oppsum.ansikt === 'trott', 'runde 4: figuren er trøtt, og «en runde til» er borte (' + JSON.stringify(oppsum) + ')');
      await s8.locator('#figur').click();
      await s8.clock.runFor(1500);
      await s8.setViewportSize({ width: 1024, height: 700 });
      await s8.clock.runFor(300);
      var fortsatt = await s8.evaluate(function () { return document.getElementById('figur').dataset.uttrykk || 'vanlig'; });
      ok(fortsatt === 'trott', 'pausen står seg når han trykker på figuren og skjermen endrer størrelse (' + fortsatt + ')');
    }
  }
  ok(s8.feil.length === 0, 'pausen: ingen feil' + (s8.feil.length ? ' – ' + s8.feil.join(' | ') : ''));
  await s8.context().close();

  /* ---------- overraskelsene på kartet ----------
   * Et trykk spiller et øyeblikk og stopper; et trykk til mens den spiller,
   * gjør ingenting; og ingenting går av seg selv. */
  var s9 = await t.nySide({ lagret: lagret });
  var hvaListe = await s9.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('.overraskelse'), function (o) {
      return o.getAttribute('data-hva');
    });
  });
  ok(hvaListe.length === 6, 'kartet har seks overraskelser (' + hvaListe.join(', ') + ')');

  /* Figurene er tegnet på nytt i 2,5D. Det som får dem til å leve, må
   * fortsatt være der – og ingen id i dokumentet kan finnes to ganger, ellers
   * blir en gradient borte. */
  var figurFeil = await s9.evaluate(function () {
    var ut = [], ider = {};
    document.querySelectorAll('[id]').forEach(function (e) {
      if (ider[e.id]) ut.push('dobbel id ' + e.id);
      ider[e.id] = true;
    });
    ['bane', 'oy', 'dino', 'taue'].forEach(function (v) {
      var svg = document.querySelector('.kartsted--' + v + ' svg.fig');
      ['u-vanlig', 'u-glad', 'u-hmm', 'u-trott'].forEach(function (u) {
        if (!svg.querySelector('.' + u)) ut.push(v + ' mangler ' + u);
      });
      if (!svg.querySelector('.pupill')) ut.push(v + ' mangler pupiller');
    });
    ['bane', 'taue'].forEach(function (v) {
      if (document.querySelectorAll('.kartsted--' + v + ' svg.fig .hjul').length < 2) ut.push(v + ' mangler hjul');
    });
    return ut;
  });
  ok(figurFeil.length === 0, 'figurene har uttrykk, pupiller og hjul, og ingen id er dobbel (' + figurFeil.join('; ') + ')');
  for (var o = 0; o < hvaListe.length; o++) {
    var hva = hvaListe[o];
    var sentrum = await s9.evaluate(function (h) {
      var r = document.querySelector('.overraskelse[data-hva="' + h + '"] .treff').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, hva);
    await s9.mouse.click(sentrum.x, sentrum.y);
    var spiller = await s9.evaluate(function (h) {
      return document.querySelector('.overraskelse[data-hva="' + h + '"]').classList.contains('spiller');
    }, hva);
    ok(spiller, 'overraskelsen ' + hva + ' spiller når han trykker');
    await s9.clock.runFor(1500);
    var ferdig = await s9.evaluate(function (h) {
      return !document.querySelector('.overraskelse[data-hva="' + h + '"]').classList.contains('spiller');
    }, hva);
    ok(ferdig, 'overraskelsen ' + hva + ' er ferdig etter et øyeblikk');
  }
  ok(await hjelp.skjerm(s9) === 'skjerm-start', 'overraskelsene tar ham ikke bort fra kartet');
  ok(s9.feil.length === 0, 'overraskelsene: ingen feil' + (s9.feil.length ? ' – ' + s9.feil.join(' | ') : ''));
  await s9.context().close();

  /* ---------- «Ro på skjermen» ----------
   * Med bevegelse av skal ingenting på forsiden gå i sløyfe. */
  var s3 = await t.nySide({ lagret: hjelp.lagring({ innstillinger: { bevegelse: false } }) });
  var loper = await s3.evaluate(function () {
    return Array.prototype.filter.call(document.querySelectorAll('#skjerm-start *'), function (e) {
      var st = getComputedStyle(e);
      return st.animationName !== 'none' && st.animationIterationCount === 'infinite';
    }).map(function (e) { return e.className.baseVal !== undefined ? e.className.baseVal : e.className; });
  });
  ok(loper.length === 0, 'med «bevegelse» av går ingenting i sløyfe på forsiden (' + loper.join(', ') + ')');

  /* Og ikke i verdenen heller: landskapet står stille selv når figuren kjører. */
  await hjelp.tilVerden(s3, 'Racerbanen');
  await hjelp.velgModus(s3, 'Garasjen');
  await s3.locator('#utforsk-rutenett .bokstav').last().click();
  var lag = await s3.evaluate(function () {
    return getComputedStyle(document.querySelector('.scene-landskap .lag--fram')).transform;
  });
  ok(lag === 'none', 'med «bevegelse» av glir ikke landskapet når figuren kjører (' + lag + ')');
  await s3.context().close();

  /* Med bevegelse på glir det nære laget bakover når figuren kjører framover. */
  var s5 = await t.nySide({ lagret: lagret });
  await hjelp.tilVerden(s5, 'Racerbanen');
  await hjelp.velgModus(s5, 'Garasjen');
  await s5.locator('#utforsk-rutenett .bokstav').last().click();
  await s5.clock.runFor(1200);
  await s5.waitForTimeout(1100);
  var forskyvning = await s5.evaluate(function () {
    return new DOMMatrix(getComputedStyle(document.querySelector('.scene-landskap .lag--fram')).transform).m41;
  });
  ok(forskyvning < -5 && forskyvning >= -160, 'landskapet glir i dybden når figuren kjører (' + forskyvning.toFixed(1) + ' px)');
  await s5.context().close();
};
