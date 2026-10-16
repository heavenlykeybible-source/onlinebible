import {describe,it,expect} from "vitest";
import {approvePreview} from "../account4/worker/release-approval";
const hash="a".repeat(64);
function mockDb(status:string="preview",digest=hash,updateChanges=1,auditChanges=1){
 const statements:string[]=[];
 let batchCalled=0;
 const db={
  prepare(sql:string){statements.push(sql);return {bind(..._args:unknown[]){return this},first:async()=>({id:"release",site_id:"site",artifact_sha256:digest,status,approved_by:null}),run:async()=>({meta:{changes:1}})}},
  async batch(items:unknown[]){batchCalled++;expect(items).toHaveLength(2);return [{meta:{changes:updateChanges}},{meta:{changes:auditChanges}}]}
 };
 return {db,statements,get batchCalled(){return batchCalled}};
}
const request={releaseId:"release",siteId:"site",expectedSha256:hash,ownerUserId:"owner"};
describe("Account 4 atomic release approval",()=>{
 it("approves exact preview digest with a transactional audit",async()=>{
  const context=mockDb();
  expect(await approvePreview(context.db,request)).toBe("approved");
  expect(context.batchCalled).toBe(1);
  expect(context.statements[1]).toContain("status='preview'");
  expect(context.statements[2]).toContain("INSERT INTO control_client_audit");
 });
 it("rejects changed digest without mutation",async()=>{
  const context=mockDb("preview","b".repeat(64));
  expect(await approvePreview(context.db,request)).toBe("conflict");
  expect(context.batchCalled).toBe(0);
 });
 it("rejects a release that was not previewed",async()=>{
  const context=mockDb("draft");
  expect(await approvePreview(context.db,request)).toBe("conflict");
  expect(context.batchCalled).toBe(0);
 });
 it("returns conflict when competing approval changes the row",async()=>{
  const context=mockDb("preview",hash,0,0);
  expect(await approvePreview(context.db,request)).toBe("conflict");
 });
 it("requires the audit write to succeed",async()=>{
  const context=mockDb("preview",hash,1,0);
  expect(await approvePreview(context.db,request)).toBe("conflict");
 });
 it("rejects invalid digest without database access",async()=>{
  const context=mockDb();
  expect(await approvePreview(context.db,{...request,expectedSha256:"invalid"})).toBe("conflict");
  expect(context.statements).toHaveLength(0);
 });
});
