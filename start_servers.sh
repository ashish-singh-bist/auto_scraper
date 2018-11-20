#check and kill existing running node server if already running
#echo 'Checking Port'
#sudo kill $(sudo lsof -t -i:7001)

echo 'Running node server in background...'
node node_server/server.js &
echo 'Node server started in background...'

echo 'Running web server...'
php webapp/artisan serve
echo 'Web server started...'