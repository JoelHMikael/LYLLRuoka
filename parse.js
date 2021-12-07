/*let i = 0;
	let foodShiftNames = [];
	let db = []; // first level array: days - second level array: shifts - third level dict: course/teacher - fourth level array: indexes
	while (db.length < weekdays.length)
	{
		i = findExpression(data, weekdays[db.length], i);
		let end = i;
		if (db.length === weekdays.length)
			end = data.length;
		else
			end = findExpression(data, weekdays[db.length + 1], i + 1);
		
		db.push([]); // add the day
		let shifts = 0;

		do
		{
			let teachers = [];
			let courses = [];
			i = findExpression(data, "RUOKAILUVUORO", i);
			let nextLineStart = getNextChar(data, i, "\n");
			foodShiftNames.push(data.substring(i, nextLineStart));
			db[db.length - 1].push([]); // add the food shift
			nextLineStart = getNextChar(data, nextLineStart + 1, "\n");
			while (!((nextLineStart - i) > 2))
			{
				i = nextLineStart;
				nextLineStart = getNextChar(data, i + 1, "\n");
			}
			let parsedLine = data.substring(i, nextLineStart).replaceAll(",", "").replaceAll("ja ", "");
			let parse_i = 0;
			let nextSpace = getNextChar(parsedLine, parse_i, " ");
			while (parse_i !== -1)
			{
				courses.push(parsedLine.substring(parse_i, nextSpace));
				parse_i = nextSpace + 1;
				nextSpace = getNextChar(parsedLine, parse_i, " ");
				teachers.push(parsedLine.substring(parse_i, nextSpace));
				parse_i = nextSpace + 1;
				nextSpace = getNextChar(parsedLine, parse_i, " ");
			}
			i = nextLineStart;
			db[db.length - 1][shifts][0] = courses;
			db[db.length - 1][shifts][1] = teachers;
			shifts++;
		} while ((i < end) && (i !== -1))

		i = getNextChar("\n");
	}
	return [db, foodShiftNames];*/

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
	if (!(Number.isInteger(start) && (start >= 0)))
		throw new TypeError("Start must be a positive integer!");
	while ((data.substring(start, start + expr.length) !== expr) && (start + expr.length < data.length))
		start++;
	if (data.substring(start, start + expr.length) !== expr)
		return -1;
	return start;
}

function parseLine(line, toRemove = " ja KAHDEN TUTKINNON OPINNOT 1., 2. ja 3. VUOSITASON RYHMÄT ")
{
	let i = 0;
	let courses = [];
	let teachers = [];
	let nextSpace = 0;

	if (line.substring(line.length - toRemove.length, line.length) === toRemove)
		line = line.substring(0, line.length - toRemove.length);
	line = line.replaceAll(",", "").replaceAll("ja ", "");

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

/*
 * DB structure:
 * list
 * WEEKDAY - list
 * 	FOOD SHIFTS - dict
 * 		COURSE INDEXES - list
 * 		TEACHER INDEXES - list
 */

function getShift(day, index, db) // day: int, 1 = monday; index: string of course/teacher; db: parsed shifts
{
	if ((typeof day !== "number") || isNaN(day) || (typeof index !== "string"))
		return -1;

	let shifts = db[day - 1];

	let _endOfIndex = parseInt(index.substring(2, 4));
	let is_teacher = _endOfIndex.toString() !== index.substring(2, 4);
	let is_course = !is_teacher;

	for (const [key, val] of Object.entries(shifts))
	{
		let indexes = val[+is_teacher];
		for (let i = 0; i < indexes.length; i++)
		{
			if (indexes[i] === index)
				return key;
		}
	}
	return -1;
}

exports.build	= parseShift;
exports.get 	= getShift;
