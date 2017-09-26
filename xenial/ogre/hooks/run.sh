#!/bin/bash

#
# Ogre script that wraps around docker images
#
IP=$(ifconfig | grep -v '127.0.0.1' | grep -E "[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*" | tail -1 | cut -d: -f2 | awk '{ print $1}')

HOST=test-install.blindsidenetworks.com
SECRET=8cd8ef52e8e101574e400365b55e11a6
HOST=demo.bigbluebutton.org
SECRET=eec7f2e30a8a82989ca2780305c8bafc
COUNT=1
MEETING="Demo Meeting"
WARMUP=10
SLEEP=0

IP=$(ifconfig | grep -v '127.0.0.1' | grep -E "[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*" | tail -1 | cut -d: -f2 | awk '{ print $1}')

while getopts "ie:h:c:a:w:s:m:u:" opt; do
  case $opt in
    i)
      echo "IP: $IP"
      exit
      ;;
    h)
      HOST=$OPTARG
      ;;
    e)
      SECRET=$OPTARG
      ;;
    c)
      COUNT=$OPTARG
      ;;
    a)
      COUNTARRAY=$OPTARG
      ;;
    w)
      WARMUP=$OPTARG
      ;;
    s)
      SLEEP=$OPTARG
      ;;
    m)
      MEETING=$OPTARG
      ;;
    u)
      URL=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      cat<<HERE
run.sh

  -h   Hostname for BigBlueButton server
  -e   Shared secret

  -c   Number of Ogres to launch
  -w   Warmup (seconds)

  -m   Meeting name (use random for random)
  -s   Sleep time after join

  -a   Array of counts, such as 10.234.195.92:1,10.239.179.137:2
HERE
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

if [ "$MEETING" == "random" ]; then
  MEETING=$RANDOM
fi

echo "IP: $IP"
echo "HOST: $HOST"
echo "SECRET: $SECRET"

TIMEOUT=$(($WARMUP + $SLEEP + 30))

if [ ! -z $COUNTARRAY ]; then
  COUNT=$(echo $COUNTARRAY | tr ',' '\n' | grep $IP | cut -d':' -f2)
fi

if [ "$COUNT" == "0" ]; then
  exit 0
fi

rm /tmp/docker/*.log
echo "TIMEOUT: $TIMEOUT"
pids=()
for (( ogre=0; ogre<$COUNT; ogre++ )); do
  echo "Smasing $host with Ogre $IP-$ogre"
  if [ -z $URL ]; then
    timeout $TIMEOUT docker run --rm -v /tmp/docker:/tmp/docker -t chrome31 -h $HOST -e $SECRET -m "$MEETING" -w $WARMUP -l $SLEEP -n $IP-$ogre $OPS &
  else
    URL=`echo $URL | sed "s/Test/$IP-$ogre/g"`
    timeout $TIMEOUT docker run --rm -v /tmp/docker:/tmp/docker -t chrome31 -h $HOST -e $SECRET -m "$MEETING" -w $WARMUP -l $SLEEP -n $IP-$ogre $OPS -u $URL &
  fi
  # docker run --rm -v /tmp/docker:/tmp/docker -t chrome31 -h $HOST -e $SECRET -m "$MEETING" -w $WARMUP -l $SLEEP -n $IP-$ogre $OPS &
  pids+=($!)
done
wait "${pids[@]}"

SUCCESS=$(grep  "Success!" /tmp/docker/*.log | wc --lines)
FAILED=$(($COUNT-$SUCCESS))
echo "success: $SUCCESS"
echo "failed: $FAILED"

