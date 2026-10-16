import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const source=readFileSync(new URL('../global-community/src/services.ts',import.meta.url),'utf8');
const method=source.slice(source.indexOf('export async function listConnections('),source.indexOf('export async function createSpace('));
const sql=method.match(/prepare\(`([\s\S]*?)`\)/)[1];
function fixture(){const db=new DatabaseSync(':memory:');db.exec(`
 CREATE TABLE users(user_id INTEGER,status TEXT);
 CREATE TABLE profiles(user_id INTEGER,display_name TEXT);
 CREATE TABLE spaces(space_id INTEGER,name TEXT,status TEXT);
 CREATE TABLE user_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
 CREATE TABLE global_connections(user_id INTEGER,target_type TEXT,target_id INTEGER,created_at TEXT);
 INSERT INTO users VALUES(1,'active'),(2,'active'),(3,'suspended');
 INSERT INTO profiles VALUES(1,'Owner'),(2,'Visible member'),(3,'Suspended member');
 INSERT INTO spaces VALUES(4,'Active Space','active'),(5,'Hidden Space','suspended');
 INSERT INTO global_connections VALUES(1,'profile',2,'1'),(1,'profile',3,'2'),(1,'space',4,'3'),(1,'space',5,'4');`);return db;}
test('connection directory omits suspended accounts and spaces',()=>{const db=fixture();try{assert.deepEqual(db.prepare(sql).all(1,9,9).map(x=>x.target_id),[4,2]);}finally{db.close();}});
test('both block directions protect the actual viewer of another member directory',()=>{
 for(const pair of [[9,2],[2,9]]){const db=fixture();try{db.prepare('INSERT INTO user_blocks VALUES(?,?)').run(...pair);assert.deepEqual(db.prepare(sql).all(1,9,9).map(x=>x.target_id),[4]);}finally{db.close();}}
});
test('public viewers still see active public directory entries',()=>{const db=fixture();try{assert.deepEqual(db.prepare(sql).all(1,null,null).map(x=>x.target_id),[4,2]);}finally{db.close();}});
