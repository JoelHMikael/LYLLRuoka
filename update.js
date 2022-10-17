const openFile  = require("./Functions/open.js").file;
const parseClasses  = require("./parseClasses.js").classes;
const parse	= require("./dbparse.js");

// Run this if you want to build the database from text files
async function buildDB(dbconnection, shiftPath, ...classfiles)
{
	let shiftCont = await openFile(shiftPath);
	shiftCont = shiftCont.toString("utf-8").replaceAll("\r", ""); // \r because of the \r\n newline on windows which may create problems

	await parseClasses(dbconnection, ...classfiles),
	await parse.build(shiftCont, dbconnection)
	return 0;
}

exports.update = buildDB;
// Example call:
/*
const openFile = require("./Functions/open.js").file;
const database  = require("./database.js");
const dbcredentials = await openFile("../dblogin.txt");
const DB = new database.Database(JSON.parse(dbcredentials));
await updateDB.update(dbcredentials, "./shifts.txt", "./Kurssitarjottimet/2016Classes.txt", "./Kurssitarjottimet/NewClasses.txt");
*/
