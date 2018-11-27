#check and free port if already in use
echo "Checking Port.."
if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    echo "$1 port already in use, trying to free..."
    sudo kill $(sudo lsof -t -i:$1)
    echo "Now port $1 is available"
fi

echo "Running node server in background..."
node node_server/server.js > /dev/null 2>/dev/null &
echo "Node server started in background..."