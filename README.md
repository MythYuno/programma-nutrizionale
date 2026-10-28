# Programma Nutrizionale

PWA per iPhone con il piano alimentare del Dott. Salvatore Occhino: cosa
mangiare adesso, pasti fatti, kcal e macro, sostituzioni e peso.
Funziona offline e i dati restano sul telefono.

## Cosa fa

- **Oggi**: il pasto da fare adesso con i grammi, il pulsante "Fatto", il
  totale di kcal e macro del giorno e gli altri pasti.
- **Settimana**: pasti fatti e kcal per giorno, aderenza della settimana, le
  settimane precedenti; da qui si può segnare un pasto dimenticato.
- **Peso**: pesata del giorno, grafico con la media mobile a 7 giorni e
  l'obiettivo, storico.
- **Piano**: editor guidato (giorno → pasto → alimento e grammi, scambi del
  medico, note), "copia giorno su…", "usa questo pasto in tutti i giorni",
  catalogo alimenti, backup.
- **Sostituzioni**: tocca un alimento con ⇄ per vedere gli scambi del medico
  e le alternative indicative.

### Sostituzioni
- **Dott. Occhino**: gli scambi scritti nel piano, che mantengono i macro.
  Sono la fonte da seguire.
- **Alternative**: equivalenze *indicative* calcolate con i rapporti di
  tabelle pubbliche
  ([petrininutrizione.it](https://petrininutrizione.it/sostituire-riso-pasta-pane-patate/),
  [Grana Padano — Educazione Nutrizionale](https://www.educazionenutrizionale.granapadano.it/it/stile-di-vita/tabelle-alimenti-equivalenti),
  [melarossa.it](https://www.melarossa.it/dieta/dimagrire/abc-delle-sostituzioni-dei-cibi-la-guida-di-melarossa/))
  e arrotondate a 5 g. Non fanno parte del piano: vanno verificate con il medico.

### Valori nutrizionali
Sono stime per 100 g da tabelle di composizione pubbliche (CREA e
equivalenti), non i calcoli del medico. Si possono correggere alimento per
alimento dal catalogo; un valore modificato diventa "tuo".

## Dati e backup
Tutto è salvato in IndexedDB sul dispositivo. Da **Piano → Backup** puoi
esportare un file JSON da tenere in File o iCloud, e reimportarlo. Prima di
un import l'app scarica in automatico una copia dei dati attuali.

Al primo avvio l'app importa una volta sola, dalla versione precedente
(stesso indirizzo), il piano e i pasti fatti con il loro storico.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173/programma-nutrizionale/
npm test         # Vitest: dominio, database, schermate
npm run check    # svelte-check (TypeScript)
npm run build    # dist/
```

Stack: Vite, Svelte 5, TypeScript, Dexie (IndexedDB), vite-plugin-pwa,
icone [Phosphor](https://phosphoricons.com).

```
src/domain/   logica pura e testata: macro, sostituzioni, settimana, peso, validazione, conversione v1
src/db/       IndexedDB: schema, repository, backup, primo avvio e migrazione
src/state/    stato reattivo condiviso, bozza dell'editor, router a hash
src/ui/       componenti di base in stile iOS
src/screens/  le schermate
```

Il design è in [docs/superpowers/specs](docs/superpowers/specs/).

## Pubblicazione
La GitHub Action [deploy.yml](.github/workflows/deploy.yml) esegue controlli,
test e build a ogni push e pubblica `dist/` su GitHub Pages da `main`.
In **Settings → Pages** del repository, la sorgente va impostata su
**GitHub Actions**.

Poi apri l'URL in Safari → Condividi → **Aggiungi alla schermata Home**.
