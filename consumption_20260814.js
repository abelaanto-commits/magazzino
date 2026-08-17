(function(){
'use strict';

window.applyConsumption20260814=function(state){
 const marker='consumption_20260814_v1';
 state.meta=state.meta||{};
 if(state.meta[marker])return false;
 state.products=Array.isArray(state.products)?state.products:[];
 state.product_aliases=Array.isArray(state.product_aliases)?state.product_aliases:[];
 state.events=Array.isArray(state.events)?state.events:[];
 state.areas=Array.isArray(state.areas)?state.areas:[];
 state.consumption_lines=Array.isArray(state.consumption_lines)?state.consumption_lines:[];
 state.movements=Array.isArray(state.movements)?state.movements:[];
 state.audit_logs=Array.isArray(state.audit_logs)?state.audit_logs:[];
 const now=new Date().toISOString(),date='2026-08-14',prefix='CONS-20260814-';
 const next=list=>Array.isArray(list)&&list.length?Math.max(...list.map(x=>Number(x.id)||0))+1:1;
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const findProduct=names=>{
  for(const name of names){const n=clean(name),p=state.products.find(x=>clean(x.name)===n);if(p)return p}
  for(const name of names){const n=clean(name),a=state.product_aliases.find(x=>clean(x.alias)===n);if(a){const p=state.products.find(x=>Number(x.id)===Number(a.product_id));if(p)return p}}
  return null;
 };
 const specs={
  tanq:[['Gin Tanqueray 1 L','GIN TANQUERAY LT 1'],35],
  vodka:[['Vodka Smirnoff Red 1 L','VODKA SMIRNOFF RED LT 1'],13],
  rumwhite:[['Rum bianco 1 L','Rum bianco'],1],
  triple:[['Triple Sec 1 L','Triple Sec'],1],
  fragvodka:[['Vodka fragola 1 L','Vodka fragola'],1],
  peachvodka:[['Vodka pesca 1 L','Vodka pesca'],2],
  vermouth:[['Vermouth rosso 1 L','Vermouth rosso'],6],
  bitter:[['Bitter Martini 1 L','APERITIVO BITTER MARTINI LT 1'],8],
  whiskey:[['Bulleit','Whisky Bulleit 1 L','Whiskey Bulleit'],1],
  aperol:[['Aperol 1 L','Aperol'],2],
  prosecco:[['Prosecco Serena','Prosecco'],11],
  tanq0:[['Gin Tanqueray 0.0 70 cl','GIN TANQUERAY ALCOOL FREE CL 70'],2],
  lemon:[['Lemon','Limonata Verdello'],37],
  tonica:[['Tonica','Tonica Tomarchio'],58],
  coca:[['Coca-Cola 1.5 L','Coca-Cola 1,5 L','COCA COLA LT 1.5X6'],9],
  strawberry:[['Sciroppo fragola','Fragola'],2],
  sweet:[['Sweet & Sour','Sweet and Sour'],5],
  cups355:[['Bicchieri 355 cc – stecca da 30','Bicchieri 355'],45],
  cups250:[['Bicchieri 250 cc – stecca da 50','Bicchieri 250'],6],
  straws:[['Cannucce','Cannucce 7×21 – confezione 1.000','Cannucce 7x21'],2],
  ciroc:[['Vodka Ciroc 70 cl','Ciroc 70 cl','Ciroc'],1],
  ketel:[['Vodka Ketel One 1 L','VODKA KETEL ONE LT 1','Ketel One'],2],
  donjulio:[['Tequila Don Julio Reposado 70 cl','TEQUILA DON JULIO REPOSADO CL 70','Don Julio Reposado'],6],
  casamigos:[['Tequila Casamigos Blanco 70 cl','TEQUILA CASAMIGOS BLANCO CL 70','Casamigos Blanco'],1],
  orange:[['Succo arancia','Arancia'],2],
  pineapple:[['Succo ananas','Ananas'],1],
  tanq10:[['Gin Tanqueray Ten 70 cl','GIN TANQUERAY TEN CL 70','Tanqueray Ten'],2]
 };
 const P={};const missing=[];
 for(const [key,[names]] of Object.entries(specs)){P[key]=findProduct(names);if(!P[key])missing.push(names[0])}
 if(missing.length)throw new Error('Consumo 14/08 non caricato: prodotti mancanti nel catalogo: '+missing.join(', '));

 // Ripulisce solo un eventuale tentativo incompleto di questa stessa migrazione.
 const oldLineIds=new Set(state.consumption_lines.filter(x=>String(x.notes||'').includes(prefix)).map(x=>Number(x.id)));
 if(oldLineIds.size){state.movements=state.movements.filter(m=>!(m.source_type==='consumption_line'&&oldLineIds.has(Number(m.source_id))));state.consumption_lines=state.consumption_lines.filter(x=>!oldLineIds.has(Number(x.id)))}

 let event=state.events.find(e=>String(e.event_date)===date);
 if(!event){event={id:next(state.events),event_date:date,name:'Serata 14/08',location:'',notes:'Consumi caricati da riepilogo operativo',created_at:now};state.events.push(event)}
 const ensureArea=(names,canonical)=>{let a=state.areas.find(x=>names.some(n=>clean(x.name)===clean(n)));if(!a){a={id:next(state.areas),name:canonical,active:1,created_at:now};state.areas.push(a)}return a};
 const bar1=ensureArea(['Bar 1','Bar1'],'Bar 1'),bar2=ensureArea(['Bar 2','Bar2'],'Bar 2'),tables=ensureArea(['Tavoli','Tables'],'Tavoli');

 const groups=[
  {area:bar1,label:'BAR1',display:'Bar 1',entries:[
   [P.tanq,35],[P.vodka,13],[P.rumwhite,1],[P.triple,1],[P.fragvodka,1],[P.peachvodka,2],[P.vermouth,6],[P.bitter,8],[P.whiskey,1],[P.aperol,2],[P.prosecco,11],[P.tanq0,2],
   [P.lemon,37],[P.tonica,58],[P.coca,9],[P.strawberry,2],[P.sweet,5],[P.cups355,45],[P.cups250,6],[P.straws,2]
  ]},
  {area:bar2,label:'BAR2',display:'Bar 2',entries:[
   [P.tanq,13],[P.vodka,2],[P.vermouth,1],[P.bitter,1],[P.fragvodka,1],[P.peachvodka,1],[P.prosecco,4],[P.cups355,18],[P.cups250,4],[P.straws,1],
   [P.lemon,25],[P.tonica,54],[P.strawberry,1],[P.sweet,1],[P.coca,8],[P.orange,2],[P.pineapple,1]
  ]},
  {area:tables,label:'TAVOLI',display:'Tavoli',entries:[
   [P.tanq,36],[P.tanq10,2],[P.ciroc,1],[P.prosecco,4],[P.ketel,2],[P.donjulio,6],[P.casamigos,1],[P.cups250,16],[P.lemon,41],[P.tonica,57]
  ]}
 ];
 let loadedLines=0,loadedUnits=0;
 for(const group of groups){
  for(const [p,qty] of group.entries){
   const code=`${prefix}${group.label}-${p.id}`;
   const cost=typeof avgCost==='function'?Number(avgCost(p.id)||0):0;
   const cid=next(state.consumption_lines);
   state.consumption_lines.push({id:cid,event_id:event.id,area_id:group.area.id,product_id:p.id,quantity_base:qty,unit:p.base_unit,cost_unit:cost,cost_total:qty*cost,notes:`Consumo 14/08 · ${group.display} · ${code}`,source_type:'manual_import',source_id:null,created_at:now});
   state.movements.push({id:next(state.movements),movement_date:date,movement_type:'consumo',product_id:p.id,quantity_delta:-qty,unit_cost:cost,source_type:'consumption_line',source_id:cid,area_id:group.area.id,user_id:null,notes:`Consumo 14/08 · ${group.display} [${code}]`,created_at:now});
   loadedLines++;loadedUnits+=qty;
  }
 }
 state.audit_logs.push({id:next(state.audit_logs),action:'caricamento consumi 14/08/2026',entity_type:'event',entity_id:event.id,details:'Caricati 47 consumi: Bar 1 20 righe / 247 unità, Bar 2 17 righe / 138 unità, Tavoli 10 righe / 166 unità. Totale 551 unità. Mappature confermate: Vodka=Smirnoff, Rum=Rum bianco, Whiskey=Bulleit, Coca-Cola=1.5 L.',created_at:now});
 state.meta[marker]={applied_at:now,event_id:event.id,event_date:date,loaded_lines:loadedLines,total_units:loadedUnits,bar1_units:247,bar2_units:138,tables_units:166,anti_duplicate:true};
 return true;
};
})();
