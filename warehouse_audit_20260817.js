(function(){
'use strict';

window.applyWarehouseAudit20260817=function(state){
 const marker='warehouse_audit_20260817_v2';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 for(const key of ['products','product_aliases','events','areas','consumption_lines','invoices','invoice_lines','movements','audit_logs'])state[key]=Array.isArray(state[key])?state[key]:[];
 const now=new Date().toISOString();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const findProduct=names=>{
  for(const name of names){const p=state.products.find(x=>clean(x.name)===clean(name));if(p)return p}
  for(const name of names){const a=state.product_aliases.find(x=>clean(x.alias)===clean(name));if(a){const p=state.products.find(x=>Number(x.id)===Number(a.product_id));if(p)return p}}
  return null;
 };
 const ensureArea=name=>{let a=state.areas.find(x=>clean(x.name)===clean(name));if(!a){a={id:next(state.areas),name,active:1,created_at:now};state.areas.push(a)}return a};
 const ensureEvent=(date,name)=>{let e=state.events.find(x=>String(x.event_date)===date&&clean(x.name)===clean(name));if(!e){const same=state.events.filter(x=>String(x.event_date)===date);if(same.length===1)e=same[0]}if(!e){e={id:next(state.events),event_date:date,name,location:'',notes:'Evento ricostruito da audit consumi',created_at:now};state.events.push(e)}return e};
 const avg=p=>{try{return typeof avgCost==='function'?Number(avgCost(p.id)||0):0}catch(_){return 0}};
 let removedOffsets=0,createdLines=0,createdConsumptionMoves=0,fixedConsumptionMoves=0,dedupedConsumptionMoves=0,dedupedLines=0;
 let createdPurchaseMoves=0,fixedPurchaseMoves=0,dedupedPurchaseMoves=0;

 // Elimina definitivamente le vecchie compensazioni che neutralizzavano consumi reali.
 const beforeOffsets=state.movements.length;
 state.movements=state.movements.filter(m=>{const n=String(m.notes||'');return !n.includes('[PRIDE-OFFSET-20260718:')&&!n.includes('[FESTUNI-BF-OFFSET-20260724:')});
 removedOffsets=beforeOffsets-state.movements.length;

 const specs=[];
 const add=(date,event,area,prefix,entries)=>{for(const [names,qty] of entries)specs.push([date,event,area,Array.isArray(names)?names:[names],qty,prefix])};

 add('2026-07-18','Pride','Generale','PRIDE-20260718',[
  ['Lemon',6],['Tonica',13],['Coca-Cola',3],['Bicchieri 355 cc – stecca da 30',12],['Bicchieri 250 cc – stecca da 50',4],['Gin Tanqueray 1 L',11],['Vermouth rosso 1 L',2],['Prosecco Serena',3],['Vodka Smirnoff Red 1 L',2],['Bitter Martini 1 L',1],['Aperol 1 L',1]
 ]);
 add('2026-07-24','Festuni Baile Funk','Bar 1','FESTUNI-BF-20260724-BAR',[
  ['Gin Tanqueray 1 L',3],['Vodka Smirnoff Red 1 L',1],['Vodka pesca 1 L',1],['Gin Tanqueray 0.0 70 cl',1],['Prosecco Serena',6],['Coca-Cola',2],['Bicchieri 355 cc – stecca da 30',6],['Bicchieri 250 cc – stecca da 50',1]
 ]);
 add('2026-07-24','Festuni Baile Funk','Tavoli','FESTUNI-BF-20260724-TAVOLI',[
  ['Gin Tanqueray 1 L',8],['Vodka Smirnoff Red 1 L',4],['Lemon',11],['Tonica',14],['Bicchieri 250 cc – stecca da 50',5]
 ]);
 add('2026-07-31','Nuccia Sole','Bar 1','NUCCIA-SOLE-20260731-BAR1',[
  ['Gin Tanqueray 1 L',6],[['Prosecco Serena','Prosecco'],7],[['Aperol 1 L','Aperol'],3],[['Vodka Smirnoff Red 1 L','Smirnoff Red'],1],['Vermouth rosso 1 L',1],['Bitter Martini 1 L',1],['Tonica',11],['Coca-Cola',2],[['Sciroppo fragola','Polpa fragola'],1],[['Succo cranberry','Cranberry'],1],['Bicchieri 355 cc – stecca da 30',9],['Bicchieri 250 cc – stecca da 50',1]
 ]);
 add('2026-08-05','Festuni XXL','Bar 1','FESTUNI-XXL-20260805-BAR1',[
  ['Gin Tanqueray 1 L',11],['Vodka Smirnoff Red 1 L',4],['Rum scuro',3],['Triple Sec 1 L',2],['Vodka fragola 1 L',4],['Vodka pesca 1 L',2],['Vermouth rosso 1 L',2],['Bitter Martini 1 L',2],['Lemon',38],['Tonica',15],['Coca-Cola',3],['Sciroppo fragola',2],['Sweet & Sour',5],['Prosecco Serena',4],['Bicchieri 355 cc – stecca da 30',18],['Bicchieri 250 cc – stecca da 50',1]
 ]);
 add('2026-08-05','Festuni XXL','Bar 2','FESTUNI-XXL-20260805-BAR2',[
  ['Gin Tanqueray 1 L',4],['Vodka Smirnoff Red 1 L',3],['Rum bianco 1 L',1],['Triple Sec 1 L',1],['Vermouth rosso 1 L',1],['Vodka fragola 1 L',1],['Aperol 1 L',1],['Prosecco Serena',1],['Bicchieri 355 cc – stecca da 30',9],['Lemon',13],['Tonica',2],['Sciroppo fragola',1],['Succo cranberry',1],['Sweet & Sour',1],['Coca-Cola',3],['Succo ananas',1]
 ]);
 add('2026-08-05','Festuni XXL','Tavoli','FESTUNI-XXL-20260805-TAVOLI',[
  ['Gin Tanqueray Ten 70 cl',49],['Grey Goose 70 cl',2],['Moët Réserve Impériale',1],['Prosecco Serena',10],['Vodka Smirnoff Red 1 L',14],['Bicchieri 250 cc – stecca da 50',17],['Lemon',63],['Tonica',52]
 ]);
 add('2026-08-14','Serata 14/08','Bar 1','CONS-20260814-BAR1',[
  ['Gin Tanqueray 1 L',35],['Vodka Smirnoff Red 1 L',13],['Rum bianco 1 L',1],['Triple Sec 1 L',1],['Vodka fragola 1 L',1],['Vodka pesca 1 L',2],['Vermouth rosso 1 L',6],['Bitter Martini 1 L',8],[['Bulleit','Whisky Bulleit 1 L','Whiskey Bulleit'],1],['Aperol 1 L',2],['Prosecco Serena',11],['Gin Tanqueray 0.0 70 cl',2],['Lemon',37],['Tonica',58],[['Coca-Cola 1.5 L','Coca-Cola 1,5 L','COCA COLA LT 1.5X6'],9],['Sciroppo fragola',2],['Sweet & Sour',5],['Bicchieri 355 cc – stecca da 30',45],['Bicchieri 250 cc – stecca da 50',6],['Cannucce',2]
 ]);
 add('2026-08-14','Serata 14/08','Bar 2','CONS-20260814-BAR2',[
  ['Gin Tanqueray 1 L',13],['Vodka Smirnoff Red 1 L',2],['Vermouth rosso 1 L',1],['Bitter Martini 1 L',1],['Vodka fragola 1 L',1],['Vodka pesca 1 L',1],['Prosecco Serena',4],['Bicchieri 355 cc – stecca da 30',18],['Bicchieri 250 cc – stecca da 50',4],['Cannucce',1],['Lemon',25],['Tonica',54],['Sciroppo fragola',1],['Sweet & Sour',1],[['Coca-Cola 1.5 L','Coca-Cola 1,5 L','COCA COLA LT 1.5X6'],8],['Succo arancia',2],['Succo ananas',1]
 ]);
 add('2026-08-14','Serata 14/08','Tavoli','CONS-20260814-TAVOLI',[
  ['Gin Tanqueray 1 L',36],['Gin Tanqueray Ten 70 cl',2],['Vodka Ciroc 70 cl',1],['Prosecco Serena',4],['Vodka Ketel One 1 L',2],['Tequila Don Julio Reposado 70 cl',6],['Tequila Casamigos Blanco 70 cl',1],['Bicchieri 250 cc – stecca da 50',16],['Lemon',41],['Tonica',57]
 ]);

 const missing=[];
 for(const [date,eventName,areaName,names,qty,prefix] of specs){
  const p=findProduct(names);if(!p){missing.push(names[0]);continue}
  const e=ensureEvent(date,eventName),a=ensureArea(areaName),code=`${prefix}-${p.id}`;
  let lines=state.consumption_lines.filter(x=>String(x.notes||'').includes(code));
  let line=lines[0]||null;
  if(lines.length>1){const removeIds=new Set(lines.slice(1).map(x=>Number(x.id)));state.movements=state.movements.filter(m=>!(m.source_type==='consumption_line'&&removeIds.has(Number(m.source_id))));state.consumption_lines=state.consumption_lines.filter(x=>!removeIds.has(Number(x.id)));dedupedLines+=removeIds.size}
  if(!line){const cost=avg(p);line={id:next(state.consumption_lines),event_id:e.id,area_id:a.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo ${eventName} · ${areaName} · ${code}`,source_type:'manual_import',source_id:null,created_at:now};state.consumption_lines.push(line);createdLines++}
  else{line.event_id=e.id;line.area_id=a.id;line.product_id=p.id;line.quantity_base=qty;line.unit=p.base_unit;line.cost_total=Number(line.cost_unit||0)*qty}
 }
 if(missing.length)throw new Error('Audit magazzino non completato: prodotti mancanti: '+[...new Set(missing)].join(', '));

 // Ogni riga consumo deve avere un solo movimento, con stesso prodotto e quantità negativa esatta.
 for(const line of state.consumption_lines){
  const qty=Number(line.quantity_base||0);if(!qty||!line.product_id)continue;
  const linked=state.movements.filter(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(line.id));
  let mov=linked[0]||null;
  if(linked.length>1){const ids=new Set(linked.slice(1).map(x=>Number(x.id)));state.movements=state.movements.filter(m=>!ids.has(Number(m.id)));dedupedConsumptionMoves+=ids.size}
  if(!mov){const e=state.events.find(x=>Number(x.id)===Number(line.event_id));mov={id:next(state.movements),movement_date:e?.event_date||String(line.created_at||'').slice(0,10),movement_type:'consumo',product_id:line.product_id,quantity_delta:-qty,unit_cost:Number(line.cost_unit||0),source_type:'consumption_line',source_id:line.id,area_id:line.area_id??null,user_id:null,notes:`Movimento consumo ricostruito da audit [AUDIT-CONS-${line.id}]`,created_at:now};state.movements.push(mov);createdConsumptionMoves++}
  else{const delta=-qty;if(Number(mov.product_id)!==Number(line.product_id)||Number(mov.quantity_delta)!==delta||Number(mov.area_id||0)!==Number(line.area_id||0))fixedConsumptionMoves++;mov.product_id=line.product_id;mov.quantity_delta=delta;mov.area_id=line.area_id??null;mov.movement_type='consumo'}
 }

 // Stessa verifica per gli acquisti/omaggi: impedisce carichi mancanti o duplicati da fattura.
 for(const line of state.invoice_lines){
  const qty=Number(line.quantity_base||0),affects=Number(line.affects_stock===undefined?1:line.affects_stock);if(!line.product_id||!qty||!affects)continue;
  const linked=state.movements.filter(m=>m.source_type==='invoice_line'&&Number(m.source_id)===Number(line.id));
  let mov=linked[0]||null;
  if(linked.length>1){const ids=new Set(linked.slice(1).map(x=>Number(x.id)));state.movements=state.movements.filter(m=>!ids.has(Number(m.id)));dedupedPurchaseMoves+=ids.size}
  const inv=state.invoices.find(x=>Number(x.id)===Number(line.invoice_id));
  const type=Number(line.is_free||0)?'omaggio':'acquisto',cost=Number(line.gross_unit_price||0);
  if(!mov){mov={id:next(state.movements),movement_date:inv?.invoice_date||String(line.created_at||'').slice(0,10),movement_type:type,product_id:line.product_id,quantity_delta:qty,unit_cost:cost,source_type:'invoice_line',source_id:line.id,area_id:null,user_id:null,notes:`Carico fattura ricostruito da audit [AUDIT-PUR-${line.id}]`,created_at:now};state.movements.push(mov);createdPurchaseMoves++}
  else{if(Number(mov.product_id)!==Number(line.product_id)||Number(mov.quantity_delta)!==qty)fixedPurchaseMoves++;mov.product_id=line.product_id;mov.quantity_delta=qty;mov.movement_type=type;if(cost)mov.unit_cost=cost}
 }

 state.audit_logs.push({id:next(state.audit_logs),action:'audit integrità magazzino 17/08/2026',entity_type:'warehouse',entity_id:null,details:`Verificate ${specs.length} righe consumo canoniche dal Pride al 14/08. Rimosse ${removedOffsets} compensazioni obsolete; create ${createdLines} righe consumo; creati/corretti ${createdConsumptionMoves}/${fixedConsumptionMoves} movimenti consumo; rimossi ${dedupedConsumptionMoves} movimenti consumo duplicati e ${dedupedLines} righe duplicate. Acquisti: creati/corretti ${createdPurchaseMoves}/${fixedPurchaseMoves} movimenti e rimossi ${dedupedPurchaseMoves} duplicati.`,created_at:now});
 state.meta[marker]={applied_at:now,canonical_consumption_lines:specs.length,removed_offsets:removedOffsets,created_consumption_lines:createdLines,created_consumption_movements:createdConsumptionMoves,fixed_consumption_movements:fixedConsumptionMoves,deduped_consumption_movements:dedupedConsumptionMoves,deduped_consumption_lines:dedupedLines,created_purchase_movements:createdPurchaseMoves,fixed_purchase_movements:fixedPurchaseMoves,deduped_purchase_movements:dedupedPurchaseMoves,expected_after_known_movements:{tanqueray_1l:77,bitter_martini_1l:31,tanqueray_ten_70cl:10,smirnoff_1l:25,aperol_1l:8,vodka_fragola_1l:4,campari_1l:15,rum_scuro_1l:2,rum_bianco_1l:13,triple_sec_1l:10,prosecco_serena:20,grey_goose_70cl:0,cannucce_conf:5,vermouth_rosso_1l:20,moet:4}};
 return true;
};
})();
