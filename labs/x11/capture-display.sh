#/usr/bin/bash
Xvfb :1 -screen 0 640x480x24
export DISPLAY=:1
firefox &
ffmpeg -framerate 12 -s 640x480 -f x11grab -i :1 -g 24 -preset veryfast -tune zerolatency -r 12 -c:v libx264 -crf 24 -pix_fmt yuv420p /tmp/foo.mp4
