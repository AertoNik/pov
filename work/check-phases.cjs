const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('work/invariants.cjs','utf8').split("test('Новый профиль")[0];
// Run the same application in an isolated context, with local form nodes only.
eval(source.replace('const sandbox=','var sandbox=').replace('const dummy=','var dummy=').replace("const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');",''));
const nodes={};let form;
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function attr(s,key){return decode(s.match(new RegExp('(?:^|\\s)'+key+'="([^"]*)"'))?.[1]||'')}
function field(name,value='',type='text'){const n={...dummy,name,value,type,checked:false,options:[]};Object.defineProperty(n,'innerHTML',{get(){return this.html||''},set(html){this.html=html;const options=[...html.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)];if(options.length){this.options=options.map(m=>attr(m[1],'value'));this.value=attr((options.find(m=>/\bselected\b/.test(m[1]))||options[0])[1],'value')}}});return n}
function parse(html){for(const m of html.matchAll(/<input\b([^>]*)>/g)){const name=attr(m[1],'name');if(!name)continue;const n=field(name,attr(m[1],'value'),attr(m[1],'type'));n.checked=/\bchecked\b/.test(m[1]);if(n.type==='checkbox'){form.checkboxes.push(n)}else form.elements[name]=n}for(const m of html.matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/g)){const name=attr(m[1],'name');if(name)form.elements[name]=field(name,decode(m[2]),'textarea')}for(const m of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const name=attr(m[1],'name');if(name){const n=field(name);n.innerHTML=m[2];form.elements[name]=n}}}
function node(id){const n={...dummy};Object.defineProperty(n,'innerHTML',{get(){return this.html||''},set(html){this.html=html;if(id==='#codex-details')parse(html)}});return n}
sandbox.document.querySelector=s=>nodes[s]||(nodes[s]=node(s));sandbox.document.querySelectorAll=()=>[];
sandbox.openForm=html=>{form={elements:{},checkboxes:[],reportValidity:()=>true};nodes['#growth-form']=form;parse(html)};
sandbox.FormData=class{constructor(f){this.rows=[...Object.values(f.elements).map(x=>[x.name,x.value]),...f.checkboxes.filter(x=>x.checked).map(x=>[x.name,x.value])]}[Symbol.iterator](){return this.rows[Symbol.iterator]()}getAll(n){return this.rows.filter(r=>r[0]===n).map(r=>r[1])}get(n){return this.getAll(n)[0]??null}};
vm.runInContext('state=freshState();Modal.open=(title,html)=>openForm(html);Modal.close=()=>{};',sandbox);
function set(name,value){assert.ok(form.elements[name],name);form.elements[name].value=value}
function checked(name,value){const x=form.checkboxes.find(x=>x.name===name&&x.value===String(value));assert.ok(x,name);x.checked=true}
function submit(){nodes['#growth-error']??=node('#growth-error');form.onsubmit({preventDefault(){}});assert.equal(nodes['#growth-error'].textContent||'','');nodes['#growth-error'].textContent=''}

