(function(){
'use strict';

window.applyCaraibicoConsumption20261107=function(state){
 const marker='caraibico_consumption_20261107_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;

 const w=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','areas','invoice_lines','consumption_lines','movements','audit_logs'])w[k]=Array.isArray(w[k])?w[k]:[];
 w.meta=w.meta||{};
 const now=new Date().toISOString(),date='2026-11-07',prefix='CARAIBICO-20261107';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const resolve=aliases=>{
   for(const a of aliases){const p=w.products.find(x=>norm(x.name)===norm(a));if(p)return p}
   for(const a of aliases){const toks=norm(a).split(' ').filter(t=>t.length>2);const p=w.products.find(x=>{const n=norm(x.name);return toks.length&&toks.every(t=>n.includes(t))});if(p)return p}
   return null;
 };
 const must=(label,aliases)=>{const p=resolve(aliases);if(!p)throw new Error('Caraibico 07/11 non caricato: prodotto non trovato: '+label+'. Nessuna modifica applicata.');return p};
 const avg=pid=>{const lines=w.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const area=w.areas.find(a=>norm(a.name)==='BAR 1')||w.areas.find(a=>norm(a.name)==='GENERALE')||w.areas[0]||null;

 const rows=[
   ['Gin Tanqueray 1 L',['Gin Tanqueray 1 L'],2,'Tanqueray 2'],
   ['Triple Sec 1 L',['Triple Sec 1 L'],1,'Triple Sec 1'],
   ['Vermouth rosso 1 L',['Vermouth rosso 1 L','Vermouth Martini Rosso 1 L'],1,'Vermouth 1'],
   ['Bitter Martini 1 L',['Bitter Martini 1 L'],1,'Bitter 1'],
   ['Vodka pesca 1 L',['Vodka pesca 1 L','Vodka Keglevich Pesca 1 L'],1,'Vodka pesca 1'],
   ['Prosecco Serena',['Prosecco Serena','Prosecco'],7,'Prosecco 7'],
   ['Aperol 1 L',['Aperol 1 L'],3,'Aperol 3'],
   ['Lemon',['Lemon'],10,'Lemon 10'],
   ['Tonica',['Tonica'],5,'Tonica 5'],
   ['Coca-Cola 2 L',['Coca-Cola 2 L','Coca Cola 2 L'],3,'Coca-Cola 3 → formato 2 L'],
   ['Succo ananas',['Succo ananas','Succo ananas 1 L'],2,'Ananas 2'],
   ['Sweet & Sour',['Sweet & Sour','Sweet&Sour','Sweet and Sour'],3,'Sweet 3'],
   ['Sciroppo fragola',['Sciroppo fragola','Royal Drink Strawberry','Polpa fragola Royal Drink 1 kg'],2,'Fragola 2 → Sciroppo fragola'],
   ['Bicchieri 355 cc – stecca da 30',['Bicchieri 355 cc – stecca da 30','Bicchieri 355 cc'],7,'355 7 stecche'],
   ['Bicchieri 250 cc – stecca da 50',['Bicchieri 250 cc – stecca da 50','Bicchieri 250 cc'],1,'250 1 stecca']
 ];

 const resolved=rows.map(([label,aliases,qty,src])=>({label,product:must(label,aliases),qty,src}));
 let event=w.events.find(e=>String(e.event_date)===date&&norm(e.name)==='CARAIBICO');
 if(!event){event={id:next(w.events),event_date:date,name:'Caraibico',location:'',notes:'Consumi Caraibico 07/11/2026 caricati da riepilogo manuale',created_at:now};w.events.push(event)}

 const oldIds=new Set(w.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){
   w.movements=w.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id)))&&!String(m.notes||'').includes(prefix));
   w.consumption_lines=w.consumption_lines.filter(l=>!String(l.notes||'').includes(prefix));
 }

 let totalUnits=0,totalCost=0;
 for(const r of resolved){
   const p=r.product,qty=Number(r.qty),cost=avg(p.id),cid=next(w.consumption_lines),code=`${prefix}|A=${area?.id||0}|P=${p.id}|END`;
   w.consumption_lines.push({id:cid,event_id:event.id,area_id:area?.id||null,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo Caraibico 07/11/2026 · ${r.src} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   w.movements.push({id:next(w.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:area?.id||null,user_id:null,notes:`Consumo Caraibico 07/11/2026 [${code}]`,created_at:now});
   totalUnits+=qty;totalCost+=qty*cost;
 }
 const loaded=w.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)&&String(l.notes||'').includes(prefix));
 const loadedUnits=loaded.reduce((s,l)=>s+Number(l.quantity_base||0),0);
 if(loaded.length!==15||Math.abs(loadedUnits-49)>1e-9)throw new Error(`Caraibico 07/11: validazione fallita (${loaded.length} righe, ${loadedUnits} unità). Nessuna modifica applicata.`);

 w.audit_logs.push({id:next(w.audit_logs),action:'caricamento consumo Caraibico 07/11/2026',entity_type:'event',entity_id:event.id,details:`15 righe / 49 unità. Mapping: Coca-Cola→2 L; Fragola→Sciroppo fragola; 355/250→stecche. Costo medio storico IVA inclusa: €${totalCost.toFixed(2)}.`,created_at:now});
 w.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:15,total_units:49,total_cost:totalCost,cost_method:'weighted_average_gross_vat_included',mappings:{coca_cola:'Coca-Cola 2 L',fragola:'Sciroppo fragola',bicchieri355:'stecca da 30',bicchieri250:'stecca da 50'}};

 for(const k of ['events','consumption_lines','movements','audit_logs','meta'])state[k]=w[k];
 return true;
};

})();