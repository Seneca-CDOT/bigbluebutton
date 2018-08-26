FROM ubuntu:16.04
MAINTAINER Fred Dixon

# good
# Tell debconf to run in non-interactive mode
ENV DEBIAN_FRONTEND noninteractive

RUN echo 'Acquire::http::Proxy "http://192.168.0.130:3142";'  > /etc/apt/apt.conf.d/01proxy

# Make sure the repository information is up to date
RUN apt-get update && apt-get dist-upgrade -y
RUN apt-get install -y \
  ca-certificates \
  openssh-server \
  git \
  autoconf \
  automake \
  build-essential \
  wget

# ------------------- Install chrome

RUN apt-get install -y \
 ruby ruby-dev unzip build-essential xvfb x11vnc libxml2-dev zlib1g-dev libcurl4-gnutls-dev

RUN echo echo "gem: --no-rdoc --no-ri" > ~/.gemrc
RUN gem install nokogiri trollop selenium-webdriver headless ruby-hmac curb byebug

# --

RUN apt-get install -y \
  pulseaudio ffmpeg

RUN apt-get install -y \
  ffmpeg net-tools vim pulseaudio-utils mlocate

ADD google-chrome-stable_current_amd64.deb /tmp/
RUN dpkg -i /tmp/google-chrome-stable_current_amd64.deb || true
RUN apt-get install -fy

ADD chromedriver /usr/bin/

# Add user so we don't need --no-sandbox.
RUN groupadd -r f1 && useradd -r -g f1 -G audio,video f1 \
    && mkdir -p /home/f1/Downloads
COPY ./config.tar.gz /home/f1
RUN cd /home/f1 && tar -xzvf /home/f1/config.tar.gz \
    && rm -f /home/f1/config.tar.gz
RUN chown -R f1:f1 /home/f1/.config

RUN apt-get install -y x11-utils iputils-ping


# Start SSH so we are ready to make a tunnel
ENTRYPOINT ["/tmp/docker/check.rb"]

# Expose the SSH port
EXPOSE 22

