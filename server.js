const http	= require("http");
const fs	= require("fs");
const url	= require("url");

let maxshifts = Infinity;

function init()
{
	const mainPage = "./index.html";
	const allowedPaths = [mainPage, "./index.css"];
	const path404 = "./404/index.html";

	const weekdays = [undefined, "MAANANTAI", "TIISTAI", "KESKIVIIKKO", "TORSTAI", "PERJANTAI", undefined];

	shifts = [
		//1:
		"Ruokailuvuoro 1",
		//2:
		"Ruokailuvuoro 2",
		//3:
		"Ruokailuvuoro 3"
	];

	/*openFile("shifts.txt").then(data =>
	{
		let shifts = 0;
		let i = 0;
		do
		{
			i = getToLineStartingWith(data.toString("utf-8"), i + 1, "RUOKAILUVUORO");
			shifts++;
		} while (i !== -1)
		maxshifts = shifts / 5; // 5 = number of days
	});*/
	function server(req, res)
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
				buildMain(q.query, path, maxshifts).then(
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
	}

	http.createServer(server).listen(8080);
}

function server(req, res)
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
			buildMain(q.query, path, maxshifts).then(
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
			return data;
		})
	});
}

function buildMain(query, path, maxshifts)
{
	return new Promise((resolve, reject) =>
	{
		openFile(path).then(
			data =>
			{
				data_string = data.toString("utf-8");
				if (query.index === undefined)
					resolve(data_string.replace("\\(result\\)", ""));
				resolve(data_string.replace("\\(result\\)", shifts[parseshift(query, maxshifts) - 1]));
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

function parseshift(index, maxshifts)
{
	/*//get index type
	let is_teacher = isNaN(parseInt(index[index.length - 1]));
	let is_course = !is_teacher;

	//get day of week
	const d = new Date();
	let day = weekdays[d.getDay()];
	if (day === undefined)
		day = weekdays[1];

	//read shiftfile
	openFile("shifts.txt").then(
		data =>
		{
			data = data.toString("utf-8");
			// get to the position of the day
			let i = getToLineStartingWith(data, 0, day);
			if (i === -1)
				return -1;

			// iterate through shifts
			let shift = "";
			let shifts = 0;
			while (shifts < maxshifts) // infinite loop if maxshift is infinity, FIX!
			{
				i = getToLineStartingWith(data, i, "RUOKAILUVUORO");
				let nextLineStart = getNextChar(data, i, "\n");
				shift = data.substring(i, nextLineStart);

				// Get to the line with the teachers & courses
				i = nextLineStart;
				while (!((nextLineStart - i) > 2))
				{
					i = nextLineStart;
					nextLineStart = getNextChar(data, i + 1, "\n");
				}
				i++;
				// Find whether the course is in the line or not
				let parsed_line = data.substring(i + 1, nextLineStart).replaceAll(",", "");
				if (findExpression(parsed_line, index, i) !== -1)
					return shift;
				shifts++;
			}
			return -1;
		}
	);
	//iterate over lines, search for day
	//iterate shifts for course / teacher
	//return the shift number*/
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

function getNextChar(s, i, c)
{
	for (; i < s.length; i++)
	{
		if (s[i] === c)
			return i;
	}
	return -1;
}

function getToLineStartingWith(s, start, ss)
{
	let i = start;
	do
	{
		if (s.substr(i, ss.length) === ss)
			break;
		i = getNextChar(s, i, "\n") + 1;
	} while(i !== -1)
	
	if (i === -1)
		return -1;
	return i;

}

function findExpression(data, expr, start = 0)
{
    if (Number.isInteger(start) && (start < 0))
        throw new TypeError("Start must be a positive integer!");
    while ((data.substr(start, expr.length) !== expr) && (start + expr.length < data.length))
        start++;
    if (data.substr(start, expr.length) !== expr)
        return -1;
    return start;
}

init();
