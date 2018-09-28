package org.bigbluebutton.core.apps.screenshare

import org.bigbluebutton.core.running.OutMsgRouter
import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.apps.ScreenshareModel

trait GetScreenshareStatusReqMsgHdlr {
  this: ScreenshareApp2x =>

  // val liveMeeting: LiveMeeting
  val outGW: OutMsgRouter

  def handleGetScreenshareStatusReqMsg(msg: GetScreenshareStatusReqMsg) {

    def broadcastEvent(meetingId: String, userId: String): BbbCommonEnvCoreMsg = {

      val routing = Routing.addMsgToClientRouting(MessageTypes.DIRECT, meetingId, userId)
      val envelope = BbbCoreEnvelope(ScreenshareRtmpBroadcastStartedEvtMsg.NAME, routing)
      val header = BbbClientMsgHeader(
        ScreenshareRtmpBroadcastStartedEvtMsg.NAME,
        liveMeeting.props.meetingProp.intId, "not-used"
      )

      val voiceConf = ScreenshareModel.getVoiceConf(liveMeeting.screenshareModel)
      val screenshareConf = ScreenshareModel.getScreenshareConf(liveMeeting.screenshareModel)
      val stream = ScreenshareModel.getRTMPBroadcastingUrl(liveMeeting.screenshareModel)
      val vidWidth = ScreenshareModel.getScreenshareVideoWidth(liveMeeting.screenshareModel)
      val vidHeight = ScreenshareModel.getScreenshareVideoHeight(liveMeeting.screenshareModel)
      val timestamp = ScreenshareModel.getTimestamp(liveMeeting.screenshareModel)

      val body = ScreenshareRtmpBroadcastStartedEvtMsgBody(voiceConf, screenshareConf,
        stream, vidWidth, vidHeight, timestamp)
      val event = ScreenshareRtmpBroadcastStartedEvtMsg(header, body)
      BbbCommonEnvCoreMsg(envelope, event)
    }

    log.info("handleGetScreenshareStatusReqMsg: isBroadcastingRTMP=" +
      ScreenshareModel.isBroadcastingRTMP(liveMeeting.screenshareModel) +
      " URL:" + ScreenshareModel.getRTMPBroadcastingUrl(liveMeeting.screenshareModel))

    // only reply if there is an ongoing stream
    if (ScreenshareModel.isBroadcastingRTMP(liveMeeting.screenshareModel)) {

      val msgEvent = broadcastEvent(liveMeeting.props.meetingProp.intId, msg.body.requestedBy)
      outGW.send(msgEvent)
    }
  }
}
