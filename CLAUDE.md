# Programma Nutrizionale — istruzioni per Claude

PWA personale (un solo utente, iPhone) per seguire il piano alimentare del
Dott. Occhino. Lingua dell'interfaccia, dei commenti e dei commit: italiano.

## Comandi
- `npm run dev` — server di sviluppo (in Claude Desktop: configurazione `dieta-v2`, porta 8421)
  L'app sta su `/programma-nutrizionale/`, non sulla radice.
- `npm test` — Vitest (dominio, db con fake-indexeddb, schermate)
- `npm run check` — svelte-check, deve restare a 0 errori e 0 avvisi
- `npm run build`

## Architettura (vedi docs/superpowers/specs/)
- `src/domain/` logica pura, nessun import da db/state/ui. Ogni calcolo nuovo ha un test.
- `src/db/` Dexie. `src/state/` stato condiviso Svelte 5 (`*.svelte.ts`).
- `src/ui/` componenti di base, `src/screens/` schermate.
- File piccoli (indicativamente < 200 righe): se crescono, dividerli.
- La bozza del piano la possiede `state/editor.svelte.ts`: i componenti non
  mutano props, chiamano i metodi dell'editor.

## Svelte 5
- Usa le skill `svelte-core-bestpractices` e `svelte-code-writer`.
- Prima di chiudere una modifica a un file `.svelte`, passalo all'autofixer:
  `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5`
  (o il tool `svelte-autofixer` del server MCP `svelte`), finché non riporta problemi.
- Per API di librerie che potrebbero essere cambiate, consulta il server MCP `context7`.

## Design
- L'utente ha giudicato la v2 "anonima e fatta da IA". Ogni lavoro di
  interfaccia passa dalle skill `impeccable` (modo Operate: app per un compito
  quotidiano) e `frontend-design`: piano di token prima del codice, niente
  default generici, verifica con screenshot a 375×812 in chiaro e scuro.
- Personaggi o illustrazioni: proporzioni normali, mai chibi.

## Dati sanitari
- I valori nutrizionali sono stime (fonte `tabelle`/`etichetta`): non
  presentarli mai come calcoli del medico.
- Le alternative indicative restano separate dagli scambi del medico.

## Git
- Lavoro su branch, commit piccoli con messaggio in italiano.
- Mai push o pubblicazione su GitHub Pages senza conferma esplicita.
