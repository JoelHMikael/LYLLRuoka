const database  = require("./database.js");
const openFile  = require("./Functions/open.js").file;
const parseClasses  = require("./parseClasses.js").classes;
const parse	= require("./dbparse.js");

// Run this if you want to build the database from text files
async function buildDB(shiftfile = "./shifts.txt", classfile = "./classes.txt", dbcredentials)
{
	let shiftCont = await openFile(shiftfile);
	const DB = new database.Database(JSON.parse(dbcredentials));
	shiftCont = shiftCont.toString("utf-8").replaceAll("\r", ""); // \r because of the \r\n newline on windows which creates problems
	await Promise.all([
        parseClasses(classfile[0], classfile[1], DB),
		parse.build(shiftCont, DB)
	]);
	return 0;
}

exports.update = buildDB;
// Example call:
/*
const openFile = require("./Functions/open.js").file;
const dbcredentials = openFile("../dblogin.txt");
await updateDB.update("./shifts.txt", ["./Kurssitarjottimet/2016Classes.txt", "./Kurssitarjottimet/NewClasses.txt"], dbcredentials);
*/