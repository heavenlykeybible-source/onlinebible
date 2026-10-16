const BLOG = 'https://blog.heavenlykey.org';
const MAX_BYTES = 524288;
function safeLink(value: unknown) {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && [BLOG, 'https://heavenlykey.blogspot.com'].includes(url.origin) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export async function handlePublicBlogFeed(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const headers = {'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
  if (request.method !== 'GET') return Response.json({error:'Method not allowed'}, {status:405,headers:{...headers,Allow:'GET'}});
  try {
    const response = await fetcher(BLOG+'/feeds/posts/default?alt=json&max-results=5', {headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'});
    if (!response.ok || !response.body) throw Error('Feed unavailable');
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const {value,done} = await reader.read(); if(done)break; size+=value.length; if(size>MAX_BYTES){await reader.cancel();throw Error('Feed too large');} chunks.push(value); } } finally {reader.releaseLock();}
    const bytes = new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(data?.feed?.entry)) throw Error('Invalid feed');
    const entry = data.feed.entry.slice(0,5).flatMap((post: any) => {
      const href = safeLink((Array.isArray(post.link)?post.link:[]).find((link:any)=>link.rel==='alternate')?.href);
      if (!href) return [];
      const image = post.media$thumbnail?.url;
      return [{title:{$t:String(post.title?.$t||'Ministry message').slice(0,300)},summary:{$t:String(post.summary?.$t||post.content?.$t||'').slice(0,5000)},published:{$t:String(post.published?.$t||'').slice(0,50)},link:[{rel:'alternate',href}],...(typeof image==='string'&&/^https:\/\//i.test(image)?{media$thumbnail:{url:image.slice(0,2000)}}:{})}];
    });
    return Response.json({feed:{entry}}, {headers:{...headers,'Cache-Control':'public, max-age=300'}});
  } catch { return Response.json({error:'Latest posts are temporarily unavailable. Visit our official blog.'}, {status:503,headers:{...headers,'Cache-Control':'public, max-age=30'}}); }
}
