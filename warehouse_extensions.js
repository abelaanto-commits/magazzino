(function(){
'use strict';

function ensureExtendedState(){
  if(!APP)return;
  if(!Array.isArray(APP.revenues))APP.revenues=[];
  if(!Array.isArray(APP.stocktake_sessions))APP.stocktake_sessions=[];
  if(!Array.isArray(APP.stocktake_lines))APP.stocktake_lines=[];
}

function installStyles(){
  if(document.getElementById('ttpWarehouseExtStyle'))return;
  const style=document.createElement('style');
  style.id='ttpWarehouseExtStyle';
  style.textContent=`
  .countrows{display:grid;gap:9px;margin-top:10px}
  .countrow{display:grid;grid-template-columns:minmax(170px,1fr) 92px 92px 90px 42px;gap:8px;align-items:end;padding:10px;border:1px solid var(--line);border-radius:15px;background:var(--panel2)}
  .countrow label{display:grid;gap:5px;font-size:11px;color:var(--muted);font-weight:750}
  .countrow label span{color:var(--text)}
  .countrow .difference{font-weight:900;text-align:center;background:color-mix(in srgb,var(--brand) 7%,var(--panel))}
  .countrow .remove{width:42px;height:42px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--bad);font-size:20px}
  .revenue-total{font-size:22px;font-weight:900;letter-spacing:-.03em;padding:12px;border-radius:13px;background:color-mix(in srgb,var(--brand) 8%,var(--panel));border:1px solid color-mix(in srgb,var(--brand) 20%,var(--line));text-align:center}
  @media(max-width:699px){.countrow{grid-template-columns:1fr 1fr 42px}.countrow .productfield{grid-column:1/-1}.countrow .difffield{grid-column:1/3}}
  `;
  document.head.appendChild(style);
}

function installViews(){
  const main=document.querySelector('.main');
  const warehouse=document.getElementById('view-warehouse');
  if(!main||!warehouse)return;
  if(!document.getElementById('view-revenues'))warehouse.insertAdjacentHTML('beforebegin','<section class="view" id="view-revenues"></section>');
  if(!document.getElementById('view-counts'))warehouse.insertAdjacentHTML('beforebegin','<section class="view" id="view-counts"></section>');
}

function revenueValue(r){return Number(r?.cash||0)+Number(r?.card||0)+Number(r?.other||0)}
function eventRevenue(id){ensureExtendedState();return APP.revenues.filter(x=>Number(x.event_id)===Number(id)).reduce((s,x)=>s+revenueValue(x),0)}
function eventMargin(id){return eventRevenue(id)-eventCost(id)}
function sessionLines(id){ensureExtendedState();return APP.stocktake_lines.filter(x=>Number(x.session_id)===Number(id))}
function sessionConsumed(id){return sessionLines(id).reduce((s,x)=>s+Number(x.consumed_qty||0),0)}
function sessionCost(id){return sessionLines(id).reduce((s,x)=>s+Number(x.consumed_qty||0)*purchaseStats(x.product_id).avg,0)}
function sessionLinesTotal(){ensureExtendedState();return APP.stocktake_lines.reduce((s,x)=>s+Number(x.consumed_qty||0),0)}

function renderRevenues(){
  ensureExtendedState();
  const el=document.getElementById('view-revenues');
  if(!el)return;
  const total=APP.revenues.reduce((s,x)=>s+revenueValue(x),0);
  const cash=APP.revenues.reduce((s,x)=>s+Number(x.cash||0),0);
  const card=APP.revenues.reduce((s,x)=>s+Number(x.card||0),0);
  const totalCosts=APP.events.reduce((s,e)=>s+eventCost(e.id),0);
  el.innerHTML=pageHead('Incassi','Registra gli incassi di ogni area e confrontali con il costo dei consumi',`<button class="btn" onclick="openRevenue()">+ Registra incasso</button>`)
  +`<div class="grid metrics"><div class="card metric"><span class="eyebrow">Incassi totali</span><span class="value">${eur(total)}</span><span class="sub">Tutte le serate</span></div><div class="card metric"><span class="eyebrow">Contanti</span><span class="value">${eur(cash)}</span><span class="sub">Registrati</span></div><div class="card metric"><span class="eyebrow">Carta / POS</span><span class="value">${eur(card)}</span><span class="sub">Registrati</span></div><div class="card metric"><span class="eyebrow">Margine lordo</span><span class="value">${eur(total-totalCosts)}</span><span class="sub">Incassi − costo consumi</span></div></div>
  <div class="section card panel"><div class="toolbar"><input class="search" id="revenueSearch" placeholder="Cerca serata o area"><select class="field" id="revenueEvent"><option value="">Tutte le serate</option>${[...APP.events].sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date))).map(e=>`<option value="${e.id}">${dateIt(e.event_date)} · ${esc(e.name)}</option>`).join('')}</select><div></div></div><div id="revenueTable"></div></div>`;
  const draw=()=>{
    const q=norm(document.getElementById('revenueSearch').value),eid=Number(document.getElementById('revenueEvent').value||0);
    const rows=[...APP.revenues].filter(r=>{const e=eventById(r.event_id),a=area(r.area_id);return(!eid||Number(r.event_id)===eid)&&(!q||norm(`${e?.name||''} ${a?.name||''} ${e?.event_date||''}`).includes(q))}).sort((a,b)=>String(eventById(b.event_id)?.event_date||'').localeCompare(String(eventById(a.event_id)?.event_date||''))||b.id-a.id);
    document.getElementById('revenueTable').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Data</th><th>Serata</th><th>Area</th><th>Contanti</th><th>Carta</th><th>Altro</th><th>Totale</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${dateIt(eventById(r.event_id)?.event_date)}</td><td><b>${esc(eventById(r.event_id)?.name||'')}</b></td><td>${esc(area(r.area_id)?.name||'')}</td><td>${eur(r.cash)}</td><td>${eur(r.card)}</td><td>${eur(r.other)}</td><td><b>${eur(revenueValue(r))}</b></td><td><div class="actions"><button class="btn secondary small" onclick="openRevenue(${r.id})">Modifica</button><button class="btn danger small" onclick="deleteRevenue(${r.id})">Elimina</button></div></td></tr>`).join('')}</tbody></table></div>${rows.length?'':'<div class="empty">Nessun incasso registrato</div>'}`;
  };
  document.getElementById('revenueSearch').addEventListener('input',draw);
  document.getElementById('revenueEvent').addEventListener('change',draw);
  draw();
}

function openRevenue(id=null,eventId=null,areaId=null){
  ensureExtendedState();
  const r=id?APP.revenues.find(x=>Number(x.id)===Number(id)):null;
  openModal(`<div class="modalhead"><h2>${r?'Modifica':'Registra'} incasso</h2><button class="closebtn" data-close>×</button></div><form id="revenueForm"><div class="formgrid two"><label><span>Serata</span><select class="field" name="event" required><option value="">Seleziona</option>${[...APP.events].sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date))).map(e=>`<option value="${e.id}" ${Number(r?.event_id||eventId)===Number(e.id)?'selected':''}>${dateIt(e.event_date)} · ${esc(e.name)}</option>`).join('')}</select></label><label><span>Area</span><select class="field" name="area" required>${APP.areas.filter(a=>a.active).map(a=>`<option value="${a.id}" ${Number(r?.area_id||areaId)===Number(a.id)?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label><label><span>Contanti</span><input class="field revenue-part" name="cash" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(r?.cash||0)}"></label><label><span>Carta / POS</span><input class="field revenue-part" name="card" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(r?.card||0)}"></label><label><span>Altro</span><input class="field revenue-part" name="other" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(r?.other||0)}"></label><label><span>Note</span><input class="field" name="notes" value="${esc(r?.notes||'')}"></label></div><div class="section"><div class="revenue-total" id="revenueTotal">Totale: ${eur(revenueValue(r||{}))}</div></div><div class="formactions"><button type="button" class="btn secondary" data-close>Annulla</button><button class="btn">Salva incasso</button></div></form>`,m=>{
    const updateTotal=()=>{const vals=[...m.querySelectorAll('.revenue-part')].reduce((sum,x)=>sum+Number(x.value||0),0);m.querySelector('#revenueTotal').textContent=`Totale: ${eur(vals)}`};
    m.querySelectorAll('.revenue-part').forEach(x=>x.addEventListener('input',updateTotal));
    m.querySelector('#revenueForm').onsubmit=async ev=>{
      ev.preventDefault();
      const fd=new FormData(ev.target),eid=Number(fd.get('event')),aid=Number(fd.get('area'));
      const payload={event_id:eid,area_id:aid,cash:Number(fd.get('cash')||0),card:Number(fd.get('card')||0),other:Number(fd.get('other')||0),notes:String(fd.get('notes')||'').trim(),updated_at:new Date().toISOString()};
      let target=r;
      if(!target){target=APP.revenues.find(x=>Number(x.event_id)===eid&&Number(x.area_id)===aid);if(target&&!confirm('Per questa serata e area esiste già un incasso. Vuoi sostituirlo?'))return}
      if(target)Object.assign(target,payload);else APP.revenues.push({id:nextId(APP.revenues),...payload,created_at:new Date().toISOString()});
      await saveState();closeModal();renderAll();toast('Incasso salvato');
    };
  });
}

