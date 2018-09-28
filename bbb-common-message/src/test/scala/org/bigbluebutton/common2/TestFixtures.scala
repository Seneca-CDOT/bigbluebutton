package org.bigbluebutton.common2

import org.bigbluebutton.common2.domain._


trait TestFixtures {
  val meetingId = "testMeetingId"
  val externalMeetingId = "testExternalMeetingId"
  val parentMeetingId = "testParentMeetingId"
  val sequence = 4
  val meetingName = "test meeting"
  val record = false
  val voiceConfId = "85115"
  val durationInMinutes = 10
  val autoStartRecording = false
  val allowStartStopRecording = false
  val webcamsOnlyForModerator = false
  val moderatorPassword = "modpass"
  val viewerPassword = "viewpass"
  val createTime = System.currentTimeMillis
  val createDate = "Oct 26, 2015"
  val isBreakout = false
  val welcomeMsgTemplate = "Welcome message template"
  val welcomeMsg = "Welcome message"
  val modOnlyMessage = "Moderator only message"
  val dialNumber = "613-555-1234"
  val maxUsers = 25
  val guestPolicy = "ALWAYS_ASK"
  val metadata: collection.immutable.Map[String, String] = Map("foo" -> "bar", "bar" -> "baz", "baz" -> "foo")

  val meetingProp = MeetingProp(name = meetingName, extId = externalMeetingId, intId = meetingId,
    isBreakout = isBreakout.booleanValue())
  val breakoutProps = BreakoutProps(parentId = parentMeetingId, sequence = sequence, breakoutRooms = Vector())
  val durationProps = DurationProps(duration = durationInMinutes, createdTime = createTime, createdDate = createDate)
  val password = PasswordProp(moderatorPass = moderatorPassword, viewerPass = viewerPassword)
  val recordProp = RecordProp(record = record, autoStartRecording = autoStartRecording,
    allowStartStopRecording = allowStartStopRecording)
  val welcomeProp = WelcomeProp(welcomeMsgTemplate = welcomeMsgTemplate, welcomeMsg = welcomeMsg,
    modOnlyMessage = modOnlyMessage)
  val voiceProp = VoiceProp(telVoice = voiceConfId, voiceConf = voiceConfId, dialNumber = dialNumber)
  val usersProp = UsersProp(maxUsers = maxUsers, webcamsOnlyForModerator = webcamsOnlyForModerator,
    guestPolicy = guestPolicy)
  val metadataProp = new MetadataProp(metadata)
  val screenshareProps = ScreenshareProps(screenshareConf = "FixMe!", red5ScreenshareIp = "fixMe!",
    red5ScreenshareApp = "fixMe!")
  val defaultProps = DefaultProps(meetingProp, breakoutProps, durationProps, password, recordProp, welcomeProp, voiceProp,
    usersProp, metadataProp, screenshareProps)
}
