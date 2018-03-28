
# Testing Amazon
Juju needs to be installed and it requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables to contain EC2's access key and secret key respectively.

To setup

~~~
juju bootstrap aws 
juju status

juju set-model-constraints "instance-type=c3.4xlarge"
juju deploy ./xenial/ogre --series xenial
~~~

## To add/remove more Ogres

To add 9 Ogres

~~~
juju add-unit --num-units 9 ogre
~~~

To remove an ogre

~~~
juju remove-unit ogre/1
~~~

If you update the charm, you can deploy the updates

~~~
juju upgrade-charm  --path ./xenial/ogre ogre
~~~

## Using Ogre

Juju let's you run a command on all your servers

~~~
juju run "sudo /tmp/docker/run.sh" --all
~~~


To run a specific commadn, such as joining the HTML5 demo on test-install, do 

~~~
juju run "sudo /tmp/docker/run.sh -u 'https://dev2.bigbluebutton.org/demo/demoHTML5.jsp?action=create&username=Test' -c 1 -s 60" --all
~~~

## To destroy the environment

It's important to do this as Amazon charges (leaving 20 high-end servers running over night would be expensive).

~~~
juju destroy-controller aws-us-east-1 --destroy-all-models
~~~


# Under the hood

## The scripts

The scripts are in `xenial/ogre/hooks`.

### install
The `install` will setup the machine (launched by juju) with the docker and the docker image

### run.sh
The `run.sh` script is a wrapper for launching instances of chrome with specific parameters.

~~~
./run.sh -h

  -h   Hostname for BigBlueButton server
  -e   Shared secret

  -c   Number of Ogres to launch
  -w   Warmup (seconds)

  -m   Meeting name (use random for random)
  -s   Sleep time after join

  -a   Array of counts, such as 10.234.195.92:1,10.239.179.137:2
~~~

### check.rb

This is the ruby script that runs Chrome headless.  This script is actually stored in the `/tmp/docker` and run from within Docker.  It receives parameters from `run.sh`. By default, `check.rb` only hits the provided URL and sleeps for certain number of seconds before leaving. By modifying `check.rb`, you can add more actions to the browser flow.

## Updating the docker image.

(get the Amazon credentials from me directly)

You can update the docker image (after creating a new version in `/tmp/chrome31.tar.gz` with the follwing commands

~~~
aws s3 ls s3://bn-docker-bDXqSVIGc2isXGp14fDf
docker save chrome31 | gzip -c > /tmp/chrome31.tar.gz
aws s3 cp /tmp/chrome31.tar.gz s3://bn-docker-bDXqSVIGc2isXGp14fDf
~~~
