/*let i = 0;
	let foodShiftNames = [];
	let db = []; // first level array: days - second level array: shifts - third level dict: course/teacher - fourth level array: indexes
	while (db.length < weekdays.length)
	{
		console.log("\nParsing weekday " + weekdays[db.length] + ";");
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
			console.log("Parsing shift " + (shifts + 1) + ";");
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
			console.log(parsedLine);
			let parse_i = 0;
			let nextSpace = getNextChar(parsedLine, parse_i, " ");
			while (parse_i !== -1)
			{
				//console.log("Parsing the courses / teachers.");
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
	line = line.replaceAll(",", "");

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
		console.log(i);
		i = getToLineStartingWith(day, "RUOKAILUVUORO", i);
		console.log(i);
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
		console.log(unparsedDay);
		day = parseDay(unparsedDay);

		db.push(day);
	}
	return db;
}
data = "MAANANTAISIN\n\n \n\nRUOKAILUVUORO I: ruokailu klo 10.50 - 11.30, oppitunti klo 11.40 - 13.00\n\nTE11 JUHO, GE21 PAHO, EA112 ANLE, MA72 JUMA, MA141 SAKO, ÄI82 MIAU, ÄI63 TUTA ja KAHDEN TUTKINNON OPINNOT 1., 2. ja 3. VUOSITASON RYHMÄT \n\n \n\nRUOKAILUVUORO II: ruokailu klo 11.40 - 12.20, oppitunti klo 11.00 - 11.40 ja klo 12.20 - 13.00\n\nGE42 MAME, KE82 SALE, PS53 SATU, MB42 SAHE, YH25 JAJU, RB46 ANSU, MB83 MATI, EA48 VIHU, FD41 MASI ja FI31 TEKE\n\n \n\nRUOKAILUVUORO III: ruokailu klo 12.20 - 13.00, oppitunti klo 11.00 - 12.20\n\nBI14 LAMI, BI12 LAMI, ENA27 SABE, RB37 KAHU, AT12 RIHO, AT13 ESRI, RB62 SASA, KU15 REOJ ja OP16 PIKS\n\n \n\n \n\nTIISTAISIN\n\n \n\nRUOKAILUVUORO I: ruokailu klo 10.50 - 11.20, oppitunti klo 11.30 - 12.50\n\nMA111 MATI, ÄI62 HAPA, KU41 REOJ, MA73 SAKO, PS82 JUNU, RB41 ANSU, BI41 PAHO, UE27 SATU ja RA41 SASA\n\n \n\nRUOKAILUVUORO II: ruokailu klo 11.40 - 12.10, oppitunti klo 11.00 - 11.40 ja klo 12.10 - 12.50\n\nUE13 TEKE, RB44 MAOI, HI31 JUSA, MA142 ESRI, KE81 SALE, PS51 ALMA, TE14 ANSA, TE12 ANSA, BI16 MAME ja BI13 MAME\n\n \n\nRUOKAILUVUORO III: ruokailu klo 12.20 - 12.50, oppitunti klo 11.00 - 12.20\n\nENA25 VIHU, TE17 JUHO, AT11 RIHO, FY12 JUMA, MB84 OLNU, ÄI85 TUTA ja MU41 MAMY\n\n \n\n \n\nKESKIVIIKKOISIN\n\n \n\nRUOKAILUVUORO I: ruokailu klo 10.50 - 11.30, oppitunti klo 11.40 - 13.00\n\nLP91 JUHO, LT91 ANSA, ÄI84 HAPA, AT14 ESRI, AT16 RIHO, GE61 MAME, HI32 HEAH, ÄI44 VETU ja PS52 JSAL\n\n \n\nRUOKAILUVUORO II: ruokailu klo 11.40 - 12.20, oppitunti klo 11.00 - 11.40 ja klo 12.20 - 13.00\n\nMB63 SAHE, UE51 SATU, KE33 SAKO, SC51 SABE, RB35 ANSU, EA46 KAHU, HI27 JAJU, ENA21 MASI ja MA143 MATI\n\n \n\nRUOKAILUVUORO III: ruokailu klo 12.20 - 13.00, oppitunti klo 11.00 - 12.20\n\nRB82 MAOI, KE13 SALE, PS15 ALMA, PS12 ALMA, OPO12 KIIK, OPO17 PIKS, EA51 ANLE ja ÄI61 TUTA\n\n \n\nTORSTAISIN\n\n \n\nRUOKAILUVUORO I: ruokailu klo 10.50 - 11.20, oppitunti klo 11.30 - 12.50\n\nLP22 JUHO, PS71 KAMA, ÄI48 HAPA, ÄI86 VETU, ÄI65 MIAU, MA74 RIHO, YH42 JUSA ja RB72 MAOI\n\n \n\nRUOKAILUVUORO II: ruokailu klo 11.40 - 12.10, oppitunti klo 11.00 - 11.40 ja klo 12.10 - 12.50\n\nMB64 SAHE, ENA24 ANLE, PS17 SATU, GE31 PAHO, SC101 SABE, MB43 JOTO, PC41 VIHU, PD51 VIHU, ENA22 KAHU ja FY72 JUMA\n\n \n\nRUOKAILUVUORO III: ruokailu klo 12.20 - 12.50, oppitunti klo 11.00 - 12.20\n\nFI13 ALMA, HI15 HEAH, HI12 HEAH, KU11 REOJ, LT23 ANSA, MU16 MAMY, MU14 MAMY ja BI23 MAME\n\n \n\nPERJANTAISIN\n\n \n\nRUOKAILUVUORO I: ruokailu klo 10.50 - 11.30, oppitunti klo 11.40 - 13.00\n\nOPO13 KIIK, OPO15 PIKS, ET21 ALMA, RA111 MAOI, RB111 MAOI, TE32 ANSA, FY111 JUMA, PC81 VIHU, TE22 JUHO, ÄI83 MIAU ja ÄI67 VETU\n\n \n\nRUOKAILUVUORO II: ruokailu klo 11.40 - 12.20, oppitunti klo 11.00 - 11.40 ja klo 12.20 - 13.00\n\nRB71 KAHU, AT17 RIHO, MB82 JOTO, MA71 MATI, MB41 ESRI, EA44 ANLE ja HI25 HEAH\n\n \n\nRUOKAILUVUORO III: ruokailu klo 12.20 - 13.00, oppitunti klo 11.00 - 12.20\n\nBI26 PAHO, FI11 JSAL, FI12 JSAL, PS14 TEKE, ENA26 SABE, MU12 MAMY, MU13 MAMY, KE32 SALE ja FD81 MASI";

console.log(parseShift(data));
