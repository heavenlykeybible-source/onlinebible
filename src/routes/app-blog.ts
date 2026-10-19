/** Public feed only: fixed upstream, bounded bytes, no visitor cookies or arbitrary proxy URL. */
export async function handleAppBlog(upstreamFetch:typeof fetch=fetch):Promise<Response>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 const headers={'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Cache-Control':'public, max-age=300'};
 try{
  const response=await upstreamFetch('https://blog.heavenlykey.org/feeds/posts/default?alt=json&max-results=12',{headers:{Accept:'application/json'},redirect:'error',credentials:'omit',signal:controller.signal});
  if(!response.ok)throw Error('Feed unavailable');
  const reader=response.body?.getReader();if(!reader)throw Error('Empty feed');const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>1500000){await reader.cancel();throw Error('Feed too large')}chunks.push(value)}}finally{reader.releaseLock()}
  const buffer=new Uint8Array(length);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length}
  const data=JSON.parse(new TextDecoder().decode(buffer));if(!Array.isArray(data?.feed?.entry))throw Error('Invalid feed');
  const string=(value:unknown,max:number)=>typeof value==='string'?value.slice(0,max):'';
  const entries=data.feed.entry.slice(0,12).filter((item:any)=>item&&typeof item==='object').map((item:any)=>({title:string(item.title?.$t,240),published:string(item.published?.$t,50),content:string(item.content?.$t||item.summary?.$t,90000)}));
  return new Response(JSON.stringify({entries}),{headers});
 }catch{return new Response(JSON.stringify({error:'The ministry blog feed is temporarily unavailable.'}),{status:502,headers:{...headers,'Cache-Control':'no-store'}})}finally{clearTimeout(timer)}
}
