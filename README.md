# FocaBot migrate

Migrate data from a FocaBot 0.x database to a FocaBot 1.x database.

This isn't required unless you want to keep all user data when upgrading.

For the sake of simplicity, data from the "player" module is excluded from the migration.

# Step by step instructions

 - Put the migrate.js file inside the FocaBot (0.x) directory
 - Open a Terminal / Command Prompt inside the directory and run those commands:
 
   ```
   npm install gun@^0.7.9
   node migrate
   ```
 
 - A `data.db` file will be created inside the directory. Copy that file
   over to the FocaBot 1.x directory (~/.focaBot/ if you installed it via npm)

# Redis

If you want to keep using redis for FocaBot, use the `migrate-redis.js` script instead.

Also, make sure to put `USE_REDIS=true` in the `.env` file.
