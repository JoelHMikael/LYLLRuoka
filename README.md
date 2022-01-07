# Food-app
Readme coming soon!

## Setup
If you want to set up the server, you will have to get a SSL certificate or generate one yourself. If you want to run a dedicated server that can update, you also need to add the cron jobs from crontab\_add. You must create a MySQL DB and give its login info in ../dblogin.txt. The database should have the following tables set up:

CREATE TABLE devs (
	id INT PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(30) NOT NULL,
	description VARCHAR(128),
	contact VARCHAR(40)
);