const run=s=>vm.runInContext(s,sandbox);
function create(name,start,end){run('GrowthUI.phaseForm()');set('name',name);set('startDate',start);set('endDate',end);nodes['#growth-error']=node('#growth-error');form.onsubmit({preventDefault(){}});return nodes['#growth-error'].textContent||''}
assert.equal(create('Фундамент','2026-10-01','2026-10-30'),'');
for(const [start,end] of [['2026-10-20','2026-11-20'],['2026-10-30','2026-11-15'],['2026-09-15','2026-10-05'],['2026-09-01','2026-12-01']]){
 const before=run('JSON.stringify(state.phases)');assert.match(create('Конфликт',start,end),/Период пересекается с фазой «Фундамент»/);assert.equal(run('JSON.stringify(state.phases)'),before);
}
assert.equal(create('Следующая','2026-10-31','2026-11-29'),'');
assert.equal(create('Предыдущая','2026-09-01','2026-09-30'),'');
run('GrowthUI.phaseForm(state.phases[0].id)');set('name','Фундамент изменён');submit();assert.equal(run('state.phases[0].phaseNumber'),1);
run('GrowthUI.phaseForm(state.phases[0].id)');set('endDate','2026-10-31');const before=run('JSON.stringify(state.phases)');form.onsubmit({preventDefault(){}});assert.match(nodes['#growth-error'].textContent,/Период пересекается/);assert.equal(run('JSON.stringify(state.phases)'),before);nodes['#growth-error'].textContent='';
console.log('ПРОЙДЕНО: создание/редактирование, общая граница, вложенный период, соседние периоды и исключение собственной фазы.');
// Use the real deletion action, with its confirmation accepted in this isolated test.
run("confirmAction=(title,description,fn)=>fn();GrowthUI.handle('phase-delete',{dataset:{id:state.phases[1].id}})");
assert.deepEqual(Array.from(run('state.phases.map(p=>p.phaseNumber)')),[1,3]);assert.equal(create('Новая','2026-11-30','2026-12-29'),'');assert.deepEqual(Array.from(run('state.phases.map(p=>p.phaseNumber)')),[1,3,4]);assert.equal(run('GrowthUI.phaseNumber(state.phases[1])'),'III');
run('GrowthUI.phaseForm(state.phases[1].id)');set('startDate','2026-08-01');set('endDate','2026-08-30');submit();assert.equal(run('state.phases[1].phaseNumber'),3);
assert.deepEqual(Array.from(run('validateStateStrict(JSON.parse(BackupManager.serialize()).data).phases.map(p=>p.phaseNumber)')),[1,3,4]);
console.log('ПРОЙДЕНО: постоянные номера после удаления, создания, изменения даты и экспорта/импорта.');
run("const a=state.phases[0];state.habits=Array.from({length:5},(_,i)=>({id:'h'+i,name:'Привычка',deleted:false,active:false,phaseId:a.id,schedule:[{from:'2026-12-01',active:false,phaseId:null,weekdays:[1]}]}))");
assert.match(run('GrowthUI.phaseSummary(state.phases[0])'),/Всего привычек: 5/);
const OriginalDate=sandbox.Date;sandbox.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2027-01-01T12:00:00']))}};assert.match(run('GrowthUI.phaseSummary(state.phases[0])'),/Всего привычек: 5/);
run('state.habits[0].deleted=true;state.habits[1].phaseId=null');assert.match(run('GrowthUI.phaseSummary(state.phases[0])'),/Всего привычек: 3/);
sandbox.Date=OriginalDate;
console.log('ПРОЙДЕНО: число связанных привычек независимо от даты и активности; удаление и отвязка уменьшают счётчик.');
run("state=freshState();const oldPhase=(id,startDate,endDate)=>({id,name:id,description:'Сохраняется',startDate,endDate,completedAt:null,goals:['Цель'],missionIds:[]});state.phases=[oldPhase('late','2026-11-01','2026-11-30'),oldPhase('early','2026-10-01','2026-10-30'),oldPhase('overlap','2026-10-20','2026-11-20')];const legacy=structuredClone(state);state=validateStateStrict(legacy)");
assert.deepEqual(Array.from(run('state.phases.map(p=>p.phaseNumber)')),[3,1,2]);assert.equal(run('state.phases.length'),3);assert.equal(run('state.phases[0].goals[0]'),'Цель');
run('GrowthUI.phaseForm(state.phases[1].id)');set('name','Старый конфликт сохранён');submit();
run('GrowthUI.phaseForm(state.phases[1].id)');set('endDate','2026-10-31');form.onsubmit({preventDefault(){}});assert.match(nodes['#growth-error'].textContent,/Период пересекается/);nodes['#growth-error'].textContent='';
run('state.phases[0].phaseNumber=10;delete state.phases[1].phaseNumber;state=validateStateStrict(state)');assert.deepEqual(Array.from(run('state.phases.map(p=>p.phaseNumber)')),[10,1,2]);
assert.deepEqual(Array.from(run('validateStateStrict(JSON.parse(BackupManager.serialize()).data).phases.map(p=>p.phaseNumber)')),[10,1,2]);
for(const n of [0,-1,1.5,'2',null]){sandbox.invalidNumber=n;assert.throws(()=>run('(()=>{const bad=structuredClone(state);bad.phases[0].phaseNumber=invalidNumber;validateStateStrict(bad)})()'))}
console.log('ПРОЙДЕНО: хронологическая миграция, сохранение существующих номеров, старые пересечения и валидация номера.');
(async()=>{
const old=run('structuredClone(legacy)');old.profile.onboarded=true;let persisted,saves=0;
sandbox.indexedDB={open(){throw Error('unavailable')}};sandbox.localStorage={getItem:()=>JSON.stringify(old),setItem:(k,v)=>{if(k==='sanctum-fallback')persisted=JSON.parse(v)}};
run('navigate=()=>{};registerAgentTools=()=>{}');
// The host counter is updated by a callback to avoid changing production storage logic.
sandbox.migrationSaved=()=>saves++;run('save=()=>{state.revision++;migrationSaved();Storage.write()}');
await run('init()');assert.equal(saves,1);assert.deepEqual(persisted.phases.map(p=>p.phaseNumber),[3,1,2]);assert.equal(persisted.phases[0].description,'Сохраняется');
sandbox.localStorage.getItem=()=>JSON.stringify(persisted);await run('init()');assert.equal(saves,1);
console.log('ПРОЙДЕНО: миграция записывается при загрузке один раз и не повторяется при следующем открытии.');
})().catch(e=>{console.error(e);process.exitCode=1});
