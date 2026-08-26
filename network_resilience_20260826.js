(function(){
'use strict';
if(window.__TTP_NETWORK_RESILIENCE)return;
window.__TTP_NETWORK_RESILIENCE=true;
const nativeFetch=window.fetch.bind(window);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function isSupabaseRequest(input){
 try{
  const raw=typeof input==='string'?input:(input&&input.url)||'';
  const u=new URL(raw,location.href);
  return u.hostname.endsWith('.supabase.co');
 }catch(_){return false}
}
function isRetryable(error){
 const text=String(error?.message||error||'').toLowerCase();
 return error instanceof TypeError||text.includes('load failed')||text.includes('failed to fetch')||text.includes('network')||text.includes('connection');
}
window.fetch=async function(input,init){
 if(!isSupabaseRequest(input))return nativeFetch(input,init);
 let lastError;
 for(let attempt=0;attempt<4;attempt++){
  try{return await nativeFetch(input,init)}catch(error){
   lastError=error;
   if(!isRetryable(error)||attempt===3)throw error;
   await sleep([350,800,1600][attempt]||1600);
  }
 }
 throw lastError;
};
})();
