const mysql = require("mysql2");

class Database
{
	constructor(credentials)
	{
		this.connection = mysql.createConnection(credentials);
	}
	query(query, values)
	{
		return new Promise((resolve, reject) =>
		{
			this.connection.query(query, values, (err, res, fields) =>
			{
				if (err) reject(err);
				resolve(res);
			});
		});
	}
	execute(query, values)
	{
		return new Promise((resolve, reject) =>
		{
			this.connection.execute(query, values, (err, res, fields) =>
			{
				if (err) reject(err);
				resolve(res);
			});
		});

	}
	query_raw(query)
	{
		return new Promise((resolve, reject) =>
		{
			this.connection.query(query, (err, res, fields) =>
			{
				if (err)
					reject(err)
				resolve(res);
			});
		})
	}
	close()
	{
		return new Promise((resolve, reject) =>
		{
			this.connection.end(err =>
			{
				if (err) reject(err);
				resolve();
			});
		});
	}
}

exports.Database = Database;
