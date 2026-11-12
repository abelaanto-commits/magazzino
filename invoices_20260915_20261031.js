(function(){
'use strict';

const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const next=list=>Array.isArray(list)&&list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
const cloneState=state=>typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
const init=w=>{for(const k of ['suppliers','products','product_aliases','invoices','invoice_lines','movements','audit_logs'])w[k]=Array.isArray(w[k])?w[k]:[];w.meta=w.meta||{};return w};
const ensureSupplier=(w,name,vat)=>{let s=w.suppliers.find(x=>String(x.vat_number||'')===vat||norm(x.name)===norm(name));if(!s){s={id:next(w.suppliers),name,vat_number:vat,created_at:new Date().toISOString()};w.suppliers.push(s)}return s};
const ensureAlias=(w,p,alias,sid=null)=>{if(!alias)return;if(!w.product_aliases.some(a=>Number(a.product_id)===Number(p.id)&&norm(a.alias)===norm(alias)&&Number(a.supplier_id||0)===Number(sid||0)))w.product_aliases.push({id:next(w.product_aliases),product_id:p.id,alias,supplier_id:sid})};
const ensureProduct=(w,aliases,spec)=>{let p=null;for(const a of aliases){p=w.products.find(x=>norm(x.name)===norm(a));if(p)break}if(!p){for(const a of aliases){const al=w.product_aliases.find(x=>norm(x.alias)===norm(a));if(al){p=w.products.find(x=>Number(x.id)===Number(al.product_id));if(p)break}}}if(!p){p={id:next(w.products),name:spec.name,brand:spec.brand||'',category:spec.category||'Altri prodotti',subcategory:spec.subcategory||'',format:spec.format||'',base_unit:spec.base_unit||'bottiglia',units_per_case:Number(spec.units_per_case||1),min_stock:Number(spec.min_stock||0),active:1,created_at:new Date().toISOString()};w.products.push(p)}for(const a of aliases)ensureAlias(w,p,a,null);return p};
const invoiceExists=(w,sid,number,date)=>w.invoices.find(i=>Number(i.supplier_id)===Number(sid)&&norm(i.invoice_number)===norm(number)&&String(i.invoice_date)===String(date))||null;
const addLine=(w,inv,p,o)=>{
 const lid=next(w.invoice_lines);
 const line={id:lid,invoice_id:inv.id,product_id:p?.id||null,raw_description:o.desc||'',source_quantity:Number(o.sourceQty||0),source_unit:o.sourceUnit||'',quantity_base:Number(o.quantityBase||0),net_unit_price:Number(o.netUnitBase||0),gross_unit_price:Number(o.grossUnitBase||0),net_total:Number(o.netTotal||0),gross_total:Number(o.grossTotal||0),vat_rate:Number(o.vatRate||0),is_free:o.isFree?1:0,affects_stock:o.affectsStock===false?0:1,notes:o.notes||'',source_net_unit_price:Number(o.sourceNetUnit||o.netUnitBase||0)};
 w.invoice_lines.push(line);
 if(line.affects_stock&&p&&line.quantity_base){
   w.movements.push({id:next(w.movements),movement_date:inv.invoice_date,movement_type:line.is_free?'omaggio':'acquisto',product_id:p.id,quantity_delta:line.quantity_base,unit_cost:line.is_free?0:line.gross_unit_price,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:o.moveNotes||('Carico da fattura '+inv.invoice_number),created_at:new Date().toISOString()});
 }
 return line;
};
const commit=(state,w)=>{for(const k of ['suppliers','products','product_aliases','invoices','invoice_lines','movements','audit_logs','meta'])state[k]=w[k]};

window.applyCreditNote3690_20260915=function(state){
 const marker='credit_note_unigroup_3690_20260915_v1';state.meta=state.meta||{};if(state.meta[marker])return false;
 const w=init(cloneState(state)),now=new Date().toISOString(),date='2026-09-15',sup=ensureSupplier(w,'UNIGROUP S.P.A.','01433500897');
 if(invoiceExists(w,sup.id,'3690/ACC',date)){w.meta[marker]={applied_at:now,already_present:true};commit(state,w);return true}
 const P={
  vermouth:ensureProduct(w,['Vermouth rosso 1 L','Vermouth Martini Rosso 1 L'],{name:'Vermouth rosso 1 L',brand:'Martini',category:'Vermouth',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  triple:ensureProduct(w,['Triple Sec 1 L'],{name:'Triple Sec 1 L',brand:'Ciemme',category:'Liquori',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  rum:ensureProduct(w,['Rum bianco 1 L','Rum Captain Morgan White 1 L'],{name:'Rum bianco 1 L',brand:'Captain Morgan',category:'Rum',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  moet:ensureProduct(w,['Moët Réserve Impériale','Champagne Moet Reserve Imperiale'],{name:'Moët Réserve Impériale',brand:'Moët & Chandon',category:'Champagne',format:'75 cl',base_unit:'bottiglia',units_per_case:6}),
  ten:ensureProduct(w,['Gin Tanqueray Ten 70 cl'],{name:'Gin Tanqueray Ten 70 cl',brand:'Tanqueray',category:'Gin',format:'70 cl',base_unit:'bottiglia',units_per_case:6}),
  bitter:ensureProduct(w,['Bitter Martini 1 L'],{name:'Bitter Martini 1 L',brand:'Martini',category:'Aperitivi',format:'1 L',base_unit:'bottiglia',units_per_case:6})
 };
 const inv={id:next(w.invoices),supplier_id:sup.id,invoice_number:'3690/ACC',invoice_date:date,total_gross:-571.52,document_paths:JSON.stringify([]),source_type:'NOTA_CREDITO',status:'confermato',notes:'Nota di credito UNIGROUP per reso merce. Non genera un secondo scarico: il reso fisico è già registrato nel gestionale in data 02/09/2026.',created_at:now};w.invoices.push(inv);
 const rows=[[P.vermouth,'VERMOUTH MARTINI ROSSO LT 1',6,7.50],[P.triple,'TRIPLE SEC ORANGE LT 1 - CIEMME LIQUORI',6,10.00],[P.rum,'RUM CAPTAIN MORGAN WHITE LT 1',6,19.50],[P.moet,'CHAMPAGNE MOET&CH. RESERVE IMPERIALE X6',3,45.00],[P.ten,'GIN TANQUERAY TEN CL 70',3,22.90],[P.bitter,'APERITIVO BITTER MARTINI LT 1',5,8.50]];
 for(const [p,desc,q,net] of rows)addLine(w,inv,p,{desc,sourceQty:q,sourceUnit:'PZ',quantityBase:-q,sourceNetUnit:net,netUnitBase:net,grossUnitBase:net*1.22,netTotal:-q*net,grossTotal:-q*net*1.22,vatRate:22,affectsStock:false,notes:'Accredito per reso già movimentato fisicamente il 02/09/2026; nessun ulteriore impatto sulla giacenza.'});
 addLine(w,inv,null,{desc:'SPESE ACCESSORIE',sourceQty:0,sourceUnit:'',quantityBase:0,sourceNetUnit:0.26,netUnitBase:0,grossUnitBase:0,netTotal:-0.26,grossTotal:-0.3172,vatRate:22,affectsStock:false,notes:'Storno accessorio'});
 w.audit_logs.push({id:next(w.audit_logs),action:'caricamento nota di credito UNIGROUP 3690/ACC',entity_type:'invoice',entity_id:inv.id,details:'Nota di credito 15/09/2026 da 571,52 €. Registrata come documento finanziario del reso già effettuato e già scaricato il 02/09/2026; nessuna seconda movimentazione di magazzino.',created_at:now});
 w.meta[marker]={applied_at:now,invoice_id:inv.id,total_gross:-571.52,warehouse_movement_created:false,reason:'physical_supplier_return_already_recorded_20260902'};commit(state,w);return true;
};

window.applyInvoice99301_20261010=function(state){
 const marker='invoice_unigroup_99301_20261010_v1';state.meta=state.meta||{};if(state.meta[marker])return false;
 const w=init(cloneState(state)),now=new Date().toISOString(),date='2026-10-10',sup=ensureSupplier(w,'UNIGROUP S.P.A.','01433500897');
 if(invoiceExists(w,sup.id,'99301/FAC',date)){w.meta[marker]={applied_at:now,already_present:true};commit(state,w);return true}
 const P={
  bitter:ensureProduct(w,['Bitter Martini 1 L'],{name:'Bitter Martini 1 L',brand:'Martini',category:'Aperitivi',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  beer:ensureProduct(w,['Birra Peroni Nastro Azzurro 33 cl'],{name:'Birra Peroni Nastro Azzurro 33 cl',brand:'Peroni',category:'Birra',format:'33 cl',base_unit:'bottiglia',units_per_case:24}),
  coca15:ensureProduct(w,['Coca-Cola 1.5 L'],{name:'Coca-Cola 1.5 L',brand:'Coca-Cola',category:'Coca-Cola',format:'1.5 L',base_unit:'bottiglia',units_per_case:6}),
  prosecco:ensureProduct(w,['Prosecco Serena'],{name:'Prosecco Serena',brand:'Serena',category:'Prosecco',format:'75 cl',base_unit:'bottiglia',units_per_case:6}),
  triple:ensureProduct(w,['Triple Sec 1 L'],{name:'Triple Sec 1 L',brand:'Ciemme',category:'Liquori',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  aperol:ensureProduct(w,['Aperol 1 L'],{name:'Aperol 1 L',brand:'Aperol',category:'Aperitivi',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  vermouth:ensureProduct(w,['Vermouth rosso 1 L'],{name:'Vermouth rosso 1 L',brand:'Martini',category:'Vermouth',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  fragola:ensureProduct(w,['Vodka fragola 1 L'],{name:'Vodka fragola 1 L',brand:'Keglevich',category:'Vodka',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  smirnoff:ensureProduct(w,['Vodka Smirnoff Red 1 L'],{name:'Vodka Smirnoff Red 1 L',brand:'Smirnoff',category:'Vodka',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  coolf:ensureProduct(w,['Acqua Cool frizzante 1 L'],{name:'Acqua Cool frizzante 1 L',brand:'Cool',category:'Acqua',format:'1 L',base_unit:'bottiglia',units_per_case:12}),
  cooln:ensureProduct(w,['Acqua Cool naturale 1 L'],{name:'Acqua Cool naturale 1 L',brand:'Cool',category:'Acqua',format:'1 L',base_unit:'bottiglia',units_per_case:12}),
  napkin:ensureProduct(w,['Tovaglioli 40x40 nero – conf. 50'],{name:'Tovaglioli 40x40 nero – conf. 50',brand:'Unito',category:'Materiale monouso',format:'40x40 cm · 50 pz',base_unit:'confezione',units_per_case:1}),
  plate:ensureProduct(w,['Piatti rettangolari neri 345x320 mm – conf. 10'],{name:'Piatti rettangolari neri 345x320 mm – conf. 10',brand:'Vari',category:'Materiale monouso',format:'345x320 mm · 10 pz',base_unit:'confezione',units_per_case:1}),
  cups250:ensureProduct(w,['Bicchieri 250 cc – stecca da 50'],{name:'Bicchieri 250 cc – stecca da 50',brand:'Vari',category:'Materiale monouso',format:'250 cc × 50',base_unit:'stecca',units_per_case:20})
 };
 const inv={id:next(w.invoices),supplier_id:sup.id,invoice_number:'99301/FAC',invoice_date:date,total_gross:393.36,document_paths:JSON.stringify([]),source_type:'XML/FOTO',status:'confermato',notes:'Fattura UNIGROUP del 10/10/2026, totale documento 393,36 €.',created_at:now};w.invoices.push(inv);
 const stock=(p,desc,sourceQty,sourceUnit,qBase,netSource,netBase)=>addLine(w,inv,p,{desc,sourceQty,sourceUnit,quantityBase:qBase,sourceNetUnit:netSource,netUnitBase:netBase,grossUnitBase:netBase*1.22,netTotal:sourceQty*netSource,grossTotal:sourceQty*netSource*1.22,vatRate:22});
 stock(P.bitter,'APERITIVO BITTER MARTINI LT 1',2,'PZ',2,8.50,8.50);
 stock(P.beer,'BIRRA PERONI NASTRO AZZURRO 33 CLX24',1,'CT',24,21.00,21/24);
 stock(P.coca15,'COCA COLA LT 1.5X6',6,'PZ',6,1.95,1.95);
 stock(P.prosecco,'SPUMANTE SERENA EX.DRY G.CUVEE 2024',12,'PZ',12,3.00,3.00);
 stock(P.triple,'TRIPLE SEC ORANGE LT 1 - CIEMME LIQUORI',1,'PZ',1,10.00,10.00);
 stock(P.aperol,'APERITIVO APEROL LT 1X6',4,'PZ',4,14.30,14.30);
 stock(P.vermouth,'VERMOUTH MARTINI ROSSO LT 1',1,'PZ',1,7.50,7.50);
 stock(P.fragola,'VODKA KEGLEVICH FRAGOLA LT 1',2,'PZ',2,10.00,10.00);
 stock(P.smirnoff,'VODKA SMIRNOFF RED LT 1',2,'PZ',2,9.70,9.70);
 stock(P.coolf,'ACQUA FRIZZANTE COOL LT 1X12',1,'CT',12,5.90,5.90/12);
 stock(P.cooln,'ACQUA NATURALE COOL LT 1X12',3,'CT',36,5.90,5.90/12);
 stock(P.napkin,'TOVAGLIOLO 40X40 UNITO LIGH.NERO 50 PZ',8,'CF',8,5.35,5.35);
 stock(P.plate,'PIATTO RETT.NERO 345X320 MM6 PZX10CF',10,'CF',10,4.70,4.70);
 stock(P.cups250,'BICCHIERI 250 CC KRISTALL PZ 50 ISAPX20',3,'CF',3,2.95,2.95);
 addLine(w,inv,null,{desc:'SPESE ACCESSORIE',sourceQty:0,sourceUnit:'',quantityBase:0,sourceNetUnit:0.38,netTotal:0.38,grossTotal:0.4636,vatRate:22,affectsStock:false});
 w.audit_logs.push({id:next(w.audit_logs),action:'caricamento fattura UNIGROUP 99301/FAC',entity_type:'invoice',entity_id:inv.id,details:'Fattura 10/10/2026: 14 righe inventariabili, 123 unità base caricate. Totale documento 393,36 € IVA inclusa.',created_at:now});
 w.meta[marker]={applied_at:now,invoice_id:inv.id,total_gross:393.36,stock_units:123};commit(state,w);return true;
};

window.applyInvoice46471_20261016=function(state){
 const marker='invoice_ag_46471_20261016_v1';state.meta=state.meta||{};if(state.meta[marker])return false;
 const w=init(cloneState(state)),now=new Date().toISOString(),date='2026-10-16',sup=ensureSupplier(w,'ALESCIO DISTRIBUZIONE SRL SIRACUSA','IT01499930889');
 if(invoiceExists(w,sup.id,'46471/Q',date)){w.meta[marker]={applied_at:now,already_present:true};commit(state,w);return true}
 const P={
  tepNat:ensureProduct(w,['Acqua Tepelene naturale 50 cl'],{name:'Acqua Tepelene naturale 50 cl',brand:'Tepelene',category:'Acqua',format:'50 cl',base_unit:'bottiglia',units_per_case:12}),
  tepFizz:ensureProduct(w,['Acqua Tepelene frizzante 50 cl'],{name:'Acqua Tepelene frizzante 50 cl',brand:'Tepelene',category:'Acqua',format:'50 cl',base_unit:'bottiglia',units_per_case:12}),
  lemon:ensureProduct(w,['Lemon'],{name:'Lemon',brand:'Vari',category:'Lemon',format:'Vari',base_unit:'bottiglia',units_per_case:6}),
  orange:ensureProduct(w,['Succo arancia'],{name:'Succo arancia',brand:'Derby',category:'Succhi',format:'1,5 L',base_unit:'bottiglia',units_per_case:6}),
  pineapple:ensureProduct(w,['Succo ananas'],{name:'Succo ananas',brand:'Derby',category:'Succhi',format:'1,5 L',base_unit:'bottiglia',units_per_case:6})
 };
 const inv={id:next(w.invoices),supplier_id:sup.id,invoice_number:'46471/Q',invoice_date:date,total_gross:236.30,document_paths:JSON.stringify([]),source_type:'XML/FOTO',status:'confermato',notes:'Fattura AG del 16/10/2026. Omaggi modellati con relativa compensazione fiscale; carico omaggi a costo zero.',created_at:now};w.invoices.push(inv);
 addLine(w,inv,P.tepNat,{desc:'ACQUA TEPELENE NATUR.CL.50 (12)PET',sourceQty:720,sourceUnit:'PZ',quantityBase:720,sourceNetUnit:0.197,netUnitBase:0.197,grossUnitBase:0.24034,netTotal:141.84,grossTotal:173.0448,vatRate:22});
 addLine(w,inv,P.tepFizz,{desc:'ACQUA TEPELENE FRIZZ.CL.50 (12) PET',sourceQty:72,sourceUnit:'PZ',quantityBase:72,sourceNetUnit:0.197,netUnitBase:0.197,grossUnitBase:0.24034,netTotal:14.184,grossTotal:17.30448,vatRate:22,isFree:true,notes:'Omaggio con rivalsa; costo magazzino zero'});
 addLine(w,inv,null,{desc:'Compensazione riga omaggio Tepelene frizzante',sourceQty:72,sourceUnit:'PZ',quantityBase:0,sourceNetUnit:-0.197,netTotal:-14.184,grossTotal:-14.184,vatRate:0,affectsStock:false,notes:'N1 · compensazione omaggio'});
 addLine(w,inv,P.lemon,{desc:'FANTA LEMON CL.90 (6) PET',sourceQty:30,sourceUnit:'PZ',quantityBase:30,sourceNetUnit:0.850,netUnitBase:0.850,grossUnitBase:1.037,netTotal:25.50,grossTotal:31.11,vatRate:22,notes:'Unificato nella referenza Lemon'});
 addLine(w,inv,P.lemon,{desc:'FANTA LEMON CL.90 (6) PET - OMAGGIO',sourceQty:6,sourceUnit:'PZ',quantityBase:6,sourceNetUnit:0.850,netUnitBase:0.850,grossUnitBase:1.037,netTotal:5.10,grossTotal:6.222,vatRate:22,isFree:true,notes:'Omaggio con rivalsa; unificato in Lemon; costo magazzino zero'});
 addLine(w,inv,null,{desc:'Compensazione riga omaggio Fanta Lemon',sourceQty:6,sourceUnit:'PZ',quantityBase:0,sourceNetUnit:-0.850,netTotal:-5.10,grossTotal:-5.10,vatRate:0,affectsStock:false,notes:'N1 · compensazione omaggio'});
 addLine(w,inv,P.orange,{desc:'DERBY ARANCIA BOTT.PET LT.1,5(6) CON TAPPO DOSATORE',sourceQty:6,sourceUnit:'PZ',quantityBase:6,sourceNetUnit:1.844,netUnitBase:1.844,grossUnitBase:2.24968,netTotal:11.064,grossTotal:13.49808,vatRate:22});
 addLine(w,inv,P.pineapple,{desc:'DERBY ANANAS BOTT.PET LT.1,5(6) CON TAPPO DOSATORE',sourceQty:6,sourceUnit:'PZ',quantityBase:6,sourceNetUnit:1.885,netUnitBase:1.885,grossUnitBase:2.2997,netTotal:11.31,grossTotal:13.7982,vatRate:22});
 addLine(w,inv,null,{desc:'Spese Varie',sourceQty:1,sourceUnit:'PZ',quantityBase:0,sourceNetUnit:0.50,netTotal:0.50,grossTotal:0.61,vatRate:22,affectsStock:false});
 w.audit_logs.push({id:next(w.audit_logs),action:'caricamento fattura AG 46471/Q',entity_type:'invoice',entity_id:inv.id,details:'Fattura 16/10/2026: 840 unità base caricate, incluse 78 unità omaggio a costo zero (72 Tepelene frizzante + 6 Fanta Lemon). Totale documento 236,30 €.',created_at:now});
 w.meta[marker]={applied_at:now,invoice_id:inv.id,total_gross:236.30,stock_units:840,free_units:78};commit(state,w);return true;
};

window.applyInvoice48867_20261030=function(state){
 const marker='invoice_ag_48867_20261030_visible_page_v1';state.meta=state.meta||{};if(state.meta[marker])return false;
 const w=init(cloneState(state)),now=new Date().toISOString(),date='2026-10-30',sup=ensureSupplier(w,'ALESCIO DISTRIBUZIONE SRL SIRACUSA','IT01499930889');
 if(invoiceExists(w,sup.id,'48867/Q',date)){w.meta[marker]={applied_at:now,already_present:true};commit(state,w);return true}
 const P={
  lemon:ensureProduct(w,['Lemon'],{name:'Lemon',brand:'Vari',category:'Lemon',format:'Vari',base_unit:'bottiglia',units_per_case:6}),
  coca15:ensureProduct(w,['Coca-Cola 1.5 L'],{name:'Coca-Cola 1.5 L',brand:'Coca-Cola',category:'Coca-Cola',format:'1.5 L',base_unit:'bottiglia',units_per_case:6}),
  zero15:ensureProduct(w,['Coca-Cola Zero 1.5 L'],{name:'Coca-Cola Zero 1.5 L',brand:'Coca-Cola',category:'Coca-Cola',format:'1.5 L Zero',base_unit:'bottiglia',units_per_case:6})
 };
 const inv={id:next(w.invoices),supplier_id:sup.id,invoice_number:'48867/Q',invoice_date:date,total_gross:252.43,document_paths:JSON.stringify([]),source_type:'FOTO',status:'parziale',notes:'Caricata la pagina 1/2 fotografata il 30/10/2026. Le righe visibili sono state movimentate; 252,43 € è il subtotale IVA inclusa ricostruito dalle sole righe visibili, non certificato come totale definitivo del documento. Da completare con pagina 2.',created_at:now};w.invoices.push(inv);
 addLine(w,inv,P.lemon,{desc:'KINLEY BITTER LEMON PET 90 (6)',sourceQty:180,sourceUnit:'PZ',quantityBase:180,sourceNetUnit:0.894,netUnitBase:0.894,grossUnitBase:1.09068,netTotal:160.92,grossTotal:196.3224,vatRate:22,notes:'Unificato nella referenza Lemon'});
 addLine(w,inv,P.lemon,{desc:'KINLEY BITTER LEMON PET 90 (6) - OMAGGIO',sourceQty:60,sourceUnit:'PZ',quantityBase:60,sourceNetUnit:0.894,netUnitBase:0.894,grossUnitBase:0,isFree:true,netTotal:0,grossTotal:0,vatRate:22,notes:'Omaggio; unificato in Lemon; costo magazzino zero'});
 addLine(w,inv,P.coca15,{desc:'COCA COLA PET LT.1,5 (6)',sourceQty:18,sourceUnit:'PZ',quantityBase:18,sourceNetUnit:1.328,netUnitBase:1.328,grossUnitBase:1.62016,netTotal:23.904,grossTotal:29.16288,vatRate:22});
 addLine(w,inv,P.zero15,{desc:'COCA COLA ZERO PET LT.1,5 (6)',sourceQty:12,sourceUnit:'PZ',quantityBase:12,sourceNetUnit:1.328,netUnitBase:1.328,grossUnitBase:1.62016,netTotal:15.936,grossTotal:19.44192,vatRate:22});
 addLine(w,inv,P.zero15,{desc:'COCA COLA S/CAFF. ZERO PET LT.1,5 (6) - OMAGGIO',sourceQty:6,sourceUnit:'PZ',quantityBase:6,sourceNetUnit:1.328,netUnitBase:1.328,grossUnitBase:0,isFree:true,netTotal:0,grossTotal:0,vatRate:22,notes:'Omaggio; costo magazzino zero'});
 addLine(w,inv,null,{desc:'CONTRIBUTO TRASPORTO',sourceQty:1,sourceUnit:'PZ',quantityBase:0,sourceNetUnit:6.15,netTotal:6.15,grossTotal:7.503,vatRate:22,affectsStock:false});
 w.audit_logs.push({id:next(w.audit_logs),action:'caricamento parziale fattura AG 48867/Q',entity_type:'invoice',entity_id:inv.id,details:'Pagina 1/2 del 30/10/2026: 276 bottiglie caricate dalle righe visibili (Lemon 240, Coca-Cola 1,5 L 18, Coca-Cola Zero 1,5 L 18). Documento lasciato parziale in attesa della pagina 2.',created_at:now});
 w.meta[marker]={applied_at:now,invoice_id:inv.id,status:'parziale',visible_stock_units:276,visible_subtotal_gross:252.43,page_2_missing:true};commit(state,w);return true;
};

window.applyInvoice106210_20261031=function(state){
 const marker='invoice_unigroup_106210_20261031_v1';state.meta=state.meta||{};if(state.meta[marker])return false;
 const w=init(cloneState(state)),now=new Date().toISOString(),date='2026-10-31',sup=ensureSupplier(w,'UNIGROUP S.P.A.','01433500897');
 if(invoiceExists(w,sup.id,'106210',date)){w.meta[marker]={applied_at:now,already_present:true};commit(state,w);return true}
 const P={
  tanq:ensureProduct(w,['Gin Tanqueray 1 L'],{name:'Gin Tanqueray 1 L',brand:'Tanqueray',category:'Gin',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  prosecco:ensureProduct(w,['Prosecco Serena'],{name:'Prosecco Serena',brand:'Serena',category:'Prosecco',format:'75 cl',base_unit:'bottiglia',units_per_case:6}),
  aperol:ensureProduct(w,['Aperol 1 L'],{name:'Aperol 1 L',brand:'Aperol',category:'Aperitivi',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  smirnoff:ensureProduct(w,['Vodka Smirnoff Red 1 L'],{name:'Vodka Smirnoff Red 1 L',brand:'Smirnoff',category:'Vodka',format:'1 L',base_unit:'bottiglia',units_per_case:6}),
  moet:ensureProduct(w,['Moët Réserve Impériale','Champagne Moet Reserve Imperiale'],{name:'Moët Réserve Impériale',brand:'Moët & Chandon',category:'Champagne',format:'75 cl',base_unit:'bottiglia',units_per_case:6}),
  ten:ensureProduct(w,['Gin Tanqueray Ten 70 cl'],{name:'Gin Tanqueray Ten 70 cl',brand:'Tanqueray',category:'Gin',format:'70 cl',base_unit:'bottiglia',units_per_case:6}),
  ciroc:ensureProduct(w,['Vodka Ciroc 70 cl'],{name:'Vodka Ciroc 70 cl',brand:'Ciroc',category:'Vodka',format:'70 cl',base_unit:'bottiglia',units_per_case:6})
 };
 const inv={id:next(w.invoices),supplier_id:sup.id,invoice_number:'106210',invoice_date:date,total_gross:1007.45,document_paths:JSON.stringify([]),source_type:'FOTO',status:'confermato',notes:'Fattura accompagnatoria UNIGROUP del 31/10/2026.',created_at:now};w.invoices.push(inv);
 const stock=(p,desc,q,net)=>addLine(w,inv,p,{desc,sourceQty:q,sourceUnit:'PZ',quantityBase:q,sourceNetUnit:net,netUnitBase:net,grossUnitBase:net*1.22,netTotal:q*net,grossTotal:q*net*1.22,vatRate:22});
 stock(P.tanq,'GIN TANQUERAY LT 1',28,17.30);
 stock(P.prosecco,'SPUMANTE SERENA EX.DRY G.CUVEE 2024',12,3.00);
 stock(P.aperol,'APERITIVO APEROL LT 1X6',4,14.30);
 stock(P.smirnoff,'VODKA SMIRNOFF RED LT 1',6,9.70);
 stock(P.moet,'CHAMPAGNE MOET&CH. RESERVE IMPERIALE X6',2,45.00);
 stock(P.ten,'GIN TANQUERAY TEN CL 70',2,22.90);
 stock(P.ciroc,'VODKA CIROC CL 70',2,26.90);
 addLine(w,inv,null,{desc:'SPESE ACCESSORIE',sourceQty:0,sourceUnit:'',quantityBase:0,sourceNetUnit:0.38,netTotal:0.38,grossTotal:0.4636,vatRate:22,affectsStock:false});
 w.audit_logs.push({id:next(w.audit_logs),action:'caricamento fattura UNIGROUP 106210',entity_type:'invoice',entity_id:inv.id,details:'Fattura 31/10/2026: 56 bottiglie caricate. Totale documento 1.007,45 € IVA inclusa.',created_at:now});
 w.meta[marker]={applied_at:now,invoice_id:inv.id,total_gross:1007.45,stock_units:56};commit(state,w);return true;
};

})();