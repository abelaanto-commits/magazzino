(function(){
'use strict';

window.applySupplierReturn20260902=function(state){
 const marker='supplier_return_20260902_v3';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','invoice_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-02',oldPrefix='SUPPLIER-RETURN-20260902',prefix='SUPPLIER-RETURN-20260902-V3',negativePrefix='NEGATIVE-STOCK-ZERO-20260911';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>work.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('Reso fornitore 02/09 non applicato: prodotto non trovato: '+name);return p};
 const stock=pid=>work.movements.filter(m=>Number(m.product_id)===Number(pid)).reduce((s,m)=>s+Number(m.quantity_delta||0),0);
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};

 const ten=mustProduct('Gin Tanqueray Ten 70 cl');
 const moet=mustProduct('Moët Réserve Impériale');
 const triple=mustProduct('Triple Sec 1 L');
 const rum=mustProduct('Rum bianco 1 L');
 const vermouth=mustProduct('Vermouth rosso 1 L');
 const bitter=mustProduct('Bitter Martini 1 L');
 const rows=[[ten,9],[moet,3],[triple,6],[rum,6],[vermouth,6],[bitter,5]];

 // 1) Elimina qualsiasi versione precedente del reso 02/09 e relativi audit/meta.
 work.movements=work.movements.filter(m=>!String(m.notes||'').includes(oldPrefix));
 work.audit_logs=work.audit_logs.filter(a=>String(a.action||'').toLowerCase()!=='reso al fornitore 02/09/2026');
 delete work.meta.supplier_return_20260902_v1;
 delete work.meta.supplier_return_20260902_v2;

 // 2) Corregge SOLO l'eventuale rettifica positiva dell'11/09 generata dal vecchio reso NON effettuato.
 //    Il vecchio reso errato era: -6 Tanqueray Ten e -4 Moët. Non vengono toccate altre rettifiche.
 function removePhantomPositiveAdjustment(p,maxQty){
   let remaining=Number(maxQty)||0,removed=0;
   for(let i=work.movements.length-1;i>=0&&remaining>1e-9;i--){
     const m=work.movements[i];
     if(Number(m.product_id)!==Number(p.id))continue;
     if(!String(m.notes||'').includes(negativePrefix))continue;
     const delta=Number(m.quantity_delta||0);
     if(delta<=0)continue;
     const cut=Math.min(delta,remaining),left=delta-cut;
     removed+=cut;remaining-=cut;
     if(left<=1e-9)work.movements.splice(i,1);
     else{
       m.quantity_delta=left;
       m.notes=String(m.notes||'')+` · Correzione vecchio reso 02/09: rettifica ridotta di ${cut}`;
     }
   }
   return removed;
 }
 const phantomRemoved={
   tanqueray_ten:removePhantomPositiveAdjustment(ten,6),
   moet:removePhantomPositiveAdjustment(moet,4)
 };
 if(work.meta.negative_stock_zero_20260911_v1){
   work.meta.negative_stock_zero_20260911_v1.corrected_for_invalid_supplier_return_20260902={
     corrected_at:now,
     removed_positive_adjustment:phantomRemoved,
     rule:'removed_only_up_to_old_invalid_return_quantities'
   };
 }

 // 3) Registra il nuovo reso fisico reale comunicato dall'utente.
 const before={};for(const [p] of rows)before[p.id]=stock(p.id);
 for(const [p,qty] of rows){
  work.movements.push({id:next(work.movements),movement_date:date,movement_type:'supplier_return',product_id:p.id,quantity_delta:-qty,unit_cost:avg(p.id),source_type:'manual_supplier_return',source_id:null,area_id:null,user_id:null,notes:`Reso al fornitore 02/09/2026 · ${p.name} × ${qty} · ${prefix}`,created_at:now});
 }
 const after={};for(const [p] of rows)after[p.id]=stock(p.id);
 for(const [p,qty] of rows){if(Math.abs(after[p.id]-(before[p.id]-qty))>1e-9)throw new Error('Reso fornitore 02/09: controllo giacenze fallito per '+p.name+'. Nessuna modifica applicata.');}
 const details=rows.map(([p,q])=>`${p.name} -${q}`).join('; ');
 work.audit_logs.push({id:next(work.audit_logs),action:'reso al fornitore 02/09/2026',entity_type:'warehouse',entity_id:null,details:`Vecchio reso non effettuato eliminato; rettifiche positive eventualmente generate da quel vecchio reso ridotte solo per la quota attribuibile ad esso (Tanqueray Ten ${phantomRemoved.tanqueray_ten}; Moët ${phantomRemoved.moet}); nuovo reso reale: ${details}. Totale 35 bottiglie. Consumi e prezzi di acquisto invariati.`,created_at:now});
 work.meta[marker]={applied_at:now,date,reason:'reso_al_fornitore_sostitutivo_con_correzione_rettifiche',replaces:['supplier_return_20260902_v1','supplier_return_20260902_v2'],invalid_old_return:{tanqueray_ten:6,moet:4},phantom_positive_adjustment_removed:phantomRemoved,total_units:35,movements:rows.map(([p,q])=>({product_id:p.id,product_name:p.name,quantity_delta:-q})),stock_before:before,stock_after:after,consumptions_unchanged:true,purchase_prices_unchanged:true};
 for(const k of ['movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();