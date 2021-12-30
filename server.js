const http	= require("http");
const fs	= require("fs");
const url	= require("url");
const parse	= require("./parse.js");
const scrape	= require("./scrape.js");


async function init()
{
	const weekdays = [undefined, "MAANANTAI", "TIISTAI", "KESKIVIIKKO", "TORSTAI", "PERJANTAI", undefined];

	const build = {
		"./index.html": buildMain,
		"./index.css": buildDefault,
		"./404/index.css": buildDefault,
		"./help.png": buildImage
	};
	const errorPath = "./404/index.html";

	// await for needed things in async
	let [shiftCont, classCont, foodsThisWeek, foodsNextWeek] = await Promise.all([
		openFile("./shifts.txt"),
		openFile("./classes.txt"),
		scrape.food(scrape.link(1)),
		scrape.food(scrape.link(2))
	]);

	// get the food shift "database"
	shiftCont = shiftCont.toString("utf-8").replaceAll("\r", ""); // \r because of the \r\n newline on windows which creates problems
	classCont = classCont.toString("utf-8").replaceAll("\r", "");
	let DB = parse.build(shiftCont);
	parse.classes(classCont, DB);

	// get the food "database"
	const foods = [foodsThisWeek, foodsNextWeek];

	// server code
	async function server(req, res)
	{
		let q = url.parse(req.url, true);
		let path = "." + q.pathname;
		if (path == "./")
			path = "./index.html";

		let data;
		const args = {
			"path": path,
			"query": q.query,
			"db": DB,
			"foods": foods
		};

		if (typeof build[path] === "function")
			data = await build[path](args);
		else
			data = await build404(errorPath, q.pathname);

		res.write(data);
		res.end();
	}

	// start server
	http.createServer(server).listen(8080);
}


function openFile(path)
{
	return new Promise((resolve, reject) =>
	{
		fs.readFile(path, (err, data) =>
		{
			if (err)
				reject(err);
			resolve(data);
		})
	});
}

async function buildMain(args)
{
	const path = args["path"];
	const query = args["query"];
	const foods = args["foods"];
	let index;
	if (typeof query.index === "string")
		index = parse.cluttered(query.index);
	const DB = args["db"];
	const data = await openFile(path);
	let data_string = data.toString("utf-8");

	let res = {};

	const d = new Date();
	let day = d.getDay();
	const actualDay = day;
	day = +((day === 0) || (day === 6)) + (+(!(day === 0) && !(day === 6)) * day);
	if ((typeof query.day === "string") && (parseInt(query.day).toString() === query.day) && (!isNaN(parseInt(query.day))) && (parseInt(query.day) > 0) && (parseInt(query.day) < 7))
		day = parseInt(query.day);
	data_string = data_string.replace(`<option value=\"${day}\">`, `<option value=\"${day}\" selected>`);

	// get the food shift to res["shift"]
	const indexTypes = {
		"course": "Kurssin",
		"teacher": "Opettajan",
		"class": "Luokan"
	};
	res["shift"] = undefined;
	if ((index === undefined) || (index === ""))
		res["shift"] = "";
	if (res["shift"] === undefined)
	{
		let shift = parse.get(day, index, DB);
		let key = Object.keys(shift)[0];
		if (key !== undefined)
		{
			res["shift"] = key;
			res["shift-header"] = `${shift[key][0]}/${shift[key][1]}`;
			if (shift[key][2] !== undefined)
				res["shift-header"] += `/${shift[key][2]}`
			res["index-type"] = "Kurssin";
		}
		else
		{
			res["shift"] = -1;
			res["shift-header"] = `${index}`;
			res["index-type"] = indexTypes[parse.indexType(index)];
			if (res["index-type"] === undefined)
				res["index-type"] = "";
		}
	}
	if (res["shift"] === -1)
		res["shift"] = "Kurssilla/opettajalla/luokalla ei ole ruokailua päivällä tai kurssia ei ole olemassa!";

	// get the example input
	res["example-input"] = parse.randomIndex(DB, day - 1);

	// get the day
	let weekdays = ["su", "ma", "ti", "ke", "to", "pe", "la"];
	res["day"] = weekdays[day];
	if (res["shift"] === "")
		data_string = data_string.replace('<div id="shift-result" class="float-block">', '<div id="shift-result" class="float-block" style="display: none;">');
	
	// get the food
	let food;
	food = foods[ +(day < actualDay) ][day]; // test this out more
	if (food !== undefined)
	{
		res["food-header"] = food[0];
		res["food"] = food[1];
	}
	else
	{
		res["food-header"] = weekdays[day];
		res["food"] = "Päivälle ei löytynyt ruokaa";
	}
	res["food-header"] = `Päivän ${res["food-header"]} kouluruoka:`;

	data_string = build_replace(data_string, res);

	return data_string;
}

async function build404(path, attemptpath)
{
	const data = await openFile(path);
	const data_string = data.toString("utf-8");
	return data_string.replace("\\(path\\)", attemptpath);
}

async function buildDefault(args)
{
	const path = args["path"];
	const data = await openFile(path);
	return data.toString("utf-8");
}

async function buildImage(args)
{
	const path = args["path"];
	const data = await openFile(path);
	return data;
}


function build_replace(s, dict)
{
	for (const [key, val] of Object.entries(dict))
	{
		s = s.replaceAll(`\\(${key}\\)`, val);
	}

	return s;
}


init();
