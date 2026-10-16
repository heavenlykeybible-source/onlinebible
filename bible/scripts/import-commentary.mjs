/** Import a publisher-authorised corpus into public files, then send it through Account 4 review. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve} from 'node:path';
const file=process.argv[2];if(!file)throw Error('Provide an authorised commentary JSON file.');
const input=JSON.parse(await readFile(file,'utf8')),root=new URL('../public/',import.meta.url);
if(input.schema!==1||!Array.isArray(input.entries)||!input.rights||!['publisher_license','user_owned'].includes(input.rights.basis)||typeof input.rights.reference!=='string'||!input.rights.reference.trim())throw Error('Include the corpus rights basis and permission reference.');
const manifest=JSON.parse(await readFile(new URL('data/kjv/manifest.json',root),'utf8')),books=new Map(),grouped=new Map(),seen=new Set();
for(const book of manifest.books)books.set(book.name,{...book,data:JSON.parse(await readFile(new URL('data/kjv/'+book.code+'.json',root),'utf8'))});
for(const entry of input.entries){
 const b=books.get(entry.book),verses=b?.data.chapters[String(entry.chapter)];if(!b||!Number.isInteger(entry.chapter)||!Number.isInteger(entry.verse)||!verses?.some(v=>v.number===entry.verse))throw Error('Invalid verse reference.');
 const url=new URL(entry.sourceUrl);if(url.protocol!=='https:'||url.username||url.password||!['askkumuyi.ai','www.askkumuyi.ai','dclm.org','www.dclm.org','deeperlifewa.org'].includes(url.hostname)||typeof entry.text!=='string'||!entry.text.trim()||entry.text.length>12000||typeof entry.author!=='string'||!entry.author.trim()||typeof entry.sourceTitle!=='string')throw Error('Every note needs commentary text, author and a preferred-source citation.');
 const key=entry.chapter+':'+entry.verse;if(!grouped.has(b.code))grouped.set(b.code,{schema:1,book:b.name,entries:{}});const book=grouped.get(b.code);(book.entries[key]||=[]).push({text:entry.text,author:entry.author,sourceTitle:entry.sourceTitle,sourceUrl:url.href});seen.add(b.code+':'+key);
}
if(input.complete===true&&seen.size!==31102)throw Error('A complete corpus must cover all 31,102 verses.');
await mkdir(new URL('data/commentary/',root),{recursive:true});
for(const [code,book] of grouped)await writeFile(new URL('data/commentary/'+code+'.json',root),JSON.stringify(book));
await writeFile(new URL('data/commentary/catalog.json',root),JSON.stringify({schema:1,translation:'KJV',verseCount:31102,sourcePriority:['Ask Kumuyi AI','Deeper Christian Life Ministry'],status:seen.size===31102?'complete':'partial',importedVerseCount:seen.size,rights:input.rights},null,2));
console.log(JSON.stringify({importedVerses:seen.size,published:false,next:'Send these public files to the Account 4 awaiting room for preview and approval.'}));
