// Island Language v1. Data-only instructions; no eval, network or host access.
export const CONDITIONS=['always','carrying','tired','foodNear'];
export const ACTIONS=['gather','deposit','rest','explore'];
export function validate(p){
 if(!p||p.language!=='island/1')throw Error('Expected island/1');
 if(typeof p.name!=='string'||p.name.length<1||p.name.length>70)throw Error('Invalid name');
 if(typeof p.hypothesis!=='string'||p.hypothesis.length>800)throw Error('Invalid hypothesis');
 if(!Number.isInteger(p.seed)||p.seed<1||p.seed>1000000)throw Error('Invalid seed');
 if(!Number.isInteger(p.population)||p.population<2||p.population>12)throw Error('Population 2–12');
 if(!Number.isFinite(p.speed)||p.speed<0.3||p.speed>2)throw Error('Speed 0.3–2 metres per step');
 if(!Number.isFinite(p.sense)||p.sense<2||p.sense>16)throw Error('Sense 2–16 metres');
 if(!Array.isArray(p.food)||p.food.length<3||p.food.length>20)throw Error('3–20 food patches');
 for(const f of p.food)if(!Array.isArray(f)||f.length!==2||f.some(v=>!Number.isFinite(v)||Math.abs(v)>18))throw Error('Food coordinates within 18 metres');
 if(!Array.isArray(p.rules)||!p.rules.length||p.rules.length>8)throw Error('1–8 rules');
 for(const r of p.rules)if(!CONDITIONS.includes(r.when)||!ACTIONS.includes(r.do))throw Error('Invalid rule');
 if(!p.rules.some(r=>r.when==='always'))throw Error('An always fallback is required');
 return p;
}
export const starter=validate({language:'island/1',name:'Tidal Orchard',hypothesis:'Returning gathered food before exploring may preserve a shared stockpile.',seed:713,population:5,speed:0.7,sense:8,food:[[-8,4],[9,6],[3,-10],[-12,-8],[13,-6]],rules:[{when:'carrying',do:'deposit'},{when:'tired',do:'rest'},{when:'foodNear',do:'gather'},{when:'always',do:'explore'}]});
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
export function create(p,id='child-0000'){
 validate(p);const s={id,tick:0,rng:p.seed,stored:0,harvested:0,agents:[],food:p.food.map(([x,z],i)=>({id:`${id}/food-${i}`,x,z,amount:8})),events:[]};
 for(let i=0;i<p.population;i++)s.agents.push({id:`${id}/resident-${i}`,x:(random(s)-0.5)*4,z:(random(s)-0.5)*4,energy:100,carrying:0,target:null,action:'explore'});
 return s;
}
export function step(p,s,n=1,observe=null){
 for(let t=0;t<n;t++){
  s.tick++;
  for(const f of s.food)if(s.tick%30===0)f.amount=Math.min(8,f.amount+1);
  for(const a of s.agents){
   const nearest=s.food.filter(f=>f.amount>0).sort((f,g)=>Math.hypot(f.x-a.x,f.z-a.z)-Math.hypot(g.x-a.x,g.z-a.z))[0];
   const near=nearest&&Math.hypot(nearest.x-a.x,nearest.z-a.z)<=p.sense;
   const rule=p.rules.find(r=>r.when==='always'||r.when==='carrying'&&a.carrying>0||r.when==='tired'&&a.energy<28||r.when==='foodNear'&&near);
   if(observe)observe({ruleIndex:p.rules.indexOf(rule),carrying:a.carrying,energy:a.energy,tick:s.tick});
   a.action=rule.do;
   if(rule.do==='rest'){a.energy=Math.min(100,a.energy+4);continue;}
   if(a.energy<=0){a.energy=Math.min(100,a.energy+2);a.action='recover';continue;}
   let target;
   if(rule.do==='deposit')target={x:0,z:0};
   else if(rule.do==='gather'&&nearest)target=nearest;
   else {if(!a.target||Math.hypot(a.target.x-a.x,a.target.z-a.z)<0.8)a.target={x:(random(s)-0.5)*34,z:(random(s)-0.5)*34};target=a.target;}
   const dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz),v=Math.min(d,p.speed);
   if(d>0){a.x+=dx/d*v;a.z+=dz/d*v;a.energy=Math.max(0,a.energy-v*0.8);}
   if(d<=p.speed+0.4){
    if(rule.do==='deposit'&&a.carrying){s.stored+=a.carrying;a.carrying=0;}
    if(rule.do==='gather'&&nearest&&nearest.amount>0&&a.carrying<3){nearest.amount--;a.carrying++;s.harvested++;}
   }
  }
  if(s.tick%120===0)s.events.push({tick:s.tick,stored:s.stored,harvested:s.harvested});
  if(s.events.length>120)s.events.shift();
 }
 return s;
}
export function trial(p,ticks=720,seed=p.seed){const c={...p,seed};const s=step(c,create(c),ticks);return {ticks,seed,stored:s.stored,harvested:s.harvested,meanEnergy:+(s.agents.reduce((n,a)=>n+a.energy,0)/s.agents.length).toFixed(2)};}
export function compare(p){const baseline={...p,rules:[{when:'tired',do:'rest'},{when:'foodNear',do:'gather'},{when:'carrying',do:'deposit'},{when:'always',do:'explore'}]};return [17,83,211].map(seed=>({candidate:trial(p,720,seed),baseline:trial(baseline,720,seed)}));}
