# Bokstavløpet

Et rolig alfabetspill på norsk, laget for en treåring som holder på å bli kjent med
bokstavene og som liker biler og sjørøvere. Det kjører i nettleseren, virker uten
internett, og lagrer framgangen lokalt på maskinen.

Alt er lagt opp for en som **ikke kan lese**: hver bokstav har et bilde han kan
kjenne igjen og navngi, oppgavene sies høyt, og resultatet vises som stjerner han
kan telle. Teksten på skjermen er der for den voksne som sitter ved siden av.

## Slik starter du

Dobbeltklikk på **`index.html`**. Det er alt — ingen installasjon, ingen server,
ingen konto. Spillet fungerer i Chrome, Edge, Safari og Firefox.

Første trykk på **Start** er også det som slår på lyden. Det er nettleseren som
krever det, og det er derfor knappen er der.

## Slik spiller han

Han velger først en verden — **Racerbanen** eller **Sjørøverøya** — og gir figuren
sin et navn. Navnet brukes gjennom hele spillet.

Så er det tre ting å gjøre:

| | Hva det er |
| --- | --- |
| **Garasjen / Skattekartet** | Trykk på en bokstav og hør den: «L … L for Løve» — samme formel som alfabetbøkene bruker. Bilen kjører bort til bokstaven. Ingen oppgaver, ingen feil, fint å slå opp i mens dere leser. |
| **Finn bokstaven** | Spillet ber om en bokstav, og han velger blant skiltene. Hovedøvelsen. |
| **Første lyd** | Et bilde vises og ordet leses opp — hvilken bokstav begynner det på? |

**På tastaturet** kan han trykke bokstaven direkte i alle tre. Det er ofte den
sterkeste koblingen: tegnet på skjermen og tasten under fingeren er det samme.
`Esc` går tilbake. Spillet tåler at en treåring hamrer på tastaturet — taster som
holdes nede teller ikke, og det er en liten sperre mellom hvert utslag.

**Trykk på bilen eller skipet**, så tuter den og hopper. Det er det første han
prøver, og da skal det skje noe.

## Slik er det bygget

Spillet er med vilje rolig. Det er ikke en innstilling, men måten det er laget på:

- **Ingenting starter av seg selv.** Neste oppgave kommer først når han trykker
  *Videre*. Ingen timer, ingen nedtelling.
- **Ingenting beveger seg mens han tenker.** Ingen bakgrunnsmusikk, ingen
  animasjoner som løper, ingen blinking.
- **Feiringen er kort.** Riktig svar gir ett sekund med figur, lyd og en stjerne —
  så stille.
- **Ingen blindvei.** Etter to bom viser spillet svaret og lar ham trykke på det
  selv, slik at runden alltid ender med at han fikk det til.
- **En runde er åtte oppgaver**, rundt tre minutter, og slutter av seg selv.
  Spillet maser aldri om «en runde til».

Fra start er alt stilt inn på de aller minste: **fem oppgaver i en runde**, to valg å
se på, og hjelp allerede etter ett bom. Vanskegraden stiger til tre valg etter fire
riktige på rad — og spillet sier fra når det blir vanskeligere, for det er den
beskjeden som gjør at det kjennes ut som å klare noe. Blir han eldre, kan du sette
nivået til «litt større» i foreldremenyen: åtte oppgaver, opp til fire valg, og to
forsøk før spillet hjelper.

En bokstav regnes som **mestret** først når han har truffet den på tre *ulike dager*.
Tre på rad i én økt er gjenkjenning; tre ulike dager er læring. Mestrede bokstaver
flyttes over på **garasjeveggen** eller i **skattekista** og blir liggende der. Telleren
oppe i høyre hjørne viser hvor mange av de 29 som er blitt hans, og er den eneste
tingen i spillet som får en liten fanfare når den øker.

## For voksne

