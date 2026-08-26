# Bokstavløpet

Et rolig alfabetspill på norsk, laget for et barn som holder på å lære bokstavene og
som liker biler og sjørøvere. Det kjører i nettleseren, virker uten internett, og
lagrer framgangen lokalt på maskinen.

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
| **Garasjen / Skattekartet** | Trykk på en bokstav og hør den: «B … b-b-bil … som i Bil». Ingen oppgaver, ingen feil. Fint å slå opp i mens dere leser. |
| **Finn bokstaven** | Spillet ber om en bokstav, og han velger blant skiltene. Hovedøvelsen. |
| **Første lyd** | Et bilde vises og ordet leses opp — hvilken bokstav begynner det på? |

**På tastaturet** kan han trykke bokstaven direkte i alle tre. Det er ofte den
sterkeste koblingen: tegnet på skjermen og tasten under fingeren er det samme.
`Esc` går tilbake.

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

Vanskegraden starter på to valg og stiger til tre og fire etter fem riktige på rad —
og spillet sier fra når det blir vanskeligere, for det er den beskjeden som gjør at
det kjennes ut som å klare noe.

En bokstav regnes som **mestret** først når han har truffet den på tre *ulike dager*.
Tre på rad i én økt er gjenkjenning; tre ulike dager er læring. Mestrede bokstaver
flyttes over på garasjeveggen eller skattekartet og blir liggende der.

## For voksne

Hold inne **tannhjulet** oppe til høyre i to sekunder. (Det må holdes inne, slik at
barnet ikke havner der ved et uhell.) Der kan du:

- Skru stemme og lydeffekter av og på, og **justere hvor fort stemmen snakker**.
  Standardstemmen snakker som regel for fort for en femåring, så den er satt tregere
  fra start.
- **Velge hvilke bokstaver som er med** — for eksempel bare bokstavene i navnet hans,
  eller de dere leser om denne uka. Dette er funksjonen som knytter spillet til
  lesestundene.
- Skru av **«vis bokstaven i oppdraget»**. Da må han kjenne igjen bokstaven kun på
  lyden — et vanskeligere steg å ta når han begynner å sitte trygt.
- Se **hvilke bokstaver han sitter godt i** og hvilke som henger igjen.
- Bytte navn på figurene, eller nullstille alt.

## Bytte ut ordene

Ordene ligger i **`js/data.js`**, og filen er laget for å bli redigert. Vil dere at
`H` skal være «Hjelm» i stedet for «Hjul», så endrer dere den ene linja:

```js
'H': { ord: 'Hjelm', ikon: '⛑️' },
```

Det er én ordliste per verden. Bytt gjerne til ordene fra alfabetboka dere leser —
da kjenner han dem igjen begge veier.

## Om stemmen

Spillet bruker nettleserens egen talesyntese og leter etter en norsk stemme. Finnes
ingen, sier foreldremenyen fra, og spillet fungerer fortsatt — da må en voksen si
bokstavlyden ved siden av. Norsk stemme legges til i operativsystemets innstillinger
for språk og tale.

## Legge det på nett

Filene er statiske, så de kan legges rett ut på GitHub Pages: gå til
**Settings → Pages** i repoet og velg grenen. Da kan spillet åpnes fra hvilken som
helst maskin uten å kopiere filer. Framgangen lagres per nettleser.

## Om figurene

Lynet McQueen (Disney/Pixar) og Kaptein Sabeltann (Terje Formoe) er beskyttede
figurer, og er ikke brukt her. Racerbilen og skipet er tegnet for dette spillet, i
samme ånd, og barnet gir dem navn selv.

## Filene

```
index.html        hele skjermen, og figurene tegnet som SVG
css/stil.css      utseende, farger og de få animasjonene
js/data.js        bokstavene og ordene  ← denne kan dere endre
js/lagring.js     framgang og innstillinger (localStorage)
js/tale.js        norsk talesyntese
js/lyd.js         lydeffekter, laget av nettleseren selv
js/moduser.js     de tre modusene
js/spill.js       navigasjon, tastatur og foreldremeny
```
