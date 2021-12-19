#!/bin/sh
cd /home/joel
git clone "https://github.com/JoelHMikael/FoodJS.git" >> /tmp/test.txt
node ./FoodJS/server.js
