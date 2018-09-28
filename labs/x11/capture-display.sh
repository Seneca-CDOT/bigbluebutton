#!/usr/bin/bash

function cleanup {
#if [ -f /tmp/.X${DISPLAY:1}-lock ]; then
#  kill $xserver_pid
#  rm -rf /tmp/.X${DISPLAY:1}-lock
#fi

kill $browser_pid

echo "Exiting..."
}
trap cleanup SIGINT SIGTERM EXIT

if [ -f /tmp/foo.mp4 ]; then
  rm -rf /tmp/foo.mp4
fi

export DISPLAY=:1
duration=5

# Start the X server
Xvfb $DISPLAY -screen 0 640x480x24 -ac &
#xserver_pid=$!

# Run a browser to capture
firefox &
#google-chrome &
browser_pid=$!

# Capture display with ffmpeg for a set duration
(sleep $duration; echo q) | ffmpeg -framerate 12 -s 640x480 -f x11grab -i $DISPLAY -g 24 -preset veryfast -tune zerolatency -r 12 -c:v libx264 -crf 24 -pix_fmt yuv420p /tmp/foo.mp4

