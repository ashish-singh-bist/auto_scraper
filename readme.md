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

### Install libraries
> sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

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