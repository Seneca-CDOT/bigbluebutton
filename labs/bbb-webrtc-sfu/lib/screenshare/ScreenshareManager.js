/*
 * Lucas Fialho Zawacki
 * Paulo Renato Lanzarin
 * (C) Copyright 2017 Bigbluebutton
 *
 */

"use strict";

const BigBlueButtonGW = require('../bbb/pubsub/bbb-gw');
const Screenshare = require('./screenshare');
const BaseManager = require('../base/BaseManager');
const C = require('../bbb/messages/Constants');
const Logger = require('../utils/Logger');
const errors = require('../base/errors');

module.exports = class ScreenshareManager extends BaseManager {
  constructor (connectionChannel, additionalChannels, logPrefix) {
    super(connectionChannel, additionalChannels, logPrefix);
    this.sfuApp = C.SCREENSHARE_APP;
    this.messageFactory(this._onMessage);
    this._iceQueues = {};
  }

  async _onMessage(message) {
    Logger.debug(this._logPrefix, 'Received message [' + message.id + '] from connection', message.connectionId);

    const sessionId = message.voiceBridge;
    const connectionId = message.connectionId;
    const role = message.role;
    const sdpOffer = message.sdpOffer
    const callerName = message.callerName;
    let iceQueue, session;

    session = this._fetchSession(sessionId);
    iceQueue = this._fetchIceQueue(sessionId);

    switch (message.id) {
      case 'start':
        if (!session) {
          session = new Screenshare(connectionId, this._bbbGW,
            sessionId, connectionId, message.vh, message.vw,
            message.internalMeetingId);
          this._sessions[sessionId] = session;
        }

        // starts screenshare peer with role by sending sessionID, websocket and sdpoffer
        try {
          const sdpAnswer = await session.start(sessionId, connectionId, sdpOffer, callerName, role)
          Logger.info(this._logPrefix, "Started peer", sessionId, " for connection", connectionId);

          // Empty ice queue after starting session
          if (iceQueue) {
            let candidate;
            while(candidate = iceQueue.pop()) {
              session.onIceCandidate(candidate, role, callerName);
            }
          }

          this._bbbGW.publish(JSON.stringify({
            connectionId: connectionId,
            type: C.SCREENSHARE_APP,
            role: role,
            id : 'startResponse',
            response : 'accepted',
            sdpAnswer : sdpAnswer
          }), C.FROM_SCREENSHARE);

          session.once(C.MEDIA_SERVER_OFFLINE, (event) => {
            this._stopSession(sessionId);
          });

          Logger.info(this._logPrefix, "Sending startResponse to peer", sessionId, "for connection", session._id);
        }
        catch (error) {
          let errorMessage = this._handleError(this._logPrefix, connectionId, callerName, role, error);
          this._bbbGW.publish(JSON.stringify({
            ...errorMessage
          }), C.FROM_SCREENSHARE);
        }
        break;

      case 'stop':
        Logger.info(this._logPrefix, 'Received stop message for session', sessionId, "at connection", connectionId);

        if (session) {
          session._stop(sessionId);
        } else {
          Logger.warn(this._logPrefix, "There was no screensharing session on stop for", sessionId);
        }
        break;

      case 'iceCandidate':
        if (session && session.constructor === Screenshare) {
          session.onIceCandidate(message.candidate, role, callerName);
        } else {
          Logger.info(this._logPrefix, "Queueing ice candidate for later in screenshare", message.voiceBridge);
          iceQueue.push(message.candidate);
        }
        break;

      case 'close':
        Logger.info(this._logPrefix, 'Connection ' + connectionId + ' closed');

        if (session && session.constructor == Screenshare) {
          if (role === C.SEND_ROLE && session) {
            Logger.info(this._logPrefix, "Stopping presenter " + sessionId);
            this._stopSession(sessionId);
          }
          if (role === C.RECV_ROLE && session) {
            Logger.info(this._logPrefix, "Stopping viewer " + sessionId);
            session.stopViewer(message.connectionId);
          }
        }
        break;

      default:
        const errorMessage = this._handleError(this._logPrefix, connectionId, null, null, errors.SFU_INVALID_REQUEST);
        this._bbbGW.publish(JSON.stringify({
          ...errorMessage,
        }), C.FROM_SCREENSHARE);
        break;
    }
  }
};
