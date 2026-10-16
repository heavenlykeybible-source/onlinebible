import {describe,it,expect} from "vitest";
import {approvePreview} from "../account4/worker/release-approval";
const hash="a".repeat(64);
function mockDb(status:string="preview",digest=hash,changes=1){
 const statements:string[]=[];
 const db={prepare(sql:string){statements.push(sql);return {bind(..._args:unknown[]){return {first:async()=>({id:"release",site_id:"site",artifact_sha256:digest,status,approved_by:null}),run:async()=>({meta:{changes}})}}}}};
 return {db,statements};
}
const request={releaseId:"release",siteId:"site",expectedSha256:hash,ownerUserId:"owner"};
describe("Account 4 atomic release approval",()=>{
 it("approves exact preview digest with compare-and-swap update",async()=>{
  const {db,statements}=mockDb();
  expect(await approvePreview(db,request)).toBe("approved");
  expect(statements[1]).toContain("status='preview'");
  expect(statements[1]).toContain("artifact_sha256=?");
 });
 it("rejects changed digest without mutation",async()=>{
  const {db,statements}=mockDb("preview","b".repeat(64));
  expect(await approvePreview(db,request)).toBe("conflict");
  expect(statements).toHaveLength(1);
 });
 it("rejects a release that was not previewed",async()=>{
  const {db,statements}=mockDb("draft");
  expect(await approvePreview(db,request)).toBe("conflict");
  expect(statements).toHaveLength(1);
 });
 it("returns conflict when a competing approval changes the row",async()=>{
  const {db}=mockDb("preview",hash,0);
  expect(await approvePreview(db,request)).toBe("conflict");
 });
 it("rejects invalid digest without database access",async()=>{
  const {db,statements}=mockDb();
  expect(await approvePreview(db,{...request,expectedSha256:"invalid"})).toBe("conflict");
  expect(statements).toHaveLength(0);
 });
});
