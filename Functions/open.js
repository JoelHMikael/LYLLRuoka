const fs = require("fs");
const https = require("https");

function openFile(path)
{
	return new Promise((resolve, reject) =>
	{
		fs.readFile(path, (err, data) =>
		{
			if (err)
				reject(err);
			resolve(data);
		})
	});
}

async function urlOpen(path)
{
	return new Promise((resolve, reject) =>
	{
		let req = https.get(path, res =>
		{
			res.on("data", resolve);
		});
	});
	req.on("error", e =>
	{
		console.error(e);
	});
	req.end();
}


module.exports = {
	file: openFile,
	url: urlOpen
};