---
name: barnespill-i-nettleser
description: >-
  Arbeidsmåte for å bygge og videreutvikle små læringsspill i nettleseren for
  barn som ennå ikke kan lese – som Oppdagerøya i dette repoet. Dekker
  designprinsipper for treåringer, teknisk ramme uten byggesteg, og en
  verifiseringsdisiplin der alt måles i en ekte nettleser med Playwright i
  stedet for å resonneres fram fra kildekoden. Bruk denne når du endrer noe i
  Alfabetet, når en forelder melder om en feil («knappen virker ikke», «stemmen
  er rar», «det ser feil ut på mobil»), når du legger til en modus, ord eller
  figur, og generelt når arbeidet gjelder et spill eller en app som skal brukes
  av små barn.
---

# Barnespill i nettleser

Denne ferdigheten oppsummerer hvordan Oppdagerøya ble bygget og feilrettet
sammen med en forelder som testet hver versjon på en treåring. Poenget er ikke
å gjenta akkurat dette spillet, men å arve arbeidsmåten: hvem vi bygger for,
hvordan vi holder teknikken enkel nok til å overleve, og – viktigst – hvordan
vi beviser at noe faktisk virker.

## 1. Hvem er brukeren

To brukere samtidig, og de har motsatte behov:

- **Barnet (3 år)** kan ikke lese, har korte fingre og kort tålmodighet, og
  forstår bilder, lyd og bevegelse. Alt barnet skal forstå må uttrykkes uten
  ord.
- **Forelderen** er den som melder feil, endrer innstillinger og bestemmer
  rammene. Foreldrefunksjoner skal være ute av veien for barnet, men enkle å
  finne for en voksen.

Forelderens feilmeldinger kommer alltid som symptomer fra stua – «han kommer
seg videre uten å svare», «den sier stor L» – ikke som feilrapporter. Oversett
symptomet til en hypotese, reproduser den i nettleseren, og bekreft *begge*
retninger: at feilen finnes, og at den er borte etterpå.

## 2. Designprinsipper

Disse er ikke smakssaker. Hver av dem kom av at noe faktisk gikk galt for
barnet.

**Bildet må vise ordet barnet ville sagt.** 🍦 skal hete «Is», ikke «Isbil»;
🥛 er «Melk», ikke «Yoghurt». Ellers lærer barnet feil bokstav til bildet, og
det er verre enn å ikke lære noe. Gå gjennom hele ordlista med spørsmålet:
*hva ville en treåring kalt dette bildet?* Ord må også være noe man kan peke
på – ikke «fart», «watt» eller «utrykning».

**Symbol foran tekst.** En knapp som sier «Videre» er usynlig for en som ikke
kan lese. Bruk pil, målflagg, øye, høyttaler – og la stemmen si det samme.

**Ikke vis svaret når oppgaven er å kjenne det igjen.** «Finn bokstaven» viste
bokstaven på skjermen; da er oppgaven trykk-på-det-som-ligner, ikke lytting.
Skjul den, og la barnet kunne trykke på flaten for å få den fram som hjelp.

**Store trykkflater.** Alt barnet skal treffe må være stort – gjenta-lyden-
knappen ble meldt som «veldig liten» og måtte doblet i størrelse.

**Rolig av konstruksjon.** Ingenting starter av seg selv, ingen nedtelling,
ingen bakgrunnsmusikk, ingen streaks eller daglige mål. Feiringen varer rundt
ett sekund og så er det stille. Barnet styrer tempoet; runden har en tydelig
slutt og spillet foreslår aldri «en runde til».

**Mestring, ikke belønningsdryss.** Framgangen skal være synlig og ekte
(bokstaver som samles på en vegg over uker), vanskegraden skal stige merkbart
og sies høyt, og en runde skal alltid ende med at barnet fikk det til – to bom
og spillet viser svaret og lar barnet trykke det selv.

**Ingen beskyttede figurer.** Barnet ville ha Lynet McQueen og Kaptein
Sabeltann. Vi tegnet en egen racerbil og en egen sjørøver i samme ånd, og lot
barnet gi dem navn. Det er både juridisk rent og faktisk bedre: det blir hans
helter.

