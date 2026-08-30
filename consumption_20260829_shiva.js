(function(){
'use strict';

window.applyShivaConsumption20260829=function(state){
 const marker='shiva_consumption_20260829_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','areas','consumption_lines','movements','audit_logs','invoice_lines'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-08-29',prefix='SHIVA-20260829';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>work.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=name=>{const p=product(name);if(!p)throw new Error('SHIVA 29/08 non caricata: prodotto non trovato: '+name);return p};
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const stock=pid=>work.movements.filter(m=>Number(m.product_id)===Number(pid)).reduce((s,m)=>s+Number(m.quantity_delta||0),0);
 const ensureProduct=(name,brand,format)=>{let p=product(name);if(p)return p;p={id:next(work.products),name,brand,active:1,format,category:'Vodka',base_unit:'bottiglia',min_stock:0,created_at:now,subcategory:'',units_per_case:6};work.products.push(p);return p};
 const ensureArea=name=>{let a=work.areas.find(x=>norm(x.name)===norm(name));if(a)return a;a={id:next(work.areas),name,active:1,created_at:now};work.areas.push(a);return a};

 // Pre-validazione prodotti esistenti prima di modificare il clone.
 const names=['Gin Tanqueray 1 L','Vodka Smirnoff Red 1 L','Rum bianco 1 L','Triple Sec 1 L','Vermouth rosso 1 L','Bitter Martini 1 L','Vodka pesca 1 L','Vodka fragola 1 L','Aperol 1 L','Prosecco Serena','Lemon','Tonica','Coca-Cola 1.5 L','Sciroppo fragola','Sweet & Sour','Succo cranberry','Succo arancia','Succo ananas','Bicchieri 355 cc – stecca da 30','Bicchieri 250 cc – stecca da 50','Cannucce 7×21 – confezione 1.000','Red Bull 25 cl','Gin Tanqueray Ten 70 cl','Vodka Ciroc 70 cl','Moët Réserve Impériale'];
 names.forEach(mustProduct);
 const redbull=mustProduct('Red Bull 25 cl'),redbullQty=stock(redbull.id);
 if(!(redbullQty>0))throw new Error('SHIVA 29/08 non caricata: “Red Bull tutta consumata” ma la giacenza disponibile risulta '+redbullQty+'. Controllare prima il magazzino.');

 const grey15=ensureProduct('Grey Goose 1.5 L','Grey Goose','1.5 L');
 const belvedere75=ensureProduct('Belvedere 75 cl','Belvedere','75 cl');
 const bar1=ensureArea('Bar 1'),bar2=ensureArea('Bar 2'),tables=ensureArea('Tavoli');
 let event=work.events.find(e=>String(e.event_date)===date&&norm(e.name)==='SHIVA');
 if(!event){event={id:next(work.events),event_date:date,name:'SHIVA',location:'Emerald Klubb',notes:'Consumi serata SHIVA 29/08/2026',created_at:now};work.events.push(event)}

 const groups=[
  {area:bar1,label:'BAR1',rows:[
   ['Gin Tanqueray 1 L',15,'Gin 15'],['Vodka Smirnoff Red 1 L',6,'Vodka 6'],['Rum bianco 1 L',2,'Rum bianco 2'],['Triple Sec 1 L',2,'Triple Sec 2'],['Vermouth rosso 1 L',1,'Vermouth 1'],['Bitter Martini 1 L',3,'Bitter 3'],['Vodka pesca 1 L',3,'Vodka pesca 3'],['Vodka fragola 1 L',3,'Vodka fragola 3'],['Aperol 1 L',1,'Aperol 1'],['Prosecco Serena',5,'Prosecco 5'],['Lemon',63,'Lemon 63'],['Tonica',13,'Tonica 13'],['Coca-Cola 1.5 L',4,'Coca-Cola 4'],['Sciroppo fragola',3,'Sciroppo fragola 3'],['Sweet & Sour',3,'Sweet & Sour 3'],['Succo cranberry',1,'Cranberry 1'],['Succo arancia',2,'Arancia 2'],['Succo ananas',1,'Ananas 1'],['Bicchieri 355 cc – stecca da 30',16,'Bicchieri 355 16 stecche'],['Bicchieri 250 cc – stecca da 50',5,'Bicchieri 250 5 stecche'],['Cannucce 7×21 – confezione 1.000',1,'Cannucce 1 confezione'],['Red Bull 25 cl',redbullQty,'Red Bull: tutta la giacenza disponibile']
  ]},
  {area:bar2,label:'BAR2',rows:[
   ['Gin Tanqueray 1 L',8,'Gin 8'],['Vodka Smirnoff Red 1 L',3,'Vodka 3'],['Rum bianco 1 L',1,'Rum 1 interpretato Rum bianco'],['Triple Sec 1 L',1,'Triple Sec 1'],['Bitter Martini 1 L',2,'Bitter 2'],['Vermouth rosso 1 L',1,'Vermouth 1'],['Vodka pesca 1 L',2,'Vodka pesca 2'],['Vodka fragola 1 L',1,'Vodka fragola 1'],['Prosecco Serena',1,'Prosecco 1'],['Tonica',6,'Tonica 6'],['Lemon',30,'Lemon 30'],['Sweet & Sour',3,'Sweet & Sour 3'],['Sciroppo fragola',2,'Sciroppo fragola 2'],['Succo arancia',1,'Arancia 1'],['Succo ananas',1,'Ananas 1'],['Coca-Cola 1.5 L',1,'Coca-Cola 1'],['Succo cranberry',1,'Cranberry 1'],['Bicchieri 355 cc – stecca da 30',8,'Bicchieri 355 8 stecche'],['Bicchieri 250 cc – stecca da 50',2,'Bicchieri 250 2 stecche'],['Cannucce 7×21 – confezione 1.000',1,'Cannucce 1 confezione']
  ]},
  {area:tables,label:'TAVOLI',rows:[
   ['Lemon',91,'Lemon 91'],['Tonica',50,'Tonica 50'],['Vodka Smirnoff Red 1 L',12,'Vodka 12'],['Gin Tanqueray Ten 70 cl',47,'Tanqueray Ten 47'],['Vodka Ciroc 70 cl',9,'Ciroc 9'],['Moët Réserve Impériale',3,'Moët 3'],[grey15.name,1,'Grey Goose 1.5 L 1'],[belvedere75.name,6,'Belvedere 75 cl 6']
  ]}
 ];

 const oldIds=new Set(work.consumption_lines.filter(l=>String(l.notes||'').includes(prefix)).map(l=>Number(l.id)));
 if(oldIds.size){work.movements=work.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id))));work.consumption_lines=work.consumption_lines.filter(l=>!oldIds.has(Number(l.id)))}
 let lines=0,totalUnits=0,totalCost=0;
 for(const g of groups){for(const [name,qty,sourceText] of g.rows){const p=mustProduct(name),cost=avg(p.id),cid=next(work.consumption_lines),code=`${prefix}|${g.label}|P=${p.id}|END`;work.consumption_lines.push({id:cid,event_id:event.id,area_id:g.area.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`SHIVA 29/08 · ${sourceText} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});work.movements.push({id:next(work.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:g.area.id,user_id:null,notes:`Consumo SHIVA 29/08 [${code}]`,created_at:now});lines++;totalUnits+=qty;totalCost+=qty*cost}}
 const expected=448+redbullQty;
 if(lines!==50||totalUnits!==expected)throw new Error(`SHIVA 29/08: controllo quantità fallito (${lines} righe, ${totalUnits} unità; attese ${expected})`);
 if(Math.abs(stock(redbull.id))>1e-9)throw new Error('SHIVA 29/08: Red Bull non azzerata correttamente dopo lo scarico.');
 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento consumi SHIVA 29/08/2026',entity_type:'event',entity_id:event.id,details:`50 righe / ${totalUnits} unità. Red Bull consumata integralmente: ${redbullQty} lattine. Bar 1: ${153+redbullQty} unità; Bar 2: 76; Tavoli: 219. Grey Goose 1.5 L e Belvedere 75 cl mantenute come SKU separati dai vecchi formati storici; costo storico dei due nuovi SKU = 0 finché non viene registrato il relativo carico/fattura.`,created_at:now});
 work.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:50,total_units:totalUnits,total_cost:totalCost,cost_method:'weighted_average_gross_vat_included',redbull_consumed:redbullQty,redbull_rule:'consume_all_pre_event_stock',area_units:{bar1:153+redbullQty,bar2:76,tavoli:219},mappings:{gin:'Gin Tanqueray 1 L',vodka:'Vodka Smirnoff Red 1 L',bar2_rum:'Rum bianco 1 L',lemon:'Lemon',coca:'Coca-Cola 1.5 L',grey_goose:'Grey Goose 1.5 L (nuovo SKU separato)',belvedere:'Belvedere 75 cl (nuovo SKU separato)'},format_warnings:['Grey Goose 1.5 L non ha carico storico registrato','Belvedere 75 cl non ha carico storico registrato'],all_consumption_deducted:true};

 // Commit transazionale del clone solo dopo tutti i controlli.
 for(const k of ['products','events','areas','consumption_lines','movements','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
