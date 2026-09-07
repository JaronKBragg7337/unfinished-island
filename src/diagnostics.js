import {validate,create,step} from './sim.js';
export function diagnose(program){
 validate(program);
 const ruleHits=program.rules.map(()=>0),state=create({...program,seed:17});
 step(program,state,720,({ruleIndex})=>ruleHits[ruleIndex]++);
 const warnings=[];const fallback=program.rules.findIndex(r=>r.when==='always');
 if(fallback<program.rules.length-1)warnings.push(`Rule ${fallback+1} is unconditional: all rules after it are unreachable.`);
 if(!program.rules.some(r=>r.do==='deposit'))warnings.push('No deposit action exists. Gathering never automatically deposits cargo.');
 if(!program.rules.some(r=>r.do==='gather'))warnings.push('No gather action exists. Exploring never automatically collects food.');
 if(state.stored===0)warnings.push('Executed 720 steps with seed 17 and delivered zero food.');
 return {seed:17,ticks:720,stored:state.stored,harvested:state.harvested,carried:state.agents.reduce((n,a)=>n+a.carrying,0),ruleHits,warnings};
}
