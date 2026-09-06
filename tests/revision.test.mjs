import test from 'node:test';import assert from 'node:assert/strict';
import {starter} from '../src/sim.js';import {revise,evaluateRevision} from '../src/revision.js';
const poor={...starter,rules:[{when:'tired',do:'rest'},{when:'foodNear',do:'gather'},{when:'carrying',do:'deposit'},{when:'always',do:'explore'}]};
test('revision cannot improve score by changing population or terrain',()=>{assert.throws(()=>revise(starter,{name:'Cheat',hypothesis:'More agents',rules:starter.rules,population:12}));assert.throws(()=>evaluateRevision({...starter,speed:2},starter));});
test('strict improvement over parent is adopted on both seed groups',()=>{const result=evaluateRevision(starter,poor);assert.equal(result.adopted,true);assert.ok(result.trainingDelta>0&&result.holdoutDelta>0);});
test('regressions and renamed duplicates never replace the parent',()=>{assert.equal(evaluateRevision(poor,starter).adopted,false);assert.equal(evaluateRevision({...starter,name:'Duplicate'},starter).adopted,false);});
test('constructing a revision preserves parent fields and does not mutate parent',()=>{const before=structuredClone(starter),next=revise(starter,{name:'Trial',hypothesis:'Test',rules:poor.rules});assert.deepEqual(starter,before);assert.deepEqual(next.food,starter.food);assert.notEqual(next.food,starter.food);});
