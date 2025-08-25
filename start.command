#!/bin/bash
python3 -m http.server 8080 &
sleep 1
open "http://127.0.0.1:8080/index.html" || xdg-open "http://127.0.0.1:8080/index.html"
echo "Server started at http://127.0.0.1:8080"
