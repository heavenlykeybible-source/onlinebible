// Read-only production timing check: no deployments, configuration or credentials.
const endpoint='https://heavenlykey-cms-public.emmanuel2026miracle.workers.dev/v1/assistant';
for(const message of ['Hello, what is Heavenly Key Evangelistic Movement?','How can I find the radio player?']){
 const start=performance.now();try{const r=await fetch(endpoint,{method:'POST',headers:{Origin:'https://heavenlykey.org','Content-Type':'application/json'},body:JSON.stringify({message}),signal:AbortSignal.timeout(30000)});const headersMs=Math.round(performance.now()-start),data=await r.json();console.log(JSON.stringify({message,status:r.status,headersMs,completeMs:Math.round(performance.now()-start),answerCharacters:data.response?.length||0,errorCode:data.code||null}));if(!r.ok||!data.response?.trim())process.exitCode=1;}catch(e){console.log(JSON.stringify({message,error:e.name,completeMs:Math.round(performance.now()-start)}));process.exitCode=1;}
}
