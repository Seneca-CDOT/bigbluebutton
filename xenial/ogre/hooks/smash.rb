#!/usr/bin/ruby

#  juju run --all "/tmp/docker/run.sh -i" | grep IP | sed "s/.*: \(.*\)/  ogre\['\1'\]=0/g"

require 'trollop'
# require 'byebug'; byebug

opts = Trollop::options do
  opt :max, "Max count for smashing", :type => Integer, :default => 7

  opt :host, "BigBlueButton Host (name or IP address) ", :type => String
  opt :secret, "BigBlueButton shared secret", :type => String
end

def instruct(max)
  ogre={}

  ogre['10.234.195.92']=0
  ogre['10.239.179.137']=0
  ogre['10.69.8.226']=0
  ogre['10.203.142.176']=0
  ogre['10.236.23.138']=0

  floor = max / ogre.count

  ogre.each do |key,value|
    ogre[key]=floor
  end 

  modulo = max % ogre.count

  ogre.each do |key,value|
    if (modulo > 0)
      ogre[key] = ogre[key] + 1 
    end
    modulo = modulo - 1
  end 

  counts=[]
  ogre.each do |key,value|
    counts << "#{key}:#{value}"
  end

  return counts.join(',')
end

i = 10
while ( i < opts[:max] ) do 
  # puts "juju run --all \"/tmp/docker/run.sh -a #{instruct(i)} -s 60\""
  print "#{i},"
    `juju run --all "/tmp/docker/run.sh -a #{instruct(i)} -h 146.20.105.32 -e 9a8d1825a4b8f5025919ef7431f3987e -m random -s 20" > /tmp/out.txt`
    joined = `cat /tmp/out.txt | grep success | sed 's/.*: //g' | awk '{s+=$1} END {print s}'`
    puts "#{joined.chop.to_i}"
  i += 1
end
