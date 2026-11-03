# Fuori piano e pasto libero — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** segnare sgarri, voci proprie, alimenti a grammi e il pasto libero settimanale, e vederne il conto in Oggi e in Settimana.

**Architecture:** due tabelle Dexie nuove (`extras`, `customItems`, schema v2) e un campo facoltativo `kind: 'libero'` sui `MealLog`. Tutti i calcoli stanno in `src/domain/extras.ts` (puri, testati); lo stato vive in `src/state/extras.svelte.ts`, separato da `app.svelte.ts`; l'interfaccia aggiunge componenti piccoli in `src/ui/` e `src/screens/extras/`.

**Tech Stack:** Svelte 5 (runes), TypeScript strict, Dexie 4, Vitest + @testing-library/svelte + fake-indexeddb, phosphor-svelte.

**Spec:** `docs/superpowers/specs/2026-11-03-fuori-piano-design.md` (mockup in `docs/superpowers/specs/img/2026-11-03-fuori-piano-mockup.png`).

## Global Constraints

- Lingua di interfaccia, commenti e commit: italiano. Commit piccoli sul branch `v2`; niente push senza conferma.
- `src/domain/` non importa nulla da `db/`, `state/`, `ui/`. Ogni calcolo nuovo ha un test.
- File indicativamente sotto le 200 righe (`app.svelte.ts` compreso).
- I componenti non mutano props: chiamano i metodi dello stato.
- Ogni `.svelte` toccato passa `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5` senza issues.
- `npm run check` a 0 errori e 0 avvisi; `npm test` verde.
- Valori fuori piano sempre presentati come stime: nota fissa "Valori stimati per porzioni tipiche: indicativi, non del medico."
- Stile da `DESIGN.md` ("Colore dell'ora"): token di `src/app.css`, icone Phosphor, rigato bianco (`repeating-linear-gradient(-45deg, …)`) per le parti fuori piano sul fondo, nessun colore d'allarme per lo scarto.
- Icone delle voci di cibo: **Fluent Emoji 3D** di Microsoft (licenza MIT, repo `microsoft/fluentui-emoji`), PNG salvati in `public/emoji/` con la licenza accanto; il resto dell'interfaccia resta Phosphor. Scelta dell'utente: "icone premium, 3D come l'icona dell'app".
- Pasti liberi previsti dal medico: **1** a settimana (`FREE_MEALS_PER_WEEK = 1`).
- kcal ammesse per voce: da 0 a **5000**.

## Review Focus

- Numeri scritti con la virgola ("4,5", "40,5") nei macro e nei grammi: vanno accettati come 4.5 e 40.5 → `parseAmount`, Task 1.
- Aggiungere due volte la stessa voce nello stesso giorno: deve diventare una riga `×2`, non due righe → Task 3.
- Voce propria eliminata ma presente tra i recenti: i recenti non devono mostrarla né rompersi → `recentItems`, Task 2.
- Modificare le kcal a mano nel modulo e poi correggere un macro: le kcal scritte a mano non devono essere sovrascritte → Task 6.
- Pulsante fisso sopra l'ultima voce del giorno: la pagina deve avere spazio sotto, l'ultima riga resta toccabile → verifica a schermo, Task 8.

---

