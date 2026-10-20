import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {handleAgentConnector} from '../connector/agent-connector.ts';

const token='agent_'+ 'a'.repeat(52);
const digest=async text=>Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');
async function mockEnv({revoked=false,allowedSites=['account3'],quota=true}={}){
 const hash=await digest(token);
 const calls=[];
 const db={
  prepare(sql){
   const query={bind(...values){query.values=values;return query},
    async first(){
     calls.push({sql,values:query.values||[]});
     if(sql.includes('cms_agent_credentials'))return !revoked&&query.values[0]===hash?{agent_id:'agent-global',allowed_sites:JSON.stringify(allowedSites)}:null;
     if(sql.includes('cms_agent_request_limits'))return quota?{request_count:1}:null;
     throw Error('Unexpected database query');
    },
    async all(){throw Error('Unexpected all()')},
    async run(){throw Error('Unexpected run()')}};
   return query;
  }
 };
 return {env:{DB:db},calls};
}
const request=(path,method='GET',body)=>new Request('https://control.example'+path,{method,headers:{authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
test('capabilities expose only agent site scope, not deployment authority',async()=>{
 const {env}=await mockEnv();
 const response=await handleAgentConnector(request('/api/connector/v1/capabilities'),env);
 assert.equal(response.status,200);
 const data=await response.json();
 assert.deepEqual(data.sites,['account3']);
 assert.equal(data.deploy,false);
 assert.equal(data.approve,false);
});
test('revoked credentials are denied before any mutation',async()=>{
 const {env}=await mockEnv({revoked:true});
 assert.equal((await handleAgentConnector(request('/api/connector/v1/capabilities'),env)).status,401);
});
test('a scoped agent cannot submit a private draft for another site',async()=>{
 const {env,calls}=await mockEnv();
 const draft={site:'account2',kind:'page',key:'home',description:'Forbidden',content:{schema:1,fields:[]}};
 const response=await handleAgentConnector(request('/api/connector/v1/cms-drafts','POST',draft),env);
 assert.equal(response.status,403);
 assert.equal(calls.some(c=>c.sql.includes('INSERT INTO cms_agent_drafts')),false);
});
test('quota refusal precedes agent action',async()=>{
 const {env}=await mockEnv({quota:false});
 assert.equal((await handleAgentConnector(request('/api/connector/v1/capabilities'),env)).status,429);
});
test('anonymous calls do not disclose capabilities',async()=>{
 const {env}=await mockEnv();
 const response=await handleAgentConnector(new Request('https://control.example/api/connector/v1/capabilities'),env);
 assert.equal(response.status,401);
});
