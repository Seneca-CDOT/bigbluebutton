
Building the docker container requires three files

google-chrome-stable_current_amd64.deb -- tested with Chrome 68
chromedriver -- paired with chrome 68
config.tar.gz -- build from a new account that runs Google Chrome

The config file is created from a new Ubuntu account that runs Google Chrome.  In the new aaccount, you need to visit a BigBlueButton site to trigger the download of Flash, and then add exceptions for `[*.]com` and `[*.]org` for Flash in Chrome settings.  Compress the `~/.config` folder into `config.tar.gz`

On the target BigBlueButton server put the file `check.html` into the `/var/www/bigbluebutton/client/check.html` directory.

To build the docker image

~~~
docker build -t chrome68 .
~~~

