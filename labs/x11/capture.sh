#!/usr/bin/bash

################################################################################
##                                 FUNCTIONS                                  ##
################################################################################

# Remove dangling xserver and browser session
function cleanup {
  echo "Cleaning up..."
  echo "Closing browser"
  # killall -I -s SIGINT $BROWSER
  wmctrl -c $BROWSER
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


################################################################################
##                                  PRESETS                                   ##
################################################################################

# Display number
export DISPLAY=:1

# Output file or endpoint [/tmp/capture.mkv|url]
# OUTFILE=rtmp://a.rtmp.youtube.com/live2/{YOUR-YOUTUBE-STREAM-KEY}
export OUTFILE=/tmp/capture.mkv

# Recording duration in seconds
# To record for a undefined amount of time, leave DURATION empty or set to 0
export DURATION=

if [[ -z $DURATION || $DURATION =~ ^[0]+$ ]]; then
  export DURATIONARG=
elif [[ $DURATION =~ ^[0-9]+$ ]]; then
  export DURATIONARG="-t ${DURATION}"
elif [[ $DURATION =~ ^[^0-9]+$ ]]; then 
  echo "Duration value must be empty or an integer greater than or equal to 0."
fi

# Framerate 
export FRAMERATE=30

# Group of Pictures (should always be framerate x2)
export GOP=$(($FRAMERATE * 2))

# Constant Rate Factor [0(best)-51(worst)] -- default is 23
export CRF=23

# Frame size
export FRAMESIZE=1920x1080

# Encoding speed to compression ratio -- slower presets have better compression
#[ultrafast|superfast|veryfast|faster|fast|medium(default)|slow|slower|veryslow]
export PRESET=medium

# Tune [film|animation|grain|stillimage|fastdecode|zerolatency]
export TUNE=zerolatency

# Format 1 -- check with `ffmpeg -formats`
export VFMT=x11grab

# Format 2 -- check with `ffmpeg -formats`
export AFMT=pulse

# Video Codec -- check options with `ffmpeg -codecs`
export VCODEC=libx264

# Audio Codec -- check options with `ffmpeg -codecs`
export ACODEC=libmp3lame

# Pixel format -- check options with `ffmpeg -pix_fmts`
export PIXFMT=yuv420p

# Audio Channels
export AC=2

# Alsa Device Index (obtain from `pacmd list-sources`)
export ADI=0

# Probesize
# Size of the data to analyze to get stream information, in bytes
# Ranges from 32 to INT_MAX, default is 5000000 (5M)
export PROBESIZE=20M

# Video Thread Queue Size
# Sets the maximum number of queued packets when reading from the file or device
export VTQS=256

# Audio Thread Queue Size
# Sets the maximum number of queued packets when reading from the file or device
export ATQS=4096

# Audio Sampling Frequency
export AR=44100

# Video Bitrate
export BRV=2500k

# Internet Browser [firefox|google-chrome]
export BROWSER=firefox

# URL to navigate to in browser
# URL=https://www.google.com

################################################################################
##                                    RUN                                     ##
################################################################################

# Start the X server if not already running
if [ -f /tmp/.X${DISPLAY:1}-lock ]; then
  echo "X server already running on display ${DISPLAY}"
else
  Xvfb $DISPLAY -screen 0 1920x1080x24 -ac &
fi
sleep 5

# Start pulseaudio
# pulseaudio -D --system
# sleep 5

# Start the window manager
metacity --replace &
sleep 5

# Run a browser to capture and set the window size (or use npm script)
# $BROWSER $URL &
# Alternatively, use an npm script
npm start &
sleep 5

# Maximize or fullscreen the window
# wmctrl -r $BROWSER -b add,maximized_vert,maximized_horz
wmctrl -r $BROWSER -b toggle,fullscreen &

# Remove output file if it already exists
if [ -f $OUTFILE ]; then
  rm $OUTFILE
fi

# Capture video & audio with ffmpeg
ffmpeg -s $FRAMESIZE -thread_queue_size $VTQS -probesize $PROBESIZE -f $VFMT \
-i $DISPLAY -thread_queue_size $ATQS -f $AFMT -ac $AC -i $ADI -ar $AR \
-crf $CRF -g $GOP -preset $PRESET -tune $TUNE -vsync 1 -async 1 \
-vcodec $VCODEC -acodec $ACODEC -pix_fmt $PIXFMT -r $FRAMERATE -b:v $BRV \
-f flv $DURATIONARG $OUTFILE
