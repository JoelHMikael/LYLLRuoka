#!/bin/sh

echo  "WIP. Don't use this yet."

if [ "$(whoami)" != "root" ]; then
	echo "ERROR: not root. This script installs stuff, so this should be run as root. If you aren't comfortable with it, you can do the installing yourself: it's not hyper advanced."
	exit
fi

echo "This install will notify about it's success in the end. If you don't see a message telling that everything went fine, the installation has failed at some point."
set -e
echo "Next up is a few questions that are needed during the installation."

echo "Install directory for LYLLRuoka? (leave blank for home)"
read path
mkdir "$path/LYLLRuoka"
cd "$path/LYLLRuoka"

echo "Choose the mysql user hostname. (type localhost, if unsure)"
read host
echo "Choose the mysql username."
read name
echo "Choose the mysql password."
read -s passw
echo "A TLS/SSL certificate is required. Assuming that you are in the directory where the server code is located, you will have to add the certificate in '../Certificate/key.pem' and '../Certificate/cert.pem'. If you don't have a certificate now, this script can create a self-signed certificate to you for testing purposes, but browsers will warn their users about some 'security risk' when entering the site. Do you want to get a testing certificate generated? [Y/n]"
read certans
echo ""
if [ "$certans" == "Y" ]; then
	echo "Generating certificete..."

	openssl genrsa -out key.pem 2> /dev/null
	echo "You will have to answer some questions to get the self signed certificate."
	openssl req -new -key key.pem -out csr.pem
	openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem 2> /dev/null
	rm csr.pem
	mkdir -p Certificate
	mv -t Certificate key.pem cert.pem

	echo "Done!\n"
fi

echo "Installing MySQL..."
apt-get -y install mysql-server > /dev/null
echo "Done!\n"

echo "Now that MySQL has installed you can run the program 'mysql_secure_installation'. This is recommended, but there has been (read: I have had) problems with it sometimes. Try running it now as root. If it just doesn't seem to work, you can do without it, if you just make sure your server has a firewall that blocks requests from other computers to MySQL and have only trusted persons have access to the server computer. Press enter when you are ready..."
read

echo "Setting up MySQL database..."
echo "CREATE DATABASE lyllruoka;\nUSE lyllruoka;\n\nCREATE TABLE shiftnames (\n\tday INT,\n\tid INT,\n\tname VARCHAR(128) NOT NULL,\n\tPRIMARY KEY (day, id)\n);\nCREATE TABLE classes (\n\tcourse VARCHAR(6) PRIMARY KEY,\n\tclass VARCHAR(4)\n);\nCREATE TABLE shifts (\n\tday INT,\n\tshift INT,\n\tcourse VARCHAR(6),\n\tteacher VARCHAR(4),\n\tclass VARCHAR(4),\n\tPRIMARY KEY (day, course)\n);\nCREATE TABLE devs (\n\tid INT PRIMARY KEY AUTO_INCREMENT,\n\tname VARCHAR(30) NOT NULL,\n\tdescription VARCHAR(128),\n\tcontact VARCHAR(40) DEFAULT ''\n);\nCREATE TABLE stats (\n    start DATE PRIMARY KEY,\n    uptime INT,\n    requests INT,\n    requests_per_day INT\n);\nCREATE TABLE exams (\n\tstart DATE,\n\tend DATE,\n\tmessage VARCHAR(256),\n\tPRIMARY KEY (start, end)\n);\nCREATE TABLE foods (     \n    week INT,\n    day INT,\n    vegetarian TINYINT,\n    header VARCHAR(15),\n    dateString VARCHAR(13),\n    food VARCHAR(256)\n);\nCREATE USER '$name'@'$host' IDENTIFIED BY '$passw';\nGRANT ALL ON lyllruoka.* TO '$name'@'$host';\n" | mysql > /dev/null
echo "{\n\t\"host\": \"$host\",\n\t\"user\": \"$name\",\n\t\"password\": \"$passw\",\n\t\"database\": \"lyllruoka\"\n}" > dblogin.txt
echo "Done!\n"

echo "Installing node.js & node.js API for accessing MySQL..."
apt-get -y install curl > /dev/null
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - > /dev/null
apt-get -y install nodejs > /dev/null
npm install mysql2 > /dev/null
echo "Done!\n"

echo "\nCloning the git repository..."
git clone "https://github.com/JoelHMikael/FoodJS.git" > /dev/null
echo "Done!\n"

echo "Install finished successfully!"
