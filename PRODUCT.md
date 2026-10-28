# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Una sola persona, l'autore, sul proprio iPhone (PWA installata dalla Home).
Segue il piano alimentare del Dott. Occhino. La usa soprattutto in tre momenti:
in cucina mentre prepara (mani occupate, telefono appoggiato), a tavola o fuori
casa per un'occhiata veloce, e al mattino sulla bilancia.

## Product Purpose
Aprire l'app e sapere subito cosa mangiare adesso e in che grammi, segnarlo
fatto, registrare il peso e vedere come va la settimana. Il piano si cambia da
un editor guidato, offline, senza toccare JSON.

## Positioning
È il piano di un medico preciso, per una persona precisa: non un contatore di
calorie generico né un'app di fitness. Contano il pasto di adesso, i grammi e
gli scambi decisi dal medico.

## Operating Context
- Uso quotidiano, rapido, più volte al giorno; spesso con una mano sola.
- Grammi letti a distanza da un telefono appoggiato in cucina.
- Pesata al mattino, a volte con poca luce.
- Offline, nessun account, nessun server.

## Capabilities and Constraints
- Schermate: Oggi, Settimana, Peso, Piano (editor e catalogo), foglio Sostituzioni.
- Stack esistente: Vite, Svelte 5, TypeScript, Dexie, vite-plugin-pwa, phosphor-svelte.
- Modalità scura che segue il sistema (da mantenere).
- Font di sistema (da mantenere, per velocità e aspetto nativo).
- Lingua: italiano.

## Brand Commitments
- Tono: quaderno personale. Sobrio, tenuto bene, dell'utente; nessun
  incoraggiamento, nessuna gamification.
- Personaggi o illustrazioni, se mai ci fossero: proporzioni normali, mai chibi.

## Evidence on Hand
- Il piano reale del Dott. Occhino e il catalogo di 67 alimenti (`src/domain/catalog.ts`).
- Icone PWA esistenti: `public/icon-180.png`, `public/icon-512.png`.
- Nessuna fonte clinica propria: i valori nutrizionali sono stime da tabelle o etichette.

## Product Principles
1. Il pasto di adesso prima di tutto: si vede senza toccare nulla.
2. Le indicazioni del medico restano distinte da tutto ciò che è stimato o indicativo.
3. Un tocco per segnare, un tocco per annullare: niente conferme inutili.
4. È un quaderno, non un allenatore: registra, non giudica.

## Accessibility & Inclusion
Target di tocco ≥ 44 px, rispetto di `prefers-reduced-motion` e `safe-area-inset`,
contrasto leggibile anche a distanza e con poca luce.
