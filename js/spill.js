/* Bokstavløpet – navigasjon og oppsett
 *
 * Holder styr på hvilken skjerm som vises, hvilken verden som er valgt,
 * tastaturet, og foreldremenyen.
 */

var Spill = (function () {

  function el(id) { return document.getElementById(id); }

  var FIGUR_MERKE = {
    bil:  { id: '#fig-bil',  vb: '0 0 140 70' },
    skip: { id: '#fig-skip', vb: '0 0 140 90' }
  };

  var naVerden = null;
  var tastLytter = null;
  var tilbakeHandling = null;
  var sisteModus = null;

  /* ---------- skjermbytte ---------- */

  function visSkjerm(id) {
    var alle = document.querySelectorAll('.skjerm');
    for (var i = 0; i < alle.length; i++) alle[i].hidden = (alle[i].id !== id);
  }

  function settTopp(tittel, visTilbake) {
    el('topp-tittel').textContent = tittel;
    el('tilbake').hidden = !visTilbake;
  }

  function settTastLytter(fn) { tastLytter = fn; }

  function figurMerke(verdenId) {
    var m = FIGUR_MERKE[VERDENER[verdenId].figur];
    return '<svg viewBox="' + m.vb + '"><use href="' + m.id + '"></use></svg>';
  }

  /* ---------- skjermene ---------- */

  function visStart() {
    Tale.stopp();
    settTastLytter(null);
    tilbakeHandling = null;
    document.body.removeAttribute('data-verden');
    naVerden = null;
    settTopp('Bokstavløpet', false);
    visSkjerm('skjerm-start');
  }

  function visVerden() {
    Tale.stopp();
    settTastLytter(null);
    tilbakeHandling = visStart;
    document.body.removeAttribute('data-verden');
    settTopp('Bokstavløpet', true);
    visSkjerm('skjerm-verden');

    var felt = el('verden-valg');
    felt.innerHTML = '';
    ['bane', 'oy'].forEach(function (id) {
      var v = VERDENER[id];
      felt.appendChild(lagKort(v.ikon, v.navn, Lagring.harNavn(id)
        ? 'Sammen med ' + Lagring.navnFor(id)
        : 'Bokstaver med ' + (id === 'bane' ? 'biler og motor' : 'skip og skatter'),
        function () {
          Lyd.klikk();
          velgVerden(id);
        }));
    });
  }

  function lagKort(ikon, tittel, tekst, nar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'kort';
    b.innerHTML =
      '<span class="kort-ikon" aria-hidden="true">' + ikon + '</span>' +
      '<span class="kort-tittel">' + tittel + '</span>' +
      '<span class="kort-tekst">' + tekst + '</span>';
    b.addEventListener('click', nar);
    return b;
  }

  function velgVerden(id) {
    naVerden = id;
    document.body.setAttribute('data-verden', id);
    if (Lagring.harNavn(id)) visMeny();
    else visNavn();
  }

  /* Første gang i en verden får barnet døpe figuren sin. Navnet brukes
   * gjennom hele spillet, og gjør figuren til hans egen. */
  function visNavn() {
    var v = VERDENER[naVerden];
    tilbakeHandling = visVerden;
    settTopp(v.navn, true);
    visSkjerm('skjerm-navn');

    el('navn-figur').innerHTML = figurMerke(naVerden);
    el('navn-sporsmal').textContent = v.navnesporsmal;
    var felt = el('navn-felt');
    felt.value = '';
    felt.placeholder = v.standardnavn;
    felt.focus();

    Tale.stopp();
    Tale.rekke([v.navnesporsmal]);
  }

  function lagreNavn(navn) {
    Lagring.settNavn(naVerden, navn || VERDENER[naVerden].standardnavn);
    Lyd.klikk();
    visMeny();
  }

  function visMeny() {
    Tale.stopp();
    settTastLytter(null);
    var v = VERDENER[naVerden];
    tilbakeHandling = visVerden;
    settTopp(v.navn + ' · ' + Lagring.navnFor(naVerden), true);
    visSkjerm('skjerm-meny');
    el('meny-tittel').textContent = 'Hva vil du gjøre?';

    var felt = el('meny-valg');
    felt.innerHTML = '';

    felt.appendChild(lagKort('🔤', naVerden === 'oy' ? 'Skattekartet' : 'Garasjen',
      'Trykk på en bokstav og hør den', function () {
        Lyd.klikk();
        tilbakeHandling = function () { Moduser.Utforsk.stopp(); visMeny(); };
        Moduser.Utforsk.start(naVerden);
      }));

    felt.appendChild(lagKort('🎯', 'Finn bokstaven',
      'Hør bokstaven, og velg riktig skilt', function () {
        Lyd.klikk();
        startOppgave('finn');
      }));

    felt.appendChild(lagKort('👂', 'Første lyd',
      'Hvilken bokstav begynner ordet på?', function () {
        Lyd.klikk();
        startOppgave('forstelyd');
      }));

    var antall = Lagring.mestrede().length;
    felt.appendChild(lagKort('⭐', 'Samlingen din',
      antall + ' av ' + ALFABET.length + ' bokstaver er dine', function () {
        Lyd.klikk();
        visSamling();
      }));
  }

  function startOppgave(type) {
    sisteModus = type;
    tilbakeHandling = function () { Moduser.Oppgave.stopp(); visMeny(); };
    Moduser.Oppgave.start(type, naVerden);
  }

  function settOppsummering(type, verdenId) {
    sisteModus = type;
    tilbakeHandling = visMeny;
  }

  function visSamling() {
    Tale.stopp();
    settTastLytter(null);
    var v = VERDENER[naVerden];
    tilbakeHandling = visMeny;
    settTopp(v.samling, true);
    visSkjerm('skjerm-samling');

    var mestrede = Lagring.mestrede();
    el('samling-tittel').textContent = v.samling;
    el('samling-undertekst').textContent = mestrede.length === 0
      ? 'Her samler du bokstavene du klarer.'
      : 'Du har ' + mestrede.length + ' av ' + ALFABET.length + ' bokstaver.';

    var felt = el('samling-rutenett');
    felt.innerHTML = '';
    ALFABET.forEach(function (bokstav) {
      var dager = Lagring.dagerFor(bokstav);
      var mestret = Lagring.erMestret(bokstav);
      var rute = document.createElement('div');
      rute.className = 'samling-rute' + (mestret ? ' tatt' : (dager > 0 ? ' pa-vei' : ''));
      rute.innerHTML =
        '<div class="stor">' + bokstav + '</div>' +
        '<div class="liten">' +
          (mestret ? '★ din' : (dager > 0 ? dager + ' av 3 dager' : '&nbsp;')) +
        '</div>';
      felt.appendChild(rute);
    });
  }

  /* ---------- foreldremeny ---------- */

  function apneForeldre() {
    var f = el('foreldre');
    f.hidden = false;

    el('inn-stemme').checked = Lagring.innstilling('stemme');
    el('inn-lyd').checked = Lagring.innstilling('lyd');
    el('inn-vis-mal').checked = Lagring.innstilling('visMal');
    el('inn-fart').value = Lagring.innstilling('talefart');
    visFart();

    var merknad = el('stemme-merknad');
    if (!Tale.stottes()) {
      merknad.hidden = false;
      merknad.className = 'merknad advarsel';
      merknad.textContent = 'Denne nettleseren har ikke talesyntese. Spillet fungerer, ' +
        'men uten stemme – da må en voksen si bokstavlyden ved siden av.';
    } else if (!Tale.harNorskStemme()) {
      merknad.hidden = false;
      merknad.className = 'merknad advarsel';
      merknad.textContent = 'Fant ingen norsk stemme på denne maskinen. Spillet leser ' +
        'med den stemmen som finnes, noe som kan høres rart ut. En norsk stemme kan ' +
        'legges til i innstillingene til operativsystemet (språk og tale).';
    } else {
      merknad.hidden = true;
    }

    el('inn-navn-bane').value = Lagring.harNavn('bane') ? Lagring.navnFor('bane') : '';
    el('inn-navn-bane').placeholder = VERDENER.bane.standardnavn;
    el('inn-navn-oy').value = Lagring.harNavn('oy') ? Lagring.navnFor('oy') : '';
    el('inn-navn-oy').placeholder = VERDENER.oy.standardnavn;

    tegnBokstavvelger();
    tegnStatus();
  }

  function visFart() {
    var v = parseFloat(el('inn-fart').value);
    el('ut-fart').textContent = v <= 0.65 ? 'veldig rolig' : (v <= 0.85 ? 'rolig' : 'vanlig');
  }

  function tegnBokstavvelger() {
    var valgt = Lagring.innstilling('bokstaver') || [];
    var felt = el('inn-bokstaver');
    felt.innerHTML = '';
    ALFABET.forEach(function (bokstav) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = bokstav;
      if (valgt.indexOf(bokstav) !== -1) b.classList.add('valgt');
      b.addEventListener('click', function () {
        var na = (Lagring.innstilling('bokstaver') || []).slice();
        var i = na.indexOf(bokstav);
        if (i === -1) na.push(bokstav); else na.splice(i, 1);
        Lagring.settInnstilling('bokstaver', na.length ? na : null);
        tegnBokstavvelger();
      });
      felt.appendChild(b);
    });
  }

  function tegnStatus() {
    var felt = el('foreldre-status');
    felt.innerHTML = '';
    ALFABET.forEach(function (bokstav) {
      var dager = Lagring.dagerFor(bokstav);
      var s = document.createElement('span');
      s.className = 'status-bokstav' +
        (Lagring.erMestret(bokstav) ? ' mestret' : (dager > 0 ? ' pa-vei' : ''));
      s.textContent = bokstav;
      s.title = bokstav + ': ' + Lagring.riktigeFor(bokstav) + ' riktige, ' +
                dager + ' ulike dager';
      felt.appendChild(s);
    });
  }

  function lukkForeldre() {
    var navnBane = el('inn-navn-bane').value.trim();
    var navnOy = el('inn-navn-oy').value.trim();
    if (navnBane) Lagring.settNavn('bane', navnBane);
    if (navnOy) Lagring.settNavn('oy', navnOy);
    el('foreldre').hidden = true;
    /* Tilbake til et trygt sted – innstillingene kan ha endret bokstavutvalget. */
    if (naVerden) visMeny(); else visVerden();
  }

  /* ---------- oppstart ---------- */

  function koble() {
    /* Det første trykket låser opp lyden i nettleseren. */
    el('knapp-start').addEventListener('click', function () {
      Lyd.lasOpp();
      Lyd.klikk();
      visVerden();
    });

    el('tilbake').addEventListener('click', function () {
      Lyd.klikk();
      if (tilbakeHandling) tilbakeHandling();
    });

    el('navn-ok').addEventListener('click', function () {
      lagreNavn(el('navn-felt').value.trim());
    });
    el('navn-hopp').addEventListener('click', function () { lagreNavn(''); });
    el('navn-felt').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') lagreNavn(el('navn-felt').value.trim());
    });

    el('oppgave-videre').addEventListener('click', function () {
      Lyd.klikk();
      Moduser.Oppgave.videre();
    });
    el('oppgave-lytt').addEventListener('click', function () {
      Moduser.Oppgave.gjentaSporsmal();
    });

    el('oppsum-igjen').addEventListener('click', function () {
      Lyd.klikk();
      startOppgave(sisteModus || 'finn');
    });
    el('oppsum-tilbake').addEventListener('click', function () {
      Lyd.klikk();
      visMeny();
    });

    /* Tannhjulet må holdes inne i to sekunder, så barnet ikke havner her. */
    var holdTimer = null;
    var tannhjul = el('tannhjul');
    function startHold(e) {
      e.preventDefault();
      tannhjul.classList.add('holdes');
      holdTimer = window.setTimeout(function () {
        tannhjul.classList.remove('holdes');
        apneForeldre();
      }, 2000);
    }
    function avbrytHold() {
      tannhjul.classList.remove('holdes');
      if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = null; }
    }
    tannhjul.addEventListener('mousedown', startHold);
    tannhjul.addEventListener('touchstart', startHold, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(function (h) {
      tannhjul.addEventListener(h, avbrytHold);
    });

    el('foreldre-lukk').addEventListener('click', lukkForeldre);
    el('inn-stemme').addEventListener('change', function () {
      Lagring.settInnstilling('stemme', this.checked);
      if (!this.checked) Tale.stopp();
    });
    el('inn-lyd').addEventListener('change', function () {
      Lagring.settInnstilling('lyd', this.checked);
    });
    el('inn-vis-mal').addEventListener('change', function () {
      Lagring.settInnstilling('visMal', this.checked);
    });
    el('inn-fart').addEventListener('input', function () {
      Lagring.settInnstilling('talefart', parseFloat(this.value));
      visFart();
    });
    el('inn-alle').addEventListener('click', function () {
      Lagring.settInnstilling('bokstaver', null);
      tegnBokstavvelger();
    });
    el('inn-nullstill').addEventListener('click', function () {
      if (window.confirm('Slette all framgang og starte helt på nytt?')) {
        Lagring.nullstill();
        el('foreldre').hidden = true;
        visStart();
      }
    });

    /* Tastaturet: bokstavtastene velger bokstaven direkte. På en PC er det
     * den beste koblingen mellom tegnet på skjermen og fingeren hans. */
    document.addEventListener('keydown', function (e) {
      if (!el('foreldre').hidden) {
        if (e.key === 'Escape') lukkForeldre();
        return;
      }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        if (tilbakeHandling) { e.preventDefault(); tilbakeHandling(); }
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      var tegn = (e.key || '').toUpperCase();
      if (tegn.length === 1 && ALFABET.indexOf(tegn) !== -1 && tastLytter) {
        e.preventDefault();
        tastLytter(tegn);
      }
    });
  }

  return {
    visSkjerm: visSkjerm,
    settTopp: settTopp,
    settTastLytter: settTastLytter,
    figurMerke: figurMerke,
    settOppsummering: settOppsummering,
    start: function () { koble(); visStart(); }
  };
})();

document.addEventListener('DOMContentLoaded', function () { Spill.start(); });