async function deleteRevenue(id){
  if(!confirm('Eliminare questo incasso?'))return;
  APP.revenues=APP.revenues.filter(x=>Number(x.id)!==Number(id));
  await saveState();renderAll();toast('Incasso eliminato');
}

function countRowHTML(line=null){
  const opts=[...APP.products].sort((a,b)=>a.name.localeCompare(b.name,'it')).map(p=>`<option value="${p.id}" ${Number(line?.product_id)===Number(p.id)?'selected':''}>${esc(p.name)}</option>`).join('');
  const opening=Number(line?.opening_qty||0),closing=Number(line?.closing_qty||0),diff=Math.max(0,opening-closing);
  return `<div class="countrow"><label class="productfield"><span>Prodotto</span><select class="field count-product"><option value="">Seleziona prodotto</option>${opts}</select></label><label><span>Carico iniziale</span><input class="field count-opening" type="number" min="0" step="0.01" inputmode="decimal" value="${line?opening:''}"></label><label><span>Rimanenza finale</span><input class="field count-closing" type="number" min="0" step="0.01" inputmode="decimal" value="${line?closing:''}"></label><label class="difffield"><span>Consumo</span><input class="field difference" readonly value="${line?num(diff,diff%1?2:0):'0'}"></label><button type="button" class="remove" title="Rimuovi riga">×</button></div>`;
}

