import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {validate} from '../src/sim.js';
test('published programs retain their source hashes, ancestry and unique inhabitants',()=>{
 const world=JSON.parse(fs.readFileSync('public/data/world.json','utf8'));const ids=new Set();
 for(const c of world.children){
  assert.equal(c.parentId,world.parent.id);assert.ok(!ids.has(c.id));ids.add(c.id);
  const program=validate(JSON.parse(fs.readFileSync('public/data/'+c.source,'utf8')));
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(program,null,2)+'\n').digest('hex'),c.hash);
  const snapshot=JSON.parse(fs.readFileSync('public/data/'+c.snapshot,'utf8'));assert.equal(snapshot.id,c.id);
  assert.equal(snapshot.harvested,snapshot.stored+snapshot.agents.reduce((n,a)=>n+a.carrying,0));
  for(const a of snapshot.agents){assert.ok(!ids.has(a.id));ids.add(a.id);assert.ok(a.id.startsWith(c.id+'/'));}
 }
});
