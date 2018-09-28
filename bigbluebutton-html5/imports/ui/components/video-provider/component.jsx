import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { notify } from '/imports/ui/services/notification';
import VisibilityEvent from '/imports/utils/visibilityEvent';
import logger from '/imports/startup/client/logger';

import VideoService from './service';
import VideoList from './video-list/component';
import { fetchWebRTCMappedStunTurnServers } from '/imports/utils/fetchStunTurnServers';

const VIDEO_CONSTRAINTS = Meteor.settings.public.kurento.cameraConstraints;

const intlClientErrors = defineMessages({
  iceCandidateError: {
    id: 'app.video.iceCandidateError',
    description: 'Error message for ice candidate fail',
  },
  sharingError: {
    id: 'app.video.sharingError',
    description: 'Error on sharing webcam',
  },
  chromeExtensionError: {
    id: 'app.video.chromeExtensionError',
    description: 'Error message for Chrome Extension not installed',
  },
  chromeExtensionErrorLink: {
    id: 'app.video.chromeExtensionErrorLink',
    description: 'Error message for Chrome Extension not installed',
  },
  permissionError: {
    id: 'app.video.permissionError',
    description: 'Error message for webcam permission',
  },
  NotFoundError: {
    id: 'app.video.notFoundError',
    description: 'error message when can not get webcam video',
  },
  NotAllowedError: {
    id: 'app.video.notAllowed',
    description: 'error message when webcam had permission denied',
  },
  NotSupportedError: {
    id: 'app.video.notSupportedError',
    description: 'error message when origin do not have ssl valid',
  },
  NotReadableError: {
    id: 'app.video.notReadableError',
    description: 'error message When the webcam is being used by other software',
  },
  iceConnectionStateError: {
    id: 'app.video.iceConnectionStateError',
    description: 'Error message for ice connection state being failed',
  },
});

const intlSFUErrors = defineMessages({
  2000: {
    id: 'app.sfu.mediaServerConnectionError2000',
    description: 'Error message fired when the SFU cannot connect to the media server',
  },
  2001: {
    id: 'app.sfu.mediaServerOffline2001',
    description: 'error message when kurento is offline',
  },
  2002: {
    id: 'app.sfu.mediaServerNoResources2002',
    description: 'Error message fired when the media server lacks disk, CPU or FDs',
  },
  2003: {
    id: 'app.sfu.mediaServerRequestTimeout2003',
    description: 'Error message fired when requests are timing out due to lack of resources',
  },
  2021: {
    id: 'app.sfu.serverIceGatheringFailed2021',
    description: 'Error message fired when the server cannot enact ICE gathering',
  },
  2022: {
    id: 'app.sfu.serverIceStateFailed2022',
    description: 'Error message fired when the server endpoint transitioned to a FAILED ICE state',
  },
  2202: {
    id: 'app.sfu.invalidSdp2202',
    description: 'Error message fired when the clients provides an invalid SDP',
  },
  2203: {
    id: 'app.sfu.noAvailableCodec2203',
    description: 'Error message fired when the server has no available codec for the client',
  },
});

const CAMERA_SHARE_FAILED_WAIT_TIME = 15000;
const MAX_CAMERA_SHARE_FAILED_WAIT_TIME = 60000;
const PING_INTERVAL = 15000;

