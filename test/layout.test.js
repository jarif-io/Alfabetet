/* Geometri i en matrise av skjermstørrelser: ingenting utenfor, ingenting
 * skjult som vises, trykkflater barnet kan treffe, og kartet som stemmer
 * med tegningen. Mål, ikke inntrykk. */
'use strict';

var SKJERMER = [
  { navn: '360×640', viewport: { width: 360, height: 640 }, mobil: true },
  { navn: '360×780', viewport: { width: 360, height: 780 }, mobil: true },
  { navn: '375×667', viewport: { width: 375, height: 667 }, mobil: true },
  { navn: '375×812', viewport: { width: 375, height: 812 }, mobil: true },
  { navn: '393×852', viewport: { width: 393, height: 852 }, mobil: true },
  { navn: '430×932', viewport: { width: 430, height: 932 }, mobil: true },
  { navn: '667×375 liggende', viewport: { width: 667, height: 375 }, mobil: true },
  { navn: '844×390 liggende', viewport: { width: 844, height: 390 }, mobil: true },
  { navn: '768×1024 iPad', viewport: { width: 768, height: 1024 } },
  { navn: '1024×768 iPad liggende', viewport: { width: 1024, height: 768 } }
];

/* Kjøres i siden. Returnerer en liste med problemer på skjermen som vises. */
function sjekk() {
  var ut = [];
  var B = window.innerWidth;
  if (document.documentElement.scrollWidth > B + 1) {
    ut.push('siden kan rulles sideveis (' + document.documentElement.scrollWidth + ' > ' + B + ')');
  }

  function synlig(e) {
    return e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
           e.getBoundingClientRect().width > 0;
  }
  function navn(e) {
    return (e.id ? '#' + e.id : '') + '.' + String(e.className.baseVal !== undefined ? e.className.baseVal : e.className).trim().split(/\s+/).join('.') +
      ' «' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 14) + '»';
  }

  /* Ingenting med [hidden] skal synes – en klasse som setter display slår
   * ellers ut hidden-attributtet. (Tilbakepila holder plassen sin med
   * visibility: hidden, derfor checkVisibility og ikke offsetWidth.) */
  document.querySelectorAll('[hidden]').forEach(function (e) {
    if (e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
      ut.push('[hidden] men synlig: ' + navn(e));
    }
  });

  /* Alt barnet kan trykke på: minst 44×44 og innenfor skjermen i bredden. */
  var panelApent = !document.getElementById('foreldre').hidden;
  var trykkbart = panelApent
    ? document.querySelectorAll('#foreldre .panel-topp button, #foreldre .panel-bunn button')
    : document.querySelectorAll('#topp button, .skjerm:not([hidden]) button, .skjerm:not([hidden]) .ting, #figur');
  trykkbart.forEach(function (e) {
    if (!synlig(e) || e.disabled) return;
    var r = e.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) {
      ut.push('for liten trykkflate ' + Math.round(r.width) + '×' + Math.round(r.height) + ': ' + navn(e));
    }
    if (r.left < -1 || r.right > B + 1) ut.push('stikker ut i bredden: ' + navn(e));
  });

  /* Tekst som skal leses, skal stå helt – ikke «sju br…». */
  document.querySelectorAll('.ordkort-ord, .flis-navn, .kartsted-navn, .navnbrikke, .skjermtittel').forEach(function (e) {
    if (!synlig(e)) return;
    if (e.scrollWidth > e.clientWidth + 1) ut.push('tekst kuttes: ' + navn(e));
  });

  if (panelApent) {
    var p = document.querySelector('#foreldre .panel').getBoundingClientRect();
    if (p.bottom > window.innerHeight + 1 || p.top < -1) ut.push('foreldrepanelet går utenfor skjermen i høyden');
    var lukk = document.getElementById('foreldre-lukk').getBoundingClientRect();
    if (lukk.bottom > window.innerHeight + 1) ut.push('«Lukk» ligger under skjermkanten');
  }
  return ut;
}

/* Kartet: sideforholdet må være tegningens, ellers treffer prosentene feil
 * sted, og hvert sted må stå på land – bortsett fra skipet, som skal på sjøen. */
