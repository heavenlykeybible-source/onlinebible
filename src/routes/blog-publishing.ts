import type { Env } from "../services/auth-service";
import { requireMinimumRole } from "../middleware/rbac";
import * as Blog from "../services/blog-publishing-service";

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const error=(message:string,status=400)=>json({error:{message}},status);

export async function handlePublicBlogPosts(request:Request,env:Env,slug?:string) {
  if(request.method!=="GET")return error("Method not allowed.",405);
  if(slug){
    const post=await Blog.getPublicBlogPost(env,slug);
    return post?json({post}):error("Article not found.",404);
  }
  const limit=Number(new URL(request.url).searchParams.get("limit")||20);
  return json({items:await Blog.listPublicBlogPosts(env,limit)});
}
export async function handleAdminBlogPosts(request:Request,env:Env,postId?:number,action?:string) {
  const actor=await requireMinimumRole(request,env,"Administrator");
  if(!actor)return error("Administrator access required.",403);
  try {
    if(request.method==="GET"&&!postId)return json({items:await Blog.listAdminBlogPosts(env)});
    if(request.method==="POST"&&!postId){
      const body=await request.json<any>();
      const post=await Blog.createBlogPost(env,body,actor.userId);
      return json({post},201);
    }
    if(request.method==="POST"&&postId&&action==="publish"){
      return json({result:await Blog.publishBlogPost(env,postId,actor.userId)});
    }
    return error("Method not allowed.",405);
  } catch(e) { return error(e instanceof Error?e.message:"Blog publishing failed."); }
}
