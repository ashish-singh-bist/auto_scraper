echo $#
if [$# == 0]
	then
		echo "please enter port"
		exit 1		
	else
		echo "your port is $1"		
fi

if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    echo "$1 port already in use"
    else
    	echo "server started..."
    	node node_server/server.js > /dev/null 2>/dev/null &
fi

result=`ps aux | grep -i "node node_server/scraper.js databasemode VidaXL 4" | grep -v "grep" | wc -l`

if [ $result -ge 1 ]
   then
        echo "script is already running"
   else
        echo "scraping started"        
        node node_server/scraper.js databasemode VidaXL 4 > /dev/null 2>/dev/null &
fi

# #check and free port if already in use
# echo "Checking Port.."
# if lsof -Pi :$3 -sTCP:LISTEN -t >/dev/null ; then
#     echo "$3 port already in use, trying to free..."
#     sudo kill $(sudo lsof -t -i:$3)
#     echo "Now port $3 is available"
# fi

# if lsof -Pi :$2 -sTCP:LISTEN -t >/dev/null ; then
#     echo "$2 port already in use, trying to free..."
#     sudo kill $(sudo lsof -t -i:$2)
#     echo "Now port $2 is available"
# fi

# echo "Running node server in background..."
# node node_server/server.js &
# echo "Node server started in background..."

# echo "Running web server..."
# php webapp/artisan serve --host $1 --port $2
# echo "Web server started ..."