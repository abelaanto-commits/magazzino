(function(){
'use strict';

window.applyNegativeStockZero20260911=function(state){
 const marker='negative_stock_zero_20260911_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','invoice_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-11',prefix='NEGATIVE-STOCK-ZERO-20260911';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const stock=pid=>work.movements.filter(m=>Number(m.product_id)===Number(pid)).reduce((s,m)=>s+Number(m.quantity_delta||0),0);
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};

 // Retry safety: if a partial run exists without the marker, remove only this migration's movements and rebuild.
 work.movements=work.movements.filter(m=>!String(m.notes||'').includes(prefix));
 const before=[];
 for(const p of work.products){
   const qty=stock(p.id);
   if(qty < -1e-9)before.push({product_id:p.id,product_name:p.name,stock_before:qty,adjustment:-qty});
 }
 for(const r of before){
   work.movements.push({
     id:next(work.movements),movement_date:date,movement_type:'rettifica',product_id:r.product_id,
     quantity_delta:r.adjustment,unit_cost:avg(r.product_id),source_type:'manual_adjustment',source_id:null,
     area_id:null,user_id:null,notes:`Azzeramento giacenza negativa su indicazione utente: ${r.stock_before} → 0 · ${prefix}`,created_at:now
   });
 }
 const errors=[];
 for(const r of before){const after=stock(r.product_id);if(Math.abs(after)>1e-9)errors.push(`${r.product_name}: ${after}`)}
 if(errors.length)throw new Error('Azzeramento giacenze negative fallito: '+errors.join('; ')+'. Nessuna modifica applicata.');
 const detail=before.length?before.map(r=>`${r.product_name}: ${r.stock_before} + ${r.adjustment} = 0`).join(' | '):'Nessuna giacenza negativa presente al momento della migrazione.';
 work.audit_logs.push({id:next(work.audit_logs),action:'azzeramento giacenze negative 11/09/2026',entity_type:'warehouse',entity_id:null,details:`Rettifica richiesta dall'utente: tutte le giacenze teoriche negative sono state portate esattamente a zero, senza modificare fatture o consumi. ${detail}`,created_at:now});
 work.meta[marker]={applied_at:now,date,method:'positive_adjustment_to_zero',adjusted_products:before,count:before.length,invoices_unchanged:true,consumptions_unchanged:true};
 for(const k of ['movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
