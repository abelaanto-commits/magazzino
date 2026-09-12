(function(){
'use strict';

window.applyConsumption20260911=function(state){
 const marker='consumption_20260911_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','areas','invoice_lines','consumption_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-11',prefix='CONSUMO-20260911';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const resolve=aliases=>{
   for(const a of aliases){const p=work.products.find(x=>norm(x.name)===norm(a));if(p)return p}
   for(const a of aliases){const toks=norm(a).split(' ').filter(t=>t.length>2);const p=work.products.find(x=>{const n=norm(x.name);return toks.length&&toks.every(t=>n.includes(t))});if(p)return p}
   return null;
 };
 const must=(label,aliases)=>{const p=resolve(aliases);if(!p)throw new Error('Consumo 11/09 non caricato: prodotto non trovato: '+label);return p};
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const ensureArea=name=>{let a=work.areas.find(x=>norm(x.name)===norm(name));if(a)return a;a={id:next(work.areas),name,active:1,created_at:now};work.areas.push(a);return a};
 const bar1=ensureArea('Bar 1'),tables=ensureArea('Tavoli');

 const P={
  gin:must('Gin Tanqueray 1 L',['Gin Tanqueray 1 L']),
  vodka:must('Vodka Smirnoff Red 1 L',['Vodka Smirnoff Red 1 L','Smirnoff Red 1 L']),
  rum:must('Rum bianco 1 L',['Rum bianco 1 L','Captain Morgan White 1 L']),
  triple:must('Triple Sec 1 L',['Triple Sec 1 L','Triple Sec']),
  vermouth:must('Vermouth rosso 1 L',['Vermouth rosso 1 L','Vermouth Cinzano 1 L','Vermouth Cinzano']),
  bitter:must('Bitter Martini 1 L',['Bitter Martini 1 L','Bitter Martini']),
  pesca:must('Vodka pesca 1 L',['Vodka pesca 1 L','Vodka pesca']),
  aperol:must('Aperol 1 L',['Aperol 1 L','Aperol']),
  tanq0:must('Gin Tanqueray 0.0 70 cl',['Gin Tanqueray 0.0 70 cl','Tanqueray 0.0 70 cl']),
  prosecco:must('Prosecco Serena',['Prosecco Serena','Prosecco']),
  lemon:must('Lemon',['Lemon']),
  tonica:must('Tonica',['Tonica']),
  sweet:must('Sweet & Sour',['Sweet & Sour','Sweet&Sour','Sweet and Sour']),
  fragola:must('Sciroppo fragola',['Sciroppo fragola','Polpa fragola Royal Drink 1 kg','Royal Drink Strawberry']),
  cranberry:must('Succo cranberry',['Succo cranberry','Cranberry']),
  ananas:must('Succo ananas',['Succo ananas','Succo ananas 1 L']),
  arancia:must('Succo arancia',['Succo arancia','Succo arancia 1 L']),
  coca2:must('Coca-Cola 2 L',['Coca-Cola 2 L','Coca Cola 2 L']),
  bicc355:must('Bicchieri 355 cc – stecca da 30',['Bicchieri 355 cc – stecca da 30','Bicchieri 355 cc']),
  moet:must('Moët Réserve Impériale',['Moët Réserve Impériale','Moet Reserve Imperiale','Moët'])
 };

 let event=work.events.find(e=>String(e.event_date)===date&&(norm(e.name)==='SERATA 11 09'||norm(e.name)==='11 09'));
 if(!event){event={id:next(work.events),event_date:date,name:'Serata 11/09',location:'',notes:'Consumi 11/09/2026 caricati da riepilogo manuale',created_at:now};work.events.push(event)}

 const groups=[
  {area:bar1,label:'BAR1',rows:[
   [P.gin,11,'Gin 11'],[P.vodka,3,'Vodka 3'],[P.rum,1,'Rum 1 → Rum bianco/Captain Morgan'],[P.triple,1,'Triple Sec 1'],[P.vermouth,1,'Vermouth 1'],[P.bitter,1,'Bitter 1'],[P.pesca,3,'Vodka pesca 3'],[P.aperol,1,'Aperol 1'],[P.tanq0,5,'Tanqueray 0.0 5'],[P.prosecco,2,'Prosecco 2'],
   [P.lemon,29,'Lemon 29'],[P.tonica,5,'Tonica 5'],[P.sweet,2,'Sweet 2'],[P.fragola,4,'Fragola 4 → Sciroppo fragola'],[P.cranberry,2,'Cranberry 2'],[P.ananas,1,'Ananas 1'],[P.arancia,1,'Arancia 1'],[P.coca2,5,'Coca-Cola 5 → formato 2 L'],[P.bicc355,14,'Bicchieri 355: 14 stecche']
  ]},
  {area:tables,label:'TAVOLI',rows:[
   [P.gin,22,'Gin 22'],[P.vodka,12,'Vodka 12'],[P.moet,2,'Moët 2'],[P.lemon,37,'Lemon unificato 37 = Kinley Lemon 25 + Fanta Lemon 12'],[P.tonica,55,'Tonica 55'],[P.prosecco,5,'Prosecco 5']
  ]}
 ];

 // Retry-safe: rimuove solo un eventuale caricamento parziale di questo consumo e lo ricostruisce una volta.
 const oldIds=new Set(work.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){work.movements=work.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id)))&&!String(m.notes||'').includes(prefix));work.consumption_lines=work.consumption_lines.filter(l=>!String(l.notes||'').includes(prefix))}

 let totalUnits=0,totalCost=0,lines=0;const areaUnits={BAR1:0,TAVOLI:0};
 for(const g of groups){for(const [p,qty,sourceText] of g.rows){
   const cost=avg(p.id),cid=next(work.consumption_lines),code=`${prefix}|${g.label}|P=${p.id}|END`;
   work.consumption_lines.push({id:cid,event_id:event.id,area_id:g.area.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo 11/09/2026 · ${sourceText} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   work.movements.push({id:next(work.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:g.area.id,user_id:null,notes:`Consumo 11/09/2026 [${code}]`,created_at:now});
   totalUnits+=qty;totalCost+=qty*cost;areaUnits[g.label]+=qty;lines++;
 }}
 if(lines!==25||Math.abs(totalUnits-225)>1e-9||areaUnits.BAR1!==92||areaUnits.TAVOLI!==133)throw new Error(`Consumo 11/09: validazione fallita (${lines} righe, ${totalUnits} unità; Bar 1 ${areaUnits.BAR1}, Tavoli ${areaUnits.TAVOLI}). Nessuna modifica applicata.`);

 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento consumo 11/09/2026',entity_type:'event',entity_id:event.id,details:`25 righe canoniche / 225 unità: Bar 1 92, Tavoli 133. Tavoli Lemon unificato 37 (Kinley 25 + Fanta 12). Mapping: Rum→Rum bianco/Captain Morgan; Fragola→Sciroppo fragola; Coca-Cola→2 L; Bicchieri355→stecca da 30. Costo medio storico IVA inclusa: €${totalCost.toFixed(2)}.`,created_at:now});
 work.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:25,total_units:225,total_cost:totalCost,cost_method:'weighted_average_gross_vat_included',area_units:{bar1:92,tavoli:133},mappings:{rum:'Rum bianco 1 L',fragola:'Sciroppo fragola',coca_cola:'Coca-Cola 2 L',lemon_tables:'Lemon 37 = Kinley 25 + Fanta 12',bicchieri355:'Bicchieri 355 cc – stecca da 30'},all_consumption_deducted:true};
 for(const k of ['events','areas','consumption_lines','movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
