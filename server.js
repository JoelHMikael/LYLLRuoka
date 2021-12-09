const http	= require("http");
const fs	= require("fs");
const url	= require("url");
const parse	= require("./parse.js");


async function init()
{
	const weekdays = [undefined, "MAANANTAI", "TIISTAI", "KESKIVIIKKO", "TORSTAI", "PERJANTAI", undefined];

	const build = {
		"./index.html": buildMain,
		"./index.css": buildDefault,
		"./404/index.css": buildDefault
	};
	const errorPath = "./404/index.html";

	let shiftcont = await openFile("./shifts.txt");
	shiftcont = shiftcont.toString("utf-8").replaceAll("\r", ""); // \r because of the \r\n newline on windows which creates problems
	const DB = await parse.build(shiftcont);

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
			"db": DB
		};
		if (typeof build[path] === "function")
		{
			data = await build[path](args);
		}
		else
		{
			data = await build404(errorPath, q.pathname);
		}
		res.write(data);
		res.end();
	}

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
	let index;
	if (typeof query.index === "string")
		index = query.index.toUpperCase().replaceAll(".", "").replaceAll(" ", "");
	const DB = args["db"];
	const data = await openFile(path);
	let data_string = data.toString("utf-8");

	let res = {};

	const d = new Date();
	let day = d.getDay();
	if ((typeof query.day === "string") && (parseInt(query.day).toString() === query.day) && (!isNaN(parseInt(query.day))) && (parseInt(query.day) > 0) && (parseInt(query.day) < 7))
		day = parseInt(query.day);
	data_string = data_string.replace(`<option value=\"${day}\">`, `<option value=\"${day}\" selected>`);

	// get the food shift to res["shift"]
	res["shift"] = undefined;
	if ((day === 0) || (day === 6))
		res["shift"] = `Maanantain ruoka: ${parse.get(day, query.index, DB)}`;
	if ((index === undefined) || (index === ""))
		res["shift"] = "";
	if (res["shift"] === undefined)
		res["shift"] = parse.get(day, index, DB);
	if (res["shift"] === -1)
		res["shift"] = "Kyseiselle kurssille/opettajalle ei löydy ruokailua päivältä!";

	// get the day
	res["foodshift-header"] = `Kurssin (???)/(???) ruokailuvuoro ${["su", "ma", "ti", "ke", "to", "pe", "la"][day]}:`
	if (res["shift"] === "")
		data_string = data_string.replace('<div id="shift-result" class="float-block">', '<div id="shift-result" class="float-block" style="display: none;">');
	
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


function build_replace(s, dict)
{
	console.log(dict);
	for (const [key, val] of Object.entries(dict))
	{
		console.log(`\\(${key}\\)`);
		s = s.replaceAll(`\\(${key}\\)`, val);
	}

	return s;
}


init();
