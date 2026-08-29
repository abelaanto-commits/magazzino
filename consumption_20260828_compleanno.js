(function(){
'use strict';

window.applyCompleannoConsumption20260828=function(state){
 const marker='compleanno_consumption_20260828_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 for(const k of ['products','events','areas','consumption_lines','movements','audit_logs'])state[k]=Array.isArray(state[k])?state[k]:[];
 const now=new Date().toISOString(),date='2026-08-28',prefix='COMPLEANNO-20260828';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>state.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('Compleanno 28/08 non caricato: prodotto non trovato: '+name);return p};
 const avg=pid=>{try{return typeof avgCost==='function'?Number(avgCost(pid)||0):0}catch(_){return 0}};

 let event=state.events.find(e=>String(e.event_date)===date&&norm(e.name)==='COMPLEANNO');
 if(!event){event={id:next(state.events),event_date:date,name:'Compleanno',location:'',notes:'Consumi compleanno 28/08/2026',created_at:now};state.events.push(event)}
 let area=state.areas.find(a=>norm(a.name)==='GENERALE')||state.areas.find(a=>norm(a.name)==='BAR 1')||state.areas[0]||null;
 if(!area){area={id:next(state.areas),name:'Generale',active:1,created_at:now};state.areas.push(area)}

 const rows=[
  [mustProduct('Gin Tanqueray 1 L'),10,'Gin 10'],
  [mustProduct('Vodka Smirnoff Red 1 L'),4,'Vodka 4'],
  [mustProduct('Vermouth rosso 1 L'),3,'Vermouth 3'],
  [mustProduct('Bitter Martini 1 L'),4,'Bitter 4'],
  [mustProduct('Vodka pesca 1 L'),1,'Vodka pesca 1'],
  [mustProduct('Vodka fragola 1 L'),2,'Vodka fragola 2'],
  [mustProduct('Aperol 1 L'),6,'Aperol 6'],
  [mustProduct('Gin Tanqueray 0.0 70 cl'),2,'Tanqueray 0.0 2'],
  [mustProduct('Lemon'),25,'Lemon 25'],
  [mustProduct('Tonica'),18,'Tonica 18'],
  [mustProduct('Coca-Cola 1.5 L'),2,'Coca-Cola 2 bottiglie'],
  [mustProduct('Sciroppo fragola'),1,'Sciroppo fragola 1'],
  [mustProduct('Succo cranberry'),2,'Cranberry 2'],
  [mustProduct('Succo arancia'),2,'Succo arancia 2'],
  [mustProduct('Prosecco Serena'),8,'Prosecco 8'],
  [mustProduct('Bicchieri 355 cc – stecca da 30'),15,'Bicchieri 355: 15 stecche']
 ];

 const oldIds=new Set(state.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){state.movements=state.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id))));state.consumption_lines=state.consumption_lines.filter(l=>!oldIds.has(Number(l.id)))}

 let totalUnits=0,totalCost=0;
 for(const [p,qty,sourceText] of rows){
  const cost=avg(p.id),cid=next(state.consumption_lines),code=`${prefix}|P=${p.id}|END`;
  state.consumption_lines.push({id:cid,event_id:event.id,area_id:area.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Compleanno 28/08 · ${sourceText} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
  state.movements.push({id:next(state.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:area.id,user_id:null,notes:`Consumo Compleanno 28/08 [${code}]`,created_at:now});
  totalUnits+=qty;totalCost+=qty*cost;
 }
 if(rows.length!==16||totalUnits!==105)throw new Error(`Compleanno 28/08: controllo quantità fallito (${rows.length} righe, ${totalUnits} unità)`);

 state.audit_logs.push({id:next(state.audit_logs),action:'caricamento consumi Compleanno 28/08/2026',entity_type:'event',entity_id:event.id,details:`16 righe / 105 unità. Costo valorizzato automaticamente al costo medio storico IVA inclusa del gestionale: €${totalCost.toFixed(2)}. Gin=Tanqueray 1 L; Vodka=Smirnoff; Fregola interpretata come Vodka fragola; Coca-Cola su SKU bottiglie 1.5 L; Lemon su referenza unica.`,created_at:now});
 state.meta[marker]={applied_at:now,event_id:event.id,event_date:date,area:area.name,loaded_lines:16,total_units:105,total_cost:totalCost,cost_method:'weighted_average_gross_vat_included',mappings:{gin:'Gin Tanqueray 1 L',vodka:'Vodka Smirnoff Red 1 L',fregola:'Vodka fragola 1 L',coca:'Coca-Cola 1.5 L',lemon:'Lemon'},all_consumption_deducted:true};
 return true;
};
})();
