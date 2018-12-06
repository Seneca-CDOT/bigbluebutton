#!/usr/bin/bash

################################################################################
##                                 FUNCTIONS                                  ##
################################################################################

# Usage error message
usage() {
  echo "Usage: $0 [-o <file path|rtmp url>] [-u <url>] [-m <string>] [-p <string>]" 1>&2; exit 1;
}

# Remove dangling xserver and browser session
cleanup() {
  echo "Cleaning up..."
  echo "Closing browser"
  wmctrl -c $BROWSER 2> /dev/null
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
# export OUTFILE=/tmp/capture.mkv

# Recording duration in seconds
# To record for a undefined amount of time, leave DURATION empty or set to 0
# export DURATION=

# if [[ -z $DURATIONARG || $DURATIONARG =~ ^[0]+$ ]]; then
#   export DURATION=
# elif [[ $DURATIONARG =~ ^[0-9]+$ ]]; then
#   export DURATION="-t ${DURATIONARG}"
# elif [[ $DURATIONARG =~ ^[^0-9]+$ ]]; then 
#   echo "Duration value must be empty or an integer greater than or equal to 0."
#   usage
# fi

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

# Parse capture command options
while getopts o:u:m:p: option; do
  case "${option}" in
  o)  export OUTFILE=${OPTARG};;
  u)  export URL=${OPTARG};;
  m)  export MEETING=${OPTARG};;
  p)  export PASSWORD=${OPTARG};;
  esac
done

if [[ -z $OUTFILE || -z $URL || -z $MEETING ]]; then
  usage
fi

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

# Run a selenium script to capture from a browser
node join-meeting.js --url $URL --meeting "$MEETING" --password "$PASSWORD" &
sleep 5

# Start the window manager
metacity --replace &
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
-f flv $DURATION $OUTFILE
