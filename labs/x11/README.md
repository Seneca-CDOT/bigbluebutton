## X11 Development

The goal of this is to capture video and audio from a BBB meeeting, pass it into a screencasting tool, and publish it to a CDN.

At a later stage, Chat and Polling from the BigBlueButton meeting will be reintegrated so that users are able to participate.


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
```
./capture.sh
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
