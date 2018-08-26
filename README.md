
# Ogre

Ogre is an internal test framework for heavy load testing using actual BigBlueButton users.  That is, Chrome clients that fully load the Flash/HTML5 client and join the audio.

Ogre uses Juju to create a set servers, called `units`, for running large amounts of docker containers.  Each server can run about 5 docker containers (each container running Chrome 68).  Using Juju for orchestration allows you to send a command to all units.  For example, of you have started 10 units launch 5 instances of Chrome against a specific BigBlueButton server, you'll have 100 real users join.

## Before you install

Juju needs to be installed and it requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables to contain EC2's access key and secret key respectively.

To setup the Juju environment, execute the following commands

~~~
juju bootstrap aws 
juju status

juju set-model-constraints "instance-type=c3.4xlarge"
juju deploy ./xenial/ogre --series xenial
~~~

## To add/remove more Ogres

To add 9 ogres (for a total of 10)

~~~
juju add-unit --num-units 9 ogre
~~~

To remove an ogre

~~~
juju remove-unit ogre/1
~~~

If you update the charm, you can deploy the updated version

~~~
juju upgrade-charm  --path ./xenial/ogre ogre
~~~

To see the status of all ogres

~~~
juju status
~~~

## Using Ogre

To create users, you use the `juju` command to start instances of Chrome (running in docker) and pass specific parameters.  For example, the command

~~~
juju run "sudo /tmp/docker/run.sh -h test-install.blindsidenetworks.com -e 8cd8ef52e8e101574e400365b55e11a6 -c 2 -s 60 -w 30" --all
~~~

runs 

~~~
sudo /tmp/docker/run.sh -h test-install.blindsidenetworks.com -e 8cd8ef52e8e101574e400365b55e11a6 -c 2 -s 60 -w 30
~~~

on every unit.  This command does the following

  * launch two instances of docker `-c 2`,
  * that start randomly within the first 30 seconds `-w 30`,
  * detect when they have successfully joined the audio bridge,
  * and then sleep for sixty seconds `-s 60`.

To join the meeting `test1` instead, add `-m test`.

~~~
juju run "sudo /tmp/docker/run.sh -h test-install.blindsidenetworks.com -e 8cd8ef52e8e101574e400365b55e11a6 -m test1 -c 2 -s 60 -w 30" --all
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
docker save chrome68 | gzip -c > /tmp/chrome68.tar.gz
aws s3 cp /tmp/chrome68.tar.gz s3://bn-docker-bDXqSVIGc2isXGp14fDf
~~~

After updating, you need to login to the AWS console and make the above file public.
