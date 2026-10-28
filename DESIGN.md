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
`App.svelte` imposta `data-hour` su `<html>` con la fascia del prossimo pasto
non fatto di oggi (a giornata finita: `cena`). Ogni fascia definisce:

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

## Regole
- Dentro una scheda di un pasto `--act` diventa il colore di quella fascia.
- I valori nutrizionali restano etichettati come stime.
- Verifica a 375×812 in chiaro e in scuro, per almeno pranzo, colazione e cena.
