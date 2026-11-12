(function(){
'use strict';

window.applyOfficialCreditNoteReturn20260915=function(state){
 const marker='official_credit_note_return_3690_20260915_v2';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;

 const w=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','invoices','invoice_lines','movements','audit_logs'])w[k]=Array.isArray(w[k])?w[k]:[];
 w.meta=w.meta||{};
 const now=new Date().toISOString(),date='2026-09-15',prefix='OFFICIAL-CREDIT-RETURN-3690-20260915';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const findProduct=name=>w.products.find(p=>norm(p.name)===norm(name))||null;
 const must=name=>{const p=findProduct(name);if(!p)throw new Error('Reso ufficiale 15/09 non applicato: prodotto mancante: '+name);return p};
 const avg=pid=>{
   const lines=w.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);
   const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);
   return q?v/q:0;
 };
 const stock=pid=>w.movements.reduce((s,m)=>s+(Number(m.product_id)===Number(pid)?Number(m.quantity_delta||0):0),0);

 const products={
   vermouth:must('Vermouth rosso 1 L'),
   triple:must('Triple Sec 1 L'),
   rum:must('Rum bianco 1 L'),
   moet:must('Moët Réserve Impériale'),
   ten:must('Gin Tanqueray Ten 70 cl'),
   bitter:must('Bitter Martini 1 L')
 };
 const rows=[
   [products.vermouth,6],
   [products.triple,6],
   [products.rum,6],
   [products.moet,3],
   [products.ten,3],
   [products.bitter,5]
 ];

 // Rimuove integralmente il reso manuale del 02/09, mantenendo il marker della vecchia
 // migrazione così non può essere ricreato ai successivi avvii.
 const beforeMovementCount=w.movements.length;
 w.movements=w.movements.filter(m=>{
   const n=String(m.notes||'');
   const oldTagged=n.includes('SUPPLIER-RETURN-20260902');
   const oldDated=String(m.movement_date)==='2026-09-02'&&String(m.movement_type)==='supplier_return'&&String(m.source_type||'').includes('manual_supplier_return');
   return !(oldTagged||oldDated);
 });
 const removedOldMovements=beforeMovementCount-w.movements.length;
 w.audit_logs=w.audit_logs.filter(a=>norm(a.action)!==norm('reso al fornitore 02/09/2026'));

 // Elimina eventuali rettifiche positive nate esclusivamente dal vecchio reso 02/09.
 // Senza quel reso, Tanqueray Ten e Moët non devono ricevere quelle compensazioni.
 w.movements=w.movements.filter(m=>{
   const n=String(m.notes||'');
   if(n.includes('RESTORE-NEGATIVE-STOCK-ZERO-AFTER-REMOVE-0209-'))return false;
   const isNegZero=n.includes('NEGATIVE-STOCK-ZERO-20260915');
   const pid=Number(m.product_id);
   const isAffected=pid===Number(products.ten.id)||pid===Number(products.moet.id);
   return !(isNegZero&&isAffected&&Number(m.quantity_delta||0)>0);
 });

 // Rimuove eventuali movimenti del precedente tentativo v1 del reso ufficiale, così la v2 è idempotente.
 w.movements=w.movements.filter(m=>!String(m.notes||'').includes(prefix));

 // Individua la nota di credito ufficiale già registrata.
 const credit=w.invoices.find(i=>norm(i.invoice_number)==='3690 ACC'&&String(i.invoice_date)===date);
 if(!credit)throw new Error('Reso ufficiale 15/09 non applicato: nota di credito UNIGROUP 3690/ACC non trovata.');

 const existing=w.movements.filter(m=>String(m.notes||'').includes(prefix));
 if(existing.length){
   w.meta[marker]={applied_at:now,already_present:true,credit_note_invoice_id:credit.id};
   for(const k of ['movements','audit_logs','meta'])state[k]=w[k];
   return true;
 }

 const before={};for(const [p] of rows)before[p.id]=stock(p.id);
 for(const [p,qty] of rows){
   w.movements.push({
     id:next(w.movements),
     movement_date:date,
     movement_type:'supplier_return',
     product_id:p.id,
     quantity_delta:-qty,
     unit_cost:avg(p.id),
     source_type:'credit_note_supplier_return',
     source_id:credit.id,
     area_id:null,
     user_id:null,
     notes:`Reso ufficiale da nota di credito UNIGROUP 3690/ACC del 15/09/2026 · ${p.name} × ${qty} · ${prefix}`,
     created_at:now
   });
 }
 const after={};for(const [p] of rows)after[p.id]=stock(p.id);
 for(const [p,qty] of rows){
   const expected=before[p.id]-qty;
   if(Math.abs(after[p.id]-expected)>1e-9)throw new Error('Reso ufficiale 15/09: controllo giacenza fallito per '+p.name);
 }

 credit.notes='Nota di credito UNIGROUP 3690/ACC del 15/09/2026 · ACCREDITO X RESO MERCE. Questo documento è la fonte ufficiale del reso di magazzino; il precedente reso manuale del 02/09 è stato eliminato.';

 if(w.meta.supplier_return_20260902_v3){
   w.meta.supplier_return_20260902_v3.superseded=true;
   w.meta.supplier_return_20260902_v3.superseded_at=now;
   w.meta.supplier_return_20260902_v3.superseded_by=marker;
   w.meta.supplier_return_20260902_v3.note='Movimenti del 02/09 eliminati; sostituiti dal reso ufficiale documentato dalla nota di credito 3690/ACC del 15/09/2026.';
 }

 const details=rows.map(([p,q])=>`${p.name} -${q}`).join('; ');
 w.audit_logs.push({
   id:next(w.audit_logs),
   action:'reso ufficiale nota di credito 3690/ACC del 15/09/2026',
   entity_type:'invoice',
   entity_id:credit.id,
   details:`Eliminato integralmente il reso manuale del 02/09. Registrato il solo reso ufficiale documentato dalla nota di credito UNIGROUP 3690/ACC: ${details}. Totale 29 bottiglie. Nessun doppio scarico.`,
   created_at:now
 });
 w.meta[marker]={
   applied_at:now,
   credit_note_invoice_id:credit.id,
   credit_note_number:'3690/ACC',
   date,
   removed_old_0209_movements:removedOldMovements,
   total_units:29,
   movements:rows.map(([p,q])=>({product_id:p.id,product_name:p.name,quantity_delta:-q})),
   stock_before:before,
   stock_after:after,
   old_return_0209_removed:true,
   no_double_count:true
 };

 for(const k of ['invoices','movements','audit_logs','meta'])state[k]=w[k];
 return true;
};

})();