**Hold inne tannhjulet** oppe til høyre i ett sekund — det må holdes, slik at barnet
ikke havner der ved et uhell. Trykker du bare kort, sier knappen fra hva den vil ha.
Er du på tastaturet, går det an å gå dit med `Tab` og trykke `Enter`. Der kan du:

- Skru stemme og lydeffekter av og på, og **justere hvor fort stemmen snakker**.
  Standardstemmen snakker som regel for fort for en femåring, så den er satt tregere
  fra start.
- **Velge nivå.** «Helt liten» (standard, fra ca. 3 år) eller «litt større».
- **Velge hvilke bokstaver som er med** — for eksempel bare bokstavene i navnet hans,
  eller de dere leser om denne uka. Dette er funksjonen som knytter spillet til
  lesestundene, og for en treåring er det trolig den nyttigste: begynn med tre–fire
  bokstaver i stedet for alle 29.
- Skru av **«vis bokstaven i oppdraget»**. Da må han kjenne igjen bokstaven kun på
  lyden — et vanskeligere steg å ta når han begynner å sitte trygt.
- Skru av **«la skyer og bølger drive sakte»**. Bakgrunnen er det eneste i spillet som
  beveger seg av seg selv, og den bruker over to minutter på en runde. Holder han
  lettest fokus på en helt stille skjerm, så slå den av.
- Se **hvilke bokstaver han sitter godt i** og hvilke som henger igjen.
- Bytte navn på figurene, eller nullstille alt.

## Ordene, og hvorfor de er som de er

To regler styrer ordvalget:

1. **Ordet skal være noe en treåring kan peke på og si.** Derfor står det «Fly»
   og ikke «Fart», «Ost» og ikke «Olje».
2. **Bildet må passe til ordet han faktisk ville brukt.** Ser han 🍦 sier han
   «is», ikke «isbil» — da ville han lært feil bokstav. Derfor er det «Is»,
   «Kran» og «Lastebil», ikke «Isbil», «Kranbil» og «Dumper».

Der et kjøretøy er både konkret og entydig, er det beholdt: tolv av bokstavene
på Racerbanen er biler, fly, traktorer og raketter.

Noen bokstaver finnes nesten ikke i norske ord et lite barn kjenner — **Q, W, X,
Y, Z, Æ og Å**. Der står det samme ord i begge verdener, rett og slett fordi det
ikke finnes noe bedre å velge mellom. Æ er «Æsj», som er det eneste Æ-ordet en
treåring bruker selv, og W er «WC», som han både kjenner og synes er morsomt.

Listene ligger i **`js/data.js`**, og filen er laget for å bli redigert. Vil dere
at `H` skal være «Hest» i stedet for «Hjul», så endrer dere den ene linja:

```js
'H': { ord: 'Hest', ikon: '🐴' },
```

Bytt gjerne til ordene fra alfabetboka dere leser — da kjenner han dem igjen
begge veier. Husk bare de to reglene over når dere velger bilde.

## Om stemmen

Spillet bruker nettleserens egen talesyntese. **Kvaliteten kommer fra stemmen
operativsystemet har installert, ikke fra spillet.** De gamle innebygde norske
stemmene er metalliske; de nyere nevrale stemmene er langt bedre, og gratis:

- **Mac:** Systeminnstillinger → Tilgjengelighet → Talt innhold → Systemstemme →
  Tilpass. Last ned **Nora (Premium)**.
- **Windows:** Innstillinger → Tid og språk → Tale → Legg til stemmer → Norsk bokmål.
  Stemmer som heter **Natural** eller **Online** er de nye. Microsoft Edge viser som
  regel flere av dem enn Chrome gjør.

Spillet plukker den beste norske stemmen det finner av seg selv, men i foreldremenyen
ligger det en liste over alle stemmene maskinen har, med en **Hør stemmen**-knapp så
du kan sammenligne og velge selv. Ved siden av knappen står det hvilken stemme som
**faktisk er i bruk akkurat nå** — sjekk den hvis du er i tvil om et valg slo inn.

Et par ting som er greie å vite på Mac:

