const https = require("https");
const parse = require("./DBPARSE.js");
const fs = require("fs");
const events = require("events");

async function urlOpen(path)
{
	return new Promise((resolve, reject) =>
	{
		let req = https.get(path, res =>
		{
			res.on("data", resolve);
		});
	});
	req.on("error", e =>
	{
		console.error(e);
	});
	req.end();
}

async function scrapeFood(url)
{
	let data = await urlOpen(url);
	data = data.toString("utf-8");

	let foodList = [];
	const weekdays = ["ma", "ti", "ke", "to", "pe", "la", "su"];

	let titleTags = ["<title>", "</title>"];
	let foodTags = ["<![CDATA[", "]]>"];
	const getSpan = (data, tags, i = 0) =>
	{
		return [
			parse.find(data, tags[0], i) + tags[0].length,
			parse.find(data, tags[1], i)
		];
	}
	let mainTitle = parse.find(data, titleTags[1]) + titleTags[1].length;
	let titleSpan = getSpan(data, titleTags, mainTitle);
	let foodSpan = getSpan(data, foodTags);

	while (
		   (titleSpan[0] !== -1)
		&& (titleSpan[1] !== -1)
		&& (foodSpan[0] !== -1)
		&& (foodSpan[1] !== -1)
	)
	{
		let title = data.substring(titleSpan[0], titleSpan[1]);
		let food = data.substring(foodSpan[0], foodSpan[1]);

		let weekdayIndex = weekdays.findIndex(val => { return val === title.substring(0, 2); });
		if (weekdayIndex !== -1)
			foodList[weekdayIndex] = [title, neatify(food)];

		titleSpan = getSpan(data, titleTags, foodSpan[1]);
		foodSpan = getSpan(data, foodTags, titleSpan[1]);
	}

	return foodList;
}

function getFoodLink(week)
{
	return `https://eruokalista.lohja.fi/AromieMenus/FI/Default/Lohja/Koulut/Rss.aspx?Id=97f76449-f57c-4217-aede-b5f9dbf2b41e&DateMode=${week}`;
}

function neatify(food)
{
	return food.replaceAll(")", ")<br>").replaceAll(" :", ":").replaceAll(":", ":<br>");
}

exports.food = scrapeFood;
exports.link = getFoodLink;
