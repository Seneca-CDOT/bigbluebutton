package org.bigbluebutton.client.meeting

import akka.actor.{Actor, ActorLogging, Props}
import org.bigbluebutton.client.{ConnInfo, SystemConfiguration}
import org.bigbluebutton.client.bus._
import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.common2.util.JsonUtil
import com.fasterxml.jackson.databind.JsonNode

import scala.util.{Failure, Success}

object UserActor {
  def props(userId: String,
            msgToAkkaAppsEventBus: MsgToAkkaAppsEventBus,
            meetingId: String,
            msgToClientEventBus: MsgToClientEventBus): Props =
    Props(classOf[UserActor], userId, msgToAkkaAppsEventBus, meetingId, msgToClientEventBus)
}

class UserActor(val userId: String,
                msgToAkkaAppsEventBus: MsgToAkkaAppsEventBus,
                meetingId: String,
                msgToClientEventBus: MsgToClientEventBus)
  extends Actor with ActorLogging with SystemConfiguration {

  private val conns = new Connections

  def receive = {

    case msg: ConnectMsg => handleConnectMsg(msg)
    case msg: DisconnectMsg => handleDisconnectMsg(msg)
    case msg: MsgFromClientMsg => handleMsgFromClientMsg(msg)
    case msg: BbbCommonEnvJsNodeMsg => handleBbbServerMsg(msg)
    case _ => log.debug("***** UserActor cannot handle msg ")
  }

  private def createConnection(id: String, sessionId: String, active: Boolean): Connection = {
    Connection(id, sessionId, active)
  }

  def handleConnectMsg(msg: ConnectMsg): Unit = {
    log.debug("**** UserActor handleConnectMsg " + msg.connInfo.userId)
    Connections.findWithId(conns, msg.connInfo.connId) match {
      case Some(m) => log.warning("Connect message on same connection id. " + JsonUtil.toJson(msg.connInfo))
      case None =>
        for {
          activeConn <- Connections.findActiveConnection(conns)
        } yield {
          Connections.setConnInactive(conns, activeConn)
        }
        val m = createConnection(msg.connInfo.connId, msg.connInfo.sessionId, true)
        log.debug("**** UserActor create connection " + m.connId)
        Connections.add(conns, m)
    }
  }

  def handleDisconnectMsg(msg: DisconnectMsg): Unit = {
    log.debug("**** UserActor handleDisconnectMsg " + msg.connInfo.userId)
    for {
      m <- Connections.findWithId(conns, msg.connInfo.connId)
    } yield {
      log.debug("**** UserActor remove connection " + m.connId)
      Connections.remove(conns, m.connId)
    }

    if (Connections.noMoreConnections(conns)) {
      val json = buildUserLeavingMessage(msg.connInfo)
      val msgFromClient = MsgFromClientMsg(msg.connInfo, json)
      handleMsgFromClientMsg(msgFromClient)
    }
  }

  private def buildUserLeavingMessage(connInfo: ConnInfo): String = {
    val header = BbbClientMsgHeader(UserLeaveReqMsg.NAME, meetingId, userId)
    val body = UserLeaveReqMsgBody(userId, connInfo.sessionId)
    val event = UserLeaveReqMsg(header, body)
    JsonUtil.toJson(event)
  }


  def handleMsgFromClientMsg(msg: MsgFromClientMsg):Unit = {


    def convertToJsonNode(json: String): Option[JsonNode] = {
      JsonUtil.toJsonNode(json) match {
        case Success(jsonNode) => Some(jsonNode)
        case Failure(ex) => log.error("Failed to process client message body " + ex)
          None
      }
    }

    object Deserializer extends Deserializer

    val (result, error) = Deserializer.toBbbCoreMessageFromClient(msg.json)
    result match {
      case Some(msgFromClient) =>
        val routing = Routing.addMsgFromClientRouting(msgFromClient.header.meetingId, msgFromClient.header.userId)
        val envelope = new BbbCoreEnvelope(msgFromClient.header.name, routing)

        if (msgFromClient.header.name == "ClientToServerLatencyTracerMsg") {
          log.info("-- trace -- " + msg.json)
        }

        for {
          jsonNode <- convertToJsonNode(msg.json)
        } yield {
          val akkaMsg = BbbCommonEnvJsNodeMsg(envelope, jsonNode)
          msgToAkkaAppsEventBus.publish(MsgToAkkaApps(toAkkaAppsChannel, akkaMsg))
        }

      case None =>
        log.error("Failed to convert message with error: " + error)
    }
  }

  def handleBbbServerMsg(msg: BbbCommonEnvJsNodeMsg): Unit = {
    log.debug("**** UserActor handleBbbServerMsg " + msg)
    for {
      msgType <- msg.envelope.routing.get("msgType")
    } yield {
      handleServerMsg(msgType, msg)
    }
  }

  def handleServerMsg(msgType: String, msg: BbbCommonEnvJsNodeMsg): Unit = {
    log.debug("**** UserActor handleServerMsg " + msg)
    msgType match {
      case MessageTypes.DIRECT => handleDirectMessage(msg)
      case MessageTypes.BROADCAST_TO_MEETING => handleBroadcastMessage(msg)
      case MessageTypes.SYSTEM => handleSystemMessage(msg)
    }
  }

  private def forwardToUser(msg: BbbCommonEnvJsNodeMsg): Unit = {
    log.debug("UserActor forwardToUser. Forwarding to connection. " + msg)
    for {
      conn <- Connections.findActiveConnection(conns)
    } yield {
      msgToClientEventBus.publish(MsgToClientBusMsg(toClientChannel, DirectMsgToClient(meetingId, conn.connId, msg)))
    }
  }

  def handleDirectMessage(msg: BbbCommonEnvJsNodeMsg): Unit = {
    // In case we want to handle specific messages. We can do it here.
    forwardToUser(msg)
  }

  def handleBroadcastMessage(msg: BbbCommonEnvJsNodeMsg): Unit = {
    // In case we want to handle specific messages. We can do it here.
    forwardToUser(msg)
  }

  def handleSystemMessage(msg: BbbCommonEnvJsNodeMsg): Unit = {
    for {
      conn <- Connections.findActiveConnection(conns)
    } yield {
      msg.envelope.name match {
        case DisconnectClientSysMsg.NAME =>
          msgToClientEventBus.publish(MsgToClientBusMsg(toClientChannel, DisconnectClientMsg(meetingId, conn.connId)))
      }
    }
  }
}
