(function(){
'use strict';

window.applyInvoice70702=function(state){
 const marker='invoice_unigroup_70702_20260805_v1';
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
 const findByAliases=aliases=>{for(const alias of aliases){const n=clean(alias),p=state.products.find(x=>clean(x.name)===n);if(p)return p}for(const alias of aliases){const tokens=clean(alias).split(' ').filter(x=>x.length>2),p=state.products.find(x=>{const n=clean(x.name);return tokens.every(t=>n.includes(t))});if(p)return p}return null};
 const ensureProduct=(aliases,spec)=>{let p=findByAliases(aliases);if(!p){p={id:next(state.products),name:spec.name,brand:spec.brand||'',category:spec.category||'Altri prodotti',subcategory:spec.subcategory||'',format:spec.format||'',base_unit:spec.base_unit||'bottiglia',units_per_case:Number(spec.units_per_case||1),min_stock:Number(spec.min_stock||0),active:1,created_at:now};state.products.push(p)}for(const alias of aliases){if(!state.product_aliases.some(a=>Number(a.product_id)===Number(p.id)&&clean(a.alias)===clean(alias)))state.product_aliases.push({id:next(state.product_aliases),product_id:p.id,alias,supplier_id:null})}return p};
 let sup=state.suppliers.find(s=>String(s.vat_number||'')==='01433500897'||clean(s.name)==='UNIGROUP S P A');
 if(!sup){sup={id:next(state.suppliers),name:'UNIGROUP S.P.A.',vat_number:'01433500897',created_at:now};state.suppliers.push(sup)}
 const date='2026-08-05',number='70702/FAC';
 let inv=state.invoices.find(i=>Number(i.supplier_id)===Number(sup.id)&&clean(i.invoice_number)===clean(number)&&String(i.invoice_date)===date);
 if(!inv){inv={id:next(state.invoices),supplier_id:sup.id,invoice_number:number,invoice_date:date,total_gross:2811.69,document_paths:JSON.stringify([]),source_type:'XML',status:'confermato',notes:'Fattura UNIGROUP 70702/FAC del 05/08/2026 riconciliata da XML FatturaPA. Carico completo ricostruito per correggere la giacenza cloud.',created_at:now};state.invoices.push(inv)}
 else{inv.total_gross=2811.69;inv.source_type='XML';inv.status='confermato';inv.notes='Fattura UNIGROUP 70702/FAC del 05/08/2026 riconciliata da XML FatturaPA. Carico completo ricostruito per correggere la giacenza cloud.'}

 // Se esisteva una copia parziale o errata, elimina solo le sue righe e i movimenti collegati e ricostruisce la fattura corretta.
 const oldLineIds=new Set(state.invoice_lines.filter(l=>Number(l.invoice_id)===Number(inv.id)).map(l=>Number(l.id)));
 state.movements=state.movements.filter(m=>!(m.source_type==='invoice_line'&&oldLineIds.has(Number(m.source_id))));
 state.invoice_lines=state.invoice_lines.filter(l=>Number(l.invoice_id)!==Number(inv.id));

 const P={
  tanq0:ensureProduct(['Gin Tanqueray 0.0 70 cl','GIN TANQUERAY ALCOOL FREE CL 70'],{name:'Gin Tanqueray 0.0 70 cl',brand:'Tanqueray',category:'Gin',subcategory:'Analcolico',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:1}),
  tanq:ensureProduct(['Gin Tanqueray 1 L','GIN TANQUERAY LT 1'],{name:'Gin Tanqueray 1 L',brand:'Tanqueray',category:'Gin',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:6}),
  moet:ensureProduct(['Moët Réserve Impériale','CHAMPAGNE MOET&CH. RESERVE IMPERIALEX6'],{name:'Moët Réserve Impériale',brand:'Moët & Chandon',category:'Champagne',format:'75 cl',base_unit:'bottiglia',units_per_case:6,min_stock:2}),
  tanq10:ensureProduct(['Gin Tanqueray Ten 70 cl','GIN TANQUERAY TEN CL 70'],{name:'Gin Tanqueray Ten 70 cl',brand:'Tanqueray',category:'Gin',format:'70 cl',base_unit:'bottiglia',units_per_case:6,min_stock:6}),
  coca:ensureProduct(['Coca-Cola 1.5 L','Coca-Cola 1,5 L','COCA COLA LT 1.5X6'],{name:'Coca-Cola 1.5 L',brand:'Coca-Cola',category:'Coca-Cola',format:'1.5 L',base_unit:'bottiglia',units_per_case:6,min_stock:0}),
  prosecco:ensureProduct(['Prosecco Serena',"SPUMANTE SERENA EX.DRY G.CUVEE'2024"],{name:'Prosecco Serena',brand:'Serena',category:'Prosecco',format:'75 cl',base_unit:'bottiglia',units_per_case:6,min_stock:6}),
  smirnoff:ensureProduct(['Vodka Smirnoff Red 1 L','VODKA SMIRNOFF RED LT 1'],{name:'Vodka Smirnoff Red 1 L',brand:'Smirnoff',category:'Vodka',format:'1 L',base_unit:'bottiglia',units_per_case:6,min_stock:6})
 };
 const rows=[
  [P.tanq0,'GIN TANQUERAY ALCOOL FREE CL 70',2,'PZ',15.50],
  [P.tanq,'GIN TANQUERAY LT 1',36,'PZ',17.30],
  [P.moet,'CHAMPAGNE MOET&CH. RESERVE IMPERIALEX6',4,'PZ',45.00],
  [P.tanq10,'GIN TANQUERAY TEN CL 70',54,'PZ',22.90],
  [P.coca,'COCA COLA LT 1.5X6',12,'PZ',1.95],
  [P.prosecco,"SPUMANTE SERENA EX.DRY G.CUVEE'2024",12,'PZ',3.00],
  [P.smirnoff,'VODKA SMIRNOFF RED LT 1',18,'PZ',9.70]
 ];
 let stockUnits=0;
 for(const [p,desc,qty,unit,net] of rows){
  const lid=next(state.invoice_lines),grossUnit=net*1.22,grossTotal=qty*grossUnit;
  state.invoice_lines.push({id:lid,invoice_id:inv.id,product_id:p.id,raw_description:desc,source_quantity:qty,source_unit:unit,quantity_base:qty,net_unit_price:net,gross_unit_price:grossUnit,net_total:qty*net,gross_total:grossTotal,vat_rate:22,is_free:0,affects_stock:1,notes:'Carico ricostruito da fattura 70702/FAC',source_net_unit_price:net});
  state.movements.push({id:next(state.movements),movement_date:date,movement_type:'acquisto',product_id:p.id,quantity_delta:qty,unit_cost:grossUnit,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:'Carico da fattura UNIGROUP 70702/FAC',created_at:now});
  stockUnits+=qty;
 }
 const expId=next(state.invoice_lines);
 state.invoice_lines.push({id:expId,invoice_id:inv.id,product_id:null,raw_description:'SPESE ACCESSORIE',source_quantity:0,source_unit:'',quantity_base:0,net_unit_price:0,gross_unit_price:0,net_total:0.26,gross_total:0.3172,vat_rate:22,is_free:0,affects_stock:0,notes:'Voce non inventariabile',source_net_unit_price:0.26});
 state.audit_logs.push({id:next(state.audit_logs),action:'riconciliazione fattura UNIGROUP 70702/FAC',entity_type:'invoice',entity_id:inv.id,details:'Ripristinato il carico del 05/08/2026: incluse 54 bottiglie di Gin Tanqueray Ten 70 cl e tutte le altre righe della fattura. Correzione necessaria perché la fattura mancava nel cloud.',created_at:now});
 state.meta[marker]={applied_at:now,invoice_id:inv.id,invoice_number:number,invoice_date:date,total_gross:2811.69,stock_units:stockUnits,tanqueray_ten_added:54,warehouse_updated:true};
 return true;
};
})();
