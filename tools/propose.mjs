import {revise} from '../src/revision.js';
import {validate} from '../src/sim.js';
import {diagnose} from '../src/diagnostics.js';
export const revisionSchema={type:'object',additionalProperties:false,required:['name','hypothesis','rules'],properties:{name:{type:'string',minLength:1,maxLength:70},hypothesis:{type:'string',maxLength:800},rules:{type:'array',minItems:1,maxItems:8,items:{type:'object',additionalProperties:false,required:['when','do'],properties:{when:{type:'string',enum:['always','carrying','tired','foodNear']},do:{type:'string',enum:['gather','deposit','rest','explore']}}}}}};

// Two model calls at most. Repairs are model-authored; do not silently fix rules.
export async function propose(parent,prompt,generate){
 const attempts=[];let request=prompt;
 for(let i=0;i<2;i++){
  let raw='';
  try{
   raw=await generate(request,parent?revisionSchema:'json');
   const parsed=JSON.parse(raw),program=parent?revise(parent,parsed):validate(parsed),diagnostics=diagnose(program);
   attempts.push({prompt:request,raw,diagnostics});
   if(!diagnostics.warnings.length||i===1)return {program,raw,diagnostics,attempts};
   request=`${prompt}\nYour previous proposal was executed. Its response: ${raw}\nObserved diagnostics: ${JSON.stringify(diagnostics)}\nRepair this proposal using the same JSON schema. Rule-hit counts are in source order. First matching rule wins. An always rule belongs last. There is no automatic gathering or depositing beyond explicit actions. Keep a reachable deposit action and a reachable gather action. Hypotheses are unverified; base your correction on the execution counts. This is your one repair attempt.`;
  }catch(error){
   attempts.push({prompt:request,raw,error:String(error.message)});
   if(i===1){error.attempts=attempts;throw error;}
   request=`${prompt}\nPrevious response: ${raw}\nValidation error: ${error.message}\nReturn a corrected response in the required schema. This is your one repair attempt.`;
  }
 }
}
