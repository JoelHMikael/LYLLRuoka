const https = require("https");

async function urlOpen(path)
{
	return new Promise(resolve =>
	{
		let req = https.get(path, res =>
		{
			res.on("data", resolve);
		});
		req.on("error", e =>
		{
			console.error(e);
		});
		req.end();
	});
}