function bindCountRows(box){
  const refresh=row=>{const opening=Number(row.querySelector('.count-opening').value||0),closing=Number(row.querySelector('.count-closing').value||0),diff=opening-closing,out=row.querySelector('.difference');out.value=num(Math.max(0,diff),Math.max(0,diff)%1?2:0);out.style.color=diff<0?'var(--bad)':'var(--ok)'};
  box.querySelectorAll('.countrow').forEach(row=>{
    row.querySelectorAll('.count-opening,.count-closing').forEach(x=>x.oninput=()=>refresh(row));
    row.querySelector('.remove').onclick=()=>{if(box.querySelectorAll('.countrow').length>1)row.remove();else{row.querySelector('.count-product').value='';row.querySelector('.count-opening').value='';row.querySelector('.count-closing').value='';row.querySelector('.difference').value='0'}};
    refresh(row);
  });
}

function addCountRow(){const box=document.getElementById('countRows');if(!box)return;box.insertAdjacentHTML('beforeend',countRowHTML());bindCountRows(box)}

function renderCounts(){
  ensureExtendedState();
  const el=document.getElementById('view-counts');
  if(!el)return;
  const total=sessionLinesTotal(),cost=APP.stocktake_sessions.reduce((s,x)=>s+sessionCost(x.id),0);
  el.innerHTML=pageHead('Carico / Reso bar','Inserisci il carico iniziale e la rimanenza finale: la differenza genera automaticamente il consumo',`<button class="btn" onclick="openStocktake()">+ Nuovo controllo</button>`)
  +`<div class="notice warn">Conta le bottiglie aperte tra le rimanenze finali. In questo modo vengono scaricate soltanto le bottiglie completamente finite. Non inserire poi lo stesso consumo anche manualmente.</div><div class="grid metrics section"><div class="card metric"><span class="eyebrow">Controlli salvati</span><span class="value">${APP.stocktake_sessions.length}</span><span class="sub">Serata e area</span></div><div class="card metric"><span class="eyebrow">Unità consumate</span><span class="value">${num(total,total%1?2:0)}</span><span class="sub">Da carico − rimanenza</span></div><div class="card metric"><span class="eyebrow">Costo consumi</span><span class="value">${eur(cost)}</span><span class="sub">Costo medio</span></div><div class="card metric"><span class="eyebrow">Aree controllate</span><span class="value">${new Set(APP.stocktake_sessions.map(x=>x.area_id)).size}</span><span class="sub">Aree diverse</span></div></div>
  <div class="section card panel"><div class="toolbar"><input class="search" id="countSearch" placeholder="Cerca serata o area"><select class="field" id="countEvent"><option value="">Tutte le serate</option>${[...APP.events].sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date))).map(e=>`<option value="${e.id}">${dateIt(e.event_date)} · ${esc(e.name)}</option>`).join('')}</select><div></div></div><div id="countTable"></div></div>`;
  const draw=()=>{
    const q=norm(document.getElementById('countSearch').value),eid=Number(document.getElementById('countEvent').value||0);
    const rows=[...APP.stocktake_sessions].filter(r=>{const e=eventById(r.event_id),a=area(r.area_id);return(!eid||Number(r.event_id)===eid)&&(!q||norm(`${e?.name||''} ${a?.name||''} ${e?.event_date||''}`).includes(q))}).sort((a,b)=>String(eventById(b.event_id)?.event_date||'').localeCompare(String(eventById(a.event_id)?.event_date||''))||b.id-a.id);
    document.getElementById('countTable').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Data</th><th>Serata</th><th>Area</th><th>Prodotti</th><th>Consumo</th><th>Costo</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${dateIt(eventById(r.event_id)?.event_date)}</td><td><b>${esc(eventById(r.event_id)?.name||'')}</b></td><td>${esc(area(r.area_id)?.name||'')}</td><td>${sessionLines(r.id).length}</td><td><b>${num(sessionConsumed(r.id),sessionConsumed(r.id)%1?2:0)}</b></td><td>${eur(sessionCost(r.id))}</td><td><div class="actions"><button class="btn secondary small" onclick="openStocktake(${r.id})">Apri</button><button class="btn danger small" onclick="deleteStocktake(${r.id})">Elimina</button></div></td></tr>`).join('')}</tbody></table></div>${rows.length?'':'<div class="empty">Nessun controllo carico/residuo salvato</div>'}`;
  };
  document.getElementById('countSearch').addEventListener('input',draw);
  document.getElementById('countEvent').addEventListener('change',draw);
  draw();
}

