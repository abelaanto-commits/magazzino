(function(){
'use strict';

window.applyCaraibicoConsumption20261018=function(state){
 const marker='caraibico_consumption_20261018_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','areas','invoice_lines','consumption_lines','movements','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-10-18',prefix='CARAIBICO-20261018';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const resolve=aliases=>{
   for(const a of aliases){const p=work.products.find(x=>norm(x.name)===norm(a));if(p)return p}
   for(const a of aliases){const toks=norm(a).split(' ').filter(t=>t.length>2);const p=work.products.find(x=>{const n=norm(x.name);return toks.length&&toks.every(t=>n.includes(t))});if(p)return p}
   return null;
 };
 const must=(label,aliases)=>{const p=resolve(aliases);if(!p)throw new Error('Caraibico 18/10 non caricato: prodotto non trovato: '+label+'. Nessuna modifica applicata.');return p};
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const area=work.areas.find(a=>norm(a.name)==='BAR 1')||work.areas.find(a=>norm(a.name)==='GENERALE')||work.areas[0]||null;

 const rows=[
  {label:'Gin Tanqueray 1 L',product:must('Gin Tanqueray 1 L',['Gin Tanqueray 1 L']),qty:2,source:'Gin 2'},
  {label:'Vodka Smirnoff Red 1 L',product:must('Vodka Smirnoff Red 1 L',['Vodka Smirnoff Red 1 L','Smirnoff Red 1 L']),qty:1,source:'Vodka 1'},
  {label:'Triple Sec 1 L',product:must('Triple Sec 1 L',['Triple Sec 1 L','Triple Sec']),qty:1,source:'Triple Sec 1'},
  {label:'Bitter Martini 1 L',product:must('Bitter Martini 1 L',['Bitter Martini 1 L','Bitter Martini']),qty:1,source:'Bitter 1'},
  {label:'Vermouth rosso 1 L',product:must('Vermouth rosso 1 L',['Vermouth rosso 1 L','Vermouth Cinzano 1 L','Vermouth Cinzano']),qty:1,source:'Vermouth 1'},
  {label:'Aperol 1 L',product:must('Aperol 1 L',['Aperol 1 L','Aperol']),qty:2,source:'Aperol 2'},
  {label:'Prosecco Serena',product:must('Prosecco Serena',['Prosecco Serena','Prosecco']),qty:5,source:'Prosecco 5'},
  {label:'Lemon',product:must('Lemon',['Lemon']),qty:16,source:'Lemon 16'},
  {label:'Tonica',product:must('Tonica',['Tonica']),qty:8,source:'Tonica 8'},
  {label:'Succo arancia',product:must('Succo arancia',['Succo arancia','Succo arancia 1 L']),qty:1,source:'Arancia 1'},
  {label:'Succo ananas',product:must('Succo ananas',['Succo ananas','Succo ananas 1 L']),qty:2,source:'Ananas 2'},
  {label:'Sweet & Sour',product:must('Sweet & Sour',['Sweet & Sour','Sweet&Sour','Sweet and Sour']),qty:2,source:'Sweet 2'},
  {label:'Sciroppo fragola',product:must('Sciroppo fragola',['Sciroppo fragola','Polpa fragola Royal Drink 1 kg','Royal Drink Strawberry']),qty:2,source:'Sciroppo fragola 2'},
  {label:'Coca-Cola 2 L',product:must('Coca-Cola 2 L',['Coca-Cola 2 L','Coca Cola 2 L']),qty:1,source:'Coca-Cola 1 → formato 2 L'},
  {label:'Bicchieri 355 cc – stecca da 30',product:must('Bicchieri 355 cc',['Bicchieri 355 cc – stecca da 30','Bicchieri 355 cc']),qty:3,source:'Bicchieri 355 3 stecche'}
 ];

 const oldIds=new Set(work.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){
   work.movements=work.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id)))&&!String(m.notes||'').includes(prefix));
   work.consumption_lines=work.consumption_lines.filter(l=>!String(l.notes||'').includes(prefix));
 }

 let event=work.events.find(e=>String(e.event_date)===date&&norm(e.name)==='CARAIBICO');
 if(!event){event={id:next(work.events),event_date:date,name:'Caraibico',location:'',notes:'Consumi Caraibico 18/10/2026 caricati da riepilogo manuale',created_at:now};work.events.push(event)}

 let totalUnits=0,totalCost=0;
 for(const r of rows){
   const p=r.product,qty=Number(r.qty),cost=avg(p.id),cid=next(work.consumption_lines),code=`${prefix}|P=${p.id}|END`;
   work.consumption_lines.push({id:cid,event_id:event.id,area_id:area?.id||null,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo Caraibico 18/10/2026 · ${r.source} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   work.movements.push({id:next(work.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:area?.id||null,user_id:null,notes:`Consumo Caraibico 18/10/2026 [${code}]`,created_at:now});
   totalUnits+=qty;totalCost+=qty*cost;
 }

 const loaded=work.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)&&String(l.notes||'').includes(prefix));
 const loadedUnits=loaded.reduce((s,l)=>s+Number(l.quantity_base||0),0);
 if(loaded.length!==15||Math.abs(loadedUnits-48)>1e-9)throw new Error(`Caraibico 18/10: validazione fallita (${loaded.length} righe, ${loadedUnits} unità). Nessuna modifica applicata.`);

 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento consumo Caraibico 18/10/2026',entity_type:'event',entity_id:event.id,details:`15 righe / 48 unità. Mapping: Gin→Tanqueray 1 L; Vodka→Smirnoff 1 L; Coca-Cola→2 L; Bicchieri355→stecca da 30. Costo medio storico IVA inclusa: €${totalCost.toFixed(2)}.`,created_at:now});
 work.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:15,total_units:48,total_cost:totalCost,cost_method:'weighted_average_gross_vat_included',area_id:area?.id||null,mappings:{gin:'Gin Tanqueray 1 L',vodka:'Vodka Smirnoff Red 1 L',coca_cola:'Coca-Cola 2 L',bicchieri355:'Bicchieri 355 cc – stecca da 30'},all_consumption_deducted:true};
 for(const k of ['events','consumption_lines','movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
