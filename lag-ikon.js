/* Oppdagerøya – lager ikon.png (180×180) til Hjem-skjermen og nettleserfanen
 *
 * Ikonet er et utsnitt av racerbilen slik spillet selv tegner den, så det
 * følger figuren hvis den endres. Kjør på nytt etter endringer i bil():
 *
 *   NODE_PATH=$(npm root -g) node lag-ikon.js
 */
'use strict';
var sti = require('path');
var chromium = require('playwright').chromium;

(async function () {
  var b = await chromium.launch();
  var p = await b.newPage({ viewport: { width: 180, height: 180 } });
  await p.goto('file://' + sti.join(__dirname, 'index.html'));
  await p.evaluate(function () {
    var c = document.createElement('div');
    c.id = 'figur';
    c.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;' +
      'background:linear-gradient(#8fd3f4 0%,#cdeefd 58%,#5c6470 58%,#4b525d 100%)';
    c.innerHTML = Figurer.figurFor('bane');
    c.firstChild.style.cssText = 'width:236px;margin:0 0 4px -64px;flex:none';
    document.body.appendChild(c);
  });
  await p.screenshot({ path: sti.join(__dirname, 'ikon.png') });
  await b.close();
})();
