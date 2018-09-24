#!/usr/bin/ruby

#
# Copright (c) 2015 Blindside Networks Inc
#
require "selenium-webdriver"
require "trollop"
require "headless"
require "yaml"
require 'uri'
# require "redis"
require 'open-uri'
require 'nokogiri'
require 'hmac-sha1'
require 'curb'
require 'securerandom'
require 'logger'
require 'socket'

# require 'debugger'; debugger

opts = Trollop::options do
  opt :server, "BigBlueButton server in servers.yaml", :type => String, :default => "test-install"
  opt :video, "Create video of test session", :default => true
  opt :action, "Tell ogres to take specific action", :type => String, :default => "audio"

  opt :host, "BigBlueButton Host (name or IP address) ", :type => String
  opt :secret, "BigBlueButton shared secret", :type => String
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

puts "Starting ... #{opts}"

# Check if given the credentials for a BigBlueButton server
if opts[:host] && opts[:secret]	
  bbb_host   = opts[:host]
  bbb_secret = opts[:secret]
else
  # Look in servers.yaml for the credentials
  servers = YAML::load( File.open( '/home/chrome/servers.yaml' ) )
  if servers[opts[:server]].nil?
		puts "Unable to find #{opts[:server]} in /home/chrome/servers.yaml"
    exit 1
  end
  bbb_host   = servers[opts[:server]]['name']
  bbb_secret = servers[opts[:server]]['salt']
end

unique_id  = SecureRandom.base64(8).gsub(/[=+\/]/,'')
IP = Socket.ip_address_list[0].ip_address

log = Logger.new(STDOUT)
# log = Logger.new("/tmp/#{unique_id}.txt")
log.level = Logger::INFO

log.info( "Starting: #{IP}" )
log.info( opts )

puts "#{unique_id}: #{IP}"

meeting = "Test Meeting"
default_params = {
  :meetingID => meeting,
  :name => meeting,
  :moderatorPW => "mp",
  :attendeePW => "ap"
}
create_url = bbb_api( bbb_host, bbb_secret, 'create', default_params )

doc = Nokogiri::XML open(create_url)
if doc.at_xpath('//returncode').content == "SUCCESS"
  log.info( "Successfully joined #{meeting}" )

  defaultConfigXML = open( bbb_api( bbb_host, bbb_secret, 'getDefaultConfigXML', default_params )).read

  params = { 
    :meetingID => default_params[:meetingID],
    :configXML => defaultConfigXML.gsub('skipCheck="false"','skipCheck="true"') # .gsub('useWebRTCIfAvailable="true"', 'useWebRTCIfAvailable="false"')
  }
  doc = postReturnDoc( bbb_host, bbb_secret, 'setConfigXML', params )

  if doc.at_xpath('//returncode').content == "SUCCESS"
    log.info( "Successfully set config.xml" )

    # redis = Redis.new
    # headless = Headless.new :display => redis.incr('display') % 100
    # headless = Headless.new :display => rand(100)
    headless = Headless.new(
      display: rand(100),
      video: { 
        provider: "ffmpeg",
        nomouse: true,
        log_file_path: "/tmp/headless.txt",
        frame_rate: "5",
        codec: "libx264 -preset ultrafast -pix_fmt yuv420p",
        tmp_file_path: "/tmp/.headless_ffmpeg_tmp.mp4"
      }
    )

    headless.start
    headless.video.start_capture if opts[:video]

    params = { 
      :fullName => unique_id,
      :meetingID => default_params[:meetingID],
      :password => default_params[:moderatorPW],
      :configToken => doc.at_xpath('//configToken').content,
      :clientURL => /https/.match(defaultConfigXML) ? "https://#{bbb_host}/client/check.html" : "http://#{bbb_host}/client/check.html"
    }
    join_url = bbb_api( bbb_host, bbb_secret, 'join', params )
    log.info( join_url )

    driver = Selenium::WebDriver.for :chrome, :switches => %w[--no-sandbox --use-fake-device-for-media-stream --use-fake-ui-for-media-stream]
    driver.navigate.to join_url
    sleep 5


	  # Generate lots of draw events
    if opts[:action] == "draw"
      end_t = Time.now.to_i + 1000
      puts end_t
      log.info( "Start Drawing ..." )
      element = driver.find_element(:id, 'BigBlueButton')
     length = 50
      begin
          (1..2).each do |diameter|
            (1..360).each do |degrees|
              log.info( " Coordinates: #{Integer((diameter+length)*2*Math.sin(degrees))}, #{Integer((diameter+length)*2*Math.cos(degrees))}" )
              driver.action.click_and_hold(element).move_by(Integer((diameter+length)*2*Math.sin(degrees)),Integer((diameter+length)*2*Math.cos(degrees))).release().perform
              sleep 0.1
           end
         end
         length = length + 1
      end while Time.now.to_i < end_t

      log.info( "... success" )
      element = driver.find_element(:id, 'BigBlueButton')
      FileUtils.cp "/tmp/#{unique_id}.txt", "/tmp/docker" if File.exist?("/tmp/#{unique_id}.txt")
      driver.quit
      exit 0
    end

    # Try joining the audio
    if opts[:action] == "audio"
      log.info( "Joining Audio ..." )
     (0..10).each do |i|
      sleep 2
      log.info("Check: #{i}")

      element = driver.find_element(:id, 'BigBlueButton')
      if driver.execute_script("return getJoinedVoice()" , element)
        log.info("  Success!")
        puts "true"

        FileUtils.cp "/tmp/#{unique_id}.txt", "/tmp/docker"  if File.exist?("/tmp/#{unique_id}.txt")
        driver.quit
        exit 0
      end
     end
    end

    log.info("Fail: /tmp/docker/#{unique_id}.png")
    FileUtils.cp "/tmp/#{unique_id}.txt", "/tmp/docker" if File.exist?("/tmp/#{unique_id}.txt")

    headless.video.stop_and_save("/tmp/docker/#{unique_id}.mov") if opts[:video]
    headless.take_screenshot "/tmp/docker/#{unique_id}.png"

    driver.quit
    headless.destroy
  end
end

exit 1
