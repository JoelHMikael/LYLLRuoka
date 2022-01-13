

// String searching
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

// Normalizing
function parseCluttered(s)
{
	if (!(typeof s === "string"))
		return "";
	return s.replaceAll(".", "").replaceAll(" ", "").toUpperCase();
}

// Class parsing
async function writeClasses(classData, DB)
{
	classData = parseCluttered(classData) + "\n"; // newline so that loop can find last value
	await DB.query_raw("DELETE FROM classes");
	// parse data to dict
	let i = 0;
	while (i < classData.length)
	{
		let separator = getNextChar(classData, ":", i);
		if (separator === -1)
			break;
		let lineEnd = getNextChar(classData, "\n", i);
		let key = classData.substring(i, separator);
		let val = classData.substring(separator + 1, lineEnd);
		i = lineEnd + 1;
		let res = await DB.execute("INSERT INTO classes VALUES (?, ?)", [key, val]);
	}
}

async function parseLine(data, day, shift, DB)
{
	// "preprocessing"
	let i = 0;
	let courses = [];
	let teachers = [];
	const toRemove = " ja KAHDEN TUTKINNON OPINNOT 1., 2. ja 3. VUOSITASON RYHMÄT ";
	if (data.substring(data.length - toRemove.length, data.length) === toRemove)
		data = data.substring(0, data.length - toRemove.length);
	data = data.replaceAll(",", "").replaceAll("ja ", "").replaceAll(" + ", "+");

	while (i < data.length)
	{
		if (data[i] === "+")
		{

			nextSpace = getNextChar(data, " ", i);
			let nextNextSpace = getNextChar(data, " ", nextSpace + 1);
			if (nextNextSpace === -1)
				nextNextSpace = data.length;
			data = `${data.substring(0, i)} ${data.substring(nextSpace + 1, nextNextSpace)} ${data.substring(i + 1, data.length)}`;
			i = nextNextSpace - 1;
		}
		i++;
	}
	nextSpace = 0;
	i = 0;

	const getElement = list =>
	{
		nextSpace = getNextChar(data, " ", i);
		if (nextSpace === -1)
			nextSpace = data.length;
		list.push(data.substring(i, nextSpace));
		i = nextSpace + 1;
	}

	do
	{
		getElement(courses);
		getElement(teachers);
	} while (i < data.length)

	let values = "VALUES";
	for(let el = 0; el < courses.length; el++)
	{
		values += ` ROW(${day}, ${shift}, '${courses[el]}', '${teachers[el]}', NULL),`;
	}
	values = values.substring(0, values.length - 1);
	return DB.execute(`INSERT INTO shifts ${values}`, []);
}

async function parseDay(data, day, DB)
{
	let i = getToLineStartingWith(data, "RUOKAILUVUORO");
	let indexOfShift = 1;
	while (i !== -1)
	{
		let endOfLine = getNextChar(data, "\n", i);
		// Insert the food shift name
		let shiftName = DB.execute("INSERT INTO shiftnames VALUES (?, ?, ?)", [day, indexOfShift, data.substring(i, endOfLine)]);
		// get to the teachers & courses
		i = endOfLine + 1;
		i = getNextChar(data, "\n", i) + 1;
		if (getNextChar(data, "\n", i) === -1)
			endOfLine = data.length;
		else
			endOfLine = getNextChar(data, "\n", i);
		let unparsedIndexes = data.substring(i, endOfLine);

		// do the magic
		let lineParse = parseLine(unparsedIndexes, day, indexOfShift, DB);

		i = getToLineStartingWith(data, "RUOKAILUVUORO", i);
		indexOfShift++;
		await Promise.all([shiftName, lineParse]);
	}
	return 0;
}

async function writeShifts(data, DB)
{
	weekdays = ["MAANANTAI", "TIISTAI", "KESKIVIIKKO", "TORSTAI", "PERJANTAI"];
	let deletions = Promise.all([
		DB.query_raw("DELETE FROM shifts"),
		DB.query_raw("DELETE FROM shiftnames")
	]);

	// iterate over the weekdays
	let i = 0;
	for (let day = 0; day < weekdays.length; day++)
	{
		// find the start of the shifts of the day
		i = getNextChar(data, "\n", findExpression(data, weekdays[day], i)) + 1;

		// find the end of the shifts of the day
		let end = [
			data.length,
			findExpression(data, weekdays[day + 1], i)
		][+(day !== weekdays.length - 1)];

		await deletions; // wait for deletion to get completed before proceeding to write new data to the table

		// do the magic:
		let shifts = data.substring(i, end);
		await parseDay(shifts, day, DB);

		i = end;
	}

	const courses = await DB.query_raw("SELECT * FROM classes");
	const results = [];
	for (let course = 0; course < courses.length; course++)
	{
		results.push(DB.query("UPDATE shifts SET class = ? WHERE course = ?", [courses[course].class, courses[course].course]));
	}
	await Promise.all(results);
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
	if (/^\w\d{3}$/.test(index))
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
exports.find = findExpression;
exports.getNextChar = getNextChar;
exports.classes = writeClasses;
exports.build = writeShifts;
exports.get = getShift;
exports.randomIndex = getRandomIndex;
