/* Bokstavløpet – lagring
 *
 * Alt lagres lokalt i nettleseren (localStorage). Ingenting sendes noe sted,
 * og det kreves ingen innlogging. Tømmer man nettleserdata, nullstilles spillet.
 */

var Lagring = (function () {
  var NOKKEL = 'bokstavlopet.v1';
  var NA_VERSJON = 3;

  var standard = {
    versjon: NA_VERSJON,
    navn: { bane: '', oy: '' },
    /* Barnets eget navn. Tomt = «Navnet mitt» er ikke tilgjengelig ennå. */
    barnenavn: '',
    /* Moduser som har dukket opp på menyen. Låsingen går bare én vei: en
     * modus som forsvinner igjen er uforståelig for en som ikke kan lese. */
    laasteOpp: [],
    /* framgang['B'] = { riktig: 4, feil: 1, dager: ['2026-08-26', ...] } */
    framgang: {},
    innstillinger: {
      stemme: true,
      lyd: true,
      /* Standard er innstilt på de aller minste: kort runde, få valg,
       * hjelp med én gang, og en stemme som snakker rolig. */
      niva: 'liten',
      talefart: 0.9,
      stemmenavn: null,   /* null = spillet velger den beste norske selv */
      visMal: false,    /* bokstaven er skjult til barnet trykker på merket */
      bevegelse: true,  /* la skyer og bølger drive sakte */
      bokstaver: null,  /* null = alle bokstaver er med */
      visAlleModuser: false /* av = menyen slipper til én modus om gangen */
    }
  };

  /* Endrer vi en standardverdi, hjelper det ikke for dem som har spilt før:
   * verdien deres ligger allerede lagret og vinner over den nye standarden.
   * Hver endring får derfor et steg her, som kjøres én gang på gammel lagring. */
  var MIGRERINGER = {
    /* 2: bokstaven i «Finn bokstaven» ble skjult som standard. */
    2: function (d) { d.innstillinger.visMal = standard.innstillinger.visMal; },

    /* 3: menyen viser bare det barnet er klar for. «Første lyd» har hittil
     *    stått der bestandig, så den som allerede har spilt skal ikke
     *    oppleve at en modus plutselig er borte. */
    3: function (d) { d.laasteOpp = ['forstelyd']; }
  };

  var maaSkrives = false;
  var data = les();
  /* Migreringen skal ikke bare gjelde denne økten – den skrives ned. */
  if (maaSkrives) skriv();

  function les() {
    try {
      var rå = window.localStorage.getItem(NOKKEL);
      if (!rå) return kopi(standard);
      var lest = JSON.parse(rå);
      /* Slå sammen med standard, så nye felter ikke mangler i gamle lagringer. */
      var ut = kopi(standard);
      if (lest.navn) ut.navn = { bane: lest.navn.bane || '', oy: lest.navn.oy || '' };
      if (typeof lest.barnenavn === 'string') ut.barnenavn = lest.barnenavn;
      if (lest.laasteOpp instanceof Array) ut.laasteOpp = lest.laasteOpp.slice();
      if (lest.framgang) ut.framgang = lest.framgang;
      if (lest.innstillinger) {
        for (var k in ut.innstillinger) {
          if (lest.innstillinger[k] !== undefined) {
            ut.innstillinger[k] = lest.innstillinger[k];
          }
        }
      }
      var fra = typeof lest.versjon === 'number' ? lest.versjon : 1;
      if (fra < NA_VERSJON) {
        for (var v = fra + 1; v <= NA_VERSJON; v++) {
          if (MIGRERINGER[v]) MIGRERINGER[v](ut);
        }
        ut.versjon = NA_VERSJON;
        maaSkrives = true;
      }
      return ut;
    } catch (e) {
      /* Ødelagt eller utilgjengelig lagring skal ikke stoppe spillet. */
      return kopi(standard);
    }
  }

  function skriv() {
    try {
      window.localStorage.setItem(NOKKEL, JSON.stringify(data));
    } catch (e) {
      /* Full disk eller privat modus – spillet fungerer, men husker ikke. */
    }
  }

  function kopi(o) { return JSON.parse(JSON.stringify(o)); }

  function idag() {
    var d = new Date();
    return d.getFullYear() + '-' + to(d.getMonth() + 1) + '-' + to(d.getDate());
  }
  function to(n) { return (n < 10 ? '0' : '') + n; }

  function forBokstav(bokstav) {
    if (!data.framgang[bokstav]) {
      data.framgang[bokstav] = { riktig: 0, feil: 0, dager: [] };
    }
    return data.framgang[bokstav];
  }

  return {
    /* --- framgang --- */

    registrerRiktig: function (bokstav) {
      var f = forBokstav(bokstav);
      f.riktig += 1;
      var dag = idag();
      if (f.dager.indexOf(dag) === -1) f.dager.push(dag);
      skriv();
    },

    registrerFeil: function (bokstav) {
      var f = forBokstav(bokstav);
      f.feil += 1;
      skriv();
    },

    riktigeFor: function (bokstav) {
      return data.framgang[bokstav] ? data.framgang[bokstav].riktig : 0;
    },

    /* En bokstav regnes som mestret når den er truffet på tre ulike dager.
     * Tre riktige på rad i én økt er gjenkjenning; tre ulike dager er læring. */
    erMestret: function (bokstav) {
      var f = data.framgang[bokstav];
      return !!f && f.dager.length >= 3;
    },

    dagerFor: function (bokstav) {
      var f = data.framgang[bokstav];
      return f ? f.dager.length : 0;
    },

    mestrede: function () {
      var ut = [];
      for (var i = 0; i < ALFABET.length; i++) {
        if (this.erMestret(ALFABET[i])) ut.push(ALFABET[i]);
      }
      return ut;
    },

    /* --- navn på figurene --- */

    navnFor: function (verdenId) {
      return data.navn[verdenId] || VERDENER[verdenId].standardnavn;
    },

    harNavn: function (verdenId) {
      return !!data.navn[verdenId];
    },

    settNavn: function (verdenId, navn) {
      data.navn[verdenId] = (navn || '').trim().slice(0, 20);
      skriv();
    },

    /* --- barnets eget navn --- */

    barnenavn: function () { return data.barnenavn; },

    settBarnenavn: function (navn) {
      data.barnenavn = (navn || '').trim().slice(0, 20);
      skriv();
    },

    /* --- moduser som er låst opp --- */

    erLaastOpp: function (id) {
      return data.laasteOpp.indexOf(id) !== -1;
    },

    /* Idempotent: å låse opp noe som allerede er låst opp skal ikke skrive. */
    laasOpp: function (id) {
      if (data.laasteOpp.indexOf(id) !== -1) return false;
      data.laasteOpp.push(id);
      skriv();
      return true;
    },

    /* --- innstillinger --- */

    innstilling: function (navn) {
      return data.innstillinger[navn];
    },

    settInnstilling: function (navn, verdi) {
      data.innstillinger[navn] = verdi;
      skriv();
    },

    /* Bokstavene som er i bruk nå. Foreldremenyen kan snevre inn utvalget. */
    aktiveBokstaver: function () {
      var valgt = data.innstillinger.bokstaver;
      if (!valgt || !valgt.length) return ALFABET.slice();
      var ut = ALFABET.filter(function (b) { return valgt.indexOf(b) !== -1; });
      /* Under to bokstaver gir ingen oppgave å velge mellom. */
      return ut.length >= 2 ? ut : ALFABET.slice();
    },

    nullstill: function () {
      data = kopi(standard);
      skriv();
    }
  };
})();
