# FROM fedora
FROM ubuntu

WORKDIR /app

COPY . /app

# Fedora image install steps
# RUN dnf update -y
# RUN dnf install -y \
# https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
# https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
# RUN dnf install -y xorg-x11-server-Xvfb xorg-x11-utils ffmpeg ffmpeg-devel metacity wmctrl nodejs firefox procps psmisc pulseaudio pulseaudio-utils
# Ubuntu image install steps
RUN apt-get update -y && apt install -y software-properties-common apt-utils
RUN apt-add-repository -y ppa:jonathonf/ffmpeg-4
RUN apt install -y xvfb ffmpeg metacity wmctrl nodejs npm firefox procps psmisc pulseaudio pulseaudio-utils

RUN npm install

ENV OUTFILE $OUTFILE
ENV URL $URL
ENV MEETING $MEETING
ENV PASSWORD $PASSWORD

EXPOSE 3000

CMD /bin/bash ./capture.sh -o $OUTFILE -u $URL -m $MEETING -p $PASSWORD
