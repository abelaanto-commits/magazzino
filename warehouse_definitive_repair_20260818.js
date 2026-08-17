(function(){
'use strict';

window.applyWarehouseDefinitiveRepair20260818=function(state){
 const marker='warehouse_definitive_repair_20260818_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;

 // Work on a full clone so a failed validation can never leave a half-repaired warehouse in memory.
 const w=JSON.parse(JSON.stringify(state));
 for(const key of ['products','product_aliases','events','areas','consumption_lines','invoices','invoice_lines','movements','audit_logs'])w[key]=Array.isArray(w[key])?w[key]:[];
 w.meta=w.meta||{};
 const now=new Date().toISOString();
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const productByName=name=>w.products.find(p=>norm(p.name)===norm(name))||null;
 const areaByName=name=>w.areas.find(a=>norm(a.name)===norm(name))||null;
 const eventByName=(date,name)=>w.events.find(e=>String(e.event_date)===date&&norm(e.name)===norm(name))||null;
 const mustProduct=name=>{const p=productByName(name);if(!p)throw new Error('Riparazione definitiva: prodotto mancante: '+name);return p};
 const mustArea=name=>{const a=areaByName(name);if(!a)throw new Error('Riparazione definitiva: area mancante: '+name);return a};
 const mustEvent=(date,name)=>{const e=eventByName(date,name);if(!e)throw new Error('Riparazione definitiva: serata mancante: '+date+' '+name);return e};
 const weightedAvgCost=pid=>{
   let q=0,v=0;
   for(const l of w.invoice_lines){if(Number(l.product_id)!==Number(pid)||Number(l.affects_stock||0)!==1||Number(l.is_free||0)===1)continue;const qty=Number(l.quantity_base||0),cost=Number(l.gross_unit_price||0);if(qty>0&&cost>=0){q+=qty;v+=qty*cost}}
   return q?v/q:0;
 };

 // 1) Merge three OCR-created duplicates from VENTI 62381 into the already existing canonical SKUs.
 const mergeSpecs=[
   {match:p=>norm(p.name).includes('APERO1')&&norm(p.name).includes('APERITIVO APEROL'),canonical:'Aperol 1 L'},
   {match:p=>norm(p.name).includes('MVTRIP')&&norm(p.name).includes('TRIPLE SEC'),canonical:'Triple Sec 1 L'},
   {match:p=>norm(p.name)==='CANNUCCE LONG DRINK 7X21 RIUTIL',canonical:'Cannucce 7×21 – confezione 1.000'}
 ];
 let mergedProducts=0;
 for(const spec of mergeSpecs){
   const target=mustProduct(spec.canonical),dups=w.products.filter(p=>Number(p.id)!==Number(target.id)&&spec.match(p));
   for(const dup of dups){
     for(const l of w.invoice_lines)if(Number(l.product_id)===Number(dup.id))l.product_id=target.id;
     for(const l of w.consumption_lines)if(Number(l.product_id)===Number(dup.id))l.product_id=target.id;
     for(const m of w.movements)if(Number(m.product_id)===Number(dup.id))m.product_id=target.id;
     for(const a of w.product_aliases)if(Number(a.product_id)===Number(dup.id))a.product_id=target.id;
     w.products=w.products.filter(p=>Number(p.id)!==Number(dup.id));
     mergedProducts++;
   }
 }
 {const seen=new Set();w.product_aliases=w.product_aliases.filter(a=>{const k=[Number(a.product_id)||0,Number(a.supplier_id)||0,norm(a.alias)].join('|');if(seen.has(k))return false;seen.add(k);return true})}

 // 2) Separate Kingston Wray Silver from the generic Rum bianco/Captain Morgan SKU.
 const rumWhite=mustProduct('Rum bianco 1 L');
 rumWhite.brand='Captain Morgan';
 let kingston=productByName('Rum Kingston Wray Silver 1 L');
 if(!kingston){kingston={id:next(w.products),name:'Rum Kingston Wray Silver 1 L',brand:'Kingston Wray',category:'Rum',subcategory:'',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:0,active:1,created_at:now};w.products.push(kingston)}
 const kingstonLineIds=[];
 for(const l of w.invoice_lines){if(norm(l.raw_description).includes('RUM KINGSTON WRAY SILVER')){l.product_id=kingston.id;kingstonLineIds.push(Number(l.id))}}
 if(!kingstonLineIds.length)throw new Error('Riparazione definitiva: riga acquisto Kingston Wray non trovata.');
 for(const m of w.movements){if(m.source_type==='invoice_line'&&kingstonLineIds.includes(Number(m.source_id)))m.product_id=kingston.id}
 for(const a of w.product_aliases){if(norm(a.alias).includes('RUM KINGSTON WRAY SILVER'))a.product_id=kingston.id}
 if(!w.product_aliases.some(a=>Number(a.product_id)===Number(kingston.id)&&norm(a.alias)==='RUM KINGSTON WRAY SILVER CL 100 X6'))w.product_aliases.push({id:next(w.product_aliases),product_id:kingston.id,alias:'RUM KINGSTON WRAY SILVER CL 100 X6',supplier_id:null});

 // 3) Rebuild every post-inventory event from the authoritative quantities.
 // This neutralizes the prefix-ID collision introduced by warehouse_audit_20260817_v2 (e.g. -3 matching -34/-35 and -4 matching -40).
 const bar1=mustArea('Bar 1'),bar2=mustArea('Bar 2'),tables=mustArea('Tavoli');
 const pride=mustEvent('2026-07-18','Pride');
 const festuniBF=mustEvent('2026-07-24','Festuni Baile Funk');
 const nuccia=mustEvent('2026-07-31','Nuccia Sole');
 const fxxl=mustEvent('2026-08-05','Festuni XXL');
 const aug14=mustEvent('2026-08-14','Serata 14/08');
 const targetEventIds=new Set([Number(pride.id),Number(festuniBF.id),Number(nuccia.id),Number(fxxl.id),Number(aug14.id)]);
 const oldIds=new Set(w.consumption_lines.filter(l=>targetEventIds.has(Number(l.event_id))).map(l=>Number(l.id)));
 w.movements=w.movements.filter(m=>!(m.source_type==='consumption_line'&&oldIds.has(Number(m.source_id))));
 w.consumption_lines=w.consumption_lines.filter(l=>!oldIds.has(Number(l.id)));

 const specs=[];
 const add=(event,area,prefix,entries)=>{for(const [name,qty] of entries)specs.push({event,area,prefix,name,qty})};
 const general=mustArea('Generale');
 add(pride,general,'PRIDE-20260718',[
   ['Lemon',6],['Tonica',13],['Coca-Cola',3],['Bicchieri 355 cc – stecca da 30',12],['Bicchieri 250 cc – stecca da 50',4],['Gin Tanqueray 1 L',11],['Vermouth rosso 1 L',2],['Prosecco Serena',3],['Vodka Smirnoff Red 1 L',2],['Bitter Martini 1 L',1],['Aperol 1 L',1]
 ]);
 add(festuniBF,bar1,'FESTUNI-BF-20260724-BAR',[
   ['Gin Tanqueray 1 L',3],['Vodka Smirnoff Red 1 L',1],['Vodka pesca 1 L',1],['Gin Tanqueray 0.0 70 cl',1],['Prosecco Serena',6],['Coca-Cola',2],['Bicchieri 355 cc – stecca da 30',6],['Bicchieri 250 cc – stecca da 50',1]
 ]);
 add(festuniBF,tables,'FESTUNI-BF-20260724-TAVOLI',[
   ['Gin Tanqueray 1 L',8],['Vodka Smirnoff Red 1 L',4],['Lemon',11],['Tonica',14],['Bicchieri 250 cc – stecca da 50',5]
 ]);
 add(nuccia,bar1,'NUCCIA-SOLE-20260731-BAR1',[
   ['Gin Tanqueray 1 L',6],['Prosecco Serena',7],['Aperol 1 L',3],['Vodka Smirnoff Red 1 L',1],['Vermouth rosso 1 L',1],['Bitter Martini 1 L',1],['Tonica',11],['Coca-Cola',2],['Sciroppo fragola',1],['Succo cranberry',1],['Bicchieri 355 cc – stecca da 30',9],['Bicchieri 250 cc – stecca da 50',1]
 ]);
 add(fxxl,bar1,'FESTUNI-XXL-20260805-BAR1',[
   ['Gin Tanqueray 1 L',11],['Vodka Smirnoff Red 1 L',4],['Rum scuro',3],['Triple Sec 1 L',2],['Vodka fragola 1 L',4],['Vodka pesca 1 L',2],['Vermouth rosso 1 L',2],['Bitter Martini 1 L',2],['Lemon',38],['Tonica',15],['Coca-Cola',3],['Sciroppo fragola',2],['Sweet & Sour',5],['Prosecco Serena',4],['Bicchieri 355 cc – stecca da 30',18],['Bicchieri 250 cc – stecca da 50',1]
 ]);
 add(fxxl,bar2,'FESTUNI-XXL-20260805-BAR2',[
   ['Gin Tanqueray 1 L',4],['Vodka Smirnoff Red 1 L',3],['Rum bianco 1 L',1],['Triple Sec 1 L',1],['Vermouth rosso 1 L',1],['Vodka fragola 1 L',1],['Aperol 1 L',1],['Prosecco Serena',1],['Bicchieri 355 cc – stecca da 30',9],['Lemon',13],['Tonica',2],['Sciroppo fragola',1],['Succo cranberry',1],['Sweet & Sour',1],['Coca-Cola',3],['Succo ananas',1]
 ]);
 add(fxxl,tables,'FESTUNI-XXL-20260805-TAVOLI',[
   ['Gin Tanqueray Ten 70 cl',49],['Grey Goose 70 cl',2],['Moët Réserve Impériale',1],['Prosecco Serena',10],['Vodka Smirnoff Red 1 L',14],['Bicchieri 250 cc – stecca da 50',17],['Lemon',63],['Tonica',52]
 ]);
 add(aug14,bar1,'CONS-20260814-BAR1',[
   ['Gin Tanqueray 1 L',35],['Vodka Smirnoff Red 1 L',13],['Rum bianco 1 L',1],['Triple Sec 1 L',1],['Vodka fragola 1 L',1],['Vodka pesca 1 L',2],['Vermouth rosso 1 L',6],['Bitter Martini 1 L',8],['Whisky Four Roses 1 L',1],['Aperol 1 L',2],['Prosecco Serena',11],['Gin Tanqueray 0.0 70 cl',2],['Lemon',37],['Tonica',58],['Coca-Cola 1.5 L',9],['Sciroppo fragola',2],['Sweet & Sour',5],['Bicchieri 355 cc – stecca da 30',45],['Bicchieri 250 cc – stecca da 50',6],['Cannucce 7×21 – confezione 1.000',2]
 ]);
 add(aug14,bar2,'CONS-20260814-BAR2',[
   ['Gin Tanqueray 1 L',13],['Vodka Smirnoff Red 1 L',2],['Vermouth rosso 1 L',1],['Bitter Martini 1 L',1],['Vodka fragola 1 L',1],['Vodka pesca 1 L',1],['Prosecco Serena',4],['Bicchieri 355 cc – stecca da 30',18],['Bicchieri 250 cc – stecca da 50',4],['Cannucce 7×21 – confezione 1.000',1],['Lemon',25],['Tonica',54],['Sciroppo fragola',1],['Sweet & Sour',1],['Coca-Cola 1.5 L',8],['Succo arancia',2],['Succo ananas',1]
 ]);
 add(aug14,tables,'CONS-20260814-TAVOLI',[
   ['Gin Tanqueray 1 L',36],['Gin Tanqueray Ten 70 cl',2],['Vodka Ciroc 70 cl',1],['Prosecco Serena',4],['Vodka Ketel One 1 L',2],['Tequila Don Julio Reposado 70 cl',6],['Tequila Casamigos Blanco 70 cl',1],['Bicchieri 250 cc – stecca da 50',16],['Lemon',41],['Tonica',57]
 ]);

 for(const spec of specs){
   const p=mustProduct(spec.name),cost=weightedAvgCost(p.id),cid=next(w.consumption_lines);
   const code=`${spec.prefix}|P=${p.id}|END`;
   w.consumption_lines.push({id:cid,event_id:spec.event.id,area_id:spec.area.id,product_id:p.id,quantity_base:spec.qty,unit:p.base_unit,cost_unit:cost,cost_total:spec.qty*cost,notes:`Consumo definitivo · ${spec.event.name} · ${spec.area.name} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   w.movements.push({id:next(w.movements),movement_date:spec.event.event_date,movement_type:'consumo',product_id:p.id,quantity_delta:-spec.qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:spec.area.id,user_id:null,notes:`Consumo definitivo · ${spec.event.name} · ${spec.area.name} [${code}]`,created_at:now});
 }

 // 4) Restore the zero-value logistical note present in invoice 70702/FAC, for source completeness only; it never affects stock.
 const inv70702=w.invoices.find(i=>norm(i.invoice_number)==='70702 FAC'&&String(i.invoice_date)==='2026-08-05');
 if(inv70702&&!w.invoice_lines.some(l=>Number(l.invoice_id)===Number(inv70702.id)&&norm(l.raw_description)==='POMERIGGIO ORE 15 PRESSO EMERALD')){
   w.invoice_lines.push({id:next(w.invoice_lines),invoice_id:inv70702.id,product_id:null,raw_description:'pomeriggio ore 15 presso emerald',source_quantity:0,source_unit:'',quantity_base:0,net_unit_price:0,gross_unit_price:0,net_total:0,gross_total:0,vat_rate:0,is_free:0,affects_stock:0,notes:'Nota logistica da XML FatturaPA; nessun impatto sul magazzino',source_net_unit_price:0});
 }

 // 5) Global integrity validation: one movement per stock line/consumption line, no broken references or duplicate IDs.
 const uniqueIds=(name,list)=>{const ids=list.map(x=>Number(x.id));if(new Set(ids).size!==ids.length)throw new Error('Riparazione definitiva: ID duplicati in '+name)};
 for(const k of ['products','product_aliases','events','areas','consumption_lines','invoices','invoice_lines','movements'])uniqueIds(k,w[k]);
 const pids=new Set(w.products.map(x=>Number(x.id))),eids=new Set(w.events.map(x=>Number(x.id))),aids=new Set(w.areas.map(x=>Number(x.id))),iids=new Set(w.invoices.map(x=>Number(x.id)));
 for(const l of w.invoice_lines){if(!iids.has(Number(l.invoice_id)))throw new Error('Riparazione definitiva: invoice_line orfana '+l.id);if(l.product_id!=null&&!pids.has(Number(l.product_id)))throw new Error('Riparazione definitiva: prodotto mancante in invoice_line '+l.id)}
 for(const l of w.consumption_lines){if(!eids.has(Number(l.event_id))||!aids.has(Number(l.area_id))||!pids.has(Number(l.product_id)))throw new Error('Riparazione definitiva: consumo con riferimento invalido '+l.id)}
 const invoiceLineIds=new Set(w.invoice_lines.map(x=>Number(x.id))),consLineIds=new Set(w.consumption_lines.map(x=>Number(x.id)));
 for(const m of w.movements){if(!pids.has(Number(m.product_id)))throw new Error('Riparazione definitiva: movimento con prodotto invalido '+m.id);if(m.source_type==='invoice_line'&&!invoiceLineIds.has(Number(m.source_id)))throw new Error('Riparazione definitiva: movimento acquisto orfano '+m.id);if(m.source_type==='consumption_line'&&!consLineIds.has(Number(m.source_id)))throw new Error('Riparazione definitiva: movimento consumo orfano '+m.id)}
 for(const l of w.invoice_lines){if(!l.product_id||!Number(l.quantity_base||0)||Number(l.affects_stock||0)!==1)continue;const ms=w.movements.filter(m=>m.source_type==='invoice_line'&&Number(m.source_id)===Number(l.id));if(ms.length!==1||Number(ms[0].product_id)!==Number(l.product_id)||Number(ms[0].quantity_delta)!==Number(l.quantity_base))throw new Error('Riparazione definitiva: carico fattura incoerente riga '+l.id)}
 for(const l of w.consumption_lines){const ms=w.movements.filter(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(l.id));if(ms.length!==1||Number(ms[0].product_id)!==Number(l.product_id)||Number(ms[0].area_id)!==Number(l.area_id)||Number(ms[0].quantity_delta)!==-Number(l.quantity_base))throw new Error('Riparazione definitiva: consumo incoerente riga '+l.id)}
 const eventStats=e=>{const ls=w.consumption_lines.filter(l=>Number(l.event_id)===Number(e.id));return{lines:ls.length,units:ls.reduce((a,l)=>a+Number(l.quantity_base||0),0)}};
 const checkStats=(e,lines,units)=>{const x=eventStats(e);if(x.lines!==lines||x.units!==units)throw new Error(`Riparazione definitiva: ${e.name} atteso ${lines}/${units}, trovato ${x.lines}/${x.units}`)};
 checkStats(pride,11,58);checkStats(festuniBF,13,63);checkStats(nuccia,12,44);checkStats(fxxl,40,368);checkStats(aug14,47,551);

 const stock={};for(const m of w.movements)stock[m.product_id]=(stock[m.product_id]||0)+Number(m.quantity_delta||0);
 const stockOf=name=>{const p=mustProduct(name);return Number(stock[p.id]||0)};
 const auditStock={
   tanqueray_1l:stockOf('Gin Tanqueray 1 L'),smirnoff_1l:stockOf('Vodka Smirnoff Red 1 L'),vermouth_1l:stockOf('Vermouth rosso 1 L'),bitter_1l:stockOf('Bitter Martini 1 L'),
   aperol_1l:stockOf('Aperol 1 L'),triple_sec_1l:stockOf('Triple Sec 1 L'),rum_bianco_captain_morgan_1l:stockOf('Rum bianco 1 L'),rum_kingston_wray_1l:stockOf('Rum Kingston Wray Silver 1 L'),rum_scuro_1l:stockOf('Rum scuro'),
   tanqueray_ten_70cl:stockOf('Gin Tanqueray Ten 70 cl'),four_roses_1l:stockOf('Whisky Four Roses 1 L'),bulleit_1l:stockOf('Bulleit'),prosecco:stockOf('Prosecco Serena'),cannucce_conf:stockOf('Cannucce 7×21 – confezione 1.000'),
   coca_old_format:stockOf('Coca-Cola'),coca_1_5l:stockOf('Coca-Cola 1.5 L')
 };
 const expected={tanqueray_1l:77,smirnoff_1l:25,vermouth_1l:20,bitter_1l:31,aperol_1l:11,triple_sec_1l:13,rum_bianco_captain_morgan_1l:14,rum_kingston_wray_1l:2,rum_scuro_1l:2,tanqueray_ten_70cl:10,four_roses_1l:5,bulleit_1l:0,prosecco:20,cannucce_conf:7,coca_old_format:-1,coca_1_5l:13};
 const stockDiff={};for(const k of Object.keys(expected))if(Number(auditStock[k])!==Number(expected[k]))stockDiff[k]={expected:expected[k],actual:auditStock[k]};

 w.audit_logs.push({id:next(w.audit_logs),action:'riparazione definitiva magazzino 18/08/2026',entity_type:'warehouse',entity_id:null,details:`Corretto bug di collisione dei codici prodotto: ricostruiti integralmente Pride (11 righe/58 unità), Festuni Baile Funk (13/63), Nuccia Sole (12/44), Festuni XXL (40/368) e 14/08 (47/551). Ripristinati 4 consumi persi: Aperol 3, Rum scuro 3, Rum bianco 1+1. Unificati ${mergedProducts} SKU OCR duplicati della VENTI 62381. Separato Kingston Wray Silver dal Captain Morgan White. Verificata integrità 1:1 fra righe e movimenti. La fattura ALESCIO 34785/Q resta parziale perché manca il foglio 2/2. La ripartizione per formato Coca-Cola del 05/08 resta non determinabile dalla scheda consumo generica; stock aggregato bottiglie Coca-Cola invariato.`,created_at:now});
 w.meta[marker]={applied_at:now,transactional:true,merged_ocr_products:mergedProducts,kingston_split_quantity:kingstonLineIds.reduce((a,id)=>a+Number(w.invoice_lines.find(l=>Number(l.id)===id)?.quantity_base||0),0),rebuilt_events:{pride:{lines:11,units:58},festuni_baile_funk:{lines:13,units:63},nuccia_sole:{lines:12,units:44},festuni_xxl:{lines:40,units:368},aug14:{lines:47,units:551}},restored_missing_consumptions:[{product:'Aperol 1 L',quantity:3,event:'Nuccia Sole'},{product:'Rum scuro',quantity:3,event:'Festuni XXL Bar 1'},{product:'Rum bianco 1 L',quantity:1,event:'Festuni XXL Bar 2'},{product:'Rum bianco 1 L',quantity:1,event:'14/08 Bar 1'}],structural_integrity:'OK',audited_stock:auditStock,audited_stock_expected:expected,audited_stock_differences:stockDiff,unresolved:{alescio_34785_q_page2_missing:true,coca_0508_format_allocation:'6 bottiglie consumate come Coca-Cola generica; stock aggregato tra vecchio formato e 1.5 L corretto, ripartizione per formato non provabile dalle fonti'}};

 for(const k of Object.keys(w))state[k]=w[k];
 return true;
};
})();
