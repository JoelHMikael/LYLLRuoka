# Food-app
Readme coming soon!

## Setup
If you want to set up the server, you will have to get a SSL certificate or generate one yourself. If you want to run a dedicated server that can update, you also need to add the cron jobs from crontab\_add. You must create a MySQL DB and give its login info in ../dblogin.txt. The database should have the following tables set up:

CREATE TABLE shiftnames (
	day INT,
	id INT,
	name VARCHAR(128) NOT NULL,
	PRIMARY KEY (day, id)
);
CREATE TABLE classes (
	course VARCHAR(6) PRIMARY KEY,
	class VARCHAR(4)
);
CREATE TABLE shifts (
	day INT,
	shift INT,
	course VARCHAR(6),
	teacher VARCHAR(4),
	class VARCHAR(4),
	PRIMARY KEY (day, course)
);
CREATE TABLE devs (
	id INT PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(30) NOT NULL,
	description VARCHAR(128),
	contact VARCHAR(40)
);
