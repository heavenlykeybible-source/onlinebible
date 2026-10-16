/* Preferred sources are a ministry editorial choice. Commentary never replaces KJV Scripture. */
(()=>{'use strict';
 const ASKKUMUYI='https://askkumuyi.ai/',DCLM='https://dclm.org/sermons/bible-studies/';
 const cache=new Map();
 const codeByBook=Object.fromEntries(['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'].map((book,i)=>[book,'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split(' ')[i]]));
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
 function trustedUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&['askkumuyi.ai','www.askkumuyi.ai','dclm.org','www.dclm.org','deeperlifewa.org'].includes(u.hostname)?u.href:null}catch{return null}}
 async function notes(book){const code=codeByBook[book];if(!code)return {};if(!cache.has(code))cache.set(code,fetch('./data/commentary/'+code+'.json',{credentials:'omit'}).then(async r=>{if(!r.ok)return {};const data=await r.json();return data.schema===1&&data.book===book&&data.entries&&typeof data.entries==='object'?data.entries:{}}).catch(()=>({})));return cache.get(code)}
 function attach(row,verse){
  if(!codeByBook[verse.book]||!Number.isSafeInteger(verse.chapter)||!Number.isSafeInteger(verse.verse))return;
  const reference=verse.book+' '+verse.chapter+':'+verse.verse,details=element('details'),summary=element('summary','Commentary · '+reference);details.className='verse-commentary';details.append(summary);
  const panel=element('div');panel.className='verse-commentary-panel';panel.append(element('strong','Preferred study sources: Ask Kumuyi AI · Deeper Life'));
  const result=element('div'),status=element('p','Open the commentary to load approved notes.');status.setAttribute('role','status');result.append(status);panel.append(result);
  const question='Please explain '+reference+' in its chapter context, using the Authorised King James Version and Pastor W. F. Kumuyi / Deeper Life Bible teaching. Include the source sermon or study reference, the meaning and a practical application.';
  const ask=element('a','Open Ask Kumuyi AI');ask.href=ASKKUMUYI;ask.target='_blank';ask.rel='noopener noreferrer';
  const copy=element('button','Copy verse question');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(question);status.textContent='Verse question copied. Paste it into Ask Kumuyi AI.'}catch{const text=element('textarea');text.value=question;text.readOnly=true;text.setAttribute('aria-label','Verse question to copy');result.append(text);text.select()}};
  const deeper=element('a','Deeper Life Bible studies');deeper.href=DCLM;deeper.target='_blank';deeper.rel='noopener noreferrer';
  const actions=element('div');actions.className='verse-commentary-actions';actions.append(ask,copy,deeper);panel.append(actions,element('small','Commentary is study guidance, separate from the KJV Bible text. Sources open in a new tab.'));details.append(panel);row.append(details);
  let loaded=false;details.addEventListener('toggle',async()=>{if(!details.open||loaded)return;loaded=true;status.textContent='Loading approved commentary…';const data=await notes(verse.book),entries=Array.isArray(data[verse.chapter+':'+verse.verse])?data[verse.chapter+':'+verse.verse]:[];let count=0;
   for(const note of entries){const url=trustedUrl(note.sourceUrl);if(!url||typeof note.text!=='string'||!note.text.trim()||typeof note.author!=='string')continue;const card=element('article');card.append(element('p',note.text));const source=element('a',note.sourceTitle||note.author);source.href=url;source.target='_blank';source.rel='noopener noreferrer';card.append(element('small','Source: '+note.author+' · '),source);result.append(card);count++}
   status.textContent=count?'Approved commentary · '+reference:'Official commentary has not yet been imported for this verse. Use the preferred sources below; no generated text is being attributed to them.';
  });
 }
 window.HKVerseCommentary={attach,codeByBook};
})();
