/*
 * Lucas Fialho Zawacki
 * (C) Copyright 2017 Bigbluebutton
 *
 */

'use strict';

const BigBlueButtonGW = require('../bbb/pubsub/bbb-gw');
const Video = require('./video');
const BaseManager = require('../base/BaseManager');
const C = require('../bbb/messages/Constants');
const Logger = require('../utils/Logger');
const errors = require('../base/errors');

module.exports = class VideoManager extends BaseManager {
  constructor (connectionChannel, additionalChannels, logPrefix) {
    super(connectionChannel, additionalChannels, logPrefix);
    this.sfuApp = C.VIDEO_APP;
    this.messageFactory(this._onMessage);
  }

  _findByIdAndRole (id, role) {
    let sesh = null;
    let keys = Object.keys(this._sessions);
    keys.forEach((sessionId) => {
      let session = this._sessions[sessionId];
      if (sessionId === (session.connectionId + id + '-' + role)) {
        sesh = session;
      }
    });
    return sesh;
  }

  setStreamAsRecorded (id) {
    let video = this._findByIdAndRole(id, 'share');

    if (video) {
      Logger.info("[VideoManager] Setting ", id, " as recorded");
      video.setStreamAsRecorded();
    } else {
      Logger.warn("[VideoManager] Tried to set stream to recorded but ", id, " has no session!");
    }
  }

  async _onMessage (_message) {
    let message = _message;
    let connectionId = message.connectionId;
    let sessionId;
    let video;
    let role = message.role? message.role : 'any';
    let cameraId = message.cameraId;
    let shared = role === 'share' ? true : false;
    let iceQueue;

    Logger.debug(this._logPrefix, 'Received message =>', message);

    if (!message.cameraId && message.id !== 'close') {
      Logger.warn(this._logPrefix, 'Ignoring message with undefined.cameraId for session', sessionId);
      return;
    }

    cameraId += '-' + role;

    sessionId = connectionId + cameraId;

    if (message.cameraId) {
      video = this._fetchSession(sessionId);
      iceQueue = this._fetchIceQueue(sessionId);
    }

    switch (message.id) {
      case 'start':
        Logger.info(this._logPrefix, 'Received message [' + message.id + '] from connection ' + sessionId);

        if (!video) {
          video = new Video(this._bbbGW, message.meetingId, message.cameraId, shared, message.connectionId);

          this._sessions[sessionId] = video;
        }

        try {
          const sdpAnswer = await video.start(message.sdpOffer);

          // Empty ice queue after starting video
          this._flushIceQueue(video, iceQueue);

          video.once(C.MEDIA_SERVER_OFFLINE, async (event) => {
            const errorMessage = this._handleError(this._logPrefix, connectionId, message.cameraId, role, errors.MEDIA_SERVER_OFFLINE);
            this._bbbGW.publish(JSON.stringify({
              ...errorMessage,
            }), C.FROM_VIDEO);
          });

          this._bbbGW.publish(JSON.stringify({
            connectionId: connectionId,
            type: 'video',
            role: role,
            id : 'startResponse',
            cameraId: message.cameraId,
            sdpAnswer : sdpAnswer
          }), C.FROM_VIDEO);
        }
        catch (err) {
          const errorMessage = this._handleError(this._logPrefix, connectionId, message.cameraId, role, err);
          return this._bbbGW.publish(JSON.stringify({
            ...errorMessage
          }), C.FROM_VIDEO);
        }
        break;

      case 'stop':
        this._stopSession(sessionId);
        break;

      case 'pause':
        if (video) {
          video.pause(message.state);
        }
        break;

      case 'onIceCandidate':
        if (video && video.constructor === Video) {
          video.onIceCandidate(message.candidate);
        } else {
          Logger.info(this._logPrefix, "Queueing ice candidate for later in video", cameraId);
          iceQueue.push(message.candidate);
        }
        break;

      case 'close':
        Logger.info(this._logPrefix, "Closing sessions of connection", connectionId);
        this._killConnectionSessions(connectionId);
        break;

      default:
        const errorMessage = this._handleError(this._logPrefix, connectionId, null, null, errors.SFU_INVALID_REQUEST);
        this._bbbGW.publish(JSON.stringify({
          ...errorMessage,
        }), C.FROM_VIDEO);
        break;
    }
  }
}
