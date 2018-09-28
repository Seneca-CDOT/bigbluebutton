package org.bigbluebutton.core.apps.users

import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.bus.InternalEventBus
import org.bigbluebutton.core.domain.MeetingState2x
import org.bigbluebutton.core.models._
import org.bigbluebutton.core.running.{ HandlerHelpers, LiveMeeting, OutMsgRouter }
import org.bigbluebutton.core2.message.senders.{ MsgBuilder }

trait ValidateAuthTokenReqMsgHdlr extends HandlerHelpers {
  this: UsersApp =>

  val liveMeeting: LiveMeeting
  val outGW: OutMsgRouter
  val eventBus: InternalEventBus

  def handleValidateAuthTokenReqMsg(msg: ValidateAuthTokenReqMsg, state: MeetingState2x): MeetingState2x = {
    log.debug("RECEIVED ValidateAuthTokenReqMsg msg {}", msg)

    val regUser = RegisteredUsers.getRegisteredUserWithToken(msg.body.authToken, msg.body.userId, liveMeeting.registeredUsers)

    regUser match {
      case Some(u) =>
        if (noNeedForApproval(u)) {
          userValidatedAndNoNeedToWaitForApproval(u, state)
        } else {
          goThroughGuestPolicy(liveMeeting.guestsWaiting, u, state)
        }
      case None =>
        validateTokenFailed(outGW, meetingId = liveMeeting.props.meetingProp.intId,
          userId = msg.body.userId, authToken = msg.body.authToken, valid = false, waitForApproval = false, state)
    }
  }

  def noNeedForApproval(user: RegisteredUser): Boolean = {
    !user.guest || (user.guest && !user.waitingForAcceptance)
  }

  def goThroughGuestPolicy(guestsWaiting: GuestsWaiting, user: RegisteredUser, state: MeetingState2x): MeetingState2x = {
    if (doesNotHaveToWaitForApproval(guestsWaiting, user)) {
      userValidatedAndNoNeedToWaitForApproval(user, state)
    } else {
      userValidatedButNeedToWaitForApproval(user, state)
    }
  }

  def doesNotHaveToWaitForApproval(guestsWaiting: GuestsWaiting, user: RegisteredUser): Boolean = {
    val guestPolicyType = GuestsWaiting.getGuestPolicy(guestsWaiting).policy
    (guestPolicyType == GuestPolicyType.ALWAYS_ACCEPT) ||
      (guestPolicyType == GuestPolicyType.ASK_MODERATOR && user.guest && !user.waitingForAcceptance)
  }

  def validateTokenFailed(outGW: OutMsgRouter, meetingId: String, userId: String, authToken: String,
                          valid: Boolean, waitForApproval: Boolean, state: MeetingState2x): MeetingState2x = {
    val event = MsgBuilder.buildValidateAuthTokenRespMsg(meetingId, userId, authToken, valid, waitForApproval)
    outGW.send(event)

    // TODO: Should disconnect user here.

    state
  }

  def sendValidateAuthTokenRespMsg(meetingId: String, userId: String, authToken: String,
                                   valid: Boolean, waitForApproval: Boolean): Unit = {
    val event = MsgBuilder.buildValidateAuthTokenRespMsg(meetingId, userId, authToken, valid, waitForApproval)
    outGW.send(event)
  }

  def userValidatedButNeedToWaitForApproval(user: RegisteredUser, state: MeetingState2x): MeetingState2x = {
    val meetingId = liveMeeting.props.meetingProp.intId
    sendValidateAuthTokenRespMsg(meetingId, user.id, user.authToken, valid = true, waitForApproval = false)

    val guest = GuestWaiting(user.id, user.name, user.role)
    addGuestToWaitingForApproval(guest, liveMeeting.guestsWaiting)
    notifyModeratorsOfGuestWaiting(Vector(guest), liveMeeting.users2x, meetingId)

    state
  }

  def addGuestToWaitingForApproval(guest: GuestWaiting, guestsWaitingList: GuestsWaiting): Unit = {
    GuestsWaiting.add(guestsWaitingList, guest)
  }

  def userValidatedAndNoNeedToWaitForApproval(user: RegisteredUser, state: MeetingState2x): MeetingState2x = {

    val meetingId = liveMeeting.props.meetingProp.intId
    sendValidateAuthTokenRespMsg(
      meetingId,
      userId = user.id, authToken = user.authToken, valid = true, waitForApproval = false
    )

    // TODO: REMOVE Temp only so we can implement user handling in client. (ralam june 21, 2017)

    //sendAllUsersInMeeting(user.id)
    //sendAllVoiceUsersInMeeting(user.id, liveMeeting.voiceUsers, meetingId)
    //sendAllWebcamStreams(outGW, user.id, liveMeeting.webcams, meetingId)
    //val newState = userJoinMeeting(outGW, user.authToken, liveMeeting, state)
    //if (!Users2x.hasPresenter(liveMeeting.users2x)) {
    //  automaticallyAssignPresenter(outGW, liveMeeting)
    // }
    state
  }

  def sendAllUsersInMeeting(requesterId: String): Unit = {
    val meetingId = liveMeeting.props.meetingProp.intId
    val users = Users2x.findAll(liveMeeting.users2x)
    val webUsers = users.map { u =>
      WebUser(intId = u.intId, extId = u.extId, name = u.name, role = u.role,
        guest = u.guest, authed = u.authed, waitingForAcceptance = u.waitingForAcceptance, emoji = u.emoji,
        locked = u.locked, presenter = u.presenter, avatar = u.avatar, clientType = u.clientType)
    }

    val event = MsgBuilder.buildGetUsersMeetingRespMsg(meetingId, requesterId, webUsers)
    outGW.send(event)
  }

  def sendAllVoiceUsersInMeeting(requesterId: String, voiceUsers: VoiceUsers, meetingId: String): Unit = {
    val vu = VoiceUsers.findAll(voiceUsers).map { u =>
      VoiceConfUser(intId = u.intId, voiceUserId = u.voiceUserId, callingWith = u.callingWith, callerName = u.callerName,
        callerNum = u.callerNum, muted = u.muted, talking = u.talking, listenOnly = u.listenOnly)
    }

    val event = MsgBuilder.buildGetVoiceUsersMeetingRespMsg(meetingId, requesterId, vu)
    outGW.send(event)
  }

  def notifyModeratorsOfGuestWaiting(guests: Vector[GuestWaiting], users: Users2x, meetingId: String): Unit = {
    val mods = Users2x.findAll(users).filter(p => p.role == Roles.MODERATOR_ROLE)
    mods foreach { m =>
      val event = MsgBuilder.buildGuestsWaitingForApprovalEvtMsg(meetingId, m.intId, guests)
      outGW.send(event)
    }
  }
}
