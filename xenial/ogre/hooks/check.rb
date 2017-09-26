#!/usr/bin/ruby

# Chrome test script (upgraded)
#
# Copright (c) 2016 Blindside Networks Inc
#
require "selenium-webdriver"
require "trollop"
require "headless"
require "yaml"
require 'uri'
require 'open-uri'
require 'nokogiri'
require 'hmac-sha1'
require 'curb'
require 'securerandom'
require 'logger'
require 'socket'

# require 'byebug' ; byebug

opts = Trollop::options do
  opt :server, "BigBlueButton server in servers.yaml", :type => String, :default => "test-install"

  opt :host, "BigBlueButton Host (name or IP address) ", :type => String
  opt :secret, "BigBlueButton shared secret", :type => String

  opt :sleep, "Wait for a given number of seconds", :type => String
  opt :warmup, "Wait for a random number of seconds before joing", :type => String

  opt :name, "Name of Ogre", :type => String
  opt :meeting, "Name of Meeting", :type => String

  opt :url, "URL to open", :type => String
end

def bbb_api( host, secret, cmd, params )
  parameters = ""
  params.each { |key, value| parameters += key.to_s + "=" + URI.escape(value) + "&" }
  "http://" + host + "/bigbluebutton/api/#{cmd}?" + parameters + "checksum=" + Digest::SHA1.hexdigest(cmd + parameters[0..-2] + secret)
end

def postReturnDoc(host, secret, cmd, params)
  parameters = params.keys.sort.map { |k| "#{k}=#{URI.encode_www_form_component(params[k])}" }.join('&')
  params['checksum'] = Digest::SHA1.hexdigest(cmd + parameters + secret)

  curl_parameters = params.map { |k, v| Curl::PostField.content(k, v) }
  c = Curl::Easy.http_post("http://" + host + "/bigbluebutton/api/#{cmd}", *curl_parameters) { |curl| curl.headers['Accept'] = 'application/xml' }
  Nokogiri::XML(c.body_str)
end

# Check if given the credentials for a BigBlueButton server
if opts[:host] && opts[:secret]
  bbb_host   = opts[:host]
  bbb_secret = opts[:secret]
else
  # Look in servers.yaml for the credentials
  if File.file?('/home/chrome/servers.yaml')
    servers = YAML::load( File.open( '/home/chrome/servers.yaml' ) )
    if servers[opts[:server]].nil?
      puts "Unable to find #{opts[:server]} in /home/chrome/servers.yaml"
      exit 1
    end
    bbb_host   = servers[opts[:server]]['name']
    bbb_secret = servers[opts[:server]]['salt']
  end
end

name = opts[:name] ? opts[:name] : SecureRandom.base64(8).gsub(/[=+\/]/,'')

IP = Socket.ip_address_list[0].ip_address

log = Logger.new(STDOUT)
log = Logger.new("/tmp/docker/#{name}.log")
log.level = Logger::INFO

log.info( "Starting: #{IP}" )
log.info( opts )

# puts "#{name}: #{IP}"

meeting = opts[:meeting] ? opts[:meeting] : "Demo Meeting"
default_params = {
  :meetingID => meeting,
  :name => meeting,
  :moderatorPW => "mp",
  :attendeePW => "ap"
}
create_url = bbb_api( bbb_host, bbb_secret, 'create', default_params )
log.info( create_url )

doc = Nokogiri::XML open(create_url)
if doc.at_xpath('//returncode').content == "SUCCESS"
  log.info( "Successfully joined #{meeting}" )

  defaultConfigXML = open( bbb_api( bbb_host, bbb_secret, 'getDefaultConfigXML', default_params )).read

  params = {
    :meetingID => default_params[:meetingID],
    :configXML => defaultConfigXML.gsub('skipCheck="false"','skipCheck="true"').gsub('useWebRTCIfAvailable="true"', 'useWebRTCIfAvailable="false"')
  }
  doc = postReturnDoc( bbb_host, bbb_secret, 'setConfigXML', params )

  if doc.at_xpath('//returncode').content == "SUCCESS"
    log.info( "Successfully set config.xml" )

    headless = Headless.new( display: rand(100) )
    headless.start

    params = {
      :fullName => name,
      :meetingID => default_params[:meetingID],
      :password => default_params[:moderatorPW],
      :configToken => doc.at_xpath('//configToken').content,
      :clientURL => /https/.match(defaultConfigXML) ? "https://#{bbb_host}/client/check.html" : "http://#{bbb_host}/client/check.html"
    }
    join_url = bbb_api( bbb_host, bbb_secret, 'join', params )
    log.info( join_url )

    driver = Selenium::WebDriver.for :chrome, :switches => %w[--no-sandbox --use-fake-device-for-media-stream --use-fake-ui-for-media-stream]

    if opts[:warmup]
       length = Random.new.rand(opts[:warmup].to_i)
       log.info( "Warmup for #{length} seconds" )
       sleep length
    end

    if opts[:url]
      driver.navigate.to opts[:url]
      sleep 5
      log.info("  Success!")
      if opts[:sleep]
        log.info( "Sleeping for #{opts[:sleep]} seconds" )
        sleep opts[:sleep].to_i
      end
      driver.quit
      headless.destroy
      exit
    else
      driver.navigate.to join_url
    end
    sleep 5

    if opts[:sleep]
      log.info( "Sleeping for #{opts[:sleep]} seconds" )
      sleep opts[:sleep].to_i
    end

    # Try joining the audio
    log.info( "Joining Audio ..." )
    (0..10).each do |i|
      sleep 2
      log.info("Check: #{i}")

      element = driver.find_element(:id, 'BigBlueButton')
      if driver.execute_script("return getJoinedVoice()" , element)
        log.info("  Success!")
        driver.quit
        exit 1
      end
    end

    driver.quit
    headless.destroy
  end
end

exit 1

