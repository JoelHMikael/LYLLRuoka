#!/bin/sh

echo  "WIP. Don't use this yet."

if [ "$(whoami)" != "root" ]; then
	echo "ERROR: not root. This script installs stuff, so this should be run as root. If you aren't comfortable with it, you can do the installing yourself: it's not hyper advanced."
	exit
fi

echo "Install directory for LYLLRuoka? (leave blank for home)\n>"
read path
cd path

git clone "https://github.com/JoelHMikael/FoodJS.git"

apt install curl
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

npm install mysql2

apt install mysql-server
echo "\nn\nn\nY\nY\nY\nY\n" | mysql_secure_installation
echo "CREATE DATABASE lyllruoka;\nUSE lyllruoka;\n\nCREATE TABLE shiftnames (\n\tday INT,\n\tid INT,\n\tname VARCHAR(128) NOT NULL,\n\tPRIMARY KEY (day, id)\n);\nCREATE TABLE classes (\n\tcourse VARCHAR(6) PRIMARY KEY,\n\tclass VARCHAR(4)\n);\nCREATE TABLE shifts (\n\tday INT,\n\tshift INT,\n\tcourse VARCHAR(6),\n\tteacher VARCHAR(4),\n\tclass VARCHAR(4),\n\tPRIMARY KEY (day, course)\n);\nCREATE TABLE devs (\n\tid INT PRIMARY KEY AUTO_INCREMENT,\n\tname VARCHAR(30) NOT NULL,\n\tdescription VARCHAR(128),\n\tcontact VARCHAR(40) DEFAULT ''\n);\nCREATE TABLE stats (\n    start DATE PRIMARY KEY,\n    uptime INT,\n    requests INT,\n    requests_per_day INT\n);\nCREATE TABLE exams (\n\tstart DATE,\n\tend DATE,\n\tmessage VARCHAR(256),\n\tPRIMARY KEY (start, end)\n);\nCREATE TABLE foods (     \n    week INT,\n    day INT,\n    vegetarian TINYINT,\n    header VARCHAR(15),\n    dateString VARCHAR(13),\n    food VARCHAR(256)\n);" | mysql

echo "Choose the mysql user hostname (type localhost, if unsure)\n>"
read host
echo "Choose the mysql username?\n> "
read name
echo "Choose the mysql password?\n>"
read -s passw

echo "CREATE USER '$name'@'$host' IDENTIFIED BY '$passw';\nGRANT ALL ON lyllruoka.* TO '$name'@'$host';\n"
echo "{\n\t\"host\": \"$host\",\n\t\"user\": \"$name\",\n\t\"password\": \"$passw\",\n\t\"database\": \"lyllruoka\"\n}" > dblogin.txt

echo "Do you want to create a temporary testing certificate? [Y/n]"
read ans
if [ "$ans" == "n" ]; then
	echo "Install finished!"
	exit
fi

openssl genrsa -out key.pem
echo "FI\nUusimaa\nLohja\nLohjan Yhteislyseon Lukio\n\n\n\n\n" | openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
mkdir -p Certificate
mv -t Certificate key.pem cert.pem

echo "Install finished!"
