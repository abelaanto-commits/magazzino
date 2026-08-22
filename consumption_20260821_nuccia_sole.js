(function(){
'use strict';

window.applyNucciaSoleConsumption20260821=function(state){
 const marker='nuccia_sole_consumption_20260821_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 for(const k of ['products','events','areas','consumption_lines','movements','audit_logs'])state[k]=Array.isArray(state[k])?state[k]:[];
 const now=new Date().toISOString(),date='2026-08-21',prefix='NUCCIA-SOLE-20260821';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>state.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('Nuccia Sole 21/08 non caricata: prodotto non trovato: '+name);return p};
 const avg=pid=>{try{return typeof avgCost==='function'?Number(avgCost(pid)||0):0}catch(_){return 0}};

 let event=state.events.find(e=>String(e.event_date)===date&&norm(e.name)==='NUCCIA SOLE');
 if(!event){event={id:next(state.events),event_date:date,name:'Nuccia Sole',location:'',notes:'Consumi serata 21/08/2026',created_at:now};state.events.push(event)}
 let area=state.areas.find(a=>norm(a.name)==='BAR 1');
 if(!area){area={id:next(state.areas),name:'Bar 1',active:1,created_at:now};state.areas.push(area)}

 // Canonical mapping from the user's recap. Lemon and Kinley Lemon are one unified SKU: 14 + 8 = 22 bottles.
 const rows=[
  [mustProduct('Vodka Smirnoff Red 1 L'),1,'Vodka Smirnoff 1'],
  [mustProduct('Gin Tanqueray 1 L'),10,'Gin Tanqueray 1L 10'],
  [mustProduct('Bitter Martini 1 L'),1,'Bitter 1'],
  [mustProduct('Vermouth rosso 1 L'),1,'Vermouth 1'],
  [mustProduct('Aperol 1 L'),3,'Aperol 3'],
  [mustProduct('Prosecco Serena'),10,'Prosecco 10'],
  [mustProduct('Lemon'),22,'Lemon 14 + Kinley Lemon 8 = Lemon unificato 22'],
  [mustProduct('Tonica'),23,'Tonica 23'],
  [mustProduct('Coca-Cola 1.5 L'),1,'Coca-Cola 1 bottiglia; registrata sullo SKU bottiglie 1.5 L'],
  [mustProduct('Succo arancia'),1,'Arancia 1'],
  [mustProduct('Succo ananas'),1,'Ananas 1'],
  [mustProduct('Succo cranberry'),2,'Cranberry 2'],
  [mustProduct('Sweet & Sour'),1,'Sweet 1'],
  [mustProduct('Bicchieri 355 cc – stecca da 30'),14,'Bicchieri 350/355: 14 stecche'],
  [mustProduct('Bicchieri 250 cc – stecca da 50'),2,'Bicchieri 250: 2 stecche']
 ];

 // Retry-safe: remove only a prior partial version of this exact import, then rebuild once.
 const oldIds=new Set(state.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){state.movements=state.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id))));state.consumption_lines=state.consumption_lines.filter(l=>!oldIds.has(Number(l.id)))}

 let total=0;
 for(const [p,qty,sourceText] of rows){
  const cost=avg(p.id),cid=next(state.consumption_lines),code=`${prefix}|P=${p.id}|END`;
  state.consumption_lines.push({id:cid,event_id:event.id,area_id:area.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Nuccia Sole 21/08 · ${sourceText} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
  state.movements.push({id:next(state.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:area.id,user_id:null,notes:`Consumo Nuccia Sole 21/08 [${code}]`,created_at:now});
  total+=qty;
 }
 if(rows.length!==15||total!==93)throw new Error(`Nuccia Sole 21/08: controllo quantità fallito (${rows.length} righe, ${total} unità)`);

 state.audit_logs.push({id:next(state.audit_logs),action:'caricamento consumi Nuccia Sole 21/08/2026',entity_type:'event',entity_id:event.id,details:'15 righe / 93 unità. Lemon unificato: 22 bottiglie (14 Lemon + 8 Kinley Lemon). Bicchieri 350 interpretati come 355: 14 stecche; bicchieri 250: 2 stecche. Coca-Cola registrata sullo SKU bottiglie 1.5 L.',created_at:now});
 state.meta[marker]={applied_at:now,event_id:event.id,event_date:date,area:'Bar 1',loaded_lines:15,total_units:93,lemon_unified:22,lemon_breakdown:{lemon:14,kinley_lemon:8},cups_355_stecche:14,cups_250_stecche:2,all_consumption_deducted:true};
 return true;
};
})();
