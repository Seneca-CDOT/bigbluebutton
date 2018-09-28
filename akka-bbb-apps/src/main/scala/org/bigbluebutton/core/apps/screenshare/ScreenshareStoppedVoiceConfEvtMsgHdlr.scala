package org.bigbluebutton.core.apps.screenshare

import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.apps.ScreenshareModel
import org.bigbluebutton.core.running.OutMsgRouter

trait ScreenshareStoppedVoiceConfEvtMsgHdlr {
  this: ScreenshareApp2x =>

  val outGW: OutMsgRouter

  def handleScreenshareStoppedVoiceConfEvtMsg(msg: ScreenshareStoppedVoiceConfEvtMsg): Unit = {
    handleScreenshareStoppedVoiceConfEvtMsg(msg.body.voiceConf, msg.body.screenshareConf)
  }

  def handleScreenshareStoppedVoiceConfEvtMsg(voiceConf: String, screenshareConf: String): Unit = {

    def broadcastEvent(voiceConf: String, screenshareConf: String, url: String, timestamp: String): BbbCommonEnvCoreMsg = {
      val routing = collection.immutable.HashMap("sender" -> "bbb-apps-akka")
      val envelope = BbbCoreEnvelope(ScreenshareStopRtmpBroadcastVoiceConfMsg.NAME, routing)
      val header = BbbCoreHeaderWithMeetingId(
        ScreenshareStopRtmpBroadcastVoiceConfMsg.NAME,
        liveMeeting.props.meetingProp.intId
      )

      val body = ScreenshareStopRtmpBroadcastVoiceConfMsgBody(voiceConf, screenshareConf, url, timestamp)
      val event = ScreenshareStopRtmpBroadcastVoiceConfMsg(header, body)
      BbbCommonEnvCoreMsg(envelope, event)
    }

    val broadcastUrl = ScreenshareModel.getRTMPBroadcastingUrl(liveMeeting.screenshareModel)
    log.info("handleScreenshareStoppedRequest: dsStarted=" +
      ScreenshareModel.getScreenshareStarted(liveMeeting.screenshareModel) +
      " URL:" + broadcastUrl)

    val timestamp = System.currentTimeMillis().toString
    // Tell FreeSwitch to stop broadcasting to RTMP
    val msgEvent = broadcastEvent(voiceConf, screenshareConf, broadcastUrl, timestamp)
    outGW.send(msgEvent)

    ScreenshareModel.setScreenshareStarted(liveMeeting.screenshareModel, false)
  }

}
