# description

Script was used to migrate article videos to new version of a website

# workflow

1. Clean up destination database
1. Read video data from source database
1. Process data:
  - For YouTube - extract video id
  - For Brightcove - convert ids to ids from new video hosting platform
1. Store data in destination database

# technologies

Node.js with Async/Await

knex library for MySQL and SqlServer

cheerio

JSON
