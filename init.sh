#!/bin/sh
exec 1>>/tmp/slogs
exec 2>>/tmp/slogs
echo | date
echo "Init running"

cd /home/joel

echo "Removing old packages..."
rm -r -f ./FoodJS

echo "Waiting for connection..."
while [ ! "$(ping 'www.github.com' -c 1)" ]
do
        sleep 5
done

echo "Cloning new packages..."
# Create a deployment key and save it in the default folder without passphrase to make this work:
git clone "git@github.com:JoelHMikael/FoodJS.git"

echo "Starting server..."
cd /home/joel/FoodJS
node ./server.js
