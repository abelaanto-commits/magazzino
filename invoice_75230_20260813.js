(function(){
'use strict';

window.applyInvoice75230=function(state){
 const marker='invoice_unigroup_75230_20260813_v2';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 state.suppliers=Array.isArray(state.suppliers)?state.suppliers:[];
 state.products=Array.isArray(state.products)?state.products:[];
 state.product_aliases=Array.isArray(state.product_aliases)?state.product_aliases:[];
 state.invoices=Array.isArray(state.invoices)?state.invoices:[];
 state.invoice_lines=Array.isArray(state.invoice_lines)?state.invoice_lines:[];
 state.movements=Array.isArray(state.movements)?state.movements:[];
 state.audit_logs=Array.isArray(state.audit_logs)?state.audit_logs:[];
 const now=new Date().toISOString();
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const next=list=>Array.isArray(list)&&list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const findByAliases=aliases=>{for(const alias of aliases){const n=clean(alias);const exact=state.products.find(p=>clean(p.name)===n);if(exact)return exact}for(const alias of aliases){const tokens=clean(alias).split(' ').filter(x=>x.length>2);const fuzzy=state.products.find(p=>{const n=clean(p.name);return tokens.every(t=>n.includes(t))});if(fuzzy)return fuzzy}return null};
 const ensureProduct=(aliases,spec)=>{let p=findByAliases(aliases);if(!p){p={id:next(state.products),name:spec.name,brand:spec.brand||'',category:spec.category||'Altri prodotti',subcategory:spec.subcategory||'',format:spec.format||'',base_unit:spec.base_unit||'bottiglia',units_per_case:Number(spec.units_per_case||1),min_stock:Number(spec.min_stock||0),active:1,created_at:now};state.products.push(p)}for(const alias of aliases){if(!state.product_aliases.some(a=>Number(a.product_id)===Number(p.id)&&clean(a.alias)===clean(alias)))state.product_aliases.push({id:next(state.product_aliases),product_id:p.id,alias,supplier_id:null})}return p};
 let sup=state.suppliers.find(s=>clean(s.name)==='UNIGROUP S P A'||String(s.vat_number||'')==='01433500897');
 if(!sup){sup={id:next(state.suppliers),name:'UNIGROUP S.P.A.',vat_number:'01433500897',created_at:now};state.suppliers.push(sup)}
 const date='2026-08-13',number='75230';
 let inv=state.invoices.find(i=>Number(i.supplier_id)===Number(sup.id)&&clean(i.invoice_number)===clean(number)&&String(i.invoice_date)===date);
 if(!inv){inv={id:next(state.invoices),supplier_id:sup.id,invoice_number:number,invoice_date:date,total_gross:3999.48,document_paths:JSON.stringify([]),source_type:'FOTO',status:'confermato',notes:'Fattura accompagnatoria UNIGROUP 13/08/2026. Totale documento originale 4.222,98 EUR; valore effettivamente ricevuto e caricato 3.999,48 EUR. Gin Tanqueray Ten 70 cl, 8 pz, riga con asterisco: merce respinta/non arrivata e quindi esclusa dal carico di magazzino.',created_at:now};state.invoices.push(inv)}
 else{inv.total_gross=3999.48;inv.source_type=inv.source_type||'FOTO';inv.status='confermato';inv.notes='Fattura accompagnatoria UNIGROUP 13/08/2026. Totale documento originale 4.222,98 EUR; valore effettivamente ricevuto e caricato 3.999,48 EUR. Gin Tanqueray Ten 70 cl, 8 pz, riga con asterisco: merce respinta/non arrivata e quindi esclusa dal carico di magazzino.'}

 // Riconcilia un'eventuale importazione precedente della stessa fattura: elimina righe/movimenti e ricostruisce solo la merce effettivamente ricevuta.
 const oldLineIds=new Set(state.invoice_lines.filter(l=>Number(l.invoice_id)===Number(inv.id)).map(l=>Number(l.id)));
 state.movements=state.movements.filter(m=>!(m.source_type==='invoice_line'&&oldLineIds.has(Number(m.source_id))));
 state.invoice_lines=state.invoice_lines.filter(l=>Number(l.invoice_id)!==Number(inv.id));

 const P={
  bitter:ensureProduct(['Bitter Martini 1 L','APERITIVO BITTER MARTINI LT 1'],{name:'Bitter Martini 1 L',brand:'Martini',category:'Aperitivi',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:2}),
  smirnoff:ensureProduct(['Vodka Smirnoff Red 1 L','SMIRNOFF RED LT 1'],{name:'Vodka Smirnoff Red 1 L',brand:'Smirnoff',category:'Vodka',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:6}),
  vermouth:ensureProduct(['Vermouth rosso 1 L','Vermouth Martini Rosso 1 L','VERMOUTH MARTINI ROSSO LT 1'],{name:'Vermouth rosso 1 L',brand:'Martini',category:'Vermouth',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:2}),
  tanq:ensureProduct(['Gin Tanqueray 1 L','GIN TANQUERAY LT 1'],{name:'Gin Tanqueray 1 L',brand:'Tanqueray',category:'Gin',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:6}),
  aperol:ensureProduct(['Aperol 1 L','APERITIVO APEROL LT 1X6'],{name:'Aperol 1 L',brand:'Aperol',category:'Aperitivi',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:2}),
  rumwhite:ensureProduct(['Rum Captain Morgan White 1 L','Rum bianco 1 L','RUM CAPTAIN MORGAN WHITE LT 1'],{name:'Rum Captain Morgan White 1 L',brand:'Captain Morgan',category:'Rum',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:2}),
  jack:ensureProduct(["Whiskey Jack Daniel's 1 L","WHISKY JACK DANIEL'S LT 1"],{name:"Whiskey Jack Daniel's 1 L",brand:"Jack Daniel's",category:'Whiskey',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:1}),
  prosecco:ensureProduct(['Prosecco Serena','Spumante Serena Ex Dry G. Cuvee 2024'],{name:'Prosecco Serena',brand:'Serena',category:'Prosecco',format:'75 cl',base_unit:'bottiglia',units_per_case:6,min_stock:6}),
  triple:ensureProduct(['Triple Sec 1 L','TRIPLE SEC ORANGE LT 1 - CIEMME LIQUORI'],{name:'Triple Sec 1 L',brand:'Ciemme',category:'Liquori',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:2}),
  pesca:ensureProduct(['Vodka pesca 1 L','Vodka Keglevich Pesca 1 L','VODKA KEGLEVICH PESCA LT 1'],{name:'Vodka pesca 1 L',brand:'Keglevich',category:'Vodka',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:1}),
  cannucce:ensureProduct(['Cannucce','Cannucce long drink conf. 1000','CANNUCCE LONG DRINK X21 RITIR. PZ.1000'],{name:'Cannucce – conf. 1.000',brand:'Vari',category:'Materiale monouso',format:'1.000 pz',base_unit:'confezione',units_per_case:1,min_stock:1}),
  cups355:ensureProduct(['Bicchieri 355 cc – stecca da 30','BICCHIERI 355 CC X 30 CF TUMBLER TRASP.'],{name:'Bicchieri 355 cc – stecca da 30',brand:'Vari',category:'Materiale monouso',format:'355 cc × 30',base_unit:'stecca',units_per_case:30,min_stock:5})
 };
 const rows=[
  [P.bitter,'APERITIVO BITTER MARTINI LT 1',28,'PZ',8.50],
  [P.smirnoff,'VODKA SMIRNOFF RED LT 1',36,'PZ',9.70],
  [P.vermouth,'VERMOUTH MARTINI ROSSO LT 1',30,'PZ',7.50],
  [P.tanq,'GIN TANQUERAY LT 1',84,'PZ',17.30],
  [P.aperol,'APERITIVO APEROL LT 1X6',12,'PZ',14.30],
  [P.rumwhite,'RUM CAPTAIN MORGAN WHITE LT 1',12,'PZ',19.50],
  [P.jack,"WHISKY JACK DANIEL'S LT 1",2,'PZ',22.50],
  [P.prosecco,'SPUMANTE SERENA EX.DRY G.CUVEE 2024',30,'PZ',3.00],
  [P.triple,'TRIPLE SEC ORANGE LT 1 - CIEMME LIQUORI',12,'PZ',10.00],
  [P.pesca,'VODKA KEGLEVICH PESCA LT 1',6,'PZ',10.00],
  [P.cannucce,'CANNUCCE LONG DRINK X21 RITIR. PZ.1000',5,'CF',8.00],
  [P.cups355,'BICCHIERI 355 CC X 30 CF TUMBLER TRASP.',120,'CF',2.10]
 ];
 let stockUnits=0;
 for(const [p,desc,qty,unit,net] of rows){const lid=next(state.invoice_lines),grossUnit=net*1.22,grossTotal=qty*grossUnit;state.invoice_lines.push({id:lid,invoice_id:inv.id,product_id:p.id,raw_description:desc,source_quantity:qty,source_unit:unit,quantity_base:qty,net_unit_price:net,gross_unit_price:grossUnit,net_total:qty*net,gross_total:grossTotal,vat_rate:22,is_free:0,affects_stock:1,notes:'Merce ricevuta · carico da fattura 75230',source_net_unit_price:net});state.movements.push({id:next(state.movements),movement_date:date,movement_type:'acquisto',product_id:p.id,quantity_delta:qty,unit_cost:grossUnit,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:'Carico da fattura UNIGROUP 75230 · merce ricevuta',created_at:now});stockUnits+=qty}
 // Spesa accessoria visibile in fattura, non movimenta il magazzino.
 const expId=next(state.invoice_lines);state.invoice_lines.push({id:expId,invoice_id:inv.id,product_id:null,raw_description:'SPESE ACCESSORIE / VARIE',source_quantity:0,source_unit:'',quantity_base:0,net_unit_price:0,gross_unit_price:0,net_total:0.26,gross_total:0.3172,vat_rate:22,is_free:0,affects_stock:0,notes:'Voce non inventariabile',source_net_unit_price:0.26});
 state.audit_logs.push({id:next(state.audit_logs),action:'caricamento fattura UNIGROUP 75230',entity_type:'invoice',entity_id:inv.id,details:`Caricate 12 righe ricevute e ${stockUnits} unità/stecche/confezioni. Esclusa integralmente la riga con asterisco: Gin Tanqueray Ten 70 cl, 8 pz a 22,90 € imponibile, merce respinta/non arrivata. Totale documento originale 4.222,98 €; la riga respinta non genera carico.`,created_at:now});
 state.meta[marker]={applied_at:now,invoice_id:inv.id,invoice_number:number,invoice_date:date,stock_units:stockUnits,excluded_line:{description:'GIN TANQUERAY TEN CL 70',quantity:8,net_unit_price:22.90,reason:'merce respinta/non arrivata'},document_total_gross:3999.48,received_lines_gross:3999.4772,warehouse_updated:true};
 return true;
};
})();
