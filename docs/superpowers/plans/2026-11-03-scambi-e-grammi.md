# Scambi del medico e grammi reali — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** segnare lo scambio del medico e i grammi reali di ogni alimento, per giorno, e usarli nei totali; chiudere i rilievi minori del fuori piano.

**Architecture:** tabella Dexie `itemLogs` (schema 4) con una riga per alimento modificato; calcoli puri in `src/domain/eaten.ts`; stato in `src/state/eaten.svelte.ts`; il foglio Sostituzioni diventa il foglio «cosa hai preso»; un solo Toast condiviso.

**Tech Stack:** Svelte 5, TypeScript strict, Dexie 4, Vitest + Testing Library + fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-11-03-scambi-e-grammi-design.md`

## Global Constraints

- Italiano ovunque; commit piccoli su `v2`; niente push senza conferma.
- `src/domain/` senza import da `db/`, `state/`, `ui/`; ogni calcolo nuovo ha un test.
- File sotto ~200 righe; componenti che non mutano props.
- Autofixer pulito su ogni `.svelte` toccato; `npm run check` a 0; `npm test` verde.
- Solo scambi del medico (`PlanItem.subs`); alternative indicative solo da consultare.
- Cambiare scambio/grammi non segna il pasto fatto.
- Grammi: > 0, virgola ammessa (`parseAmount`), passi da 5 g.

## Review Focus

- Piano modificato dopo aver segnato uno scambio: il log non deve applicarsi a un altro alimento → `eatenItems` ignora log con `planFoodId` diverso, Task 1.
- Riportare a mano grammi e alimento uguali al piano: nessun log «fantasma» → `set` cancella, Task 2.
- Grammi con la virgola o vuoti nel foglio: «40,5» vale 40,5; vuoto non salva → Task 4.
- Un pasto libero: i suoi alimenti del piano non contano comunque, anche con log → `dayBalance` esclude i liberi prima dei log, Task 1.
- Due avvisi di fila: il secondo sostituisce il primo e il suo «Annulla» agisce sull'ultimo → Task 3.

---

### Task 1: Calcoli degli alimenti mangiati

**Files:** Create `src/domain/eaten.ts`; Modify `src/domain/types.ts` (aggiunge `ItemLog` come in spec §2), `src/domain/extras.ts`; Test `src/domain/eaten.test.ts`, `src/domain/extras.test.ts`.

**Produces:** `ItemLog`; `EatenItem`; `choiceGrams(item, foodId)`; `eatenItems(meal, logs, date)`; `eatenMealMacro(meal, logs, date, foods)`; `dayBalance(meals, done, frees, dayExtras, foods, itemLogs = [])`; `weekSummary` conta `freeKcal` solo per voci con `MealLog` libero corrispondente (le altre vanno in `offPlanKcal`).

- [ ] Test: `choiceGrams` (piano → grammi del piano; scambio → grammi dello scambio; altro → null); `eatenItems` (senza log = piano; log scambio → `swapped`, `changed=false`; log grammi → `changed`; log con `planFoodId` diverso → ignorato); `eatenMealMacro` usa il cibo e i grammi del log; `dayBalance` con un log di scambio cambia `fromPlan` ma non `planned`; `weekSummary` con voce orfana → in `offPlanKcal`.
- [ ] `npx vitest run src/domain` → FAIL; implementa; → PASS; check → 0; commit `Scambi: calcoli degli alimenti mangiati`.

### Task 2: Database v4, backup v4, stato, caricamento all'avvio

**Files:** Modify `src/db/schema.ts`, `src/db/repos.ts`, `src/db/backup.ts`, `src/state/app.svelte.ts`, `src/App.svelte`, `src/screens/plan/BackupScreen.svelte`; Create `src/state/eaten.svelte.ts`; Test `src/db/db.test.ts`, `src/state/eaten.test.ts`.

**Produces:** `db.itemLogs` (`'[date+slot+index], date'`, versione 4); `putItemLog`, `deleteItemLog`; `Backup.version: 2|3|4` con `itemLogs`; `BackupSummary.freeMeals`; `eatenState` con `itemLogs`, `load()`, `forDate(date)`, `set(date, slot, index, item, foodId, grams)`, `reset(date, slot, index)`; `app.load()` attende `extrasState.load()` e `eatenState.load()` prima di `ready` (via import dinamico o callback per evitare cicli di import: le due classi importano `app`).

- [ ] Test DB: upgrade 3→4 conserva i dati; backup v4 andata e ritorno con `itemLogs`; import di un v3 → `itemLogs = []`; `summary.mealLogs` esclude i liberi, `summary.freeMeals` li conta.
- [ ] Test stato: `set` con scambio salva; `set` uguale al piano cancella il log; `reset` cancella.
- [ ] FAIL → implementa → PASS; suite completa; check; autofixer su `App.svelte`, `BackupScreen.svelte`; commit `Scambi: database v4, backup e stato`.

### Task 3: Avviso unico, annulla per ogni aggiunta, righe unite

**Files:** Create `src/state/toast.svelte.ts`; Modify `src/App.svelte`, `src/ui/Toast.svelte` (legge lo stato condiviso), `src/screens/Peso.svelte`, `src/screens/extras/AddExtraSheet.svelte`, `src/screens/extras/ExtraItemSheet.svelte`, `src/screens/extras/ExtraForm.svelte`, `src/screens/extras/FoodGramsForm.svelte`, `src/state/extras.svelte.ts`; Test `src/screens/screens.test.ts`, `src/state/extras.test.ts`.

**Produces:** `toast.show(message: string, action?: { label: string; run: () => void | Promise<void> }, ms = 5000)`, `toast.message`, `toast.action`, `toast.dismiss()`; un solo `<Toast />` in `App.svelte` (anche nei test che renderizzano `DayView`/`Peso` il Toast va montato: i test usano un piccolo componente di test oppure `DayView`/`Peso` montano `<Toast />` se non c'è App — decidi e annota la scelta). `ExtraForm`/`FoodGramsForm` chiamano `onDone(e: ExtraLog)`; `AddExtraSheet` mostra l'avviso con Annulla. `restore` e `unmarkFree` uniscono con una riga uguale (stessi `date`, `origin`, `refId`, `freeSlot`, non `manuale`/`alimento`) sommando `qty`.

- [ ] Test: dopo una voce a mano compare «barretta aggiunto · …» con Annulla che la toglie; due avvisi di fila → resta solo il secondo; `restore` su una riga uguale esistente → una riga con qty sommata; `unmarkFree` con uno sgarro uguale → una riga.
- [ ] FAIL → implementa → PASS; suite; check; autofixer; commit `Fuori piano: avviso unico, annulla per ogni aggiunta, righe unite`.

### Task 4: Foglio «cosa hai preso» e scheda del pasto

**Files:** Modify `src/screens/SubsSheet.svelte`, `src/screens/MealCard.svelte`, `src/screens/DayView.svelte`, `src/screens/Settimana.svelte`; Test `src/screens/screens.test.ts`.

**Produces:** `SubsSheet` props `{ target: { date: string; slot: Slot; index: number; item: PlanItem } | null ($bindable) }`; scelta singola «Come da piano» + scambi (role `radio`, nome = nome alimento), campo `aria-label="Grammi mangiati"` con − / + (`aria-label="5 grammi in meno"`, `"5 grammi in più"`), «Torna al piano»; scheda Alternative invariata. `MealCard` riceve `eaten: EatenItem[]` e `onItem(index)`; ogni alimento è un pulsante. `DayView` e `Settimana` passano gli `itemLogs` a `dayBalance`.

- [ ] Test: toccando «Manzo magro» a cena di mercoledì e scegliendo «Pollo» → `db.itemLogs` ha `{ foodId: 'pollo', grams: 253 }` e la scheda mostra «al posto di Manzo magro»; grammi «40,5» → 40.5; «Torna al piano» cancella il log; il pasto resta da fare.
- [ ] FAIL → implementa → PASS; suite; check; autofixer; commit `Scambi: foglio «cosa hai preso» e scheda del pasto`.

### Task 5: Barra del bilancio senza piano e leggibile da VoiceOver

**Files:** Modify `src/ui/BalanceBar.svelte`, `src/screens/DayView.svelte`; Test `src/screens/screens.test.ts`.

- [ ] Test: con `planned.kcal === 0` la barra non mostra «di 0 kcal» né «Piano»; l'`aria-label` contiene il totale («Bilancio del giorno: 300 kcal…, dettagli»); la nota sulle stime compare quando ci sono voci anche senza piano. (Aggiorna i test esistenti che cercano il nome «Bilancio del giorno: dettagli» a un'espressione regolare.)
- [ ] FAIL → implementa → PASS; suite; check; autofixer; commit `Bilancio: senza piano e con i numeri per VoiceOver`.

### Task 6: Verifica a schermo e documenti

- [ ] Build, preview `dieta-v2-build`, 375×812 chiaro e scuro: cena con scambio, foglio aperto, grammi cambiati, avviso unico; correggi quello che si vede (al massimo due giri).
- [ ] Aggiorna `DESIGN.md` e lo stato della spec; commit `Scambi: verifica a schermo e documentazione`. Niente push.
