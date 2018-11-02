# Auto Scraper
This project is to parse data from multiple site . 
Project is under construction.
- Node:- For scraping.
- Laravel:- For Front-End.

# How to configure?
Clone this repository on your local system.

## Configure Node
1:- Goto node_server directory
2:- Create a folder "config" inside node_server directory
3:- Create a file "config.js" in  node_server/config
4:- Set credentials in config file
For Example:-
>   var config = {
        "root_ip":"IP OF NODE SERVER",
        "root_port":"PORT OF NODE SERVER"
    };
module.exports = config;

## Configure Laravel
1:- Goto webapp directory
2:- Create a file "config.js" in  node_server/config
3:- Copy .env_example to .env
4:- Set below credentials in .env file according you
For Example:-
>   DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=homestead
    DB_USERNAME=homestead
    DB_PASSWORD=secret

>   NODE_SERVER_IP="IP OF NODE SERVER"
    NODE_SERVER_PORT="PORT OF NODE SERVER"