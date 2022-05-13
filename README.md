# Installation instructions
Follow these steps to install everything required for the project to run.

## Install the FoodJS repository
Just clone it from github.
```
git clone "https://github.com/JoelHMikael/FoodJS.git"
```

## Install node.js
(16.x, the one in Ubuntus package repositories is outdated)
```
sudo apt install curl
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```
Install npm packages required for project
```
npm install mysql2
```

## Install MySQL server & configure it
```
sudo apt install mysql-server
sudo mysql_secure_installation
```
> Note: If you want to update the databases remotely, you can allow logging in from the local network. In this case you of course have to use a strong password.

## Initializing the database
If you don't have a backup of the database and need to initialize it, log into mysql and run the following to initialize the tables:
```
CREATE DATABASE lyllruoka;
USE lyllruoka;

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
	contact VARCHAR(40) DEFAULT ''
);
CREATE TABLE stats (
    start DATE PRIMARY KEY,
    uptime INT,
    requests INT,
    requests_per_day INT
);
CREATE TABLE exams (
	start DATE,
	end DATE,
	message VARCHAR(256),
	PRIMARY KEY (start, end)
);
CREATE TABLE foods (     
    week INT,
    day INT,
    vegetarian TINYINT,
    header VARCHAR(15),
    dateString VARCHAR(13),
    food VARCHAR(256)
);
```
> Note that if you had some information in a former database that you don't update manually, it will be lost.

## Give the server the credentials, keys & other required things
* MySQL credentials in `../dblogin.txt`
    * You probably should [create a user](https://dev.mysql.com/doc/refman/8.0/en/create-user.html) and [grant privileges to it](https://dev.mysql.com/doc/refman/8.0/en/grant.html) for this. For me logging in as root didn't work out of the box, except of course combined with `sudo`, which does neither work out of the box with node.js.
    * The credentials should be in json format. For instance:
    ```
    {
        "host": "localhost",
        "user": "exampleuser",
        "password": "password123",
        "database": "lyllruoka"
    }
    ```
* SSL certificate in `../Certificate/key.pem` and `../Certificate/cert.pem`
    * As on the [website of node.js](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/), you can create a self-signed certificate (for testing purposes) as following:
    ```
    openssl genrsa -out key.pem
    openssl req -new -key key.pem -out csr.pem
    openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
    rm csr.pem
    ```

---

# Updating the tables

## Shifts and classes
This is an example on how to update the shifts and classes to the database, so that the server can serve them to the clients.

Lets assume the following filesystem that contains also all of the server code:
```
shifts.txt
Classes
| classes.txt
```
Where shifts.txt contains the shifts and `classes.txt` contains the classes.

You can get the shifts from junu's food shift message through Wilma. The `classes` should be a tab delimited text file. You can get it easily by copy-pasting its contents from eg. LibreOffice from "Kurssitarjottimet". Provide only the classes of one period, not all of them. You can give several class files, if needed.

Then just run the following code in node.js:
```
const updateDB = require("./update.js");
const openFile = require("./Functions/open.js").file;
const dbcredentials = await openFile("../dblogin.txt");
await updateDB.update(dbcredentials, "./shifts.txt", "./Classes/classes.txt");
```
If you have several files with classes, just append them to the parameters of `updateDB.update`.

## Updating the developer table
Updating the developer table is pretty straightforward. You just need to provide the name of the developer, a description (eg. "Improved the performance of the server") and contact information:
```
INSERT INTO devs (name, description, contact) VALUES ('[name]', '[description]', '[contact]');
```
> Insert the values in the quotation marks, don't change the text before the `VALUES` keyword.

# Automatic server code updates
You can make the server update itself from github. The code that updates everything is in the FoodJS folder (top-level of repository) in the file `init.sh`. It should run at reboot and it should have the environment variable PATH_TO_LYLLRUOKA set pointing to the FoodJS folder **without** a trailing backslash.

Add to **roots** crontab (run `sudo crontab -e`):
```
@reboot PATH_TO_LYLLRUOKA=[the path] [the path]/init.sh
# For example:
# @reboot PATH_TO_LYLLRUOKA='/home/foobar/FoodJS' /home/foobar/FoodJS/init.sh

0 0 * * 7 /sbin/shutdown -r
```
If you need to troubleshoot the initialization, you can find both normal and error logs in /tmp/slogs (text file)
