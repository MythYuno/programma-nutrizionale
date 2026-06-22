# Piano 11 — Ricette

Web app (PWA) installabile su iPhone con le ricette del piano alimentare 11:
colazione, spuntini, pranzo (veloce) e cena per ogni giorno della settimana.
Grammi e macro identici al piano del Dott. Salvatore Occhino.

- Dark glassmorphism, font Geist, 3 temi (Grafite / Brace / Indaco)
- Funziona offline (service worker)
- Aggiungibile alla schermata Home su iOS
- Trucco "veloce" su ogni pranzo e cena per ridurre i tempi in cucina
- **Swipe** sinistra/destra per cambiare giorno; frecce ← → da tastiera tra le schede
- Scheda **Prep**: batch cooking, **lista della spesa generata automaticamente dal piano** con caselle spuntabili (le spunte restano salvate), trucchi di organizzazione
- Scheda **Piano**: cambia il piano alimentare senza toccare il codice

## Cambiare il piano alimentare
Nella scheda **Piano** trovi:
- **PDF**: carica il PDF del medico per estrarne il testo (richiede internet la prima volta, scarica il lettore PDF). Il parsing dei grammi *non* è automatico — il testo serve come riferimento da ricopiare a mano, perché i PDF hanno layout troppo vari per un'estrazione affidabile su dati sanitari.
- **Editor JSON**: il piano completo è modificabile direttamente come JSON. Premi **Applica modifiche** per salvarlo sul dispositivo (resta anche dopo un riavvio del browser).
- **Esporta/Importa JSON**: per backup o per trasferire il piano su un altro dispositivo.
- **Ripristina piano originale**: torna ai dati di default dell'app, cancellando le modifiche salvate.

Il piano modificato resta solo sul dispositivo (`localStorage`) finché non lo esporti/reimporti altrove o non aggiorni i dati di default nel codice.

## Deploy su GitHub Pages
Tieni questi file nella stessa cartella:
`index.html`, `manifest.json`, `sw.js`, `icon-180.png`, `icon-512.png`.

Una volta online, apri l'URL in Safari → Condividi → **Aggiungi a Home**.
