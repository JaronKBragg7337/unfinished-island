import test from 'node:test';import assert from 'node:assert/strict';
import {starter,create,step,validate,compare} from '../src/sim.js';
test('identical seed and program produce identical replay',()=>assert.deepEqual(step(starter,create(starter),720),step(starter,create(starter),720)));
test('restart from persisted snapshot preserves trajectory and IDs',()=>{const s=step(starter,create(starter,'proof'),317);const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(step(starter,restored,403),step(starter,create(starter,'proof'),720));assert.equal(restored.agents[0].id,'proof/resident-0');});
test('material conservation and finite bounds survive 20000 steps',()=>{const s=step(starter,create(starter),20000);assert.equal(s.harvested,s.stored+s.agents.reduce((n,a)=>n+a.carrying,0));for(const a of s.agents){assert.ok(Math.abs(a.x)<=18&&Math.abs(a.z)<=18);assert.ok(a.energy>=0&&a.energy<=100);}assert.ok(s.stored>0);});
test('ordered behavior causally changes deposited food',()=>{const pairs=compare(starter);assert.ok(pairs.every(r=>r.candidate.stored>r.baseline.stored));});
test('rejects unsupported programs and unbounded workloads',()=>{for(const p of [{...starter,population:1e8},{...starter,speed:NaN},{...starter,rules:[{when:'always',do:'exec'}]},{...starter,food:[[Infinity,0]]}])assert.throws(()=>validate(p));});
