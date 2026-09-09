const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dummy={innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){},scrollIntoView(){},append(){},remove(){},querySelector(){return dummy},querySelectorAll(){return []},addEventListener(){}};
const sandbox={console,structuredClone,Blob,URL,Date,Math,JSON,Number,String,Object,Array,Set,Map,Error,performance,crypto:require('crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>dummy,querySelectorAll:()=>[],createElement:()=>({...dummy}),addEventListener(){},body:{style:{},classList:{toggle(){}},dataset:{}}},window:{addEventListener(){},scrollTo(){}},location:{hash:'#/overview'},localStorage:{getItem:()=>null,setItem(){}},navigator:{}};
vm.createContext(sandbox);const source=fs.readFileSync('outputs/index.html','utf8').split('<script>')[1].split('</script>')[0].replace(/\ninit\(\);\s*$/,'');vm.runInContext(source,sandbox);let checks=0;
function test(name,script){const result=vm.runInContext(script,sandbox);assert.equal(result,true,name);checks++;console.log('ПРОЙДЕНО:',name)}
vm.runInContext('state=freshState(); Modal.open=()=>{};Modal.close=()=>{}; render=()=>{};save=()=>{};toast=()=>{};beep=()=>{}',sandbox);

vm.runInContext(`
 const keys=new Set();let scarce=0,changed=0;
 for(let level=1;level<=5;level++)for(let cat=0;cat<6;cat++)for(let i=0;i<100;i++){
 const t=SocialRadar.generate(level,cat,i%8);keys.add(t.key);if(t.steps[1].target===50)scarce++;if(t.changedModel)changed++;
 for(const s of t.steps){if(s.options.length<3||s.options.length>4||new Set(s.options).size!==s.options.length)throw Error('Варианты');if(s.kind!=='confidence'&&(!Number.isInteger(s.answer)||!s.options[s.answer]))throw Error('Ответ');}
 if(t.steps[1].target===50&&!t.steps[0].options[t.steps[0].answer].startsWith('Недостаточно'))throw Error('Неизвестный мотив');
 if(!t.steps.some(s=>s.kind==='updating'&&s.reveal)||!t.steps.some(s=>s.kind==='questions')||!t.steps.some(s=>s.kind==='prediction'))throw Error('Цикл');
 if(cat===5&&!t.steps.some(s=>s.kind==='manipulation'))throw Error('Давление');
 }
 if(keys.size<2900||!scarce||!changed)throw Error('Разнообразие');
 if(SocialRadar.calibration(90,50,true)>=SocialRadar.calibration(50,50,true)||SocialRadar.calibration(90,90,false)>=SocialRadar.calibration(50,90,false))throw Error('Калибровка');
`,sandbox);
console.log('ПРОЙДЕНО: 3000 сценариев, 6 категорий, 5 уровней; варианты, полный цикл, неопределённость, изменения модели и калибровка.');
const nodes={},groups={};let captured;
function node(){const n={...dummy,dataset:{},disabled:false};Object.defineProperty(n,'innerHTML',{get(){return this.html||''},set(html){this.html=html;if(html.includes('data-social-choice'))groups.choices=[...html.matchAll(/data-social-choice="(\d+)"/g)].map(m=>({...dummy,dataset:{socialChoice:m[1]},disabled:false}));}});return n}
sandbox.document.querySelector=s=>nodes[s]||(nodes[s]=node());sandbox.document.querySelectorAll=s=>s==='[data-social-choice]'?groups.choices||[]:[];
sandbox.capture=t=>captured=t;
vm.runInContext('const socialGenerate=SocialRadar.generate;SocialRadar.generate=function(...args){const t=socialGenerate.apply(this,args);capture(t);return t}',sandbox);
for(const success of [true,false]){
 vm.runInContext('state=freshState();BrainLab.session={module:"social",saved:false};SocialRadar.start()',sandbox);
 let rounds=0,steps=0;
 while(vm.runInContext('state.brain.sessions.length===0',sandbox)){
 const task=captured;
 for(const step of task.steps){
 const answer=step.kind==='confidence'?(success?step.options.indexOf(step.target+'%'):2):success?step.answer:(step.answer+1)%step.options.length;
 const click=groups.choices[answer].onclick;click();click();steps++;
 if(!step.pending){const next=nodes['#social-next'].onclick;next();next()}
 }
 if(++rounds>8)throw Error('Сессия не завершается');
 }
 assert.equal(rounds,8);assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),1);
 assert.equal(vm.runInContext('state.brain.sessions[0].score',sandbox),success?100:0);
 assert.equal(vm.runInContext('state.brain.sessions[0].metrics.accuracy',sandbox),success?100:0);
 assert.equal(vm.runInContext('state.brain.sessions[0].metrics.nextLevel',sandbox),success?5:1);
 assert.equal(vm.runInContext('state.brain.sessions[0].xp',sandbox),success?25:0);
 vm.runInContext('validateStateStrict(JSON.parse(BackupManager.serialize()).data)',sandbox);
 if(success){vm.runInContext('BrainLab.session={module:"social",saved:false};SocialRadar.start()',sandbox);assert.equal(captured.level,5);const old=groups.choices[0].onclick;vm.runInContext('BrainLab.stop()',sandbox);old();assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),1)}
 console.log('ПРОЙДЕНО: полная сессия '+(success?'без ошибок':'с ошибками')+', '+steps+' этапов; двойные клики, одна награда, экспорт.');
}
