(function(){
'use strict';

window.applyInvoices20260829=function(state){
 const marker='invoices_20260829_unigroup_ag_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['suppliers','products','product_aliases','invoices','invoice_lines','movements','events','consumption_lines','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-08-29';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const ensureSupplier=(name,vat)=>{let s=work.suppliers.find(x=>String(x.vat_number||'')===vat)||work.suppliers.find(x=>norm(x.name)===norm(name));if(!s){s={id:next(work.suppliers),name,vat_number:vat,created_at:now};work.suppliers.push(s)}return s};
 const ensureAlias=(p,alias,sid)=>{if(!alias)return;if(!work.product_aliases.some(a=>Number(a.product_id)===Number(p.id)&&norm(a.alias)===norm(alias)&&Number(a.supplier_id||0)===Number(sid||0)))work.product_aliases.push({id:next(work.product_aliases),product_id:p.id,alias,supplier_id:sid||null})};
 const ensureProduct=(aliases,spec,sid)=>{let p=null;for(const a of aliases){p=work.products.find(x=>norm(x.name)===norm(a));if(p)break}if(!p){p={id:next(work.products),name:spec.name,brand:spec.brand||'',category:spec.category||'Altri prodotti',subcategory:spec.subcategory||'',format:spec.format||'',base_unit:spec.base_unit||'bottiglia',units_per_case:Number(spec.units_per_case||1),min_stock:Number(spec.min_stock||0),active:1,created_at:now};work.products.push(p)}for(const a of aliases)ensureAlias(p,a,sid);return p};
 const removeInvoiceLines=iid=>{const ids=new Set(work.invoice_lines.filter(l=>Number(l.invoice_id)===Number(iid)).map(l=>Number(l.id)));work.movements=work.movements.filter(m=>!(m.source_type==='invoice_line'&&ids.has(Number(m.source_id))));work.invoice_lines=work.invoice_lines.filter(l=>Number(l.invoice_id)!==Number(iid));};
 const ensureInvoice=(supplier,number,total,notes)=>{let inv=work.invoices.find(i=>Number(i.supplier_id)===Number(supplier.id)&&String(i.invoice_date)===date&&(norm(i.invoice_number)===norm(number)||norm(i.invoice_number).includes(norm(number))));if(!inv){inv={id:next(work.invoices),supplier_id:supplier.id,invoice_number:number,invoice_date:date,total_gross:total,document_paths:JSON.stringify([]),source_type:'FOTO',status:'confermato',notes,created_at:now};work.invoices.push(inv)}else{removeInvoiceLines(inv.id);Object.assign(inv,{invoice_number:number,invoice_date:date,total_gross:total,source_type:'FOTO',status:'confermato',notes})}return inv};
 const addPaid=(inv,p,desc,qty,sourceNet,netAfterDiscount,notes='')=>{const lid=next(work.invoice_lines),net=Number(netAfterDiscount??sourceNet),gross=net*1.22;work.invoice_lines.push({id:lid,invoice_id:inv.id,product_id:p.id,raw_description:desc,source_quantity:qty,source_unit:'PZ',quantity_base:qty,net_unit_price:net,gross_unit_price:gross,net_total:qty*net,gross_total:qty*gross,vat_rate:22,is_free:0,affects_stock:1,notes,source_net_unit_price:sourceNet});work.movements.push({id:next(work.movements),movement_date:date,movement_type:'acquisto',product_id:p.id,quantity_delta:qty,unit_cost:gross,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:`Carico da fattura ${inv.invoice_number} del 29/08/2026`,created_at:now});return lid};
 const addFree=(inv,p,desc,qty,sourceNet,notes='Omaggio')=>{const lid=next(work.invoice_lines);work.invoice_lines.push({id:lid,invoice_id:inv.id,product_id:p.id,raw_description:desc,source_quantity:qty,source_unit:'PZ',quantity_base:qty,net_unit_price:0,gross_unit_price:0,net_total:0,gross_total:0,vat_rate:22,is_free:1,affects_stock:1,notes,source_net_unit_price:sourceNet});work.movements.push({id:next(work.movements),movement_date:date,movement_type:'omaggio',product_id:p.id,quantity_delta:qty,unit_cost:0,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:`Omaggio da fattura ${inv.invoice_number} del 29/08/2026`,created_at:now});return lid};
 const addExpense=(inv,desc,net,gross,vat=22,notes='Voce non inventariabile')=>work.invoice_lines.push({id:next(work.invoice_lines),invoice_id:inv.id,product_id:null,raw_description:desc,source_quantity:0,source_unit:'',quantity_base:0,net_unit_price:0,gross_unit_price:0,net_total:net,gross_total:gross,vat_rate:vat,is_free:0,affects_stock:0,notes,source_net_unit_price:0});
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};

 const uni=ensureSupplier('UNIGROUP S.P.A.','01433500897');
 const ag=ensureSupplier('ALESCIO DISTRIBUZIONE S.R.L.','01499930889');
 const P={
  tanq0:ensureProduct(['Gin Tanqueray 0.0 70 cl','GIN TANQUERAY ALCOOL FREE CL 70'],{name:'Gin Tanqueray 0.0 70 cl',brand:'Tanqueray',category:'Gin',subcategory:'Analcolico',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:1},uni.id),
  tanq:ensureProduct(['Gin Tanqueray 1 L','GIN TANQUERAY LT 1'],{name:'Gin Tanqueray 1 L',brand:'Tanqueray',category:'Gin',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:6},uni.id),
  moet:ensureProduct(['Moët Réserve Impériale','CHAMPAGNE MOET&CH. RESERVE IMPERIALEX6'],{name:'Moët Réserve Impériale',brand:'Moët & Chandon',category:'Champagne',format:'75 cl',base_unit:'bottiglia',units_per_case:6,min_stock:2},uni.id),
  ten:ensureProduct(['Gin Tanqueray Ten 70 cl','GIN TANQUERAY TEN CL 70'],{name:'Gin Tanqueray Ten 70 cl',brand:'Tanqueray',category:'Gin',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:6},uni.id),
  grey15:ensureProduct(['Grey Goose 1.5 L','Vodka Grey Goose 1.5 L','VODKA GREY GOOSE LT 1.5X6'],{name:'Grey Goose 1.5 L',brand:'Grey Goose',category:'Vodka',format:'1.5 L',base_unit:'bottiglia',units_per_case:6,min_stock:0},uni.id),
  redbull:ensureProduct(['Red Bull 25 cl','RED BULL LATTINA CL 25 X 24 PZ'],{name:'Red Bull 25 cl',brand:'Red Bull',category:'Energy drink',format:'25 cl',base_unit:'lattina',units_per_case:24,min_stock:0},uni.id),
  ciroc:ensureProduct(['Vodka Ciroc 70 cl','VODKA CIROC CL 70'],{name:'Vodka Ciroc 70 cl',brand:'Ciroc',category:'Vodka',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:6},uni.id),
  patron:ensureProduct(['Tequila Patron Silver 70 cl','TEQUILA PATRON SILVER CL 70'],{name:'Tequila Patron Silver 70 cl',brand:'Patrón',category:'Tequila',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:0},uni.id),
  waterN:ensureProduct(['Acqua Tepelene naturale 50 cl','ACQUA TEPELENE NATUR.CL.50 (12)PET'],{name:'Acqua Tepelene naturale 50 cl',brand:'Tepelene',category:'Acqua',format:'50 cl',base_unit:'bottiglia',units_per_case:12,min_stock:48},ag.id),
  waterF:ensureProduct(['Acqua Tepelene frizzante 50 cl','ACQUA TEPELENE FRIZZ.CL.50 (12)PET'],{name:'Acqua Tepelene frizzante 50 cl',brand:'Tepelene',category:'Acqua',format:'50 cl',base_unit:'bottiglia',units_per_case:12,min_stock:24},ag.id),
  lemon:ensureProduct(['Lemon','KINLEY BITTER LEMON PET 90 (6)','FANTA LEMON CL.90 (6) PET'],{name:'Lemon',brand:'Vari',category:'Lemon',format:'Vari',base_unit:'bottiglia',units_per_case:6,min_stock:24},ag.id),
  belv70:ensureProduct(['Vodka Belvedere 70 cl','VODKA BELVEDERE CL.70 40° (6)'],{name:'Vodka Belvedere 70 cl',brand:'Belvedere',category:'Vodka',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:0},ag.id),
  coca2:ensureProduct(['Coca-Cola 2 L','COCA COLA PET LT.2 (6)'],{name:'Coca-Cola 2 L',brand:'Coca-Cola',category:'Coca-Cola',format:'2 L',base_unit:'bottiglia',units_per_case:6,min_stock:0},ag.id)
 };

 // Rimuove la valorizzazione provvisoria usata prima di ricevere le fatture reali, senza cancellare il marker che ne impedisce la riapplicazione.
 const provisional=work.invoices.filter(i=>norm(i.invoice_number)==='VAL 20260829 PREMIUM'||String(i.source_type||'')==='manual_cost_basis');
 for(const inv of provisional){removeInvoiceLines(inv.id)}
 const provisionalIds=new Set(provisional.map(i=>Number(i.id)));
 if(provisionalIds.size)work.invoices=work.invoices.filter(i=>!provisionalIds.has(Number(i.id)));

 const invU=ensureInvoice(uni,'83417',2228.53,'Fattura accompagnatoria UNIGROUP del 29/08/2026, documento 83417. Totale documento 2.228,53 €. Prezzi di riga imponibili, IVA 22%.');
 addPaid(invU,P.tanq0,'GIN TANQUERAY ALCOOL FREE CL 70',6,15.50,15.50);
 addPaid(invU,P.tanq,'GIN TANQUERAY LT 1',6,17.30,17.30);
 addPaid(invU,P.moet,'CHAMPAGNE MOET&CH. RESERVE IMPERIALEX6',4,45.00,45.00);
 addPaid(invU,P.ten,'GIN TANQUERAY TEN CL 70',42,22.90,22.90);
 addPaid(invU,P.grey15,'VODKA GREY GOOSE LT 1.5X6',1,110.00,99.00,'Sconto 10%: prezzo imponibile effettivo 99,00 €; costo IVA inclusa 120,78 €.');
 addPaid(invU,P.redbull,'RED BULL LATTINA CL 25 X 24 PZ',72,1.40,1.40,'Lotto 2567882');
 addPaid(invU,P.ciroc,'VODKA CIROC CL 70',9,26.90,26.90);
 addPaid(invU,P.patron,'TEQUILA PATRON SILVER CL 70',1,51.00,45.90,'Sconto 10%: prezzo imponibile effettivo 45,90 €.');
 addExpense(invU,'SPESE ACCESSORIE / VARIE',0.26,0.3172,22,'Differenza documentale tra imponibile 1.826,66 € e merce netta 1.826,40 €.');

 const invA=ensureInvoice(ag,'37799/Q',429.73,'Fattura accompagnatoria ALESCIO/AG del 29/08/2026, documento 37799/Q /2026, pagine 1/2 e 2/2. Totale documento 429,73 €. Comprende omaggi soggetti a IVA.');
 addPaid(invA,P.waterN,'ACQUA TEPELENE NATUR.CL.50 (12)PET',360,0.197,0.197);
 addFree(invA,P.waterF,'ACQUA TEPELENE FRIZZ.CL.50 (12)PET',36,0.197,'Omaggio: 36 bottiglie. Valore imponibile omaggio 7,09 € ai soli fini IVA.');
 addPaid(invA,P.lemon,'KINLEY BITTER LEMON PET 90 (6)',30,0.894,0.894,'Mappato alla referenza unificata Lemon.');
 addPaid(invA,P.lemon,'FANTA LEMON CL.90 (6) PET',90,0.730,0.730,'Mappato alla referenza unificata Lemon.');
 addFree(invA,P.lemon,'FANTA LEMON CL.90 (6) PET',30,0.730,'Omaggio: 30 bottiglie. Mappato alla referenza unificata Lemon; valore imponibile omaggio 21,90 € ai soli fini IVA.');
 addPaid(invA,P.belv70,'VODKA BELVEDERE CL.70 40° (6)',6,26.420,26.420,'Formato documentale 70 cl; costo IVA inclusa 32,2324 € per bottiglia.');
 addPaid(invA,P.coca2,'COCA COLA PET LT.2 (6)',12,1.533,1.533);
 addExpense(invA,'CONTRIBUTO TRASPORTO',6.15,7.503,22,'Voce non inventariabile.');
 addExpense(invA,'CONTRIBUTO MERCE',0.50,0.61,22,'Voce non inventariabile indicata a riepilogo documento.');
 addExpense(invA,'IVA SU OMAGGI',0,6.3778,0,'IVA 22% sul valore imponibile degli omaggi: 28,99 € × 22% = 6,3778 €. Nessun costo medio attribuito agli omaggi.');

 // Riconcilia le due referenze premium consumate a SHIVA con i formati e i costi reali di fattura.
 const shiva=work.events.find(e=>String(e.event_date)===date&&norm(e.name)==='SHIVA');
 let shivaGreyQty=0,shivaBelvQty=0;
 if(shiva){
  const lines=work.consumption_lines.filter(l=>Number(l.event_id)===Number(shiva.id)&&String(l.notes||'').includes('SHIVA-20260829'));
  const greyCost=avg(P.grey15.id),belvCost=avg(P.belv70.id);
  for(const l of lines){
   const oldP=work.products.find(p=>Number(p.id)===Number(l.product_id));
   if(oldP&&norm(oldP.name).includes('GREY GOOSE')&&norm(oldP.name).includes('1 5')){shivaGreyQty+=Number(l.quantity_base||0);l.product_id=P.grey15.id;l.unit=P.grey15.base_unit;l.cost_unit=greyCost;l.cost_total=Number(l.quantity_base||0)*greyCost;const m=work.movements.find(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(l.id));if(m){m.product_id=P.grey15.id;m.unit_cost=greyCost}}
   if(oldP&&(norm(oldP.name).includes('BELVEDERE'))){shivaBelvQty+=Number(l.quantity_base||0);l.product_id=P.belv70.id;l.unit=P.belv70.base_unit;l.cost_unit=belvCost;l.cost_total=Number(l.quantity_base||0)*belvCost;const m=work.movements.find(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(l.id));if(m){m.product_id=P.belv70.id;m.unit_cost=belvCost}}
  }
  if(shivaGreyQty!==1||shivaBelvQty!==6)throw new Error(`Fatture 29/08: riconciliazione SHIVA premium inattesa. Grey=${shivaGreyQty}, Belvedere=${shivaBelvQty}; attese 1 e 6.`);
 }

 // Elimina soltanto la vecchia referenza provvisoria Belvedere 75 cl se, dopo la riconciliazione, non è più referenziata.
 const oldBelv75=work.products.filter(p=>norm(p.name)==='BELVEDERE 75 CL'||norm(p.name)==='VODKA BELVEDERE 75 CL');
 for(const p of oldBelv75){const used=work.invoice_lines.some(l=>Number(l.product_id)===Number(p.id))||work.consumption_lines.some(l=>Number(l.product_id)===Number(p.id))||work.movements.some(m=>Number(m.product_id)===Number(p.id));if(!used){work.product_aliases=work.product_aliases.filter(a=>Number(a.product_id)!==Number(p.id));work.products=work.products.filter(x=>Number(x.id)!==Number(p.id))}}

 if(work.meta['premium_formats_valuation_20260829_v1']){work.meta['premium_formats_valuation_20260829_v1'].superseded_at=now;work.meta['premium_formats_valuation_20260829_v1'].superseded_by='fatture reali 29/08/2026 UNIGROUP 83417 + AG 37799/Q';work.meta['premium_formats_valuation_20260829_v1'].manual_values_no_longer_used=true}
 const shivaCost=shiva?work.consumption_lines.filter(l=>Number(l.event_id)===Number(shiva.id)).reduce((s,l)=>s+Number(l.cost_total||0),0):null;
 const stockUnitsU=141,stockUnitsA=564;
 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento fatture nuove 29/08/2026',entity_type:'invoice',entity_id:invU.id,details:`UNIGROUP 83417 €2.228,53 + AG 37799/Q €429,73. Caricate ${stockUnitsU+stockUnitsA} unità inventariali complessive incluse 66 unità omaggio AG. Grey Goose 1.5 L valorizzata a €120,78 IVA inclusa. Belvedere SHIVA riconciliata al formato reale 70 cl e costo €32,2324 IVA inclusa. Valorizzazione manuale premium rimossa.${shivaCost!==null?' Costo SHIVA dopo riconciliazione premium: €'+shivaCost.toFixed(2)+'.':''}`,created_at:now});
 work.meta[marker]={applied_at:now,date,invoices:[{supplier:'UNIGROUP S.P.A.',number:'83417',invoice_id:invU.id,total_gross:2228.53},{supplier:'ALESCIO DISTRIBUZIONE S.R.L.',number:'37799/Q',invoice_id:invA.id,total_gross:429.73}],combined_total_gross:2658.26,stock_units:{unigroup:stockUnitsU,ag:stockUnitsA,total:stockUnitsU+stockUnitsA},free_units_ag:66,mappings:{kinley_bitter_lemon:'Lemon',fanta_lemon:'Lemon',belvedere:'Vodka Belvedere 70 cl',grey_goose:'Grey Goose 1.5 L'},premium_reconciled:true,shiva_cost_after_premium_reconciliation:shivaCost};
 for(const k of ['suppliers','products','product_aliases','invoices','invoice_lines','movements','consumption_lines','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
