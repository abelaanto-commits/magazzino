(function(){
'use strict';

window.applyWarehouseAudit20260817=function(state){
 const marker='warehouse_audit_20260817_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 state.products=Array.isArray(state.products)?state.products:[];
 state.product_aliases=Array.isArray(state.product_aliases)?state.product_aliases:[];
 state.events=Array.isArray(state.events)?state.events:[];
 state.areas=Array.isArray(state.areas)?state.areas:[];
 state.consumption_lines=Array.isArray(state.consumption_lines)?state.consumption_lines:[];
 state.movements=Array.isArray(state.movements)?state.movements:[];
 state.audit_logs=Array.isArray(state.audit_logs)?state.audit_logs:[];
 const now=new Date().toISOString();
 const next=list=>Array.isArray(list)&&list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const findProduct=names=>{
  for(const name of names){const n=clean(name),p=state.products.find(x=>clean(x.name)===n);if(p)return p}
  for(const name of names){const n=clean(name),a=state.product_aliases.find(x=>clean(x.alias)===n);if(a){const p=state.products.find(x=>Number(x.id)===Number(a.product_id));if(p)return p}}
  return null;
 };
 const ensureArea=name=>{let a=state.areas.find(x=>clean(x.name)===clean(name));if(!a){a={id:next(state.areas),name,active:1,created_at:now};state.areas.push(a)}return a};
 const ensureEvent=(date,name)=>{let e=state.events.find(x=>String(x.event_date)===date&&clean(x.name)===clean(name));if(!e){e={id:next(state.events),event_date:date,name,location:'',notes:'Evento ricostruito da audit consumi',created_at:now};state.events.push(e)}return e};
 let removedOffsets=0,createdLines=0,createdMoves=0,fixedMoves=0,dedupedMoves=0,dedupedLines=0;

 // Vecchie compensazioni create per non scalare Pride/Festuni BF: devono essere assenti.
 const beforeOffsets=state.movements.length;
 state.movements=state.movements.filter(m=>{const n=String(m.notes||'');return !n.includes('[PRIDE-OFFSET-20260718:')&&!n.includes('[FESTUNI-BF-OFFSET-20260724:')});
 removedOffsets=beforeOffsets-state.movements.length;

 const expected=[
  // Pride 18/07
  ['2026-07-18','Pride','Generale',['Lemon'],6,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Tonica'],13,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Coca-Cola'],3,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Bicchieri 355 cc – stecca da 30'],12,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Bicchieri 250 cc – stecca da 50'],4,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Gin Tanqueray 1 L'],11,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Vermouth rosso 1 L'],2,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Prosecco Serena'],3,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Vodka Smirnoff Red 1 L'],2,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Bitter Martini 1 L'],1,'PRIDE-20260718'],
  ['2026-07-18','Pride','Generale',['Aperol 1 L'],1,'PRIDE-20260718'],
  // Nuccia Sole 31/07
  ['2026-07-31','Nuccia Sole','Bar 1',['Gin Tanqueray 1 L'],6,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Prosecco Serena','Prosecco'],7,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Aperol 1 L','Aperol'],3,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Vodka Smirnoff Red 1 L','Smirnoff Red'],1,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Vermouth rosso 1 L','Vermouth rosso'],1,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Bitter Martini 1 L','Bitter Martini'],1,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Tonica'],11,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Coca-Cola','Coca Cola'],2,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Sciroppo fragola','Polpa fragola'],1,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Succo cranberry','Cranberry'],1,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Bicchieri 355 cc – stecca da 30'],9,'NUCCIA-SOLE-20260731-BAR1'],
  ['2026-07-31','Nuccia Sole','Bar 1',['Bicchieri 250 cc – stecca da 50'],1,'NUCCIA-SOLE-20260731-BAR1']
 ];
 const missing=[];
 for(const [date,eventName,areaName,names,qty,prefix] of expected){
  const p=findProduct(names);if(!p){missing.push(names[0]);continue}
  const e=ensureEvent(date,eventName),a=ensureArea(areaName),code=`${prefix}-${p.id}`;
  let lines=state.consumption_lines.filter(x=>String(x.notes||'').includes(code));
  let line=lines[0]||null;
  if(lines.length>1){const removeIds=new Set(lines.slice(1).map(x=>Number(x.id)));state.movements=state.movements.filter(m=>!(m.source_type==='consumption_line'&&removeIds.has(Number(m.source_id))));state.consumption_lines=state.consumption_lines.filter(x=>!removeIds.has(Number(x.id)));dedupedLines+=removeIds.size}
  if(!line){
   const cid=next(state.consumption_lines),cost=typeof avgCost==='function'?Number(avgCost(p.id)||0):0;
   line={id:cid,event_id:e.id,area_id:a.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo ${eventName} · ${code}`,source_type:'manual_import',source_id:null,created_at:now};
   state.consumption_lines.push(line);createdLines++;
  }else{
   line.event_id=e.id;line.area_id=a.id;line.product_id=p.id;line.quantity_base=qty;line.unit=p.base_unit;line.cost_total=Number(line.cost_unit||0)*qty;
  }
 }
 if(missing.length)throw new Error('Audit magazzino non completato: prodotti mancanti: '+[...new Set(missing)].join(', '));

 // Ogni riga consumo deve avere un solo movimento collegato e con quantità opposta.
 for(const line of state.consumption_lines){
  const qty=Number(line.quantity_base||0);if(!qty)continue;
  const linked=state.movements.filter(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(line.id));
  let mov=linked[0]||null;
  if(linked.length>1){const ids=new Set(linked.slice(1).map(x=>Number(x.id)));state.movements=state.movements.filter(m=>!ids.has(Number(m.id)));dedupedMoves+=ids.size}
  if(!mov){
   mov={id:next(state.movements),movement_date:(state.events.find(e=>Number(e.id)===Number(line.event_id))||{}).event_date||String(line.created_at||'').slice(0,10),movement_type:'consumo',product_id:line.product_id,quantity_delta:-qty,unit_cost:Number(line.cost_unit||0),source_type:'consumption_line',source_id:line.id,area_id:line.area_id??null,user_id:null,notes:`Movimento consumo ricostruito da audit [AUDIT-CONS-${line.id}]`,created_at:now};
   state.movements.push(mov);createdMoves++;
  }else{
   const expectedDelta=-qty;
   if(Number(mov.product_id)!==Number(line.product_id)||Number(mov.quantity_delta)!==expectedDelta||Number(mov.area_id||0)!==Number(line.area_id||0))fixedMoves++;
   mov.product_id=line.product_id;mov.quantity_delta=expectedDelta;mov.area_id=line.area_id??null;mov.movement_type='consumo';
  }
 }

 state.audit_logs.push({id:next(state.audit_logs),action:'audit integrità magazzino 17/08/2026',entity_type:'warehouse',entity_id:null,details:`Rimosse ${removedOffsets} compensazioni obsolete Pride/Festuni BF; create ${createdLines} righe consumo mancanti; creati ${createdMoves} movimenti mancanti; corretti ${fixedMoves} movimenti; rimossi ${dedupedMoves} movimenti duplicati e ${dedupedLines} righe consumo duplicate.`,created_at:now});
 state.meta[marker]={applied_at:now,removed_offsets:removedOffsets,created_consumption_lines:createdLines,created_movements:createdMoves,fixed_movements:fixedMoves,deduped_movements:dedupedMoves,deduped_lines:dedupedLines,expected_tanqueray_after_known_movements:77,expected_bitter_after_known_movements:31};
 return true;
};
})();
