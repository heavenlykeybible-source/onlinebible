/* Heavenly Key Bible · local-first reading routine.
 * Reminders can run while this page remains open; a website alone cannot guarantee
 * notifications while the browser is closed. No sign-in or remote tracking. */
const mount = document.getElementById('bible-reading-routine');
if (mount) initRoutine(mount);

function initRoutine(root) {
  const KEY = 'hk-bible-reading-routine-v1';
  const PROGRESS = 'hk-bible-reading-progress-v1';
  const GUIDED = {
    growth:{label:'Christian growth',items:[['2 Peter 3:18','Grow in grace and in the knowledge of Jesus Christ. Spiritual growth comes through learning His word and putting it into practice.','Pray for a teachable heart and grace to obey what God shows you.'],['Colossians 2:6-7','A life rooted in Christ grows stronger as faith is nourished and gratitude deepens.','Pray to be rooted in Christ and established in faith.'],['James 1:22','Reading Scripture is meant to shape daily choices, not remain knowledge alone.','Ask God to help you practise His word today.'],['John 15:4-5','Jesus teaches that lasting fruit comes from abiding in Him.','Pray for a closer walk with Christ and fruit that honours Him.'],['Psalm 119:105','God’s word gives light for the next step, even when the whole road is not clear.','Ask for guidance through Scripture in today’s decisions.']]},
    prayer:{label:'Prayer and devotion',items:[['Matthew 6:6','Jesus encourages sincere prayer before the Father, not prayer performed for people’s praise.','Pray for a sincere, consistent prayer life and a quiet heart before God.'],['Philippians 4:6-7','Bring concerns to God with prayer, supplication and thanksgiving; His peace guards the heart.','Present your worries to God and pray for His peace and wisdom.'],['1 Thessalonians 5:17','A life of prayer keeps turning toward God throughout the day.','Ask for consistency in prayer and a heart attentive to God.'],['Hebrews 4:16','God invites believers to approach His throne of grace for mercy and help.','Pray boldly for mercy, help and strength to live faithfully.'],['Luke 11:1','The disciples asked Jesus to teach them to pray. Prayer can be learned and strengthened.','Ask the Lord to teach you to pray according to His will.']]},
    destiny:{label:'Purpose and calling',items:[['Ephesians 2:10','Good works do not earn salvation; they are part of the life God calls His people to walk in.','Pray for clarity to recognise and faithfully do the good works before you.'],['Proverbs 3:5-6','Trust in the Lord rather than relying only on personal understanding.','Commit your plans to God and ask for direction in every decision.'],['Romans 12:2','A renewed mind helps believers discern what pleases God.','Pray for a renewed mind and discernment to follow God’s will.'],['Psalm 90:12','Wisdom includes remembering that our days are limited and should be used well.','Ask God to help you use your time wisely and live purposefully.'],['Colossians 3:23-24','Work wholeheartedly as service to the Lord, not merely to impress people.','Pray for diligence, integrity and faithfulness in your responsibilities.']]},
    holiness:{label:'Holiness and character',items:[['1 Peter 1:15-16','God calls His people to reflect His holiness in the whole of life.','Pray for a clean heart and strength to turn away from sin.'],['Psalm 139:23-24','Invite God to search the heart and lead you in His everlasting way.','Ask God to reveal attitudes or habits that need repentance and change.'],['Galatians 5:22-23','The Spirit produces Christlike character, including love, patience and self-control.','Pray for the fruit of the Spirit to be evident in your words and actions.'],['2 Timothy 2:22','Scripture calls believers to flee youthful passions and pursue righteousness, faith, love and peace.','Pray for strength to avoid temptation and pursue what is right.'],['Titus 2:11-12','God’s grace trains believers to reject ungodliness and live self-controlled lives.','Thank God for His grace and ask for discipline to live righteously.']]},
    faith:{label:'Faith and trust',items:[['Hebrews 11:1','Faith trusts God’s promises and character even when the outcome is not yet visible.','Pray for steadfast trust in God while you wait and obey.'],['Romans 10:17','Faith is strengthened through hearing the word of Christ.','Ask for hunger for Scripture and confidence in God’s truth.'],['Mark 9:24','A person can honestly bring struggling faith to Jesus and ask for help.','Tell God where you are struggling and ask Him to strengthen your faith.'],['Isaiah 41:10','God’s people are encouraged not to fear but to depend on His presence and help.','Pray for courage and reliance on God in the challenge before you.'],['2 Corinthians 5:7','Believers are called to walk by faith rather than sight alone.','Ask for wisdom to obey God even when you cannot see every outcome.']]},
    family:{label:'Family and relationships',items:[['Joshua 24:15','Joshua declared his household’s commitment to serve the Lord.','Pray that your home will honour God and grow in love and truth.'],['Ephesians 4:32','Kindness, tender-heartedness and forgiveness reflect the mercy shown in Christ.','Ask for grace to forgive, speak kindly and seek reconciliation where safe.'],['Proverbs 15:1','A gentle answer can turn away wrath, while harsh words stir conflict.','Pray for patience and wise words in family conversations.'],['Colossians 3:13-14','Bear with one another, forgive, and put on love that binds people together.','Pray for humility, unity and Christlike love in your relationships.'],['Psalm 127:1','Human effort needs God’s blessing and guidance.','Commit your household and responsibilities to the Lord.']]},
    wisdom:{label:'Wisdom and decisions',items:[['James 1:5','God invites those who lack wisdom to ask Him in faith.','Ask God for wisdom before making important decisions.'],['Proverbs 3:5-6','Trust the Lord and acknowledge Him in all your ways.','Pray to recognise and follow God’s direction rather than impulse.'],['Philippians 1:9-10','Love shaped by knowledge and discernment helps believers choose what is excellent.','Pray for discernment to choose what honours Christ.'],['Proverbs 15:22','Plans benefit from wise counsel.','Ask for humility to seek godly counsel and weigh advice carefully.'],['Psalm 32:8','Scripture presents God as the One who instructs and guides His people.','Pray for a responsive heart to God’s instruction.']]},
    evangelism:{label:'Evangelism and service',items:[['Matthew 28:19-20','Jesus sends His disciples to make disciples and teach His commands.','Pray for opportunities and courage to share Christ with love and truth.'],['Romans 1:16','Paul was unashamed of the gospel because it is God’s power for salvation.','Pray for boldness and clarity when speaking about the gospel.'],['Colossians 4:5-6','Wise conduct and gracious speech matter when relating to those outside the faith.','Ask God to make your words gracious, wise and helpful to others.'],['1 Timothy 2:1-4','Scripture urges prayer for all people and expresses God’s concern for salvation.','Pray for family, neighbours, leaders and people who have not heard the gospel.'],['Matthew 9:37-38','Jesus calls His followers to pray for workers for the harvest.','Pray for faithful workers and a willing heart to serve.']]},
    peace:{label:'Peace and encouragement',items:[['John 14:27','Jesus gives peace unlike the unstable peace the world offers.','Pray for Christ’s peace to guard you through today’s pressures.'],['Psalm 46:1','God is described as refuge and strength, a present help in trouble.','Bring a present difficulty to God and ask for strength to endure.'],['Isaiah 26:3','The passage connects steadfast peace with a mind stayed on God in trust.','Pray for a steady mind and trust in the Lord.'],['Romans 15:13','Paul prays that hope, joy and peace abound through trust in God.','Ask God to renew hope and help you encourage someone else.'],['2 Corinthians 1:3-4','God comforts people in affliction so that they can comfort others.','Pray to receive God’s comfort and become a comfort to someone else.']]}
  };
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
  let routine = read(KEY, {time:'05:30', days:[1,2,3,4,5,6,0], plan:'whole', customBook:'john', customChapter:1, enabled:false, alarmMode:'silent', volume:65});
  let progress = read(PROGRESS, {whole:0, nt:0, devotional:0, custom:0, completed:{}});
  if (!routine || typeof routine !== 'object') routine = {time:'05:30',days:[1,2,3,4,5,6,0],plan:'whole',customBook:'john',customChapter:1,enabled:false,alarmMode:'silent',volume:65,topic:'growth'};
  if (!Array.isArray(routine.days)) routine.days = [1,2,3,4,5,6,0];
  if (!['whole','nt','devotional','custom','guided'].includes(routine.plan)) routine.plan='whole';
  if (!routine.topic) routine.topic='growth';
  if (!['silent','ring'].includes(routine.alarmMode)) routine.alarmMode='silent';
  routine.volume=Math.max(0,Math.min(100,Number(routine.volume ?? 65)));
  if (!progress || typeof progress !== 'object') progress={whole:0,nt:0,devotional:0,custom:0,completed:{}};
  if (!progress.completed || typeof progress.completed !== 'object') progress.completed={};
  for (const key of ['whole','nt','devotional','custom']) if (!Number.isFinite(progress[key]) || progress[key]<0) progress[key]=0;
  const card = make('section', null, 'brr-card');
  card.setAttribute('aria-labelledby','brr-title');
  card.append(make('p','GROW IN THE WORD','brr-eyebrow'),make('h2','My Bible Reading Routine','brr-title'),
    make('p','Choose your reading time and days. Your schedule and progress stay on this device; no account is needed.','brr-intro'));
  const form = make('form',null,'brr-form');
  const field = (labelText, control) => { const wrap=make('div',null,'brr-field'); const label=make('label',labelText); label.htmlFor=control.id; wrap.append(label,control); return wrap; };
  const time = make('input'); time.type='time'; time.id='brr-time'; time.value=routine.time || '05:30'; time.required=true;
  form.append(field('Daily reminder time (your device time)',time));
  const alarmMode=make('select');alarmMode.id='brr-alarm-mode';
  [['silent','Silent — no alarm sound'],['ring','Ringing alarm — play sound']].forEach(([value,label])=>{const option=make('option',label);option.value=value;alarmMode.append(option);});
  alarmMode.value=routine.alarmMode;
  form.append(field('Alarm sound',alarmMode));
  const volume=make('input');volume.type='range';volume.id='brr-volume';volume.min='0';volume.max='100';volume.step='5';volume.value=String(routine.volume);
  const volumeValue=make('output',volume.value+'%','brr-volume-value');volumeValue.htmlFor='brr-volume';
  const volumeField=field('Alarm volume',volume);volumeField.append(volumeValue);form.append(volumeField);
  const soundActions=make('div',null,'brr-sound-actions');
  const testSound=make('button','Test alarm sound','brr-secondary');testSound.type='button';
  const stopSound=make('button','Stop alarm','brr-secondary');stopSound.type='button';stopSound.disabled=true;
  soundActions.append(testSound,stopSound);form.append(soundActions);
  alarmMode.addEventListener('change',()=>{routine.alarmMode=alarmMode.value;});
  volume.addEventListener('input',()=>{volumeValue.textContent=volume.value+'%';routine.volume=Number(volume.value);if(alarmGain)alarmGain.gain.value=Number(volume.value)/100;});
  const dayWrap=make('fieldset',null,'brr-days'); dayWrap.append(make('legend','Reading days'));
  const dayInputs=[];
  DAYS.forEach((day,i)=>{ const label=make('label',null,'brr-day'); const input=make('input'); input.type='checkbox'; input.value=String(i); input.checked=routine.days.includes(i); input.id='brr-day-'+i; label.append(input,document.createTextNode(day)); dayWrap.append(label); dayInputs.push(input); });
  form.append(dayWrap);
  const plan=make('select'); plan.id='brr-plan';
  [['guided','Automated Read and Pray daily plan'],['whole','Read through the whole Bible'],['nt','New Testament reading'],['devotional','Daily devotional: Psalms and John'],['custom','Choose a book and chapter']].forEach(([v,t])=>{const o=make('option',t);o.value=v;plan.append(o);});
  plan.value=routine.plan || 'whole';
  form.append(field('Reading plan',plan));
  const topic=make('select');topic.id='brr-topic';
  Object.entries(GUIDED).forEach(([value,data])=>{const option=make('option',data.label);option.value=value;topic.append(option);});
  topic.value=GUIDED[routine.topic]?routine.topic:'growth';
  form.append(field('Daily prayer focus',topic));
  const guidedHint=make('p','The guided plan selects a Scripture, a very short devotion and a prayer point for each day of the month. Choose a focus that reflects what you want to grow in.','brr-guided-hint');
  form.append(guidedHint);
  const custom=make('div',null,'brr-custom-fields');
  const book=make('select'); book.id='brr-book';
  const chapter=make('input'); chapter.type='number';chapter.id='brr-chapter';chapter.min='1';chapter.max='150';chapter.step='1';chapter.value=String(routine.customChapter||1);
  custom.append(field('Book',book),field('Chapter',chapter));form.append(custom);
  plan.addEventListener('change',()=>{custom.hidden=plan.value!=='custom';topic.closest('.brr-field').hidden=plan.value!=='guided';guidedHint.hidden=plan.value!=='guided';});
  topic.closest('.brr-field').hidden=plan.value!=='guided';guidedHint.hidden=plan.value!=='guided';
  custom.hidden=plan.value!=='custom';
  const actions=make('div',null,'brr-actions');
  const save=make('button','Save my routine','brr-primary');save.type='submit';
  const permission=make('button','Enable browser reminders','brr-secondary');permission.type='button';
  const disable=make('button','Pause routine','brr-secondary');disable.type='button';
  actions.append(save,permission,disable);form.append(actions);
  const status=make('p','Your routine is not saved yet.','brr-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const summary=make('div',null,'brr-summary');
  const devotion=make('section',null,'brr-devotion');
  const devotionTitle=make('h3','Today’s short devotion');
  const devotionRef=make('p','Choose the automated plan to receive a daily Scripture.','brr-devotion-ref');
  const devotionText=make('p','');
  const prayerTitle=make('h3','Prayer point');
  const prayerText=make('p','');
  devotion.append(devotionTitle,devotionRef,devotionText,prayerTitle,prayerText);
  const next=make('p','Save a routine to see your next reading.','brr-next');
  const done=make('button','Mark today’s reading complete','brr-primary');done.type='button';done.disabled=true;
  const open=make('a','Open today’s Bible passage','brr-open');open.href='bible.html';open.hidden=true;
  summary.append(next,open,done,devotion);
  card.append(form,status,summary,make('p','Reminder limits: notifications require browser permission and this page to be open or running in the background. If the browser is fully closed, a website-only reminder may not fire at the chosen time. Open this page again to check for a missed reminder.','brr-note'));
  root.replaceChildren(card);

  let audioContext=null, alarmGain=null, alarmTimer=null, alarmStopTimer=null;
  function prepareAudio() {
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return false;
    try {
      if(!audioContext){audioContext=new AudioContextClass();alarmGain=audioContext.createGain();alarmGain.gain.value=Number(volume.value)/100;alarmGain.connect(audioContext.destination);}
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      return true;
    } catch {return false;}
  }
  function beep() {
    if(!audioContext||!alarmGain||audioContext.state!=='running'||Number(volume.value)<=0)return;
    try {const oscillator=audioContext.createOscillator();const envelope=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=880;envelope.gain.setValueAtTime(0.0001,audioContext.currentTime);envelope.gain.exponentialRampToValueAtTime(0.22,audioContext.currentTime+0.025);envelope.gain.exponentialRampToValueAtTime(0.0001,audioContext.currentTime+0.28);oscillator.connect(envelope);envelope.connect(alarmGain);oscillator.start();oscillator.stop(audioContext.currentTime+0.3);}catch{}
  }
  function stopAlarm() {if(alarmTimer)clearInterval(alarmTimer);if(alarmStopTimer)clearTimeout(alarmStopTimer);alarmTimer=null;alarmStopTimer=null;stopSound.disabled=true;}
  function startAlarm() {
    if(!prepareAudio()){status.textContent='This browser does not support a sound alarm. Use browser notifications or silent reminders instead.';return false;}
    stopAlarm();if(Number(volume.value)<=0){status.textContent='Alarm volume is 0%. Increase the volume to hear the alarm.';return false;}
    beep();alarmTimer=setInterval(beep,850);alarmStopTimer=setTimeout(stopAlarm,30000);stopSound.disabled=false;return true;
  }
  testSound.addEventListener('click',()=>{if(startAlarm())status.textContent='Testing the ringing alarm. Press Stop alarm to silence it, or wait up to 30 seconds.';});
  stopSound.addEventListener('click',()=>{stopAlarm();status.textContent='Alarm sound stopped.';});

  function dayKey(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
  function getPassage(books) {
    const p=progress[routine.plan]||0;
    if(routine.plan==='guided') {
      const data=GUIDED[routine.topic]||GUIDED.growth;
      const dayIndex=(new Date().getDate()-1)%data.items.length;
      const item=data.items[dayIndex];
      const ref=item[0], match=ref.match(/^(.+?)\s+(\d+)/);
      const book=books.find(b=>b.name.toLowerCase()===match[1].toLowerCase()||b.id===match[1].toLowerCase().replace(/\s+/g,'-'));
      const chapter=Number(match[2]);
      return {book:book||books.find(b=>b.id==='john')||books[0],chapter,label:ref,href:book?'bible.html?book='+encodeURIComponent(book.id)+'&chapter='+chapter:'bible.html',devotion:item[1],prayer:item[2],topic:data.label,day:new Date().getDate()};
    }
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
    devotion.hidden=routine.plan!=='guided';
    if(routine.plan==='guided') { devotionTitle.textContent='Day '+passage.day+' · '+passage.topic;devotionRef.textContent='Read '+passage.label+' in the Bible, then reflect briefly.';devotionText.textContent=passage.devotion;prayerText.textContent=passage.prayer; }
    next.textContent=(completed?'Today’s reading is marked complete. Next passage: ':'Today’s passage: ')+passage.label+(passage.finished?' · Plan complete':'');
    open.href=passage.href;open.hidden=false;done.disabled=!routine.enabled||completed||passage.finished;
    done.textContent=completed?'Reading completed today ✓':'Mark today’s reading complete';
    status.textContent=routine.enabled?'Routine active · '+routine.time+' · '+routine.days.map(d=>DAYS[d]).join(', '):'Routine saved but paused. Save and enable it when you are ready.';
  }
  function saveRoutine(event) {
    event?.preventDefault();
    const selected=dayInputs.filter(x=>x.checked).map(x=>Number(x.value));
    if(!selected.length){status.textContent='Choose at least one reading day.';return;}
    routine.time=time.value||'05:30';routine.days=selected;routine.plan=plan.value;routine.topic=topic.value;routine.alarmMode=alarmMode.value;routine.volume=Number(volume.value);
    routine.customBook=book.value||'john';routine.customChapter=Math.max(1,Number(chapter.value)||1);
    routine.enabled=true;
    if(!write(KEY,routine)){status.textContent='Could not save on this device. Check browser storage settings.';return;}
    booksPromise.then(update).catch(()=>{status.textContent='Could not load the Bible book list. Reload and try again.';});
    status.textContent='Routine saved on this device. Alarm mode: '+(routine.alarmMode==='ring'?'ringing':'silent')+'. Volume: '+routine.volume+'%.';
    prepareAudio();
    checkReminder(true);
  }
  form.addEventListener('submit',saveRoutine);
  permission.addEventListener('click',async()=>{
    if(!('Notification' in window)){status.textContent='Browser notifications are not supported here. Keep this page open to see the in-page reminder.';return;}
    try { const result=await Notification.requestPermission();status.textContent=result==='granted'?'Browser notifications enabled where supported.':'Notifications were not enabled; you can still use the routine on this page.';checkReminder(true); }
    catch {status.textContent='Could not request notification permission in this browser.';}
  });
  disable.addEventListener('click',()=>{routine.enabled=false;write(KEY,routine);stopAlarm();booksPromise.then(update);status.textContent='Your reading routine is paused.';});
  done.addEventListener('click',async()=>{
    const books=await booksPromise;const passage=getPassage(books);if(!routine.enabled||progress.completed[dayKey()]||passage.finished)return;
    progress.completed[dayKey()]=true;progress[routine.plan]=(progress[routine.plan]||0)+(routine.plan==='custom'||routine.plan==='guided'?0:1);
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
    if(routine.alarmMode==='ring')startAlarm();
    status.textContent=message+(routine.alarmMode==='ring'?' Ringing alarm is on; press Stop alarm to silence it.':' Reminder is silent.');
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
