#!/bin/bash
for i in `seq 1 10`; do curl -s 'http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cat' | jq -r '.data.image_mp4_url + "\n  out=" + .data.id + ".mp4\n  auto-file-renaming=false\n  continue=true"'; done | aria2c --input-file=-