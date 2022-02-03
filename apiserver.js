const https = require("https");
const url	= require("url");
const scrape	= require("./scrape.js");
const db	= require("./database.js");
const parse	= require("./dbparse.js");
const openFile	= require("./open.js").file;
const strFuncs	= require("./funcs/stringFuncs.js");
const dateFuncs	= require("./funcs/dateFuncs.js");

async function init()
{
    // Request handlers
    const handlers = {
        "/api/shifts": getShifts,
        "/api/foods": getFoods,
        "/api/devs": getDevs
    }
    // Get credentials & list of foods
    // Remember to make the foods part of the database.
    const [
        dbCredentials,
        httpsKey,
        httpsCert,
        foodsThisWeek,
        foodsNextWeek,
    ] = await Promise.all([
        openFile("../dblogin.txt"),
        openFile("../Certificate/key.pem"),
        openFile("../Certificate/cert.pem"),
        scrape.food(scrape.link(1)),
        scrape.food(scrape.link(2))
    ]);

    // Connect to database
    const dbCon = new db.Database(JSON.parse(dbCredentials));
    const foods = [foodsThisWeek, foodsNextWeek]; // ...

    // Make httpsOpts object
	const httpsOpts = {
		key: httpsKey,
		cert: httpsCert
	};

    async function server(req, res)
    {
        // ruoka.lyll.fi/api/shifts?index=x&day=y
        // ruoka.lyll.fi/api/foods?day=y
        // ruoka.lyll.fi/api/devs
        const urlStats = getUrlPathAndQuery(req.url);
        const path = urlStats.path;
        const query = urlStats.query;

    }

	const runningServer = https.createServer(httpsOpts, server).listen(8080);
}

// Handler definition
function getShifts(args)
{
    const day = args.query.get("day");
    const index = args.query.get("index");
}

function getFoods(args)
{

}

function getDevs(args)
{

}


// Other functions

function getUrlPathAndQuery(url)
{
    try
    {
        const parsed = new URL(url, "https://127.0.0.1:8080/");
        return {
            path: parsed.pathname,
            query: parsed.searchParams
        };
    }
    catch
    {
        console.log(`Invalid url! ${url}`);
    }
}
init();