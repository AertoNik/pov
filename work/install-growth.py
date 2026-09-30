from pathlib import Path
p=Path('outputs/index.html');s=p.read_text()
# Keep a source snapshot for migration regression tests and recovery during this change.
Path('work/pre-growth.html').write_text(s)
# Model and validation: keep the original portable format and add an extension version.
s=s.replace('return {version:1,revision:0', 'return {...growthDefaults(),version:1,revision:0',1)
s=s.replace("developmentChart:{...CHART_DEFAULTS,axes:[]}","developmentChart:{...CHART_DEFAULTS,axes:[]},brainProfile:{period:'30',category:'logic'}",1)
s=s.replace('return output}\nconst BackupManager=', 'return Growth.validate(raw,output)}\nconst BackupManager=',1)
s=s.replace("const totalXP=()=>state.completions.reduce((s,c)=>s+c.xp,0)+state.brain.sessions.reduce((s,c)=>s+c.xp,0);", "const totalXP=()=>developmentRecords().reduce((s,c)=>s+c.xp,0);")
s=s.replace('[...state.completions,...state.brain.sessions]','developmentRecords()')
s=s.replace('for(const m of [...state.missions,...state.routines.flatMap(r=>r.missions)])', 'for(const m of [...state.missions,...state.routines.flatMap(r=>r.missions),...state.habits])')
# Preserve nav ordering used by mobile shortcuts; add new links at the end.
s=s.replace("['settings','settings','Настройки']];", "['settings','settings','Настройки'],['phases','calendar','Фазы'],['habits','routine','Привычки'],['persona','users','Личность'],['brain-profile','chart','Профиль способностей'],['codex','book','Кодекс']];")
s=s.replace("$('#crumb').textContent=NAV", "$('#crumb').textContent=NAV",1)
# Use the existing Today date picker, rewards and cards.
s=s.replace('<section class="panel">${ms.length?ms.slice()', '${GrowthUI.habitsSection(selectedDate)}<h2 class="space" style="margin-bottom:16px">Миссии</h2><section class="panel">${ms.length?ms.slice()',1)
s=s.replace('+`<div class="stats"><div class="stat"><div class="stat-label">${icon(\'bolt\',15)}Опыт за сегодня', '+GrowthUI.phaseBanner()+`<div class="stats space"><div class="stat"><div class="stat-label">${icon(\'bolt\',15)}Опыт за сегодня',1)
s=s.replace('state.completions.filter(c=>c.date===date).reduce((s,c)=>s+c.duration,0)', 'developmentRecords().filter(c=>c.date===date).reduce((s,c)=>s+c.duration,0)',1)
s=s.replace("+'</div></div>`}", "+'</div></div>`}") if False else s
# Dashboard habits within the existing main column.
s=s.replace('<div class="dashboard-grid"><div class="stack"><section', '<div class="dashboard-grid"><div class="stack">${GrowthUI.habitsSection(today())}<section',1)
s=s.replace('state.completions.reduce((s,c)=>s+c.duration,0),sessions', 'developmentRecords().reduce((s,c)=>s+c.duration,0),sessions',1)
s=s.replace("['Время развития',(totalTime/60).toFixed(1).replace('.',','),'часов в миссиях'],['Когнитивный результат',cog+'%','средний балл тренировок']", "['Время развития',(totalTime/60).toFixed(1).replace('.',','),'часов практики'],['Привычки выполнены',state.habitCompletions.length,'за всё время']")
s=s.replace('const a=analyticsData(),s=streaks(),totalTime=developmentRecords().reduce((s,c)=>s+c.duration,0),sessions=state.brain.sessions,cog=sessions.length?Math.round(sessions.reduce((n,s)=>n+s.score,0)/sessions.length):0;', 'const a=analyticsData(),s=streaks(),totalTime=developmentRecords().reduce((s,c)=>s+c.duration,0),sessions=state.brain.sessions;')
s=s.replace('${developmentChart()}<section', '${developmentChart()}${BrainProfile.render(true)}<section',1)
s=s.replace("['routine','Протоколы']].map", "['routine','Протоколы'],['habit','Привычки']].map",1)
s=s.replace("function bindView(){bindDevelopment();", "function bindView(){bindDevelopment();GrowthUI.bind();",1)
s=s.replace("function dispatch(action,b){const id=", "function dispatch(action,b){if(action.startsWith('growth-')){const name=action.slice(7);if(!GrowthUI.handle(name,b))GrowthUI.contentAction(name,b);return}const id=",1)
s=s.replace("settings:renderSettings};", "settings:renderSettings,phases:()=>GrowthUI.phases(),habits:()=>GrowthUI.habits(),persona:()=>GrowthUI.persona(),'brain-profile':()=>BrainProfile.render(),codex:()=>GrowthUI.codex()};",1)
s=s.replace("['go-attributes','Найти атрибут','search']];", "['go-attributes','Найти атрибут','search'],['go-phases','Открыть фазы','calendar'],['go-habits','Открыть привычки','routine'],['go-persona','Открыть профиль личности','users'],['go-codex','Открыть Кодекс','book'],['go-brain-profile','Открыть профиль способностей','chart']];")
s=s.replace('<section class="lab-hero">', '<section class="panel pad"><div class="flex between wrap"><div><h3>Профиль способностей</h3><p class="small muted">Логика, память, внимание и другие направления — каждое со своей динамикой.</p></div><a class="btn" href="#/brain-profile">Открыть профиль</a></div></section><section class="lab-hero space">',1)
s=s.replace('Профиль, миссии, атрибуты, история и результаты тренировок в одном файле.', 'Профиль, фазы, привычки, личность, Кодекс, миссии и тренировки в одном файле.')
s=s.replace('${state.completions.length} выполнений · ${state.brain.sessions.length} тренировок', '${state.completions.length} выполнений · ${state.brain.sessions.length} тренировок · ${state.phases.length} фаз · ${state.habits.length} привычек · ${state.habitCompletions.length} отметок · ${state.codex.length} записей Кодекса')
s=s.replace('${candidate.completions.length} выполнений · ${candidate.brain.sessions.length} тренировок', '${candidate.completions.length} выполнений · ${candidate.brain.sessions.length} тренировок · ${candidate.phases.length} фаз · ${candidate.habits.length} привычек · ${candidate.codex.length} записей Кодекса')
css='''\n.growth-text{white-space:pre-wrap;overflow-wrap:anywhere}.growth-list{padding-left:20px;margin:16px 0;line-height:1.8;overflow-wrap:anywhere}.growth-picks{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;max-height:200px;overflow:auto}.growth-picks label{display:flex;align-items:center;gap:6px;max-width:100%;overflow-wrap:anywhere}.growth-picks input{width:auto;accent-color:var(--accent)}.growth-tier{border-top:1px solid var(--line);padding-top:16px}.growth-codex-filters{align-items:end}.growth-codex-filters .field{flex:1;min-width:150px}.growth-phase{margin-bottom:24px}.sidebar-bottom nav{margin-bottom:14px}.navlink{min-height:40px}@media(max-width:600px){.growth-codex-filters .field{min-width:100%;width:100%}.growth-picks{gap:12px 18px}.growth-tier .form-grid{grid-template-columns:1fr}.growth-phase h2{font-size:21px}.form-grid{min-width:0}.field{min-width:0}.modal-body .stats{grid-template-columns:repeat(2,minmax(0,1fr))}}\n'''
s=s.replace('</style>',css+'</style>',1)
code='\n'.join(Path('work/'+f).read_text() for f in ['growth-model.js','growth-ui.js','persona-codex.js','brain-profile.js'])
s=s.replace('\ninit();','\n'+code+'\ninit();')
p.write_text(s)
Path('work/app-script.js').write_text(s.split('<script>')[1].split('</script>')[0])
