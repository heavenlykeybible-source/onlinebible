(()=>{'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el};
function mount(){
 if($('#hk-community-ai'))return;
 const dialog=make('dialog');dialog.id='hk-community-ai';dialog.className='hk-community-ai hk-assistant';dialog.setAttribute('aria-labelledby','hk-ai-title');
 const close=make('button','Close');close.type='button';close.className='hk-ai-close';
 const heading=make('h2','Heavenly Key AI Assistance');heading.id='hk-ai-title';
 const intro=make('p','Get help with Bible study, gospel writing, captions and prayer drafts. Sign in to use AI assistance.');intro.className='hk-ai-intro';
 const answer=make('div','Your suggestions will appear here.');answer.className='hk-community-ai-answer hk-ai-chat';answer.setAttribute('role','status');answer.setAttribute('aria-live','polite');answer.setAttribute('aria-atomic','true');
 const form=make('form');form.className='hk-ai-form';
 const actionLabel=make('label','What would you like help with?');actionLabel.htmlFor='hk-ai-action';
 const action=make('select');action.id='hk-ai-action';action.name='action';
 const actions=[['search','Bible topic explanation'],['card_idea','Gospel design card'],['article_outline','Article outline'],['article_polish','Improve my writing'],['caption','Social media caption'],['scripture_ideas','Bible passage ideas'],['bible_study','Bible study outline'],['prayer','Prayer draft']];
 for(const [value,label] of actions){const option=make('option',label);option.value=value;action.append(option)}
 actionLabel.append(action);
 const topicLabel=make('label','Topic');topicLabel.htmlFor='hk-ai-topic';
 const topic=make('input');topic.type='text';topic.id='hk-ai-topic';topic.name='topic';topic.maxLength=100;topic.autocomplete='off';topic.placeholder='e.g. Repentance, prayer, evangelism';topicLabel.append(topic);
 const contentLabel=make('label','Your notes or draft (optional)');contentLabel.htmlFor='hk-ai-content';
 const content=make('textarea');content.id='hk-ai-content';content.name='content';content.rows=4;content.maxLength=4500;content.placeholder='Add your own ideas or text to improve…';contentLabel.append(content);
 const send=make('button','Generate draft');send.type='submit';send.className='hk-ai-submit';
 form.append(actionLabel,topicLabel,contentLabel,send);
 const note=make('small','AI suggestions can be inaccurate. Verify Bible references in context and review every draft before using or publishing it.');note.className='hk-ai-note';
 dialog.append(close,heading,intro,answer,form,note);document.body.append(dialog);
 let previousFocus=null;
 const open=()=>{previousFocus=document.activeElement;if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}else dialog.setAttribute('open','');intro.hidden=true;dialog.classList.add('is-chatting');topic.focus()};
 const hide=()=>{if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');previousFocus?.focus?.()};
 close.addEventListener('click',hide);
 dialog.addEventListener('click',event=>{if(event.target===dialog)hide()});
 dialog.addEventListener('close',()=>{previousFocus?.focus?.()});
 function launcher(label,extraClass){const button=make('button',label);button.type='button';button.className='hk-ai-small-icon'+(extraClass?' '+extraClass:'');button.title='Open Heavenly Key AI Assistance';button.setAttribute('aria-label','Open Heavenly Key AI Assistance');button.addEventListener('click',open);return button}
 const top=launcher('AI');let side=null;
 function place(){
  const search=$('input[type="search"],input[placeholder*="Search"],input[placeholder*="search"]');
  const target=search?.parentElement||$('header .navlinks,.navlinks,header nav');
  if(target&&top.parentElement!==target)target.append(top);
  const sidebar=$('.left-sidebar,.community-sidebar,.sidebar,.left-rail,main aside');
  if(sidebar&&!side){side=launcher('✦ AI Assistance','hk-ai-sidebar-icon');sidebar.append(side)}
 }
 place();let attempts=0;const timer=setInterval(()=>{place();if(++attempts>=20)clearInterval(timer)},1000);
 form.addEventListener('submit',async event=>{
  event.preventDefault();const payload={action:action.value,topic:topic.value.trim(),content:content.value.trim()};
  if(!payload.topic&&!payload.content){answer.textContent='Enter a topic or add some text first.';topic.focus();return}
  send.disabled=true;send.textContent='Generating…';answer.textContent='Preparing your draft…';dialog.classList.add('is-chatting');
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch('/api/community-ai',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(payload),signal:controller.signal});
   let data;try{data=await response.json()}catch{throw new Error('The server returned an unreadable response. Please try again.')}
   if(!response.ok){if(response.status===401){intro.hidden=false;throw new Error('Please sign in to the Global Christian Community, then try AI Assistance again.')}throw new Error(data?.error?.message||'AI Assistance could not complete the request. Please try again.')}
   if(data.available===false){answer.textContent=data.message||'AI Assistance is temporarily unavailable. Your writing has not been changed.';return}
   if(data.available!==true||typeof data.draft!=='string'||!data.draft.trim())throw new Error('No draft was returned. Please try again.');
   answer.textContent=data.draft.trim()+(data.requiresReview?'\n\nPlease review the wording and verify all Scripture references before use.':'');
  }catch(error){answer.textContent=error?.name==='AbortError'?'AI Assistance took too long to respond. Please try again.':(error?.message||'Network unavailable. Check your connection and try again.')}
  finally{clearTimeout(timeout);send.disabled=false;send.textContent='Generate draft'}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();