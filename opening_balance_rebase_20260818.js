(function(){
'use strict';

window.applyOpeningBalanceRebase20260818=function(state){
 const marker='opening_balance_rebase_20260818_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const w=JSON.parse(JSON.stringify(state));
 for(const k of ['products','movements','audit_logs'])w[k]=Array.isArray(w[k])?w[k]:[];
 w.meta=w.meta||{};
 const now=new Date().toISOString();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>w.products.find(p=>norm(p.name)===norm(name))||null;
 const stockOf=pid=>w.movements.reduce((sum,m)=>sum+(Number(m.product_id)===Number(pid)?Number(m.quantity_delta||0):0),0);

 // If version 2.1.20 was opened before this correction, remove only the temporary 18/08 stocktake movements it created.
 const beforeRemove=w.movements.length;
 w.movements=w.movements.filter(m=>{
   const notes=String(m.notes||'');
   if(m.source_type==='physical_stocktake'&&notes.includes('Inventario fisico 18/08/2026'))return false;
   if(m.source_type==='supplier_return'&&notes.includes("Reso Four Roses già effettuato prima dell'inventario fisico del 18/08/2026"))return false;
   return true;
 });
 const removedTemporaryMovements=beforeRemove-w.movements.length;
 delete w.meta.physical_stocktake_20260818_v1;

 const targets=[
  ['Gin Tanqueray 1 L',74],
  ['Gin Tanqueray Ten 70 cl',10],
  ['Gin Tanqueray 0.0 70 cl',3],
  ['Vodka Smirnoff Red 1 L',32],
  ['Vodka fragola 1 L',5],
  ['Vodka pesca 1 L',10],
  ['Rum bianco 1 L',14],
  ['Rum Kingston Wray Silver 1 L',1],
  ['Rum scuro',5],
  ['Triple Sec 1 L',14],
  ['Vermouth rosso 1 L',34],
  ['Bitter Martini 1 L',27],
  ['Campari 1 L',2],
  ['Aperol 1 L',12],
  ['Whisky Four Roses 1 L',0],
  ['Bulleit',1],
  ["Whiskey Jack Daniel's 1 L",1],
  ['Prosecco Serena',43],
  ['Moët Réserve Impériale',4],
  ['Tequila Espolon Blanco 70 cl',4]
 ];
 const resolved=targets.map(([name,target])=>{const p=product(name);if(!p)throw new Error('Ricalibrazione giacenza iniziale non applicata: prodotto non trovato: '+name);return[p,target]});
 const changes=[];

 for(const [p,target] of resolved){
   const before=stockOf(p.id),delta=target-before;
   if(delta!==0){
     // Prefer the reconstructed opening-balance line when available; otherwise use/create a dedicated opening correction.
     let openings=w.movements.filter(m=>Number(m.product_id)===Number(p.id)&&m.source_type==='opening_balance'&&String(m.movement_date)==='2026-06-05');
     let base=openings.find(m=>String(m.notes||'').includes('[BASELINE-REBASE-20260818]'))||openings.find(m=>String(m.notes||'').includes('[INV-20260718:'))||openings[0]||null;
     if(base){
       base.quantity_delta=Number(base.quantity_delta||0)+delta;
       base.movement_type='giacenza iniziale';
       base.notes=(String(base.notes||'').replace(/\s*\[BASELINE-REBASE-20260818\].*$/,'')) + ` [BASELINE-REBASE-20260818] Correzione apertura ${delta>0?'+':''}${delta} per allineare la giacenza definitiva a ${target}; nessun inventario registrato il 18/08.`;
     }else{
       base={id:next(w.movements),notes:`Rettifica della giacenza iniziale [BASELINE-REBASE-20260818] ${delta>0?'+':''}${delta}; allineamento a giacenza definitiva ${target}. Nessun inventario registrato il 18/08.`,area_id:null,user_id:null,source_id:null,unit_cost:0,created_at:now,product_id:p.id,source_type:'opening_balance',movement_date:'2026-06-05',movement_type:'giacenza iniziale',quantity_delta:delta};
       w.movements.push(base);
     }
   }
   changes.push({product:p.name,before,target,opening_delta:delta,after:stockOf(p.id)});
 }

 const errors=[];
 for(const [p,target] of resolved){const actual=stockOf(p.id);if(actual!==target)errors.push(`${p.name}: atteso ${target}, ottenuto ${actual}`)}
 if(errors.length)throw new Error('Ricalibrazione giacenza iniziale fallita: '+errors.join('; '));

 w.audit_logs.push({id:next(w.audit_logs),action:'ricalibrazione giacenza iniziale',entity_type:'warehouse',entity_id:null,details:`Ricalibrate le giacenze iniziali dei prodotti comunicati come definitivi, senza creare un inventario in data 18/08. Rimossi ${removedTemporaryMovements} eventuali movimenti temporanei della versione 2.1.20. Four Roses portato a zero tramite base iniziale, coerentemente con l'indicazione che il reso è già stato effettuato ma senza inventarne la data. Prodotti non comunicati lasciati invariati.`,created_at:now});
 w.meta[marker]={applied_at:now,method:'opening_balance_rebase',opening_date:'2026-06-05',no_stocktake_20260818:true,removed_temporary_1808_movements:removedTemporaryMovements,authoritative_targets:Object.fromEntries(changes.map(x=>[x.product,x.target])),changes,unlisted_products_unchanged:true};
 for(const k of Object.keys(w))state[k]=w[k];
 return true;
};
})();
