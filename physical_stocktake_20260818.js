(function(){
'use strict';

window.applyPhysicalStocktake20260818=function(state){
 const marker='physical_stocktake_20260818_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 state.products=Array.isArray(state.products)?state.products:[];
 state.movements=Array.isArray(state.movements)?state.movements:[];
 state.audit_logs=Array.isArray(state.audit_logs)?state.audit_logs:[];
 const now=new Date().toISOString(),date='2026-08-18';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const byName=name=>state.products.find(p=>norm(p.name)===norm(name))||null;
 const stockOf=pid=>state.movements.reduce((sum,m)=>sum+(Number(m.product_id)===Number(pid)?Number(m.quantity_delta||0):0),0);
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
  ['Bulleit',1],
  ["Whiskey Jack Daniel's 1 L",1],
  ['Prosecco Serena',43],
  ['Moët Réserve Impériale',4],
  ['Tequila Espolon Blanco 70 cl',4]
 ];
 const fourRoses=byName('Whisky Four Roses 1 L');
 if(!fourRoses)throw new Error('Inventario fisico 18/08 non applicato: Four Roses non trovato.');
 const resolved=[];
 for(const [name,target] of targets){const p=byName(name);if(!p)throw new Error('Inventario fisico 18/08 non applicato: prodotto non trovato: '+name);resolved.push([p,target])}

 const changes=[];
 for(const [p,target] of resolved){
   const before=stockOf(p.id),delta=target-before;
   if(delta!==0){
     state.movements.push({id:next(state.movements),movement_date:date,movement_type:delta>0?'rettifica positiva':'rettifica negativa',product_id:p.id,quantity_delta:delta,unit_cost:0,source_type:'physical_stocktake',source_id:null,area_id:null,user_id:null,notes:`Inventario fisico 18/08/2026: giacenza contata ${target}; precedente teorica ${before}; rettifica ${delta>0?'+':''}${delta}.`,created_at:now});
   }
   changes.push({product:p.name,before,target,delta});
 }

 const fourBefore=stockOf(fourRoses.id),fourDelta=-fourBefore;
 if(fourDelta!==0){
   state.movements.push({id:next(state.movements),movement_date:date,movement_type:'reso fornitore',product_id:fourRoses.id,quantity_delta:fourDelta,unit_cost:0,source_type:'supplier_return',source_id:null,area_id:null,user_id:null,notes:`Reso Four Roses già effettuato prima dell'inventario fisico del 18/08/2026. Giacenza portata da ${fourBefore} a 0.`,created_at:now});
 }
 changes.push({product:fourRoses.name,before:fourBefore,target:0,delta:fourDelta,type:'reso fornitore'});

 // Hard validation: every stated physical count must now equal the user's count exactly.
 const errors=[];
 for(const [p,target] of resolved){const after=stockOf(p.id);if(after!==target)errors.push(`${p.name}: atteso ${target}, ottenuto ${after}`)}
 if(stockOf(fourRoses.id)!==0)errors.push(`Whisky Four Roses 1 L: atteso 0, ottenuto ${stockOf(fourRoses.id)}`);
 if(errors.length)throw new Error('Inventario fisico 18/08 non validato: '+errors.join('; '));

 state.audit_logs.push({id:next(state.audit_logs),action:'inventario fisico alcolici 18/08/2026',entity_type:'warehouse',entity_id:null,details:'Impostate come fonte definitiva le quantità fisicamente contate il 18/08/2026. Le differenze rispetto al teorico sono state registrate come rettifiche inventariali; Four Roses registrato come reso fornitore già effettuato. Prodotti non citati lasciati invariati.',created_at:now});
 state.meta[marker]={applied_at:now,inventory_date:date,source:'conteggio fisico comunicato dall’utente',authoritative:true,changes,unlisted_products_unchanged:true};
 return true;
};
})();
