import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const start=source.indexOf('function premiumText(');
const end=source.indexOf('function videoPost(',start);
assert.ok(start>0&&end>start,'premium text function must exist');

function el(tag,text='',className=''){
 return {
  tag,className,textContent:text??'',children:[],attributes:{},handlers:{},
  append(...nodes){this.children.push(...nodes);},
  replaceChildren(...nodes){this.children=[...nodes];},
  setAttribute(key,val){this.attributes[key]=val;},
  getAttribute(key){return this.attributes[key];},
  addEventListener(key,handler){this.handlers[key]=handler;}
 };
}
const premiumText=new Function('el',source.slice(start,end)+'\nreturn premiumText;')(el);
test('formats paragraphs without changing words',()=>{
 const original='The Lord is faithful.\n\nKeep trusting Him.';
 const post=premiumText(original);
 assert.equal(post.children[0].children.length,2);
 assert.equal(post.children[0].children[0].textContent,'The Lord is faithful.');
 assert.equal(post.children[0].children[1].textContent,'Keep trusting Him.');
});
test('visually highlights references, without inventing verses',()=>{
 const post=premiumText('Psalm 27:14\n\nContinue in prayer.');
 assert.equal(post.children[0].children[0].tag,'blockquote');
 assert.equal(post.children[0].children[0].textContent,'Psalm 27:14');
 assert.equal(post.children[0].children[1].tag,'p');
});
test('read more reveals exact original message and can collapse again',()=>{
 const original='Faith is patient. '.repeat(60);
 const post=premiumText(original,100);
 const button=post.children[1];
 assert.equal(button.textContent,'Read more');
 assert.equal(button.getAttribute('aria-expanded'),'false');
 button.handlers.click();
 assert.equal(post.children[0].children[0].textContent,original);
 assert.equal(button.getAttribute('aria-expanded'),'true');
 button.handlers.click();
 assert.equal(button.getAttribute('aria-expanded'),'false');
 assert.ok(post.children[0].children[0].textContent.endsWith('…'));
});
test('Design Card renderer remains separate',()=>{
 assert.match(source,/function designCard\(/);
 assert.match(source,/function expandableText\(/);
 assert.match(source,/else if\(settings\)\{x\.append\(designCard\(/);
 assert.match(source,/premiumText\(p\.body\)/);
});
