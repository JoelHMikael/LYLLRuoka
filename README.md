# Food-app
Readme coming soon!

## Setup
You will need a SSL certificate if you want to use https.
You need to install node.js and MySQL (+ npm install mysql2).
You will need to update the server with the help of the food shift message and a tab separated list of classes (just copypaste from excel from the Kurssitarjotin)
You probably want to set up cron to run some cronjobs from crontab_add.txt.
You need to provide the login info to the MySQL DB in ../dblogin.txt. Logging in as root was found problematic on Mint, but feel free to try if you want to.
You should create the following tables, because the server code wont do it for you.

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
