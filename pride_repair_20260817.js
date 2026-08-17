(function(){
'use strict';

window.applyPrideRepair20260817=function(state){
  const marker='pride_consumption_definitive_20260817_v1';
  state.meta=state.meta||{};
  if(state.meta[marker])return false;

  for(const key of ['products','product_aliases','events','areas','consumption_lines','movements','audit_logs']){
    state[key]=Array.isArray(state[key])?state[key]:[];
  }

  const now=new Date().toISOString();
  const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();

  const resolve=aliases=>{
    for(const a of aliases){
      const p=state.products.find(x=>norm(x.name)===norm(a));
      if(p)return p;
    }
    for(const a of aliases){
      const alias=state.product_aliases.find(x=>norm(x.alias)===norm(a));
      if(alias){
        const p=state.products.find(x=>Number(x.id)===Number(alias.product_id));
        if(p)return p;
      }
    }
    return null;
  };

  let event=state.events.find(e=>String(e.event_date)==='2026-07-18'&&norm(e.name)==='PRIDE');
  if(!event){
    event={id:next(state.events),event_date:'2026-07-18',name:'Pride',location:'',notes:'Consumi Pride definitivi comunicati il 17/08/2026',created_at:now};
    state.events.push(event);
  }
  let area=state.areas.find(a=>norm(a.name)==='GENERALE');
  if(!area){area={id:next(state.areas),name:'Generale',active:1,created_at:now};state.areas.push(area)}

  // Rimuove qualsiasi vecchia versione/compensazione del Pride per ricostruirlo una sola volta.
  const oldLineIds=new Set(
    state.consumption_lines
      .filter(x=>String(x.notes||'').includes('PRIDE-20260718') || (Number(x.event_id)===Number(event.id)&&/consumo pride/i.test(String(x.notes||''))))
      .map(x=>Number(x.id))
  );
  const beforeLines=state.consumption_lines.length;
  state.consumption_lines=state.consumption_lines.filter(x=>!oldLineIds.has(Number(x.id)));
  const removedLines=beforeLines-state.consumption_lines.length;

  const beforeMoves=state.movements.length;
  state.movements=state.movements.filter(m=>{
    const notes=String(m.notes||'');
    if(notes.includes('PRIDE-OFFSET-20260718'))return false;
    if(notes.includes('PRIDE-20260718'))return false;
    if(m.source_type==='consumption_line'&&oldLineIds.has(Number(m.source_id)))return false;
    return true;
  });
  const removedMoves=beforeMoves-state.movements.length;

  const entries=[
    {aliases:['Lemon'],qty:6,label:'Lemon'},
    {aliases:['Tonica'],qty:13,label:'Tonica'},
    {aliases:['Coca-Cola','Coca Cola'],qty:3,label:'Coca-Cola'},
    {aliases:['Bicchieri 355 cc – stecca da 30','Bicchieri 355 cc'],qty:12,label:'Bicchieri 355'},
    {aliases:['Bicchieri 250 cc – stecca da 50','Bicchieri 250 cc'],qty:4,label:'Bicchieri 250'},
    {aliases:['Gin Tanqueray 1 L','Tanqueray 1 L'],qty:11,label:'Gin Tanqueray'},
    {aliases:['Vermouth rosso 1 L','Vermouth Cinzano 1 L','Cinzano'],qty:2,label:'Cinzano'},
    {aliases:['Prosecco Serena','Prosecco'],qty:3,label:'Prosecco'},
    {aliases:['Vodka Smirnoff Red 1 L','Smirnoff Red','Vodka'],qty:2,label:'Vodka'},
    {aliases:['Bitter Martini 1 L','Bitter Martini','Bitter'],qty:1,label:'Bitter'},
    {aliases:['Aperol 1 L','Aperol'],qty:1,label:'Aperol'}
  ];

  const missing=[];
  let totalUnits=0;
  for(const item of entries){
    const p=resolve(item.aliases);
    if(!p){missing.push(item.label);continue}
    const cid=next(state.consumption_lines);
    let cost=0;
    try{cost=typeof avgCost==='function'?Number(avgCost(p.id)||0):0}catch(_){cost=0}
    const code=`PRIDE-20260718-${p.id}`;
    state.consumption_lines.push({
      id:cid,event_id:event.id,area_id:area.id,product_id:p.id,quantity_base:item.qty,unit:p.base_unit,
      cost_unit:cost,cost_total:item.qty*cost,notes:`Consumo Pride definitivo · ${code}`,
      source_type:'manual_import',source_id:null,created_at:now
    });
    state.movements.push({
      id:next(state.movements),movement_date:'2026-07-18',movement_type:'consumo',product_id:p.id,
      quantity_delta:-item.qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:area.id,
      user_id:null,notes:`Consumo Pride definitivo [${code}]`,created_at:now
    });
    totalUnits+=item.qty;
  }

  if(missing.length)throw new Error('Riparazione Pride incompleta. Prodotti non trovati: '+missing.join(', '));

  state.audit_logs.push({
    id:next(state.audit_logs),action:'riparazione definitiva consumo Pride',entity_type:'event',entity_id:event.id,
    details:`Pride 18/07/2026 ricostruito da zero: 11 righe, ${totalUnits} unità. Rimossi ${removedLines} vecchie righe e ${removedMoves} vecchi movimenti/compensazioni. Consumi definitivi: Lemon 6; Tonica 13; Coca-Cola 3; Bicchieri 355 12; Bicchieri 250 4; Tanqueray 11; Cinzano 2; Prosecco 3; Vodka 2; Bitter 1; Aperol 1.`,
    created_at:now
  });
  state.meta[marker]={applied_at:now,event_id:event.id,event_date:'2026-07-18',lines:11,total_units:58,removed_old_lines:removedLines,removed_old_movements:removedMoves,definitive:true};
  return true;
};
})();
