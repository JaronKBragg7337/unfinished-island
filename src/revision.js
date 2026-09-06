import {validate,trial} from './sim.js';

// Rule revisions preserve the environment and interpreter semantics of the parent.
export function revise(parent,proposal){
 if(!proposal||Object.keys(proposal).some(k=>!['name','hypothesis','rules'].includes(k)))throw Error('A revision may change only name, hypothesis and rules');
 return validate({...structuredClone(parent),name:proposal.name,hypothesis:proposal.hypothesis,rules:proposal.rules});
}
export function evaluateRevision(candidate,parent){
 for(const key of ['language','seed','population','speed','sense','food'])if(JSON.stringify(candidate[key])!==JSON.stringify(parent[key]))throw Error(`Revision changed fixed environment: ${key}`);
 const paired=seeds=>seeds.map(seed=>({candidate:trial(candidate,720,seed),parent:trial(parent,720,seed)}));
 const training=paired([17,83,211]),holdout=paired([401,809,1543]);
 const delta=rows=>rows.reduce((n,r)=>n+r.candidate.stored-r.parent.stored,0);
 const trainingDelta=delta(training),holdoutDelta=delta(holdout);
 const adopted=trainingDelta>0&&holdoutDelta>0&&holdout.every(r=>r.candidate.stored>=r.parent.stored);
 return {training,holdout,trainingDelta,holdoutDelta,adopted,reason:adopted?'More food delivered in training and holdout trials, with no holdout regression.':'Previous policy retained: requires improvement in both groups and no holdout regression.'};
}
