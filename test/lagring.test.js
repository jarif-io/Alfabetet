/* Oppgraderingsveien, ikke bare fersk installasjon: familien har spilt i
 * uker, og det de har lagret skal overleve at spillet blir nyere – og at en
 * gammel kopi i hurtigbufferen plutselig åpnes igjen. */
'use strict';

var TRE_DAGER = ['2026-01-01', '2026-01-02', '2026-01-03'];

module.exports = async function (t) {
  var ok = t.ok, hjelp = t.hjelp;

  async function sjekk(beskrivelse, lagret, forventNavn) {
    var side = await t.nySide({ lagret: lagret });
    await side.locator('#start-kart .kartsted', { hasText: 'Racerbanen' }).click();
    await side.clock.runFor(500);
    var skjerm = await hjelp.skjerm(side);
    if (forventNavn) {
      ok(skjerm === 'skjerm-meny', beskrivelse + ': navnet huskes, rett til menyen (' + skjerm + ')');
      var tittel = await side.locator('#topp-tittel').textContent();
      ok(tittel.indexOf(forventNavn) !== -1, beskrivelse + ': figuren heter fortsatt ' + forventNavn + ' (' + tittel + ')');
      var teller = await side.locator('#teller-tall').textContent();
      ok(teller === '1', beskrivelse + ': B som var mestret, er det fortsatt (' + teller + ')');
    } else {
      ok(skjerm === 'skjerm-navn' || skjerm === 'skjerm-meny', beskrivelse + ': spillet kommer i gang (' + skjerm + ')');
    }
    ok(side.feil.length === 0, beskrivelse + ': ingen feil' + (side.feil.length ? ' – ' + side.feil.join(' | ') : ''));
    return side;
  }

  var framgang = { B: { riktig: 3, feil: 0, dager: TRE_DAGER } };

  var s = await sjekk('fersk installasjon', undefined, null);
  await s.context().close();

  s = await sjekk('versjon 1 (uten versjonsnummer)',
    JSON.stringify({ navn: { bane: 'Lynet' }, framgang: framgang, innstillinger: { stemme: false } }), 'Lynet');
  var lest = await hjelp.lest(s);
  ok(lest && lest.framgang.B && lest.framgang.B.dager.length === 3, 'versjon 1: framgangen ligger lagret etter migreringen');
  await s.context().close();

  s = await sjekk('versjon 6',
    hjelp.lagring({ navn: { bane: 'Bulder' }, framgang: framgang, innstillinger: { stemme: false } }), 'Bulder');
  await s.context().close();

  s = await sjekk('ødelagt lagring', '{ikke json', null);
  await s.context().close();

  /* En gammel kopi fra hurtigbufferen skal ikke skrive ned et lavere
   * versjonsnummer – da ville en nyere versjon kjørt migreringene sine om
   * igjen neste gang og overskrevet valgene familien har gjort. */
  s = await sjekk('lagring fra en nyere versjon',
    JSON.stringify({ versjon: 99, navn: { bane: 'Rappen' }, framgang: framgang, innstillinger: { stemme: false } }), 'Rappen');
  await hjelp.velgModus(s, 'Finn bokstaven');
  await hjelp.svarRiktig(s);
  await s.clock.runFor(300);
  lest = await hjelp.lest(s);
  ok(lest && lest.versjon === 99, 'nyere lagring beholder versjonsnummeret sitt (' + (lest && lest.versjon) + ')');
  ok(lest && lest.framgang.B.dager.length === 3, 'nyere lagring: framgangen er urørt');
  await s.context().close();

  /* En skadet oppføring i framgangen skal ikke velte menyen eller samlingen. */
  s = await t.nySide({ lagret: hjelp.lagring({
    navn: { bane: 'Turbo' },
    framgang: { A: { riktig: 2 }, B: framgang.B, C: null },
    innstillinger: { stemme: false }
  }) });
  await s.locator('#start-kart .kartsted', { hasText: 'Racerbanen' }).click();
  await s.clock.runFor(500);
  ok(await hjelp.skjerm(s) === 'skjerm-meny', 'skadet framgang: menyen vises');
  await s.locator('#stjerneteller').click();
  await s.clock.runFor(300);
  ok(await hjelp.skjerm(s) === 'skjerm-samling', 'skadet framgang: samlingen vises');
  ok(s.feil.length === 0, 'skadet framgang: ingen feil' + (s.feil.length ? ' – ' + s.feil.join(' | ') : ''));
  await s.context().close();

  /* Nullstill: holdes inne i to sekunder, og da er alt borte. */
  s = await t.nySide({ lagret: hjelp.lagring({ navn: { bane: 'Turbo' }, framgang: framgang }) });
  await s.locator('#tannhjul').click();
  await s.locator('#voksenboble-apne').click();
  var knapp = s.locator('#inn-nullstill');
  var r = await knapp.boundingBox();
  await s.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await s.mouse.down();
  await s.clock.runFor(2200);
  await s.mouse.up();
  lest = await hjelp.lest(s);
  ok(lest && !lest.navn.bane && !Object.keys(lest.framgang).length, 'nullstill etter to sekunder tømmer navn og framgang');
  ok(await hjelp.skjerm(s) === 'skjerm-start', 'nullstill fører hjem til kartet');
  await s.context().close();
};