## 3. Teknisk ramme

**Ingen byggesteg, ingen avhengigheter.** Vanlige `<script>`-tagger (ikke
ES-moduler, som blokkeres på `file://`), vanlig CSS, inline SVG. Kriteriet er
at forelderen skal kunne dobbeltklikke `index.html` om to år uten at noen
husker hvordan prosjektet ble satt opp. Alt som krever `npm install` for å
kjøre spillet er feil verktøy her.

Følger av det samme prinsippet:

- Lydeffekter genereres med Web Audio API – ingen lydfiler å miste.
- Figurer og ikoner er inline SVG – ingen bildefiler.
- Fonter legges inn som base64 i CSS – fungerer offline.
- `bygg-enfil.js` bunter alt til én HTML-fil for deling og for Artifact.

**Data skilles fra logikk.** Ordlistene ligger i `js/data.js` med en kommentar
øverst som forklarer reglene for ordvalg, slik at forelderen kan bytte ord til
dem dere leser om denne uka.

## 4. Verifisering: mål i en ekte nettleser

Dette er kjernen. Å lese koden og tenke «dette ser riktig ut» tok feil hver
eneste gang det gjaldt noe visuelt eller noe som krysser en plattformgrense.

Kjør spillet på en lokal server (`npx http-server -p 8137`) og styr det med
Playwright fra et lite skript per problemområde. Skriptene er billige, kan
kjøres om igjen etter hver endring, og blir et regresjonsnett: i dette
prosjektet endte vi med et par hundre påstander fordelt på ~15 skript
(`regr.js`, `mobil2.js`, `panel2.js`, `stemme2.js`, `migrering.js` …).

**Mål geometri, ikke inntrykk.** For layoutfeil: hent `getBoundingClientRect()`
for elementene og sjekk faktisk overlapp, at ingenting stikker utenfor
`innerWidth`, og `scrollHeight <= clientHeight` der det ikke skal kunne rulles.
Én skjermdump som «ser grei ut» skjulte i flere runder at bokstavbrikkene lå
utenfor viewporten på telefon.

**Tapp sømmen mot plattform-API-er.** Når utdata er feil og koden ser riktig
ut, wrap API-et og se hva som faktisk sendes:

```js
// Nøyaktig hva sier vi, med hvilken stemme?
var ekte = speechSynthesis.speak.bind(speechSynthesis);
window.__sagt = [];
speechSynthesis.speak = function (y) {
  window.__sagt.push({ tekst: y.text, stemme: y.voice && y.voice.name, lang: y.lang });
  return ekte(y);
};
```

Samme grep avslørte «stor L» (rå versal sendt til talesyntesen), at valgt
stemme aldri ble satt fordi en hjelpefunksjon var slettet, og at feil ikon ble
bedt om. Injiser også *falske* plattformtilstander – f.eks. en stemmeliste som
først er tom og dukker opp etter 1,5 sekund, slik ekte nettlesere gjør – for å
teste kodebanene du ellers ikke ser.

**Test oppgraderingsveien, ikke bare fersk installasjon.** Verste feilen i
prosjektet: en standardverdi ble endret slik at bokstaven skjules, alle tester
passerte – men de startet alltid med tom `localStorage`. Forelderen hadde en
lagret verdi fra før og så ingen endring. Lagrede data trenger versjon og
migreringer:

```js
var NA_VERSJON = 2;
var MIGRERINGER = {
  /* 2: bokstaven i «Finn bokstaven» ble skjult som standard. */
  2: function (d) { d.innstillinger.visMal = standard.innstillinger.visMal; }
};
```

Regelen: **endrer du en standardverdi, spør alltid hva som skjer med dem som
allerede har spilt** – og skriv en test som seeder gammel lagret tilstand.

**Sjekk uttalen på fonemene, ikke på gjetning.** Da spillet fikk en ferdig
lydpakke i stedet for talesyntese, måtte 300 klipp kontrolleres uten at noen
kunne høre på dem. Talegjenkjenning på enstavelsesklipp er ubrukelig – den
hørte «be» som «b», «to» som «2» og «å» som «hå», og det er umulig å skille
ekte feil fra støy. Lydskriften er derimot fasit: `espeak-ng` sa at bokstaven
D, skrevet «de», ble lest som pronomenet – `dˈiː`, ikke `dˈeː` – og at «Juice»
ble `jˈʉɪka`. Fire ekte uttalefeil falt ut på minutter. Legg rettelsene i en
uttaletabell ved siden av ordene, ikke i teksten på skjermen: det er *lyden*
som skal endres, ikke det barnet ser.

