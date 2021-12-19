#!/bin/sh
# Put in this dir so that it can execute:
cd /home/joel
rm -r -f ./FoodJS
git clone "https://github.com/JoelHMikael/FoodJS.git" >> /tmp/test.txt
node ./FoodJS/server.js
