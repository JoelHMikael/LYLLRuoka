const parse = require("./dbparse.js");
const open = require("./Functions/open.js");
const { weekdayToNumber } = require("./Functions/dateFuncs.js");

function* scrapeFood(data)
{
	const foodRegex = /<title>(\w{2} (?:\d\d?\.){2}\d{4})<\/title><description><!\[CDATA\[(Lounas) ?:? ?(.*?)(Kasvislounas) ?:? ?(.*?)]]><\/description>/gm;
	const foods = data.matchAll(foodRegex);
	for(const food of foods)
	{
		yield [
			weekdayToNumber(food[1]),	// index
			food[1],	// header (date)
			[food[2], food[3]],	// first header, first food
			[food[4], food[5]]	// second header, second food
		];
	}
}

async function buildFoods(DB)
{
	await DB.query_raw("DELETE FROM foods");
	let foodData = await Promise.all([
		open.url(getFoodLink(1)),
		open.url(getFoodLink(2))
	]);
	foodData = foodData.map((f) => f.toString("utf-8"));
	const foodInitOperations = [];
	const foods = foodData.map(f => scrapeFood(f));
	for(let week = 1; week <= 2; week++)
	{
		for(const food of foods[week - 1])
		{
			foodInitOperations.push(DB.execute("INSERT INTO foods VALUES (?, ?, FALSE, ?, ?, ?)", [
				week,
				food[0],
				food[2][0],
				food[1],
				food[2][1]
			]));
			foodInitOperations.push(DB.execute("INSERT INTO foods VALUES (?, ?, TRUE, ?, ?, ?)", [
				week,
				food[0],
				food[3][0],
				food[1],
				food[3][1]
			]));
		}
	}
	await Promise.all(foodInitOperations);
}

function getFoodLink(week)
{
	return `https://eruokalista.lohja.fi/AromieMenus/FI/Default/Lohja/Koulut/Rss.aspx?Id=97f76449-f57c-4217-aede-b5f9dbf2b41e&DateMode=${week}`;
}


exports.foods = scrapeFood;
exports.link = getFoodLink;
exports.build = buildFoods;
