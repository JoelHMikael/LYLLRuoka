const openFile = require("./Functions/open.js").file;
const parseClasses = require("./parseClasses.js").classes;
const parse = require("./dbparse.js");
const updateExceptions = require('./parseExceptions.js').updateExceptions;

// Run this if you want to build the database from text files
async function buildDB(dbconnection, shiftPath, classPath, exceptionPath) {
	let shiftCont = await openFile(shiftPath);
	shiftCont = shiftCont.toString("utf-8");

	let exceptions = await openFile(exceptionPath);
	exceptions = exceptions.toString("utf-8");

	let classes = await openFile(classPath);
	classes = classes.toString('utf-8');

	try {
		await parseClasses(dbconnection, classes);
	} catch (e) {
		throw new Error(`Virhe kurssitarjottimen osassa: ${e.message}`, { cause: e });
	}
	try {
		await parse.build(shiftCont, dbconnection);
	} catch (e) {
		throw new Error(`Virhe ruokailuvuoroissa: ${e.message}`, { cause: e });
	}
	try {
		await updateExceptions(exceptions, dbconnection);
	} catch (e) {
		throw new Error(`Virhe ilmoituksissa: ${e.message}`, { cause: e });
	}

	return 0;
}

exports.update = buildDB;
// Example call:
/*
const openFile = require("./Functions/open.js").file;
const database  = require("./database.js");
const dbcredentials = await openFile("../dblogin.txt");
const DB = new database.Database(JSON.parse(dbcredentials));
await updateDB.update(DB, "./shifts.txt", "./Kurssitarjottimet/2016Classes.txt", "./Kurssitarjottimet/NewClasses.txt");
*/
