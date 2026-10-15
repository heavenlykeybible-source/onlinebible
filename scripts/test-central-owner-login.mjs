import test from 'node:test';import assert from 'node:assert/strict';
import {centralOwnerLogin} from '../src/services/central-owner-login.ts';
const environment=count=>({DB:{prepare:()=>({all:async()=>({results:Array.from({length:count},(_,i)=>({user_id:i+7}))})})}});
test('owner sign-in requires one existing active owner, verified central password and authenticated owner session',async()=>{
 let calls=0;const good=async(url,options)=>{calls++;assert.ok(url.startsWith('https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev/'));if(url.endsWith('/login')){assert.equal(options.headers.Origin,'https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev');return Response.json({ok:true},{headers:{'set-cookie':'__Host-hkem-owner='+'a'.repeat(64)+'; Secure; HttpOnly'}})}if(url.endsWith('/me'))return Response.json({actor:'project-owner',role:'administrator'});return Response.json({ok:true})};
 assert.equal(await centralOwnerLogin(environment(0),'strong-example-password',good),null);assert.equal(await centralOwnerLogin(environment(2),'strong-example-password',good),null);assert.equal(calls,0);
 assert.equal(await centralOwnerLogin(environment(1),'strong-example-password',good),7);assert.equal(calls,3);
 assert.equal(await centralOwnerLogin(environment(1),'strong-example-password',async()=>Response.json({error:'Bad password'},{status:401})),null);
 assert.equal(await centralOwnerLogin(environment(1),'strong-example-password',async()=>Response.json({ok:true})),null);
 assert.equal(await centralOwnerLogin(environment(1),'strong-example-password',async()=>{throw Error('Offline')}),null);
});
