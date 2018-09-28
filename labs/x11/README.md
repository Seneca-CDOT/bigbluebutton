## X11 Development

The goal of this is to capture video and audio from a BBB meeeting, pass it into a screencasting tool, and publish it to a CDN.

At a later stage, Chat and Polling from the BigBlueButton meeting will be reintegrated so that users are able to participate.


### Sample ffmpeg command

```
ffmpeg -f openal -i 'Monitor of Dummy Output' -framerate 12 -s 1920x1080 -f x11grab -i :#{@display}+12,77 -g 24 -preset veryfast -tune zerolatency -r 12  -c:v libx264 -crf 24 -pix_fmt yuv420p -b 300k -f flv rtmp://dev110.bigbluebutton.org/screenshare/foo/room2
```

