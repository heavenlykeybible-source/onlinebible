/* Heavenly Key Bible · local-first reading routine.
 * Reminders can run while this page remains open; a website alone cannot guarantee
 * notifications while the browser is closed. No sign-in or remote tracking. */
const mount = document.getElementById('bible-reading-routine');
if (mount) initRoutine(mount);

function initRoutine(root) {
  const KEY = 'hk-bible-reading-routine-v1';
  const PROGRESS = 'hk-bible-reading-progress-v1';
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const make = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined && text !== null) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const booksPromise = fetch('kjv-manifest.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => data.books);
  let routine = read(KEY, {time:'05:30', days:[1,2,3,4,5,6,0], plan:'whole', customBook:'john', customChapter:1, enabled:false});
  let progress = read(PROGRESS, {whole:0, nt:0, devotional:0, custom:0, completed:{}});
  if (!Array.isArray(routine.days)) routine.days = [1,2,3,4,5,6,0];
  const card = make('section', null, 'brr-card');
  card.setAttribute('aria-labelledby','brr-title');
  card.append(make('p','GROW IN THE WORD','brr-eyebrow'),make('h2','My Bible Reading Routine','brr-title'),
    make('p','Choose your reading time and days. Your schedule and progress stay on this device; no account is needed.','brr-intro'));
  const form = make('form',null,'brr-form');
  const field = (labelText, control) => { const wrap=make('div',null,'brr-field'); const label=make('label',labelText); label.htmlFor=control.id; wrap.append(label,control); return wrap; };
  const time = make('input'); time.type='time'; time.id='brr-time'; time.value=routine.time || '05:30'; time.required=true;
  form.append(field('Daily reminder time (your device time)',time));
  const dayWrap=make('fieldset',null,'brr-days'); dayWrap.append(make('legend','Reading days'));
  const dayInputs=[];
  DAYS.forEach((day,i)=>{ const label=make('label',null,'brr-day'); const input=make('input'); input.type='checkbox'; input.value=String(i); input.checked=routine.days.includes(i); input.id='brr-day-'+i; label.append(input,document.createTextNode(day)); dayWrap.append(label); dayInputs.push(input); });
  form.append(dayWrap);
  const plan=make('select'); plan.id='brr-plan';
  [['whole','Read through the whole Bible'],['nt','New Testament reading'],['devotional','Daily devotional: Psalms and John'],['custom','Choose a book and chapter']].forEach(([v,t])=>{const o=make('option',t);o.value=v;plan.append(o);});
  plan.value=routine.plan || 'whole';
  form.append(field('Reading plan',plan));
  const custom=make('div',null,'brr-custom-fields');
  const book=make('select'); book.id='brr-book';
  const chapter=make('input'); chapter.type='number';chapter.id='brr-chapter';chapter.min='1';chapter.max='150';chapter.step='1';chapter.value=String(routine.customChapter||1);
  custom.append(field('Book',book),field('Chapter',chapter));form.append(custom);
  plan.addEventListener('change',()=>{custom.hidden=plan.value!=='custom';});
  custom.hidden=plan.value!=='custom';
  const actions=make('div',null,'brr-actions');
  const save=make('button','Save my routine','brr-primary');save.type='submit';
  const permission=make('button','Enable browser reminders','brr-secondary');permission.type='button';
  const disable=make('button','Pause routine','brr-secondary');disable.type='button';
  actions.append(save,permission,disable);form.append(actions);
  const status=make('p','Your routine is not saved yet.','brr-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const summary=make('div',null,'brr-summary');
  const next=make('p','Save a routine to see your next reading.','brr-next');
  const done=make('button','Mark today’s reading complete','brr-primary');done.type='button';done.disabled=true;
  const open=make('a','Open today’s Bible passage','brr-open');open.href='bible.html';open.hidden=true;
  summary.append(next,open,done);
  card.append(form,status,summary,make('p','Reminder limits: notifications require browser permission and this page to be open or running in the background. If the browser is fully closed, a website-only reminder may not fire at the chosen time. Open this page again to check for a missed reminder.','brr-note'));
  root.replaceChildren(card);

  function dayKey(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
  function getPassage(books) {
    const p=progress[routine.plan]||0;
    if(routine.plan==='custom') {
      const b=books.find(x=>x.id===routine.customBook)||books.find(x=>x.id==='john')||books[0];
      const c=Math.max(1,Math.min(b.chapters,Number(routine.customChapter)||1));
      return {book:b,chapter:c,label:b.name+' '+c,href:'bible.html?book='+encodeURIComponent(b.id)+'&chapter='+c};
    }
    let list=books;
    if(routine.plan==='nt') list=books.filter(b=>b.testament==='New Testament');
    if(routine.plan==='devotional') {
      const ps=books.find(b=>b.id==='psalms'), john=books.find(b=>b.id==='john');
      const sequence=[]; if(ps)for(let c=1;c<=ps.chapters;c++)sequence.push({book:ps,chapter:c});
      if(john)for(let c=1;c<=john.chapters;c++)sequence.push({book:john,chapter:c});
      const item=sequence[p%sequence.length]||{book:john,chapter:1};
      return {...item,label:item.book.name+' '+item.chapter,href:'bible.html?book='+item.book.id+'&chapter='+item.chapter};
    }
    const sequence=[];for(const b of list)for(let c=1;c<=b.chapters;c++)sequence.push({book:b,chapter:c});
    const item=sequence[Math.min(p,sequence.length-1)]||{book:list[0],chapter:1};
    return {...item,label:item.book.name+' '+item.chapter,href:'bible.html?book='+item.book.id+'&chapter='+item.chapter,finished:p>=sequence.length};
  }
  function update(books) {
    const today=dayKey(), passage=getPassage(books), completed=!!progress.completed[today];
    next.textContent=(completed?'Today’s reading is marked complete. Next passage: ':'Today’s passage: ')+passage.label+(passage.finished?' · Plan complete':'');
    open.href=passage.href;open.hidden=false;done.disabled=!routine.enabled||completed||passage.finished;
    done.textContent=completed?'Reading completed today ✓':'Mark today’s reading complete';
    status.textContent=routine.enabled?'Routine active · '+routine.time+' · '+routine.days.map(d=>DAYS[d]).join(', '):'Routine saved but paused. Save and enable it when you are ready.';
  }
  function saveRoutine(event) {
    event?.preventDefault();
    const selected=dayInputs.filter(x=>x.checked).map(x=>Number(x.value));
    if(!selected.length){status.textContent='Choose at least one reading day.';return;}
    routine.time=time.value||'05:30';routine.days=selected;routine.plan=plan.value;
    routine.customBook=book.value||'john';routine.customChapter=Math.max(1,Number(chapter.value)||1);
    routine.enabled=true;
    if(!write(KEY,routine)){status.textContent='Could not save on this device. Check browser storage settings.';return;}
    booksPromise.then(update).catch(()=>{status.textContent='Could not load the Bible book list. Reload and try again.';});
    status.textContent='Routine saved on this device.';
    checkReminder(true);
  }
  form.addEventListener('submit',saveRoutine);
  permission.addEventListener('click',async()=>{
    if(!('Notification' in window)){status.textContent='Browser notifications are not supported here. Keep this page open to see the in-page reminder.';return;}
    try { const result=await Notification.requestPermission();status.textContent=result==='granted'?'Browser notifications enabled where supported.':'Notifications were not enabled; you can still use the routine on this page.';checkReminder(true); }
    catch {status.textContent='Could not request notification permission in this browser.';}
  });
  disable.addEventListener('click',()=>{routine.enabled=false;write(KEY,routine);booksPromise.then(update);status.textContent='Your reading routine is paused.';});
  done.addEventListener('click',async()=>{
    const books=await booksPromise;const passage=getPassage(books);if(!routine.enabled||progress.completed[dayKey()]||passage.finished)return;
    progress.completed[dayKey()]=true;progress[routine.plan]=(progress[routine.plan]||0)+(routine.plan==='custom'?0:1);
    if(!write(PROGRESS,progress)){status.textContent='Could not save progress on this device.';return;}
    update(books);status.textContent='Well done! Today’s reading has been recorded on this device.';
  });
  let lastNotified='';
  function checkReminder(force=false) {
    if(!routine.enabled)return;
    const now=new Date(),today=dayKey(now),key=today+' '+routine.time;
    if(!routine.days.includes(now.getDay())||progress.completed[today])return;
    const [h,m]=String(routine.time||'05:30').split(':').map(Number);
    if(now.getHours()*60+now.getMinutes()<h*60+m)return;
    const marker=read('hk-bible-reminder-last-v1','');
    if(marker===key||lastNotified===key)return;
    lastNotified=key;write('hk-bible-reminder-last-v1',key);
    const message='It is time for your Bible reading. Open Heavenly Key Bible and read today’s passage.';
    if('Notification' in window&&Notification.permission==='granted') { try { new Notification('My Bible Reading Routine',{body:message,tag:'hk-bible-reading-'+today}); } catch {} }
    status.textContent=message;
  }
  booksPromise.then(books=>{ 
    for(const b of books){const o=make('option',b.name);o.value=b.id;book.append(o);}
    if(books.some(b=>b.id===routine.customBook))book.value=routine.customBook;else book.value='john';
    chapter.max=String((books.find(b=>b.id===book.value)||{}).chapters||150);
    book.addEventListener('change',()=>{chapter.max=String((books.find(b=>b.id===book.value)||{}).chapters||150);if(Number(chapter.value)>Number(chapter.max))chapter.value=chapter.max;});
    update(books);checkReminder();
  }).catch(()=>{status.textContent='Bible reading data could not load. Check your connection and reload.';});
  setInterval(checkReminder,30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminder();});
}