**En plattformvegg er et svar, ikke en blindvei.** Apple slipper ikke de
nedlastede stemmene til på nettsider, og har svart at det er meningen. Da er
riktig trekk å slutte å bruke plattformens talesyntese, ikke å prøve en
innstilling til: les inn alt på forhånd og legg lyden ved spillet. Løsningen
ble bedre enn den opprinnelige – lik stemme på alle maskiner, uten at noen må
gjøre noe.

**Prøv flere veier før du kaller nettet stengt.** `curl https://github.com/…`
ga 403, men `git clone` mot samme vert virket, og både
`raw.githubusercontent.com` og nedlastinger fra releases svarte 200. Hadde
den første 403-en fått stå som konklusjon, hadde hele språkpakken vært
umulig. Test flere verter og flere protokoller, og les om avvisningen kom fra
proxyen eller fra tjenesten selv.

**Mål først når animasjonene har lagt seg.** Flisene på menyen flyr inn med en
kort animasjon. Måler man 400 ms etter at skjermen kom opp, måler man
posisjoner som ikke finnes et halvsekund senere – i én runde ga det
«innholdet er 12 piksler for høyt» på noe som passet perfekt. Vent til
bevegelsen er over før du henter geometri, ellers jager du spøkelser.

**Ellipse er en feil som ser ut som design.** Ordkortet hadde
`text-overflow: ellipsis` på ordet, og da plassen tok slutt sto det «sju br…»
i stedet for «sju bregner». Ingenting krasjet, ingenting stakk utenfor, og
alle overlapp-testene var grønne – teksten var bare borte. Der en tekst
faktisk skal leses, mål `scrollWidth > clientWidth` og la det være en feil.

**Knapper oppå en tegning: la beholderen ha tegningens forhold.** Forsidekartet
har stedene som HTML-knapper plassert i prosent oppå en SVG. Det virker bare
hvis beholderen har nøyaktig samme sideforhold som `viewBox` (`aspect-ratio:
1000 / 820`) – ellers letterboxer SVG-en inni boksen, og «70 %» treffer et
annet punkt i tegningen enn i koordinatene du regnet ut. Ha en påstand på det
forholdet; da fanges det med én gang noen justerer bredden.

**Sjekk hva som ligger *under* et element, ikke bare hvor det er.** «Sjørøveren
skal være på sjøen» er en påstand om tegningen, ikke om geometri – to
rektangler kan ligge riktig i forhold til hverandre mens skipet står midt på
land. Slå av `pointer-events` på knappene et øyeblikk og bruk
`document.elementFromPoint()` på festepunktet; da svarer nettleseren hvilken
flate som faktisk males der, og fargen kan sammenlignes med havfargene.

**Pynt arves ned i pseudoelementer.** Tallet på hver ting i tellemodusen så
dobbelt ut på telefonen. Årsaken var `text-shadow: 0 3px 0 rgba(255,255,255,.8)`
på oppdragsplaten – riktig som lys kant under en mørk bokstav, men arvet ned i
`::after` ble den et hvitt ekstra siffer 3 piksler under det hvite tallet.
`getComputedStyle(el, '::after')` svarer på slikt på ett sekund; å stirre på
regelen som satte merket gjør det ikke, for feilen sto ikke der.

**Dekning må måles med de verdiene familien faktisk har.** Språkpakken hadde
klipp for rosen – «Bra kjørt, Turbo!» – og testen sa 99 % dekning. Den brukte
standardnavnet. Forelderen hadde skrevet inn sitt eget navn på figuren, og da
falt hver eneste oppmuntring tilbake til robotstemmen. Test aksene der
familier er ulike (navn, valgte bokstaver, innstillinger), ikke bare den
ferske installasjonen. Og der en verdi umulig kan ligge i pakken: la spillet
velge en variant uten den, framfor å bytte stemme midt i en setning.

