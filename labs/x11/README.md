## X11 Development

This tool captures video and audio from a BBB HTML5 meeeting (or other URL), passes it into a screencasting tool, and publish it to a CDN.

When integrated into the BBB HTML5 client, clicking on the broadcast button from the action menu will hit the start endpoint in the container, which will intiate the capture script and begin broadcasting. Similarly, ending the broadcast via action button will hit the stop endpoint and end the broadcast.


### Manual Setup (for local testing and development)

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
sudo dnf install https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
```

Install ffmpeg
```
sudo dnf install ffmpeg ffmpeg-devel
```

OPTIONAL Install VLC (for video playback if you want to output ffmpeg to a video file instead of RTMP stream for debugging purposes)
```
sudo dnf install vlc
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
#### From command line:
```
./capture.sh -o $OUTFILE -u $URL -m $MEETING -p $PASSWORD
```
If outfile is a locally saved file, playback using:
```
cvlc /tmp/capture.mkv (or whatever your filename is)
```

#### From docker:
```
docker build -t broadcast-bot .
```
Detached:
```
docker run -d -p 3000:3000 --name broadcast-bot \
-e OUTFILE=rtmp://a.rtmp.youtube.com/live2/{YOUR-YOUTUBE-STREAM-KEY} \
-e URL=https://dev22.bigbluebutton.org/demo/demoHTML5.jsp \
-e MEETING="Livestream Capture Meeting" \
broadcast-bot:latest
```
Interactively:
```
docker run -it -p 3000:3000 --name broadcast-bot \
-e OUTFILE=rtmp://a.rtmp.youtube.com/live2/{YOUR-YOUTUBE-STREAM-KEY} \
-e URL=https://dev22.bigbluebutton.org/demo/demoHTML5.jsp \
-e MEETING="Livestream Capture Meeting" \
broadcast-bot:latest /bin/bash
```
To jump into a running detached container:
```
docker exec -it broadcast-bot /bin/bash
```
Using docker-compose:
```
export OUTFILE=rtmp://a.rtmp.youtube.com/live2/{YOUR-YOUTUBE-STREAM-KEY}
export URL=https://dev22.bigbluebutton.org/demo/demoHTML5.jsp
export MEETING="Livestream Capture Meeting"
export PASSWORD=
docker-compose up
```
#### Kubernetes
To create a local kubernetes test environment:
```
minikube start --vm-driver=kvm2
```
To start the kubernetes dashboard:
```
minikube dashboard &
```
Create the pods (containers) from YAML files:

Note: working directory should be `bigbluebutton/labs/x11/`
```
kubectl create -f ./broadcast-pod.yaml -f ./broadcast-service.yaml
```
To ssh into the minikube vm:
```
minikube ssh
```

For more information on minikube, visit https://kubernetes.io/docs/setup/minikube/
For more information on kube commands, visit https://kubernetes.io/docs/reference/kubectl/cheatsheet/
For more information on the kube equivalent of docker commands, visit https://kubernetes.io/docs/reference/kubectl/docker-cli-to-kubectl/

#### Endpoints
Start the node endpoint server on the same machine/node that the master kube cluster is on ( necessary so that kubectl commands issued by endpoitns will succeed):

Note: working directory should be `bigbluebutton/labs/x11/`
```
node endpoints/index.js &
```

ALL endpoints are POST methods, and will receive the following as a JSON object with Key:Value pairs:

##### Start (Should accept a RTMP endpoint (OUTFILE), Join URL (URL), Meeting Name (MEETING), Meeting Password (PASSWORD), and Kubernetes Pod Label (LABEL)):
```
localhost:3000/start
```
JSON Object Example:
```
{
    OUTFILE: rtmp://a.rtmp.youtube.com/live2/[YOUR-YOUTUBE-STREAM-KEY],
    URL: https://dev22.bigbluebutton.org/demo/demoHTML5.jsp,
    MEETING: "Livestream Capture Meeting",
    PASSWORD: "123",
    LABEL: Pod_123
}
```
##### Stop (Should receive a name/label that uniqely identifies the pod to stop):
```
localhost:3000/stop
```
JSON Object Example:
```
{
    LABEL: Pod_123
}
```
##### Status (Should receive a name/label that uniqely identifies the pod to check status on):
```
localhost:3000/status
```
JSON Object Example:
```
{
    LABEL: Pod_123
}
```

### Additional Tests (Optional)
Install mocha
```
npm install --global mocha
```
Run the tests
```
npm test
```
