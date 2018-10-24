#!/usr/bin/bash

# Remove dangling xserver and browser session
function cleanup {
  echo "Cleaning up..."
  echo "Closing browser"
  killall -I -s SIGINT $BROWSER
  # wmctrl -c $BROWSER
  sleep 2

  if [ -f /tmp/.X${DISPLAY:1}-lock ]; then
    echo "Closing xserver"
    XSERVER_PID=$(ps aux | grep `cat /tmp/.X${DISPLAY:1}-lock` | \
                tail -n1 | rev | cut -d ' ' -f 1 | rev)
    kill $XSERVER_PID
    rm -rf /tmp/.X${DISPLAY:1}-lock
  fi

  echo "Exiting"
}
trap cleanup SIGINT SIGTERM EXIT

# Display number
export DISPLAY=:1
# Output file
OUTFILE=/tmp/capture.mkv
# Recording duration
# As an input option, limit the duration of data read from the input file (sec)
# As an output option, stop writing after its duration reaches duration
# To record for a undefined amount of time, set DURATION to 0, press 'q' to stop
DURATION=0
# Framerate
FRAMERATE=30
# Group of Pictures (should always be framerate x2)
GOP=$(($FRAMERATE * 2))
# Constant Rate Factor [0(best)-51(worst)] -- default is 23
CRF=23
# Frame size
FRAMESIZE=1920x1080
# Encoding speed to compression ratio -- slower presets have better compression
#[ultrafast|superfast|veryfast|faster|fast|medium(default)|slow|slower|veryslow]
PRESET=medium
# Tune [film|animation|grain|stillimage|fastdecode|zerolatency]
TUNE=zerolatency
# Format 1 -- check with `ffmpeg -formats`
FMT1=x11grab
# Format 2 -- check with `ffmpeg -formats`
FMT2=pulse
# Video Codec -- check options with `ffmpeg -codecs`
VCODEC=libx264
# Audio Codec -- check options with `ffmpeg -codecs`
ACODEC=flac
# Pixel format -- check options with `ffmpeg -pix_fmts`
PIXFMT=yuv420p
# Audio Channels
AC=2
# Alsa Device Index (obtain from `pacmd list-sources`)
ADI=2
# Browser to use [firefox|google-chrome]
BROWSER=firefox
# URL to navigate to in browser
# URL=https://www.youtube.com/watch?v=TjAa0wOe5k4

# Start the X server
Xvfb $DISPLAY -screen 0 1920x1080x24 -ac &

# Run a browser to capture and set the window size (or use npm script)
# $BROWSER $URL &
# Start the window manager
# TODO: Add window manager
# Maximize the window
# wmctrl -r firefox -b add,maximized_vert,maximized_horz
# Fullscreen the window
# wmctrl -r firefox -b toggle,fullscreen
# sleep 4

# Alternatively, use an npm script
npm start &

# Remove existing files
if [ -f $OUTFILE ]; then
  rm $OUTFILE
fi

# Capture with ffmpeg (video + audio)
if [ "$DURATION" -gt 0 ]; then
ffmpeg -s $FRAMESIZE -thread_queue_size 128 -probesize 20M -f $FMT1 -i \
$DISPLAY -f $FMT2 -thread_queue_size 2048 -ac $AC -i $ADI -crf $CRF -g $GOP \
-preset $PRESET -tune $TUNE -vsync 1 -async 1 -vcodec $VCODEC -acodec $ACODEC \
-pix_fmt $PIXFMT -r $FRAMERATE -t $DURATION $OUTFILE
else
ffmpeg -s $FRAMESIZE -thread_queue_size 128 -probesize 20M -f $FMT1 -i \
$DISPLAY -f $FMT2 -thread_queue_size 2048 -ac $AC -i $ADI -crf $CRF -g $GOP \
-preset $PRESET -tune $TUNE -vsync 1 -async 1 -vcodec $VCODEC -acodec $ACODEC \
-pix_fmt $PIXFMT -r $FRAMERATE $OUTFILE
fi
