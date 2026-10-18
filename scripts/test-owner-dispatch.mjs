import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateOwnerDispatch} from './require-owner-dispatch.mjs';
import {readFileSync} from 'node:fs';
const sha='a'.repeat(40),event={inputs:{approved_commit:sha,confirmation:'APPROVE_PRODUCTION_CHANGE'}};
const env={GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'heavenlykeybible-source/onlinebible',GITHUB_ACTOR:'heavenlykeybible-source',GITHUB_SHA:sha};
test('manual maintenance requires owner, confirmation and the exact reviewed checkout',()=>{
 assert.equal(validateOwnerDispatch(event,env,sha),true);
 assert.throws(()=>validateOwnerDispatch(event,{...env,GITHUB_EVENT_NAME:'push'},sha),/manual only/);
 assert.throws(()=>validateOwnerDispatch(event,{...env,GITHUB_ACTOR:'untrusted-contributor'},sha),/owner authorization/);
 assert.throws(()=>validateOwnerDispatch(event,env,'b'.repeat(40)),/exactly match/);
 assert.throws(()=>validateOwnerDispatch({inputs:{...event.inputs,confirmation:'NO'}},env,sha),/confirmation/);
 assert.throws(()=>validateOwnerDispatch({inputs:{...event.inputs,approved_commit:'main'}},env,sha),/exactly match/);
});
test('retired production shortcuts cannot deploy, import data or reset credentials',()=>{
 for(const name of ['deploy-account3-global-community','publish-authorized-community','configure-studio-owner-login','restore-public-app']){
  const text=readFileSync('.github/workflows/'+name+'.yml','utf8');
  assert.doesNotMatch(text,/^\s{2}(?:push|pull_request):/m);
  assert.doesNotMatch(text,/secrets\.|wrangler|secret put|method:\s*POST/);
 }
 for(const name of ['deploy-account4-control-room','deploy-portal-router']){
  const text=readFileSync('.github/workflows/'+name+'.yml','utf8');
  assert.doesNotMatch(text,/^\s{2}(?:push|pull_request):/m);
  assert.match(text,/environment: owner-production-approval/);
  assert.match(text,/require-owner-dispatch\.mjs/);
  assert.doesNotMatch(text,/d1 migrations apply/);
 }
});
