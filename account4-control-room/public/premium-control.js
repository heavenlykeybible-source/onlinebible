/* Operational summaries come from authenticated APIs, never illustrative metrics. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const date=value=>value?new Intl.DateTimeFormat('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'}).format(new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(value)?value:value.replace(' ','T')+'Z'))+' WAT':'—';
async function data(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('Sign in to view recorded activity.');return r.json()}
async function refresh(){try{const [releases,edits]=await Promise.all([data('/api/releases'),data('/api/awaiting-room')]);const pending=(releases.items||[]).filter(r=>!r.approved_at).length+(edits.items||[]).filter(r=>r.status!=='approved').length;$('#pending-total').textContent=String(pending);
 const approved=[...(releases.items||[]).filter(r=>r.approved_at).map(r=>({at:r.approved_at,actor:r.approved_by,state:r.active_id===r.id?(r.working===1?'Live · verified':'Approved · live check pending'):'Approved · replaced'})),...(edits.items||[]).filter(r=>r.status==='approved').map(r=>({at:r.approvedAt,actor:r.approvedBy,state:'Content approved · site check pending'}))].sort((a,b)=>new Date(b.at)-new Date(a.at));
 if(approved[0]){$('#latest-actor').textContent=approved[0].actor||'Not recorded';$('#latest-approved').textContent=date(approved[0].at);$('#latest-deployment').textContent=approved[0].state}
 }catch(e){$('#pending-total').textContent='—';$('#latest-deployment').textContent=e.message}}
const editor=$('#website-editor');document.querySelectorAll('a[href="#website-editor"]').forEach(a=>a.addEventListener('click',()=>{editor.open=true}));
for(const id of ['release-refresh','refresh-awaiting'])$('#'+id).addEventListener('click',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
refresh();
})();
