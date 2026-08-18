(function(){
'use strict';

window.applyOpeningBalanceRebase20260818=function(state){
 const marker='opening_balance_rebase_20260818_v2';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const w=JSON.parse(JSON.stringify(state));
 for(const k of ['products','movements','audit_logs'])w[k]=Array.isArray(w[k])?w[k]:[];
 w.meta=w.meta||{};
 const now=new Date().toISOString();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>w.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('Ricalibrazione giacenza iniziale non applicata: prodotto non trovato: '+name);return p};
 const stockOf=pid=>w.movements.reduce((sum,m)=>sum+(Number(m.product_id)===Number(pid)?Number(m.quantity_delta||0):0),0);

 // Remove only obsolete temporary movements from the abandoned 18/08 stocktake approach, if they ever ran.
 const beforeRemove=w.movements.length;
 w.movements=w.movements.filter(m=>{
   const notes=String(m.notes||'');
   if(m.source_type==='physical_stocktake'&&notes.includes('Inventario fisico 18/08/2026'))return false;
   if(m.source_type==='supplier_return'&&notes.includes("Reso Four Roses già effettuato prima dell'inventario fisico del 18/08/2026"))return false;
   return true;
 });
 const removedTemporaryMovements=beforeRemove-w.movements.length;
 delete w.meta.physical_stocktake_20260818_v1;

 const exactTargets=[
  // Alcolici definitivi
  ['Gin Tanqueray 1 L',74],['Gin Tanqueray Ten 70 cl',10],['Gin Tanqueray 0.0 70 cl',3],['Vodka Smirnoff Red 1 L',32],['Vodka fragola 1 L',5],['Vodka pesca 1 L',10],['Rum bianco 1 L',14],['Rum Kingston Wray Silver 1 L',1],['Rum scuro',5],['Triple Sec 1 L',14],['Vermouth rosso 1 L',34],['Bitter Martini 1 L',27],['Campari 1 L',2],['Aperol 1 L',12],['Whisky Four Roses 1 L',0],['Bulleit',1],["Whiskey Jack Daniel's 1 L",1],['Prosecco Serena',43],['Moët Réserve Impériale',4],['Tequila Espolon Blanco 70 cl',4],
  // Analcolici/mixer definitivi comunicati successivamente
  ['Polpa lime 100% Sour Lime ODK 750 ml',1],['Sweet & Sour',30],['Sciroppo fragola',19],['Succo ananas',6],['Succo arancia',9],['Succo cranberry',4],['Red Bull 25 cl',50],['Fanta Orange lattina 33 cl',0],['Sprite lattina 33 cl',0],['Coca-Cola lattina 33 cl',0]
 ];

 const changes=[];
 const adjustOpening=(p,delta,target,label='')=>{
   if(!delta)return;
   const openings=w.movements.filter(m=>Number(m.product_id)===Number(p.id)&&m.source_type==='opening_balance'&&String(m.movement_date)==='2026-06-05');
   let base=openings.find(m=>String(m.notes||'').includes('[BASELINE-REBASE-20260818]'))||openings.find(m=>String(m.notes||'').includes('[INV-20260718:'))||openings[0]||null;
   if(base){
     base.quantity_delta=Number(base.quantity_delta||0)+delta;
     base.movement_type='giacenza iniziale';
     base.notes=(String(base.notes||'').replace(/\s*\[BASELINE-REBASE-20260818\].*$/,''))+` [BASELINE-REBASE-20260818] Correzione apertura ${delta>0?'+':''}${delta}${label?' · '+label:''}; nessun inventario registrato il 18/08.`;
   }else{
     w.movements.push({id:next(w.movements),notes:`Rettifica della giacenza iniziale [BASELINE-REBASE-20260818] ${delta>0?'+':''}${delta}${label?' · '+label:''}. Nessun inventario registrato il 18/08.`,area_id:null,user_id:null,source_id:null,unit_cost:0,created_at:now,product_id:p.id,source_type:'opening_balance',movement_date:'2026-06-05',movement_type:'giacenza iniziale',quantity_delta:delta});
   }
 };

 for(const [name,target] of exactTargets){
   const p=mustProduct(name),before=stockOf(p.id),delta=target-before;
   adjustOpening(p,delta,target,`target finale ${target}`);
   changes.push({product:p.name,before,target,opening_delta:delta,after:stockOf(p.id)});
 }

 // Coca-Cola bottiglie: l'utente ha fornito solo il totale complessivo, non il formato.
 // Preserve historical format records but force the aggregate to 13; if the legacy SKU is negative,
 // shift baseline between the two bottle SKUs so neither displays a physically impossible negative value.
 const cocaLegacy=mustProduct('Coca-Cola'),coca15=mustProduct('Coca-Cola 1.5 L');
 let legacyBefore=stockOf(cocaLegacy.id),coca15Before=stockOf(coca15.id),combinedBefore=legacyBefore+coca15Before;
 let combinedDelta=13-combinedBefore;
 adjustOpening(coca15,combinedDelta,13,'target Coca-Cola bottiglie complessive 13');
 if(stockOf(cocaLegacy.id)<0){
   const transfer=-stockOf(cocaLegacy.id);
   adjustOpening(cocaLegacy,transfer,0,'normalizzazione SKU Coca-Cola storico a zero');
   adjustOpening(coca15,-transfer,13,'trasferimento solo di classificazione formato; totale Coca-Cola invariato');
 }
 const combinedAfter=stockOf(cocaLegacy.id)+stockOf(coca15.id);
 if(combinedAfter!==13)throw new Error(`Ricalibrazione Coca-Cola fallita: atteso totale 13, ottenuto ${combinedAfter}`);
 changes.push({product:'Coca-Cola bottiglie complessive',before:combinedBefore,target:13,opening_delta:13-combinedBefore,after:combinedAfter,split:{legacy:stockOf(cocaLegacy.id),coca_1_5l:stockOf(coca15.id)}});

 const errors=[];
 for(const [name,target] of exactTargets){const p=mustProduct(name),actual=stockOf(p.id);if(actual!==target)errors.push(`${p.name}: atteso ${target}, ottenuto ${actual}`)}
 if(errors.length)throw new Error('Ricalibrazione giacenza iniziale fallita: '+errors.join('; '));

 w.audit_logs.push({id:next(w.audit_logs),action:'ricalibrazione giacenza iniziale definitiva',entity_type:'warehouse',entity_id:null,details:`Giacenze finali comunicate dall'utente assorbite nella base iniziale del 05/06, senza creare inventari al 18/08. Aggiornati alcolici e analcolici certi; Coca-Cola bottiglie fissata a 13 complessive. Lemon/Fanta Lemon/Verdello/Kinley e Tonica lasciati invariati perché il dato Lemon è ancora ambiguo (38 frigo indicati come ipotesi) e la Tonica è stata indicata solo come circa corretta. Rimossi ${removedTemporaryMovements} eventuali movimenti temporanei 18/08.`,created_at:now});
 w.meta[marker]={applied_at:now,method:'opening_balance_rebase',opening_date:'2026-06-05',no_stocktake_20260818:true,removed_temporary_1808_movements:removedTemporaryMovements,authoritative_targets:Object.fromEntries(exactTargets),coca_cola_bottles_total:13,coca_cola_split:{legacy:stockOf(cocaLegacy.id),coca_1_5l:stockOf(coca15.id)},lemon_pending:true,tonic_unchanged:true,changes,unlisted_products_unchanged:true};
 for(const k of Object.keys(w))state[k]=w[k];
 return true;
};
})();
