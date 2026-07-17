# Time To Party – Magazzino (GitHub Pages) v1.1

Versione statica e mobile-first pronta per GitHub Pages.

## Aggiornamenti della versione 1.1

- Inserimento di più consumi con **un'unica lista** e un solo salvataggio.
- Modifica di nome, data, location e note delle serate già registrate.
- Importazione fatture tramite **XML, fotografie e PDF**.
- Lettura locale di foto e PDF tramite OCR, con schermata di controllo e correzione prima del carico di magazzino.
- Conservazione sul dispositivo dei documenti foto/PDF importati.

## Pubblicazione rapida

1. Crea un repository GitHub, ad esempio `ttp-magazzino`.
2. Carica **tutto il contenuto di questa cartella** nella root del repository:
   - `index.html`
   - `404.html`
   - `manifest.webmanifest`
   - `icon.svg`
   - cartella `documents`
3. Vai in **Settings → Pages**.
4. In **Build and deployment**, scegli:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Salva e attendi la pubblicazione.

Per aggiornare un repository già pubblicato, sostituisci almeno `index.html`, `404.html` e `README.md` con i file di questa versione.

## Come inserire i consumi

Apri **Serate → + Consumo**, scegli serata e area, poi aggiungi tutti i prodotti nella stessa lista. Il pulsante **Salva tutta la lista** registra contemporaneamente tutte le righe e aggiorna il magazzino.

## Come importare foto o PDF

Apri **Importa → Foto o PDF**.

- Per una fattura di più pagine, seleziona tutte le pagine nello stesso caricamento.
- Il programma estrae il testo dal PDF o esegue l'OCR sulle immagini.
- Prima del salvataggio mostra fornitore, numero, data, totale e righe prodotto in campi modificabili.
- Il magazzino viene aggiornato solo dopo la conferma.

La prima lettura OCR richiede una connessione internet per caricare le librerie e può impiegare alcuni minuti su smartphone. L'elaborazione avviene nel browser. La lettura da foto resta meno precisa dell'XML e deve sempre essere controllata.

## Come salva i dati

La versione GitHub Pages salva le modifiche nel database del browser (IndexedDB).

- Le modifiche fatte su un iPhone restano su quell'iPhone.
- Le modifiche fatte su un Mac restano su quel Mac.
- I dati non vengono caricati nel repository GitHub.
- I nuovi documenti foto/PDF restano archiviati nel browser del dispositivo.
- Il backup JSON contiene i dati contabili, ma non incorpora i file binari delle nuove foto/PDF.
- Esporta un backup dopo ogni aggiornamento importante.

Per sincronizzare automaticamente più telefoni e utenti servirà collegare un database cloud, ad esempio Supabase.

## Funzioni incluse

- Dashboard
- Fatture e dettaglio righe
- Listino prezzi IVA inclusa
- Serate modificabili
- Consumi a lista unica
- Magazzino automatico
- Movimenti e rettifiche
- Importazione XML FatturaPA
- Importazione OCR di foto e PDF
- Esportazione backup JSON
- Esportazione Excel e CSV
- Modalità chiara/scura
- Interfaccia mobile-first

## Dati iniziali

Sono inclusi i dati già consolidati:

- 13 fatture
- 40 prodotti
- 7 serate
- movimenti e giacenze iniziali
