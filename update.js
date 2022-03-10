const database  = require("./database.js");
const openFile  = require("./Functions/open.js").file;
const parseClasses  = require("./parseClasses.js").classes;
const parse	= require("./dbparse.js");

// Run this if you want to build the database from text files
async function buildDB(dbcredentials, shiftPath, ...classfiles)
{
	let shiftCont = await openFile(shiftPath);
	const DB = new database.Database(JSON.parse(dbcredentials));
	shiftCont = shiftCont.toString("utf-8").replaceAll("\r", ""); // \r because of the \r\n newline on windows which creates problems

	await Promise.all([
        parseClasses(DB, ...classfiles),
		parse.build(shiftCont, DB)
	]);
	return 0;
}

exports.update = buildDB;
// Example call:
/*
const openFile = require("./Functions/open.js").file;
const dbcredentials = await openFile("../dblogin.txt");
await updateDB.update(dbcredentials, "./shifts.txt", "./Kurssitarjottimet/2016Classes.txt", "./Kurssitarjottimet/NewClasses.txt");
*/