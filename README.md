Operation RM is a space shooter game in which you fight your own filesystem, inspired by Operation: Inner Space.

# Fetching demo files

To fetch some demo files, you could do either of the following:

* run `aria2c -i aria2c_input.txt` in the `demo` directory to download some public domain videos.
* In a bash command prompt, run ``for i in `seq 1 10`; do curl -s 'http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cat' | jq -r '.data.image_mp4_url + "\n  out=" + .data.id + ".mp4\n  auto-file-renaming=false\n  continue=true"'; done | aria2c --input-file=-`` to download 10 random cat videos from Giphy to the current working directory. You'll need to have `jq` and `aria2` installed.

# Running & developing the project

1. Install all dependencies: `npm install`
2. Run the backend server: `npm start`
3. Compile and watch client code when needed: `npm run-script webpack -- --watch`
4. Play the game via http://localhost:8099/
