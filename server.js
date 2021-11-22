const http	= require("http");
const fs	= require("fs");
const url	= require("url");

mainPage = "./index.html";
allowedPaths = [mainPage, "./index.css"];
path404 = "./404/index.html";

shifts = [
	//1:
	"Ruokailuvuoro 1",
	//2:
	"Ruokailuvuoro 2",
	//3:
	"Ruokailuvuoro 3"
];


http.createServer((req, res) =>
{
	let q = url.parse(req.url, true); //true?
	let path = "." + q.pathname;
	if (path == "./")
		path = "./index.html";

	console.log(path);

	if (!allowedPaths.includes(path))
		path = path404;

	switch(path)
	{
		case mainPage:
			buildMain(q.query, path).then(
				(data) =>
				{
					res.write(data);
					res.end();
				}
			);
			break;
		case path404:
			build404(path, q.pathname).then(
				data =>
				{
					res.write(data);
					res.end();
				}
			);
			break;
		default:
			buildDefault(path).then(
				data =>
				{
					res.write(data);
					res.end();
				}
			);
	}
}).listen(8080)

function openFile(path)
{
	return new Promise((resolve, reject) =>
	{
		fs.readFile(path, (err, data) =>
		{
			if (err)
				reject(err);
			resolve(data);
			return data;
		})
	});
}

function buildMain(query, path)
{
	return new Promise((resolve, reject) =>
	{
		openFile(path).then(
			data =>
			{
				data_string = data.toString("utf-8");
				if (query.index === undefined)
					resolve(data_string.replace("\\(result\\)", ""));
				resolve(data_string.replace("\\(result\\)", shifts[parseshift(query) - 1]));
			}
		);
	});
}


function build404(path, attemptpath)
{
	return new Promise((resolve, reject) =>
	{
		openFile(path).then(
			data =>
			{
				data_string = data.toString("utf-8");
				resolve(data_string.replace("\\(path\\)", attemptpath));
			}
		);
	});
}

function buildDefault(path)
{
	return new Promise((resolve, reject) =>
	{
		openFile(path).then(
			data =>
			{
				resolve(data.toString("utf-8"));
			}
		);
	});
}

function parseshift(index)
{
	//get index type
	is_teacher = isNaN(parseInt(index[index.length - 1]));
	is_course = !is_teacher;
	//read shiftfile
	openFile("shifts.txt").then(
		data =>  {}
	);
	//iterate over lines, search for day
	//iterate shifts for course / teacher
	//return the shift number
	return 1;
}

function getCharAmount(s, c)
{
	let n = 0;
	for (let c_i = 0; c_i < s.length; c_i++)
	{
		n += +(s[c_i] === c);
	}
	return n;
}
