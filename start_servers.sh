#check and free port if already in use
echo "Checking Port.."
if lsof -Pi :$3 -sTCP:LISTEN -t >/dev/null ; then
    echo "$3 port already in use, trying to free..."
    sudo kill $(sudo lsof -t -i:$3)
    echo "Now port $3 is available"
fi

if lsof -Pi :$2 -sTCP:LISTEN -t >/dev/null ; then
    echo "$2 port already in use, trying to free..."
    sudo kill $(sudo lsof -t -i:$2)
    echo "Now port $2 is available"
fi

echo "Running node server in background..."
node node_server/server.js &
echo "Node server started in background..."

echo "Running web server..."
php webapp/artisan serve --host $1 --port $2
echo "Web server started ..."