# Design — "Colore dell'ora"

Direzione scelta dall'utente il 28/10/2026, dopo aver bocciato la v2 in stile
iOS di sistema e due giri di proposte (Orario, Quaderno, Maiolica; poi Pila e
Tattile). I token vivono in `src/app.css`.

## Idea
Il fondo dell'intera app ha il colore del pasto che tocca adesso. Capisci a
che punto della giornata sei prima di leggere. Sopra il colore galleggia una
sola scheda grande, il pasto di adesso; quando lo segni fatto, il fondo sfuma
(0,7 s) nel colore del pasto dopo. È l'unico momento animato "di firma".

Rifiutato di proposito: schede bianche su grigio, colori di sistema iOS,
anelli di avanzamento, etichette in maiuscolo sopra i titoli, metafore a tema.

## Colore
`App.svelte` imposta `data-hour` su `<html>` con la fascia del pasto di adesso
(a giornata finita: `cena`). Ogni fascia definisce:

| Fascia | Fondo chiaro | Testo sul fondo | Fondo scuro | Colore sulle schede (chiaro / scuro) |
|---|---|---|---|---|
| Colazione | `#F0B040` miele | `#3A2604` | `#6B4A12` | `#A86B0E` / `#F0B95A` |
| Spuntino mattino | `#1F7F64` menta | `#FFFFFF` | `#124A3B` | `#1F7F64` / `#5CCBA5` |
| Pranzo | `#2F63D6` blu | `#FFFFFF` | `#16306B` | `#2F63D6` / `#7FA4F5` |
| Spuntino pomeriggio | `#7457CC` lavanda | `#FFFFFF` | `#33266B` | `#6A4FC4` / `#A993F0` |
| Cena | `#1E2A5C` notte | `#FFFFFF` | `#0E1430` | `#2B3A7A` / `#9AA8E8` |

Token derivati: `--hour`, `--on-hour`, `--on-hour-2` (testo attenuato),
`--hour-deep` (tab bar, ombre), `--veil` (righe traslucide sul fondo),
`--act` (azione, = colore della fascia sulle schede). In scuro le schede
(`--card`) prendono il 38% di `--hour-deep`, per non staccare dal fondo.

Schede: `--card` bianco, inchiostro `--ink #14182A`, secondario `--ink-2 #5B6072`.
Errori `--danger`, avvisi `--warn`. Nessun grigio di sistema.

## Superfici e profondità
- Scheda (`.card`): raggio 24 px, ombra a due strati tinta da `--hour-deep`.
- Elenco (`.group`): raggio 18 px, ombra di contatto leggera.
- Righe sul fondo (pasti compatti di Oggi): velatura `--veil`, testo `--on-hour`;
  aperte diventano scheda.
- Foglio dal basso: piano `--card-2`, raggio 28 px; dentro, elenchi con bordo e senza ombra.
- Pulsante principale: `--act` pieno, raggio 16 px, luce interna in alto e ombra
  del suo colore; premuto scende di 1 px.

## Tipografia
Solo font di sistema (scelta dell'utente). Titolo grande 34/800, −0,025em;
nome della fascia nella scheda di adesso 28/800 nel colore della fascia;
grammi 26/800 con cifre tabulari e unità piccola; corpo 17; note 13–15.
Niente maiuscoletto, niente etichette sopra i titoli: il contesto (data,
settimana) va sotto il titolo, in `.subtitle`.

## Componenti propri
- `ui/DayStrip.svelte`: la giornata in segmenti, uno per pasto. Sulle schede
  ogni segmento ha il colore della sua fascia; sul fondo (`ground`) usa
  `--on-hour`. Sostituisce l'anello di avanzamento.
- `ui/Segmented.svelte`: variante `ground` per stare sul fondo colorato.
- `.btn.on-ground`, `.ground-link`, `.icon-btn`: controlli fuori dalle schede.
- `ui/Toast.svelte`: avviso breve sopra la tab bar con un'azione (per esempio
  "Annulla" dopo aver eliminato una pesata).
- Le note di un pasto nell'editor si modificano dal menu «···», non nella scheda.

## Fuori piano e pasto libero (novembre 2026)
- `ui/BalanceBar.svelte`: il conto del giorno sul fondo. Parte piena = piano
  fatto, parte rigata (`--hatch`) = sgarri e pasto libero, tacca = kcal del
  piano. Mai rosso: lo scarto è un'informazione, non un rimprovero.
- "Ho mangiato altro": pulsante bianco sul fondo subito sotto il conto del
  giorno (`.btn.on-ground`, come «Pesata»). Era fisso in basso a destra, ma
  copriva la prima riga dei pasti: tolto a novembre 2026.
