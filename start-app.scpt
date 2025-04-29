tell application "Terminal"
    do script "cd /Users/jamesclyburn/CascadeProjects/crochet-stitch-tracker && ./stop-server.sh && ./start-server.sh"
    delay 2 -- wait for server to start
end tell
tell application "Safari"
    activate
    make new document with properties {URL:"http://127.0.0.1:8000/voice-enabled.html"}
end tell
