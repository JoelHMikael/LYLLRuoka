class Database
{
	constructor(credentials, log)
	{
		this.connection = mysql.createConnection(credentials);
		this.log = log;
	}
	query(q)
	{
		return new Promise((resolve, reject), () =>
		{
			this.connection.query(q, (err, res, fields) =>
			{
				if (err)
				{
					this.log(err);
					reject(err);
				}
				resolve(res);
			});
		});
	}
	close()
	{
		this.connection.end(err =>
		{
			if (err)
			{
				this.log(err);
				reject(err);
			}
			resolve();
		});
	}
}

exports.Database = Database;
