package org.bigbluebutton.core2.message.handlers

import org.bigbluebutton.common2.msgs.EjectUserFromVoiceCmdMsg
import org.bigbluebutton.core.models.VoiceUsers
import org.bigbluebutton.core.running.{ MeetingActor, OutMsgRouter }
import org.bigbluebutton.core2.message.senders.MsgBuilder

trait EjectUserFromVoiceCmdMsgHdlr {
  this: MeetingActor =>

  val outGW: OutMsgRouter

  def handleEjectUserFromVoiceCmdMsg(msg: EjectUserFromVoiceCmdMsg) {
    log.info("Received eject user request. meetingId=" + msg.header.meetingId + " userId=" + msg.body.userId)

    for {
      u <- VoiceUsers.findWithIntId(liveMeeting.voiceUsers, msg.body.userId)
    } yield {
      log.info("Ejecting user from voice.  meetingId=" + props.meetingProp.intId + " userId=" + u.intId)
      val event = MsgBuilder.buildEjectUserFromVoiceConfSysMsg(props.meetingProp.intId, props.voiceProp.voiceConf, u.voiceUserId)
      outGW.send(event)
    }
  }
}
