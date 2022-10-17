#!/bin/sh
exec 1>>/tmp/slogs
exec 2>>/tmp/slogs
echo "========"
echo | date
echo "# Init running"

echo "# Waiting for connection..."
while ! ping 'example.org' -c 1; do
        sleep 5
done
echo "# Connected to internet!"

echo ""

cd "$BASE_DIR/LYLLRuoka"
echo "# node server.js:"
node server.js

echo "========"
echo ""
echo ""
