FROM fedora

WORKDIR /app

COPY . /app

RUN dnf update -y
RUN dnf install -y \
https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
RUN dnf install -y xorg-x11-server-Xvfb xorg-x11-utils ffmpeg ffmpeg-devel metacity wmctrl nodejs firefox procps psmisc pulseaudio pulseaudio-utils
RUN npm install
RUN cd endpoints && npm install
# RUN useradd -m worker

ENV OUTFILE $OUTFILE
ENV URL $URL
ENV MEETING $MEETING
ENV PASSWORD $PASSWORD

EXPOSE 3000

# CMD ./capture.sh -o $OUTFILE -u $URL -m $MEETING -p $PASSWORD
CMD npm start