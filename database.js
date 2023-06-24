const mysql = require("mysql2");

class Database
{
	constructor(credentials, connectionLimit=8)
	{
		this.pool = mysql.createPool({
			connectionLimit: connectionLimit,
			host: credentials.host,
			user: credentials.user,
			password: credentials.password,
			database: credentials.database
		});
	}
	query(query, values)
	{
		return new Promise((resolve, reject) =>
		{
			this.pool.query(query, values, (err, res, fields) =>
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
			this.pool.getConnection((err, connection) => {
				if (err) reject(err);
				connection.execute(query, values, (err, res, fields) => {
					connection.release();
					if (err) reject(err);
					resolve(res);
				})
			});
		});

	}
	query_raw(query)
	{
		return new Promise((resolve, reject) =>
		{
			this.pool.query(query, (err, res, fields) =>
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
			this.pool.end(err =>
			{
				if (err) reject(err);
				resolve();
			});
		});
	}
}

exports.Database = Database;
