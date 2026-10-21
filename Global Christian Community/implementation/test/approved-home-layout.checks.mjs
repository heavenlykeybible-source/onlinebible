import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function fixture(){
  const listeners={},classes=new Set(),order=[];
  const body={dataset:{page:'home'},classList:{toggle(k,on){on?classes.add(k):classes.delete(k)},remove(...ks){ks.forEach(k=>classes.delete(k))}}};
  const intro={textContent:''},join={textContent:'CREATE ACCOUNT'},login={textContent:'SIGN IN'};
  let welcome=null,removed=false;
  const actions={before(n){const old=order.indexOf(n);if(old>=0)order.splice(old,1);order.splice(order.indexOf(actions),0,n);},querySelector:s=>s.includes('a:not')?login:join};
  const image={src:'assets/global-christian-community-approved-banner.jpeg'};
  order.push(image,actions,intro);
  const banner={setAttribute(){},remove(){removed=true;},querySelector(s){if(s===':scope > p')return intro;if(s==='.gc-visitor-actions')return actions;if(s==='.gc-visitor-heading')return welcome=order.find(n=>n.className==='gc-visitor-heading')||null;}};
  const active={},heading={after(n){this.next=n;}};
  const stream={querySelector:s=>s==='.gc-visitor-banner'?(removed?null:banner):s==='.stream-heading'?heading:s==='.gc-active-section'?active:null};
  const document={body,createElement:tag=>({tag}),querySelector:s=>s==='.social-stream'?stream:null};
  vm.runInNewContext(readFileSync(new URL('../public/approved-home-layout.js',import.meta.url),'utf8'),{document,window:{addEventListener:(k,f)=>listeners[k]=f}});
  return {emit:(name,detail)=>listeners[name]({detail}),classes,order,image,intro,join,login,actions,banner,heading,active,get removed(){return removed;}};
}

test('guest welcome keeps the approved banner and working account links, in reading order',()=>{
  const f=fixture();f.emit('hk-community-view-ready',{page:'home',session:null});
  assert(f.classes.has('gc-approved-guest'));assert.equal(f.heading.next,f.banner);
  assert.equal(f.order[0],f.image);assert.equal(f.order[1].tag,'h2');assert.equal(f.order[2],f.intro);assert.equal(f.order[3],f.actions);
  assert.equal(f.join.textContent,'Join the Community');assert.equal(f.login.textContent,'Sign In');
  f.emit('hk-community-view-ready',{page:'home',session:null});
  assert.equal(f.order.filter(n=>n.tag==='h2').length,1,'Repeated rendering must not duplicate the heading');
});

test('session changes immediately switch visibility and member rendering preserves ACTIVE',()=>{
  const f=fixture(),session={user:{userId:7}};
  f.emit('hk-community-view-ready',{page:'home',session:null});
  f.emit('hk-care-session',session);assert(f.classes.has('gc-approved-member'));assert(!f.classes.has('gc-approved-guest'));
  f.emit('hk-community-view-ready',{page:'home',session});assert(f.removed);assert.equal(f.heading.next,f.active);
  f.emit('hk-care-session',null);assert(f.classes.has('gc-approved-guest'));assert(!f.classes.has('gc-approved-member'));
  f.emit('hk-community-view-ready',{page:'groups',session:null});assert.equal(f.classes.size,0);
});

test('homepage loads both layout assets and keeps real guest account destinations',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/href="approved-home-layout\.css\?/);assert.match(html,/src="approved-home-layout\.js\?/);
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert(app.includes("join.href='account.html#register'"));assert(app.includes("signin.href='account.html'"));
});
