const open = require("./Functions/open.js");
const parse = require("./dbparse.js");
const fs = require("fs");
const readline = require("readline");
const stream = require("stream");
const getIndexType = require("./dbparse.js").indexType;

async function parseClassData(classes, DB)
{
	const separator = "\t";

	classes = classes.split('\n');
	let lineNum = 0;
	let courses = [];
	for(let line of classes) {
		let lineList = line.split(separator);

		let type = getIndexType(lineList[0]);
		if (!((type === "class") || (type === "teacher")))
			lineNum = 0;
        
		if (lineNum % 3 === 0)
			courses = lineList;
		if ((lineNum % 3) === 2)
		{
			// Remove the weird "R":s in the end of the classes
			for(let i = 0; i < lineList.length; i++)
			{
				let _s = lineList[i];
				lineList[i] = _s.substring(0, _s.length - 1);
			}
			addToDBFromLists(DB, courses, lineList,
				index => { return getIndexType(index) === "course"; },
				index => { return getIndexType(index) === "class"; }
			);
		}
		lineNum++
	}
	return 0;
}

function addToDBFromLists(DB, l1, l2, l1cond, l2cond)
{
	for (let i = 0; i < l1.length; i++)
	{
        if (l1cond(l1[i]) && l2cond(l2[i]))
            DB.execute("INSERT IGNORE INTO classes VALUES (?, ?)", [l1[i], l2[i]]);
	}
}

async function parseClasses(DB, classes)
{
	await DB.query_raw("DELETE FROM classes");
        return await parseClassData(classes, DB);
}

exports.classes = parseClasses;