- `ui/FoodIcon.svelte`: icone 3D Fluent Emoji (MIT) in `public/emoji/`, solo
  per le voci di cibo; tutto il resto resta Phosphor.
- Foglio "Ho mangiato altro" (`screens/extras/AddExtraSheet.svelte`): una sola
  ricerca su voci tue, sgarri e alimenti; recenti fissati all'apertura (non si
  spostano sotto il dito); categorie a pillola; altezza minima 62vh.
- Sgarri del giorno come righe velate sul fondo; pasto libero come scheda
  aperta con la pillola "pasto libero" e segmento rigato nella striscia.

## Scambi e grammi reali (novembre 2026)
- Le schede mostrano solo gli alimenti del Dott. Occhino: niente titoli di
  piatti, preparazioni o note. Le ricette avranno una schermata loro.
- Ogni alimento della scheda è un pulsante: apre il foglio «cosa hai preso»
  (`screens/SubsSheet.svelte`) con «Come da piano», gli scambi del medico
  (radio native) e i grammi mangiati (campo grande, − e + di 5 g, virgola
  accettata). «Torna al piano» compare solo se qualcosa è cambiato.
- Quello che è diverso dal piano prende il colore del pasto: nome con la
  pillola «scambio» e la riga «al posto di …», oppure i grammi con «… g nel
  piano». Sotto la scheda: «N kcal stimate (piano M)».
- Cambiare scambio o grammi non segna il pasto come fatto.
- `ui/BalanceBar.svelte` senza piano mostra solo il totale; l'etichetta per
  VoiceOver dice i numeri per esteso.

## Il pasto dell'ora e gli altri giorni (novembre 2026)
- Il pasto di adesso è il primo non segnato a partire dalla fascia dell'ora e
  dall'ultimo pasto segnato, quale dei due viene dopo. Fasce in
  `domain/schedule.ts`: colazione fino alle 10, spuntino fino alle 12, pranzo
  fino alle 15:30, spuntino fino alle 18:30, poi cena. L'ora si rilegge solo
  alla riapertura: il pasto aperto non cambia mentre lo si legge.
- I pasti passati e non segnati hanno la pillola «non segnato», mai «saltato»:
  non averlo segnato non vuol dire non averlo mangiato.
- Titolo con frecce ‹ › e scorrimento di lato (`ui/swipe.ts`) tra i giorni;
  «Oggi», «Domani», «Ieri», poi il nome del giorno. Il ritorno porta alla
  settimana di quel giorno.
- Un giorno futuro si legge soltanto: schede tutte aperte con il nome del pasto
  a 19/800, niente «Fatto», «Pasto libero» né bilancio; il totale stimato sta
  nel sottotitolo. Il foglio mostra gli scambi senza registrare.
- Settimana va anche in avanti; una settimana non cominciata non ha conteggi.

## Ordine (novembre 2026)
- Oggi: le righe chiuse dei pasti sono tutte alte uguali (fascia e pillola su
  una riga, alimenti sulla seconda) e non hanno le kcal, che compaiono nel piede
  quando la riga si apre. Il conto è a 24/800 con «kcal»; la legenda compare
  solo se c'è qualcosa fuori piano.
- Settimana: ogni giorno è una griglia, nome e numeri sopra e striscia sotto a
  tutta larghezza, così le striscette sono allineate. Pasto libero e sgarri in
  una sola riga velata con due numeri. Date con le preposizioni giuste
  («dal 2 all'8 nov», «al 1° nov»).
- Piano: apre sul giorno di oggi; «Alimenti» e «Backup» sono pillole sotto il
  titolo (con «Backup da fare» e un punto quando serve); il nome del piano sta in
  fondo; nelle righe solo i grammi.
- Foglio «cosa hai preso»: il titolo è il solo alimento; il campo dei grammi ha
  il bordo nel colore del pasto solo mentre si scrive.
- Peso: storico diviso per mese (anno solo se diverso), le ultime 14 pesate
  subito e il resto con «Mostra tutte le N pesate».
- Separatori delle righe rientrati da entrambi i lati, ovunque.

## Icona
«Mela-agenda» in 3D lucido (scelta dell'utente il 28/10/2026): una mela verde
la cui polpa è una pagina d'agenda ad anelli, con le righe nei colori dei
pasti, su fondo miele. Sorgente `public/icon.svg`; `icon-180.png` e
`icon-512.png` si generano da lì (Edge headless, 180 e 512 px).

## Regole
- Dentro una scheda di un pasto `--act` diventa il colore di quella fascia.
- I valori nutrizionali restano etichettati come stime.
- Verifica a 375×812 in chiaro e in scuro, per almeno pranzo, colazione e cena.