class VideoProvider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socketOpen: false,
      stats: [],
    };

    // Set a valid bbb-webrtc-sfu application server socket in the settings
    this.ws = new ReconnectingWebSocket(Meteor.settings.public.kurento.wsUrl);
    this.wsQueue = [];

    this.visibility = new VisibilityEvent();

    this.restartTimeout = {};
    this.restartTimer = {};
    this.webRtcPeers = {};
    this.monitoredTracks = {};
    this.videoTags = {};
    this.sharedWebcam = false;

    this.openWs = this.ws.open.bind(this.ws);
    this.onWsOpen = this.onWsOpen.bind(this);
    this.onWsClose = this.onWsClose.bind(this);
    this.onWsMessage = this.onWsMessage.bind(this);

    this.unshareWebcam = this.unshareWebcam.bind(this);
    this.shareWebcam = this.shareWebcam.bind(this);

    this.pauseViewers = this.pauseViewers.bind(this);
    this.unpauseViewers = this.unpauseViewers.bind(this);

    this.customGetStats = this.customGetStats.bind(this);
  }

  logger(type, message, options = {}) {
    const { userId, userName } = this.props;
    const topic = options.topic || 'video';

    logger[type]({ obj: Object.assign(options, { userId, userName, topic }) }, `[${topic}] ${message}`);
  }

  _sendPauseStream(id, role, state) {
    this.sendMessage({
      cameraId: id,
      id: 'pause',
      type: 'video',
      role,
      state,
    });
  }

  pauseViewers() {
    this.logger('debug', 'Calling pause in viewer streams');

    Object.keys(this.webRtcPeers).forEach((id) => {
      if (this.props.userId !== id && this.webRtcPeers[id].started) {
        this._sendPauseStream(id, 'viewer', true);
      }
    });
  }

  unpauseViewers() {
    this.logger('debug', 'Calling un-pause in viewer streams');

    Object.keys(this.webRtcPeers).forEach((id) => {
      if (id !== this.props.userId && this.webRtcPeers[id].started) {
        this._sendPauseStream(id, 'viewer', false);
      }
    });
  }

  componentWillMount() {
    this.ws.addEventListener('open', this.onWsOpen);
    this.ws.addEventListener('close', this.onWsClose);

    window.addEventListener('online', this.openWs);
    window.addEventListener('offline', this.onWsClose);
  }

  componentDidMount() {
    document.addEventListener('joinVideo', this.shareWebcam); // TODO find a better way to do this
    document.addEventListener('exitVideo', this.unshareWebcam);
    this.ws.addEventListener('message', this.onWsMessage);

    this.visibility.onVisible(this.unpauseViewers);
    this.visibility.onHidden(this.pauseViewers);
  }

  componentWillUpdate({ users, userId }) {
    const usersSharingIds = users.map(u => u.id);
    const usersConnected = Object.keys(this.webRtcPeers);

    const usersToConnect = usersSharingIds.filter(id => !usersConnected.includes(id));
    const usersToDisconnect = usersConnected.filter(id => !usersSharingIds.includes(id));

    usersToConnect.forEach(id => this.createWebRTCPeer(id, userId === id));
    usersToDisconnect.forEach(id => this.stopWebRTCPeer(id));
  }

  componentWillUnmount() {
    document.removeEventListener('joinVideo', this.shareWebcam);
    document.removeEventListener('exitVideo', this.unshareWebcam);

    this.ws.removeEventListener('message', this.onWsMessage);
    this.ws.removeEventListener('open', this.onWsOpen);
    this.ws.removeEventListener('close', this.onWsClose);

    window.removeEventListener('online', this.openWs);
    window.removeEventListener('offline', this.onWsClose);

    this.visibility.removeEventListeners();

    // Unshare user webcam
    if (this.sharedWebcam) {
      this.unshareWebcam();
    }

    Object.keys(this.webRtcPeers).forEach((id) => {
      this.stopGettingStats(id);
      this.stopWebRTCPeer(id);
    });

    // Close websocket connection to prevent multiple reconnects from happening
    this.ws.close();
  }

  onWsOpen() {
    this.logger('debug', '------ Websocket connection opened.', { topic: 'ws' });

    // -- Resend queued messages that happened when socket was not connected
    while (this.wsQueue.length > 0) {
      this.sendMessage(this.wsQueue.pop());
    }

    this.pingInterval = setInterval(this.ping.bind(this), PING_INTERVAL);

    this.setState({ socketOpen: true });
  }

  onWsClose(error) {
    this.logger('debug', '------ Websocket connection closed.', { topic: 'ws' });

    this.stopWebRTCPeer(this.props.userId);
    clearInterval(this.pingInterval);

    this.setState({ socketOpen: false });
  }

  ping() {
    const message = {
      id: 'ping',
    };
    this.sendMessage(message);
  }

  onWsMessage(msg) {
    const parsedMessage = JSON.parse(msg.data);

    this.logger('debug', `Received new message '${parsedMessage.id}'`, { topic: 'ws', message: parsedMessage });

    switch (parsedMessage.id) {
      case 'startResponse':
        this.startResponse(parsedMessage);
        break;

      case 'playStart':
        this.handlePlayStart(parsedMessage);
        break;

      case 'playStop':
        this.handlePlayStop(parsedMessage);
        break;

      case 'iceCandidate':
        this.handleIceCandidate(parsedMessage);
        break;

      case 'pong':
        this.logger('debug', 'Received pong from server', { topic: 'ws' });
        break;

      case 'error':
      default:
        this.handleSFUError(parsedMessage);
        break;
    }
  }

  sendMessage(message) {
    const { ws } = this;

    if (this.connectedToMediaServer()) {
      const jsonMessage = JSON.stringify(message);
      this.logger('debug', `Sending message '${message.id}'`, { topic: 'ws', message });
      ws.send(jsonMessage, (error) => {
        if (error) {
          this.logger(`client: Websocket error '${error}' on message '${message.id}'`, { topic: 'ws' });
        }
      });
    } else {
      // No need to queue video stop messages
      if (message.id !== 'stop') {
        this.wsQueue.push(message);
      }
    }
  }

  connectedToMediaServer() {
    return this.ws.readyState === WebSocket.OPEN;
  }

  startResponse(message) {
    const id = message.cameraId;
    const peer = this.webRtcPeers[id];

    this.logger('debug', 'SDP answer received from server. Processing ...', { cameraId: id, sdpAnswer: message.sdpAnswer });

    if (peer) {
      peer.processAnswer(message.sdpAnswer, (error) => {
        if (error) {
          return this.logger('debug', JSON.stringify(error), { cameraId: id });
        }
      });
    } else {
      this.logger('warn', '[startResponse] Message arrived after the peer was already thrown out, discarding it...');
    }
  }

  handleIceCandidate(message) {
    const webRtcPeer = this.webRtcPeers[message.cameraId];

    this.logger('debug', 'Received remote ice candidate', { topic: 'ice', candidate: message.candidate });

    if (webRtcPeer) {
      if (webRtcPeer.didSDPAnswered) {
        webRtcPeer.addIceCandidate(message.candidate, (err) => {
          if (err) {
            return this.logger('error', `Error adding candidate: ${err}`, { cameraId: message.cameraId });
          }
        });
      } else {
        if (webRtcPeer.iceQueue == null) {
          webRtcPeer.iceQueue = [];
        }
        webRtcPeer.iceQueue.push(message.candidate);
      }
    } else {
      this.logger('warn', ' [iceCandidate] Message arrived after the peer was already thrown out, discarding it...', { cameraId: message.cameraId });
    }
  }

  stopWebRTCPeer(id) {
    this.logger('info', 'Stopping webcam', { cameraId: id });
    const { userId } = this.props;
    const shareWebcam = id === userId;

    // in this case, 'closed' state is not caused by an error;
    // we stop listening to prevent this from being treated as an error
    if (this.webRtcPeers[id]) {
      this.webRtcPeers[id].peerConnection.oniceconnectionstatechange = null;
    }

    if (shareWebcam) {
      this.unshareWebcam();
    }

    this.sendMessage({
      type: 'video',
      role: shareWebcam ? 'share' : 'viewer',
      id: 'stop',
      cameraId: id,
    });

    // Clear the shared camera fail timeout when destroying
    clearTimeout(this.restartTimeout[id]);
    delete this.restartTimeout[id];

    this.destroyWebRTCPeer(id);
  }

  destroyWebRTCPeer(id) {
    const webRtcPeer = this.webRtcPeers[id];
    if (webRtcPeer) {
      this.logger('info', 'Stopping WebRTC peer', { cameraId: id });
      webRtcPeer.dispose();
      delete this.webRtcPeers[id];
    } else {
      this.logger('warn', 'No WebRTC peer to stop (not an error)', { cameraId: id });
    }
  }

  async createWebRTCPeer(id, shareWebcam) {
    const { meetingId, sessionToken } = this.props;
    let iceServers = [];

    try {
      iceServers = await fetchWebRTCMappedStunTurnServers(sessionToken);
    } catch (error) {
      this.logger('error', 'Video provider failed to fetch ice servers, using default');
    } finally {
      const options = {
        mediaConstraints: {
          audio: false,
          video: VIDEO_CONSTRAINTS,
        },
        onicecandidate: this._getOnIceCandidateCallback(id, shareWebcam),
      };

      if (iceServers.length > 0) {
        options.configuration = {};
        options.configuration.iceServers = iceServers;
      }

      let WebRtcPeerObj = window.kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly;

      if (shareWebcam) {
        WebRtcPeerObj = window.kurentoUtils.WebRtcPeer.WebRtcPeerSendonly;
        this.shareWebcam();
      }

      this.webRtcPeers[id] = new WebRtcPeerObj(options, (error) => {
        const peer = this.webRtcPeers[id];

        peer.started = false;
        peer.attached = false;
        peer.didSDPAnswered = false;
        if (peer.iceQueue == null) {
          peer.iceQueue = [];
        }

        if (error) {
          return this._webRTCOnError(error, id, shareWebcam);
        }

        peer.generateOffer((errorGenOffer, offerSdp) => {
          if (errorGenOffer) {
            return this._webRTCOnError(errorGenOffer, id, shareWebcam);
          }

          this.logger('debug', `Invoking SDP offer callback function ${location.host}`, { cameraId: id, offerSdp });

          const message = {
            type: 'video',
            role: shareWebcam ? 'share' : 'viewer',
            id: 'start',
            sdpOffer: offerSdp,
            cameraId: id,
            meetingId,
          };
          this.sendMessage(message);

          this._processIceQueue(peer, id);

          peer.didSDPAnswered = true;
        });
      });
      this.webRtcPeers[id].peerConnection.oniceconnectionstatechange =
        this._getOnIceConnectionStateChangeCallback(id);
    }
  }

  _getWebRTCStartTimeout(id, shareWebcam, peer) {
    const { intl } = this.props;

    return () => {
      this.logger('error', `Camera share has not suceeded in ${CAMERA_SHARE_FAILED_WAIT_TIME}`, { cameraId: id });

      if (this.props.userId === id) {
        this.notifyError(intl.formatMessage(intlClientErrors.sharingError));
        this.unshareWebcam();
        this.destroyWebRTCPeer(id);
      } else {
        const tag = this.webRtcPeers[id].videoTag;

        this.stopWebRTCPeer(id);
        this.createWebRTCPeer(id, shareWebcam);

        // We reattach the peer for a real video restart
        this.attachVideoStream(id);

        // Increment reconnect interval
        this.restartTimer[id] = Math.min(2 * this.restartTimer[id], MAX_CAMERA_SHARE_FAILED_WAIT_TIME);
      }
    };
  }

  _processIceQueue(peer, cameraId) {
    const { intl } = this.props;

    while (peer.iceQueue.length) {
      const candidate = peer.iceQueue.shift();
      peer.addIceCandidate(candidate, (err) => {
        if (err) {
          this.notifyError(intl.formatMessage(intlClientErrors.iceCandidateError));
          return this.logger('error', `Error adding candidate: ${err}`, { cameraId });
        }
      });
    }
  }

  _webRTCOnError(error, id, shareWebcam) {
    const { intl } = this.props;

    this.logger('error', ' WebRTC peerObj create error', id);
    this.logger('error', error, id);
    const errorMessage = intlClientErrors[error.name]
      || intlClientErrors.permissionError;
    this.notifyError(intl.formatMessage(errorMessage));
    /* This notification error is displayed considering kurento-utils
     * returned the error 'The request is not allowed by the user agent
     * or the platform in the current context.', but there are other
     * errors that could be returned. */

    this.stopWebRTCPeer(id);

    return this.logger('error', errorMessage, { cameraId: id });
  }

  _getOnIceCandidateCallback(id, shareWebcam) {
    const peer = this.webRtcPeers[id];

    return (candidate) => {
      // Setup a timeout only when ice first is generated
      if (!this.restartTimeout[id]) {
        this.restartTimer[id] = this.restartTimer[id] || CAMERA_SHARE_FAILED_WAIT_TIME;

        this.logger('debug', `Setting a camera connection restart in ${this.restartTimer[id]}`, { cameraId: id });
        this.restartTimeout[id] = setTimeout(this._getWebRTCStartTimeout(id, shareWebcam, peer), this.restartTimer[id]);
      }

      this.logger('debug', 'Generated local ice candidate', { topic: 'ice', candidate });

      const message = {
        type: 'video',
        role: shareWebcam ? 'share' : 'viewer',
        id: 'onIceCandidate',
        candidate,
        cameraId: id,
      };
      this.sendMessage(message);
    };
  }

  _getOnIceConnectionStateChangeCallback(id) {
    const { intl } = this.props;
    const peer = this.webRtcPeers[id];

    return (event) => {
      const connectionState = peer.peerConnection.iceConnectionState;
      if (connectionState === 'failed' || connectionState === 'closed') {

        // prevent the same error from being detected multiple times
        peer.peerConnection.oniceconnectionstatechange = null;

        this.logger('error', 'ICE connection state', id);
        this.stopWebRTCPeer(id);
        this.notifyError(intl.formatMessage(intlClientErrors.iceConnectionStateError));
      }
    };
  }

  attachVideoStream(id) {
    const video = this.videoTags[id];
    if (video == null) {
      this.logger('warn', 'Peer', id, 'has not been started yet');
      return;
    }

    if (video.srcObject) {
      delete this.videoTags[id];
      return; // Skip if the stream is already attached
    }

    const isCurrent = id === this.props.userId;
    const peer = this.webRtcPeers[id];

    const attachVideoStreamHelper = () => {
      const stream = isCurrent ? peer.getLocalStream() : peer.getRemoteStream();
      video.pause();
      video.srcObject = stream;
      video.load();

      peer.attached = true;
      delete this.videoTags[id];
    };


    // If peer has started playing attach to tag, otherwise wait a while
    if (peer) {
      if (peer.started) {
        attachVideoStreamHelper();
      }

      // So we can start it later when we get a playStart
      // or if we need to do a restart timeout
      peer.videoTag = video;
    }
  }

  createVideoTag(id, video) {
    const peer = this.webRtcPeers[id];
    this.videoTags[id] = video;

    if (peer) {
      this.attachVideoStream(id);
    }
  }

  customGetStats(peer, mediaStreamTrack, callback, interval) {
    const statsState = this.state.stats;
    let promise;
    try {
      promise = peer.getStats(mediaStreamTrack);
    } catch (e) {
      promise = Promise.reject(e);
    }
    promise.then((results) => {
      let videoInOrOutbound = {};
      results.forEach((res) => {
        if (res.type === 'ssrc' || res.type === 'inbound-rtp' || res.type === 'outbound-rtp') {
          res.packetsSent = parseInt(res.packetsSent);
          res.packetsLost = parseInt(res.packetsLost) || 0;
          res.packetsReceived = parseInt(res.packetsReceived);

          if ((isNaN(res.packetsSent) && res.packetsReceived === 0)
            || (res.type === 'outbound-rtp' && res.isRemote)) {
            return; // Discard local video receiving
          }

          if (res.googFrameWidthReceived) {
            res.width = parseInt(res.googFrameWidthReceived);
            res.height = parseInt(res.googFrameHeightReceived);
          } else if (res.googFrameWidthSent) {
            res.width = parseInt(res.googFrameWidthSent);
            res.height = parseInt(res.googFrameHeightSent);
          }

          // Extra fields available on Chrome
          if (res.googCodecName) res.codec = res.googCodecName;
          if (res.googDecodeMs) res.decodeDelay = res.googDecodeMs;
          if (res.googEncodeUsagePercent) res.encodeUsagePercent = res.googEncodeUsagePercent;
          if (res.googRtt) res.rtt = res.googRtt;
          if (res.googCurrentDelayMs) res.currentDelay = res.googCurrentDelayMs;

          videoInOrOutbound = res;
        }
      });

      const videoStats = {
        timestamp: videoInOrOutbound.timestamp,
        bytesReceived: videoInOrOutbound.bytesReceived,
        bytesSent: videoInOrOutbound.bytesSent,
        packetsReceived: videoInOrOutbound.packetsReceived,
        packetsLost: videoInOrOutbound.packetsLost,
        packetsSent: videoInOrOutbound.packetsSent,
        decodeDelay: videoInOrOutbound.decodeDelay,
        codec: videoInOrOutbound.codec,
        height: videoInOrOutbound.height,
        width: videoInOrOutbound.width,
        encodeUsagePercent: videoInOrOutbound.encodeUsagePercent,
        rtt: videoInOrOutbound.rtt,
        currentDelay: videoInOrOutbound.currentDelay,
      };

      const videoStatsArray = statsState;
      videoStatsArray.push(videoStats);
      while (videoStatsArray.length > 5) { // maximum interval to consider
        videoStatsArray.shift();
      }
      this.setState({ stats: videoStatsArray });

      const firstVideoStats = videoStatsArray[0];
      const lastVideoStats = videoStatsArray[videoStatsArray.length - 1];

      const videoIntervalPacketsLost = lastVideoStats.packetsLost - firstVideoStats.packetsLost;
      const videoIntervalPacketsReceived = lastVideoStats.packetsReceived - firstVideoStats.packetsReceived;
      const videoIntervalPacketsSent = lastVideoStats.packetsSent - firstVideoStats.packetsSent;
      const videoIntervalBytesReceived = lastVideoStats.bytesReceived - firstVideoStats.bytesReceived;
      const videoIntervalBytesSent = lastVideoStats.bytesSent - firstVideoStats.bytesSent;

      const videoReceivedInterval = lastVideoStats.timestamp - firstVideoStats.timestamp;
      const videoSentInterval = lastVideoStats.timestamp - firstVideoStats.timestamp;

      const videoKbitsReceivedPerSecond = (videoIntervalBytesReceived * 8) / videoReceivedInterval;
      const videoKbitsSentPerSecond = (videoIntervalBytesSent * 8) / videoSentInterval;
      const videoPacketDuration = (videoIntervalPacketsSent / videoSentInterval) * 1000;

      let videoLostPercentage,
        videoLostRecentPercentage,
        videoBitrate;
      if (videoStats.packetsReceived > 0) { // Remote video
        videoLostPercentage = ((videoStats.packetsLost / ((videoStats.packetsLost + videoStats.packetsReceived) * 100)) || 0).toFixed(1);
        videoBitrate = Math.floor(videoKbitsReceivedPerSecond || 0);
        videoLostRecentPercentage = ((videoIntervalPacketsLost / ((videoIntervalPacketsLost + videoIntervalPacketsReceived) * 100)) || 0).toFixed(1);
      } else {
        videoLostPercentage = (((videoStats.packetsLost / (videoStats.packetsLost + videoStats.packetsSent)) * 100) || 0).toFixed(1);
        videoBitrate = Math.floor(videoKbitsSentPerSecond || 0);
        videoLostRecentPercentage = ((videoIntervalPacketsLost / ((videoIntervalPacketsLost + videoIntervalPacketsSent) * 100)) || 0).toFixed(1);
      }

      const result = {
        video: {
          bytesReceived: videoStats.bytesReceived,
          bytesSent: videoStats.bytesSent,
          packetsLost: videoStats.packetsLost,
          packetsReceived: videoStats.packetsReceived,
          packetsSent: videoStats.packetsSent,
          bitrate: videoBitrate,
          lostPercentage: videoLostPercentage,
          lostRecentPercentage: videoLostRecentPercentage,
          height: videoStats.height,
          width: videoStats.width,
          codec: videoStats.codec,
          decodeDelay: videoStats.decodeDelay,
          encodeUsagePercent: videoStats.encodeUsagePercent,
          rtt: videoStats.rtt,
          currentDelay: videoStats.currentDelay,
        },
      };

      callback(result);
    }, (exception) => {
      this.logger('error', `customGetStats() Promise rejected: ${exception.message}`);
      callback(null);
    });
  }

  monitorTrackStart(peer, track, local, callback) {
    const that = this;
    this.logger('info', 'Starting stats monitoring on', { cameraId: track.id });
    const getStatsInterval = 2000;

    const callGetStats = () => {
      that.customGetStats(
        peer,
        track,
        (results) => {
          if (results == null || peer.signalingState === 'closed') {
            that.monitorTrackStop(track.id);
          } else {
            callback(results);
          }
        },
        getStatsInterval,
      );
    };

    if (!this.monitoredTracks[track.id]) {
      callGetStats();
      this.monitoredTracks[track.id] = setInterval(
        callGetStats,
        getStatsInterval,
      );
    } else {
      this.logger('info', 'Already monitoring this track');
    }
  }

  monitorTrackStop(trackId) {
    if (this.monitoredTracks[trackId]) {
      clearInterval(this.monitoredTracks[trackId]);
      delete this.monitoredTracks[trackId];
      this.logger('info', `Track ${trackId} removed`);
    } else {
      this.logger('info', `Track ${trackId} is not monitored`);
    }
  }

  getStats(id, video, callback) {
    const peer = this.webRtcPeers[id];

    const hasLocalStream = peer && peer.started === true && peer.peerConnection.getLocalStreams().length > 0;
    const hasRemoteStream = peer && peer.started === true && peer.peerConnection.getRemoteStreams().length > 0;

    if (hasLocalStream) {
      this.monitorTrackStart(peer.peerConnection, peer.peerConnection.getLocalStreams()[0].getVideoTracks()[0], true, callback);
    } else if (hasRemoteStream) {
      this.monitorTrackStart(peer.peerConnection, peer.peerConnection.getRemoteStreams()[0].getVideoTracks()[0], false, callback);
    }
  }

  stopGettingStats(id) {
    const peer = this.webRtcPeers[id];

    const hasLocalStream = peer && peer.started === true && peer.peerConnection.getLocalStreams().length > 0;
    const hasRemoteStream = peer && peer.started === true && peer.peerConnection.getRemoteStreams().length > 0;

    if (hasLocalStream) {
      this.monitorTrackStop(peer.peerConnection.getLocalStreams()[0].getVideoTracks()[0].id);
    } else if (hasRemoteStream) {
      this.monitorTrackStop(peer.peerConnection.getRemoteStreams()[0].getVideoTracks()[0].id);
    }
  }

  handlePlayStop(message) {
    const { cameraId } = message;

    this.logger('info', 'Handle play stop for camera', { cameraId });
    this.stopWebRTCPeer(cameraId);
  }

  handlePlayStart(message) {
    const id = message.cameraId;
    const peer = this.webRtcPeers[id];
    const videoTag = this.videoTags[id];

    if (peer) {
      this.logger('info', 'Handle play start for camera', { cameraId: id });

      // Clear camera shared timeout when camera succesfully starts
      clearTimeout(this.restartTimeout[id]);
      delete this.restartTimeout[id];
      delete this.restartTimer[id];

      peer.started = true;

      if (!peer.attached) {
        this.attachVideoStream(id);
      }

      if (id === this.props.userId) {
        VideoService.sendUserShareWebcam(id);
        VideoService.joinedVideo();
      }
    } else {
      this.logger('warn', '[playStart] Message arrived after the peer was already thrown out, discarding it...');
    }
  }

  handleSFUError(message) {
    const { intl } = this.props;
    const { userId } = this.props;
    const { code, reason } = message;
    this.logger('debug', 'Received error from SFU:', code, reason, message.streamId, userId);
    if (message.streamId === userId) {
      this.unshareWebcam();
      this.notifyError(intl.formatMessage(intlSFUErrors[code]
        || intlClientErrors.sharingError));
    } else {
      this.stopWebRTCPeer(message.cameraId);
    }

    this.logger('error', `Handle error ---------------------> ${message.message}`);
  }

  notifyError(message) {
    notify(message, 'error', 'video');
  }

  shareWebcam() {
    const { intl } = this.props;

    if (this.connectedToMediaServer()) {
      this.logger('info', 'Sharing webcam');
      this.sharedWebcam = true;
      VideoService.joiningVideo();
    } else {
      this.logger('debug', 'Error on sharing webcam');
      this.notifyError(intl.formatMessage(intlClientErrors.sharingError));
    }
  }

  unshareWebcam() {
    this.logger('info', 'Unsharing webcam');

    VideoService.sendUserUnshareWebcam(this.props.userId);
    VideoService.exitedVideo();
    this.sharedWebcam = false;
  }

  render() {
    if (!this.state.socketOpen) return null;

    return (
      <VideoList
        users={this.props.users}
        onMount={this.createVideoTag.bind(this)}
        getStats={this.getStats.bind(this)}
        stopGettingStats={this.stopGettingStats.bind(this)}
        enableVideoStats={this.props.enableVideoStats}
      />
    );
  }
}

export default injectIntl(VideoProvider);
