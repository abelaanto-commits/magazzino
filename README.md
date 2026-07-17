# Time To Party · Magazzino Cloud v2.0

L'interfaccia continua a essere pubblicata con GitHub Pages, mentre dati e nuovi documenti vengono salvati su Supabase e sincronizzati tra tutti i dispositivi autorizzati.

## Attivazione una tantum

1. Apri il progetto Supabase.
2. Vai in **SQL Editor → New query**.
3. Copia tutto `supabase_setup.sql` e premi **Run**.
4. Apri l'app GitHub Pages e premi **Crea il primo account**.
5. Conferma l'email, se richiesto, quindi accedi.
6. Dopo il primo account, disattiva le nuove registrazioni pubbliche in Supabase Auth oppure crea manualmente solo gli utenti autorizzati.

Al primo accesso l'app trasferisce nel cloud i dati già presenti nel browser. Sugli altri dispositivi scarica automaticamente la versione condivisa.

## Funzioni cloud

- sincronizzazione automatica tra smartphone e computer;
- login con email e password;
- salvataggio cloud di fatture, consumi, serate, giacenze e rettifiche;
- caricamento dei nuovi PDF e delle nuove foto nel bucket privato Supabase Storage;
- cache locale in caso di connessione instabile;
- controllo dei conflitti quando due dispositivi modificano contemporaneamente il magazzino;
- backup JSON ed esportazioni Excel/CSV.

## Sicurezza

Nell'HTML è presente soltanto la publishable key, prevista per le applicazioni browser. La tabella e il bucket documenti sono protetti da Row Level Security. Non inserire mai una secret key o la `service_role` nel repository.

## Dati iniziali

Sono inclusi i dati già consolidati: 13 fatture, 40 prodotti, 7 serate, movimenti e giacenze iniziali.
