from pathlib import Path

EXT_MARKER = "TTP_INVOICE_DEDUPE_V1"

PATCH = r'''

// TTP_INVOICE_DEDUPE_V1
let __ttpInvoiceRepairBusy=false;
function __ttpInvoiceNorm(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim()}
function __ttpInvoiceSupplierName(inv){const s=(APP.suppliers||[]).find(x=>Number(x.id)===Number(inv?.supplier_id));return __ttpInvoiceNorm(s?.name||inv?.supplier_id||'')}
function __ttpInvoiceKey(inv){return [__ttpInvoiceSupplierName(inv),__ttpInvoiceNorm(inv?.invoice_number),String(inv?.invoice_date||'').trim()].join('|')}
function __ttpInvoiceDocs(inv){try{const x=JSON.parse(inv?.document_paths||'[]');return Array.isArray(x)?x.filter(Boolean):[]}catch(_){return inv?.document_paths?[inv.document_paths]:[]}}
function __ttpRound(n){return Math.round(Number(n||0)*10000)/10000}
function __ttpLineSignature(invoiceId){return (APP.invoice_lines||[]).filter(l=>Number(l.invoice_id)===Number(invoiceId)).map(l=>[
  __ttpInvoiceNorm(l.raw_description),Number(l.product_id)||0,__ttpRound(l.source_quantity),__ttpInvoiceNorm(l.source_unit),__ttpRound(l.quantity_base),__ttpRound(l.gross_unit_price),__ttpRound(l.gross_total),Number(l.vat_rate)||0,Number(l.is_free)||0,Number(l.affects_stock)||0
].join('~')).sort().join('||')}
function __ttpInvoiceQuality(inv){const lines=(APP.invoice_lines||[]).filter(l=>Number(l.invoice_id)===Number(inv.id));const stock=lines.filter(l=>Number(l.affects_stock)===1&&Number(l.quantity_base)>0).length;return lines.length*10000+stock*1000+__ttpInvoiceDocs(inv).length*100+(Number(inv.total_gross)>0?10:0)}
function __ttpRepairDuplicateInvoices(){
  if(!APP||!Array.isArray(APP.invoices)||!Array.isArray(APP.invoice_lines)||!Array.isArray(APP.movements))return {removed:0,groups:0,ambiguous:0};
  if(!Array.isArray(APP.audit_logs))APP.audit_logs=[];
  const groups=new Map();
  for(const inv of APP.invoices){const key=__ttpInvoiceKey(inv);if(!key||key==='||')continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(inv)}
  const removeInvoiceIds=new Set(),removeLineIds=new Set();let duplicateGroups=0,ambiguous=0;
  for(const arr of groups.values()){
    if(arr.length<2)continue;
    const bySignature=new Map();
    for(const inv of arr){const sig=`${__ttpRound(inv.total_gross)}|${__ttpLineSignature(inv.id)}`;if(!bySignature.has(sig))bySignature.set(sig,[]);bySignature.get(sig).push(inv)}
    for(const same of bySignature.values()){
      if(same.length<2)continue;
      duplicateGroups++;
      same.sort((a,b)=>__ttpInvoiceQuality(b)-__ttpInvoiceQuality(a)||Number(a.id)-Number(b.id));
      const keep=same[0],docs=new Set(__ttpInvoiceDocs(keep));
      for(const dup of same.slice(1)){
        __ttpInvoiceDocs(dup).forEach(x=>docs.add(x));
        removeInvoiceIds.add(Number(dup.id));
        (APP.invoice_lines||[]).filter(l=>Number(l.invoice_id)===Number(dup.id)).forEach(l=>removeLineIds.add(Number(l.id)));
      }
      keep.document_paths=JSON.stringify([...docs]);
    }
    if(bySignature.size>1)ambiguous++;
  }
  if(!removeInvoiceIds.size)return {removed:0,groups:duplicateGroups,ambiguous};
  APP.invoices=APP.invoices.filter(i=>!removeInvoiceIds.has(Number(i.id)));
  APP.invoice_lines=APP.invoice_lines.filter(l=>!removeLineIds.has(Number(l.id)));
  APP.movements=APP.movements.filter(m=>!(m.source_type==='invoice_line'&&removeLineIds.has(Number(m.source_id))));
  const validLineIds=new Set(APP.invoice_lines.map(l=>Number(l.id)));
  APP.movements=APP.movements.filter(m=>m.source_type!=='invoice_line'||validLineIds.has(Number(m.source_id)));
  APP.audit_logs.push({id:nextId(APP.audit_logs),action:'pulizia fatture duplicate',entity_type:'warehouse',entity_id:null,details:`Rimosse ${removeInvoiceIds.size} fatture duplicate identiche in ${duplicateGroups} gruppi; eliminate anche le relative righe e i movimenti di carico. Giacenze ricalcolate automaticamente dai movimenti residui.${ambiguous?` ${ambiguous} gruppi con contenuto differente non sono stati eliminati automaticamente.`:''}`,created_at:new Date().toISOString()});
  return {removed:removeInvoiceIds.size,groups:duplicateGroups,ambiguous};
}
function __ttpScheduleInvoiceRepair(){
  clearTimeout(window.__ttpInvoiceRepairTimer);
  window.__ttpInvoiceRepairTimer=setTimeout(async()=>{
    if(__ttpInvoiceRepairBusy||!APP?.meta)return;
    __ttpInvoiceRepairBusy=true;
    try{
      const result=__ttpRepairDuplicateInvoices();
      if(result.removed){await saveState();toast(`Pulizia completata: ${result.removed} fatture duplicate rimosse e magazzino aggiornato`)}
      else if(result.ambiguous){console.warn('Fatture con stessa chiave ma contenuto differente:',result.ambiguous)}
    }catch(error){console.error('TTP invoice integrity repair',error)}finally{__ttpInvoiceRepairBusy=false}
  },450);
}
'''


def patch_extension():
    path = Path('warehouse_extensions.js')
    text = path.read_text(encoding='utf-8')
    if EXT_MARKER not in text:
        anchor = 'function install(){'
        if anchor not in text:
            raise RuntimeError('warehouse_extensions.js: install() anchor not found')
        text = text.replace(anchor, PATCH + '\n' + anchor, 1)
    old_render = "renderAll=function(){ensureExtendedState();NAV.forEach(([id])=>renderView(id))};"
    new_render = "renderAll=function(){ensureExtendedState();NAV.forEach(([id])=>renderView(id));__ttpScheduleInvoiceRepair()};"
    if old_render in text:
        text = text.replace(old_render, new_render, 1)
    elif new_render not in text:
        raise RuntimeError('warehouse_extensions.js: renderAll anchor not found')
    path.write_text(text, encoding='utf-8')


def patch_ocr_guard():
    path = Path('404.html')
    text = path.read_text(encoding='utf-8')
    old = "if(APP.invoices.some(x=>Number(x.supplier_id)===Number(sup.id)&&x.invoice_number===number&&x.invoice_date===date)&&!confirm('Possibile fattura duplicata. Vuoi registrarla comunque?'))return;"
    new = "if(APP.invoices.some(x=>Number(x.supplier_id)===Number(sup.id)&&x.invoice_number===number&&x.invoice_date===date)){alert('Questa fattura è già presente. Il duplicato non verrà registrato.');return;}"
    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise RuntimeError('404.html: OCR duplicate guard anchor not found')
    path.write_text(text, encoding='utf-8')


patch_extension()
patch_ocr_guard()
print('Invoice duplicate protection patched successfully.')
