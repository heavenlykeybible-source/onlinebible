import {describe,it,expect,vi} from "vitest";
import {makeApprovalHandler} from "../account4/worker/approval-handler";
const url="https://control.heavenlykey.org/api/control/releases/approve";
const request=(origin="https://control.heavenlykey.org")=>new Request(url,{method:"POST",headers:{"Origin":origin,"Content-Type":"application/json"},body:JSON.stringify({siteId:"123e4567-e89b-42d3-a456-426614174000",releaseId:"123e4567-e89b-42d3-a456-426614174001",sha256:"a".repeat(64)})});
describe("Account 4 approval HTTP boundary",()=>{
 it("rejects a cross-origin write before authentication",async()=>{
  const verify=vi.fn();
  const result=await makeApprovalHandler(verify)(request("https://other.example"),{} as never);
  expect(result.status).toBe(403);expect(verify).not.toHaveBeenCalled();
 });
 it("rejects missing Owner identity before database access",async()=>{
  const result=await makeApprovalHandler(async()=>null)(request(),{} as never);
  expect(result.status).toBe(403);
 });
 it("rejects non-owner identity",async()=>{
  const result=await makeApprovalHandler(async()=>({userId:"u",role:"editor"} as never))(request(),{} as never);
  expect(result.status).toBe(403);
 });
 it("rejects malformed release identifiers",async()=>{
  const bad=new Request(url,{method:"POST",headers:{"Origin":"https://control.heavenlykey.org","Content-Type":"application/json"},body:JSON.stringify({siteId:"bad",releaseId:"bad",sha256:"bad"})});
  const result=await makeApprovalHandler(async()=>({userId:"owner",role:"owner"}))(bad,{} as never);
  expect(result.status).toBe(400);
 });
});
