const http	= require("http");
const fs	= require("fs");
const url	= require("url");
const parse	= require("./parse.js");


function init()
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
	};
	const errorPath = "./404/index.html";

	async function server(req, res)
	{
		let q = url.parse(req.url, true); //true?
		let path = "." + q.pathname;
		if (path == "./")
			path = "./index.html";

		let data;
		const args = {
			"path": path,
			"query": q.query,
			"shifts": shifts
		};
		try
		{
			data = await build[path](args);
		}
		catch (error)
		{
			if (!(error instanceof TypeError))
				console.log("ERROR!!! " + error);
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
	const shifts = args["shifts"];

	const data = await openFile(path);
	const data_string = data.toString("utf-8");
	if (query.index === undefined)
		return data_string.replace("\\(result\\)", "");
	return data_string.replace("\\(result\\)", shifts[parseshift(query) - 1]);
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
