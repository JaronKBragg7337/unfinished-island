import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validate,starter,create,step,compare} from '../src/sim.js';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const data=path.join(root,'public/data');await fs.mkdir(data,{recursive:true});await fs.mkdir('.runtime',{recursive:true});
let lock;
try{lock=await fs.open('.runtime/cycle.lock','wx');}
catch{
 const pid=Number(await fs.readFile('.runtime/cycle.lock','utf8'));
 if(!pid)throw Error('Empty lock; a cycle may be starting. Retry later.');
 let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;}
 if(alive)throw Error('A cycle is already running.');
 await fs.unlink('.runtime/cycle.lock');lock=await fs.open('.runtime/cycle.lock','wx');
}
await lock.writeFile(String(process.pid));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:90000});
const write=async(file,value)=>{const temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(value,null,2)+'\n');await fs.rename(temp,file);};
try{
 const publish=process.argv.includes('--publish');
 if(publish){if(git('status','--porcelain').trim())throw Error('Checkout has changes; refusing to mix worker and author edits.');git('pull','--ff-only');}
 let state;try{state=JSON.parse(await fs.readFile(path.join(data,'world.json'),'utf8'));}catch{state={version:1,origin:new Date().toISOString(),cycles:0,children:[],events:[],parent:{id:'island-0001',age:0,structures:[]}};}
 const now=new Date().toISOString();state.cycles++;
 const id=`child-${String(state.cycles).padStart(4,'0')}`;
 let program,author,raw='';
 const prompt=`You are Mara, a resident at terminal island-0001/workstation-01. You are explicitly assigned to create a child simulation and improve food deposition. Write an executable declarative Island Language program, JSON only. No shell, JavaScript, markdown, or extra fields. Grammar: language="island/1", name:string max70, hypothesis:string max800, seed:integer 1..1000000, population:integer 2..12, speed:number 0.3..2, sense:number 2..16, food:3..20 pairs [x,z] within -18..18, rules:1..8 {when,do}. Conditions: always,carrying,tired,foodNear. Actions: gather,deposit,rest,explore. First matching rule wins. Carrying capacity 3; deposit moves home and stores food; tired is energy<28; gather only helps with nearby food; include always fallback. Motion costs 0.8 energy/metre, rest restores4. Patches regenerate1 each30 ticks. Objective: design and explain a foraging society, then test it. Prior results: ${JSON.stringify(state.children.slice(-3).map(c=>({name:c.name,results:c.results,hypothesis:c.hypothesis}))).slice(0,4500)}. Example syntax: ${JSON.stringify(starter)}. Create your own program.`;
 try{
  if(process.argv.includes('--seed')){program=starter;author='Codex / authored seed';}
  else{
   const response=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3.5:4b',stream:false,think:false,format:'json',messages:[{role:'user',content:prompt}],options:{temperature:0.8,num_predict:1800,num_ctx:8192}}),signal:AbortSignal.timeout(240000)});
   if(!response.ok)throw Error(`Local model HTTP ${response.status}`);
   const result=await response.json();raw=result.message.content;program=validate(JSON.parse(raw));author='Mara / qwen3.5:4b';
  }
  const source=JSON.stringify(program,null,2)+'\n';const hash=crypto.createHash('sha256').update(source).digest('hex');
  await fs.writeFile(path.join(data,`${id}.island.json`),source,{flag:'wx'});
  const results=compare(program);const snapshot=step(program,create(program,id),720);
  await write(path.join(data,`${id}.snapshot.json`),snapshot);
  const child={id,parentId:'island-0001',terminalId:'island-0001/workstation-01',created:now,author,assignment:'Explicitly assigned child-world experiment',name:program.name,hypothesis:program.hypothesis,hash,source:`${id}.island.json`,snapshot:`${id}.snapshot.json`,results};
  state.children.push(child);state.events.push({at:now,type:'child-created',id,message:`${author} wrote ${program.name}; executed 720 steps and three paired trials.`});
  await write(path.join(data,`${id}.record.json`),{...child,prompt,raw:raw||source});
 }catch(error){state.events.push({at:now,type:'experiment-failed',id,message:String(error.message)});await write(path.join(data,`${id}.failure.json`),{at:now,error:String(error.message),raw,prompt});}
 // Existing children continue advancing even if a model proposal fails.
 for(const child of state.children){const p=JSON.parse(await fs.readFile(path.join(data,child.source),'utf8'));const s=JSON.parse(await fs.readFile(path.join(data,child.snapshot),'utf8'));step(p,s,360);await write(path.join(data,child.snapshot),s);child.tick=s.tick;child.stored=s.stored;}
 state.parent.age+=360;state.updated=now;state.nextExpected=new Date(Date.now()+3600000).toISOString();
 state.events.push({at:now,type:'world-advanced',message:`Committed 360 additional steps to ${state.children.length} child worlds.`});
 await write(path.join(data,'world.json'),state);
 execFileSync(process.execPath,['--test','tests/sim.test.mjs','tests/records.test.mjs'],{stdio:'inherit',timeout:60000});
 if(publish){git('add','public/data');git('commit','-m',`Record island cycle ${state.cycles}: ${state.children.length} child worlds\n\nCo-Authored-By: Codex <noreply@openai.com>`);git('push','origin','main');}
 console.log(JSON.stringify({cycles:state.cycles,children:state.children.length,last:state.events.slice(-2)}));
}finally{await lock.close();await fs.unlink('.runtime/cycle.lock');}
