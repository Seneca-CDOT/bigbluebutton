FROM fedora

WORKDIR /app

COPY . /app

RUN dnf update -y
RUN dnf install -y \
https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
RUN dnf install -y xorg-x11-server-Xvfb xorg-x11-utils ffmpeg ffmpeg-devel metacity wmctrl nodejs firefox procps pulseaudio pulseaudio-utils
RUN npm install

EXPOSE 80

CMD ["./capture.sh"]
