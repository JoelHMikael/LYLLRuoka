#!/bin/sh
exec 1>>/tmp/slogs
exec 2>>/tmp/slogs
echo | date
echo "Init running"

cd ~

echo "Removing old packages..."
rm -rf ./FoodJS

echo "Waiting for connection..."
while [ ! "$(ping 'www.github.com' -c 1)" ]
do
        sleep 5
done

echo "Cloning new packages..."
git clone "https://github.com/JoelHMikael/FoodJS.git"

echo "Starting server..."
cd ~/FoodJS
node ./server.js
