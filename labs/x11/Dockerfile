FROM fedora

WORKDIR /app

COPY . /app

RUN dnf install -y \
https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
RUN dnf install xorg-x11-server-Xvfb ffmpeg ffmpeg-devel metacity wmctrl

EXPOSE 80

CMD ["./capture.sh"]