(function(){
'use strict';

window.applySupplierReturn20260902=function(state){
 const marker='supplier_return_20260902_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','invoice_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-02',prefix='SUPPLIER-RETURN-20260902';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>work.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('Reso fornitore 02/09 non applicato: prodotto non trovato: '+name);return p};
 const stock=pid=>work.movements.filter(m=>Number(m.product_id)===Number(pid)).reduce((s,m)=>s+Number(m.quantity_delta||0),0);
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};

 const moet=mustProduct('Moët Réserve Impériale');
 const ten=mustProduct('Gin Tanqueray Ten 70 cl');
 const rows=[[moet,4],[ten,6]];
 const before={moet:stock(moet.id),ten:stock(ten.id)};
 const insufficientBefore={moet:before.moet<4,ten:before.ten<6}; // Reso fisico confermato: non inventare giacenze e non bloccare il movimento reale.

 // Sicurezza retry: se esistono movimenti con lo stesso tag ma il marker non è presente, li elimina e ricostruisce una sola volta.
 work.movements=work.movements.filter(m=>!String(m.notes||'').includes(prefix));
 for(const [p,qty] of rows){
  work.movements.push({id:next(work.movements),movement_date:date,movement_type:'supplier_return',product_id:p.id,quantity_delta:-qty,unit_cost:avg(p.id),source_type:'manual_supplier_return',source_id:null,area_id:null,user_id:null,notes:`Reso al fornitore 02/09/2026 · ${p.name} × ${qty} · ${prefix}`,created_at:now});
 }
 const after={moet:stock(moet.id),ten:stock(ten.id)};
 if(Math.abs(after.moet-(before.moet-4))>1e-9||Math.abs(after.ten-(before.ten-6))>1e-9)throw new Error('Reso fornitore 02/09: controllo giacenze fallito. Nessuna modifica applicata.');
 work.audit_logs.push({id:next(work.audit_logs),action:'reso al fornitore 02/09/2026',entity_type:'warehouse',entity_id:null,details:`Uscita magazzino per reso al fornitore: Moët Réserve Impériale -4 bottiglie; Gin Tanqueray Ten 70 cl -6 bottiglie. Nessuna modifica ai consumi SHIVA e nessuna modifica allo storico prezzi di acquisto. Giacenze prima/dopo: Moët ${before.moet} → ${after.moet}; Tanqueray Ten ${before.ten} → ${after.ten}.`,created_at:now});
 work.meta[marker]={applied_at:now,date,reason:'reso_al_fornitore',movements:[{product_id:moet.id,product_name:moet.name,quantity_delta:-4},{product_id:ten.id,product_name:ten.name,quantity_delta:-6}],stock_before:before,stock_after:after,consumptions_unchanged:true,purchase_prices_unchanged:true,insufficient_before:insufficientBefore,negative_stock_warning:(after.moet<0||after.ten<0)};
 for(const k of ['movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
