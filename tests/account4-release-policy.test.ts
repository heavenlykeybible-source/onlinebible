import {describe,it,expect} from "vitest";
import {approveRelease,canTransition,sha256Valid} from "../account4/worker/release-policy";
const hash="a".repeat(64);
describe("Account 4 immutable release policy",()=>{
 it("requires exact SHA-256",()=>{expect(sha256Valid(hash)).toBe(true);expect(sha256Valid("bad")).toBe(false)});
 it("prevents skipping preview and approval",()=>{
  expect(canTransition("draft","deployed")).toBe(false);
  expect(canTransition("preview","approved")).toBe(true);
  expect(canTransition("preview","deployed")).toBe(false);
  expect(canTransition("approved","deploying")).toBe(true);
 });
 it("rejects changed artifact after preview",()=>{
  expect(()=>approveRelease({releaseId:"r",siteId:"s",artifactSha256:hash,expectedSha256:"b".repeat(64),state:"preview",actorId:"owner",now:"2026-10-16"})).toThrow();
 });
 it("rejects approval without preview",()=>{
  expect(()=>approveRelease({releaseId:"r",siteId:"s",artifactSha256:hash,expectedSha256:hash,state:"draft",actorId:"owner",now:"2026-10-16"})).toThrow();
 });
 it("records Owner approval for the exact digest",()=>{
  expect(approveRelease({releaseId:"r",siteId:"s",artifactSha256:hash,expectedSha256:hash,state:"preview",actorId:"owner",now:"2026-10-16"}).artifactSha256).toBe(hash);
 });
});
