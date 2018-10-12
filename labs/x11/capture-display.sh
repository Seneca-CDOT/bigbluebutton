#!/usr/bin/bash

# Remove dangling xserver and browser
function cleanup {
echo "Cleaning up..."

echo "Closing browser"
kill $browser_pid
sleep 1

if [ -f /tmp/.X${DISPLAY:1}-lock ]; then
  echo "Closing xserver"
  xserver_pid=$(ps aux | grep `cat /tmp/.X${DISPLAY:1}-lock` | tail -n1 | rev | cut -d ' ' -f 1 | rev)
  kill $xserver_pid
  rm -rf /tmp/.X${DISPLAY:1}-lock
fi

echo "Exiting"
}
trap cleanup SIGINT SIGTERM EXIT

# Display number
export DISPLAY=:1
# Output file
OUTFILE=/tmp/capture.mp4
# Recording duration (seconds)
DURATION=15
# Framerate
FRAMERATE=24
# Group Of Pixels (should always be framerate x2)
GOP=$(($FRAMERATE * 2))
# Constant Rate Factor (0 (best) - 51 (worst) -- default is 23)
CRF=23
# Frame size
FRAMESIZE=1920x1080
# URL to navigate to in browser
URL=https://www.youtube.com/watch?v=6nuEgc2RVWo

# Start the X server
Xvfb $DISPLAY -screen 0 1920x1080x24 -ac &

# Run a browser to capture
# firefox $URL &
# google-chrome $URL &
npm start &
browser_pid=$!

# Remove existing files
if [ -f $OUTFILE ]; then
  rm $OUTFILE
fi
# Capture display with ffmpeg
ffmpeg -framerate $FRAMERATE -s $FRAMESIZE -f x11grab -t $DURATION -i $DISPLAY \
-g $GOP -preset veryfast -tune zerolatency -r $FRAMERATE -c:v libx264 -crf $CRF -pix_fmt yuv420p $OUTFILE
# Capture with PulseAudio
# ffmpeg -framerate $FRAMERATE -s $FRAMESIZE -f x11grab -t $DURATION -i $DISPLAY \
# -f pulse -ac 2 -i default $OUTFILE
