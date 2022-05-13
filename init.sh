#!/bin/sh
exec 1>>/tmp/slogs
exec 2>>/tmp/slogs
echo | date
echo "Init running"

echo "Removing old packages..."
rm -rf $PATH_TO_LYLLRUOKA

echo "Waiting for connection..."
while [ ! "$(ping 'www.github.com' -c 1)" ]
do
        sleep 5
done

cd "${PATH_TO_LYLLRUOKA%%FoodJS}"

echo "Cloning new packages..."
git clone "https://github.com/JoelHMikael/FoodJS.git"

cd $PATH_TO_LYLLRUOKA
echo "Starting server..."
node server.js
