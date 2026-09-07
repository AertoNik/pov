from pathlib import Path
import json
p=Path('outputs/index.html');s=p.read_text()
old="const CATEGORIES=['Физические','Мышление','Языки','Единоборства','Творчество','Личностные'];"
categories=['Физические','Мышление','Языки','Единоборства','Творчество','Личностные','Здоровье','Восстановление','Питание','Наука','Технологии','Программирование','Инженерия','Бизнес','Финансы','Карьера','Лидерство','Общение','Отношения','Музыка','Обучение','Самоорганизация','Бытовые навыки','Путешествия']
assert old in s
s=s.replace(old,'const CATEGORIES='+json.dumps(categories,ensure_ascii=False)+';')
paths={
'heart':'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
'pulse':'M2 12h5l3-8 4 16 3-8h5',
'moon':'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z',
'leaf':'M20 3C9 2 3 6 3 13a7 7 0 0 0 7 7c7 0 11-6 10-17ZM3 21 15 9',
'food':'M4 3v6a3 3 0 0 0 6 0V3M7 3v18M18 3c-3 3-3 8 0 9h2M20 3v18',
'dumbbell':'M6 6v12M3 8v8M18 6v12M21 8v8M6 12h12M3 12h3M18 12h3',
'atom':'M12 11v2M20.7 7c1.4 2.4-1.4 6.7-6.2 9.5S4.6 19.7 3.3 17s1.4-6.7 6.2-9.5S19.4 4.3 20.7 7ZM3.3 7c-1.4 2.4 1.4 6.7 6.2 9.5s9.9 3.2 11.2.5-1.4-6.7-6.2-9.5S4.6 4.3 3.3 7Z',
'flask':'M9 3h6M10 3v7L4 20v1h16v-1l-6-10V3M7 16h10',
'code':'m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18',
'chip':'M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
'briefcase':'M3 7h18v14H3zM8 7V3h8v4M3 12c5 3 13 3 18 0M10 12h4v4h-4z',
'wallet':'M3 6h17v15H3zM3 6V4l14-2v4M15 12h7v5h-7zM18 14.5h.1',
'users':'M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5v1',
'message':'M3 3h18v14H9l-6 4V3ZM7 7h10M7 12h6',
'music':'M9 18V5l12-2v13M9 7l12-2M9 18a3 3 0 1 1-3-3h3M21 16a3 3 0 1 1-3-3h3',
'camera':'M3 7h5l2-3h4l2 3h5v14H3zM16 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
'film':'M3 3h18v18H3zM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M7 12h10',
'pen':'m12 3 9 9-6 8-12 1 1-12zM3 21l8-8M14 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
'graduation':'m2 9 10-6 10 6-10 6zM6 12v6c4 3 8 3 12 0v-6M22 9v9',
'compass':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-5-13-3 7-7 3 3-7z',
'globe':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
'home':'m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
'mountain':'m2 21 8-17 5 9 2-4 5 12H2ZM7 10l3 2 3-2',
'flag':'M5 22V3M5 3c5-4 9 4 15 0v11c-6 4-10-4-15 0'
}
# All new assets are inline path icons; no external resources.
choices=[['target','Цель'],['brain','Разум'],['shield','Защита'],['bolt','Энергия'],['book','Знания'],['sun','Свет'],['skills','Связи'],['flame','Огонь'],['award','Звезда'],['clock','Время'],['chart','Рост'],['routine','Регулярность'],['heart','Сердце'],['pulse','Здоровье'],['moon','Отдых'],['leaf','Природа'],['food','Питание'],['dumbbell','Сила'],['atom','Наука'],['flask','Исследования'],['code','Программирование'],['chip','Технологии'],['briefcase','Карьера'],['wallet','Финансы'],['users','Команда'],['message','Общение'],['music','Музыка'],['camera','Фотография'],['film','Кино'],['pen','Письмо'],['graduation','Обучение'],['compass','Направление'],['globe','Мир'],['home','Дом'],['mountain','Преодоление'],['flag','Лидерство']]
insert='Object.assign(icons,'+json.dumps(paths,ensure_ascii=False)+');\nconst ATTRIBUTE_ICONS='+json.dumps(choices,ensure_ascii=False)+';\n'
s=s.replace('const icon=(name,size=18)=>',insert+'const icon=(name,size=18)=>',1)
oldchoices="[['target','Цель'],['brain','Разум'],['shield','Защита'],['bolt','Энергия'],['book','Знания'],['sun','Свет'],['skills','Связи'],['flame','Огонь'],['award','Звезда']].map"
assert oldchoices in s
s=s.replace(oldchoices,'ATTRIBUTE_ICONS.map',1)
p.write_text(s)
Path('work/app-script.js').write_text(s.split('<script>')[1].split('</script>')[0])
print(f'Добавлено: {len(categories)} категории и {len(choices)} значков всего.')
