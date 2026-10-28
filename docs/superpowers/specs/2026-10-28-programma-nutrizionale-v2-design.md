# Programma Nutrizionale v2 — design

Data: 2026-10-28 · Stato: implementato sul branch `v2`

## 1. Obiettivo

Riscrivere da zero l'app del piano alimentare. Oggi è un unico `index.html` di
2.100 righe: dati, logica e interfaccia stanno insieme, non ci sono test e il
piano si cambia modificando il JSON a mano.

**Per chi:** una sola persona (l'autore), sul proprio iPhone, con il piano del
Dott. Occhino. Niente account, niente server, niente App Store nella v1.

**Cosa deve migliorare (detto dall'utente):**
1. Troppo affollata → apri l'app e vedi subito cosa mangiare adesso.
2. Cambiare piano è scomodo → editor guidato nell'app, offline.
3. Aspetto e feeling → deve sembrare un'app iOS nativa.
4. Tracciamento più ricco → nella v1: peso con grafico.

**Criteri di successo**
- Aprendo l'app, il pasto da fare adesso e i suoi grammi si vedono senza toccare nulla.
- Un piano nuovo di 7 giorni si inserisce dall'editor senza toccare codice o JSON.
- I calcoli di kcal e macro sono coperti da test automatici.
- Il piano attuale e lo storico dei pasti fatti passano alla v2 senza perdite.
- Funziona offline ed è installabile dalla Home di iOS.

## 2. Perimetro

**Dentro la v1**
- Oggi: il pasto di adesso, "Fatto", totale del giorno, gli altri pasti.
- Settimana: i 7 giorni con i pasti fatti, le kcal e l'aderenza.
- Peso: pesata, grafico con media mobile a 7 giorni e obiettivo, storico.
- Piano: editor guidato del piano e catalogo alimenti.
- Sostituzioni: foglio dal basso con gli scambi del medico e le alternative indicative.
- Backup: export/import JSON.
- Migrazione una tantum dalla v1 attuale.

**Fuori dalla v1** (eventuali moduli futuri): spesa e prep, sgarri e
compensazione, ricette, acqua e integratori, misure corporee, promemoria e
notifiche, più profili, App Store e Capacitor, sincronizzazione tra dispositivi.

## 3. Direzione visiva

Stile **"iOS nativo"** (scelta A nel companion visivo):
- Sfondo `#F2F2F7`, schede bianche con raggio 14–16 px, separatori sottili.
- Font di sistema (`-apple-system`, SF Pro); titoli grandi in stile iOS.
- Tab bar in basso con 4 voci: **Oggi · Settimana · Peso · Piano**.
- Colori di sistema iOS: verde `#34C759` per "Fatto", blu `#007AFF` per le azioni.
  Ogni fascia di pasto ha un colore d'accento (per esempio pranzo arancio, cena indaco).
- Icone **Phosphor** (`phosphor-svelte`): peso *regular* per le cose da fare,
  *fill* per quelle fatte.
- Modalità scura che segue il sistema, con la palette scura di iOS.
- Rispetto di `safe-area-inset` e di `prefers-reduced-motion`; target di tocco ≥ 44 px.
- Animazioni brevi: spunta su "Fatto", foglio che sale, cambio di scheda.

## 4. Schermate

### 4.1 Oggi (schermata iniziale)
- Intestazione con data e titolo grande "Oggi".
- **Scheda "Adesso"**: il primo pasto non fatto della giornata, cioè il primo
  della lista in ordine di fascia oraria. Mostra titolo, alimenti con grammi e
  il pulsante "✓ Fatto". Gli alimenti che hanno sostituzioni hanno l'icona ⇄ e
  aprono il foglio (4.5).
- Riga del totale: kcal consumate su kcal del piano; P/C/G in grammi.
  Conta solo i pasti segnati come fatti.
- Elenco degli altri pasti del giorno, ciascuno con lo stato fatto/da fare.
  Toccando un pasto si espande o si apre; anche lì c'è "Fatto" (con annulla).
- Se non c'è un piano attivo, mostra l'invito ad aprire l'editor.
- Quando tutti i pasti sono fatti, la scheda "Adesso" diventa un riepilogo di giornata completata.

### 4.2 Settimana
- La settimana ISO corrente in lista (Lun→Dom): pasti fatti / totali e kcal consumate.
- Aderenza della settimana: pasti fatti / pasti previsti.
- Toccando un giorno si apre la stessa vista di Oggi per quella data.
  I giorni passati sono modificabili (si può segnare un pasto dimenticato).
- Frecce o swipe per le settimane precedenti, anche con lo storico migrato in forma aggregata.

### 4.3 Peso
- "+ Pesata di oggi": tastiera numerica con un decimale, data preimpostata a
  oggi e modificabile.
- Grafico SVG fatto a mano (senza librerie): pesate grezze in grigio, media
  mobile a 7 giorni in blu, obiettivo tratteggiato in verde. Intervalli 1M / 3M / 1A / Tutto.
- In evidenza: media a 7 giorni e variazione rispetto alla settimana prima.
- Storico in lista; swipe per eliminare una pesata.
- L'obiettivo si imposta da qui ed è facoltativo.

### 4.4 Piano (editor)
- Selettore del giorno (Lun…Dom) → pasti del giorno → alimenti.
- Pasto: fascia (Colazione, Spuntino mattino, Pranzo, Spuntino pomeriggio,
  Cena), titolo libero, nota libera (per "liberi", consigli, preparazione) e
  kcal/macro calcolate.
- Alimento: scelto dal catalogo con ricerca, grammi, e scambi del medico (una
  lista di alimento + grammi). Le kcal si vedono mentre scrivi.
- Azioni: aggiungi, riordina, elimina un alimento o un pasto; **duplica giorno
  su…**; **applica questo pasto a tutti i giorni** (per colazione e spuntini fissi).
- Catalogo alimenti: elenco, ricerca, aggiunta o modifica di un alimento
  (nome, valori per 100 g, categoria, fonte).
- Impostazioni: nome del piano, export/import backup, ripristina il piano di
  esempio, informazioni sullo storage.
- Si modifica una bozza del piano: il piano attivo cambia solo con "Salva" e
  solo se la validazione (6.1) passa.

### 4.5 Foglio Sostituzioni
- Sale dal basso toccando un alimento con ⇄. Titolo: "Al posto di 80 g di riso".
- Due schede: **Dott. Occhino** (gli scambi salvati nel piano) e **Alternative**
  (calcolate).
- Le alternative sono marcate come indicative, con la nota "da verificare con
  il medico", e riportano le fonti come nel README attuale.
- La v1 non applica la sostituzione al tracciamento: il foglio serve solo da consultazione.

## 5. Architettura

**Stack:** Vite · Svelte 5 (runes) · TypeScript strict · Dexie (IndexedDB) ·
vite-plugin-pwa (Workbox) · phosphor-svelte · Vitest + @testing-library/svelte.
Router minimale a hash (4 schede più le viste di dettaglio), senza SvelteKit.

```
src/
  domain/      logica pura TS, nessuna dipendenza da DOM o DB
    types.ts         Food, Plan, Day, Meal, PlanItem, MealLog, Weight, Settings
    nutrition.ts     macro per alimento, pasto, giorno; arrotondamenti
    substitutions.ts alternative a rapporto (regole di oggi) + grammi
    schedule.ts      giorno della settimana, settimana ISO, pasto "adesso"
    weight.ts        media mobile, variazioni, filtro per intervallo
    validate.ts      validazione del piano e del backup
    legacy.ts        conversione dal formato v1 (localStorage) al modello v2
  db/          Dexie: schema, repository, backup, migrazione
    schema.ts  repos.ts  backup.ts  migrate.ts   (catalogo iniziale in domain/catalog.ts)
  state/       stato reattivo Svelte 5 (*.svelte.ts)
    plan.svelte.ts  today.svelte.ts  weight.svelte.ts
  ui/          componenti di base stile iOS
    Card  ListRow  Sheet  TabBar  NavHeader  SegmentedControl  NumberField  ...
  screens/     Oggi  Settimana  Peso  Piano (+ PlanDay, FoodPicker, FoodEdit)  SubsSheet
  app.css  App.svelte  main.ts
```

**Regole**
- `domain/` non importa nulla di `db/`, `state/` o `ui/`. Tutti i calcoli stanno qui.
- Ogni file resta indicativamente sotto le 200 righe; se cresce, va diviso.
- Componenti `ui/` senza logica di dominio; le schermate leggono da `state/`.

## 6. Dati

```ts
Food     { id, name, per100: {kcal, p, c, f}, category, source: 'tabelle'|'etichetta'|'manuale' }
PlanItem { foodId, grams, subs: {foodId, grams}[] }   // subs = scambi del medico
Meal     { slot: 'colazione'|'spuntinoMattino'|'pranzo'|'spuntinoPomeriggio'|'cena',
           title, note, items: PlanItem[] }
Day      { meals: Meal[] }                            // ordinati per slot
Plan     { id, name, startDate, days: Day[7] }         // indice 0 = lunedì
MealLog  { date: 'YYYY-MM-DD', slot, planId }          // presenza = fatto
Weight   { date: 'YYYY-MM-DD', kg }                    // una per giorno
LegacyWeek { week: 'YYYY-Www', done, total, perSlot: number[5] }  // storico v1 aggregato
Settings { activePlanId, weightGoalKg?, lastBackupAt?, migratedFromV1: boolean }
```

- Tabelle Dexie: `foods`, `plans`, `mealLogs` (chiave `[date+slot]`),
  `weights` (chiave `date`), `legacyWeeks`, `settings`.
- **Catalogo iniziale (`domain/catalog.ts`):** i 67 alimenti del piano attuale
  e delle sue sostituzioni. *Scostamento dal design originale:* i valori per
  100 g sono **quelli della v1** (stime da tabelle pubbliche, CREA e
  equivalenti), con `source: 'tabelle'`; i prodotti confezionati hanno
  `source: 'etichetta'`. Non sono stati riscontrati uno per uno sulla banca
  dati CREA, che non offre un'API o un export JSON. Così i totali restano
  identici a quelli della v1 (es. mercoledì 2.212 kcal). Il riscontro si fa
  dal catalogo: un valore modificato diventa `source: 'manuale'`.
- **Alternative:** si riportano le regole di oggi (`WEB_RULES`): cereali 1:1,
  pasta→pane ×1,25, pasta→patate ×4, pane→patate ×3, pollo→merluzzo ×1,33,
  pollo→salmone ×0,68, arrotondamento a 5 g.
- All'avvio: `navigator.storage.persist()`. Se `lastBackupAt` ha più di 30
  giorni, un banner discreto in Piano invita a esportare.
- **Backup:** `{ app: 'programma-nutrizionale', version: 2, exportedAt, foods,
  plans, mealLogs, weights, legacyWeeks, settings }`.

### 6.1 Validazione del piano
Un piano è valido se ha 7 giorni, ogni pasto ha almeno un alimento, ogni
alimento ha grammi > 0 ed esiste nel catalogo (vale anche per gli scambi), e
non ci sono due pasti con la stessa fascia nello stesso giorno. L'editor mostra
l'errore sulla riga interessata.

## 7. Migrazione dalla v1

La v2 si pubblica allo stesso indirizzo GitHub Pages
(`mythyuno.github.io/programma-nutrizionale`), quindi ha la stessa origine e
può leggere il `localStorage` della v1.

Al primo avvio, se `settings.migratedFromV1` è falso:
1. **Piano:** se c'è, legge `piano11-plan-v1`, altrimenti usa il `DEFAULT_PLAN`
   della v1 (ricopiato in `legacy.ts` come dato di esempio). Lo converte così:
   - colazione e i due spuntini fissi vengono copiati in tutti i 7 giorni;
   - `ing` → `PlanItem` (nome → alimento del catalogo per corrispondenza
     normalizzata, grammi da `parseGrams`); un nome che non corrisponde crea un
     alimento `manuale` con macro a zero e lo segnala;
   - `sub` → `subs`; `liberi`, `tip`, `steps` e `alts` → `note` (testo semplice, HTML rimosso).
2. **Pasti fatti:** `piano11-fatti` (settimana corrente, chiavi `giorno-slot`)
   → `MealLog` con le date reali della settimana.
3. **Storico:** `piano11-storico` → `LegacyWeek`.
4. Le altre chiavi della v1 (sgarri, acqua, spesa, voci proprie) si ignorano e
   non si cancellano.
5. `migratedFromV1 = true`. Se un passo fallisce, l'app parte con il piano
   convertito dal default e mostra un avviso. La migrazione non blocca mai l'avvio.

I file della v1 (`index.html` monolitico, `sw.js` scritto a mano) escono dal
repo e restano nella cronologia git. Il nuovo service worker ha un nome di
cache diverso e all'attivazione elimina le cache `piano11-*`.

## 8. Errori e casi limite

- Piano non valido: non si salva; errori in linea nell'editor.
- Import di un backup: controllo di versione e struttura → anteprima con i
  conteggi → conferma → backup automatico dei dati correnti (download) → sovrascrittura.
- Nessun piano attivo: Oggi rimanda all'editor.
- Pesata doppia nello stesso giorno: sostituisce la precedente.
- Alimento usato nel piano: non si può eliminare dal catalogo (messaggio con
  l'elenco dei pasti che lo usano).
- Storage non persistente concesso: nessun blocco, solo un'informazione in Impostazioni.
- Cambio di giorno con l'app aperta: Oggi si aggiorna quando torna in primo piano (`visibilitychange`).

## 9. Test

- **Unitari (Vitest)** su tutto `domain/`: macro e arrotondamenti, alternative,
  pasto "adesso" e settimana ISO (anche attorno alla mezzanotte e a capodanno),
  media mobile, validazione, conversione legacy. Per la conversione si usa come
  fixture il `DEFAULT_PLAN` reale della v1.
- **db/** con `fake-indexeddb`: round-trip del backup e migrazione end-to-end
  da un `localStorage` simulato.
- **Componenti** (@testing-library/svelte): segnare/annullare un pasto in Oggi,
  aggiungere un alimento nell'editor, registrare una pesata.
- **Verifica manuale** nel browser a 375×812, in chiaro e in scuro, prima dei
  commit di ogni schermata.
- CI: GitHub Action che esegue `npm test` e `npm run build`, e pubblica su Pages solo se passano.

## 10. Pubblicazione

- `vite.config.ts` con `base: '/programma-nutrizionale/'`.
- Manifest PWA generato da vite-plugin-pwa con le icone esistenti
  (`icon-180.png`, `icon-512.png`); precache dell'app shell; `registerType: 'autoUpdate'`.
- GitHub Pages servito da GitHub Actions (non più dalla root del branch).
