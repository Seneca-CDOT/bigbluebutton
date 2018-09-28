#!/usr/bin/ruby
# encoding: UTF-8

# Copyright ⓒ 2017 BigBlueButton Inc. and by respective authors.
#
# This file is part of BigBlueButton open source conferencing system.
#
# BigBlueButton is free software: you can redistribute it and/or modify it
# under the terms of the GNU Lesser General Public License as published by the
# Free Software Foundation, either version 3 of the License, or (at your
# option) any later version.
#
# BigBlueButton is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
# details.
# 
# You should have received a copy of the GNU Lesser General Public License
# along with BigBlueButton.  If not, see <http://www.gnu.org/licenses/>.

require '../lib/recordandplayback'
require 'rubygems'
require 'yaml'
require 'fileutils'

# Number of seconds to delay archiving (red5 race condition workaround)
ARCHIVE_DELAY_SECONDS = 120

def archive_recorded_meetings(recording_dir)
  recorded_done_files = Dir.glob("#{recording_dir}/status/recorded/*.done")

  FileUtils.mkdir_p("#{recording_dir}/status/archived")
  recorded_done_files.each do |recorded_done|
    match = /([^\/]*).done$/.match(recorded_done)
    meeting_id = match[1]

    if File.mtime(recorded_done) + ARCHIVE_DELAY_SECONDS > Time.now
      BigBlueButton.logger.info("Temporarily skipping #{meeting_id} for Red5 race workaround")
      next
    end

    archived_done = "#{recording_dir}/status/archived/#{meeting_id}.done"
    next if File.exists?(archived_done)

    archived_norecord = "#{recording_dir}/status/archived/#{meeting_id}.norecord"
    next if File.exists?(archived_norecord)

    archived_fail = "#{recording_dir}/status/archived/#{meeting_id}.fail"
    next if File.exists?(archived_fail)

    BigBlueButton.redis_publisher.put_archive_started(meeting_id)

    step_start_time = BigBlueButton.monotonic_clock
    ret = BigBlueButton.exec_ret("ruby", "archive/archive.rb", "-m", meeting_id)
    step_stop_time = BigBlueButton.monotonic_clock
    step_time = step_stop_time - step_start_time

    step_succeeded = (ret == 0 &&
                      (File.exists?(archived_done) ||
                       File.exists?(archived_norecord)))

    BigBlueButton.redis_publisher.put_archive_ended(meeting_id, {
      "success" => step_succeeded,
      "step_time" => step_time
    })

    if step_succeeded
      BigBlueButton.logger.info("Successfully archived #{meeting_id}")
      FileUtils.rm_f(recorded_done)
    else
      BigBlueButton.logger.error("Failed to archive #{meeting_id}")
      FileUtils.touch(archived_fail)
    end
  end
end

begin
  props = YAML::load(File.open('bigbluebutton.yml'))
  redis_host = props['redis_host']
  redis_port = props['redis_port']
  BigBlueButton.redis_publisher = BigBlueButton::RedisWrapper.new(redis_host, redis_port)

  log_dir = props['log_dir']
  recording_dir = props['recording_dir']

  logger = Logger.new("#{log_dir}/bbb-rap-worker.log")
  logger.level = Logger::INFO
  BigBlueButton.logger = logger

  BigBlueButton.logger.debug("Running rap-archive-worker...")
  
  archive_recorded_meetings(recording_dir)

  BigBlueButton.logger.debug("rap-archive-worker done")

rescue Exception => e
  BigBlueButton.logger.error(e.message)
  e.backtrace.each do |traceline|
    BigBlueButton.logger.error(traceline)
  end
end