**Skill mellom bokser og det som males.** En vid, gjennomsiktig beholder kan
godt overlappe en knapp uten at noe ser galt ut. Sammenlign de synlige barna –
stolpen, teksten – ikke foreldrenoden. Og sjekk med et skjermbilde før du
retter noe: overlappet i landskapsmodus viste seg å ikke finnes.

**Velg elementer på navn, ikke posisjon.** Testene klikket `.flis` nummer 1 for
å komme til «Finn bokstaven». Da menyen fikk en modus til, pekte nummer 1 et
annet sted, og seks testfiler feilet på én gang uten at noe var i veien med
spillet. `{ hasText: 'Finn bokstaven' }` overlever at menyen vokser.

**Test skjermen forelderen faktisk klaget på.** Mobiltesten dekket
verdensvelgeren, ikke Garasjen, så mobilfeilen i Garasjen overlevde en runde
med «alt grønt». Når en feil meldes fra en bestemt skjerm eller
skjermstørrelse, må testen treffe akkurat den.

**Når en test feiler: finn ut om testen eller produktet tar feil.** Antakelsen
«testen er utdatert» var riktig fire av fem ganger – og den femte gangen
skjulte den at barnet kunne hoppe over alle oppgavene. Sjekk alltid i
nettleseren før du retter testen.

## 5. Fellene som gikk igjen

Sjekk disse eksplisitt; de koster minutter å utelukke og timer å finne.

**`[hidden]` slås ut av en klasse som setter `display`.** `.knapp--pil { display:
inline-flex }` vant over `[hidden]`, så «Videre» var alltid synlig og barnet
kunne hoppe over hver eneste oppgave. Legg inn eksplisitt
`.knapp[hidden] { display: none; }`, og ha en test som feiler hvis et element
med `[hidden]` har `offsetWidth > 0`.

**`height: 100%` er ikke skjermhøyden på telefon.** iOS Safari lar html og body
få høyden til den *store* viewporten – den uten adresselinje – mens
`position: fixed` måles mot det som faktisk vises. Med adresselinja framme blir
siden høyere enn skjermen, nederste element havner under det som er festet i
bunnen, og ingenting kan rulles fordi body er `overflow: hidden`. Bruk
`100dvh` med `100vh` som reserve. Det er ikke mulig å reprodusere i Playwright,
men mekanismen kan simuleres: tving `html, body { height: 740px }` i et vindu
som er 500 høyt, og se hva som havner utenfor.

**`overflow: hidden` på body gjør enhver høydefeil uopprettelig.** Spillet var
laget for å fylle skjermen uten rulling, og body var derfor `overflow: hidden`.
Da regnet en nettleser ut en annen høyde enn vi trodde, havnet nederste flis
under den faste veien – og *ingenting kunne rulles*. Sperr sideveis rulling om
du vil, men la loddrett stå åpen: det koster ingenting når alt får plass, og
er forskjellen på en skjønnhetsfeil og et spill han ikke kommer inn i.

**Legg inn et versjonsmerke som den voksne kan lese opp.** Feilsøking på
andres telefon er umulig uten å vite hva de faktisk kjører – Safari kan sitte
på en gammel kopi i timevis, og da retter du feil som allerede er rettet. En
linje i foreldremenyen med versjonen, og beskjed om at `?ny` bak adressen
tvinger fram en fersk kopi, sparer en hel runde med gjetting.

**Overlappende media queries i feil rekkefølge.** `max-height: 720px` etter
`max-height: 520px` overstyrte den siste, og landskapsmodus fikk dobbelt så
høy bakke som tiltenkt. Gi hver query eksplisitt nedre *og* øvre grense
(`(max-height: 720px) and (min-height: 521px)`) i stedet for å stole på
rekkefølgen.

**Én manglende id dreper all etterfølgende hendelseskobling.** `el('navn-hopp')`
returnerte `null` etter at knappen ble fjernet, kastet, og resten av
`koble()` ble aldri kjørt – så «Videre» sluttet å virke et helt annet sted.
To tiltak: koble defensivt, og verifiser statisk at hver id finnes.

