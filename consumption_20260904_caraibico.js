(function(){
'use strict';

window.applyCaraibicoConsumption20260904=function(state){
 const marker='caraibico_consumption_20260904_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','areas','invoice_lines','consumption_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-04',prefix='CARAIBICO-20260904';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const resolve=aliases=>{
   for(const a of aliases){const p=work.products.find(x=>norm(x.name)===norm(a));if(p)return p}
   for(const a of aliases){const toks=norm(a).split(' ').filter(t=>t.length>2);const p=work.products.find(x=>{const n=norm(x.name);return toks.length&&toks.every(t=>n.includes(t))});if(p)return p}
   return null;
 };
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const specs=[
  {label:'Lemon',aliases:['Lemon'],qty:9},
  {label:'Tonica',aliases:['Tonica'],qty:11},
  {label:'Coca-Cola 2 L',aliases:['Coca-Cola 2 L','Coca Cola 2 L'],qty:2},
  {label:'Sciroppo fragola',aliases:['Sciroppo fragola','Polpa fragola Royal Drink 1 kg','Royal Drink Strawberry'],qty:2},
  {label:'Gin Tanqueray 1 L',aliases:['Gin Tanqueray 1 L'],qty:8},
  {label:'Rum bianco 1 L',aliases:['Rum bianco 1 L','Captain Morgan White 1 L'],qty:1},
  {label:'Vodka Smirnoff Red 1 L',aliases:['Vodka Smirnoff Red 1 L','Smirnoff Red 1 L'],qty:3},
  {label:'Bitter Martini 1 L',aliases:['Bitter Martini 1 L','Bitter Martini'],qty:3},
  {label:'Vermouth rosso 1 L',aliases:['Vermouth rosso 1 L','Vermouth Cinzano 1 L','Vermouth Cinzano'],qty:4},
  {label:'Triple Sec 1 L',aliases:['Triple Sec 1 L','Triple Sec'],qty:2},
  {label:'Aperol 1 L',aliases:['Aperol 1 L','Aperol'],qty:2},
  {label:'Prosecco Serena',aliases:['Prosecco Serena','Prosecco'],qty:8},
  {label:'Campari',aliases:['Campari 1 L','Campari'],qty:1},
  {label:'Vodka pesca 1 L',aliases:['Vodka pesca 1 L','Vodka pesca'],qty:1},
  {label:'Succo arancia',aliases:['Succo arancia','Succo arancia 1 L'],qty:1},
  {label:'Succo ananas',aliases:['Succo ananas','Succo ananas 1 L'],qty:1},
  {label:'Sweet & Sour',aliases:['Sweet & Sour','Sweet&Sour','Sweet and Sour'],qty:1},
  {label:'Jack Daniel’s',aliases:['Jack Daniel’s','Jack Daniels','Whisky Jack Daniel’s','Whiskey Jack Daniel’s','Jack Daniel 1 L','Jack Daniels 1 L'],qty:1},
  {label:'Rum scuro',aliases:['Rum scuro 1 L','Rum scuro'],qty:1},
  {label:'Bicchieri 250 cc – stecca da 50',aliases:['Bicchieri 250 cc – stecca da 50','Bicchieri 250 cc'],qty:4}
 ];
 const rows=specs.map(s=>({...s,product:resolve(s.aliases)}));
 const missing=rows.filter(r=>!r.product).map(r=>r.label);
 if(missing.length)throw new Error('Caraibico 04/09 non caricato: prodotti non trovati: '+missing.join(', ')+'. Nessuna modifica applicata.');

 // Retry safety: rimuove eventuali righe/movimenti parziali con lo stesso tag prima di ricostruire il consumo.
 const oldLineIds=new Set(work.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 work.movements=work.movements.filter(m=>!(m.source_type==='consumption_line'&&oldLineIds.has(Number(m.source_id)))&&!String(m.notes||'').includes(prefix));
 work.consumption_lines=work.consumption_lines.filter(l=>!String(l.notes||'').includes(prefix));

 let event=work.events.find(e=>String(e.event_date)===date&&norm(e.name)==='CARAIBICO');
 if(!event){event={id:next(work.events),event_date:date,name:'Caraibico',location:'',notes:'Consumi caricati da riepilogo manuale',created_at:now};work.events.push(event)}
 const area=work.areas.find(a=>norm(a.name)==='GENERALE')||work.areas.find(a=>norm(a.name)==='BAR 1')||work.areas[0]||null;
 let totalUnits=0,totalCost=0;
 for(const r of rows){
   const p=r.product,qty=Number(r.qty),cost=avg(p.id),cid=next(work.consumption_lines),code=`${prefix}-${p.id}`;
   work.consumption_lines.push({id:cid,event_id:event.id,area_id:area?.id||null,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo Caraibico 04/09/2026 · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   work.movements.push({id:next(work.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:area?.id||null,user_id:null,notes:`Consumo Caraibico 04/09/2026 · [${code}]`,created_at:now});
   totalUnits+=qty;totalCost+=qty*cost;
 }
 const loaded=work.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)&&String(l.notes||'').includes(prefix));
 const loadedUnits=loaded.reduce((s,l)=>s+Number(l.quantity_base||0),0);
 if(loaded.length!==20||Math.abs(loadedUnits-66)>1e-9)throw new Error(`Caraibico 04/09: validazione fallita (${loaded.length} righe, ${loadedUnits} unità). Nessuna modifica applicata.`);
 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento consumo Caraibico 04/09/2026',entity_type:'event',entity_id:event.id,details:`20 righe, 66 unità scalate integralmente. Mapping confermati: Fanta Lemon→Lemon; Kinley→Tonica; Coca-Cola→2 L; Royal Drink Strawberry→Sciroppo fragola; Rum White Morgan→Rum bianco/Captain Morgan; bicchieri 255→Bicchieri 250 cc. Costo calcolato con costo medio storico IVA inclusa: ${totalCost.toFixed(2)} €.` ,created_at:now});
 work.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:20,total_units:66,total_cost:totalCost,area_id:area?.id||null,all_consumption_deducted:true,mappings:{fanta_lemon:'Lemon',kinley:'Tonica',coca_cola:'Coca-Cola 2 L',royal_drink_strawberry:'Sciroppo fragola',rum_white_morgan:'Rum bianco 1 L',bicchieri_255:'Bicchieri 250 cc – stecca da 50'}};
 for(const k of ['events','consumption_lines','movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
