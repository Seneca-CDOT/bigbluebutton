package org.bigbluebutton.core.apps.sharednotes

import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.running.OutMsgRouter

trait GetSharedNotesPubMsgHdlr {
  this: SharedNotesApp2x =>

  val outGW: OutMsgRouter

  def handleGetSharedNotesPubMsg(msg: GetSharedNotesPubMsg): Unit = {

    def broadcastEvent(msg: GetSharedNotesPubMsg, notesReport: Map[String, NoteReport], isNotesLimit: Boolean): Unit = {
      val routing = Routing.addMsgToClientRouting(MessageTypes.DIRECT, liveMeeting.props.meetingProp.intId, msg.header.userId)
      val envelope = BbbCoreEnvelope(GetSharedNotesEvtMsg.NAME, routing)
      val header = BbbClientMsgHeader(GetSharedNotesEvtMsg.NAME, liveMeeting.props.meetingProp.intId, msg.header.userId)

      val body = GetSharedNotesEvtMsgBody(notesReport, isNotesLimit)
      val event = GetSharedNotesEvtMsg(header, body)
      val msgEvent = BbbCommonEnvCoreMsg(envelope, event)
      outGW.send(msgEvent)
    }

    val isNotesLimit = liveMeeting.notesModel.isNotesLimit
    val notesReport = liveMeeting.notesModel.notesReport.toMap
    broadcastEvent(msg, notesReport, isNotesLimit)
  }
}
