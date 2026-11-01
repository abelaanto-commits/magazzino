(function(){
'use strict';

window.applyHalloweenConsumption20261031=function(state){
 const marker='halloween_consumption_20261031_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','areas','invoice_lines','consumption_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-10-31',prefix='HALLOWEEN-20261031';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const resolve=aliases=>{
   for(const a of aliases){const p=work.products.find(x=>norm(x.name)===norm(a));if(p)return p}
   for(const a of aliases){const toks=norm(a).split(' ').filter(t=>t.length>2);const p=work.products.find(x=>{const n=norm(x.name);return toks.length&&toks.every(t=>n.includes(t))});if(p)return p}
   return null;
 };
 const must=(label,aliases)=>{const p=resolve(aliases);if(!p)throw new Error('Halloween 31/10 non caricato: prodotto non trovato: '+label+'. Nessuna modifica applicata.');return p};
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const bar1=work.areas.find(a=>norm(a.name)==='BAR 1')||work.areas.find(a=>norm(a.name)==='GENERALE')||work.areas[0]||null;
 const tables=work.areas.find(a=>norm(a.name)==='TAVOLI')||bar1;

 const rows=[
  {area:bar1,label:'Gin Tanqueray 1 L',product:must('Gin Tanqueray 1 L',['Gin Tanqueray 1 L']),qty:8,source:'Tanqueray 8'},
  {area:bar1,label:'Vodka Smirnoff Red 1 L',product:must('Vodka Smirnoff Red 1 L',['Vodka Smirnoff Red 1 L','Smirnoff Red 1 L']),qty:3,source:'Vodka 3'},
  {area:bar1,label:'Vermouth rosso 1 L',product:must('Vermouth rosso 1 L',['Vermouth rosso 1 L','Vermouth Cinzano 1 L']),qty:1,source:'Vermouth 1'},
  {area:bar1,label:'Bitter Martini 1 L',product:must('Bitter Martini 1 L',['Bitter Martini 1 L','Bitter Martini']),qty:1,source:'Bitter 1'},
  {area:bar1,label:'Vodka fragola 1 L',product:must('Vodka fragola 1 L',['Vodka fragola 1 L','Vodka Keglevich Fragola 1 L']),qty:2,source:'Vodka fragola 2'},
  {area:bar1,label:'Vodka pesca 1 L',product:must('Vodka pesca 1 L',['Vodka pesca 1 L','Vodka Keglevich Pesca 1 L']),qty:1,source:'Vodka pesca 1'},
  {area:bar1,label:'Rum scuro',product:must('Rum scuro',['Rum scuro']),qty:1,source:'Rum scuro 1'},
  {area:bar1,label:'Prosecco Serena',product:must('Prosecco Serena',['Prosecco Serena','Prosecco']),qty:3,source:'Prosecco 3'},
  {area:bar1,label:'Gin Tanqueray 0.0 70 cl',product:must('Gin Tanqueray 0.0 70 cl',['Gin Tanqueray 0.0 70 cl','Gin Tanqueray Alcohol Free 70 cl']),qty:1,source:'Tanqueray 0.0 1'},
  {area:bar1,label:'Lemon',product:must('Lemon',['Lemon']),qty:35,source:'Lemon 35'},
  {area:bar1,label:'Tonica',product:must('Tonica',['Tonica']),qty:3,source:'Tonica 3'},
  {area:bar1,label:'Coca-Cola 2 L',product:must('Coca-Cola 2 L',['Coca-Cola 2 L','Coca Cola 2 L']),qty:1,source:'Coca-Cola 1 → formato 2 L'},
  {area:bar1,label:'Succo arancia',product:must('Succo arancia',['Succo arancia','Succo arancia 1 L']),qty:2,source:'Arancia 2'},
  {area:bar1,label:'Succo ananas',product:must('Succo ananas',['Succo ananas','Succo ananas 1 L']),qty:1,source:'Ananas 1'},
  {area:bar1,label:'Sweet & Sour',product:must('Sweet & Sour',['Sweet & Sour','Sweet&Sour','Sweet and Sour']),qty:1,source:'Sweet 1'},
  {area:bar1,label:'Sciroppo fragola',product:must('Sciroppo fragola',['Sciroppo fragola','Polpa fragola Royal Drink 1 kg','Royal Drink Strawberry']),qty:2,source:'Fragola 2 → Sciroppo fragola'},
  {area:bar1,label:'Bicchieri 355 cc – stecca da 30',product:must('Bicchieri 355 cc',['Bicchieri 355 cc – stecca da 30','Bicchieri 355 cc']),qty:12,source:'355 12 stecche'},
  {area:bar1,label:'Bicchieri 250 cc – stecca da 50',product:must('Bicchieri 250 cc',['Bicchieri 250 cc – stecca da 50','Bicchieri 250 cc']),qty:2,source:'250 2 stecche'},
  {area:bar1,label:'Cannucce',product:must('Cannucce',['Cannucce 7×21 – confezione 1.000','Cannucce – conf. 1.000','Cannucce']),qty:1,source:'Cannucce 1 confezione'},
  {area:tables,label:'Gin Tanqueray 1 L',product:must('Gin Tanqueray 1 L',['Gin Tanqueray 1 L']),qty:25,source:'Tavoli Gin 25'},
  {area:tables,label:'Vodka Smirnoff Red 1 L',product:must('Vodka Smirnoff Red 1 L',['Vodka Smirnoff Red 1 L','Smirnoff Red 1 L']),qty:5,source:'Tavoli Vodka 5'},
  {area:tables,label:'Prosecco Serena',product:must('Prosecco Serena',['Prosecco Serena','Prosecco']),qty:4,source:'Tavoli Prosecco 4'},
  {area:tables,label:'Lemon',product:must('Lemon',['Lemon']),qty:46,source:'Tavoli Lemon 46'},
  {area:tables,label:'Tonica',product:must('Tonica',['Tonica']),qty:22,source:'Tavoli Tonica 22'}
 ];

 const oldIds=new Set(work.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){
   work.movements=work.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id)))&&!String(m.notes||'').includes(prefix));
   work.consumption_lines=work.consumption_lines.filter(l=>!String(l.notes||'').includes(prefix));
 }

 let event=work.events.find(e=>String(e.event_date)===date&&norm(e.name)==='HALLOWEEN');
 if(!event){event={id:next(work.events),event_date:date,name:'Halloween',location:'',notes:'Consumi Halloween 31/10/2026 caricati da riepilogo manuale',created_at:now};work.events.push(event)}

 let totalUnits=0,totalCost=0,barUnits=0,barCost=0,tableUnits=0,tableCost=0;
 for(const r of rows){
   const p=r.product,qty=Number(r.qty),cost=avg(p.id),cid=next(work.consumption_lines),code=`${prefix}|A=${r.area?.id||0}|P=${p.id}|END`;
   work.consumption_lines.push({id:cid,event_id:event.id,area_id:r.area?.id||null,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo Halloween 31/10/2026 · ${r.source} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   work.movements.push({id:next(work.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:r.area?.id||null,user_id:null,notes:`Consumo Halloween 31/10/2026 [${code}]`,created_at:now});
   totalUnits+=qty;totalCost+=qty*cost;
   if(Number(r.area?.id)===Number(tables?.id)){tableUnits+=qty;tableCost+=qty*cost}else{barUnits+=qty;barCost+=qty*cost}
 }

 const loaded=work.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)&&String(l.notes||'').includes(prefix));
 const loadedUnits=loaded.reduce((s,l)=>s+Number(l.quantity_base||0),0);
 if(loaded.length!==24||Math.abs(loadedUnits-183)>1e-9||barUnits!==81||tableUnits!==102)throw new Error(`Halloween 31/10: validazione fallita (${loaded.length} righe, ${loadedUnits} unità; Bar ${barUnits}; Tavoli ${tableUnits}). Nessuna modifica applicata.`);

 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento consumo Halloween 31/10/2026',entity_type:'event',entity_id:event.id,details:`24 righe / 183 unità: Bar 1 81, Tavoli 102. Mapping: Gin→Tanqueray 1 L; Vodka→Smirnoff 1 L; Fragola mixer→Sciroppo fragola; Coca-Cola→2 L; 355/250→stecche; Cannucce→confezione. Costo medio storico IVA inclusa: totale €${totalCost.toFixed(2)} (Bar €${barCost.toFixed(2)}, Tavoli €${tableCost.toFixed(2)}).`,created_at:now});
 work.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:24,total_units:183,bar1_units:81,tables_units:102,total_cost:totalCost,bar1_cost:barCost,tables_cost:tableCost,cost_method:'weighted_average_gross_vat_included',all_consumption_deducted:true,mappings:{gin:'Gin Tanqueray 1 L',vodka:'Vodka Smirnoff Red 1 L',fragola_mixer:'Sciroppo fragola',coca_cola:'Coca-Cola 2 L',bicchieri355:'stecca da 30',bicchieri250:'stecca da 50',cannucce:'confezione'}};
 for(const k of ['events','consumption_lines','movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
