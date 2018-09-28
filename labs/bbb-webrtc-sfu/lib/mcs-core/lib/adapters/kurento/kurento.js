'use strict'

const C = require('../../constants/Constants.js');
const config = require('config');
const mediaServerClient = require('kurento-client');
const EventEmitter = require('events').EventEmitter;
const Logger = require('../../../../utils/Logger');
const isError = require('../../utils/util').isError;
const ERRORS = require('./errors.js');

let instance = null;

module.exports = class MediaServer extends EventEmitter {
  constructor(serverUri) {
    if (!instance){
      super();
      this._serverUri = serverUri;
      this._mediaPipelines = {};
      this._mediaElements = {};
      this._mediaServer;
      this._status;
      this._reconnectionRoutine = null;
      instance = this;
    }

    return instance;
  }

  init () {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this._mediaServer) {
          this._mediaServer = await this._getMediaServerClient(this._serverUri);
          Logger.info("[mcs-media] Retrieved media server client => " + this._mediaServer);
          this._monitorConnectionState();
          return resolve();
        }
        resolve();
      }
      catch (error) {
        this.emit(C.ERROR.MEDIA_SERVER_OFFLINE);
        reject(this._handleError(error));
      }
    });
  }

  _getMediaServerClient (serverUri) {
    return new Promise((resolve, reject) =>  {
      mediaServerClient(serverUri, {failAfter: 1}, (error, client) => {
        if (error) {
          return reject(this._handleError(error));
        }
        resolve(client);
      });
    });
  }

  _monitorConnectionState () {
    Logger.debug('[mcs-media] Monitoring connection state');
    try {
      this._mediaServer.on('disconnect', this._onDisconnection.bind(this));
      this._mediaServer.on('reconnected',this._onReconnection.bind(this));
    }
    catch (err) {
      this._handleError(err);
    }
  }

  _onDisconnection () {
    Logger.error('[mcs-media] Media server was disconnected for some reason, will have to clean up all elements and notify users');
    this._destroyElements();
    this._destroyMediaServer();
    this.emit(C.ERROR.MEDIA_SERVER_OFFLINE);
    this._reconnectToServer();
  }

  _onReconnection (sameSession) {
    if (!sameSession) {
      Logger.info('[mcs-media] Media server is back online');
      this.emit(C.EVENT.MEDIA_SERVER_ONLINE);
    }
  }

  _reconnectToServer () {
    if (this._reconnectionRoutine == null) {
      this._reconnectionRoutine = setInterval(async () => {
        try {
          this._mediaServer = await this._getMediaServerClient(this._serverUri);
          this._monitorConnectionState();
          clearInterval(this._reconnectionRoutine);
          this._reconnectionRoutine = null;
          Logger.warn("[mcs-media] Reconnection to media server succeeded");
        }
        catch (error) {
          delete this._mediaServer;
        }
      }, 2000);
    }
  }


  _getMediaPipeline (roomId) {
    return new Promise((resolve, reject) => {
      try {
        if (this._mediaPipelines[roomId]) {
          Logger.warn('[mcs-media] Pipeline for', roomId, ' already exists.');
          return resolve(this._mediaPipelines[roomId]);
        }
        this._mediaServer.create('MediaPipeline', (error, pipeline) => {
          if (error) {
            return reject(this._handleError(error));
          }
          this._mediaPipelines[roomId] = pipeline;
          pipeline.activeElements = 0;
          resolve(pipeline);
        });
      }
      catch (err) {
        return reject(this._handleError(err));
      }
    });
  }

  _releasePipeline (room) {
    return new Promise((resolve, reject) => {
      try {
        Logger.debug("[mcs-media] Releasing room", room, "pipeline");
        const pipeline = this._mediaPipelines[room];
        if (pipeline && typeof pipeline.release === 'function') {
          pipeline.release((error) => {
            if (error) {
              return reject(this._handleError(error));
            }
            delete this._mediaPipelines[room];
            return resolve()
          });
        }
      }
      catch (error) {
        return reject(this._handleError(error));
      }
    });
  }

  _createElement (pipeline, type, options) {
    return new Promise((resolve, reject) => {
      try {
        pipeline.create(type, options, (error, mediaElement) => {
          if (error) {
            return reject(this._handleError(error));
          }
          Logger.info("[mcs-media] Created [" + type + "] media element: " + mediaElement.id);
          this._mediaElements[mediaElement.id] = mediaElement;
          return resolve(mediaElement);
        });
      }
      catch (err) {
        return reject(this._handleError(err));
      }
    });
  }

  createMediaElement (roomId, type, options = {}) {
    options = options || {};
    return new Promise(async (resolve, reject) => {
      try {
        const pipeline = await this._getMediaPipeline(roomId);
        const mediaElement = await this._createElement(pipeline, type, options);
        if (typeof mediaElement.setKeyframeInterval === 'function' && options.keyframeInterval) {
          Logger.debug("[mcs-media] Creating element with keyframe interval set to", options.keyframeInterval);
          mediaElement.setKeyframeInterval(options.keyframeInterval);
        }
        this._mediaPipelines[roomId].activeElements++;
        resolve(mediaElement.id);
      }
      catch (err) {
        reject(this._handleError(err));
      }
    });
  }

  async startRecording (sourceId) {
    const source = this._mediaElements[sourceId];
    return new Promise((resolve, reject) => {
      if (source == null) {
        return reject(this._handleError(ERRORS[40101]));
      }
      try {
        source.record((err) => {
          if (err) {
            return reject(this._handleError(err));
          }
          return resolve();
        });
      }
      catch (err) {
        reject(this._handleError(err));
      }
    });
  }

  async _stopRecording (sourceId) {
    const source = this._mediaElements[sourceId];

    return new Promise((resolve, reject) => {
      if (source == null) {
        return reject(this._handleError(ERRORS[40101]));
      }
      try {
        source.stopAndWait((err) => {
          if (err) {
            return reject(this._handleError(err));
          }
          return resolve();
        });
      }
      catch (err) {
        reject(this._handleError(err));
      }
    });
  }

  async connect (sourceId, sinkId, type) {
    const source = this._mediaElements[sourceId];
    const sink = this._mediaElements[sinkId];

    return new Promise((resolve, reject) => {
      if (source == null || sink == null) {
        return reject(this._handleError(ERRORS[40101]));
      }
      try {
        switch (type) {
          case 'ALL':
            source.connect(sink, (error) => {
              if (error) {
                return reject(this._handleError(error));
              }
              return resolve();
            });
            break;


          case 'AUDIO':
            source.connect(sink, 'AUDIO', (error) => {
              if (error) {
                return reject(this._handleError(error));
              }
              return resolve();
            });

          case 'VIDEO':
            source.connect(sink, (error) => {
              if (error) {
                return reject(this._handleError(error));
              }
              return resolve();
            });
            break;

          default:
            return reject(this._handleError(ERRORS[40107]));
        }
      }
      catch (error) {
        return reject(this._handleError(error));
      }
    });
  }

  async disconnect (sourceId, sinkId, type) {
    const source = this._mediaElements[sourceId];
    const sink = this._mediaElements[sinkId];

    return new Promise((resolve, reject) => {
      if (source == null || sink == null) {
        return reject(this._handleError(ERRORS[40101]));
      }
      try {
        switch (type) {
          case 'ALL':
            source.disconnect(sink, (error) => {
              if (error) {
                return reject(this._handleError(error));
              }
              return resolve();
            });
            break;

          case 'AUDIO':
            source.disconnect(sink, 'AUDIO', (error) => {
              if (error) {
                return reject(this._handleError(error));
              }
              return resolve();
            });

          case 'VIDEO':
            source.disconnect(sink, (error) => {
              if (error) {
                return reject(this._handleError(error));
              }
              return resolve();
            });
            break;

          default:
            return reject(this._handleError(ERRORS[40107]));
        }
      }
      catch (error) {
        return reject(this._handleError(error));
      }
    });
  }

  stop (room, type, elementId) {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.info("[mcs-media] Releasing endpoint", elementId, "from room", room);
        const mediaElement = this._mediaElements[elementId];
        const pipeline = this._mediaPipelines[room];

        if (type === 'RecorderEndpoint') {
          await this._stopRecording(elementId);
        }

        if (mediaElement && typeof mediaElement.release === 'function') {
          mediaElement.release(async (error) => {
            if (error) {
              return reject(this._handleError(error));
            }

            delete this._mediaElements[elementId];

            if (pipeline) {
              pipeline.activeElements--;

              Logger.info("[mcs-media] Pipeline has a total of", pipeline.activeElements, "active elements");
              if (pipeline.activeElements <= 0) {
                await this._releasePipeline(room);
              }
            }
            return resolve();
          });
        }
        else {
          Logger.warn("[mcs-media] Media element", elementId, "could not be found to stop");
          return resolve();
        }
      }
      catch (err) {
        this._handleError(err);
        resolve();
      }
    });
  }

  addIceCandidate (elementId, candidate) {
    return new Promise((resolve, reject) => {
      const mediaElement = this._mediaElements[elementId];
      try {
        if (mediaElement  && candidate) {
          mediaElement.addIceCandidate(candidate, (error) => {
            if (error) {
              return reject(this._handleError(error));
            }
            Logger.debug("[mcs-media] Added ICE candidate for => " + elementId);
            return resolve();
          });
        }
        else {
          return reject(this._handleError(ERRORS[40101]));
        }
      }
      catch (error) {
        return reject(this._handleError(error));
      }
    });
  }

  gatherCandidates (elementId) {
    Logger.info('[mcs-media] Gathering ICE candidates for ' + elementId);
    const mediaElement = this._mediaElements[elementId];

    return new Promise((resolve, reject) => {
      try {
        if (mediaElement == null) {
          return reject(this._handleError(ERRORS[40101]));
        }
        mediaElement.gatherCandidates((error) => {
          if (error) {
            return reject(this._handleError(error));
          }
          Logger.info('[mcs-media] Triggered ICE gathering for ' + elementId);
          return resolve();
        });
      }
      catch (err) {
        return reject(this._handleError(err));
      }
    });
  }

  setInputBandwidth (elementId, min, max) {
    let mediaElement = this._mediaElements[elementId];

    if (mediaElement) {
      mediaElement.setMinVideoRecvBandwidth(min);
      mediaElement.setMaxVideoRecvBandwidth(max);
    } else {
      return ("[mcs-media] There is no element " + elementId);
    }
  }

  setOutputBandwidth (elementId, min, max) {
    let mediaElement = this._mediaElements[elementId];

    if (mediaElement) {
      mediaElement.setMinVideoSendBandwidth(min);
      mediaElement.setMaxVideoSendBandwidth(max);
    } else {
      return ("[mcs-media] There is no element " + elementId );
    }
  }

  setOutputBitrate (elementId, min, max) {
    let mediaElement = this._mediaElements[elementId];

    if (mediaElement) {
      mediaElement.setMinOutputBitrate(min);
      mediaElement.setMaxOutputBitrate(max);
    } else {
      return ("[mcs-media] There is no element " + elementId);
    }
  }

  processOffer (elementId, sdpOffer) {
    const mediaElement = this._mediaElements[elementId];

    return new Promise((resolve, reject) => {
      try {
        if (mediaElement) {
          mediaElement.processOffer(sdpOffer, (error, answer) => {
            if (error) {
              return reject(this._handleError(error));
            }
            return resolve(answer);
          });
        }
        else {
          return reject(this._handleError(ERRORS[40101]));
        }
      }
      catch (err) {
        return reject(this._handleError(err));
      }
    });
  }

  trackMediaState (elementId, type) {
    switch (type) {
      case C.MEDIA_TYPE.URI:
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.ENDOFSTREAM, elementId);
    // TODO event type validator
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.CHANGED, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_IN, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_OUT, elementId);
        break;

      case C.MEDIA_TYPE.WEBRTC:
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.CHANGED, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_IN, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_OUT, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.ICE, elementId);
        break;

    // TODO event type validator
      case C.MEDIA_TYPE.RTP:
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.CHANGED, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_IN, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_OUT, elementId);
        break;

      case C.MEDIA_TYPE.RECORDING:
        this.addMediaEventListener(C.EVENT.RECORDING.STOPPED, elementId);
        this.addMediaEventListener(C.EVENT.RECORDING.PAUSED, elementId);
        this.addMediaEventListener(C.EVENT.RECORDING.STARTED. elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_IN, elementId);
        this.addMediaEventListener(C.EVENT.MEDIA_STATE.FLOW_OUT, elementId);
        break;

      default: return;
    }
    return;
  }

  addMediaEventListener (eventTag, elementId) {
    const mediaElement = this._mediaElements[elementId];
    try {
      if (mediaElement) {
        Logger.debug('[mcs-media] Adding media state listener [' + eventTag + '] for ' + elementId);
        mediaElement.on(eventTag, (event) => {
          if (eventTag === C.EVENT.MEDIA_STATE.ICE) {
            event.candidate = mediaServerClient.getComplexType('IceCandidate')(event.candidate);
          }
          this.emit(C.EVENT.MEDIA_STATE.MEDIA_EVENT+elementId , {eventTag, event});
        });
      }
    }
    catch (err) {
      err = this._handleError(err);
    }
  }

  notifyMediaState (elementId, eventTag, event) {
    this.emit(C.MEDIA_STATE.MEDIA_EVENT , {elementId, eventTag, event});
  }

  _destroyElements () {
    for (var pipeline in this._mediaPipelines) {
      if (this._mediaPipelines.hasOwnProperty(pipeline)) {
        delete this._mediaPipelines[pipeline];
      }
    }

    for (var element in this._mediaElements) {
      if (this._mediaElements.hasOwnProperty(element)) {
        delete this._mediaElements[element];
      }
    }
  }

  _destroyMediaServer() {
    delete this._mediaServer;
  }

  _handleError(err) {
    let { message: oldMessage , code, stack } = err;
    let message;

    if (code && code >= C.ERROR.MIN_CODE && code <= C.ERROR.MAX_CODE) {
      return err;
    }

    const error = ERRORS[code]? ERRORS[code].error : null;

    if (error == null) {
      switch (oldMessage) {
        case "Request has timed out":
          ({ code, message }  = C.ERROR.MEDIA_SERVER_REQUEST_TIMEOUT);
        break;

        case "Connection error":
          ({ code, message } = C.ERROR.CONNECTION_ERROR);
        break;

        default:
          ({ code, message } = C.ERROR.MEDIA_SERVER_GENERIC_ERROR);
      }
    }
    else {
      ({ code, message } = error);
    }

    // Checking if the error needs to be wrapped into a JS Error instance
    if (!isError(err)) {
      err = new Error(message);
    }

    err.code = code;
    err.message = message;
    err.details = oldMessage;
    err.stack = stack

    Logger.debug('[mcs-media] Media Server returned an', err.code, err.message);
    Logger.trace(err.stack);
    return err;
  }
};
