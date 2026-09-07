from pathlib import Path
p=Path('outputs/index.html');s=p.read_text()
s=s.replace('const number=n=>Number(n||0).toLocaleString(\'ru-RU\');',"const number=n=>Number(n||0).toLocaleString('ru-RU');\nconst plural=(n,one,few,many)=>`${number(n)} ${n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many}`;")
s=s.replace('${a.history.length} занятий',"${plural(a.history.length,'занятие','занятия','занятий')}")
s=s.replace('${state.attributes.filter(a=>a.totalXP>0).length} атрибутов в развитии',"${plural(state.attributes.filter(a=>a.totalXP>0).length,'атрибут','атрибута','атрибутов')} в развитии")
s=s.replace("state.missions.filter(m=>(!m.archived||completion(m.id,date))&&due(m,date))","state.missions.filter(m=>(!m.archived&&due(m,date))||completion(m.id,date))")
s=s.replace("reconcile(){state.achievements=state.achievements.filter(a=>ACHIEVEMENTS.find(x=>x[0]===a.id)?.[3]())}","reconcile(){const removed=state.achievements.filter(a=>!ACHIEVEMENTS.find(x=>x[0]===a.id)?.[3]());state.achievements=state.achievements.filter(a=>!removed.includes(a));const titles=removed.map(a=>'Достижение: '+ACHIEVEMENTS.find(x=>x[0]===a.id)?.[1]);state.activity=state.activity.filter(h=>h.type!=='achievement'||!titles.includes(h.title))}")
s=s.replace("$('#memory-status').textContent='Вспоминай';$('#number-answer').focus();$('#number-answer-form').onsubmit=e=>{e.preventDefault();if(","$('#memory-status').textContent='Вспоминай';accepting=true;$('#number-answer').focus();$('#number-answer-form').onsubmit=e=>{e.preventDefault();if(!accepting)return;if(")
s=s.replace("let state,db,route=", "let state,db,route=")
s=s.replace('/*AUTOPOLISH*/','')
s=s.replace('</style>','''
/* Interaction and layout refinements */
.sidebar{overflow-y:auto;scrollbar-width:thin;scrollbar-color:#344143 transparent}.sidebar>nav{flex-shrink:0}.mission-title,.skill-card h3,.activity-item p{overflow-wrap:anywhere}.check{position:relative}.check:after{content:"";position:absolute;inset:-9px}.page-intro>.flex{justify-content:flex-end}button,input,select,textarea{touch-action:manipulation}.modal-head{position:sticky;top:0;background:#171e20;z-index:2}.modal-overlay .command-input{position:sticky;top:65px;z-index:2;background:#171e20}
@media(max-width:767px){.page-intro:has(>.flex){flex-wrap:wrap}.page-intro>.flex{width:100%;justify-content:flex-start}.page-intro>.btn{white-space:normal;max-width:145px}.lab-hero .eyebrow{font-size:10px}.module-code{max-width:70%;text-align:right}.sidebar-bottom{padding-bottom:15px}.modal-actions{flex-wrap:wrap}.modal-actions>.btn{min-width:90px;white-space:normal}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.game-cell{min-height:42px}.mission-meta span{overflow-wrap:anywhere}}
</style>''')
p.write_text(s)
Path('work/app-script.js').write_text(s.split('<script>')[1].split('</script>')[0])