function removeGeneratedStocktakeConsumption(sessionId){
  const oldLines=APP.stocktake_lines.filter(x=>Number(x.session_id)===Number(sessionId));
  const consIds=new Set(oldLines.map(x=>Number(x.consumption_line_id)).filter(Boolean));
  APP.consumption_lines=APP.consumption_lines.filter(x=>!consIds.has(Number(x.id)));
  APP.movements=APP.movements.filter(x=>!(x.source_type==='consumption_line'&&consIds.has(Number(x.source_id))));
  APP.stocktake_lines=APP.stocktake_lines.filter(x=>Number(x.session_id)!==Number(sessionId));
}

function openStocktake(id=null,eventId=null,areaId=null){
  ensureExtendedState();
  const session=id?APP.stocktake_sessions.find(x=>Number(x.id)===Number(id)):null,lines=session?sessionLines(session.id):[];
  openModal(`<div class="modalhead"><h2>${session?'Modifica':'Nuovo'} carico / reso</h2><button class="closebtn" data-close>×</button></div><div class="notice">Inserisci ciò che consegni al bar a inizio serata e ciò che torna a fine serata. <b>Consumo = carico iniziale − rimanenza finale.</b></div><form id="stocktakeForm" style="margin-top:13px"><div class="formgrid two"><label><span>Serata</span><select class="field" name="event" required><option value="">Seleziona</option>${[...APP.events].sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date))).map(e=>`<option value="${e.id}" ${Number(session?.event_id||eventId)===Number(e.id)?'selected':''}>${dateIt(e.event_date)} · ${esc(e.name)}</option>`).join('')}</select></label><label><span>Area / bar</span><select class="field" name="area" required>${APP.areas.filter(a=>a.active).map(a=>`<option value="${a.id}" ${Number(session?.area_id||areaId)===Number(a.id)?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label><label style="grid-column:1/-1"><span>Note</span><input class="field" name="notes" value="${esc(session?.notes||'')}"></label></div><div class="sectiontitle" style="margin-top:16px"><h2>Prodotti</h2><button type="button" class="btn secondary small" id="addCountRow">+ Aggiungi riga</button></div><div id="countRows" class="countrows">${lines.length?lines.map(countRowHTML).join(''):Array.from({length:8},()=>countRowHTML()).join('')}</div><div class="formactions"><button type="button" class="btn secondary" data-close>Annulla</button><button class="btn">Calcola e salva consumo</button></div></form>`,m=>{
    const box=m.querySelector('#countRows');bindCountRows(box);m.querySelector('#addCountRow').onclick=addCountRow;
    m.querySelector('#stocktakeForm').onsubmit=async ev=>{
      ev.preventDefault();
      const fd=new FormData(ev.target),eid=Number(fd.get('event')),aid=Number(fd.get('area')),notes=String(fd.get('notes')||'').trim();
      const entries=[...box.querySelectorAll('.countrow')].map(row=>({product_id:Number(row.querySelector('.count-product').value),opening_qty:Number(row.querySelector('.count-opening').value||0),closing_qty:Number(row.querySelector('.count-closing').value||0)})).filter(x=>x.product_id);
      if(!entries.length){alert('Inserisci almeno un prodotto.');return}
      if(new Set(entries.map(x=>x.product_id)).size!==entries.length){alert('Lo stesso prodotto è presente più volte. Unisci le quantità in una sola riga.');return}
      const invalid=entries.find(x=>x.closing_qty>x.opening_qty);if(invalid){alert(`La rimanenza di ${product(invalid.product_id)?.name||'un prodotto'} supera il carico iniziale.`);return}
      let target=session;
      if(!target){target=APP.stocktake_sessions.find(x=>Number(x.event_id)===eid&&Number(x.area_id)===aid);if(target&&!confirm('Esiste già un controllo per questa serata e area. Vuoi sostituirlo?'))return}
      const sid=target?.id||nextId(APP.stocktake_sessions);
      if(target)removeGeneratedStocktakeConsumption(sid);else APP.stocktake_sessions.push({id:sid,created_at:new Date().toISOString()});
      target=APP.stocktake_sessions.find(x=>Number(x.id)===sid);
      Object.assign(target,{event_id:eid,area_id:aid,notes,updated_at:new Date().toISOString()});
      for(const item of entries){
        const consumed=Math.max(0,item.opening_qty-item.closing_qty),lineId=nextId(APP.stocktake_lines),p=product(item.product_id),cost=purchaseStats(item.product_id).avg;
        let cid=null;
        if(consumed>0){
          cid=nextId(APP.consumption_lines);
          APP.consumption_lines.push({id:cid,event_id:eid,area_id:aid,product_id:item.product_id,quantity_base:consumed,unit:p.base_unit,cost_unit:cost,cost_total:consumed*cost,notes:notes?`${notes} · Da carico/residuo`:'Da carico/residuo',source_type:'stocktake',source_id:sid,created_at:new Date().toISOString()});
          APP.movements.push({id:nextId(APP.movements),movement_date:eventById(eid).event_date,movement_type:'consumo',product_id:item.product_id,quantity_delta:-consumed,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:aid,user_id:null,notes:'Calcolato da carico iniziale e rimanenza finale',created_at:new Date().toISOString()});
        }
        APP.stocktake_lines.push({id:lineId,session_id:sid,product_id:item.product_id,opening_qty:item.opening_qty,closing_qty:item.closing_qty,consumed_qty:consumed,consumption_line_id:cid,created_at:new Date().toISOString()});
      }
      await saveState();closeModal();renderAll();toast('Consumo calcolato e magazzino aggiornato');
    };
  });
}

async function deleteStocktake(id){
  if(!confirm('Eliminare il controllo e ripristinare le quantità consumate?'))return;
  removeGeneratedStocktakeConsumption(id);
  APP.stocktake_sessions=APP.stocktake_sessions.filter(x=>Number(x.id)!==Number(id));
  await saveState();renderAll();toast('Controllo eliminato e giacenza ripristinata');
}

async function enhancedExportExcel(){
  if(!await ensureXLSX()){alert('Non riesco a caricare la libreria Excel. Esporta il backup JSON o il CSV.');return}
  ensureExtendedState();
  const wb=XLSX.utils.book_new(),stocks=stockMap();
  const invoices=APP.invoices.map(i=>({Data:i.invoice_date,Fornitore:supplier(i.supplier_id)?.name,Numero:i.invoice_number,Totale:i.total_gross,Origine:i.source_type}));
  const ilines=APP.invoice_lines.map(l=>({Data:invoiceById(l.invoice_id)?.invoice_date,Fornitore:supplier(invoiceById(l.invoice_id)?.supplier_id)?.name,Fattura:invoiceById(l.invoice_id)?.invoice_number,Prodotto:product(l.product_id)?.name||l.raw_description,Descrizione:l.raw_description,Quantita:l.quantity_base,Unita:product(l.product_id)?.base_unit||l.source_unit,Prezzo_unitario_IVA_inclusa:l.gross_unit_price,Totale_IVA_inclusa:l.gross_total,IVA:l.vat_rate,Omaggio:l.is_free?'Sì':'No'}));
  const prod=APP.products.map(p=>{const ps=purchaseStats(p.id);return{Prodotto:p.name,Marca:p.brand,Categoria:p.category,Formato:p.format,Pezzi_per_cassa:p.units_per_case,Ultimo_prezzo:ps.last,Prezzo_medio:ps.avg,Prezzo_minimo:ps.min,Prezzo_massimo:ps.max,Data_ultimo_acquisto:ps.lastDate}});
  const cons=APP.consumption_lines.map(x=>({Data:eventById(x.event_id)?.event_date,Evento:eventById(x.event_id)?.name,Area:area(x.area_id)?.name,Prodotto:product(x.product_id)?.name,Quantita:x.quantity_base,Unita:x.unit,Costo_unitario:x.cost_unit,Costo_totale:x.cost_total,Origine:x.source_type==='stocktake'?'Carico / Reso':'Manuale',Note:x.notes}));
  const rev=APP.revenues.map(x=>({Data:eventById(x.event_id)?.event_date,Evento:eventById(x.event_id)?.name,Area:area(x.area_id)?.name,Contanti:x.cash,Carta_POS:x.card,Altro:x.other,Totale:revenueValue(x),Note:x.notes}));
  const counts=APP.stocktake_lines.map(x=>{const ses=APP.stocktake_sessions.find(s=>Number(s.id)===Number(x.session_id));return{Data:eventById(ses?.event_id)?.event_date,Evento:eventById(ses?.event_id)?.name,Area:area(ses?.area_id)?.name,Prodotto:product(x.product_id)?.name,Carico_iniziale:x.opening_qty,Rimanenza_finale:x.closing_qty,Consumo:x.consumed_qty,Note:ses?.notes}});
  const wh=APP.products.map(p=>{const q=stocks[p.id]||0,c=purchaseStats(p.id).avg;return{Prodotto:p.name,Categoria:p.category,Formato:p.format,Giacenza:q,Unita:p.base_unit,Casse_intere:p.units_per_case>1?Math.floor(q/p.units_per_case):'',Pezzi_residui:p.units_per_case>1?q%p.units_per_case:'',Costo_medio:c,Valore:Math.max(0,q)*c}});
  const mov=APP.movements.map(x=>({Data:x.movement_date,Tipo:movementLabel(x.movement_type),Prodotto:product(x.product_id)?.name,Quantita:x.quantity_delta,Costo_unitario:x.unit_cost,Area:area(x.area_id)?.name||'',Provenienza:x.source_type,Note:x.notes}));
  [['Ordini e fatture',invoices],['Dettaglio acquisti',ilines],['Listino prezzi',prod],['Consumi',cons],['Incassi',rev],['Carico e reso',counts],['Giacenza magazzino',wh],['Movimenti',mov]].forEach(([n,d])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(d),n.slice(0,31)));
  XLSX.writeFile(wb,`TimeToParty_Magazzino_${today()}.xlsx`);toast('Excel esportato');
}

function enhancedOpenEvent(id){
  const e=eventById(id),lines=APP.consumption_lines.filter(x=>Number(x.event_id)===Number(id));
  const groups={};lines.forEach(x=>{const a=area(x.area_id)?.name||'Senza area';(groups[a]=groups[a]||[]).push(x)});
  const rev=eventRevenue(id),cost=eventCost(id),margin=rev-cost;
  openModal(`<div class="modalhead"><div><h2>${esc(e.name)}</h2><small>${dateIt(e.event_date)} · ${esc(e.location||'')}</small></div><button class="closebtn" data-close>×</button></div>
  <div class="detailgrid"><div class="detailbox"><small>Incassi</small><b>${eur(rev)}</b></div><div class="detailbox"><small>Costo consumi</small><b>${eur(cost)}</b></div><div class="detailbox"><small>Margine lordo</small><b style="color:${margin<0?'var(--bad)':'var(--ok)'}">${eur(margin)}</b></div><div class="detailbox"><small>Unità consumate</small><b>${num(eventQty(id),eventQty(id)%1?1:0)}</b></div></div>
  <div class="actions"><button class="btn small" onclick="closeModal();openConsumption(${id})">+ Consumo manuale</button><button class="btn secondary small" onclick="closeModal();openStocktake(null,${id})">Carico / Reso</button><button class="btn secondary small" onclick="closeModal();openRevenue(null,${id})">+ Incasso</button><button class="btn secondary small" onclick="closeModal();openEditEvent(${id})">Modifica serata</button></div>
  ${Object.entries(groups).map(([name,arr])=>`<div class="section"><div class="sectiontitle"><h2>${esc(name)}</h2><span>${eur(arr.reduce((s,x)=>s+Number(x.cost_total||0),0))}</span></div><div class="tablewrap"><table><thead><tr><th>Prodotto</th><th>Quantità</th><th>Costo unit.</th><th>Totale</th><th></th></tr></thead><tbody>${arr.map(x=>`<tr><td><b>${esc(product(x.product_id)?.name||'')}</b>${x.source_type==='stocktake'?'<br><small style="color:var(--muted)">Da carico/residuo</small>':''}</td><td>${num(x.quantity_base,x.quantity_base%1?2:0)} ${esc(x.unit)}</td><td>${eur(x.cost_unit)}</td><td><b>${eur(x.cost_total)}</b></td><td><button class="btn secondary small" onclick="deleteConsumption(${x.id},${id})">Elimina</button></td></tr>`).join('')}</tbody></table></div></div>`).join('')}`);
}

function install(){
  if(window.__TTP_WAREHOUSE_EXT_READY)return;
  ensureExtendedState();
  installStyles();
  installViews();
  const eventIndex=NAV.findIndex(x=>x[0]==='events');
  if(!NAV.some(x=>x[0]==='revenues'))NAV.splice(eventIndex+1,0,['revenues','€','Incassi'],['counts','◫','Carico / Reso']);
  const baseRenderView=renderView;
  renderView=function(id){ensureExtendedState();if(id==='revenues')return renderRevenues();if(id==='counts')return renderCounts();return baseRenderView(id)};
  renderAll=function(){ensureExtendedState();NAV.forEach(([id])=>renderView(id))};
  openEvent=enhancedOpenEvent;
  exportExcel=enhancedExportExcel;
  const baseDeleteConsumption=deleteConsumption;
  deleteConsumption=async function(id,eventId){const current=APP.consumption_lines.find(x=>Number(x.id)===Number(id));if(current?.source_type==='stocktake'){alert('Questo consumo è stato calcolato dal Carico / Reso. Modifica o elimina il relativo controllo per aggiornare correttamente tutte le quantità.');return}return baseDeleteConsumption(id,eventId)};
  window.renderRevenues=renderRevenues;
  window.openRevenue=openRevenue;
  window.deleteRevenue=deleteRevenue;
  window.renderCounts=renderCounts;
  window.openStocktake=openStocktake;
  window.deleteStocktake=deleteStocktake;
  window.revenueValue=revenueValue;
  window.eventRevenue=eventRevenue;
  window.eventMargin=eventMargin;
  buildNav();
  renderAll();
  navigate(location.hash.replace('#/','')||'dashboard',false);
  window.__TTP_WAREHOUSE_EXT_READY=true;
  window.dispatchEvent(new CustomEvent('ttp-warehouse-extension-ready'));
}

try{install()}catch(error){console.error('Time To Party extension error',error);window.__TTP_WAREHOUSE_EXT_ERROR=String(error?.message||error)}
})();