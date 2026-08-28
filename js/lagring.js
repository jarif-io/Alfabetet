/* Bokstavløpet – lagring
 *
 * Alt lagres lokalt i nettleseren (localStorage). Ingenting sendes noe sted,
 * og det kreves ingen innlogging. Tømmer man nettleserdata, nullstilles spillet.
 */

var Lagring = (function () {
  var NOKKEL = 'bokstavlopet.v1';
  var NA_VERSJON = 5;

  var standard = {
    versjon: NA_VERSJON,
    navn: { bane: '', oy: '', dino: '' },
    /* Hvor mange skilt han får å velge mellom. Dette må overleve runden:
     * settes det tilbake til to hver gang, rykker han aldri varig opp, og
     * vanskegraden er bygget uten at noen merker den. */
    antallValg: { bane: 2, oy: 2, dino: 2 },
    /* Runder på rad der under halvparten satt på første forsøk. To slike
     * betyr at det ble for vanskelig, og han rykker ned igjen. */
    svakeRunder: { bane: 0, oy: 0, dino: 0 },
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
      bokstaver: null,  /* null = alle utenom de sjeldne (Q, W, X, Z) */
      visAlleModuser: false, /* av = menyen slipper til én modus om gangen */
      bokstavlyd: false /* av = si bare bokstavnavnet, ikke selve lyden */
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

    /* 4 har ingen steg med vilje. Da ble antallValg og bokstavlyd lagt til,
     * og begge har standardverdier som er nøyaktig dagens oppførsel – to
     * skilt og ingen bokstavlyd. Samtidig ble Q, W, X og Z tatt ut av
     * standardutvalget; det er en villet endring for alle, ikke noe som
     * skal migreres bort. Har forelderen valgt bokstaver selv, står valget. */
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
      /* Går over verdenene som finnes, ikke en hardkodet liste: kommer det
       * en verden til, skal navnet og vanskegraden hennes ikke falle bort. */
      var verdener = Object.keys(VERDENER);
      if (lest.navn) {
        verdener.forEach(function (v) { ut.navn[v] = lest.navn[v] || ''; });
      }
      if (typeof lest.barnenavn === 'string') ut.barnenavn = lest.barnenavn;
      if (lest.laasteOpp instanceof Array) ut.laasteOpp = lest.laasteOpp.slice();
      ['antallValg', 'svakeRunder'].forEach(function (felt) {
        if (!lest[felt]) return;
        verdener.forEach(function (v) {
          if (typeof lest[felt][v] === 'number') ut[felt][v] = lest[felt][v];
        });
      });
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

  /* Framgangen lagres per tegn – både bokstaver og tall ligger her. Nøklene
   * kolliderer ikke: «A» og «4» er forskjellige strenger. */
  function forTegn(tegn) {
    if (!data.framgang[tegn]) {
      data.framgang[tegn] = { riktig: 0, feil: 0, dager: [] };
    }
    return data.framgang[tegn];
  }

  return {
    /* --- framgang --- */

    /* «Mestret» er det telleren, garasjeveggen og fanfaren hviler på, så
     * målingen må tåle vekten. Med bare to skilt på skjermen gir ren gjetting
     * treff halvparten av gangene, og over tre dager blir «mestret» da mest
     * flaks. Derfor teller dagen bare når han valgte blant minst tre.
     *
     * Treffet i seg selv telles uansett – det er dagene som er kriteriet.
     * Dager som allerede ligger lagret røres ikke; regelen gjelder framover. */
    registrerRiktig: function (bokstav, antallValg) {
      var f = forTegn(bokstav);
      f.riktig += 1;
      if (antallValg === undefined || antallValg >= 3) {
        var dag = idag();
        if (f.dager.indexOf(dag) === -1) f.dager.push(dag);
      }
      skriv();
    },

    registrerFeil: function (bokstav) {
      var f = forTegn(bokstav);
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

    /* Tegnene verdenen øver på nå. Bokstavverdenene deler bokstavutvalget
     * foreldrene har satt; tallverdenen har sine ti tall og bryr seg ikke om
     * hvilke bokstaver som er huket av. */
    aktiveTegn: function (verdenId) {
      if (verdenId && domeneFor(verdenId) === 'tall') return tegnFor(verdenId).slice();
      return this.aktiveBokstaver();
    },

    /* Bare tegn som er i bruk i denne verdenen. Har forelderen begrenset
     * utvalget til fem bokstaver, ville det vært rart om telleren viste sju
     * mestrede av fem – og tallene skal ikke telles med blant bokstavene. */
    mestrede: function (verdenId) {
      var aktive = this.aktiveTegn(verdenId);
      var ut = [];
      for (var i = 0; i < aktive.length; i++) {
        if (this.erMestret(aktive[i])) ut.push(aktive[i]);
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

    /* --- vanskegrad som varer mellom øktene --- */

    antallValgFor: function (verdenId) {
      return data.antallValg[verdenId] || 2;
    },

    settAntallValg: function (verdenId, n) {
      data.antallValg[verdenId] = Math.max(2, n);
      skriv();
    },

    /* Kalles når en runde er ferdig. Returnerer true hvis han rykket ned,
     * så den som spør kan si fra. To svake runder på rad skal til – én
     * dårlig dag er ikke et signal om at det ble for vanskelig. */
    registrerRunde: function (verdenId, riktigForste, antall) {
      var svak = riktigForste * 2 < antall;
      data.svakeRunder[verdenId] = svak ? (data.svakeRunder[verdenId] || 0) + 1 : 0;
      var ned = false;
      if (data.svakeRunder[verdenId] >= 2 && this.antallValgFor(verdenId) > 2) {
        data.antallValg[verdenId] = this.antallValgFor(verdenId) - 1;
        data.svakeRunder[verdenId] = 0;
        ned = true;
      }
      skriv();
      return ned;
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

    /* Bokstavene som er i bruk nå. Foreldremenyen kan snevre inn utvalget.
     * Uten et eget valg er alle med unntatt Q, W, X og Z – se
     * SJELDNE_BOKSTAVER i data.js for hvorfor. */
    aktiveBokstaver: function () {
      var valgt = data.innstillinger.bokstaver;
      if (!valgt || !valgt.length) {
        return ALFABET.filter(function (b) {
          return SJELDNE_BOKSTAVER.indexOf(b) === -1;
        });
      }
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
