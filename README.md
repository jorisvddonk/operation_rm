Operation RM is a space shooter game in which you fight your own filesystem, inspired by Operation: Inner Space.

# Running & developing the game

First, ensure you have the following requirements installed:

* NodeJS v7.x.x
* ffmpeg with support for encoding oggvorbis video. The ffmpeg binary needs to be in your `PATH`. Alternatively, you can set the `FFMPEG_PATH` environment variable to the absolute path to the ffmpeg binary.

Once you have the requirements installed, this will get the game running for you:

1. Install all JavaScript library dependencies: `npm install`
2. Compile the client code: `npm run-script webpack`
3. Run the backend server: `npm start`
4. Play the game via http://localhost:8099/

To develop the project, run webpack in 'watch' mode with `npm run-script webpack -- --watch`

# Known Working Configuration

This game was developed and tested on the following system configuration:

* Windows 10 (Creators Update)
* NodeJS v7.1.0 (64-bit)
* Chrome 58.0.3029.110 (64-bit)

Systems deviating from the above configuration may experience issues.

# Running with a different game root

By default, Operation RM is played from within the Operation RM directory, and you can't escape it ingame.
To change the game's "root" folder, use the --root command line parameter, e.g. `npm start -- --root=C:\\` or `npm start -- --root=/`