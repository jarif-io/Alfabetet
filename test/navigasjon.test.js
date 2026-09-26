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
  await s2.locator('#foreldre-lukk').click();
  await s2.clock.runFor(200);
  ok(await hjelp.skjerm(s2) === 'skjerm-meny', 'foreldremenyen lukkes til menyen');
  await hjelp.velgModus(s2, 'Finn bokstaven');
  await s2.clock.runFor(4000);
  var naIndeks = await s2.evaluate(function () {
    var p = document.querySelectorAll('#oppgave-prikker .prikk');
    for (var i = 0; i < p.length; i++) if (p[i].classList.contains('na')) return i;
    return -1;
  });
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
  await s3.context().close();
};