- Etter at du har lastet ned en ny stemme, må nettleseren startes på nytt før den
  dukker opp i lista. Chrome er tregest til å oppdage nye stemmer; **Safari viser som
  regel premiumstemmene først**.
- Mac har ofte flere stemmer som alle heter «Nora». Lista merker dem som *enkel*,
  *forbedret* og *premium* så du ser hvilken du velger, og valget lagres på stemmens
  egen id — ikke på navnet.

To ting til om lyden:

- Bokstavnavnene er skrevet ut i koden («ku» for Q, «dobbelt-ve» for W). Får
  talesyntesen bare tegnet, leser flere stemmer det som «stor L» eller staver det på
  engelsk.
- **Ikke skru talefarten for langt ned.** Under «rolig» begynner de fleste stemmer å
  slure og høres *mer* robotaktige ut. Roen i spillet kommer fra pausene mellom
  setningene i stedet.

Finnes ingen norsk stemme i det hele tatt, sier foreldremenyen fra, og spillet
fungerer fortsatt — da må en voksen si bokstaven ved siden av.

## Få det opp i nettleseren

Spillet er rene statiske filer, så det finnes flere veier. Velg etter hva du
trenger.

### Én enkelt fil (enklest å flytte rundt)

```bash
node bygg-enfil.js
```

Det lager **`bokstavlopet.html`** — hele spillet i én fil på rundt 220 KB, med
skriftene og alt annet inni. Den kan sendes på e-post, AirDropes til en iPad,
legges på en minnepinne eller åpnes rett fra Nedlastinger. Ingen server, ingen
mapper som må følge med, virker uten nett.

Kjør kommandoen på nytt hver gang du har endret ordene i `js/data.js`.

### GitHub Pages (fast adresse du styrer selv)

Gå til **Settings → Pages** i repoet og velg grenen som kilde. Da får du en
adresse som oppdaterer seg hver gang du pusher.

Én ting å vite: **repoet er privat, og GitHub Pages er bare gratis for
offentlige repoer.** Du må enten gjøre repoet offentlig (Settings → General →
Change visibility) eller ha GitHub Pro. Spillet inneholder ingenting følsomt, så
å gjøre det offentlig er uproblematisk — men det er ditt valg.

### Slippe filen et sted uten å gjøre repoet offentlig

`bokstavlopet.html` kan dras rett inn på **Netlify Drop** (netlify.com/drop)
eller **Cloudflare Pages**. Begge tar imot en enkeltfil og gir deg en URL på
under et minutt.

Framgangen lagres per nettleser, så den følger ikke med mellom maskiner.

## Om figurene

Lynet McQueen (Disney/Pixar) og Kaptein Sabeltann (Terje Formoe) er beskyttede
figurer, og er ikke brukt her. Racerbilen og skipet er tegnet for dette spillet, i
samme ånd, og barnet gir dem navn selv.

## Filene

```
index.html        hele skjermen: scenen, de sju skjermbildene og foreldremenyen
css/stil.css      designsystem, scene, farger og animasjoner
css/fonter.css    de to skriftene, lagt inn som base64 så de virker uten nett
js/data.js        bokstavene, ordene og navneforslagene  ← denne kan dere endre
js/figurer.js     bil, skip og landskap, tegnet som SVG
js/lagring.js     framgang og innstillinger (localStorage)
js/tale.js        norsk talesyntese
js/lyd.js         lydeffekter, laget av nettleseren selv
js/moduser.js     de tre modusene
js/spill.js       navigasjon, scene, tastatur og foreldremeny
bygg-enfil.js     limer alt sammen til én fil du kan flytte rundt
```

## Skriftene

Spillet bruker **Baloo 2** til de store bokstavene — runde, tydelige former som ligner
dem barn møter i alfabetbøker — og **Nunito** til all annen tekst. Begge ligger lagret
inne i `css/fonter.css` som base64, slik at de virker selv når `index.html` åpnes rett
fra disk uten nett. Begge er lisensiert under SIL Open Font License 1.1.
