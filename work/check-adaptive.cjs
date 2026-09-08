const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dummy={innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){},append(){},remove(){},querySelector(){return dummy},querySelectorAll(){return []},addEventListener(){}};
const sandbox={console,structuredClone,Blob,URL,Date,Math,JSON,Number,String,Object,Array,Set,Map,Error,performance,crypto:require('crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>dummy,querySelectorAll:()=>[],createElement:()=>({...dummy}),addEventListener(){},body:{style:{},classList:{toggle(){}},dataset:{}}},window:{addEventListener(){},scrollTo(){}},location:{hash:'#/overview'},localStorage:{getItem:()=>null,setItem(){}},navigator:{}};
vm.createContext(sandbox);const source=fs.readFileSync('outputs/index.html','utf8').split('<script>')[1].split('</script>')[0].replace(/\ninit\(\);\s*$/,'');vm.runInContext(source,sandbox);let checks=0;
function test(name,script){const result=vm.runInContext(script,sandbox);assert.equal(result,true,name);checks++;console.log('ПРОЙДЕНО:',name)}
vm.runInContext('state=freshState(); Modal.open=()=>{};Modal.close=()=>{}; render=()=>{};save=()=>{};toast=()=>{};beep=()=>{}',sandbox);

vm.runInContext(`
for(let level=1;level<=5;level++)for(let i=0;i<100;i++){
 const t=AdaptiveLab.argument(level),entailed=t.claims.map(([a,b,neg])=>{for(let bits=0;bits<1<<t.variables;bits++){const truth=n=>!!(bits&(1<<n));if(t.rules.every(([x,y,no])=>!truth(x)||(no?!truth(y):truth(y)))&&truth(a)&&!(neg?!truth(b):truth(b)))return false}return true});if(entailed.filter(Boolean).length!==1||!entailed[0])throw Error('Неоднозначный вывод');
 const r=AdaptiveLab.rotation(level),key=AdaptiveLab.canonical(r.cells);if(r.shapes.filter(s=>AdaptiveLab.canonical(s)===key).length!==1||AdaptiveLab.canonical(r.shapes[r.answer])!==key)throw Error('Вращение');
 const p=AdaptiveLab.probability(level),nums=p.question.match(/[0-9]+/g).map(Number),expected=[()=>nums[0]/(nums[0]+nums[1])*100,()=>nums[0]*nums[1]/100,()=>nums[0]*nums[1]/100,()=>nums[2]/nums[1]*100,()=>nums[0]*(1-nums[1]/100),()=>nums[0]/100*nums[1]-nums[3]][p.type]();if(Math.abs(p.value-Math.round(expected*100)/100)>.001)throw Error('Расчёт вероятности');if(new Set(p.options).size!==4||!Number.isFinite(p.value))throw Error('Вероятности');
 const m=AdaptiveLab.route(level);let pos=0,hasKey=false,points=new Set();for(const next of m.path){if(m.walls.includes(next)||next===m.door&&!hasKey||Math.abs(next%m.size-pos%m.size)+Math.abs(Math.floor(next/m.size)-Math.floor(pos/m.size))!==1)throw Error('Неверный маршрут');pos=next;if(pos===m.key)hasKey=true;if(m.points.includes(pos))points.add(pos)}if(pos!==m.goal||m.key>=0&&!hasKey||points.size!==m.points.length||m.limit!==null&&m.path.length>m.limit)throw Error('Нет решения');
}
`,sandbox);
console.log('ПРОЙДЕНО: 2000 заданий, 5 уровней; логические выводы проверены таблицами истинности, уникальность вращений и проходимость карт.');
const nodes={},groups={};let captured;
function node(){const n={...dummy,dataset:{},value:'',disabled:false};Object.defineProperty(n,'innerHTML',{get(){return this.html||''},set(html){this.html=html;for(const attr of ['adaptive-choice','route-cell']){groups['[data-'+attr+']']=[...html.matchAll(new RegExp('data-'+attr+'="(\\d+)"','g'))].map(m=>({...dummy,dataset:{[attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:m[1]},disabled:false}));}}});return n}
sandbox.document.querySelector=s=>nodes[s]||(nodes[s]=node());sandbox.document.querySelectorAll=s=>groups[s]||[];
sandbox.capture=t=>{captured=t};vm.runInContext(`for(const id of AdaptiveLab.ids){const original=AdaptiveLab[id];AdaptiveLab[id]=function(...args){const t=original.apply(this,args);capture(t);return t}}`,sandbox);
for(const module of ['argument','probability','rotation','route'])for(const success of [true,false]){
 vm.runInContext(`state=freshState();AdaptiveLab.level=()=>${success?1:5};BrainLab.session={module:'${module}',saved:false};AdaptiveLab.start('${module}')`,sandbox);
 for(let i=0;i<(module==='route'?6:10);i++){
  if(module==='route'){if(success){for(const p of captured.path){const b=groups['[data-route-cell]'].find(b=>+b.dataset.routeCell===p);b.onclick()}}else nodes['#route-giveup'].onclick()}
  else {const b=groups['[data-adaptive-choice]'][success?captured.answer:(captured.answer+1)%4];const click=b.onclick;click();click()}
  const next=nodes['#adaptive-next'].onclick;next();next();
 }
 assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),1);assert.equal(vm.runInContext('state.brain.sessions[0].metrics.accuracy',sandbox),success?100:0);
 assert.equal(vm.runInContext('state.brain.sessions[0].metrics.nextLevel',sandbox),success?(module==='route'?4:5):(module==='route'?2:1));
 vm.runInContext('validateStateStrict(state)',sandbox);
 vm.runInContext(`BrainLab.session={module:'${module}',saved:false};AdaptiveLab.start('${module}');BrainLab.stop()`,sandbox);
 if(module==='route')nodes['#route-giveup'].onclick();else groups['[data-adaptive-choice]'][0].onclick();
 assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),1);
}
console.log('ПРОЙДЕНО: 8 полных сессий, 72 задания; успехи/ошибки, адаптация вверх/вниз, повторные клики, остановка и совместимость резервной копии.');
