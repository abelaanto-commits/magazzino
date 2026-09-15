(function(){
'use strict';

window.applySupplierReturn20260902=function(state){
 const marker='supplier_return_20260902_v2';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','invoice_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-02',oldPrefix='SUPPLIER-RETURN-20260902',prefix='SUPPLIER-RETURN-20260902-V2';
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

 // Elimina integralmente il vecchio reso 02/09 (4 Moët + 6 Tanqueray Ten) prima di applicare quello corretto.
 work.movements=work.movements.filter(m=>!String(m.notes||'').includes(oldPrefix));
 work.audit_logs=work.audit_logs.filter(a=>String(a.action||'').toLowerCase()!=='reso al fornitore 02/09/2026');
 delete work.meta.supplier_return_20260902_v1;

 const before={};for(const [p] of rows)before[p.id]=stock(p.id);
 for(const [p,qty] of rows){
  work.movements.push({id:next(work.movements),movement_date:date,movement_type:'supplier_return',product_id:p.id,quantity_delta:-qty,unit_cost:avg(p.id),source_type:'manual_supplier_return',source_id:null,area_id:null,user_id:null,notes:`Reso al fornitore 02/09/2026 · ${p.name} × ${qty} · ${prefix}`,created_at:now});
 }
 const after={};for(const [p] of rows)after[p.id]=stock(p.id);
 for(const [p,qty] of rows){if(Math.abs(after[p.id]-(before[p.id]-qty))>1e-9)throw new Error('Reso fornitore 02/09: controllo giacenze fallito per '+p.name+'. Nessuna modifica applicata.');}
 const details=rows.map(([p,q])=>`${p.name} -${q}`).join('; ');
 work.audit_logs.push({id:next(work.audit_logs),action:'reso al fornitore 02/09/2026',entity_type:'warehouse',entity_id:null,details:`Vecchio reso eliminato e sostituito. Nuovo reso: ${details}. Totale 35 bottiglie. Nessuna modifica ai consumi delle serate e nessuna modifica allo storico prezzi di acquisto.`,created_at:now});
 work.meta[marker]={applied_at:now,date,reason:'reso_al_fornitore_sostitutivo',replaces:'supplier_return_20260902_v1',total_units:35,movements:rows.map(([p,q])=>({product_id:p.id,product_name:p.name,quantity_delta:-q})),stock_before:before,stock_after:after,consumptions_unchanged:true,purchase_prices_unchanged:true};
 for(const k of ['movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();