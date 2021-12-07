const http	= require("http");
const fs	= require("fs");
const url	= require("url");
const parse	= require("./parse.js");


async function init()
{
	const weekdays = [undefined, "MAANANTAI", "TIISTAI", "KESKIVIIKKO", "TORSTAI", "PERJANTAI", undefined];

	const shifts = [
		//1:
		"Ruokailuvuoro 1",
		//2:
		"Ruokailuvuoro 2",
		//3:
		"Ruokailuvuoro 3"
	];

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
			"shifts": shifts,
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
	const shifts = args["shifts"];
	const DB = args["db"];

	const data = await openFile(path);
	let data_string = data.toString("utf-8");

	let res;
	const d = new Date();
	let day = d.getDay();

	if ((typeof query.day === "string") && (parseInt(query.day).toString() === query.day) && (!isNaN(parseInt(query.day))) && (parseInt(query.day) > 0) && (parseInt(query.day) < 7))
		day = parseInt(query.day);

	if ((day === 0) || (day === 6))
		res = `Maanantain ruoka: ${parse.get(day, query.index, DB)}`;
	if ((index === undefined) || (index === ""))
		res = "";
	if (res === undefined)
		res = parse.get(day, index, DB);
	if (res === -1)
		res = "Kyseiselle kurssille/opettajalle ei löydy ruokailua päivältä!"; // it's the frickin \r in the database!
	data_string = data_string.replace("\\(result\\)", res);
	data_string = data_string.replace(`<option value=\"${day}\">`, `<option value=\"${day}\" selected>`);
	
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

function parseshift(index)
{
	return 1; // placeholder glue
}


init();
