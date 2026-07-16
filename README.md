# Time To Party – Magazzino (GitHub Pages)

Questa è la versione statica dell'app, pronta per GitHub Pages.

## Pubblicazione rapida

1. Crea un nuovo repository GitHub, ad esempio `ttp-magazzino`.
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
5. Salva. Dopo circa un minuto GitHub mostrerà il link pubblico.

## Come salva i dati

La versione GitHub Pages salva le modifiche nel database del browser (IndexedDB).

- Le modifiche fatte su un iPhone restano su quell'iPhone.
- Le modifiche fatte su un Mac restano su quel Mac.
- I dati non vengono caricati nel repository GitHub.
- Usa **Impostazioni → Esporta backup** dopo ogni aggiornamento importante.

Per sincronizzare automaticamente più telefoni e utenti servirà collegare un database cloud, ad esempio Supabase.

## Funzioni incluse

- Dashboard
- Fatture e dettaglio righe
- Listino prezzi IVA inclusa
- Serate e consumi
- Magazzino automatico
- Movimenti e rettifiche
- Importazione XML FatturaPA
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

