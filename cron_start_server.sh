echo "Checking Port.."
if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    echo "Server already running in port $1"
else
    echo "Running node server in background..."
    node node_server/server.js > /dev/null 2>/dev/null &
    echo "Node server started in background..."
fi