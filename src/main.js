import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {create,step} from './sim.js';
import './style.css';

const $=s=>document.querySelector(s), app=$('#app');
app.innerHTML=`<canvas id="world" aria-label="Interactive island"></canvas>
<header><a class="brand" href="https://www.heartbeatobservatory.com"><span class="mark">◉</span><span>HEARTBEAT<br><small>OBSERVATORY</small></span></a><div class="world-title"><span class="eyebrow">FIELD STATION / 001</span><h1>The Unfinished Island</h1></div><button id="menu" aria-label="Open field guide">☰</button></header>
<div id="status"><i></i><span>Reading the island’s record…</span></div>
<aside id="guide"><button class="close" aria-label="Close field guide">×</button><span class="eyebrow">A WORLD THAT WRITES WORLDS</span><h2>Welcome to the station.</h2><p>Mara’s computer runs a child world written by a local AI on the MSI. Enter it, follow its inhabitants, and inspect the program that makes them move.</p><p>The station is authored by Codex. Mara receives an explicit assignment and writes a bounded simulation program. Her recorded experiments continue on the MSI between visits.</p><p>Drag to orbit. Scroll or pinch to zoom. Choose Walk to explore at ground level. In Walk, use WASD or hold the left side to move; drag the right side to look.</p><a href="https://github.com/JaronKBragg7337/unfinished-island" target="_blank" rel="noreferrer">Open the source ↗</a><button id="dismiss">Explore the island</button></aside>
<div id="location"><span class="eyebrow" id="depth">PARENT WORLD · DEPTH 0</span><strong id="place">Mara’s field station</strong><span id="coordinates"></span></div>
<nav id="tools" aria-label="World controls"><button id="orbit" class="selected">Orbit</button><button id="walk">Walk</button><button id="inspect">Inspect</button><button id="journal">History <span id="count">0</span></button><button id="terminal">Computer ↗</button></nav>
<div id="hint">A working world, inside a working computer.</div><button id="return" hidden>← Return to the island</button>
<div id="stick"><div></div></div><div id="reticle" hidden>+</div>
<section id="panel" hidden><button class="close" aria-label="Close panel">×</button><div id="panel-body"></div></section>
<div id="error" hidden></div>`;
const canvas=$('#world'), renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
const scene=new THREE.Scene();scene.background=new THREE.Color('#9fc4cd');scene.fog=new THREE.FogExp2('#adcbd0',0.008);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,0.1,500);camera.position.set(16,11,21);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,2,0);controls.maxDistance=100;controls.minDistance=3;controls.maxPolarAngle=Math.PI*0.49;controls.enableDamping=true;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
scene.add(new THREE.HemisphereLight(0xc0e7ff,0x637150,.85));const sun=new THREE.DirectionalLight(0xffe6be,2.6);sun.position.set(-25,42,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:120});sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.04;scene.add(sun);
const island=new THREE.Group(), childGroup=new THREE.Group();scene.add(island,childGroup);childGroup.visible=false;
const assets=[], colliders=[];let serial=0;
const loader=new THREE.TextureLoader();
function texture(file,color=false){const t=loader.load(`${import.meta.env.BASE_URL}textures/${file}`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
const woodMap=texture('wood.jpg',true),woodNormal=texture('wood-normal.jpg'),woodArm=texture('wood-arm.jpg');
const mats={wood:new THREE.MeshStandardMaterial({map:woodMap,normalMap:woodNormal,normalScale:new THREE.Vector2(.3,.3),roughnessMap:woodArm,roughness:.9,color:0xb9a17f}),steel:new THREE.MeshStandardMaterial({color:0x64777b,roughness:.43,metalness:.8}),dark:new THREE.MeshStandardMaterial({color:0x1c3035,roughness:.6,metalness:.55}),brass:new THREE.MeshStandardMaterial({color:0xc99c55,roughness:.4,metalness:.65}),cream:new THREE.MeshStandardMaterial({color:0xe3d9b9,roughness:.8}),roof:new THREE.MeshStandardMaterial({color:0x2c6267,roughness:.6,metalness:.4}),rock:new THREE.MeshStandardMaterial({color:0x828f83,roughness:1}),green:new THREE.MeshStandardMaterial({color:0x446347,roughness:1}),orange:new THREE.MeshStandardMaterial({color:0xcf6947,roughness:.65}),black:new THREE.MeshStandardMaterial({color:0x18252b,roughness:.6})};
function register(o,id,label,solid=false){o.userData={id,label};assets.push(o);if(solid)colliders.push(o);return o;}
function box(parent,w,h,d,x,y,z,mat=mats.wood,id){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,1,Math.min(.035,w/5,h/5,d/5)),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;if(mat===mats.wood){const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.max(w,d)/.55,uv.getY(i)*h/.55);}parent.add(mesh);if(id)register(mesh,id,id);return mesh;}
function cylinder(parent,r,h,x,y,z,mat=mats.steel,rt=r){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,r,h,16),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function beam(parent,a,b,r=.06,mat=mats.wood){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),m=cylinder(parent,r,av.distanceTo(bv),0,0,0,mat);m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m;}
function textPlane(parent,text,x,y,z,w=2,h=.55,bg='#173b43',fg='#f1e7c8'){const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.font='600 60px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,128);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
function groundHeight(x,z){const radius=Math.sqrt(x*x+z*z);return Math.max(-1.7,1.0-Math.pow(radius/27,6)*2.8)+Math.sin(x*.23)*Math.cos(z*.2)*.12;}
const groundMap=texture('ground.jpg',true);groundMap.repeat.set(22,22);
const terrainGeo=new THREE.PlaneGeometry(70,70,100,100);terrainGeo.rotateX(-Math.PI/2);const pos=terrainGeo.attributes.position,colors=[];
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),h=groundHeight(x,z);pos.setY(i,h);const c=new THREE.Color(h<.3?'#c4b793':'#819376');c.multiplyScalar(.93+.07*Math.sin(x*1.7+z*2.2));colors.push(c.r,c.g,c.b);}terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeo.computeVertexNormals();const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,map:groundMap,roughness:1}));terrain.receiveShadow=true;island.add(terrain);register(terrain,'island-0001/terrain','Tidal island, 70 × 70 metres');
const water=new THREE.Mesh(new THREE.PlaneGeometry(900,900,50,50),new THREE.MeshPhysicalMaterial({color:0x387b83,roughness:.24,metalness:.15,clearcoat:.75}));water.rotation.x=-Math.PI/2;water.position.y=-.08;scene.add(water);
// Field station: separate posts, shoes, joists, boards, fasteners, roof sheets.
const station=register(new THREE.Group(),'island-0001/station','Open field station · 8 × 6 metres');island.add(station);
for(let i=0;i<30;i++)box(station,8,.09,.185,0,1.25,-3+i*.2,mats.wood,`island-0001/deck/board-${i}`);
for(const x of [-3.7,0,3.7])box(station,.14,.3,6,x,1.05,0);
for(const x of [-3.8,3.8])for(const z of [-2.8,2.8]){box(station,.2,3.6,.2,x,2.65,z);box(station,.28,.3,.28,x,1.5,z,mats.steel);for(const y of [1.43,1.6])cylinder(station,.035,.25,x,y,z,mats.brass).rotation.x=Math.PI/2;beam(station,[x,3.4,z],[x*.65,4.3,z],.07);}
for(const z of [-2.8,2.8])box(station,8.1,.22,.18,0,4.35,z);
for(let i=0;i<18;i++){const roof=box(station,.46,.055,6.5,-4.1+i*.48,4.57,0,mats.roof);roof.rotation.z=-.04;}
for(const x of [-3.8,0,3.8])box(station,.12,.18,6.1,x,4.4,0);
textPlane(station,'UNFINISHED / FIELD STATION',0,3.88,2.95,4.8,.55);
for(let i=0;i<3;i++)box(island,2,.12,.5,0,1.1-i*.17,3.25+i*.48);
// Workbench dimensions 2.4 x .85 x .95m with drawers and braces.
const desk=register(new THREE.Group(),'island-0001/workstation-01','Mara’s computer · enter its running world',true);desk.position.set(0,1.3,-1.1);station.add(desk);
box(desk,2.4,.08,.85,0,.95,0);for(const x of [-1.08,1.08])for(const z of [-.32,.32])box(desk,.08,.91,.08,x,.455,z,mats.steel);
box(desk,2.2,.07,.08,0,.2,-.32,mats.steel);for(let i=0;i<2;i++){box(desk,.52,.16,.64,.8,.72-i*.18,0);box(desk,.18,.025,.04,.8,.72-i*.18,.35,mats.steel);}
box(desk,.88,.56,.12,-.2,1.35,-.14,mats.dark);box(desk,.1,.22,.1,-.2,1.05,-.18,mats.steel);box(desk,.45,.025,.3,-.2,1,-.12,mats.steel);
const screenCanvas=document.createElement('canvas');screenCanvas.width=768;screenCanvas.height=432;const screenCtx=screenCanvas.getContext('2d'),screenTexture=new THREE.CanvasTexture(screenCanvas);
const screen=new THREE.Mesh(new THREE.PlaneGeometry(.79,.445),new THREE.MeshBasicMaterial({map:screenTexture}));screen.position.set(-.2,1.35,-.073);desk.add(screen);
box(desk,.65,.025,.23,-.2,1.012,.21,mats.dark);for(let r=0;r<4;r++)for(let c=0;c<13;c++)box(desk,.039,.012,.033,-.48+c*.047,1.03,.13+r*.047,mats.cream);
const cable=new THREE.CatmullRomCurve3([new THREE.Vector3(.2,1.1,-.2),new THREE.Vector3(.45,.7,-.4),new THREE.Vector3(.5,.2,-.35),new THREE.Vector3(1,.1,-.25)]);desk.add(new THREE.Mesh(new THREE.TubeGeometry(cable,16,.012,6,false),mats.black));
textPlane(desk,'MARA / WORLD COMPUTER',-.2,.76,.438,1.22,.18);
// Bench seat, instrument cabinet, photovoltaic array, path and working quay.
box(station,1.3,.09,.4,0,1.88,.15);for(const x of [-.48,.48])box(station,.08,.54,.34,x,1.57,.15,mats.steel);
const cabinet=register(new THREE.Group(),'island-0001/cabinet','Instrument cabinet',true);cabinet.position.set(-2.7,1.3,-1.5);station.add(cabinet);box(cabinet,.9,1.25,.5,0,.625,0,mats.cream);for(const x of [-.23,.23]){box(cabinet,.43,1.16,.04,x,.65,.27,mats.steel);box(cabinet,.035,.18,.035,x+.1,.65,.305,mats.brass);}for(let i=0;i<5;i++)box(cabinet,.6,.018,.02,0,.2+i*.045,.303,mats.dark);
const solar=register(new THREE.Group(),'island-0001/solar-array','Photovoltaic array · assembled support');solar.position.set(-7,1,0);island.add(solar);
for(const z of [-1,1]){beam(solar,[-1,0,z],[-1,1.9,z],.06,mats.steel);beam(solar,[1,0,z],[1,1.1,z],.06,mats.steel);beam(solar,[-1,1.9,z],[1,1.1,z],.05,mats.steel);}
for(let i=0;i<3;i++)for(let j=0;j<6;j++){const cell=box(solar,.61,.045,.37,-.65+i*.65,1.65-i*.26,-1+j*.4,new THREE.MeshStandardMaterial({color:0x153f59,metalness:.65,roughness:.22}));cell.rotation.z=-.38;}
for(let i=0;i<26;i++){const z=6+i*.54;box(island,2.1,.1,.46,1,1.03,z);if(i%4===0)for(const x of [-.2,2.2])cylinder(island,.09,2.1,x,.35,z,mats.wood);}
const lightPosts=[];for(const [x,z] of [[-4,5],[4,5],[1,19],[-6,-6]]){const g=new THREE.Group();island.add(g);g.position.set(x,groundHeight(x,z),z);cylinder(g,.045,2.6,0,1.3,0);box(g,.26,.08,.26,0,2.64,0,mats.dark);box(g,.18,.24,.18,0,2.48,0,new THREE.MeshStandardMaterial({color:0xffdc97,emissive:0xffaa44,emissiveIntensity:.8}));lightPosts.push(g);register(g,`island-0001/lamp-${lightPosts.length}`,'Path lamp');}
let rseed=42;function rand(){rseed=(Math.imul(rseed,1664525)+1013904223)>>>0;return rseed/4294967296;}
// Coastal conifers: trunk, radial branches, needle sprays, irregular layered silhouette.
const needleParts=[];
for(let n=0;n<32;n++){const geom=new THREE.ConeGeometry(.012,.3,3,1);geom.rotateZ(n%2?-.9:.9);geom.translate((n%2?1:-1)*.09,0,(n/32-.5)*.7);needleParts.push(geom);}
const needleGeo=mergeGeometries(needleParts);needleParts.forEach(g=>g.dispose());
for(let i=0;i<38;i++){
 const a=rand()*Math.PI*2,r=14+rand()*11,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>2&&x>-7)continue;
 const g=new THREE.Group();g.position.set(x,groundHeight(x,z),z);island.add(g);const height=5+rand()*5;
 cylinder(g,.17,height,0,height/2,0,mats.wood,.035);
 const needles=new THREE.InstancedMesh(needleGeo,new THREE.MeshStandardMaterial({color:0x365947,roughness:1}),240);
 const dummy=new THREE.Object3D();let ni=0;
 for(let level=0;level<8;level++){
  const y=height*.25+level*height*.085,len=(1-level/9)*1.8;
  for(let branch=0;branch<6;branch++){
   const angle=branch*Math.PI/3+level*.65+rand()*.2,ex=Math.cos(angle)*len,ez=Math.sin(angle)*len;
   beam(g,[0,y,0],[ex,y-.15,ez],.026,mats.wood);
   for(let n=0;n<5;n++){
    const f=.25+n*.16;dummy.position.set(ex*f,y+.12+rand()*.25,ez*f);dummy.rotation.set(rand()*.5, -angle+(rand()-.5),.12);dummy.scale.set(.7+rand()*.5,.75+rand()*.4,.7+rand()*.6);dummy.updateMatrix();needles.setMatrixAt(ni++,dummy.matrix);
   }
  }
 }
 const branchGeos=g.children.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);});
 g.clear();const branches=new THREE.Mesh(mergeGeometries(branchGeos),mats.wood);branches.castShadow=true;g.add(branches);branchGeos.forEach(b=>b.dispose());
 needles.castShadow=true;g.add(needles);register(g,`island-0001/tree-${i}`,'Coastal conifer · trunk, branches and needle sprays');
}
for(let i=0;i<80;i++){const a=rand()*6.28,r=21+rand()*6,x=Math.cos(a)*r,z=Math.sin(a)*r;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.35+rand()*.7,1),mats.rock);rock.scale.set(1.5,.7,1);rock.rotation.set(rand(),rand(),rand());rock.position.set(x,groundHeight(x,z)+.1,z);rock.castShadow=true;island.add(rock);}
function robot(parent,id,color){const g=register(new THREE.Group(),id,'Resident · '+id.split('/').at(-1));parent.add(g);const suit=new THREE.MeshStandardMaterial({color,roughness:.56,metalness:.4});box(g,.4,.47,.24,0,1.13,0,suit);box(g,.3,.19,.23,0,.78,0,mats.dark);cylinder(g,.11,.1,0,1.43,0);box(g,.28,.27,.23,0,1.6,0,mats.cream);box(g,.23,.07,.025,0,1.62,.125,mats.dark);const limbs=[];for(const x of [-.12,.12]){const leg=new THREE.Group();leg.position.set(x,.76,0);g.add(leg);box(leg,.115,.3,.12,0,-.17,0,suit);cylinder(leg,.069,.14,0,-.35,0,mats.steel).rotation.z=Math.PI/2;box(leg,.1,.28,.11,0,-.52,0,mats.cream);box(leg,.15,.08,.27,0,-.7,.045,mats.dark);limbs.push(leg);}for(const x of [-.29,.29]){cylinder(g,.08,.13,x,1.31,0,mats.steel).rotation.z=Math.PI/2;box(g,.1,.3,.1,x,1.08,0,suit);box(g,.09,.26,.1,x,.79,.015,mats.cream);}g.userData.legs=limbs;return g;}
const mara=robot(island,'island-0001/mara',0xc16d46);mara.position.set(1.5,1.3,.8);mara.rotation.y=Math.PI;
const childBots=[],foodMeshes=[];let program=null,sim=null,record=null,worldState=null,activeChild=null,mode='orbit',inChild=false,inspect=false,acc=0,last=performance.now(),fps=0,frames=0,fpsTime=0;
const grid=new THREE.GridHelper(70,70,0x9cdac4,0x60867b);grid.position.y=1.35;grid.visible=false;scene.add(grid);const inspectBox=new THREE.Box3Helper(new THREE.Box3(),0xffca73);inspectBox.visible=false;scene.add(inspectBox);
const sourceBase=`${import.meta.env.BASE_URL}data/`;
async function json(file){const r=await fetch(sourceBase+file+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(`Could not load ${file} (${r.status})`);return r.json();}
async function loadChild(c){const [p,s]=await Promise.all([json(c.source),json(c.snapshot)]);program=p;sim=s;record=c;activeChild=c.id;rebuildChild();}
function rebuildChild(){for(const o of [...childGroup.children]){childGroup.remove(o);o.traverse(n=>{if(n.geometry)n.geometry.dispose();});}childBots.length=0;foodMeshes.length=0;
 const floor=new THREE.Mesh(new THREE.CircleGeometry(28,72),new THREE.MeshStandardMaterial({color:0xa6ad85,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=1;floor.receiveShadow=true;childGroup.add(floor);
 for(const f of sim.food){const g=register(new THREE.Group(),f.id,'Regenerating food patch');g.position.set(f.x,1,f.z);childGroup.add(g);cylinder(g,.55,.18,0,.09,0,mats.wood);for(let j=0;j<8;j++){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),mats.orange);fruit.position.set(Math.cos(j*2.4)*.35,.3+Math.floor(j/4)*.16,Math.sin(j*2.4)*.35);g.add(fruit);}foodMeshes.push(g);}
 const home=register(new THREE.Group(),`${sim.id}/store`,'Shared food store');childGroup.add(home);for(const x of [-1,1])for(const z of [-1,1])box(home,.12,1.6,.12,x,1.8,z);box(home,2.5,.1,2.5,0,2.65,0,mats.roof);textPlane(home,'SHARED STORE',0,2.35,1.06,1.8,.25);
 for(const a of sim.agents){const g=robot(childGroup,a.id,0x3d8785);childBots.push(g);}
}
function renderScreen(){const g=screenCtx;g.fillStyle='#0c262d';g.fillRect(0,0,768,432);g.fillStyle='#94d5c1';g.font='20px monospace';g.fillText('MARA / '+(program?.name||'WAITING FOR PROGRAM'),25,32);g.strokeStyle='#31575b';for(let i=0;i<10;i++){g.beginPath();g.moveTo(175+i*40,55);g.lineTo(175+i*40,400);g.stroke();}if(sim){const sx=x=>380+x*9,sz=z=>225+z*8;g.fillStyle='#99a764';for(const f of sim.food){g.beginPath();g.arc(sx(f.x),sz(f.z),4+f.amount,0,7);g.fill();}g.fillStyle='#e4b56d';g.fillRect(370,215,20,20);g.fillStyle='#c6f4e5';for(const a of sim.agents){g.beginPath();g.arc(sx(a.x),sz(a.z),4,0,7);g.fill();}g.fillText(`STEP ${sim.tick} / STORED ${sim.stored}`,25,416);}screenTexture.needsUpdate=true;}
function status(){if(!worldState)return;const age=(Date.now()-Date.parse(worldState.updated))/60000;$('#status span').textContent=`${worldState.children.length} child worlds · MSI record ${Math.max(0,Math.floor(age))}m ago`;$('#status').classList.toggle('stale',age>90);$('#count').textContent=worldState.cycles;}
async function refresh(){try{const next=await json('world.json');worldState=next;if(!activeChild&&next.children.length)await loadChild(next.children.at(-1));status();}catch(e){$('#status span').textContent='Record unavailable · retrying';console.error(e);}}
function showPanel(html){$('#panel-body').innerHTML=html;$('#panel').hidden=false;$('#guide').classList.remove('open');}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function computer(){if(!record){showPanel('<h2>No child world yet.</h2><p>The worker has not published a program.</p>');return;}
 const results=record.results;showPanel(`<span class="eyebrow">${esc(record.terminalId)}</span><h2>${esc(record.name)}</h2><p class="muted">${esc(record.author)} · ${esc(record.assignment)}</p><p>${esc(record.hypothesis)}</p><div class="metrics"><div><strong>${sim.tick.toLocaleString()}</strong><span>local step</span></div><div><strong>${sim.stored}</strong><span>food stored</span></div><div><strong>${program.population}</strong><span>inhabitants</span></div></div><button id="enter-child" class="primary">${inChild?'Restart from saved record':'Enter this world'} ↗</button><h3>Measured trials</h3><p>Same terrain, population and seed. Compare this program with a gather-first control. These trials measure food delivery, not general intelligence.</p><table><thead><tr><th>Seed</th><th>Program</th><th>Control</th></tr></thead><tbody>${results.map(r=>`<tr><td>${r.candidate.seed}</td><td>${r.candidate.stored}</td><td>${r.baseline.stored}</td></tr>`).join('')}</tbody></table><details><summary>Read the executable program</summary><pre>${esc(JSON.stringify(program,null,2))}</pre></details><a href="${sourceBase+record.id}.record.json" target="_blank" rel="noreferrer">Full prompt, response & evidence ↗</a><p class="muted">The screen is running this program locally. The MSI publishes durable snapshots hourly. Movement is a visualization of executed rules; it is not a live video of model inference.</p>`);
 $('#enter-child').onclick=async()=>{await loadChild(record);enterWorld();};
}
function history(){showPanel(`<span class="eyebrow">PERSISTENT FIELD RECORD</span><h2>The island’s history</h2><p>Model-authored programs and measured runs, preserved in GitHub. Select a world to inspect or enter it.</p>${(worldState?.children||[]).slice().reverse().map(c=>`<button class="entry" data-child="${esc(c.id)}"><span>${esc(c.name)}</span><small>${esc(c.author)} · ${new Date(c.created).toLocaleString()}</small></button>`).join('')||'<p>No published programs yet.</p>'}<h3>Recent events</h3>${(worldState?.events||[]).slice(-12).reverse().map(e=>`<p class="event"><small>${new Date(e.at).toLocaleString()}</small>${esc(e.message)}</p>`).join('')}<a href="https://github.com/JaronKBragg7337/unfinished-island/commits/main/" target="_blank" rel="noreferrer">Repository history ↗</a>`);document.querySelectorAll('[data-child]').forEach(b=>b.onclick=async()=>{await loadChild(worldState.children.find(c=>c.id===b.dataset.child));computer();});}
function enterWorld(){inChild=true;island.visible=false;childGroup.visible=true;$('#panel').hidden=true;$('#return').hidden=false;$('#depth').textContent='CHILD WORLD · DEPTH 1';$('#place').textContent=program.name;$('#hint').textContent='Same visitor. A different world. Live local execution from the saved record.';setMode('orbit');camera.position.set(23,27,29);controls.target.set(0,1,0);}
$('#return').onclick=()=>{inChild=false;island.visible=true;childGroup.visible=false;$('#return').hidden=true;$('#depth').textContent='PARENT WORLD · DEPTH 0';$('#place').textContent='Mara’s field station';$('#hint').textContent='A working world, inside a working computer.';setMode('orbit');camera.position.set(16,11,21);controls.target.set(0,2,0);};
let yaw=0,pitch=0;const keys=new Set(),stick={x:0,y:0,id:null,baseX:0,baseY:0},look={id:null,x:0,y:0};
function setMode(m){mode=m;controls.enabled=m==='orbit';$('#orbit').classList.toggle('selected',m==='orbit');$('#walk').classList.toggle('selected',m==='walk');$('#reticle').hidden=m!=='walk';if(m==='walk'){camera.position.set(0,2.7,8);yaw=0;pitch=0;camera.rotation.order='YXZ';}else controls.target.set(0,2,0);}
$('#orbit').onclick=()=>setMode('orbit');$('#walk').onclick=()=>setMode('walk');$('#terminal').onclick=computer;$('#journal').onclick=history;
$('#menu').onclick=()=>$('#guide').classList.toggle('open');$('#dismiss').onclick=()=>$('#guide').classList.remove('open');$('#guide .close').onclick=()=>$('#guide').classList.remove('open');$('#panel .close').onclick=()=>$('#panel').hidden=true;
$('#inspect').onclick=()=>{inspect=!inspect;grid.visible=inspect;$('#inspect').classList.toggle('selected',inspect);inspectBox.visible=false;$('#hint').textContent=inspect?'Tap an object to inspect its identity, dimensions and coordinates.':'A working world, inside a working computer.';};
addEventListener('keydown',e=>{if(e.target.closest('button,summary,a'))return;keys.add(e.code);if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.code==='KeyE'&&camera.position.distanceTo(new THREE.Vector3(0,2,-1))<5)computer();if(e.code==='Escape'){$('#panel').hidden=true;$('#guide').classList.remove('open');}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;});
let down={x:0,y:0};canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};if(mode!=='walk')return;canvas.setPointerCapture(e.pointerId);if(e.pointerType==='touch'&&e.clientX<innerWidth*.48){Object.assign(stick,{id:e.pointerId,baseX:e.clientX,baseY:e.clientY});Object.assign($('#stick').style,{display:'block',left:`${e.clientX-55}px`,top:`${e.clientY-55}px`});}else Object.assign(look,{id:e.pointerId,x:e.clientX,y:e.clientY});});
canvas.addEventListener('pointermove',e=>{if(mode!=='walk')return;if(stick.id===e.pointerId){stick.x=Math.max(-1,Math.min(1,(e.clientX-stick.baseX)/50));stick.y=Math.max(-1,Math.min(1,(e.clientY-stick.baseY)/50));$('#stick div').style.transform=`translate(${stick.x*35}px,${stick.y*35}px)`;}else if(look.id===e.pointerId){yaw-=(e.clientX-look.x)*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch-(e.clientY-look.y)*.004));look.x=e.clientX;look.y=e.clientY;}});
function endPointer(e){if(e.pointerId===stick.id){stick.id=null;stick.x=stick.y=0;$('#stick').style.display='none';}if(e.pointerId===look.id)look.id=null;}
canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('pointerup',e=>{endPointer(e);if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)return;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const hits=ray.intersectObject(inChild?childGroup:island,true);if(!hits.length)return;let obj=hits[0].object;while(obj&&!obj.userData.id)obj=obj.parent;if(!obj)return;if(inspect){const bounds=new THREE.Box3().setFromObject(obj),size=bounds.getSize(new THREE.Vector3()),p=obj.getWorldPosition(new THREE.Vector3());inspectBox.box.copy(bounds);inspectBox.visible=true;showPanel(`<span class="eyebrow">OBJECT INSPECTION</span><h2>${esc(obj.userData.label||obj.userData.id)}</h2><p><code>${esc(obj.userData.id)}</code></p><p>Position: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)} m</p><p>Bounds: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m</p><p>World: ${inChild?esc(sim.id):'island-0001'}</p><p>Units: metres. Local Cartesian coordinates; this island is not a georeferenced planet.</p>`);}else if(obj===desk||obj.parent===desk)computer();});
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.08);last=now;frames++;fpsTime+=dt;if(fpsTime>1){fps=Math.round(frames/fpsTime);frames=0;fpsTime=0;}
 if(mode==='walk'){
  const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-stick.y,right=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+stick.x;
  const len=Math.max(1,Math.hypot(forward,right)),speed=dt*3.2/len;const nx=camera.position.x+(Math.cos(yaw)*right-Math.sin(yaw)*forward)*speed,nz=camera.position.z+(-Math.sin(yaw)*right-Math.cos(yaw)*forward)*speed;
  let blocked=false;if(!inChild)for(const o of colliders){const b=new THREE.Box3().setFromObject(o).expandByScalar(.25);if(nx>b.min.x&&nx<b.max.x&&nz>b.min.z&&nz<b.max.z)blocked=true;}
  if(!blocked&&Math.hypot(nx,nz)<27){camera.position.x=nx;camera.position.z=nz;}
  const onDeck=!inChild&&Math.abs(camera.position.x)<4&&Math.abs(camera.position.z)<3.1;camera.position.y=(inChild?1:onDeck?1.3:Math.max(groundHeight(camera.position.x,camera.position.z),.7))+1.65;camera.rotation.set(pitch,yaw,0);
 }else controls.update();
 acc+=dt;if(program&&sim&&acc>.2){step(program,sim,1);acc=0;renderScreen();}
 if(sim){childBots.forEach((g,i)=>{const a=sim.agents[i];const tx=a.x,tz=a.z;g.rotation.y=Math.atan2(tx-g.position.x,tz-g.position.z);g.position.lerp(new THREE.Vector3(tx,1,tz),Math.min(1,dt*8));g.userData.legs.forEach((l,j)=>l.rotation.x=a.action==='rest'?0:Math.sin(now*.009+j*Math.PI)*.4);});foodMeshes.forEach((g,i)=>g.children.forEach((m,j)=>{if(j>0)m.visible=j<=sim.food[i].amount;}));}
 water.position.y=-.08+Math.sin(now*.00012)*.08;
 $('#coordinates').textContent=inspect?`X ${camera.position.x.toFixed(1)} · Y ${camera.position.y.toFixed(1)} · Z ${camera.position.z.toFixed(1)} m / ${fps} fps`:'';
 renderer.render(scene,camera);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();requestAnimationFrame(animate);refresh();setInterval(refresh,60000);
window.islandDebug={get state(){return {inChild,mode,activeChild,step:sim?.tick,stored:sim?.stored,fps,assetCount:assets.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,position:camera.position.toArray()};},get program(){return program;}};
