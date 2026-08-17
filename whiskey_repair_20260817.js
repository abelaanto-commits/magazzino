(function(){
'use strict';
window.applyWhiskeyRepair20260817=function(state){
 const marker='whiskey_1408_four_roses_repair_v2';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 for(const k of ['products','events','consumption_lines','movements','audit_logs'])state[k]=Array.isArray(state[k])?state[k]:[];
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const four=state.products.find(p=>norm(p.name)==='WHISKY FOUR ROSES 1 L'||norm(p.name)==='WHISKEY FOUR ROSES 1 L');
 const bulleit=state.products.find(p=>norm(p.name)==='BULLEIT');
 if(!four)throw new Error('Correzione whiskey 14/08 non applicata: Four Roses 1 L non trovato nel catalogo.');
 const eventIds=new Set(state.events.filter(e=>String(e.event_date)==='2026-08-14').map(e=>Number(e.id)));
 const whiskeyLines=state.consumption_lines.filter(l=>{
   if(!eventIds.has(Number(l.event_id))||Number(l.quantity_base)!==1)return false;
   const p=state.products.find(x=>Number(x.id)===Number(l.product_id)),n=norm(p?.name);
   const note=String(l.notes||'');
   return note.includes('CONS-20260814-BAR1')&&(n.includes('FOUR ROSES')||n==='BULLEIT'||n.includes('WHISK'));
 });
 if(!whiskeyLines.length)throw new Error('Correzione whiskey 14/08 non applicata: riga consumo whiskey non trovata.');
 // Tiene una sola riga: preferisce una Four Roses già esistente, altrimenti converte la prima.
 let keep=whiskeyLines.find(l=>Number(l.product_id)===Number(four.id))||whiskeyLines[0];
 const oldProduct=state.products.find(p=>Number(p.id)===Number(keep.product_id));
 const removeIds=new Set(whiskeyLines.filter(l=>Number(l.id)!==Number(keep.id)).map(l=>Number(l.id)));
 if(removeIds.size){
   state.movements=state.movements.filter(m=>!(m.source_type==='consumption_line'&&removeIds.has(Number(m.source_id))));
   state.consumption_lines=state.consumption_lines.filter(l=>!removeIds.has(Number(l.id)));
 }
 keep.product_id=four.id;keep.quantity_base=1;keep.unit=four.base_unit||'bottiglia';
 keep.notes=String(keep.notes||'').replace(/Bulleit/gi,'Four Roses')+' · Mappatura definitiva: WHISKEY = Four Roses 1 L';
 const linked=state.movements.filter(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(keep.id));
 if(!linked.length){state.movements.push({id:next(state.movements),movement_date:'2026-08-14',movement_type:'consumo',product_id:four.id,quantity_delta:-1,unit_cost:Number(keep.cost_unit||0),source_type:'consumption_line',source_id:keep.id,area_id:keep.area_id??null,user_id:null,notes:'Consumo whiskey 14/08 corretto su Four Roses [WHISKEY-1408-FOUR-ROSES]',created_at:new Date().toISOString()})}
 else{
   linked[0].product_id=four.id;linked[0].quantity_delta=-1;linked[0].movement_type='consumo';linked[0].notes=String(linked[0].notes||'')+' · Mappatura definitiva: Four Roses 1 L';
   const dupMovIds=new Set(linked.slice(1).map(m=>Number(m.id)));if(dupMovIds.size)state.movements=state.movements.filter(m=>!dupMovIds.has(Number(m.id)));
 }
 state.audit_logs.push({id:next(state.audit_logs),action:'correzione definitiva mapping whiskey 14/08',entity_type:'consumption_line',entity_id:keep.id,details:`Confermata una sola riga da 1 bottiglia su Whisky Four Roses 1 L. Eliminate ${removeIds.size} eventuali righe whiskey duplicate/errate. Mappatura precedente: ${oldProduct?.name||'n/d'}.`,created_at:new Date().toISOString()});
 state.meta[marker]={applied_at:new Date().toISOString(),line_id:keep.id,removed_duplicate_lines:removeIds.size,from_product:oldProduct?.name||null,to_product:four.name,quantity:1,expected_bulleit_stock:0,expected_four_roses_stock:5};
 return true;
};
})();
