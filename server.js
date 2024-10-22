const https	= require("https");
const http	= require("http");
const url	= require("url");
const food	= require("./food.js");
const fs        = require("node:fs/promises");
const SQL_DBS	= require("./database.js");
const DBPARSE	= require("./dbparse.js");
const open	= require("./Functions/open.js");
const strFuncs	= require("./Functions/stringFuncs.js");
const dateFuncs	= require("./Functions/dateFuncs.js");
const updateDB  = require("./update.js");
const { pbkdf2 } = require("./Functions/pbkdf2promise.js");

const SHIFTPATH = "../Updation/shifts.txt";
const CLASSPATH = "../Updation/classes.txt";
const EXCEPTIONPATH = "../Updation/exceptions.txt";
const PASSPATH = "../password-hashes.txt";

async function init()
{
	const build = {
		"./Cont/index.html": buildMain,
		"./Cont/index.css": buildDefault,
		"./Cont/panel/index.html": buildPanel,
		"./Cont/devs/index.html": buildDevs,
		"./Cont/devs/index.css": buildDefault,
		"./Cont/404/index.css": buildDefault,
		"./Cont/non-main.css": buildDefault,
		"./Cont/Images/help.png": buildImage,
		"./Cont/Images/back.png": buildImage,
		"./Cont/Images/favicon.ico": buildImage,
	};
	const errorPath = "./Cont/404/index.html";

	const startDate = new Date();
	let visitorCount = 0;

	// await for needed things in async
	let [dbcredentials, httpsKey, httpsCert] = await Promise.all([
		open.file("../dblogin.txt"),
		open.file("../Certificate/key.pem"),
		open.file("../Certificate/cert.pem")
	]);


	// https options, you need to get a certificate in the file ../Certificate for the server to work
	const httpsOpts = {
		key: httpsKey,
		cert: httpsCert
	};
  
	// get the MySQL DB connection
	const SQLDB = new SQL_DBS.Database(JSON.parse(dbcredentials));

	// Update...
	// ...shifts and classes
	await updateDB.update(SQLDB, SHIFTPATH, CLASSPATH, EXCEPTIONPATH);
	// ...foods
	dateFuncs.run_at_monday_mornings(() => food.build(SQLDB));
	if ((new Date()).getDay() !== 1) // update if it's not monday. if it's monday, it has already been run by the scheduler above.
		await food.build(SQLDB);
	// server code
	async function server(req, res)
	{
		visitorCount++;

		// Updation panel
		if (req.method === "POST") {
			let data = "";
			req.on("data", chunk => {
				data += chunk;
				if (data.length > 1e6) {
					res.writeHead(413);
					res.end("Liian pitkä pyyntö");
					req.connection.destroy();
				}
			});
			req.on("end", async function updateandrespond() {
				let q = new URLSearchParams(data);
				let shifts = "";
				let classes = "";
				let exceptions = "";
				let suppliedPassword = "";
				try {
					shifts = decodeURIComponent(q.get("shifts")).replaceAll('\r\n', '\n');
					classes = decodeURIComponent(q.get("classes")).replaceAll('\r\n', '\n');
					exceptions = decodeURIComponent(q.get('exceptions')).replaceAll('\r\n', '\n');
					suppliedPassword = decodeURIComponent(q.get('password'));
				} catch {
					console.log("Malformed url, presumably");
					res.writeHead(400);
					const cont = await buildCustomMessage("400: Virheellinen pyyntö", "Pyyntö sisälsi todennäköisesti merkkikoodeja, jotka eivät viittaa mihinkään olemassaolevaan merkkiin.");
					res.end(cont);
					return;
				}
				if (shifts === null || classes === null || exceptions === null || suppliedPassword === null) {
					res.writeHead(400);
					const cont = await buildCustomMessage("400: Virheellinen pyyntö", "Kaikkia tietoja ei löytynyt pyynnöstä");
					res.end(cont);
					return;
				}

				
				let suppliedPassHash = await pbkdf2(
					suppliedPassword,
					'salts protect from dictionary attacks, but we will have ~1 password.',
					10000,
					64,
					'sha512',
				);
				suppliedPassHash = suppliedPassHash.toString('hex');
				//console.log(suppliedPassHash); // will be used to retrieve the password, because there's no way to register
				let passHashes = await open.file(PASSPATH);
				passHashes = passHashes.toString('utf-8').split("\n");
				let match = false;
				for(let hash of passHashes) {
					if (suppliedPassHash === hash) {
						match = true;
						break;
					}
				}
				if (!match) {
					res.writeHead(401);
					const cont = await buildCustomMessage("401: Virheellinen salasana", "");
					res.end(cont);
					return;
				}

				let tmpshiftfile = await fs.open(`${SHIFTPATH}.tmp`, "w");
				await tmpshiftfile.write(shifts);
				tmpshiftfile.close();

				let tmpclassfile = await fs.open(`${CLASSPATH}.tmp`, "w");
				await tmpclassfile.write(classes)
				tmpclassfile.close();

				let tmpexceptionfile = await fs.open(`${EXCEPTIONPATH}.tmp`, "w");
				await tmpexceptionfile.write(exceptions);
				tmpexceptionfile.close();

				try {
					await updateDB.update(SQLDB, `${SHIFTPATH}.tmp`, `${CLASSPATH}.tmp`, `${EXCEPTIONPATH}.tmp`);
					await Promise.all([
						fs.rename(`${SHIFTPATH}.tmp`, SHIFTPATH),
						fs.rename(`${CLASSPATH}.tmp`, CLASSPATH),
						fs.rename(`${EXCEPTIONPATH}.tmp`, EXCEPTIONPATH)
					]);
					res.writeHead(200);
					const cont = await buildCustomMessage("Kiitos!", "Päivitysprosessi näyttää onnistuneen.");
					res.end(cont);
				} catch(e) {
					console.log(e);
					res.writeHead(400);
					let header = 'Päivityksessä tapahtui virhe';
					let message = e.message;
					let s = e.message.split(': ');
					if (s.length === 2) {
						header = s[0];
						message = s[1];
					}
					const cont = await buildCustomMessage(header, message);
					res.end(cont);
					await updateDB.update(SQLDB, SHIFTPATH, CLASSPATH, EXCEPTIONPATH);
					return;
				}
			});
			return;
		}

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
			"sqldb": SQLDB
		};

		// build the page
		const buildFound = +(typeof build[path] === "function");
		res.writeHead([404, 200][buildFound]);
		data = await [build404, build[path]][buildFound](args);
		res.write(data);
		res.end();
	}

	// start servers
	const httpsServer = https.createServer(httpsOpts, server).listen(443);
	const httpServer = http.createServer(server).listen(80);
	console.log("Servers Up And Running!")
	
	// stop server
	async function closeServers() {

		console.log("Updating stats to DB...")
        const uptime = Math.ceil((((new Date()).getTime() - startDate.getTime()) / 1000) / (24 * 60 * 60));
		const monthOfStart = `${startDate.getMonth() + 1}`.padStart(2, "0");
		const monthDayOfStart = `${startDate.getDate()}`.padStart(2, "0");
		try {
			await SQLDB.query("INSERT INTO stats VALUES (?, ?, ?, ?)", [
				`${startDate.getFullYear()}-${monthOfStart}-${monthDayOfStart}`,
				uptime,
				visitorCount,
				Math.round(visitorCount / uptime)
			]);
		} catch(e) {
			console.log(`\nERROR! Probably because updating the statistics several times a day is not supported, at least yet. Here's the error:\n${e}\n`);
		}
		console.log("Done. Shutting down...");

		await SQLDB.close();
        console.log("MySQL connection closed");
		httpsServer.close();
		httpServer.close();
        console.log("Servers shut down");
        console.log("Process exiting...");
        process.exit(0);
	}
	process.on("SIGINT", closeServers);
	process.on("SIGQUIT", closeServers);
	process.on("SIGTERM", closeServers);
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
	// get the passed arguments
	const path = args["path"];
	const query = args["query"];
	const index = query.index;
	const SQLDB = args["sqldb"];
	const data = await open.file(path);
	let data_string = data.toString("utf-8");

	// here are the things to replace in the html page
	let res = {};

	// get valid day
	const d = new Date();
	let day = d.getDay();
	day = (day + +(day === 0) * 7) - 1; // converts from 0 = sunday to 0 = monday
	const actualDay = day;
	day = +(!(day === 5) && !(day === 6)) * day; // resets day to monday if saturday or sunday
	if ((typeof query.day === "string") && (parseInt(query.day).toString() === query.day) && (!isNaN(parseInt(query.day))) && (parseInt(query.day) >= 0) && (parseInt(query.day) < 5))
		day = parseInt(query.day);
	// set the day selected (must be done manually with this replacement system)
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
		// shift looks like the following: (useful info for debugging. this is really obscure without any information about how this variable looks like.)
		/*[    
		  {    
		    name: 'RUOKAILUVUORO I: ruokailu klo 10.50 – 11.20, oppitunti klo 11.30 – 12.50'    
		  },    
		  [ { course: 'OPO15', teacher: null, class: null } ]    
		]*/
		if (shift !== undefined)
		{
			res["shift"] = shift[0].name;
			res["shift-header"] = "";
			for (let i = 0; i < shift[1].length; i++)
			{
				res["shift-header"] += `${shift[1][i].course}`;
				if (shift[1][i].teacher !== null)
					res["shift-header"] += `/${shift[1][i].teacher}`;
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

	// Show message if the normal schedule isn't in place
	const exceptionInfo = await SQLDB.query("SELECT * FROM exceptions");
	let messages = '';
	for(let week = 0; week < exceptionInfo.length; week++)
	{
		// get the date of the requested day
		const nextDate = new Date(
			d.getFullYear(),
			d.getMonth(),
			d.getDate() + day - actualDay + (day < actualDay)*7
		);

		if (dateFuncs.between(
			nextDate,
			new Date(exceptionInfo[week].start),
			new Date(exceptionInfo[week].end)
		))
		{
			messages = `<div class="shift-result float-block"><h2>${exceptionInfo[week].header}</h2>${(exceptionInfo[week].message.length > 0) ? '<br>' : ''}${exceptionInfo[week].message}</div>\n<br>\n` + messages;
		}
	}
	data_string = strFuncs.replaceElement(data_string, "div id=\"shift-result\" class=\"float-block\"", messages);

	// get the example input
	res["example-input"] = await DBPARSE.randomIndex(day, SQLDB);
	if (res["example-input"] === null)
		res["example-input"] = "";

	// get the day
	let weekdays = ["ma", "ti", "ke", "to", "pe", "la", "su"];
	res["day"] = weekdays[day];
	if (res["shift"] === "")
		data_string = data_string.replace('<div id="shift-result" class="float-block">', '<div id="shift-result" class="float-block" style="display: none;">');
	
	// get the food
	const week = +(day < actualDay) + 1; // Week = 1 if day is not past
	const [food, vege] = await Promise.all([
		SQLDB.execute(
			"SELECT header, datestring, food FROM foods WHERE week=? AND day=? AND vegetarian=FALSE",
			[week, day]
		),
		SQLDB.execute(
			"SELECT header, datestring, food FROM foods WHERE week=? AND day=? AND vegetarian=TRUE",
			[week, day]
		)
	]);

	if (food[0] !== undefined) {
	    res["food-header"] = `${food[0].header} ${food[0].datestring}`;
	    res["food"] = food[0].food;
	} else {
	    res["food-header"] = `Kouluruoka ${weekdays[day]}`;
	    res["food"] = "Päivän ruoka puuttuu tietokannasta.";
	}
	if ((vege[0] !== undefined) && (vege[0].food !== res["food"]))  {
		res["vege-header"] = vege[0].header;
		res["vege"] = vege[0].food;
	} else {
		res["vege-header"] = "";
		res["vege"] = "";
	}

	data_string = build_replace(data_string, res);

	return data_string;
}

async function buildDevs(args)
{
	const path = args["path"];
	const data = await open.file(path);
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

async function buildCustomMessage(header, message) {
	let data = await open.file("./Cont/custom-message/index.html");
	data = data
		.toString("utf-8")
		.replace("\\(header\\)", header)
		.replace("\\(content\\)", message);
	return data;
}

async function buildPanel(args)
{
	let data = await open.file(args["path"]);
	data = data.toString("utf-8");
	
	let shifts = await open.file(SHIFTPATH);
	shifts = shifts.toString("utf-8");

	let classes = await open.file(CLASSPATH);
	classes = classes.toString("utf-8");

	let exceptions = await open.file(EXCEPTIONPATH);
	exceptions = exceptions.toString("utf-8");
	return build_replace(data, {
		"shifts": shifts,
		"classes": classes,
		"exceptions": exceptions
	});
}

async function build404(args)
{
	args["path"] = args["path"].substring("./Cont".length);
	const data = await open.file(args["path404"]);
	const data_string = data.toString("utf-8");
	return data_string.replace("\\(path\\)", args["path"]);
}

async function buildDefault(args)
{
	const path = args["path"];
	const data = await open.file(path);
	return data.toString("utf-8");
}

async function buildImage(args)
{
	const path = args["path"];
	const data = await open.file(path);
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
