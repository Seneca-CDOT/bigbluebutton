#!/usr/bin/bash

# Remove dangling xserver and browser session
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
# As an input option (before -i), limit the duration of data read from the input file
# As an output option (before an output url), stop writing the output after its duration reaches duration.
DURATION=15
# Framerate
FRAMERATE=24
# Group of Pixels (should always be framerate x2)
GOP=$(($FRAMERATE * 2))
# Constant Rate Factor [0(best)-51(worst)] -- default is 23
CRF=23
# Frame size
FRAMESIZE=1920x1080
# Encoding speed to compression ratio -- slower presets have better compression
#[ultrafast/superfast/veryfast/faster/fast/medium(default)/slow/slower/veryslow]
PRESET=slow
# Tune [film/animation/grain/stillimage/fastdecode/zerolatency]
TUNE=zerolatency
# Format 1  -- check with `ffmpeg -formats`
FMT1=x11grab
# Format 2 --  -- check with `ffmpeg -formats`
FMT2=pulse
# Video Codec -- check options with `ffmpeg -codecs`
VCODEC=libx264
# Audio Codec -- check options with `ffmpeg -codecs`
ACODEC=mp3
# Pixel format -- check options with `ffmpeg -pix_fmts`
PIXFMT=yuv420p
# Audio Channels
AC=2
# Alsa device index (obtain from `pacmd list-sources`)
ADI=2
# URL to navigate to in browser
URL=https://www.youtube.com/watch?v=6nuEgc2RVWo

# Start the X server
Xvfb $DISPLAY -screen 0 1920x1080x24 -ac &

# Run a browser to capture
firefox $URL &
# google-chrome $URL &
# npm start &
browser_pid=$!

# Remove existing files
if [ -f $OUTFILE ]; then
  rm $OUTFILE
fi
# Capture display with ffmpeg (video only)
# ffmpeg -framerate $FRAMERATE -s $FRAMESIZE -f x11grab -i $DISPLAY \
# -g $GOP -preset veryfast -tune zerolatency -r $FRAMERATE -c:v libx264 \
# -crf $CRF -pix_fmt yuv420p -t $DURATION $OUTFILE

# Capture with ffmpeg (video + audio)
ffmpeg -framerate $FRAMERATE -s $FRAMESIZE -f $FMT1 -i $DISPLAY -f $FMT2 \
-ac $AC -i $ADI -g $GOP -preset $PRESET -tune $TUNE -r $FRAMERATE \
-vcodec $VCODEC -acodec $ACODEC -crf $CRF -pix_fmt $PIXFMT -t $DURATION $OUTFILE
