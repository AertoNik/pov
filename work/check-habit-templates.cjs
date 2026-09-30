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
const originalOpen=sandbox.openForm;sandbox.openForm=html=>{originalOpen(html);form.querySelector=()=>({...dummy})};
const action=(name,id,phase)=>{sandbox.actionButton={dataset:{id,phase}};run(`GrowthUI.handle('${name}',actionButton)`)};
assert.equal(run('HABIT_LIBRARY.length'),8);assert.equal(run('state.userHabitTemplates.length'),0);
run('GrowthUI.habitTemplateUse("reading")');assert.equal(form.elements.name.value,'Чтение');assert.deepEqual([0,1,2].map(i=>form.elements['label'+i].value),['5 минут','20 минут','45 минут']);assert.equal(run('state.habits.length'),0);
const selectedAttribute=run('state.attributes[0].id');checked('attributes',selectedAttribute);set('label1','25 минут');set('duration1','25');submit();
const reading=run('state.habits[0].id');assert.equal(run('state.habits[0].tiers[1].label'),'25 минут');assert.equal(run('HABIT_LIBRARY.find(t=>t.id==="reading").tiers[1].label'),'20 минут');
run('state.habits[0].allocations=[{id:state.attributes[0].id,weight:20},{id:state.attributes[1].id,weight:80}];Growth.mark(state.habits[0].id,today(),0)');assert.equal(run('Growth.habitStats(state.habits[0]).current'),1);const xp=run('totalXP()');
action('habit-template-save',reading);const template=run('state.userHabitTemplates[0].id');
assert.equal(run('state.userHabitTemplates[0].category'),'Разум');
for(const key of ['phaseId','startDate','schedule','history','streak','completionHistory'])assert.equal(run(`'${key}' in state.userHabitTemplates[0]`),false);
action('habit-template-use',template);assert.equal(form.elements['label1'].value,'25 минут');submit();
assert.deepEqual(Array.from(run('state.habits[1].allocations.map(x=>x.weight)')),[20,80]);assert.notEqual(run('state.habits[1].id'),reading);assert.equal(run('Growth.habitStats(state.habits[1]).done'),0);assert.equal(run('totalXP()'),xp);
run('state.habits[1].tiers[0].label="Изменено"');assert.equal(run('state.userHabitTemplates[0].tiers[0].label'),'5 минут');
console.log('ПРОЙДЕНО: библиотека открывает редактируемую форму; шаблоны не наследуют историю, серию, фазу и опыт; данные независимы.');
// Actual local write and backup validation preserve user templates.
let stored;sandbox.localStorage.setItem=(key,value)=>{if(key==='sanctum-fallback')stored=JSON.parse(value)};
run('Storage.write()');assert.equal(stored.userHabitTemplates.length,1);
run('state=validateStateStrict(JSON.parse(BackupManager.serialize()).data)');assert.equal(run('state.userHabitTemplates[0].id'),template);
run('const oldBackup=structuredClone(state);delete oldBackup.userHabitTemplates;delete oldBackup.habits[0].category;const migrated=validateStateStrict(oldBackup)');assert.equal(run('migrated.userHabitTemplates.length'),0);assert.equal(run('migrated.habits[0].category'),'Личность');assert.equal(run('migrated.habitCompletions.length'),1);
for(const script of ['bad.userHabitTemplates=null','bad.userHabitTemplates[0].tiers[0].xp=-1','bad.userHabitTemplates[0].weekdays=[]','bad.userHabitTemplates.push(structuredClone(bad.userHabitTemplates[0]))'])assert.throws(()=>run(`(()=>{const bad=structuredClone(state);${script};validateStateStrict(bad)})()`));
console.log('ПРОЙДЕНО: локальное сохранение, экспорт/импорт, старые копии и отклонение повреждённых шаблонов.');
run("const makePhase=(id,startDate,endDate,phaseNumber)=>({id,name:id,description:'',startDate,endDate,phaseNumber,completedAt:null,goals:[],missionIds:[]});state.phases=[makePhase('p1',addDays(today(),-29),today(),1),makePhase('p2',addDays(today(),1),addDays(today(),30),2)];const p1=state.phases[0];state.habits[0].phaseId=p1.id;state.habits[0].schedule[0].phaseId=p1.id;state.habitCompletions[0].phaseId=p1.id;state.habits.push({...Growth.copyHabit(state.habits[0],p1),id:'romanian',name:'Румынский язык'},{...Growth.copyHabit(state.habits[0],p1),id:'brain',name:'Лаборатория разума'});const oldHabits=JSON.stringify(state.habits),oldHistory=JSON.stringify(state.habitCompletions),oldReport=JSON.stringify(Growth.report(p1))");
action('phase-copy-habits','p2');assert.equal(form.checkboxes.length,3);form.checkboxes.find(x=>x.value==='brain').checked=false;submit();
assert.equal(run('state.habits.filter(h=>h.phaseId==="p1").length'),3);assert.equal(run('state.habits.filter(h=>h.phaseId==="p2").length'),2);assert.equal(run('JSON.stringify(Growth.habitSettings(state.habits.at(-1)))===JSON.stringify(Growth.habitSettings(state.habits.find(h=>h.id==="romanian")))'),true);
assert.equal(run('JSON.stringify(state.habits.slice(0,4))===oldHabits'),true);assert.equal(run('JSON.stringify(state.habitCompletions)===oldHistory'),true);assert.equal(run('JSON.stringify(Growth.report(state.phases[0]))===oldReport'),true);assert.equal(run('totalXP()'),xp);
assert.equal(run('state.habits.filter(h=>h.phaseId==="p2").every(h=>Growth.habitStats(h).done===0&&h.startDate===state.phases[1].startDate&&h.schedule.length===1&&h.schedule[0].phaseId==="p2")'),true);assert.equal(run('new Set(state.habits.map(h=>h.id)).size===state.habits.length'),true);
run('state.habits.at(-1).tiers[0].label="Копия"');assert.equal(run('state.habits.find(h=>h.id==="romanian").tiers[0].label'),'5 минут');run('validateStateStrict(JSON.parse(BackupManager.serialize()).data)');
action('phase-copy-habits','p2');form.checkboxes.forEach(x=>x.checked=false);const count=run('state.habits.length');form.onsubmit({preventDefault(){}});assert.match(nodes['#growth-error'].textContent,/Выбери хотя бы одну/);assert.equal(run('state.habits.length'),count);nodes['#growth-error'].textContent='';
console.log('ПРОЙДЕНО: выбранные привычки копируются с новыми ID и фазой; история и отчёт старой фазы неизменны; пустой выбор отклоняется.');
run('confirmAction=(title,description,fn)=>fn()');action('habit-template-delete',template);assert.equal(run('state.userHabitTemplates.length'),0);assert.equal(run('state.habits.length'),count);assert.equal(run('totalXP()'),xp);
// Removing a recommended attribute still allows choosing another one in the existing form.
run('state.userHabitTemplates=[{id:"missing",...Growth.habitSettings(state.habits[0]),allocations:[{id:"deleted-attribute",weight:100}]}];GrowthUI.habitTemplateUse("missing",true)');assert.equal(form.checkboxes.filter(x=>x.name==='attributes'&&x.checked).length,0);checked('attributes',selectedAttribute);submit();run('validateStateStrict(JSON.parse(BackupManager.serialize()).data)');
console.log('ПРОЙДЕНО: удаление шаблона сохраняет привычки и опыт; отсутствующий атрибут можно заменить в форме.');
