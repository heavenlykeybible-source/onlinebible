import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConnection,planConnectionChoice} from '../connector/multi-connection-registry.ts';
const record={id:'cloudflare_prod_01',site:'account3',provider:'cloudflare',label:'Global Community',accountRef:'cloudflare-account-123',resourceRef:'community-worker',allowedRoles:['read','propose','preview'],enabled:true,verified:true};
test('only scoped, verified connections can be selected',()=>{
 assert.equal(planConnectionChoice({site:'account3',connectionId:record.id,operation:'preview'},[record]).executed,false);
 assert.throws(()=>planConnectionChoice({site:'account2',connectionId:record.id,operation:'read'},[record]));
 assert.throws(()=>planConnectionChoice({site:'account3',connectionId:record.id,operation:'deploy'},[record]));
 assert.throws(()=>planConnectionChoice({site:'account3',connectionId:record.id,operation:'read'},[{...record,verified:false}]));
 assert.throws(()=>planConnectionChoice({site:'account3',connectionId:record.id,operation:'read'},[{...record,enabled:false}]));
});
test('protected control room and unknown providers are rejected',()=>{
 assert.throws(()=>validateConnection({...record,site:'account4'}));
 assert.throws(()=>validateConnection({...record,provider:'arbitrary'}));
 assert.throws(()=>validateConnection({...record,resourceRef:'https://127.0.0.1/internal?token=x'}));
});
test('agents cannot supply alternate identity or provider URLs',()=>{
 assert.throws(()=>planConnectionChoice({site:'account3',connectionId:record.id,operation:'preview',accountRef:'other'},[record]));
 assert.throws(()=>planConnectionChoice({site:'account3',connectionId:record.id,operation:'read'},[record,record]));
 assert.throws(()=>planConnectionChoice({site:'account3',connectionId:'missing',operation:'read'},[record]));
});
