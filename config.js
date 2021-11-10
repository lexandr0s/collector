module.exports = {
	//хост для веб-интерфейса. если нужен удаленный доступ - указываем "0.0.0.0"
	//ВНИМАНИЕ! имейте ввиду что доступ неограничен. Поэтому, пока не реализован 
	//ограниченный доступ, желательно использовать только localhost.
	host: "localhost",
	
	//порт веб-интерфейса (произвольно).
	port:3000,
	//При данных настройках веб-интерфейс будет доступен по адресу http:\\localhost:3000
	
	//интервал между циклами переводов
	pause: 5000,
	
	//путь к базе данных (лучше не менять).
	base: "./db/collect.db",
	
	//Список сборщиков/collectors (КУДА БУДЕТ ПЕРЕВОДИТЬСЯ INAPP) и плательщиков/payers (ОТКУДА БУДЕТ ПЕРЕВОДИТЬСЯ INAPP)
	//Сборщиков может быть сколько угодно.
	//у каждого сборщика может быть сколько угодно плательщиков.
	//Для редактирования рекомендуется Notepad++. С ним проще следить за синтаксисом.
	collectors: [
	{
		//Имя сборщика (произвольное)
		name: "collector1",
		
		//In-APP адрес сборщика.
		address: "BJqm3sy19jWOuRDCbG6QhMU5p3XuqupGrE7X2tEM+eqikjrrSEB2YM44Sa1tD0uqEoGMxRT5kihl/8ATkOZnz9E=",
		
		//Плательщики для сборщика "collector1"
		payers: [
			{
				//Имя (произвольное)
				name: "payer1",
				
				//Приватный ключ
				key: "09d0bd64e37edc39225ae9229b5a81df6d5531c3cc2cb4bdaedc79e39be57eee"
			},
			{
				name: "payer2",
				key: "71dd0656f99a0b72a029135e269cbce326544dad3d4899fd69f3ac2f3740bcd0"
			},
		]
	},
//	{
//		name: "collector2",
//		address: "BJqm3sy19jWOuRDCbG6QhMU5p3XuqupGrE7X2tEM+eqikjrrSEB2YM44Sa1tD0uqEoGMxRT5kihl/8ATkOZnz9E=",
//		payers: [
//			{
//				name: "payer10",
//				key: "09d0bd88e37edc39225ae9227b5a81df6d5531c3cc2cb4bdaedc79e39be57eee"
//			},
//			{
//				name: "payer11",
//				key: "71dd0677f99a0b72a029135e269cbce326544dad3d4899fd69f3ac2f3740bcd0"
//			}
//		]
//	},
	]




}