### Task 1: Tipi, catalogo sgarri e calcoli di base

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/extras-catalog.ts`
- Create: `src/domain/extras.ts`
- Test: `src/domain/extras.test.ts`

**Interfaces:**
- Produces (in `types.ts`): `ExtraOrigin`, `CustomItem`, `ExtraLog`, `MealLog.kind?: 'libero'` esattamente come nella spec §2.1; inoltre
  `export type ExtraCategory = 'Dolci' | 'Alcolici' | 'Salato'` e
  `export interface CatalogExtra { id: string; name: string; portion: string; category: ExtraCategory; macro: Macro; icon: FoodIconName }` e
  `export type FoodIconName` = unione dei nomi file del Task 4 (`'beer' | 'wine' | 'cocktail' | 'tumbler' | 'ice-cream' | 'soft-ice-cream' | 'cake' | 'chocolate' | 'croissant' | 'pizza' | 'fries' | 'hamburger' | 'sandwich' | 'potato' | 'cheers' | 'bookmark' | 'plate' | 'pencil'`).
  Icone del catalogo: birre `beer`, vino `wine`, spritz `cocktail`, amaro `tumbler`, gelato `ice-cream`, cono `soft-ice-cream`, tiramisù e torta `cake`, cioccolato `chocolate`, cornetti `croissant`, pizza e trancio `pizza`, patatine fritte `fries`, hamburger `hamburger`, panino `sandwich`, patatine in busta `potato`, aperitivo `cheers`.
- Produces (in `extras-catalog.ts`): `export const EXTRAS_CATALOG: readonly CatalogExtra[]` con le 20 voci della tabella in spec §2.2, id della v1 (`birra33, birra40, birradm, vino, spritz, amaro, gelato, cono, tiramisu, torta, ciocc, cornetto, cornettof, pizza, trancio, patatine, burger, panino, busta, aperitivo`). Regola nome/porzione: il testo prima della virgola è `name`, quello dopo è `portion` ("Gelato in coppetta" / "2 gusti", "Tiramisù" / "una porzione"); senza virgola `portion = ''`.
- Produces (in `extras.ts`):
  - `export const FREE_MEALS_PER_WEEK = 1`
  - `kcalFromMacros(p: number, c: number, f: number): number` → `Math.round(4p + 4c + 9f)`
  - `parseAmount(s: string): number | null` — accetta virgola o punto, spazi; `''` → `null`; testo non numerico → `null`
  - `extraTotal(e: Pick<ExtraLog, 'macro' | 'qty'>): Macro` e `sumExtras(list: readonly ExtraLog[]): Macro` (riusa `add`/`ZERO` di `nutrition.ts`)
  - `interface ExtraInput { name: string; macro: Macro; grams: number | null; origin: ExtraOrigin }`
  - `validateExtra(input: ExtraInput): Partial<Record<'name' | 'kcal' | 'macro' | 'grams', string>>` — oggetto vuoto se valido. Messaggi esatti: `name`: "Scrivi cosa hai mangiato."; `kcal`: "Le kcal devono essere tra 0 e 5000."; `macro`: "Proteine, carboidrati e grassi non possono essere negativi."; `grams` (solo origin `'alimento'`): "Inserisci i grammi."

- [ ] **Step 1: Scrivi i test che falliscono** in `src/domain/extras.test.ts`

```ts
describe('extras · base', () => {
  it('calcola le kcal dai macro', () => {
    expect(kcalFromMacros(4, 22, 9)).toBe(185);
    expect(kcalFromMacros(0, 0, 0)).toBe(0);
  });
  it('legge i numeri con la virgola', () => {
    expect(parseAmount('4,5')).toBe(4.5);
    expect(parseAmount(' 40.5 ')).toBe(40.5);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
  it('moltiplica una voce per la quantità e somma', () => {
    const e = { macro: { kcal: 49, p: 1, c: 7, f: 2 }, qty: 2 };
    expect(extraTotal(e)).toEqual({ kcal: 98, p: 2, c: 14, f: 4 });
  });
  it('valida una voce', () => {
    const ok = { name: 'Barretta', macro: { kcal: 185, p: 4, c: 22, f: 9 }, grams: null, origin: 'manuale' as const };
    expect(validateExtra(ok)).toEqual({});
    expect(validateExtra({ ...ok, name: '  ' }).name).toBe('Scrivi cosa hai mangiato.');
    expect(validateExtra({ ...ok, macro: { ...ok.macro, kcal: 5001 } }).kcal).toBe('Le kcal devono essere tra 0 e 5000.');
    expect(validateExtra({ ...ok, macro: { ...ok.macro, f: -1 } }).macro).toBeDefined();
    expect(validateExtra({ ...ok, origin: 'alimento', grams: 0 }).grams).toBe('Inserisci i grammi.');
  });
  it('il catalogo ha 20 voci con nome e porzione separati', () => {
    expect(EXTRAS_CATALOG).toHaveLength(20);
    expect(EXTRAS_CATALOG.find((x) => x.id === 'gelato')).toMatchObject({ name: 'Gelato in coppetta', portion: '2 gusti', macro: { kcal: 260 } });
    expect(new Set(EXTRAS_CATALOG.map((x) => x.id)).size).toBe(20);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/domain/extras.test.ts` → FAIL (moduli mancanti).
- [ ] **Step 3:** aggiungi i tipi, il catalogo e le funzioni con le firme sopra. Commento d'apertura nel catalogo: valori della v1, stime per porzioni tipiche.
- [ ] **Step 4:** `npx vitest run src/domain/extras.test.ts` → PASS; `npm run check` → 0 errori.
- [ ] **Step 5:** commit `Fuori piano: tipi, catalogo sgarri e calcoli di base`.

---

### Task 2: Bilancio del giorno, settimana, recenti, ricerca e icone

**Files:**
- Modify: `src/domain/extras.ts`
- Test: `src/domain/extras.test.ts`

**Interfaces:**
- Consumes: Task 1; `portionMacro`, `sumMacro`, `FoodIndex` da `nutrition.ts`.
- Produces:
  - `freeSlots(logs: readonly MealLog[], date: string): Set<Slot>` — slot con `kind === 'libero'` in quella data.
  - `interface DayBalance { planned: Macro; fromPlan: Macro; free: Macro; offPlan: Macro; total: Macro; delta: number }`
  - `dayBalance(meals: readonly Meal[], done: ReadonlySet<Slot>, frees: ReadonlySet<Slot>, dayExtras: readonly ExtraLog[], foods: FoodIndex): DayBalance` — `dayExtras` sono già quelle del giorno; `fromPlan` = pasti in `done` e non in `frees`; `free` = voci con `freeSlot !== null`; `offPlan` = voci con `freeSlot === null`; `delta = round(total.kcal) − round(planned.kcal)`.
  - `interface WeekSummary { offPlanKcal: number; freeKcal: number; freeMeals: number; offPlanDays: number }`
  - `weekSummary(dates: readonly string[], logs: readonly MealLog[], extras: readonly ExtraLog[]): WeekSummary` — solo le date passate; kcal arrotondate.
  - `type ExtraChoice = { kind: 'catalogo'; item: CatalogExtra } | { kind: 'mia'; item: CustomItem } | { kind: 'alimento'; item: Food }`
  - `recentItems(extras: readonly ExtraLog[], customItems: readonly CustomItem[], catalog: readonly CatalogExtra[], foods: FoodIndex, limit = 8): ExtraChoice[]` — distinte per `origin + refId`, dalla `createdAt` più recente; salta `origin 'manuale'` e i `refId` che non esistono più.
  - `searchExtras(query: string, catalog: readonly CatalogExtra[], customItems: readonly CustomItem[], foods: readonly Food[]): ExtraChoice[]` — query vuota → `[]`; confronto su nome senza accenti/maiuscole (`includes`); ordine: `mia`, poi `catalogo`, poi `alimento`; massimo 20 risultati.
  - `newExtra(choice: ExtraChoice, date: string, opts: { id: string; now: Date; freeSlot: Slot | null; grams?: number }, foods: FoodIndex): ExtraLog` — `qty: 1`; per `alimento` `macro = portionMacro({ foodId, grams })`, `portion = "<grams> g"`, `grams` valorizzato; per `catalogo`/`mia` copia `name`, `portion`, `macro`; `refId` = id della scelta.
  - `iconFor(e: ExtraLog, catalog: readonly CatalogExtra[]): FoodIconName` — catalogo → la sua icona (se l'id non esiste più, `plate`); `mia` → `bookmark`; `alimento` → `plate`; `manuale` → `pencil`.

- [ ] **Step 1: Scrivi i test che falliscono**

```ts
describe('extras · bilancio', () => {
  it('sceglie l\'icona di una voce', () => {
    expect(iconFor(log({ origin: 'catalogo', refId: 'gelato' }), EXTRAS_CATALOG)).toBe('ice-cream');
    expect(iconFor(log({ origin: 'manuale', refId: null }), EXTRAS_CATALOG)).toBe('pencil');
  });
  // giorno con colazione (A) e cena (C) da catalogo di test
  it('esclude dal piano i pasti liberi e somma il fuori piano', () => {
    const b = dayBalance(meals, new Set(['colazione', 'cena']), new Set(['cena']), [gelato, pizzaLibera], foods);
    expect(b.fromPlan.kcal).toBeCloseTo(kcalColazione);
    expect(b.offPlan.kcal).toBe(260);      // gelato, freeSlot null
    expect(b.free.kcal).toBe(900);         // pizza, freeSlot 'cena'
    expect(b.total.kcal).toBeCloseTo(kcalColazione + 1160);
    expect(b.delta).toBe(Math.round(b.total.kcal) - Math.round(b.planned.kcal));
  });
  it('conta i pasti liberi della settimana', () => {
    const s = weekSummary(week, [liberoSab, liberoDom, pianoLun], [gelatoLun, pizzaSab]);
    expect(s).toEqual({ offPlanKcal: 260, freeKcal: 900, freeMeals: 2, offPlanDays: 1 });
  });
  it('i recenti saltano le voci tue eliminate e i doppioni', () => {
    const r = recentItems([gelatoOggi, gelatoIeri, barrettaEliminata], [], EXTRAS_CATALOG, foods);
    expect(r.map((x) => x.item.id)).toEqual(['gelato']);
  });
  it('la ricerca ignora accenti e mette prima le voci tue', () => {
    const r = searchExtras('tiramisu', EXTRAS_CATALOG, [mioTiramisu], []);
    expect(r.map((x) => x.kind)).toEqual(['mia', 'catalogo']);
    expect(searchExtras('', EXTRAS_CATALOG, [], [])).toEqual([]);
  });
  it('una voce da alimento usa i grammi', () => {
    const e = newExtra({ kind: 'alimento', item: pane }, '2026-11-03', { id: 'x', now, freeSlot: null, grams: 40 }, foods);
    expect(e).toMatchObject({ portion: '40 g', grams: 40, qty: 1, origin: 'alimento', refId: pane.id });
    expect(e.macro.kcal).toBeCloseTo(pane.per100.kcal * 0.4);
  });
});
```

Fixture in testa al file: due `Meal` di prova con alimenti di `SEED_FOODS`, `ExtraLog` costruiti con un helper `log(partial)` che riempie i campi mancanti.

- [ ] **Step 2:** `npx vitest run src/domain/extras.test.ts` → FAIL.
- [ ] **Step 3:** implementa le funzioni con le firme sopra.
- [ ] **Step 4:** test → PASS; `npm run check` → 0.
- [ ] **Step 5:** commit `Fuori piano: bilancio del giorno, settimana, recenti e ricerca`.

---

### Task 3: Database v2, repository, backup v3 e stato

**Files:**
- Modify: `src/db/schema.ts`, `src/db/repos.ts`, `src/db/backup.ts`, `src/state/app.svelte.ts`, `src/screens/plan/BackupScreen.svelte`
- Create: `src/state/extras.svelte.ts`
- Test: `src/db/db.test.ts`, `src/state/extras.test.ts`

**Interfaces:**
- Produces (schema): `extras!: EntityTable<ExtraLog, 'id'>`, `customItems!: EntityTable<CustomItem, 'id'>`; `this.version(2).stores({ extras: 'id, date', customItems: 'id, name' })` dopo la `version(1)` invariata.
- Produces (repos): `putExtra(db, e: ExtraLog)`, `deleteExtra(db, id: string)`, `putCustomItem(db, i: CustomItem)`, `deleteCustomItem(db, id: string)`, `putMealLog(db, log: MealLog)` — tutti passano da `$plain`.
- Produces (backup): `Backup.version: 2 | 3`, `extras: ExtraLog[]`, `customItems: CustomItem[]`; `exportBackup` scrive `version: 3`; `parseBackup` accetta 2 e 3 (in v2 le due liste diventano `[]`); `BackupSummary.extras: number`; `restoreBackup` svuota e riempie anche le due tabelle. `BackupScreen` mostra la riga "Voci fuori piano".
- Produces (app): `app.frees(date: string): Set<Slot>` (via `freeSlots`). `app.done(date)` continua a includere i pasti liberi (un pasto libero conta come fatto per "adesso").
- Produces (`extras.svelte.ts`, istanza esportata `extrasState`):
  - `extras = $state<ExtraLog[]>([])`, `customItems = $state<CustomItem[]>([])`
  - `load(): Promise<void>`
  - `forDate(date: string): ExtraLog[]`
  - `add(choice: ExtraChoice, date: string, opts: { freeSlot: Slot | null; grams?: number }): Promise<ExtraLog>` — se nello stesso giorno esiste già una voce con stessi `origin`, `refId` e `freeSlot` (non `manuale`, non `alimento`), incrementa `qty` invece di creare una riga
  - `addManual(input: { name: string; portion: string; macro: Macro }, date: string, opts: { freeSlot: Slot | null; save: boolean }): Promise<ExtraLog>` — con `save` crea anche una `CustomItem` e la voce ha `origin 'mia'`, altrimenti `'manuale'`
  - `setQty(id: string, qty: number): Promise<void>` (qty ≥ 1)
  - `remove(id: string): Promise<ExtraLog | null>` e `restore(e: ExtraLog): Promise<void>` per l'annulla
  - `markFree(date: string, slot: Slot): Promise<void>` — scrive `MealLog { kind: 'libero' }` e aggiorna `app.logs`
  - `unmarkFree(date: string, slot: Slot): Promise<void>` — cancella il `MealLog`, porta a `freeSlot: null` le voci di quel pasto
  - id con `crypto.randomUUID()`, `createdAt` ISO.
- `App.svelte`: dopo `app.load()` chiama `extrasState.load()`.

- [ ] **Step 1: Scrivi i test che falliscono**

In `db.test.ts`:
```ts
it('passa dallo schema 1 al 2 senza perdere dati', async () => {
  const name = 'test-upgrade-' + n++;
  const v1 = new Dexie(name); v1.version(1).stores({ foods: 'id, name', plans: 'id', mealLogs: '[date+slot], date', weights: 'date', legacyWeeks: 'week', settings: 'key' });
  await v1.table('weights').put({ date: '2026-11-01', kg: 79 }); v1.close();
  const db = new AppDb(name); dbs.push(db);
  expect(await db.weights.get('2026-11-01')).toEqual({ date: '2026-11-01', kg: 79 });
  expect(await db.extras.count()).toBe(0);
});
it('il backup v3 contiene voci fuori piano e voci tue', async () => { /* putExtra + putCustomItem → export → parse → restore su db nuovo: stessi oggetti; summary.extras === 1 */ });
it('importa ancora un backup v2', async () => { /* export, poi version = 2 e via le due liste: parseBackup ok, extras = [] */ });
```

In `src/state/extras.test.ts` (fake-indexeddb, `app.load()` + `extrasState.load()` in `beforeEach` come in `screens.test.ts`):
```ts
it('la stessa voce due volte nello stesso giorno diventa ×2', async () => {
  await extrasState.add({ kind: 'catalogo', item: gelato }, D, { freeSlot: null });
  await extrasState.add({ kind: 'catalogo', item: gelato }, D, { freeSlot: null });
  expect(extrasState.forDate(D)).toHaveLength(1);
  expect(extrasState.forDate(D)[0]!.qty).toBe(2);
});
it('annullare il pasto libero trasforma le sue voci in sgarri', async () => {
  await extrasState.markFree(D, 'cena');
  expect(app.frees(D).has('cena')).toBe(true);
  await extrasState.add({ kind: 'catalogo', item: pizza }, D, { freeSlot: 'cena' });
  await extrasState.unmarkFree(D, 'cena');
  expect(app.frees(D).has('cena')).toBe(false);
  expect(app.done(D).has('cena')).toBe(false);
  expect(extrasState.forDate(D)[0]!.freeSlot).toBeNull();
});
it('remove + restore riporta la voce', async () => { /* … */ });
```

- [ ] **Step 2:** `npx vitest run src/db src/state` → FAIL.
- [ ] **Step 3:** implementa schema, repos, backup, `app.frees`, `extras.svelte.ts`, riga del riepilogo in `BackupScreen`, `extrasState.load()` in `App.svelte`.
- [ ] **Step 4:** `npm test` → PASS (tutti, compresi i 43 esistenti); `npm run check` → 0; autofixer su `BackupScreen.svelte` e `App.svelte`.
- [ ] **Step 5:** commit `Fuori piano: database v2, backup v3 e stato delle voci`.

---

### Task 4: Icone 3D, barra del bilancio, pulsante fisso e Oggi

**Icone (prima parte del task).** Chiedi conferma all'utente prima di scaricare (fonte, numero di file, peso). Scarica da `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/<Nome>/3D/<nome>_3d.png` i 18 PNG e salvali come `public/emoji/<FoodIconName>.png`: Beer mug → `beer`, Wine glass → `wine`, Tropical drink → `cocktail`, Tumbler glass → `tumbler`, Ice cream → `ice-cream`, Soft ice cream → `soft-ice-cream`, Shortcake → `cake`, Chocolate bar → `chocolate`, Croissant → `croissant`, Pizza → `pizza`, French fries → `fries`, Hamburger → `hamburger`, Sandwich → `sandwich`, Potato → `potato`, Clinking glasses → `cheers`, Bookmark → `bookmark`, Fork and knife with plate → `plate`, Pencil → `pencil`. Copia il `LICENSE` del repo in `public/emoji/LICENSE.txt`. Verifica che ogni file risponda 200 e sia un PNG.

**Files:**
- Create: `public/emoji/*.png`, `public/emoji/LICENSE.txt`, `src/ui/FoodIcon.svelte`, `src/ui/BalanceBar.svelte`, `src/ui/Fab.svelte`
- Modify: `src/screens/DayView.svelte`, `src/ui/DayStrip.svelte`
- Test: `src/screens/screens.test.ts`

**Interfaces:**
- Consumes: `dayBalance`, `freeSlots` (Task 2); `extrasState`, `app.frees` (Task 3).
- Produces:
  - `FoodIcon.svelte` props `{ name: FoodIconName; size?: number }` (default 32) — `<img src="{import.meta.env.BASE_URL}emoji/{name}.png" alt="" width={size} height={size} loading="lazy">`, decorativa.
  - `BalanceBar.svelte` props `{ balance: DayBalance; onDetails: () => void }` — numero grande `total.kcal`, "di {planned} kcal" e, se `delta > 0`, " · +{delta}"; barra: parte piena = `fromPlan`, parte rigata = `free + offPlan`, larghezze in % di `max(planned, total)`; tacca verticale a `planned`; legenda "Piano N" e, solo se > 0, "Fuori piano N" e "Pasto libero N". È un `<button>` con `aria-label="Bilancio del giorno: dettagli"` che chiama `onDetails`.
  - `Fab.svelte` props `{ label: string; onclick: () => void }` — fisso in basso a destra sopra la tab bar (`bottom: calc(env(safe-area-inset-bottom) + 96px)`), z-index sotto il `Sheet`.
  - `DayStrip` segmenti con `free?: boolean`: segmento rigato.
- `DayView`: la riga kcal/macro attuale è sostituita da `BalanceBar`; `onDetails` apre un `Sheet` "Bilancio del giorno" con una tabella Proteine/Carboidrati/Grassi × Piano/Fuori piano/Totale (arrotondati). `Fab` "Ho mangiato altro" visibile solo se `date <= app.today`, anche senza piano attivo (il bilancio mostra allora solo il fuori piano); `main` riceve spazio in fondo per il Fab. Il foglio di aggiunta (Task 5) per ora si apre come `Sheet` vuoto con titolo "Ho mangiato altro".

- [ ] **Step 1: Test che fallisce** in `screens.test.ts`

```ts
it('il bilancio somma le voci fuori piano', async () => {
  await extrasState.add({ kind: 'catalogo', item: EXTRAS_CATALOG.find((x) => x.id === 'gelato')! }, DATE, { freeSlot: null });
  render(DayView, { date: DATE });
  expect(screen.getByRole('button', { name: 'Bilancio del giorno: dettagli' })).toHaveTextContent('Fuori piano 260');
});
```

- [ ] **Step 2:** `npx vitest run src/screens` → FAIL.
- [ ] **Step 3:** implementa `BalanceBar`, `Fab`, `DayStrip` e le modifiche a `DayView`.
- [ ] **Step 4:** test → PASS; check → 0; autofixer sui 4 `.svelte`.
- [ ] **Step 5:** commit `Oggi: barra del bilancio e pulsante Ho mangiato altro`.

---

### Task 5: Foglio "Ho mangiato altro" con ricerca unica

**Files:**
- Create: `src/screens/extras/AddExtraSheet.svelte`, `src/screens/extras/ChoiceRow.svelte`
- Modify: `src/ui/Toast.svelte` (z-index sopra il `Sheet`: 45), `src/screens/DayView.svelte`
- Test: `src/screens/screens.test.ts`

**Interfaces:**
- Consumes: `searchExtras`, `recentItems`, `EXTRAS_CATALOG` (Task 1–2); `extrasState.add` (Task 3); `Sheet` e `Toast` esistenti. Le categorie sono pulsanti a pillola con `aria-pressed`, non `Segmented`.
- Produces:
  - `AddExtraSheet.svelte` props `{ open: boolean ($bindable); date: string; freeSlot: Slot | null }`; titolo "Ho mangiato altro" o "Pasto libero · {SLOT_LABEL}". Ricerca con `aria-label="Cerca o scrivi cosa hai mangiato"` e segnaposto "Cerca o scrivi cosa hai mangiato…". A ricerca vuota: "Recenti" (schede orizzontali) e categorie Dolci / Alcolici / Salato / Le mie con l'elenco della categoria scelta (Dolci di default). Con testo: risultati con etichetta d'origine ("tua", "alimento") e in fondo la riga "Aggiungi «{testo}» a mano" (apre il modulo del Task 6). Nota fissa delle stime in fondo. Dopo un'aggiunta: `Toast` "{nome} aggiunto · {kcal} kcal" con "Annulla" (`extrasState.remove`), 5 s.
  - `ChoiceRow.svelte` props `{ choice: ExtraChoice; onAdd: () => void }` — `FoodIcon` (32 px; catalogo: la sua icona, voce tua `bookmark`, alimento `plate`), nome, riga "kcal · P · C · G" (per gli alimenti "per grammi · {kcal} kcal/100 g"), pulsante tondo con `aria-label="Aggiungi {nome}"`. Un tocco su un alimento apre il modulo grammi (Task 6) invece di aggiungere.
- `DayView` monta `AddExtraSheet` aperto dal `Fab`.

- [ ] **Step 1: Test che fallisce**

```ts
it('aggiunge uno sgarro dal catalogo e lo conta nel bilancio', async () => {
  render(DayView, { date: DATE });
  await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Cornetto semplice' }));
  await waitFor(async () => expect((await db.extras.toArray())[0]).toMatchObject({ name: 'Cornetto semplice', qty: 1, origin: 'catalogo' }));
  expect(screen.getByText(/Cornetto semplice aggiunto/)).toBeInTheDocument();
});
it('la ricerca trova le voci senza accenti', async () => { /* scrive "tiramisu" → compare "Aggiungi Tiramisù" */ });
```

- [ ] **Step 2:** test → FAIL.
- [ ] **Step 3:** implementa i due componenti e il collegamento in `DayView`.
- [ ] **Step 4:** test → PASS; check → 0; autofixer sui `.svelte` toccati.
- [ ] **Step 5:** commit `Fuori piano: foglio con ricerca unica, recenti e categorie`.

---

### Task 6: Voce a mano, alimento a grammi ed elenco del giorno

**Files:**
- Create: `src/screens/extras/ExtraForm.svelte`, `src/screens/extras/FoodGramsForm.svelte`, `src/screens/extras/ExtraList.svelte`
- Modify: `src/screens/extras/AddExtraSheet.svelte`, `src/screens/DayView.svelte`
- Test: `src/screens/screens.test.ts`

**Interfaces:**
- Consumes: `kcalFromMacros`, `parseAmount`, `validateExtra`, `extraTotal` (Task 1); `extrasState.addManual`, `add`, `setQty`, `remove`, `restore` (Task 3).
- Produces:
  - `ExtraForm.svelte` props `{ initialName: string; date: string; freeSlot: Slot | null; onDone: () => void }` — campi con label "Nome", "Porzione" (facoltativa), "Proteine", "Carboidrati", "Grassi", "kcal"; le kcal seguono `kcalFromMacros` **finché l'utente non le modifica a mano**, poi restano quelle scritte; interruttore "Salva tra le mie voci" attivo; pulsante "Aggiungi a oggi" (o "Aggiungi a questo pasto" con `freeSlot`); errori di `validateExtra` sotto il campo.
  - `FoodGramsForm.svelte` props `{ food: Food; date: string; freeSlot: Slot | null; onDone: () => void }` — campo "Grammi", kcal in diretta, pulsante "Aggiungi".
  - `ExtraList.svelte` props `{ date: string }` — sezione "Fuori piano" con il totale kcal; righe velate sul fondo: `FoodIcon` di `iconFor(e)` (36 px), nome, `×n` se `qty > 1`, porzione e origine, kcal di `extraTotal`. Tocco → `Sheet` della voce con − / + (`setQty`) ed "Elimina" (Toast con Annulla). Solo voci con `freeSlot === null`; nulla se vuoto.
- `DayView` mostra `ExtraList` dopo i pasti.

- [ ] **Step 1: Test che falliscono**

```ts
it('aggiunge una voce a mano con le kcal dai macro', async () => {
  render(DayView, { date: DATE });
  await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
  await fireEvent.input(screen.getByLabelText('Cerca o scrivi cosa hai mangiato'), { target: { value: 'barretta' } });
  await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi «barretta» a mano' }));
  for (const [l, v] of [['Proteine', '4'], ['Carboidrati', '22'], ['Grassi', '9']]) await fireEvent.input(screen.getByLabelText(l), { target: { value: v } });
  expect(screen.getByLabelText('kcal')).toHaveValue('185');
  await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi a oggi' }));
  await waitFor(async () => {
    expect((await db.extras.toArray())[0]).toMatchObject({ name: 'barretta', origin: 'mia', macro: { kcal: 185 } });
    expect(await db.customItems.count()).toBe(1);
  });
});
it('le kcal scritte a mano non vengono sovrascritte dai macro', async () => {
  /* come sopra fino ai macro; poi kcal = "200", poi Grassi = "10": kcal resta "200" */
});
it('accetta i grammi con la virgola', async () => { /* alimento pane, Grammi "40,5" → extras[0].grams === 40.5 */ });
```

- [ ] **Step 2:** test → FAIL.
- [ ] **Step 3:** implementa i tre componenti e i collegamenti.
- [ ] **Step 4:** test → PASS; check → 0; autofixer sui `.svelte` toccati.
- [ ] **Step 5:** commit `Fuori piano: voce a mano, alimento a grammi ed elenco del giorno`.

---

### Task 7: Pasto libero e riepilogo in Settimana

**Files:**
- Modify: `src/screens/MealCard.svelte`, `src/screens/DayView.svelte`, `src/screens/Settimana.svelte`
- Test: `src/screens/screens.test.ts`

**Interfaces:**
- Consumes: `extrasState.markFree`, `unmarkFree`, `forDate` (Task 3); `AddExtraSheet` con `freeSlot` (Task 5); `weekSummary`, `FREE_MEALS_PER_WEEK` (Task 2).
- Produces:
  - `MealCard` props nuove `{ free?: boolean; freeItems?: ExtraLog[]; onFree?: () => void; onUnfree?: () => void; onAddToFree?: () => void }`. Non libero: sotto "Fatto" il link "Pasto libero". Libero: pillola "pasto libero" al posto di "adesso", elenco `freeItems` (`FoodIcon` 32 px, nome, kcal), pulsante "Aggiungi a questo pasto", link "Annulla pasto libero"; niente "Fatto".
  - `DayView`: un pasto in `app.frees(date)` si mostra libero (nell'elenco del resto della giornata, aperto); `onFree` → `markFree` e apre `AddExtraSheet` con `freeSlot`; segmento della `DayStrip` rigato.
  - `Settimana`: accanto ai pasti di ogni giorno "+{kcal}" fuori piano se > 0; sotto l'aderenza due righe velate: "Pasto libero usato — {n} su 1" e "Sgarri — {kcal} kcal in {giorni} giorni"; se `freeMeals > FREE_MEALS_PER_WEEK` la riga mostra "Il piano ne prevede uno a settimana".

- [ ] **Step 1: Test che falliscono**

```ts
it('segna e annulla un pasto libero', async () => {
  render(DayView, { date: DATE });
  await fireEvent.click(screen.getByRole('button', { name: 'Pasto libero' }));
  await waitFor(async () => expect(await db.mealLogs.get([DATE, 'colazione'])).toMatchObject({ kind: 'libero' }));
  expect(screen.getByRole('dialog', { name: 'Pasto libero · Colazione' })).toBeInTheDocument();
  await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Cornetto semplice' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Fine' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Annulla pasto libero' }));
  await waitFor(async () => {
    expect(await db.mealLogs.get([DATE, 'colazione'])).toBeUndefined();
    expect((await db.extras.toArray())[0]!.freeSlot).toBeNull();
  });
});
it('avvisa se i pasti liberi della settimana sono più di uno', async () => {
  await extrasState.markFree('2026-10-27', 'cena'); await extrasState.markFree(DATE, 'cena');
  render(Settimana, {});
  expect(screen.getByText('Il piano ne prevede uno a settimana')).toBeInTheDocument();
});
```

- [ ] **Step 2:** test → FAIL.
- [ ] **Step 3:** implementa le modifiche alle tre schermate.
- [ ] **Step 4:** test → PASS; check → 0; autofixer sui `.svelte` toccati.
- [ ] **Step 5:** commit `Pasto libero nella scheda del pasto e riepilogo in Settimana`.

---

### Task 8: Verifica a schermo e documentazione

**Files:**
- Modify: `DESIGN.md` (componenti nuovi), `docs/superpowers/specs/2026-11-03-fuori-piano-design.md` (Stato: implementato)

- [ ] **Step 1:** `npm run check` → 0 errori/0 avvisi; `npm test` → tutto verde; `npm run build` → ok.
- [ ] **Step 2:** con il preview `dieta-v2-build` (dopo `npm run build`), a 375×812 in chiaro e in scuro, con fondo pranzo, colazione e cena: Oggi con due voci fuori piano, foglio vuoto, ricerca "barretta", modulo a mano, pasto libero, Settimana. Controlla in particolare che l'ultima voce del giorno resti visibile e toccabile sopra il pulsante fisso, e che il Toast stia sopra il foglio.
- [ ] **Step 3:** correggi quello che gli screenshot mostrano (un giro, al massimo due), poi riesegui check e test.
- [ ] **Step 4:** aggiorna `DESIGN.md` (BalanceBar, Fab, rigato fuori piano, foglio con ricerca unica) e lo stato della spec.
- [ ] **Step 5:** commit `Fuori piano: verifica a schermo e documentazione`. Niente push.
