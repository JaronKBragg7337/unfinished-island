import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.argv[2]||'http://127.0.0.1:5188/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Users/lilli/.agent-browser/browsers/chrome-152.0.7977.82/chrome.exe',headless:true});
await fs.mkdir('.runtime',{recursive:true});const reports=[];
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});
 const surface=url.includes('heartbeatobservatory.com')?page.frames().find(f=>f.url().includes('github.io/unfinished-island')):page;
 assert.ok(surface,'Simulation frame is present');await surface.waitForFunction(()=>window.islandDebug?.state.activeChild);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:`.runtime/${viewport.width}-parent.png`});
 await surface.getByRole('button',{name:'Computer ↗',exact:true}).click();await surface.getByRole('button',{name:'Enter this world ↗'}).click();
 await surface.waitForFunction(()=>window.islandDebug.state.inChild);const childBefore=await surface.evaluate(()=>window.islandDebug.state);await surface.waitForFunction(t=>window.islandDebug.state.step>t,childBefore.step);
 await page.screenshot({path:`.runtime/${viewport.width}-child.png`});
 await surface.getByRole('button',{name:'Return to the island'}).click();await surface.getByRole('button',{name:'Walk',exact:true}).click();
 const before=await surface.evaluate(()=>window.islandDebug.state.position);
 if(viewport.width>500){await surface.locator('#world').click({position:{x:700,y:500}});await page.keyboard.down('KeyW');await page.waitForTimeout(700);await page.keyboard.up('KeyW');}
 else {const session=await context.newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:500}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:80,y:450}]});assert.equal(await surface.locator('#stick').isVisible(),true);await page.waitForTimeout(700);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await surface.locator('#stick').isVisible(),false);}
 const after=await surface.evaluate(()=>window.islandDebug.state.position);assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>.5);
 await surface.getByRole('button',{name:'History',exact:false}).click();await surface.locator('.entry').first().click();await surface.getByText('Read the executable program').click();assert.ok((await surface.locator('pre').textContent()).includes('island/1'));
 assert.deepEqual(errors,[]);reports.push({url,viewport,errors,state:await surface.evaluate(()=>window.islandDebug.state),movementMetres:Math.hypot(after[0]-before[0],after[2]-before[2])});await context.close();
 }}finally{await browser.close();}
await fs.writeFile('.runtime/browser-report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