function sjekkKart() {
  var ut = [];
  var kart = document.getElementById('start-kart');
  var r = kart.getBoundingClientRect();
  var forhold = r.width / r.height;
  if (Math.abs(forhold - 1000 / 820) > 0.02) ut.push('kartets sideforhold ' + forhold.toFixed(3) + ' ≠ 1000/820');

  var steder = Array.prototype.slice.call(document.querySelectorAll('.kartsted'));
  steder.forEach(function (s) { s.style.pointerEvents = 'none'; s.style.visibility = 'hidden'; });
  var HAV = ['#63c7c9', '#80d4d1', '#a4e2dc'];
  steder.forEach(function (s) {
    var id = (/kartsted--(\w+)/.exec(s.className) || [])[1];
    var rs = s.getBoundingClientRect();
    var x = rs.left + rs.width / 2, y = rs.top + rs.height / 2;
    var treff = document.elementFromPoint(x, y);
    var fyll = treff && treff.getAttribute && (treff.getAttribute('fill') || '').toLowerCase();
    /* Havet er sidens bakgrunn: treffer vi selve <svg>-flaten, er det sjø. */
    var paSjo = !treff || !treff.closest('.kart-flate') ||
                treff.classList.contains('kart-flate') || HAV.indexOf(fyll) !== -1;
    if (id === 'oy' && !paSjo) ut.push('skipet står på land');
    if (id !== 'oy' && paSjo) ut.push(id + ' står i vannet');
  });
  steder.forEach(function (s) { s.style.pointerEvents = ''; s.style.visibility = ''; });

  /* Figurene (det som faktisk males) skal ikke ligge oppå hverandre. */
  var figurer = steder.map(function (s) {
    return { id: s.className, r: s.querySelector('.kartsted-figur svg').getBoundingClientRect() };
  });
  for (var i = 0; i < figurer.length; i++) {
    for (var j = i + 1; j < figurer.length; j++) {
      var a = figurer[i].r, b = figurer[j].r;
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
        ut.push('figurene overlapper: ' + figurer[i].id + ' / ' + figurer[j].id);
      }
    }
  }
  return ut;
}

module.exports = async function (t) {
  var ok = t.ok, hjelp = t.hjelp;
  var lagret = hjelp.lagring({
    barnenavn: 'Ida',
    innstillinger: { stemme: false, visAlleModuser: true }
  });

  for (var i = 0; i < SKJERMER.length; i++) {
    var sk = SKJERMER[i];
    var side = await t.nySide({ lagret: lagret, viewport: sk.viewport, mobil: sk.mobil, touch: sk.mobil });

    async function mål(hva) {
      /* Inn-animasjonene må ha lagt seg, ellers måles posisjoner som ikke
       * finnes et halvsekund senere. */
      await side.clock.runFor(900);
      await side.evaluate(function () {
        return Promise.all(document.getAnimations().filter(function (a) {
          return a.effect.getComputedTiming().iterations !== Infinity;
        }).map(function (a) { return a.finished.catch(function () {}); }));
      });
      var problemer = await side.evaluate(sjekk);
      ok(problemer.length === 0, sk.navn + ' ' + hva + ': ' + (problemer.join('; ') || 'ok'));
    }

    await mål('kartet');
    var kart = await side.evaluate(sjekkKart);
    ok(kart.length === 0, sk.navn + ' kartets geometri: ' + (kart.join('; ') || 'ok'));

    await side.locator('#start-kart .kartsted', { hasText: 'Racerbanen' }).click();
    await mål('navnevalget');
    await side.locator('#navn-forslag button').first().click();
    await mål('menyen');

    await hjelp.velgModus(side, 'Garasjen');
    await side.locator('#utforsk-rutenett .bokstav').first().click();
    await mål('Garasjen');
    await hjelp.tilbake(side);

    await hjelp.velgModus(side, 'Alfabetløypa');
    await mål('Alfabetløypa');
    await hjelp.tilbake(side);

    await hjelp.velgModus(side, 'Finn bokstaven');
    await mål('Finn bokstaven');
    await hjelp.spillRunde(side);
    await mål('oppsummeringen');

    await side.locator('#stjerneteller').click();
    await mål('samlingen');

    await side.locator('#tannhjul').click();
    await side.locator('#voksenboble-apne').click();
    await mål('foreldremenyen');
    var hjelpetekst = await side.evaluate(function () {
      return getComputedStyle(document.querySelector('.hjelpetekst')).borderTopLeftRadius;
    });
    ok(hjelpetekst === '12px', sk.navn + ' .hjelpetekst-regelen virker (border-radius ' + hjelpetekst + ')');
    await side.locator('#foreldre-lukk').click();

    await hjelp.tilbake(side);
    await hjelp.tilVerden(side, 'Dinodalen');
    await hjelp.velgModus(side, 'Tell');
    await mål('Tell');
    await hjelp.tilbake(side);
    await hjelp.tilbake(side);

    await hjelp.tilVerden(side, 'Verkstedet');
    await hjelp.velgModus(side, 'Hent');
    await hjelp.vaken(side);
    await side.locator('#oppgave-mal .ting').first().click();
    await mål('Hent');

    ok(side.feil.length === 0, sk.navn + ': ingen feil i konsollen' + (side.feil.length ? ' – ' + side.feil.join(' | ') : ''));
    await side.context().close();
  }
};
