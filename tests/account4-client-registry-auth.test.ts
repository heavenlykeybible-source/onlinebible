import {describe,it,expect,vi} from "vitest";
import {createClientRegistryRouter} from "../account4/worker/client-registry";

const owner=async()=>({userId:"a1e51c5c-7fb2-41c4-91bd-60227dc48a16",role:"owner" as const});
const deny=async()=>null;
const db={prepare:vi.fn(()=>{throw new Error("DB should not be reached")})};
const endpoint="https://control.heavenlykey.org/api/control/clients";
describe("Account 4 client registry access",()=>{
 it("rejects missing owner before database access",async()=>{
  const response=await createClientRegistryRouter(deny)(new Request(endpoint),db);
  expect(response.status).toBe(403);
  expect(db.prepare).not.toHaveBeenCalled();
 });
 it("rejects cross-origin create before database access",async()=>{
  const response=await createClientRegistryRouter(owner)(new Request(endpoint,{method:"POST",headers:{"Origin":"https://evil.example","Content-Type":"application/json"},body:JSON.stringify({name:"Example"})}),db);
  expect(response.status).toBe(403);
  expect(db.prepare).not.toHaveBeenCalled();
 });
 it("rejects unsupported method before database access",async()=>{
  const response=await createClientRegistryRouter(owner)(new Request(endpoint,{method:"DELETE"}),db);
  expect(response.status).toBe(405);
  expect(db.prepare).not.toHaveBeenCalled();
 });
 it("rejects invalid names before database access",async()=>{
  const response=await createClientRegistryRouter(owner)(new Request(endpoint,{method:"POST",headers:{"Origin":"https://control.heavenlykey.org","Content-Type":"application/json"},body:JSON.stringify({name:" "})}),db);
  expect(response.status).toBe(400);
  expect(db.prepare).not.toHaveBeenCalled();
 });
});
