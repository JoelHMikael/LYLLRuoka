#!/bin/sh
exec 1>>/var/slogs
exec 2>>/var/slogs
echo ""
echo "# Init running"

echo "# Waiting for connection..."
while ! ping 'example.org' -c 1; do
        sleep 5
done
echo "# Connected to internet!"

echo ""

echo "# Testing DB availability"
while ! echo 'exit' | mysql; do
	sleep 5
done
echo "# Database seems to be available (ignore error messages above)"

echo ""

cd "$BASE_DIR/LYLLRuoka"
while echo "# node server.js:"; do
	node server.js

	# Sleep below, so that the loop can't cause too big a load to the server, if the server terminates very fast.
	sleep 5
	echo "SERVER TERMINATED!"
	echo "--------"
done
