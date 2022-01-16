const http	= require("http");
//const fs	= require("fs");
const url	= require("url");
const scrape	= require("./scrape.js");
const SQL_DBS	= require("./database.js");
const DBPARSE	= require("./dbparse.js");
const parseClasses = require("./parseClasses.js").classes;
const openFile	= require("./open.js").file;


async function init()
{
	const weekdays = [undefined, "MAANANTAI", "TIISTAI", "KESKIVIIKKO", "TORSTAI", "PERJANTAI", undefined];

	const build = {
		"./Cont/index.html": buildMain,
		"./Cont/index.css": buildDefault,
		"./Cont/devs/index.html": buildDevs,
		"./Cont/devs/index.css": buildDefault,
		"./Cont/404/index.css": buildDefault,
		"./Cont/non-main.css": buildDefault,
		"./Cont/Images/help.png": buildImage,
		"./Cont/Images/back.png": buildImage
	};
	const errorPath = "./Cont/404/index.html";




	// await for needed things in async
	let [foodsThisWeek, foodsNextWeek, dbcredentials] = await Promise.all([
		scrape.food(scrape.link(1)),
		scrape.food(scrape.link(2)),
		openFile("../dblogin.txt")
	]);

	// get the MySQL DB connection
	const SQLDB = new SQL_DBS.Database(JSON.parse(dbcredentials));
	//buildDB(SQLDB, "./projectshifts.txt");

	// get the food "database"
	const foods = [foodsThisWeek, foodsNextWeek];

	// server code
	async function server(req, res)
	{
		// validate inputs
		let q = url.parse(req.url, true);
		let ind = q.query.index;
		if (typeof ind === "string")
			ind = validateIndex(q.query.index.substring(0, 20));
		else
			ind = "";
		let d = q.query.day;
		if (typeof d === "string")
			d = antiXSS(d);
		else
			d = "";
		q.query = {
			index: ind,
			day: d
		};
		let path = "./Cont" + antiXSS(q.pathname);
		if (isDir(path))
			path += ["/index.html", "index.html"][+(path[path.length - 1] === "/")];

		// pack the data required by the builders
		let data;
		const args = {
			"path": path,
			"path404": errorPath,
			"query": q.query,
			"foods": foods,
			"sqldb": SQLDB
		};

		// build the page
		const buildFound = +(typeof build[path] === "function");
		res.writeHead([404, 200][buildFound]);
		data = await [build404, build[path]][buildFound](args);
		res.write(data);
		res.end();
	}

	// start server
	const runningServer = http.createServer(server).listen(8080);
	
	// stop server
	function closeServer() {
		SQLDB.close();
		runningServer.close();
	}
	process.on("SIGINT", closeServer);
	process.on("SIGQUIT", closeServer);
	process.on("SIGTERM", closeServer);
}




function validateIndex(sus)
{
	return antiXSS(DBPARSE.cluttered(sus));
}

function antiXSS(sus)
{
	if (!(typeof sus === "string"))
		return "";
	return replace(sus, ["<", ">", "(", ")"], ["&lt;", "&gt;", "&#40;", "&#41;"]);
}

function isDir(path)
{
	return (DBPARSE.getNextChar(path.substring(1), ".") === -1);
}


function replace(s, from, to)
{
	for (let i = 0; i < from.length; i++)
	{
		s = s.replaceAll(from[i], to[i]);
	}
	return s;
}


async function buildMain(args)
{
	const path = args["path"];
	const query = args["query"];
	const foods = args["foods"];
	const index = query.index;
	const SQLDB = args["sqldb"];
	const data = await openFile(path);
	let data_string = data.toString("utf-8");

	let res = {};

	const d = new Date();
	let day = d.getDay();
	day = (day + +(day === 0) * 7) - 1;
	const actualDay = day;
	day = +(!(day === 5) && !(day === 6)) * day;
	if ((typeof query.day === "string") && (parseInt(query.day).toString() === query.day) && (!isNaN(parseInt(query.day))) && (parseInt(query.day) >= 0) && (parseInt(query.day) < 5))
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
		let shift = await DBPARSE.get(day, index, SQLDB);
		if (shift !== undefined)
		{
			res["shift"] = shift[0].name;
			res["shift-header"] = "";
			for (let i = 0; i < shift[1].length; i++)
			{
				res["shift-header"] += `${shift[1][i].course}/${shift[1][i].teacher}`;
				if (shift[1][i].class !== null)
					res["shift-header"] += `/${shift[1][i].class}`
				if (i + 1 !== shift[1].length)
					res["shift-header"] += " ja ";
			}
			res["index-type"] = ["Kurssin", "Kurssien"][+(shift[1].length > 1)];
		}
		else
		{
			res["shift"] = -1;
			res["shift-header"] = `${index}`;
			res["index-type"] = indexTypes[DBPARSE.indexType(index)];
			if (res["index-type"] === undefined)
				res["index-type"] = "";
		}
	}
	if (res["shift"] === -1)
		res["shift"] = "Kurssilla/opettajalla/luokalla ei ole ruokailua päivällä tai kurssia ei ole olemassa!";

	// get the example input
	res["example-input"] = await DBPARSE.randomIndex(day, SQLDB);

	// get the day
	let weekdays = ["ma", "ti", "ke", "to", "pe", "la", "su"];
	res["day"] = weekdays[day];
	if (res["shift"] === "")
		data_string = data_string.replace('<div id="shift-result" class="float-block">', '<div id="shift-result" class="float-block" style="display: none;">');
	
	// get the food
	let food;
	food = foods[ +(day < actualDay) ][day];
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

async function buildDevs(args)
{
	const path = args["path"];
	const data = await openFile(path);
	const DB = args["sqldb"];

	let res = "";
	let devs = await DB.query_raw("SELECT name, description, contact FROM devs");
	for (let dev = 0; dev < devs.length; dev++)
	{
		let devInfo = devs[dev];
		res += '<div class="float-block">' +
				`<p class="column">${devInfo.name}</p>` +
				`<p class="column">${devInfo.description}</p>` +
				`<a href="mailto:${devInfo.contact}" class="column" style="white-space: nowrap; overflow: hidden; overflow-wrap: normal; text-overflow: ellipsis;">${devInfo.contact}</a>` +
			'</div>';
	}

	return build_replace(data.toString("utf-8"), {"devs": res});
}


async function build404(args)
{
	args["path"] = args["path"].substring("./Cont".length);
	const data = await openFile(args["path404"]);
	const data_string = data.toString("utf-8");
	return data_string.replace("\\(path\\)", args["path"]);
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


// Run this if you want to build the database from text files
async function buildDB(SQLDB, shiftfile = "./shifts.txt", classfile = "./classes.txt")
{
	let [shiftCont, classCont] = await Promise.all([
		openFile(shiftfile),
		openFile(classfile)
	]);
	shiftCont = shiftCont.toString("utf-8").replaceAll("\r", ""); // \r because of the \r\n newline on windows which creates problems
	classCont = classCont.toString("utf-8").replaceAll("\r", "");
	await Promise.all([
        parseClasses("./Kurssitarjottimet/2016Classes.txt", "./Kurssitarjottimet/NewClasses.txt", SQLDB),
		DBPARSE.build(shiftCont, SQLDB)
	]);
	return 0;
}


init();
