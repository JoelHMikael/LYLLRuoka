# Installation instructions
Follow these steps to install everything required for the project to run.

## Install the FoodJS repository:
```
git clone "https://github.com/JoelHMikael/FoodJS.git"
```

## Install node.js
(16.x, the one in Ubuntus package repositories is outdated)
```
apt install curl
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs
```
Install npm packages required for project
```
npm install mysql2
```

## Install MySQL server & configure it
```
apt install mysql-server
sudo mysql_secure_installation
```
> Note: If you want to update the databases remotely, you can allow logging in from the local network. In this case you of course have to use a strong password.

## Initializing the database
Log into mysql and run the following to initialize the tables:
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
	contact VARCHAR(40)
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
```

## Give the server the credentials, keys & other required things
* MySQL credentials in `../dblogin.txt`
	* You may want to create a user for this. There has been some problems logging in as root on ubuntu, if I remember right.
* SSL certificate in `../Certificate/key.pem` and `../Certificate/cert.pem`

---

# Updating the tables
Coming soon...