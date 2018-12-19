## X11 Development

This tool captures video and audio from a BBB HTML5 meeeting (or other URL), passes it into a screencasting tool, and publish it to a CDN.

When integrated into the BBB HTML5 client, clicking on the broadcast button from the action menu will hit the start endpoint in the container, which will intiate the capture script and begin broadcasting. Similarly, ending the broadcast via action button will hit the stop endpoint and end the broadcast.


### Setup

#### Install XVFB (X Virtual Frame Buffer)
```
sudo dnf install xorg-x11-server-Xvfb xorg-x11-utils
```

#### Install PulseAudio
```
sudo dnf install pulseaudio pulseaudio-utils
```

#### Install ffmpeg
Add the RPMFusion repositories
```
sudo dnf install https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
```

Install ffmpeg
```
sudo dnf install ffmpeg ffmpeg-devel
```

#### Other Installations
Metacity Window Manager
```
sudo dnf install metacity
```

Window Manager Control
```
sudo dnf install wmctrl
```

Nodejs
```
sudo dnf install nodejs
```

Firefox
```
sudo dnf install firefox
```

Proc file system utilities
```
sudo dnf install procps psmisc
```

### Run
From command line:
```
./capture.sh -o $OUTFILE -u $URL -m $MEETING -p $PASSWORD
```
From docker:
```
docker build -t broadcast-bot .

docker run -d -p 3000:3000 --device /dev/snd \
-e OUTFILE=rtmp://a.rtmp.youtube.com/live2/{YOUR-YOUTUBE-STREAM-KEY} \
-e URL=https://dev22.bigbluebutton.org/demo/demoHTML5.jsp \
-e MEETING="Livestream Capture Meeting" \
-e PULSE_SERVER=unix:${XDG_RUNTIME_DIR}/pulse/native \
-v ${XDG_RUNTIME_DIR}/pulse/native:${XDG_RUNTIME_DIR}pulse/native \
-v ~/.config/pulse/cookie:/root/.config/pulse/cookie \
--group-add $(getent group audio | cut -d: -f3) broadcast-bot:latest
```
or manually
```
docker run -it -p 3000:3000 \
-e OUTFILE=rtmp://a.rtmp.youtube.com/live2/{YOUR-YOUTUBE-STREAM-KEY} \
-e URL=https://dev22.bigbluebutton.org/demo/demoHTML5.jsp \
-e MEETING="Livestream Capture Meeting" \
broadcast-bot:latest bash
```

Then start the node endpoints server from within container
```
node endpoints/index.js &
```

In a browser window:
```
localhost:3000/start
localhost:3000/stop
localhost:3000/status
```

### Tests
Install mocha
```
npm install --global mocha
```
Run the tests
```
npm test
```
