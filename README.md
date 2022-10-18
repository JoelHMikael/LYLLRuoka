# Installing

Follow these steps to install everything required for the project to run.

There is a script `setup.sh` on this repository. It will walk you through installing everything. It's not foolproof, so read carefully its prompts and give sensible answers.

The script will declare the installation to have succeeded in the end. If you don't see a message confirming the script's success, something has likely gone wrong.

After running the script there should be a new directory in the path you specified, named LYLLRuoka. This will be referenced to as the "BASE DIRECTORY" from now on.

> `setup.sh` has only been tested on Ubuntu 20.04 and requires `apt-get` to be available.

## Details about the prompts in setup.sh

Below is more information about the information `setup.sh` will ask you. Take a look here if you are unsure what you should type in.

* Install directory: this is the directory where LYLLRuoka should be installed. Supply an absolute path, ie. a path starting with `/`. You should have permissions to read, write and execute in the directory you give. The script will create the "BASE DIRECTORY" in the path you supply, and that directory will contain a folder with the server code and some things needed to run the server. If you are unsure, $HOME (supply as `/home/[username]` is a good choice.
* MySQL username: `setup.sh` will install and configure a MySQL server. On the go it will create a user the server will use to access the `lyllruoka`-database created on the MySQL server. Here you should supply the desired username. Anything goes, really, as long as it is a valid MySQL username. Don't include any quotations or the hostname: these are added automatically.
* TLS/SSL certificate: If you choose to let the script generate a self-signed certificate, it will ask a few questions detailed below. Remember to change the self-signed certificate to a certificate signed by a certificate authority. The certificate's private and public key should be placed in `["BASE DIRECTORY"]/Certificate/key.pem` and `["BASE DIRECTORY"]/cert.pem` respectively.
	* Common name: insert here the domain name where the server will server content, eg. `food.example.com`. Don't include the protocol (eg. `http://`) or any path (eg. `example.com/lorem`),
	* Email address: should be self explanatory.


# Required data

The server actually needs to know the food shifts somehow before it can actually serve them. After running the installation script mentioned above there should be a subdirectory called `Updation` in the "BASE DIRECTORY". It should contain three files: `shifts.txt`, `vanhalops.csv` and `uusilops.csv`. These files are empty, and you will have to populate them. This is data that should be updated in the beginning of every period.

## shifts.txt

1. Open Wilma: <https://lohja.inschool.fi>
2. Go to the message section.
3. Search the newest message with a header like "Periodin [some number] työpäivän keskimmäisen oppitunnin ruokailuvuorot ja oppitunti [date] alkaen"
4. Copy all the message contents starting from "MAANANTAISIN".
5. Paste it into `shifts.txt`
6. Profit.

## uusilops.csv and vanhalops.csv

If there are students studying two separate curriculums, one newer and one older, you will have to do this for both files. If not, using either one will suffice.
1. Get the Kurssitarjotin for the appropriate curriculum from junu or somewhere else as a spreadsheet file
2. Open the file
3. Search the period we are in
4. Copy and paste all the data about that period into uusilops.csv or vanhalops.csv. You know which one.
5. The output should look something like this:
```
t1	t2	t3	t4	t5	t6	t7	t8
UE11	KE11	BI11	GE11	RUB121	MAA31	ENA121	SAB321
TEKE	SAKO	LAMI	PAHO	MAOI	JUMA	VIHU	
B101R	A101R	B101R	B103R	A204R	B202R	A203R	TH
SAB221	BI12	KE31	UE12	RUB122	MAA32	FY33	RAB322
SABE	PAHO	MATI	TEKE	ANSU	SAKO	SALE	
A202R	B103R	A101R	B105R	B109R	B203R	B101R	TH
RUB123	MAA33	LI31	MU13	KU13	RAB321	HI52	VEB321
ANSU	RIHO	JUHO	MAMY	REOJ	MASI	JAJU	
B109R	B202R		B201R	A201R	B210R	B105R	TH
HI42	MAB22	GE14	KU14	ÄI44	LI17	RUB124	
JUSA	JOTO	PAHO	REOJ	VETU	JUHO	KAHU	
B106R	B104R	B103R	A201R	B107R		B209R	
UE15	MAA34	TE15	BI15	RUB125	LI15	KU71	
SATU	MATI	SATU	HEIH	KAHU	ANSA	REOJ	
B108R	B203R	B108R	B110R	B103R		A201R	
FI81	PS22	FI16	KE16	UE16	RUB126	LI18	
ALMA	SATU	ALMA	MATI	ALMA	MAOI	ANSA	
B105R	B108R	B105R	A101R	B105R	A204R		
FY31	MAA35	KU17	RUB127	ÄI47	ENA37		
ESRI	SALE	REOJ	ANSU	HAPA	SABE		
B102R	B101R	A201R	B109R	B108R	B106R		
MU81	ENA122	MU18	EAB331	RUA21	MAB21	KE18	
MAMY	VIHU	MAMY	VIHU	SASA	SAHE	SAHE	
B201R	A203R	B201R	A203R	A202R	B101R	A101R	
	FY111	LI31	FY32		GE18	MAB24	
	ESRI	ANSA	OLNU		HEIH	SAKO	
	B102R		B104R		A102R	B203R	
					AT31	BI18	
					RIHO	HEIH	
					A201R	A102R	
							
							
							
P	E	R	I	O	D	I	IVB
t1	t2	t3	t4	t5	t6	t7	t8
UE11	KE21	BI11	GE11	RUB121	MAA41	ENA121	SAB321
TEKE	SAKO	LAMI	PAHO	MAOI	JUMA	VIHU	
B101R	A101R	B101R	B103R	A204R	B202R	A203R	TH
SAB221	BI12	KE31	UE12	RUB122	MAA42	FY33	RAB322
SABE	PAHO	MATI	TEKE	ANSU	SAKO	SALE	
A202R	B103R	A101R	B105R	B109R	B203R	B101R	TH
RUB123	MAA43	LI31	MU13	KU13	RAB321	HI52	VEB321
ANSU	RIHO	JUHO	MAMY	REOJ	MASI	JAJU	
B109R	B202R		B201R	A201R	B210R	B105R	TH
HI42	MAB22	GE14	KU14	ÄI44	LI17	RUB124	
JUSA	JOTO	PAHO	REOJ	VETU	JUHO	KAHU	
B106R	B104R	B103R	A201R	B107R		B209R	
UE15	MAA44	TE15	BI15	RUB125	LI15	KU71	
SATU	MATI	SATU	HEIH	KAHU	ANSA	REOJ	
B108R	B203R	B108R	B110R	B103R		A201R	
FI81	PS22	FI16	KE26	UE16	RUB126	LI18	
ALMA	SATU	ALMA	MATI	ALMA	MAOI	ANSA	
B105R	B108R	B105R	A101R	B105R	A204R		
FY31	MAA45	KU17	RUB127	ÄI47	ENA37		
ESRI	SALE	REOJ	ANSU	HAPA	SABE		
B102R	B101R	A201R	B109R	B108R	B106R		
MU81	ENA122	MU18	EAB331	RUA21	MAB21	KE28	
MAMY	VIHU	MAMY	VIHU	SASA	SAHE	SAHE	
B201R	A203R	B201R	A203R	A202R	B101R	A101R	
	FY111	LI32	FY32		GE18	MAB24	
	ESRI	ANSA	OLNU		HEIH	SAKO	
	B102R		B104R		A102R	B203R	
					KU151	BI18	
					REOJ	HEIH	
					A201R	A102R	
```
The server isn't very picky about what area you have copy-pasted here. The only requirement is that there should be no data from other periods visible. Otherwise the server will use that data too.

# Running

Now that you have given all required data to the server, you can run it. In the "BASE DIRECTORY" there should be a directory named `LYLLRuoka` (yes, there are two nested directories with the same name). Enter that directory. See the file `server.js`? Good. Now, in this directory, run as root `node server.js`. The output should look like this:
```
Shifts and classes updated.
Foods updated.
Servers Up And Running!
```
Great! Now you have the server running. If you restart the server or close the terminal window or anything else, you will obviously have to restart the server. 

You can make the server run automatically on reboot. This hasn't been tested, though...

Add to **roots** crontab (run `sudo crontab -e`):
```
@reboot BASE_DIR='["BASE_DIRECTORY"]' ["BASE_DIRECTORY"]/LYLLRuoka/init.sh
```
For example: `@reboot BASE_DIR='/home/foobar/LYLLRuoka' /home/foobar/LYLLRuoka/LYLLRuoka/init.sh`

If you need to troubleshoot the starting, you can find some logs in /tmp/slogs. Newest at the bottom. 

# Adding cool data that isn't required for the server to run

## Notifying of unusual food shifts (eg. during exams)

Currently the notifications have to be added manually to the MySQL database. Here's an example:
```
USE lyllruoka;
INSERT INTO exams VALUES ('2021-11-22', '2021-11-30', '<h2>Koeviikko</h2><br>22.11. - 30.11..<br>Kouluruokaa on tarjolla 10:45-11:30.');
```
The first value in the parenthesis is the start date of the notification, the second the end date of the notification and the third value is the message to display. HTML is supported. The message will override the food shift search.

## Updating the developer table

Updating the developer table is pretty straightforward. You just need to provide the name of the developer, a description (eg. "Improved the performance of the server") and contact information:
```
INSERT INTO devs (name, description, contact) VALUES ('[name]', '[description]', '[contact]');
```
> Insert the values in the quotation marks, don't change the text before the `VALUES` keyword.

