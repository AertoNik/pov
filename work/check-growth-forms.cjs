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
vm.runInContext('GrowthUI.phaseForm()',sandbox);set('name','Фундамент');set('goals','Практика\nВыдержка');submit();assert.equal(vm.runInContext('state.phases[0].goals.length',sandbox),2);
const phaseId=vm.runInContext('state.phases[0].id',sandbox),attributeId=vm.runInContext('state.attributes[0].id',sandbox);
vm.runInContext(`GrowthUI.habitForm(null,'${phaseId}')`,sandbox);set('name','Чтение');checked('attributes',attributeId);submit();assert.equal(vm.runInContext('state.habits[0].phaseId',sandbox),phaseId);
const habitId=vm.runInContext('state.habits[0].id',sandbox);vm.runInContext('GrowthUI.personaForm()',sandbox);set('name','Наблюдатель');set('traits','Спокойствие\nЛюбопытство');checked('habitIds',habitId);submit();assert.equal(vm.runInContext('state.persona.habitIds.length',sandbox),1);
vm.runInContext('GrowthUI.ruleForm()',sandbox);set('situation','Конфликт');set('oldReaction','Тороплюсь ответить');set('newReaction','Уточняю факты');submit();assert.equal(vm.runInContext('state.persona.rules.length',sandbox),1);
vm.runInContext('GrowthUI.referenceForm()',sandbox);set('name','Образ');set('take','Выдержка');submit();
vm.runInContext('GrowthUI.codexForm()',sandbox);set('title','Книга');set('tags','мышление, практика');set('detail-author','Автор');set('detail-progress','20 страниц');set('category','Персонажи');form.elements.category.onchange();set('detail-source','Произведение');set('detail-take','Спокойная речь');set('category','Книги');form.elements.category.onchange();assert.equal(form.elements['detail-author'].value,'Автор');assert.equal(form.elements['detail-progress'].value,'20 страниц');set('rating','8');submit();assert.equal(vm.runInContext('state.codex[0].details.take',sandbox),'Спокойная речь');
vm.runInContext('Growth.mark(state.habits[0].id,today(),0);validateStateStrict(JSON.parse(BackupManager.serialize()).data)',sandbox);
console.log('ПРОЙДЕНО: формы создания фазы, привычки, личности, правила, референса и Кодекса; переключение категории сохраняет введённые детали; полный экспорт.');
