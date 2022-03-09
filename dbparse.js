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

function weekdayToNumber(s)
{
	const weekdays = [
		/ma.*/i,
		/ti.*/i,
		/ke.*/i,
		/to.*/i,
		/pe.*/i,
		/la.*/i,
		/su.*/i
	];
	for(let day = 0; day < weekdays.length; day++)
	{
		if (s.match(weekdays[day]))
			return day;
	}
}

async function writeShifts(data, DB)
{
	let deletions = await Promise.all([
		DB.query_raw("DELETE FROM shifts"),
		DB.query_raw("DELETE FROM shiftnames")
	]);

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
	const courseRegex = /(?:[a-ö]{2,3}\d{2,3} ?\+? ?)+ [a-ö]{4}/gi;
	const courses = courseLine.matchAll(courseRegex);
	for(const course of courses)
	{
		const _lastSpace = course[0].lastIndexOf(" ");
		const courseNames = course[0].substring(0, _lastSpace).split(/ ?\+ ?/);
		const teacherName = course[0].substring(_lastSpace + 1);

		// For loop is needed, because some courses are marked like KE16+KE26 MATI
		async function handleCourse(courseName, teacherName)
		{
			let className = await DB.execute(
				"SELECT class FROM classes WHERE course=?",
				[courseName]
			);
			className = className[0];
			if (className !== undefined)
				className = className.class;
			else
				className = null;

			dbOperations.push(DB.execute(
				`INSERT INTO shifts VALUES (${weekday}, ${shiftId}, ?, ?, ?)`,
				[courseName, teacherName, className]
			));
		}
		for(const courseName of courseNames)
		{
			dbOperations.push(handleCourse(courseName, teacherName));
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

async function getRandomIndex(day, DB)
{
	let indexes = await DB.execute("SELECT course, teacher, class FROM shifts WHERE day = ? ORDER BY RAND() LIMIT 1", [day]);
	indexes = Object.values(indexes[0]);
	let start = randInt(0, indexes.length);
	for (let test = 0; test < 3; test++)
	{
		let i = (start + test) % indexes.length;
		if (indexes[i] !== null)
			return indexes[i];
	}
	console.log("Warning: row without class/teacher/course in database!");
	return getRandomIndex(day, DB);
}


exports.indexType = getIndexType;
exports.cluttered = parseCluttered;
exports.build = writeShifts;
exports.get = getShift;
exports.randomIndex = getRandomIndex;
exports.find = findExpression;
exports.getNextChar = getNextChar;