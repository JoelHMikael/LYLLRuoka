const weekdayToNumber = require("./Functions/dateFuncs.js").weekdayToNumber;

function getCharAmount(s, c)
{
	let n = 0;
	for (let c_i = 0; c_i < s.length; c_i++)
	{
		n += +(s[c_i] === c);
	}
	return n;
}
function getNextChar(s, c, i = 0)
{
	if (!(Number.isInteger(i) && (i >= 0)))
		return -1;
	for (; i < s.length; i++)
	{
		if (s[i] === c)
			return i;
	}
	return -1;
}
function getNextLine(s, i)
{
	i = getNextChar(s, "\n", i);
	i += +(i !== -1) * 1;
	return i;
}
function getToLineStartingWith(s, ss, start = 0)
{
	if (!(Number.isInteger(start) && (start >= 0)))
		return -1
	
	let i = start;
	do
	{
		if (s.substring(i, i + ss.length) === ss)
			break;
		i = getNextLine(s, i);
	} while(i !== -1)
	
	return i;
}
function findExpression(data, expr, start = 0)
{
	if (start == -1)
		return -1;
	if (!(Number.isInteger(start) && (start >= 0)))
		throw new TypeError("Start must be a positive integer!");
	if (typeof expr !== "string")
		return -1;
	while ((data.substring(start, start + expr.length) !== expr) && (start + expr.length < data.length))
		start++;
	if (data.substring(start, start + expr.length) !== expr)
		return -1;
	return start;
}


function parseCluttered(s)
{
	if (!(typeof s === "string"))
		return "";
	return s.replaceAll(".", "").replaceAll(" ", "").toUpperCase();
}

async function writeShifts(data, DB)
{
	let deletions = await Promise.all([
		DB.query_raw("DELETE FROM shifts"),
		DB.query_raw("DELETE FROM shiftnames")
	]);

	data = data.replace(/RUOKAILUVUOROT.*/, "");
	const dbOperations = [];
	const shiftRegex = /((?:MAANANTAI|TIISTAI|KESKIVIIKKO|TORSTAI|PERJANTAI)?.*)\s*(RUOKAILU.*)\s*(.*)/gmi;
	const shifts = data.matchAll(shiftRegex);
	let weekday;
	let shiftId = 1;
	for(const shift of shifts)
	{ 
		if (shift[1] !== "")
		{
			weekday = weekdayToNumber(shift[1]);
			shiftId = 1;
		}

		dbOperations.push(
			writeShift(weekday, shiftId, shift[2], shift[3], DB)
		);

		shiftId++;
	}

	await dbOperations;
	return 0;
}

async function writeShift(weekday, shiftId, shiftLine, courseLine, DB)
{
	const dbOperations = [];
	// Shift names
	dbOperations.push(
		DB.execute(
			"INSERT INTO shiftnames VALUE (?, ?, ?)",
			[weekday, shiftId, shiftLine]
		)
	);

	// Shift contents
	const courseRegex = /([A-ZÅÄÖ]{2,3}\d{2,3})(?:\+([A-ZÅÄÖ]{2,3}\d{2,3}))?(?: ([A-ZÅÄÖ]{4}))?/gi;
	const courses = courseLine.matchAll(courseRegex);
	for(const course of courses)
	{
		const courseName1 = course[1];
		const courseName2 = course[2]; // this exists if the course is like MA11+MA12 RIHO
		const teacher = course[3] || null;

		// Get the class
		let className1 = await DB.execute(
			"SELECT class FROM classes WHERE course=?",
			[courseName1]
		);
		className1 = className1[0];
		if (className1 !== undefined)
			className1 = className1.class;
		else
			className1 = null;

		let className2 = undefined;
		if (courseName2 !== undefined) {
			className2 = await DB.execute(
				"SELECT class FROM classes WHERE course=?",
				[courseName2]
			);
			className2 = className2[0];
			if (className2 !== undefined)
				className2 = className2.class;
			else
				className2 = null;
		}

		// Add the info
		dbOperations.push(DB.execute(
			`INSERT IGNORE INTO shifts VALUES (${weekday}, ${shiftId}, ?, ?, ?)`,
			[courseName1, teacher, className1]
		));
		if (courseName2 !== undefined) {
			dbOperations.push(DB.execute(
				`INSERT IGNORE INTO shifts VALUES (${weekday}, ${shiftId}, ?, ?, ?)`,
				[courseName2, teacher, className2]
			));
		}
	}

	await Promise.all(dbOperations);
	return 0;
}
	

async function getShift(day, index, DB)
{
	let shift = DB.execute("SELECT name FROM shiftnames WHERE day = ? and id = (SELECT shift FROM shifts WHERE (day = ?) AND (course = ? OR teacher = ? OR class = ?) LIMIT 1)", [day, day, index, index, index]);
	let additional = DB.execute("SELECT course, teacher, class FROM shifts WHERE (day = ?) AND (course = ? OR teacher = ? OR class = ?)", [day, index, index, index]);
	[shift, additional] = await Promise.all([shift, additional]);
	if (shift.length !== 0)
	{
		shift.push(additional);
		return shift;
	}
	return undefined;
}


function getIndexType(index)
{
	if (/^[A-Za-zåäöÅÄÖ]{2,3}\d{2,3}$/.test(index))
		return "course";
	if (/^[A-Za-zåäöÅÄÖ]{4}$/.test(index))
		return "teacher";
	if (/^\w\d{3}R?$/.test(index))
		return "class";
}

function randInt(start, stop)
{
	return start + Math.floor(Math.random() * (stop - start));
}

async function getRandomIndex(day, DB, depth=0)
{
	if (depth > 10)
		return null;

	let indexes = await DB.execute("SELECT course, teacher, class FROM shifts WHERE day = ? ORDER BY RAND() LIMIT 1", [day]);
	
	indexes = Object.values(indexes[0] || [null, null, null]);
	let start = randInt(0, indexes.length);
	for (let test = 0; test < 3; test++)
	{
		let i = (start + test) % indexes.length;
		if (indexes[i] !== null)
			return indexes[i];
	}
	console.log("Warning: row without class/teacher/course in database!");
	return getRandomIndex(day, DB, depth + 1);
}


exports.indexType = getIndexType;
exports.cluttered = parseCluttered;
exports.build = writeShifts;
exports.get = getShift;
exports.randomIndex = getRandomIndex;
exports.find = findExpression;
exports.getNextChar = getNextChar;
