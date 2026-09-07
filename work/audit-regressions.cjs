const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dummy={innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){},append(){},remove(){},querySelector(){return dummy},querySelectorAll(){return []},addEventListener(){}};
const sandbox={console,structuredClone,Blob,URL,Date,Math,JSON,Number,String,Object,Array,Set,Map,Error,performance,crypto:require('crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>dummy,querySelectorAll:()=>[],createElement:()=>({...dummy}),addEventListener(){},body:{style:{},classList:{toggle(){}},dataset:{}}},window:{addEventListener(){},scrollTo(){}},location:{hash:'#/overview'},localStorage:{getItem:()=>null,setItem(){}},navigator:{}};
vm.createContext(sandbox);const source=fs.readFileSync('outputs/index.html','utf8').split('<script>')[1].split('</script>')[0].replace(/\ninit\(\);\s*$/,'');vm.runInContext(source,sandbox);let checks=0;
function test(name,script){const result=vm.runInContext(script,sandbox);assert.equal(result,true,name);checks++;console.log('ПРОЙДЕНО:',name)}
vm.runInContext('state=freshState(); Modal.open=()=>{};Modal.close=()=>{}; render=()=>{};save=()=>{};toast=()=>{};beep=()=>{}',sandbox);

(async()=>{
const good=vm.runInContext('freshState()',sandbox);good.revision=7;
function setup(raw,fallback,fail=false){
 sandbox.localStorage={getItem:()=>fallback,setItem(){}};
 const database={transaction(){if(fail)throw Error('read');return {objectStore(){return {get(){const r={result:raw};queueMicrotask(()=>r.onsuccess());return r}}}}}};
 sandbox.indexedDB={open(){const r={result:database};queueMicrotask(()=>r.onsuccess());return r}};
}
setup(good,JSON.stringify({revision:99}));assert.equal((await vm.runInContext('Storage.open()',sandbox)).revision,7);
setup(good,'{broken');assert.equal((await vm.runInContext('Storage.open()',sandbox)).revision,7);
setup(null,JSON.stringify(good),true);assert.equal((await vm.runInContext('Storage.open()',sandbox)).revision,7);
setup({...good,revision:8},JSON.stringify(good));assert.equal((await vm.runInContext('Storage.open()',sandbox)).revision,8);
setup(good,JSON.stringify({...good,revision:9}));assert.equal((await vm.runInContext('Storage.open()',sandbox)).revision,9);
console.log('ПРОЙДЕНО: 5 сценариев восстановления из двух хранилищ.');
const nodes={};sandbox.document.querySelector=s=>nodes[s]||(nodes[s]={...dummy,value:'',disabled:false});
vm.runInContext('state=freshState();BrainLab.session={module:"math",start:performance.now(),saved:false};BrainLab.math(2)',sandbox);
for(let n=0;n<10;n++){
 nodes['#math-answer'].value='-1';const submit=nodes['#math-answer-form'].onsubmit;submit({preventDefault(){}});submit({preventDefault(){}});
 const next=nodes['#math-next'].onclick;next();next();
}
assert.equal(vm.runInContext('state.brain.sessions.length',sandbox),1);
assert.equal(vm.runInContext('state.brain.sessions[0].metrics.accuracy',sandbox),0);
vm.runInContext('validateState(state)',sandbox);
console.log('ПРОЙДЕНО: устный счёт — 10 раундов, повторная отправка и переход, одна награда.');
vm.runInContext('state=freshState();state.profile.name="Сохранить профиль";Storage.write=async()=>false;resetData()',sandbox);
nodes['#reset-step-two'].onclick();nodes['#reset-word'].value='УДАЛИТЬ';nodes['#reset-word'].oninput();await nodes['#reset-confirm'].onclick();
assert.equal(vm.runInContext('state.profile.name',sandbox),'Сохранить профиль');assert.equal(nodes['#reset-confirm'].disabled,false);
console.log('ПРОЙДЕНО: сбой записи при сбросе сохраняет текущий профиль.');
})().catch(e=>{console.error(e);process.exitCode=1});
