# Programma Nutrizionale

PWA statica, in italiano, con il piano alimentare già presente nel repository.
Tema scuro, ricette giornaliere e meal prep per pranzi freddi.

## Interfaccia

- Tema scuro antracite con accenti ambrati, impaginazione adattata a telefono e computer.
- Oggi: pranzo e cena, ingredienti con dosi, tempi di preparazione e passaggi. Colazione e spuntini sono raccolti in un pannello richiudibile.
- Ricette: 7 pranzi e 7 cene associati ai giorni, con ricerca per nome o ingrediente.
- Meal prep: tre passaggi numerati per sabato o domenica: porzioni da cuocere, contenitori da mettere in frigo o freezer, azioni della sera e del mattino.
- Spesa: lista settimanale generata dal piano, spunte persistenti e copia degli alimenti mancanti.
- Piano: editor, importazione ed esportazione JSON del piano salvato sul dispositivo.

La nuova interfaccia non mostra registrazione dei pasti, percentuali di aderenza,
compensazioni caloriche, catalogo degli extra o consigli per mangiare fuori casa.
I dati di eventuali versioni precedenti non vengono cancellati.

## Meal prep

Il programma è per una persona e tiene conto di pranzi senza microonde e di poco
spazio in freezer. Congela due basi: farro con verdure e pasta per venerdì.
Il riso si cucina mercoledì sera. Se si prepara sabato, l’orzo si cucina lunedì
sera. Con la preparazione di domenica pomeriggio, orzo e verdure del martedì
restano in frigo soltanto se consumati entro 48 ore dalla cottura.

Pasta e cereali sono pesati a secco. Dosi e ingredienti del piano originale
non vengono modificati. I tempi di cucina sono stime e dipendono dagli alimenti
scelti. Il pranzo deve rimanere refrigerato durante trasporto e attesa.

La sessione guidata viene sospesa se le dosi dei cinque pranzi sono state
personalizzate: non deve proporre porzioni non corrispondenti al piano salvato.

Fonti delle indicazioni di conservazione:

- [Food Standards Agency: conservazione e scongelamento](https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely)
- [Food Standards Agency: riso](https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker#rice)
- [Food Standards Agency: avanzi consumati freddi](https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food#using-your-leftovers)
- [USDA: temperature di cottura](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart)

Le calorie sono stime dalle tabelle già presenti nell’app, non obiettivi da
registrare né nuovi calcoli del nutrizionista.

## Avvio

Non occorre una compilazione. Servire questa cartella con un server HTTP locale,
ad esempio `python -m http.server 8765 --bind 127.0.0.1`, e aprire
`http://127.0.0.1:8765/`.

File da mantenere insieme per un futuro aggiornamento di GitHub Pages:

`index.html`, `redesign.css`, `redesign.js`, `kitchen.js`, `manifest.json`,
`sw.js`, `app-icon.svg`, `app-icon-180.png`, `app-icon-512.png`.

Il service worker conserva anche i nuovi file per l’uso offline dopo la prima
apertura online. Il font esterno usa i font di sistema se non disponibile.
Dopo un aggiornamento può essere necessaria una seconda apertura della pagina
per usare la nuova cache. Il PDF reader richiede una connessione.