```js
function pa(id, hendelse, fn) {
  var e = document.getElementById(id);
  if (!e) { console.warn('Fant ikke element:', id); return; }
  e.addEventListener(hendelse, fn);
}
```

```bash
# Hver el('x') i js/ må finnes som id i index.html
grep -oh "el('[^']*'" js/*.js | sed "s/el('//;s/'//" | sort -u |
  while read -r id; do grep -q "id=\"$id\"" index.html || echo "MANGLER: $id"; done
```

**Avbryt hele køen, ikke bare den ene ytringen.** `speechSynthesis.cancel()`
stanset gjeldende setning, men resten av den lenkede sekvensen fortsatte oppå
neste oppgave. Bruk en generasjonsteller som gjør alle ventende
fortsettelser til no-ops.

**Unike id-er i SVG-gradienter.** To figurer med samme `<linearGradient id>`
gjør at den ene blir usynlig. Generer id per instans. CSS-variabler virker
heller ikke i `stop-color` – bruk literale farger.

**Versaler til talesyntese blir bokstavnavn på engelsk.** Ha en tabell over
hvordan bokstavene faktisk *heter* på norsk (`Q` → «ku», `W` → «dobbelt-ve»,
`Z` → «sett») og send den til stemmen, ikke tegnet.

**Langt trykk på iOS markerer tekst** før panelet rekker å åpne seg. Bruk to
trykk (første viser en boble, andre åpner) i stedet for hold-inne når noe skal
være barnesikret.

## 6. Prosessfeller

**Skriptede tekstredigeringer trenger ankere som sjekkes – og i riktig
rekkefølge.** Et skript som gjør
`s[s.index(A):s.index(B)]` der B kom før A ga tom streng, og
`s.replace('', ny)` satte inn teksten mellom hvert eneste tegn – README-en ble
244 065 linjer. Samme felle igjen senere: `s[:i] + s[j:]` skulle
klippe ut et stykke, men `j` lå *foran* `i` i filen, så kuttet ble et
innlimingspunkt og koden ble duplisert fire ganger. `node --check` sa
fortsatt at det var gyldig JavaScript. Når du redigerer programmatisk: bruk
regex på hele seksjoner, sjekk at treffet ikke er tomt, kontroller at
startankeret faktisk kommer før sluttankeret, og la skriptet feile høyt i
stedet for å skrive noe rart. Går det galt likevel, er `git checkout` på
filen og en ny, ren endring raskere enn å lappe.

**Si fra når noe er umulig i stedet for å «fikse» det videre.** iOS Safari
eksponerer bare kompakte systemstemmer for websider, så de nedlastede
Nora/Henrik-stemmene *kan* ikke velges der. Det riktige svaret var å si det
rett ut, foreslå omveien (skru av lyden og les selv) og tilby den ekte
løsningen (foreldrestemme spilt inn i appen) – ikke enda en runde med
«nå prøvde jeg noe annet».

**Én ting om gangen, verifisert, så commit.** Hver endring: reproduser
symptomet, rett, kjør regresjonsskriptene, sjekk i nettleseren, commit med en
norsk melding som beskriver hva barnet merker, push til utviklingsgrenen, og
bygg om enfil-versjonen hvis den er publisert.

## 7. Sjekkliste før du sier deg ferdig

- [ ] Symptomet forelderen meldte er reprodusert *og* borte, verifisert i nettleser.
- [ ] Regresjonsskriptene kjører grønt (og et nytt dekker feilen du nettopp rettet).
- [ ] Testet med lagret tilstand fra før, ikke bare tom `localStorage`.
- [ ] Testet i mobilbredde, liggende og stående, på den skjermen det gjaldt.
- [ ] Ingenting med `[hidden]` er synlig; ingenting overlapper eller stikker utenfor.
- [ ] Talesyntesen sier riktig tekst med riktig stemme (verifisert via wrapper).
- [ ] Ordlistene består sjekken: riktig førstebokstav, ingen duplikater, bildet viser ordet.
- [ ] Spillet åpnes fortsatt direkte fra `file://`.
- [ ] Enfil-bygget er oppdatert hvis versjonen er publisert.
