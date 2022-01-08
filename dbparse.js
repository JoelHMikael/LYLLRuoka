

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
/*
function parseShift(data, weekdays = ["MAANANTAISIN", "TIISTAISIN", "KESKIVIIKKOISIN", "TORSTAISIN", "PERJANTAISIN"])
{
	
	let i = 0;
	let db = [];
	while (db.length < weekdays.length)
	{
		let day = [];
		
		i = getNextChar(data, "\n", findExpression(data, weekdays[db.length]));
		let end;
		if (db.length === weekdays.length - 1)
			end = data.length;
		else
			end = findExpression(data, weekdays[db.length + 1]);
		let unparsedDay = data.substring(i + 1, end);
		day = parseDay(unparsedDay);

		db.push(day);
	}
	return db;
}

function parseDay(day)
{
	let shifts = {};
	let i = getToLineStartingWith(day, "RUOKAILUVUORO");
	do
	{
		let endOfLine = getNextChar(day, "\n", i);
		let shiftDesc = day.substring(i, endOfLine);
		i = getNextChar(day, "\n", i) + 1;
		i = getNextChar(day, "\n", i) + 1;
		if (getNextChar(day, "\n", i) === -1)
			endOfLine = day.length;
		else
			endOfLine = getNextChar(day, "\n", i);
		let unparsedIndexes = day.substring(i, endOfLine);
		shifts[shiftDesc] = parseLine(unparsedIndexes);
		i = getToLineStartingWith(day, "RUOKAILUVUORO", i);
	} while (i !== -1);
	return shifts;
}
function parseLine(line, toRemove = " ja KAHDEN TUTKINNON OPINNOT 1., 2. ja 3. VUOSITASON RYHMÄT ")
{
	let i = 0;
	let courses = [];
	let teachers = [];
	// get to the teachers & courses
	let nextSpace = 0;

	if (line.substring(line.length - toRemove.length, line.length) === toRemove)
		line = line.substring(0, line.length - toRemove.length);
	line = line.replaceAll(",", "").replaceAll("ja ", "").replaceAll(" + ", "+");

	while (i < line.length)
	{
		if (line[i] === "+")
		{

			nextSpace = getNextChar(line, " ", i);
			let nextNextSpace = getNextChar(line, " ", nextSpace + 1);
			if (nextNextSpace === -1)
				nextNextSpace = line.length;
			line = `${line.substring(0, i)} ${line.substring(nextSpace + 1, nextNextSpace)} ${line.substring(i + 1, line.length)}`;
			i = nextNextSpace - 1;
		}
		i++;
	}
	nextSpace = 0;
	i = 0;

	const getElement = list =>
	{
		nextSpace = getNextChar(line, " ", i);
		if (nextSpace === -1)
			nextSpace = line.length;
		list.push(line.substring(i, nextSpace));
		i = nextSpace + 1;
	}

	do
	{
		getElement(courses);
		getElement(teachers);
	} while (i < line.length)

	return [courses, teachers];
}

*/
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
	weekdays = ["MAANANTAISIN", "TIISTAISIN", "KESKIVIIKKOISIN", "TORSTAISIN", "PERJANTAISIN"];
	let deletions = Promise.all([
		DB.query_raw("DELETE FROM shifts"),
		DB.query_raw("DELETE FROM shiftnames")
	]);

	// iterate over the weekdays
	let i = 0;
	for (let day = 0; day < weekdays.length; day++)
	{
		// find the start of the shifts of the day
		i = getNextChar(data, "\n", findExpression(data, weekdays[day], i));

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
	return 0;
}

/*
function getIndexType(index)
{
	if (/^[A-Za-zåäöÅÄÖ]{2,3}\d{2,3}$/.test(index))
		return "course";
	if (/^[A-Za-zåäöÅÄÖ]{4}$/.test(index))
		return "teacher";
	if (/^\w\d{3}$/.test(index))
		return "class";
}

function getShift(day, index, db) // day: int, 1 = monday; index: string of course/teacher; db: parsed shifts
{
	if ((typeof day !== "number") || isNaN(day) || (typeof index !== "string"))
		return -1;

	let shifts = db[day - 1];

	let _endOfIndex = parseInt(index.substring(2, 4));
	let type = getIndexType(index);
	if (type === undefined)
		return {};
	let type_index = +(type === "teacher") + (+(type === "class") * 2);

	let res = {};
	for (const [key, val] of Object.entries(shifts))
	{
		let indexes = val[type_index];
		for (let i = 0; i < indexes.length; i++)
		{
			if (indexes[i] === index)
				res[key] = [val[0][i], val[1][i], val[2][i]];
		}
	}
	return res;
}

function randInt(start, stop)
{
	return start + Math.floor(Math.random() * (stop - start));
}

function getIndexes(db, day, shift, type)
{
	let d = db[day];
	let sh = Object.values(d)[shift][type];
	return Object.values(db[day])[shift][type];
}

function getRandomIndex(db, day = randInt(0, 5), shift = randInt(0, 3), type = randInt(0, 3))
{
	let el;
	let i = 0;
	let indexes = getIndexes(db, day, shift, type);
	while ((el === undefined) && (i < indexes.length))
	{
		el = indexes[i];
		i++;
	}
	if (el == undefined)
		return getRandomIndex(db);
	return el;
}

exports.build	= parseShift;
exports.indexType = getIndexType;
exports.classes = parseClasses;
exports.get 	= getShift;
exports.cluttered = parseCluttered;
exports.find = findExpression;
exports.getNextChar = getNextChar;
exports.randomIndex = getRandomIndex;*/

exports.classes = writeClasses;
exports.build = writeShifts;
