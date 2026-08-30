(function(){
'use strict';

window.applyPremiumFormatsValuation20260829=function(state){
 const marker='premium_formats_valuation_20260829_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 const work=typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));
 for(const k of ['products','events','suppliers','invoices','invoice_lines','movements','consumption_lines','audit_logs'])work[k]=Array.isArray(work[k])?work[k]:[];
 work.meta=work.meta||{};
 const now=new Date().toISOString(),date='2026-08-29';
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const product=name=>work.products.find(p=>norm(p.name)===norm(name))||null;
 const stock=pid=>work.movements.filter(m=>Number(m.product_id)===Number(pid)).reduce((s,m)=>s+Number(m.quantity_delta||0),0);
 const grey=product('Grey Goose 1.5 L');
 const belv=product('Belvedere 75 cl');
 if(!grey||!belv)throw new Error('Valorizzazione premium 29/08 non applicata: referenze Grey Goose 1.5 L / Belvedere 75 cl non trovate. Aprire prima la versione con SHIVA 29/08.');
 const event=work.events.find(e=>String(e.event_date)===date&&norm(e.name)==='SHIVA');
 if(!event)throw new Error('Valorizzazione premium 29/08 non applicata: evento SHIVA 29/08 non trovato.');
 const greyCons=work.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)&&Number(l.product_id)===Number(grey.id)&&String(l.notes||'').includes('SHIVA-20260829'));
 const belvCons=work.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)&&Number(l.product_id)===Number(belv.id)&&String(l.notes||'').includes('SHIVA-20260829'));
 const greyQty=greyCons.reduce((s,l)=>s+Number(l.quantity_base||0),0),belvQty=belvCons.reduce((s,l)=>s+Number(l.quantity_base||0),0);
 if(greyQty!==1||belvQty!==6)throw new Error(`Valorizzazione premium 29/08: quantità SHIVA inattese (Grey ${greyQty}, Belvedere ${belvQty}; attese 1 e 6).`);
 const greyBefore=stock(grey.id),belvBefore=stock(belv.id);
 if(Math.abs(greyBefore+1)>1e-9||Math.abs(belvBefore+6)>1e-9)throw new Error(`Valorizzazione premium 29/08 bloccata per sicurezza: giacenze prima del carico Grey=${greyBefore}, Belvedere=${belvBefore}; attese -1 e -6. Nessuna modifica applicata.`);

 let supplier=work.suppliers.find(s=>norm(s.name)==='VALORIZZAZIONE MANUALE');
 if(!supplier){supplier={id:next(work.suppliers),name:'Valorizzazione manuale',vat_number:'',created_at:now};work.suppliers.push(supplier)}
 const number='VAL-20260829-PREMIUM';
 let inv=work.invoices.find(i=>Number(i.supplier_id)===Number(supplier.id)&&norm(i.invoice_number)===norm(number)&&String(i.invoice_date)===date);
 if(!inv){inv={id:next(work.invoices),supplier_id:supplier.id,invoice_number:number,invoice_date:date,total_gross:330,document_paths:JSON.stringify([]),source_type:'manual_cost_basis',status:'valorizzazione',notes:'Valorizzazione manuale, NON fattura fornitore. Prezzi IVA inclusa comunicati: Grey Goose 1.5 L €120; Belvedere 75 cl €35 cad. Quantità corrispondenti alle bottiglie presenti e consumate a SHIVA 29/08.',created_at:now};work.invoices.push(inv)}
 else{inv.total_gross=330;inv.source_type='manual_cost_basis';inv.status='valorizzazione';inv.notes='Valorizzazione manuale, NON fattura fornitore. Prezzi IVA inclusa comunicati: Grey Goose 1.5 L €120; Belvedere 75 cl €35 cad. Quantità corrispondenti alle bottiglie presenti e consumate a SHIVA 29/08.'}
 const oldLineIds=new Set(work.invoice_lines.filter(l=>Number(l.invoice_id)===Number(inv.id)).map(l=>Number(l.id)));
 if(oldLineIds.size){work.movements=work.movements.filter(m=>!(m.source_type==='invoice_line'&&oldLineIds.has(Number(m.source_id))));work.invoice_lines=work.invoice_lines.filter(l=>Number(l.invoice_id)!==Number(inv.id))}
 const rows=[[grey,1,120],[belv,6,35]];
 for(const [p,qty,grossUnit] of rows){
  const netUnit=grossUnit/1.22,lid=next(work.invoice_lines);
  work.invoice_lines.push({id:lid,invoice_id:inv.id,product_id:p.id,raw_description:`VALORIZZAZIONE MANUALE ${p.name}`,source_quantity:qty,source_unit:'PZ',quantity_base:qty,net_unit_price:netUnit,gross_unit_price:grossUnit,net_total:qty*netUnit,gross_total:qty*grossUnit,vat_rate:22,is_free:0,affects_stock:1,notes:'Prezzo IVA inclusa comunicato manualmente; IVA 22% scorporata solo ai fini della struttura dati. Non è una fattura fornitore.',source_net_unit_price:netUnit});
  work.movements.push({id:next(work.movements),movement_date:date,movement_type:'acquisto',product_id:p.id,quantity_delta:qty,unit_cost:grossUnit,source_type:'invoice_line',source_id:lid,area_id:null,user_id:null,notes:`Carico/valorizzazione manuale pre-SHIVA 29/08 · ${p.name} · NON fattura`,created_at:now});
 }
 for(const l of greyCons){l.cost_unit=120;l.cost_total=Number(l.quantity_base||0)*120;const m=work.movements.find(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(l.id));if(m)m.unit_cost=120}
 for(const l of belvCons){l.cost_unit=35;l.cost_total=Number(l.quantity_base||0)*35;const m=work.movements.find(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(l.id));if(m)m.unit_cost=35}
 const greyAfter=stock(grey.id),belvAfter=stock(belv.id);
 if(Math.abs(greyAfter)>1e-9||Math.abs(belvAfter)>1e-9)throw new Error(`Valorizzazione premium 29/08: giacenza finale non zero (Grey ${greyAfter}, Belvedere ${belvAfter}). Nessuna modifica applicata.`);
 const eventCost=work.consumption_lines.filter(l=>Number(l.event_id)===Number(event.id)).reduce((s,l)=>s+Number(l.cost_total||0),0);
 work.audit_logs.push({id:next(work.audit_logs),action:'valorizzazione Grey Goose 1.5 L e Belvedere 75 cl',entity_type:'event',entity_id:event.id,details:`Prezzi IVA inclusa: Grey Goose 1.5 L €120 x1; Belvedere 75 cl €35 x6. Valore totale €330. Inserito carico manuale delle 7 bottiglie effettivamente consumate a SHIVA per azzerare le due giacenze; documento interno di valorizzazione, non fattura fornitore. Costo evento risultante: €${eventCost.toFixed(2)}.`,created_at:now});
 work.meta[marker]={applied_at:now,event_id:event.id,event_date:date,total_gross_value:330,grey_goose:{product_id:grey.id,format:'1.5 L',quantity:1,gross_unit_price:120,final_stock:greyAfter},belvedere:{product_id:belv.id,format:'75 cl',quantity:6,gross_unit_price:35,final_stock:belvAfter},document_type:'manual_cost_basis_not_supplier_invoice',event_cost_after:eventCost,vat_included:true};
 for(const k of ['suppliers','invoices','invoice_lines','movements','consumption_lines','audit_logs','meta'])state[k]=work[k];
 return true;
};
})();
