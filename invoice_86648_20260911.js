(function(){
'use strict';

window.applyInvoice86648_20260911=function(state){
 const marker='invoice_unigroup_86648_20260911_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['suppliers','products','invoices','invoice_lines','movements','events','consumption_lines','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-09-11';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>work.products.find(p=>norm(p.name)===norm(name))||null;
 const mustProduct=(names,label)=>{for(const n of names){const p=product(n);if(p)return p}throw new Error('Fattura 86648 non caricata: prodotto non trovato: '+label)};
 const avg=pid=>{const lines=work.invoice_lines.filter(l=>Number(l.product_id)===Number(pid)&&Number(l.affects_stock)===1&&!Number(l.is_free)&&Number(l.quantity_base)>0&&Number(l.gross_total)>=0);const q=lines.reduce((s,l)=>s+Number(l.quantity_base||0),0),v=lines.reduce((s,l)=>s+Number(l.gross_total||0),0);return q?v/q:0};
 const stock=pid=>work.movements.filter(m=>Number(m.product_id)===Number(pid)).reduce((s,m)=>s+Number(m.quantity_delta||0),0);

 let supplier=work.suppliers.find(s=>String(s.vat_number||'')==='01433500897')||work.suppliers.find(s=>norm(s.name).includes('UNIGROUP'));
 if(!supplier){supplier={id:next(work.suppliers),name:'UNIGROUP S.P.A.',vat_number:'01433500897',created_at:now};work.suppliers.push(supplier)}
 const tanq=mustProduct(['Gin Tanqueray 1 L'],'Gin Tanqueray 1 L');
 const redbull=mustProduct(['Red Bull 25 cl'],'Red Bull 25 cl');
 const smirnoff=mustProduct(['Vodka Smirnoff Red 1 L'],'Vodka Smirnoff Red 1 L');

 // Correzione dell'ordine temporale Red Bull SHIVA: la fattura 83417 del 29/08 è stata caricata nel gestionale dopo
 // lo scarico SHIVA, ma fisicamente era merce disponibile per la serata. L'utente aveva confermato "Red Bull tutta consumata".
 // Ricalcoliamo quindi SOLO la riga Red Bull SHIVA usando tutti i movimenti fino al 29/08, escludendo il suo stesso scarico.
 let redbullRepair=null;
 const shiva=work.events.find(e=>String(e.event_date)==='2026-08-29'&&norm(e.name)==='SHIVA');
 if(shiva){
   const shivaLine=work.consumption_lines.find(l=>Number(l.event_id)===Number(shiva.id)&&Number(l.product_id)===Number(redbull.id)&&String(l.notes||'').includes('SHIVA-20260829'));
   if(shivaLine){
     const shivaMove=work.movements.find(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(shivaLine.id));
     const oldQty=Number(shivaLine.quantity_base||0);
     const available=work.movements.filter(m=>Number(m.product_id)===Number(redbull.id)&&String(m.movement_date||'')<='2026-08-29'&&(!shivaMove||Number(m.id)!==Number(shivaMove.id))).reduce((s,m)=>s+Number(m.quantity_delta||0),0);
     if(available>=0&&Math.abs(available-oldQty)>1e-9){
       const cost=avg(redbull.id);
       shivaLine.quantity_base=available;shivaLine.cost_unit=cost;shivaLine.cost_total=available*cost;
       shivaLine.notes=String(shivaLine.notes||'')+' · Red Bull tutta consumata, corretta includendo il carico UNIGROUP del 29/08 [REDBULL-SHIVA-ORDER-REPAIR-20260911]';
       if(shivaMove){shivaMove.quantity_delta=-available;shivaMove.unit_cost=cost;shivaMove.notes=String(shivaMove.notes||'')+' [REDBULL-SHIVA-ORDER-REPAIR-20260911]'}
       redbullRepair={old_quantity:oldQty,new_quantity:available,delta_consumption:available-oldQty,stock_after_shiva_through_2908:work.movements.filter(m=>Number(m.product_id)===Number(redbull.id)&&String(m.movement_date||'')<='2026-08-29').reduce((s,m)=>s+Number(m.quantity_delta||0),0)};
     }
   }
 }

 let inv=work.invoices.find(i=>Number(i.supplier_id)===Number(supplier.id)&&String(i.invoice_date)===date&&norm(i.invoice_number)==='86648');
 if(!inv){inv={id:next(work.invoices),supplier_id:supplier.id,invoice_number:'86648',invoice_date:date,total_gross:713.53,document_paths:JSON.stringify([]),source_type:'FOTO',status:'confermato',notes:'Fattura accompagnatoria UNIGROUP n. 86648 del 11/09/2026. Ordine 133532. Totale documento €713,53.',created_at:now};work.invoices.push(inv)}else{
   const oldIds=new Set(work.invoice_lines.filter(l=>Number(l.invoice_id)===Number(inv.id)).map(l=>Number(l.id)));
   work.movements=work.movements.filter(m=>!(m.source_type==='invoice_line'&&oldIds.has(Number(m.source_id))));
   work.invoice_lines=work.invoice_lines.filter(l=>Number(l.invoice_id)!==Number(inv.id));
   Object.assign(inv,{total_gross:713.53,source_type:'FOTO',status:'confermato',notes:'Fattura accompagnatoria UNIGROUP n. 86648 del 11/09/2026. Ordine 133532. Totale documento €713,53.'});
 }
 const addPaid=(p,desc,qty,netUnit)=>{const lid=next(work.invoice_lines),grossUnit=netUnit*1.22;work.invoice_lines.push({id:lid,invoice_id:inv.id,product_id:p.id,raw_description:desc,source_quantity:qty,source_unit:'PZ',quantity_base:qty,net_unit_price:netUnit,gross_unit_price:grossUnit,net_total:qty*netUnit,gross_total:qty*grossUnit,vat_rate:22,is_free:0,affects_stock:1,notes:'',source_net_unit_price:netUnit});work.movements.push({id:next(work.movements),movement_date:date,movement_type:'acquisto',product_id:p.id,quantity_delta:qty,unit_cost:grossUnit,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:'Carico da fattura UNIGROUP 86648 del 11/09/2026',created_at:now});};
 addPaid(tanq,'GIN TANQUERAY LT 1',24,17.30);
 addPaid(redbull,'RED BULL LATTINA CL 25 X 24 PZ',24,1.40);
 addPaid(smirnoff,'VODKA SMIRNOFF RED LT 1',14,9.70);
 work.invoice_lines.push({id:next(work.invoice_lines),invoice_id:inv.id,product_id:null,raw_description:'SPESE ACCESSORIE',source_quantity:0,source_unit:'',quantity_base:0,net_unit_price:0,gross_unit_price:0,net_total:0.26,gross_total:0.3172,vat_rate:22,is_free:0,affects_stock:0,notes:'Voce non inventariabile; differenza tra totale merce €584,60 e imponibile €584,86.',source_net_unit_price:0});

 const invLines=work.invoice_lines.filter(l=>Number(l.invoice_id)===Number(inv.id));
 const stockLines=invLines.filter(l=>Number(l.affects_stock)===1);
 const net=invLines.reduce((s,l)=>s+Number(l.net_total||0),0),gross=invLines.reduce((s,l)=>s+Number(l.gross_total||0),0);
 if(stockLines.length!==3||stockLines.reduce((s,l)=>s+Number(l.quantity_base||0),0)!==62)throw new Error('Fattura 86648: controllo quantità fallito. Nessuna modifica applicata.');
 if(Math.abs(net-584.86)>0.001||Math.abs(gross-713.5292)>0.001)throw new Error(`Fattura 86648: controllo totali fallito (netto ${net}, lordo ${gross}). Nessuna modifica applicata.`);
 work.audit_logs.push({id:next(work.audit_logs),action:'caricamento fattura UNIGROUP 86648',entity_type:'invoice',entity_id:inv.id,details:`11/09/2026: Tanqueray 1 L +24, Red Bull 25 cl +24, Smirnoff Red 1 L +14. Totale merce €584,60; imponibile €584,86; IVA €128,67; totale documento €713,53.${redbullRepair?' Corretto anche lo scarico Red Bull SHIVA per rispettare “tutta consumata”: '+redbullRepair.old_quantity+' → '+redbullRepair.new_quantity+' lattine.':''}`,created_at:now});
 work.meta[marker]={applied_at:now,invoice_id:inv.id,invoice_number:'86648',invoice_date:date,total_document_gross:713.53,total_merchandise_net:584.60,taxable:584.86,vat:128.67,stock_units:62,lines:{tanqueray_1l:24,red_bull_25cl:24,smirnoff_1l:14},redbull_shiva_order_repair:redbullRepair,current_stocks_after_load:{tanqueray_1l:stock(tanq.id),red_bull_25cl:stock(redbull.id),smirnoff_1l:stock(smirnoff.id)}};
 for(const k of ['suppliers','invoices','invoice_lines','movements','consumption_lines','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
