const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dummy={innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){},append(){},remove(){},querySelector(){return dummy},querySelectorAll(){return []},addEventListener(){}};
const sandbox={console,structuredClone,Blob,URL,Date,Math,JSON,Number,String,Object,Array,Set,Map,Error,performance,crypto:require('crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>dummy,querySelectorAll:()=>[],createElement:()=>({...dummy}),addEventListener(){},body:{style:{},classList:{toggle(){}},dataset:{}}},window:{addEventListener(){},scrollTo(){}},location:{hash:'#/overview'},localStorage:{getItem:()=>null,setItem(){}},navigator:{}};
vm.createContext(sandbox);const source=fs.readFileSync('outputs/index.html','utf8').split('<script>')[1].split('</script>')[0].replace(/\ninit\(\);\s*$/,'');vm.runInContext(source,sandbox);let checks=0;
function test(name,script){const result=vm.runInContext(script,sandbox);assert.equal(result,true,name);checks++;console.log('ПРОЙДЕНО:',name)}
vm.runInContext('state=freshState(); Modal.open=()=>{};Modal.close=()=>{}; render=()=>{};save=()=>{};toast=()=>{};beep=()=>{}',sandbox);

const nodes=new Map();let choices=[];let captured;
function fakeNode(){return {dataset:{},disabled:false,value:'1',textContent:'',classList:{add(){}},focus(){},set innerHTML(html){this.html=html;if(html.includes('data-endless-choice=')){choices=[...html.matchAll(/data-endless-choice="(\d+)"/g)].map(m=>({...fakeNode(),dataset:{endlessChoice:m[1]}}))}},get innerHTML(){return this.html||''}}}
sandbox.document.querySelector=s=>{if(!nodes.has(s))nodes.set(s,fakeNode());return nodes.get(s)};
sandbox.document.querySelectorAll=s=>s==='[data-endless-choice]'?choices:[];
sandbox.capture=t=>{captured=t};
vm.runInContext('const originalGenerate=EndlessLab.generate;EndlessLab.generate=function(...args){const t=originalGenerate.apply(this,args);capture(t);return t};state=freshState()',sandbox);
let runs=0;
for(const module of ['comparison','oddity'])for(let d=0;d<3;d++){
 for(let i=0;i<300;i++){
  const t=vm.runInContext('EndlessLab.generate('+JSON.stringify(module)+','+d+')',sandbox);
  if(module==='comparison'){
   assert.equal(t.answer,t.left<t.right?0:t.left===t.right?1:2);
   const calc=x=>x.split(' ').length===1?Number(x):(()=>{const [a,op,b]=x.split(' ');return op==='+'?Number(a)+Number(b):Number(a)-Number(b)})();
   assert.equal(calc(t.leftLabel),t.left);assert.equal(calc(t.rightLabel),t.right);
  }else{assert.equal(t.symbols.length,(d+3)**2);const odd=t.symbols[t.answer];assert.equal(t.symbols.filter(x=>x===odd).length,1);assert.equal(new Set(t.symbols).size,2)}
 }
 for(let repeat=0;repeat<2;repeat++){
  vm.runInContext('BrainLab.session={module:'+JSON.stringify(module)+',start:performance.now(),saved:false};EndlessLab.start('+JSON.stringify(module)+','+d+')',sandbox);
  for(let round=0;round<12;round++){
   const idx=repeat===0?captured.answer:(captured.answer+1)%choices.length;
   const clicked=choices[idx].onclick;clicked();clicked();
   assert.ok(choices.every(x=>x.disabled));
   const next=nodes.get('#endless-next').onclick;next();next();
  }
  runs++;
  assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),runs);
  assert.equal(vm.runInContext('state.brain.sessions.at(-1).score',sandbox),repeat===0?100:0);
  assert.equal(vm.runInContext('state.brain.sessions.at(-1).xp',sandbox),repeat===0?25:0);
  assert.ok(nodes.get('#game-body').innerHTML.includes('Ещё одна тренировка'));
 }
}
const restored=vm.runInContext('validateStateStrict(JSON.parse(BackupManager.serialize()).data)',sandbox);assert.equal(restored.brain.sessions.length,12);
vm.runInContext('BrainLab.session={module:"oddity",start:performance.now(),saved:false};EndlessLab.start("oddity",0)',sandbox);
const stale=choices[0].onclick;vm.runInContext('BrainLab.stop()',sandbox);stale();assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),12);
console.log('ПРОЙДЕНО: 1800 генераций, 12 полных сессий (144 раунда), правильные/ошибочные ответы, двойные клики, повторный запуск, остановка, опыт и восстановление обеих игр.');
