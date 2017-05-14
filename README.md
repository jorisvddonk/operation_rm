Operation RM is a space shooter game in which you fight your own filesystem, inspired by Operation: Inner Space.

# Running & developing the project

1. Install all dependencies: `npm install`
2. Run the backend server: `npm start`
3. Compile and watch client code when needed: `npm run-script webpack -- --watch`
4. Play the game via http://localhost:8099/

# Running with a different game root

By default, Operation RM is played from within the Operation RM directory, and you can't escape it ingame.
To change the game's "root" folder, use the --root command line parameter, e.g. `npm start -- --root=C:\\` or `npm start -- --root=/`