#!/bin/bash

echo "Tested only on ubuntu 20.04."
if [ "$(sudo whoami)" != "root" ]; then
	echo -e "\e[31mERROR: not root.\e[0m This script installs stuff, so you must let it use sudo. If you aren't comfortable with it, you can do the installing yourself: it's not hyper advanced."
	exit
fi
if [ "$(whoami)" == root ]; then
	echo "Warning: running this script as root instead of letting it use sudo will make all the files and directories it creates owned by root, which will make accessing the neccessary files created with a normal user harder. It is recommended to proceed only if you plan to use this server only as root. Proceed? [Y/n]"
	read shouldcontinue
	if [ "$shouldcontinue" != "Y" ]; then
		exit
	fi
fi

echo -e "This interactive script will install most of the things needed to run LYLLRuoka, except for:\n\t* The actual data to serve on the database\n\t* A SSL/TLS certificate\n\t* uhh\nWhen finished, \e[31mTHE INSTALL WILL TELL THAT IT SUCCEEDED\e[0m. If you don't see a message confirming the success of the installation, the installation \e[31mHAS FAILED. Remember to check that.\e[0m\n"
set -e
echo 'The script will now ask a few questions that are going to be needed during the installation.'

echo -e '\nInstall directory for LYLLRuoka? (absolute path in which you have all permissions)'
read path
mkdir -p "$path/LYLLRuoka"
cd "$path/LYLLRuoka"

echo -e '\nChoose the mysql user hostname. (type localhost, if unsure)'
read host
echo 'Choose the mysql username.'
read name
echo 'Choose the mysql password.'
read -s passw
echo -e "\nA TLS/SSL certificate is required. Assuming that you are in the directory where the server code is located, you will have to add the certificate in '../Certificate/key.pem' and '../Certificate/cert.pem'. If you don't have a certificate now, this script can create a self-signed certificate to you for testing purposes, but browsers will warn their users about some 'security risk' when entering the site. Do you want to get a testing certificate generated? [Y/n]"
read certans
if [ "$certans" == "Y" ]; then
	echo "You can leave the next fields empty if you don't want to fill them in."
	echo "What do you want to be the 'Common Name (e.g. server FQDN or YOUR name)' shown in the testing certificate?"
	read common_name
	echo "What do you want to be the email address shown in the testing certificate?"
	read email
	echo -e 'Generating certificete...'
	openssl genrsa -out key.pem 2> /dev/null
	echo -e "FI\nUusimaa\nLohja\nLohjan Yhteislyseon Lukio\n\n$common_name\n$email\n\n\n" | openssl req -new -key key.pem -out csr.pem 2> /dev/null
	openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem 2> /dev/null
	rm csr.pem
	mkdir -p Certificate
	mv -t Certificate key.pem cert.pem
	echo 'Done!'
fi

echo ""

echo 'Cloning the git repository...'
git clone 'https://github.com/JoelHMikael/FoodJS.git' 2> /dev/null
mkdir 'Updation'
touch Updation/{shifts.txt,vanhalops.csv,uusilops.csv}
echo -e 'Done!\n'

echo 'Installing node.js & node.js API for accessing MySQL...'
sudo apt-get -y install curl > /dev/null
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - > /dev/null 2>&1
sudo apt-get -y install nodejs > /dev/null
npm install mysql2 > /dev/null 2>&1
echo -e 'Done!\n'

echo 'Installing MySQL...'
sudo apt-get -y install mysql-server > /dev/null
echo -e 'Done!\n'

echo "Now that MySQL has installed you can run the program 'mysql_secure_installation'. This is recommended, but there has been (read: I have had) problems with it sometimes. Try running it now as root. If it just doesn't seem to work, you can do without it, if you just make sure your server has a firewall that blocks requests from other computers to MySQL and have only trusted persons have access to the server computer. Press enter when you are ready..."
read

echo 'Setting up MySQL database...'
echo -e "CREATE DATABASE lyllruoka;\nUSE lyllruoka;\n\nCREATE TABLE shiftnames (\n\tday INT,\n\tid INT,\n\tname VARCHAR(128) NOT NULL,\n\tPRIMARY KEY (day, id)\n);\nCREATE TABLE classes (\n\tcourse VARCHAR(6) PRIMARY KEY,\n\tclass VARCHAR(4)\n);\nCREATE TABLE shifts (\n\tday INT,\n\tshift INT,\n\tcourse VARCHAR(6),\n\tteacher VARCHAR(4),\n\tclass VARCHAR(4),\n\tPRIMARY KEY (day, course)\n);\nCREATE TABLE devs (\n\tid INT PRIMARY KEY AUTO_INCREMENT,\n\tname VARCHAR(30) NOT NULL,\n\tdescription VARCHAR(128),\n\tcontact VARCHAR(40) DEFAULT ''\n);\nCREATE TABLE stats (\n    start DATE PRIMARY KEY,\n    uptime INT,\n    requests INT,\n    requests_per_day INT\n);\nCREATE TABLE exams (\n\tstart DATE,\n\tend DATE,\n\tmessage VARCHAR(256),\n\tPRIMARY KEY (start, end)\n);\nCREATE TABLE foods (     \n    week INT,\n    day INT,\n    vegetarian TINYINT,\n    header VARCHAR(15),\n    dateString VARCHAR(13),\n    food VARCHAR(256)\n);\nCREATE USER '$name'@'$host' IDENTIFIED BY '$passw';\nGRANT ALL ON lyllruoka.* TO '$name'@'$host';\n" | sudo mysql > /dev/null
echo -e "{\n\t\"host\": \"$host\",\n\t\"user\": \"$name\",\n\t\"password\": \"$passw\",\n\t\"database\": \"lyllruoka\"\n}" > dblogin.txt
echo -e 'Done!\n'

echo -e '\n==============================\nInstall finished successfully!\n=============================='
