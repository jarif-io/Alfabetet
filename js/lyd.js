/* Oppdagerøya – lydeffekter
 *
 * Alle lyder lages av nettleseren selv (Web Audio), så det finnes ingen
 * lydfiler å laste ned. Lydene er med vilje korte, myke og lave: de skal
 * bekrefte at noe skjedde, ikke ta oppmerksomheten.
 */

var Lyd = (function () {
  var ctx = null;
  var hovedVolum = null;

  function start() {
    if (ctx) return ctx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    hovedVolum = ctx.createGain();
    hovedVolum.gain.value = 0.22;      /* lavt fra start – dette er et barnerom */
    hovedVolum.connect(ctx.destination);
    return ctx;
  }

  function klar() {
    if (!Lagring.innstilling('lyd')) return null;
    var c = start();
    if (!c) return null;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    return c;
  }

  /* En enkel tone med mykt inn- og utfade. */
  function tone(frekvens, start_s, lengde, type, styrke, sluttFrekvens) {
    var c = klar();
    if (!c) return;
    var t = c.currentTime + start_s;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(frekvens, t);
    if (sluttFrekvens) {
      osc.frequency.exponentialRampToValueAtTime(sluttFrekvens, t + lengde);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(styrke || 0.3, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + lengde);
    osc.connect(g);
    g.connect(hovedVolum);
    osc.start(t);
    osc.stop(t + lengde + 0.05);
  }

  /* Filtrert støy – brukes til motorbrum og bølgeskvulp. */
  /* Støybufferne gjenbrukes. Før ble det fylt ~24 000 tilfeldige tall på nytt
   * hver gang bilen kjørte – altså ved hvert riktige svar. Umerkelig på en PC,
   * målbart på en gammel iPad. Filtrert og fadet hører man ikke at det er
   * samme støy hver gang. */
  var stoybuffere = {};

  function stoybuffer(c, lengde) {
    var nokkel = String(lengde);
    var b = stoybuffere[nokkel];
    if (b && b.sampleRate === c.sampleRate) return b;
    var rammer = Math.max(1, Math.floor(c.sampleRate * lengde));
    b = c.createBuffer(1, rammer, c.sampleRate);
    var data = b.getChannelData(0);
    for (var i = 0; i < rammer; i++) data[i] = Math.random() * 2 - 1;
    stoybuffere[nokkel] = b;
    return b;
  }

  function stoy(start_s, lengde, filterHz, styrke, filterSlutt) {
    var c = klar();
    if (!c) return;
    var t = c.currentTime + start_s;

    var kilde = c.createBufferSource();
    kilde.buffer = stoybuffer(c, lengde);

    var filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterHz, t);
    if (filterSlutt) {
      filter.frequency.linearRampToValueAtTime(filterSlutt, t + lengde);
    }

    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(styrke || 0.2, t + lengde * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + lengde);

    kilde.connect(filter);
    filter.connect(g);
    g.connect(hovedVolum);
    kilde.start(t);
    kilde.stop(t + lengde);
  }

  return {
    /* Må kalles fra et museklikk – nettlesere tillater ikke lyd før det. */
    lasOpp: function () {
      var c = start();
      if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    },

    /* Bilen kjører: et kort, dempet brum som stiger litt. */
    motor: function () {
      stoy(0, 0.55, 300, 0.18, 700);
      tone(70, 0, 0.5, 'sawtooth', 0.06, 110);
    },

    /* Skipet seiler: bølgeskvulp. */
    bolge: function () {
      stoy(0, 0.7, 900, 0.14, 400);
    },

    /* Stjernen lander på plass: to myke toner opp. */
    stjerne: function () {
      tone(660, 0, 0.18, 'sine', 0.28);
      tone(880, 0.14, 0.32, 'sine', 0.24);
    },

    /* Feil svar: én lav, vennlig tone. Ikke en summetone, ikke et pip. */
    proveIgjen: function () {
      tone(300, 0, 0.22, 'sine', 0.2, 250);
    },

    /* Et trykk ble registrert. */
    klikk: function () {
      tone(520, 0, 0.09, 'sine', 0.14);
    },

    /* Tut. Bilen tuter, skipet svarer med skipsfløyte – begge deler er noe
       en treåring trykker på figuren for å få til. */
    tut: function () {
      tone(392, 0, 0.16, 'triangle', 0.26);
      tone(311, 0.13, 0.26, 'triangle', 0.24);
    },

    /* Runden er ferdig: tre rolige toner. */
    ferdig: function () {
      tone(523, 0.00, 0.28, 'sine', 0.22);
      tone(659, 0.22, 0.28, 'sine', 0.22);
      tone(784, 0.44, 0.5, 'sine', 0.22);
    }
  };
})();
