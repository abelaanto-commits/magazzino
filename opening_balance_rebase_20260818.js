(function(){
'use strict';

window.applyOpeningBalanceRebase20260818=function(state){
 const marker='opening_balance_rebase_20260818_v3';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const w=JSON.parse(JSON.stringify(state));
 for(const k of ['products','product_aliases','invoice_lines','consumption_lines','movements','audit_logs'])w[k]=Array.isArray(w[k])?w[k]:[];
 w.meta=w.meta||{};
 const now=new Date().toISOString();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>w.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('Ricalibrazione giacenza iniziale non applicata: prodotto non trovato: '+name);return p};
 const stockOf=pid=>w.movements.reduce((sum,m)=>sum+(Number(m.product_id)===Number(pid)?Number(m.quantity_delta||0):0),0);

 const beforeRemove=w.movements.length;
 w.movements=w.movements.filter(m=>{
   const notes=String(m.notes||'');
   if(m.source_type==='physical_stocktake'&&notes.includes('Inventario fisico 18/08/2026'))return false;
   if(m.source_type==='supplier_return'&&notes.includes("Reso Four Roses già effettuato prima dell'inventario fisico del 18/08/2026"))return false;
   return true;
 });
 const removedTemporaryMovements=beforeRemove-w.movements.length;
 delete w.meta.physical_stocktake_20260818_v1;

 // Lemon is one single warehouse reference. Fanta Lemon, Verdello, Kinley Bitter Lemon and old Tomarchio
 // all resolve to the same SKU. Authoritative physical total: 63 + 43 + 38 fridge = 144 bottles.
 const lemon=mustProduct('Lemon');
 const fantaLemon=product('Fanta Lemon 90 cl');
 let mergedFantaLemon=false;
 if(fantaLemon&&Number(fantaLemon.id)!==Number(lemon.id)){
   for(const l of w.invoice_lines)if(Number(l.product_id)===Number(fantaLemon.id))l.product_id=lemon.id;
   for(const l of w.consumption_lines)if(Number(l.product_id)===Number(fantaLemon.id))l.product_id=lemon.id;
   for(const m of w.movements)if(Number(m.product_id)===Number(fantaLemon.id))m.product_id=lemon.id;
   for(const a of w.product_aliases)if(Number(a.product_id)===Number(fantaLemon.id))a.product_id=lemon.id;
   w.products=w.products.filter(p=>Number(p.id)!==Number(fantaLemon.id));
   mergedFantaLemon=true;
 }
 const lemonAliases=['FANTA LEMON CL.90 (6) PET','LIMONATA "VERDELLO" CL 75X6 TOMARCHIO','KINLEY BITTER LEMON PET 90 (6)','KINLEY BITTER LEMON PET 90 (6) - OMAGGIO','KINLEY BITTER LEMON PET 90 (6) – OMAGGIO','LIMONATA TOMARCHIO PET LT.1,5(6)'];
 for(const alias of lemonAliases){
   let a=w.product_aliases.find(x=>norm(x.alias)===norm(alias));
   if(a)a.product_id=lemon.id;
   else w.product_aliases.push({id:next(w.product_aliases),product_id:lemon.id,alias,supplier_id:null});
 }
 {const seen=new Set();w.product_aliases=w.product_aliases.filter(a=>{const k=`${Number(a.product_id)||0}|${Number(a.supplier_id)||0}|${norm(a.alias)}`;if(seen.has(k))return false;seen.add(k);return true})}

 const exactTargets=[
  ['Gin Tanqueray 1 L',74],['Gin Tanqueray Ten 70 cl',10],['Gin Tanqueray 0.0 70 cl',3],['Vodka Smirnoff Red 1 L',32],['Vodka fragola 1 L',6],['Vodka pesca 1 L',11],['Rum bianco 1 L',14],['Rum Kingston Wray Silver 1 L',1],['Rum scuro',5],['Triple Sec 1 L',14],['Vermouth rosso 1 L',34],['Bitter Martini 1 L',27],['Campari 1 L',2],['Aperol 1 L',12],['Whisky Four Roses 1 L',0],['Bulleit',1],["Whiskey Jack Daniel's 1 L",1],['Prosecco Serena',43],['Moët Réserve Impériale',4],['Tequila Espolon Blanco 70 cl',4],
  ['Polpa lime 100% Sour Lime ODK 750 ml',1],['Sweet & Sour',30],['Sciroppo fragola',19],['Succo ananas',6],['Succo arancia',9],['Succo cranberry',4],['Red Bull 25 cl',50],['Fanta Orange lattina 33 cl',0],['Sprite lattina 33 cl',0],['Coca-Cola lattina 33 cl',0],['Lemon',144]
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

 const cocaLegacy=mustProduct('Coca-Cola'),coca15=mustProduct('Coca-Cola 1.5 L');
 const legacyBefore=stockOf(cocaLegacy.id),coca15Before=stockOf(coca15.id),combinedBefore=legacyBefore+coca15Before;
 adjustOpening(coca15,13-combinedBefore,13,'target Coca-Cola bottiglie complessive 13');
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
 if(product('Fanta Lemon 90 cl'))errors.push('Fanta Lemon 90 cl deve essere unificato in Lemon ma risulta ancora presente');
 if(errors.length)throw new Error('Ricalibrazione giacenza iniziale fallita: '+errors.join('; '));

 w.audit_logs.push({id:next(w.audit_logs),action:'ricalibrazione giacenza iniziale definitiva v3',entity_type:'warehouse',entity_id:null,details:`Nessun inventario registrato al 18/08. Lemon unificato in una sola referenza e fissato a 144 bottiglie (63 + 43 + 38 frigo). Vodka fragola fissata a 6 e vodka pesca a 11. Tonica lasciata invariata. Aggiornati tutti gli altri target certi comunicati dall'utente. Rimossi ${removedTemporaryMovements} eventuali movimenti temporanei 18/08.`,created_at:now});
 w.meta[marker]={applied_at:now,method:'opening_balance_rebase',opening_date:'2026-06-05',no_stocktake_20260818:true,removed_temporary_1808_movements:removedTemporaryMovements,authoritative_targets:Object.fromEntries(exactTargets),lemon_unified:true,lemon_total:144,lemon_breakdown:{fanta_verdello:63,kinley:43,fridge:38},coca_cola_bottles_total:13,coca_cola_split:{legacy:stockOf(cocaLegacy.id),coca_1_5l:stockOf(coca15.id)},tonic_unchanged:true,changes,unlisted_products_unchanged:true};
 for(const k of Object.keys(w))state[k]=w[k];
 return true;
};
})();
