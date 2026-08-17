(function(){
'use strict';
window.applyWhiskeyRepair20260817=function(state){
 const marker='whiskey_1408_four_roses_repair_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 for(const k of ['products','events','consumption_lines','movements','audit_logs'])state[k]=Array.isArray(state[k])?state[k]:[];
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const next=list=>list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const four=state.products.find(p=>norm(p.name)==='WHISKY FOUR ROSES 1 L'||norm(p.name)==='WHISKEY FOUR ROSES 1 L');
 if(!four)throw new Error('Correzione whiskey 14/08 non applicata: Four Roses 1 L non trovato nel catalogo.');
 const eventIds=new Set(state.events.filter(e=>String(e.event_date)==='2026-08-14').map(e=>Number(e.id)));
 const candidates=state.consumption_lines.filter(l=>eventIds.has(Number(l.event_id))&&(
   String(l.notes||'').includes('CONS-20260814-BAR1')
 ));
 let line=candidates.find(l=>{
   const p=state.products.find(x=>Number(x.id)===Number(l.product_id));
   return p&&(/BULLEIT/.test(norm(p.name))||/WHISK/.test(norm(p.name)))&&Number(l.quantity_base)===1;
 });
 if(!line){
   const bulleit=state.products.find(p=>norm(p.name)==='BULLEIT');
   if(bulleit)line=state.consumption_lines.find(l=>eventIds.has(Number(l.event_id))&&Number(l.product_id)===Number(bulleit.id)&&Number(l.quantity_base)===1);
 }
 if(!line)throw new Error('Correzione whiskey 14/08 non applicata: riga consumo whiskey non trovata.');
 const oldProduct=state.products.find(p=>Number(p.id)===Number(line.product_id));
 line.product_id=four.id;
 line.unit=four.base_unit||'bottiglia';
 line.notes=String(line.notes||'').replace(/Bulleit/gi,'Four Roses')+' · Mappatura corretta: WHISKEY = Four Roses 1 L';
 const linked=state.movements.filter(m=>m.source_type==='consumption_line'&&Number(m.source_id)===Number(line.id));
 if(!linked.length){
   state.movements.push({id:next(state.movements),movement_date:'2026-08-14',movement_type:'consumo',product_id:four.id,quantity_delta:-1,unit_cost:Number(line.cost_unit||0),source_type:'consumption_line',source_id:line.id,area_id:line.area_id??null,user_id:null,notes:'Consumo whiskey 14/08 corretto su Four Roses [WHISKEY-1408-FOUR-ROSES]',created_at:new Date().toISOString()});
 }else{
   linked[0].product_id=four.id;linked[0].quantity_delta=-1;linked[0].movement_type='consumo';linked[0].notes=String(linked[0].notes||'')+' · Mappatura corretta: Four Roses 1 L';
   const dupIds=new Set(linked.slice(1).map(m=>Number(m.id)));if(dupIds.size)state.movements=state.movements.filter(m=>!dupIds.has(Number(m.id)));
 }
 state.audit_logs.push({id:next(state.audit_logs),action:'correzione mapping whiskey 14/08',entity_type:'consumption_line',entity_id:line.id,details:`Consumo 1 bottiglia del 14/08 spostato da ${oldProduct?.name||'referenza precedente'} a Whisky Four Roses 1 L, coerentemente con la referenza storica WHISKEY dei fogli bar.`,created_at:new Date().toISOString()});
 state.meta[marker]={applied_at:new Date().toISOString(),line_id:line.id,from_product:oldProduct?.name||null,to_product:four.name,quantity:1,expected_bulleit_stock:0,expected_four_roses_stock:5};
 return true;
};
})();
