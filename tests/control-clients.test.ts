import {describe,it,expect,vi,beforeEach} from "vitest";
vi.mock("../src/middleware/rbac",()=>({requireMinimumRole:vi.fn()}));
import {requireMinimumRole} from "../src/middleware/rbac";
import {handleClientAccounts} from "../src/routes/control-clients";

const role=vi.mocked(requireMinimumRole);
function env(){
 const queries:string[]=[];
 const db={prepare:(sql:string)=>{queries.push(sql);return {
  bind(..._args:unknown[]){return this},
  async first(){return {id:"client-id"}},
  async all(){return {results:[]}},
  async run(){return {success:true}}
 }}};
 return {DB:db,queries};
}
const url="https://control.heavenlykey.org/api/control/clients";
const req=(method:string,body?:unknown,origin="https://control.heavenlykey.org")=>new Request(url,{method,headers:{"Origin":origin,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
describe("Account 4 client registry security",()=>{
 beforeEach(()=>role.mockReset());
 it("rejects unauthenticated callers without querying tenant records",async()=>{
  role.mockResolvedValue(null);
  const e=env();const response=await handleClientAccounts(req("GET"),e as never);
  expect(response.status).toBe(403);expect(e.queries).toHaveLength(0);
 });
 it("rejects cross-origin writes before database access",async()=>{
  role.mockResolvedValue({userId:1,roleName:"Super Administrator",level:5});
  const e=env();const response=await handleClientAccounts(req("POST",{name:"Client A"},"https://evil.example"),e as never);
  expect(response.status).toBe(403);expect(e.queries).toHaveLength(0);
 });
 it("rejects invalid client names",async()=>{
  role.mockResolvedValue({userId:1,roleName:"Super Administrator",level:5});
  const response=await handleClientAccounts(req("POST",{name:"   "}),env() as never);
  expect(response.status).toBe(400);
 });
 it("creates a client in the draft registry, not a deployment",async()=>{
  role.mockResolvedValue({userId:1,roleName:"Super Administrator",level:5});
  const e=env();const response=await handleClientAccounts(req("POST",{name:"Client A"}),e as never);
  expect(response.status).toBe(201);
  expect(e.queries.some(q=>q.includes("INSERT INTO control_clients"))).toBe(true);
  expect(e.queries.every(q=>!q.toLowerCase().includes("deploy"))).toBe(true);
 });
});
