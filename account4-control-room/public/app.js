(()=>{'use strict';const $=s=>document.querySelector(s),PUBLIC='https://heavenlykey-cms-public.emmanuel2026miracle.workers.dev';
 const sites={account1:{origin:'https://heavenlykey.org',note:'Main website and internal pages.'},account2:{origin:'https://heavenlykey.org',note:'The Studio is hosted on the main website. Studio editing uses its existing page.'},account3:{origin:'https://global.heavenlykey.org',note:'Ministry pages only; member-owned posts and private messages are not edited here.'},account4:{origin:location.origin,note:'Control Room branding and footer.'},account5:{origin:'https://heavenly-key-app.heavenlykeyapp.workers.dev',note:'The app connection needs to be verified before publishing.'},account6:{origin:'https://bible.heavenlykey.org',note:'Bible interface only; the KJV scripture text is not edited here.'}};
 let catalog={},kind='page',version=0,doc={schema:1,fields:[]},fields=[],preview=null,nonce='',aiDraft=null,menuSeed=null,footerSeed=null;
 let previewedVersion=0,dirty=false,saveTimer,saving=Promise.resolve(),editSequence=0;const versions=new Map();
 const effective=()=>$('#site').value==='account2'?'account1':$('#site').value;
 const pageKey=()=>($('#page').value||'/').replace(/^\/+|\/+$/g,'').replace(/\.html$/i,'').replace(/\/index$/,'').replace(/^index$/,'')||'home';
 const target=()=>new URLSearchParams({site:effective(),kind,key:kind==='page'?pageKey():'site'});
 function status(text){$('#status').textContent=text}
 async function api(path,init){const response=await fetch(path,init);let data;try{data=await response.json()}catch{throw Error('Sign in to the Control Room, then reload this page.')}if(!response.ok)throw Error(data.error||'The request could not be completed.');return data}
 const post=(path,body)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const emptyFooter=()=>({schema:1,copyright:'Copyright © Heavenly Key Evangelistic Movement 2012-2026.',designer:{label:'TALKMONEY Ecosystem',href:'https://talkmoney.uk'}});
 function message(type,data={}){if(preview&&!preview.closed)preview.postMessage({type,nonce,...data},sites[$('#site').value].origin)}
 function render(){
  $('#advanced').value=JSON.stringify(doc,null,2);$('#target').textContent='Editing '+effective()+' · '+(kind==='page'?pageKey():kind+' across this website');
  if(kind==='page')renderFields();if(kind==='menu')renderMenus();if(kind==='footer'){$('#footer-copy').value=doc.copyright||'';$('#footer-designer').value=doc.designer?.label||'';$('#footer-link').value=doc.designer?.href||''}
 }
 function valueField(field){return doc.fields?.find(f=>f.key===field.key)?.value??field.value}
 function change(field,value){dirty=true;editSequence++;previewedVersion=0;clearTimeout(saveTimer);saveTimer=setTimeout(()=>save().catch(e=>status(e.message)),650);if(!doc.fields)doc={schema:1,fields:[]};const found=doc.fields.find(f=>f.key===field.key);if(found)found.value=value;else doc.fields.push({key:field.key,type:field.type,value});$('#advanced').value=JSON.stringify(doc,null,2);message('hkem-apply',{content:doc,kind,version})}
 function renderFields(){const root=$('#fields');root.replaceChildren();const filter=$('#filter').value.toLowerCase();const list=fields.filter(f=>!filter||(f.label+' '+f.type+' '+String(valueField(f))).toLowerCase().includes(filter));
  if(!fields.length){const p=document.createElement('p');p.className='muted';p.textContent='Open the visual editor in a new tab to load this page’s existing text, pictures and links.';root.append(p);return}
  for(const field of list){const row=document.createElement('div');row.className='field-row';const label=document.createElement('label');label.textContent=field.type.toUpperCase()+' · '+(field.label||field.key);const input=document.createElement(['layout','tone'].includes(field.type)?'select':field.type==='text'?'textarea':'input');const value=valueField(field);
   if(['layout','tone'].includes(field.type)){const options=field.type==='layout'?['original','contained','wide','full']:['original','royal','wine','gold','light','dark'];for(const v of options){const option=document.createElement('option');option.value=v;option.textContent=v==='original'?'Original design':v;input.append(option)}input.value=String(value)}else if(field.type==='visible'){input.type='checkbox';input.checked=Boolean(value);input.style.width='auto'}else{input.value=String(value??'');if(field.type==='text')input.rows=2;else input.type='text'}
   input.onchange=()=>change(field,field.type==='visible'?input.checked:input.value);label.append(input);row.append(label);root.append(row);
  }
 }
 function renderMenus(){const root=$('#menus');root.replaceChildren();for(const [i,item] of (doc.items||[]).entries()){
  const row=document.createElement('div');row.className='menu-row';for(const [key,title] of [['label','Menu title'],['href','Destination']]){const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.value=item[key]||'';input.onchange=()=>{item[key]=input.value;$('#advanced').value=JSON.stringify(doc,null,2)};label.append(input);row.append(label)}
  const checks=document.createElement('div');checks.className='checks';for(const [key,title] of [['visible','Show this link'],['newTab','Open in a new tab']]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=item[key]===true;input.onchange=()=>item[key]=input.checked;label.append(input,document.createTextNode(title));checks.append(label)}row.append(checks);root.append(row);
 }}
 function readForm(){if(kind==='footer')doc={schema:1,copyright:$('#footer-copy').value,designer:{label:$('#footer-designer').value,href:$('#footer-link').value}};return doc}
 async function load(){try{const data=await api('/api/entry?'+target());version=data.entry?.version||0;versions.set(target().toString(),version);dirty=false;previewedVersion=0;doc=data.entry?JSON.parse(data.entry.content):kind==='menu'?(menuSeed||{schema:1,items:[]}):kind==='footer'?(footerSeed||emptyFooter()):{schema:1,fields:[]};render();status('Update version '+version+(data.published?.revision_version===version&&version?' · Approved':' · Awaiting preview and approval')); if(kind==='page')message('hkem-apply',{content:doc,kind,version})}catch(error){status(error.message)}}
 function save(){
  const locationKey=target().toString(),snapshot=structuredClone(readForm()),sequence=editSequence;
  if(!versions.has(locationKey))versions.set(locationKey,version);
  const run=saving.catch(()=>{}).then(async()=>{
   const data=await post('/api/save?'+locationKey,{content:snapshot,expectedVersion:versions.get(locationKey)});versions.set(locationKey,data.version);
   if(target().toString()===locationKey){version=data.version;previewedVersion=0;if(editSequence===sequence){dirty=false;message('hkem-apply',{content:snapshot,kind,version})}status('New update · version '+version+' · In awaiting room')}
   await refreshAwaiting();return data;
  });saving=run;return run;
 }

 async function publish(){
  if(dirty)throw Error('Your edits are still arriving. Preview the saved update before approving.');
  if(previewedVersion!==version||!version)throw Error('Open Preview and inspect this update before approving.');
  const data=await post('/api/approve?'+target(),{expectedVersion:version});
  if(!data.published)throw Error('Approval was not confirmed.');
  status('Approved · version '+version+' · Checking website connection…');
  await refreshAwaiting();message('hkem-status',{message:'Approved. Checking the website connection.'});
 }
 const labels={account1:'Account 1 · Main website',account2:'Account 2 · Studio & media',account3:'Account 3 · Community',account4:'Account 4 · Control Room',account5:'Account 5 · Apps',account6:'Account 6 · Bible'};
 function displayDate(value){return value?new Date(value.replace(' ','T')+(value.includes('Z')?'':'Z')).toLocaleString():'—'}
 async function refreshAwaiting(){try{
  const {items}=await api('/api/awaiting-room'),root=$('#awaiting-rows');root.replaceChildren();
  const add=(row,text)=>{const td=document.createElement('td');td.textContent=text;row.append(td);return td};
  for(const site of Object.keys(labels)){
   const updates=items.filter(i=>i.site===site);

   for(const item of updates){const row=document.createElement('tr');add(row,labels[site]);add(row,item.key+' · '+item.kind+' · v'+item.version);add(row,item.status==='approved'?'Approved':'New update').className=item.status==='approved'?'':'new-update';add(row,displayDate(item.arrivedAt));add(row,item.approvedVersion?'v'+item.approvedVersion+' · '+displayDate(item.approvedAt):'—');
    const working=add(row,item.status==='approved'?'Checking…':'Awaiting approval');
    if(item.status==='approved')verifyWorking(item,working);
    const actions=add(row,'');const previewButton=document.createElement('button');previewButton.textContent='Preview';previewButton.onclick=()=>selectUpdate(item);const approve=document.createElement('button');approve.textContent='Approve';approve.disabled=item.status==='approved';approve.onclick=async()=>{if(effective()!==item.site||kind!==item.kind||(kind==='page'?pageKey():'site')!==item.key||version!==item.version||previewedVersion!==version){status('Preview this update first.');await selectUpdate(item);return}approve.disabled=true;try{await publish()}catch(e){status(e.message);approve.disabled=false}};actions.append(previewButton,approve);root.append(row);
   }
  }$('#awaiting-status').textContent=items.length+' updates · Preview, adjust settings, then approve.';
 }catch(error){$('#awaiting-status').textContent=error.message}}
 async function verifyWorking(item,cell){try{const r=await fetch(PUBLIC+'/v1/content?site='+item.site+'&page='+encodeURIComponent(item.kind==='page'?item.key:'home'),{cache:'no-store'}),d=await r.json(),entry=item.kind==='page'?d.content:d[item.kind];cell.textContent=r.ok&&entry?.version===item.version?'Content available · site check pending':'Verification pending'}catch{cell.textContent='Verification pending'}}
 async function selectUpdate(item){
  clearTimeout(saveTimer);$('#site').value=item.site;pages(false);
  if(item.kind==='page'){let option=[...$('#page').options].find(o=>o.value.replace(/^\/+|\/+$/g,'').replace(/\.html$/i,'')===item.key||(item.key==='home'&&o.value==='/'));if(!option){option=document.createElement('option');option.value=item.key==='home'?'/':'/'+item.key;option.textContent=item.key;$('#page').append(option)}$('#page').value=option.value}
  kind=item.kind;for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===kind));for(const pane of document.querySelectorAll('[data-pane]'))pane.hidden=pane.dataset.pane!==kind;await load();$('#open-visual').click();
 }
 $('#refresh-awaiting').onclick=refreshAwaiting;

 function pages(loadSelected=true){const site=$('#site').value;const entries=site==='account2'?[{path:'/pages/admin',label:'Studio & dashboard'}]:catalog[site]||[{path:'/',label:'Home'}];$('#page').replaceChildren(...entries.map(p=>{const option=document.createElement('option');option.value=p.path;option.textContent=p.label;return option}));$('#site-note').textContent=sites[site].note;fields=[];menuSeed=null;footerSeed=null;$('#revisions').replaceChildren();if(loadSelected)return load()}
 $('#site').onchange=()=>pages();$('#page').onchange=()=>{fields=[];load()};$('#filter').oninput=renderFields;
 for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>{kind=button.dataset.tab;for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b===button));for(const pane of document.querySelectorAll('[data-pane]'))pane.hidden=pane.dataset.pane!==kind;load()};
 $('#load').onclick=load;$('#save').onclick=()=>save().catch(e=>status(e.message));$('#publish').onclick=async()=>{const b=$('#publish');b.disabled=true;status('Approving this '+kind+'…');try{await publish()}catch(e){status(e.message)}finally{b.disabled=false}};
 $('#open-visual').onclick=()=>{nonce=crypto.randomUUID();const url=new URL($('#page').value||'/',sites[$('#site').value].origin);url.searchParams.set('hkem-cms','edit');url.searchParams.set('hkem-session',nonce);url.searchParams.set('hkem-control',location.origin);preview=window.open(url,'hkem-visual-editor');if(!preview)status('Allow the visual editor to open a new tab, then try again.');else status('Visual editor opened. Waiting for the page to connect…')};
 window.addEventListener('message',async event=>{if(!preview||event.source!==preview||event.origin!==sites[$('#site').value].origin||event.data?.nonce!==nonce)return;const data=event.data;if(data.site!==effective()||data.page!==pageKey())return;
  if(data.type==='hkem-ready'){fields=Array.isArray(data.fields)?data.fields.slice(0,600):[];menuSeed=data.menu;footerSeed=data.footer;if(kind==='menu'&&version===0)doc=menuSeed;if(kind==='footer'&&version===0)doc=footerSeed;render();message('hkem-apply',{content:doc,kind,version});status('Visual editor connected. Edit directly in that tab or use the fields here.');}
  if(data.type==='hkem-preview-error'){previewedVersion=0;status('Some fields do not match this page. Correct the preview before approval.')}
  if(data.type==='hkem-previewed'&&data.version===version&&version>0&&!dirty){await post('/api/preview?'+target(),{expectedVersion:version});previewedVersion=version;status('Previewing version '+version+'. Check all changes, then click Approve.')}
  if(data.type==='hkem-change'&&kind==='page'&&fields.some(f=>f.key===data.field?.key&&f.type===data.field?.type)){change(data.field,data.field.value);renderFields()}
  if(['hkem-save','hkem-publish'].includes(data.type)&&kind==='page'){try{doc=data.content;render();await save();message('hkem-status',{message:$('#status').textContent})}catch(error){status(error.message);message('hkem-status',{message:error.message})}}
 });
 $('#add-menu').onclick=()=>{if(!doc.items)doc={schema:1,items:[]};dirty=true;editSequence++;previewedVersion=0;doc.items.push({key:'new_'+crypto.randomUUID(),label:'New menu link',href:'/',newTab:false,visible:true});render()};
 $('#history').onclick=async()=>{try{const data=await api('/api/revisions?'+target()),root=$('#revisions');root.replaceChildren();if(!data.items?.length){root.textContent='No previous revisions yet.';return}for(const revision of data.items){const row=document.createElement('div');row.className='revision';const text=document.createElement('span');text.textContent='Version '+revision.version+' · '+revision.created_at;const button=document.createElement('button');button.textContent='Restore to awaiting room';button.onclick=async()=>{try{await post('/api/restore?'+target(),{revisionId:revision.id,expectedVersion:version});await load();status('Previous version is in the awaiting room. Preview before approval.')}catch(error){status(error.message)}};row.append(text,button);root.append(row)}}catch(error){status(error.message)}};
 $('#upload').onclick=async()=>{const file=$('#upload-file').files[0],notice=$('#upload-status');if(!file){notice.textContent='Choose a picture first.';return}notice.textContent='Uploading…';try{const data=await api('/api/media',{method:'POST',headers:{'Content-Type':file.type},body:file});$('#media-url').value=data.url;$('#media-preview').src=data.url;$('#media-preview').hidden=false;notice.textContent='Picture uploaded. Copy its link into a picture field, then preview and approve.'}catch(error){notice.textContent=error.message}};
 async function ask(edit){$('#ai-answer').textContent='The assistant is preparing a suggestion…';$('#ai-apply').hidden=true;aiDraft=null;try{if(edit){clearTimeout(saveTimer);await save()}readForm();const context=edit&&kind==='page'?{schema:1,fields:fields.filter(f=>f.type==='text'&&(!$('#filter').value||String(f.label||'').toLowerCase().includes($('#filter').value.toLowerCase()))).slice(0,12).map(f=>({key:f.key,type:f.type,value:valueField(f)}))}:doc;const result=await post('/api/ai?'+target(),{prompt:$('#ai-prompt').value,mode:edit?'edit':'help',content:context,expectedVersion:version});$('#ai-answer').textContent=result.suggestion;aiDraft=result.draft;if(result.queued){version=result.queued.version;doc=aiDraft;render();message('hkem-apply',{content:doc,kind,version});await refreshAwaiting();status('AI update arrived in the awaiting room. Preview it before approval.')}if(aiDraft)$('#ai-apply').hidden=false;else if(edit)$('#ai-answer').textContent+='\n\nNo valid update was created. Please try again.'}catch(error){$('#ai-answer').textContent=error.message}}
 $('#ai-edit').onclick=()=>ask(true);$('#ai-ask').onclick=()=>ask(false);$('#ai-apply').onclick=()=>$('#open-visual').click();
 $('#advanced-apply').onclick=()=>{try{doc=JSON.parse($('#advanced').value);render();message('hkem-apply',{content:doc,kind,version});dirty=true;editSequence++;previewedVersion=0;save().catch(e=>status(e.message))}catch{status('The structured content is not valid JSON.')}};
 document.querySelectorAll('#menus,#footer-copy,#footer-designer,#footer-link').forEach(el=>el.addEventListener('change',()=>{dirty=true;editSequence++;previewedVersion=0;clearTimeout(saveTimer);saveTimer=setTimeout(()=>save().catch(e=>status(e.message)),650)}));
 $('#health').onclick=async()=>{try{const data=await api('/api/system/health');$('#health-result').textContent='CMS: '+data.cms+'\nPublishing: '+data.publishing+'\nAI: '+data.ai+'\nPictures: '+data.media}catch(error){$('#health-result').textContent=error.message}};
 async function password(generate){$('#password-status').textContent='Setting owner password…';$('#password-result').hidden=true;try{const data=await post('/api/owner/password',generate?{generate:true}:{password:$('#owner-password').value});$('#owner-password').value='';$('#password-status').textContent='Owner password is ready. Keep it privately; use the Owner password sign-in link above.';if(data.password){$('#password-result').textContent='Your new owner password — save it privately: '+data.password;$('#password-result').hidden=false}}catch(error){$('#password-status').textContent=error.message}}
 $('#password-save').onclick=()=>password(false);$('#password-generate').onclick=()=>password(true);$('#logout').onclick=async()=>{try{await post('/api/owner/logout',{})}catch{}location.href=(location.hostname.startsWith('heavenlykey-owner-dashboard')||location.hostname==='control.heavenlykey.org')?'/login.html':'/cdn-cgi/access/logout'};
 Promise.all([fetch('/catalog.json').then(r=>r.json()),api('/api/me')]).then(([pagesData,me])=>{catalog=pagesData;$('#identity').textContent='Signed in: '+me.actor;pages();refreshAwaiting()}).catch(error=>{$('#identity').textContent=error.message;status(error.message)});
})();


document.querySelectorAll('[data-control-studio]').forEach(a=>{const url=new URL('https://studio.heavenlykey.org/api/auth/control-start');url.searchParams.set('issuer',location.origin);a.href=url.href;});
