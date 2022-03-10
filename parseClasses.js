const open = require("./Functions/open.js");
const parse = require("./dbparse.js");
const fs = require("fs");
const readline = require("readline");
const stream = require("stream");
const getIndexType = require("./dbparse.js").indexType;

// What a mess.
async function parseClassData(path, DB)
{
	const separator = "\t";

	const inStream = fs.createReadStream(path)
	const outStream = new stream();
	const rl = readline.createInterface(inStream, outStream);

	let lineNum = 0;
	let courses = [];
	rl.on("line", line =>
	{
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
	});
    rl.on("close", () =>
    {
        return 0;
    });
}

function addToDBFromLists(DB, l1, l2, l1cond, l2cond)
{
	for (let i = 0; i < l1.length; i++)
	{
        if (l1cond(l1[i]) && l2cond(l2[i]))
            DB.execute("INSERT IGNORE INTO classes VALUES (?, ?)", [l1[i], l2[i]]);
	}
}

async function parseClasses(DB, ...paths)
{
    let parsed = [];
    await DB.query_raw("DELETE FROM classes");
    for(const path of paths)
        parsed.push(parseClassData(path, DB))
    return await Promise.all(parsed);
}

exports.classes = parseClasses;