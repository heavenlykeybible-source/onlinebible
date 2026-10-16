// Relay answer text only; provider thoughts, credentials and metadata stay private.
export function assistantStream(upstream,{origin='*',finish=()=>{},abort=()=>{}}={}){
 const encoder=new TextEncoder(),decoder=new TextDecoder();
 const reader=upstream.body.getReader();let cancelled=false;
 const body=new ReadableStream({
  async start(controller){
   let pending='',answer='',stopped=false;
   const emit=value=>{if(!cancelled)controller.enqueue(encoder.encode(JSON.stringify(value)+'\n'));};
   function event(block){
    const data=block.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');
    if(!data||data==='[DONE]')return;
    const value=JSON.parse(data);if(value.error||value.promptFeedback?.blockReason)throw Error('Provider blocked response');
    const candidate=value.candidates?.[0];
    if(candidate?.finishReason&&!['STOP','MAX_TOKENS'].includes(candidate.finishReason))throw Error('Provider blocked response');
    for(const part of candidate?.content?.parts||[]){if(part.thought||typeof part.text!=='string')continue;const delta=part.text.slice(0,6000-answer.length);if(delta){answer+=delta;emit({delta});}}
    if(candidate?.finishReason)stopped=true;
   }
   try{
    while(!cancelled){const {value,done}=await reader.read();pending+=decoder.decode(value||new Uint8Array(),{stream:!done}).replace(/\r\n/g,'\n');let end;while((end=pending.indexOf('\n\n'))>=0){event(pending.slice(0,end));pending=pending.slice(end+2);}if(pending.length>262144)throw Error('Oversize stream event');if(done)break;}
    if(cancelled)return;
    if(pending.trim())event(pending);
    if(!answer.trim()||!stopped)throw Error('Incomplete model response');
    emit({done:true});
   }catch{emit({error:'The reply was interrupted. Please try again.'});}
   finally{finish();if(!cancelled){await reader.cancel().catch(()=>{});controller.close();}}
  },
  async cancel(){cancelled=true;abort();finish();await reader.cancel().catch(()=>{});}
 });
 return new Response(body,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','X-Content-Type-Options':'nosniff'}});
}
