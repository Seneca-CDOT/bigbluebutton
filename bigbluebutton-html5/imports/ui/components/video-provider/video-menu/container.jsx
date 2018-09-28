import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { defineMessages, injectIntl } from 'react-intl';
import JoinVideoOptions from './component';
import VideoMenuService from './service';

const intlMessages = defineMessages({
  joinVideo: {
    id: 'app.video.joinVideo',
    description: 'Join video button label',
  },
  leaveVideo: {
    id: 'app.video.leaveVideo',
    description: 'Leave video button label',
  },
  swapCam: {
    id: 'app.video.swapCam',
    description: 'Swap cam button label',
  },
  swapCamDesc: {
    id: 'app.video.swapCamDesc',
    description: 'Swap cam button description',
  },
});

const JoinVideoOptionsContainer = (props) => {
  const {
    isSharingVideo,
    isDisabled,
    handleJoinVideo,
    handleCloseVideo,
    toggleSwapLayout,
    swapLayoutAllowed,
    baseName,
    intl,
    ...restProps
  } = props;
  const videoItems = [
    {
      iconPath: `${baseName}/resources/images/video-menu/icon-swap.svg`,
      description: intl.formatMessage(intlMessages.swapCamDesc),
      label: intl.formatMessage(intlMessages.swapCam),
      disabled: !swapLayoutAllowed,
      click: toggleSwapLayout,
      id: 'swap-button',
    },
    {
      iconPath: `${baseName}/resources/images/video-menu/icon-webcam-off.svg`,
      description: intl.formatMessage(intlMessages[isSharingVideo ? 'leaveVideo' : 'joinVideo']),
      label: intl.formatMessage(intlMessages[isSharingVideo ? 'leaveVideo' : 'joinVideo']),
      disabled: isDisabled && !isSharingVideo,
      click: isSharingVideo ? handleCloseVideo : handleJoinVideo,
      id: isSharingVideo ? 'leave-video-button' : 'join-video-button',
    },
  ];

  return <JoinVideoOptions {...{ videoItems, isSharingVideo, ...restProps }} />;
};

export default injectIntl(withTracker(() => ({
  baseName: VideoMenuService.baseName,
  isSharingVideo: VideoMenuService.isSharingVideo(),
  isDisabled: VideoMenuService.isDisabled(),
  videoShareAllowed: VideoMenuService.videoShareAllowed(),
  toggleSwapLayout: VideoMenuService.toggleSwapLayout,
  swapLayoutAllowed: VideoMenuService.swapLayoutAllowed(),
}))(JoinVideoOptionsContainer));
