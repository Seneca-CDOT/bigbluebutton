import React from 'react';
import cx from 'classnames';
import { styles } from './styles.scss';
import DesktopShare from './desktop-share/component';
import ActionsDropdown from './actions-dropdown/component';
import AudioControlsContainer from '../audio/audio-controls/container';
import JoinVideoOptionsContainer from '../video-provider/video-menu/container';

class ActionsBar extends React.PureComponent {
  render() {
    const {
      isUserPresenter,
      handleExitVideo,
      handleJoinVideo,
      handleShareScreen,
      handleUnshareScreen,
      isVideoBroadcasting,
      isUserModerator,
      recordSettingsList,
      toggleRecording,
    } = this.props;

    const {
      allowStartStopRecording,
      recording: isRecording,
      record,
    } = recordSettingsList;

    const actionBarClasses = {};
    actionBarClasses[styles.centerWithActions] = isUserPresenter;
    actionBarClasses[styles.center] = true;

    return (
      <div className={styles.actionsbar}>
        <div className={styles.left}>
          <ActionsDropdown {...{
            isUserPresenter,
            isUserModerator,
            allowStartStopRecording,
            isRecording,
            record,
            toggleRecording,
          }}
          />
        </div>
        <div className={isUserPresenter ? cx(styles.centerWithActions, actionBarClasses) : styles.center}>
          <AudioControlsContainer />
          {Meteor.settings.public.kurento.enableVideo ?
            <JoinVideoOptionsContainer
              handleJoinVideo={handleJoinVideo}
              handleCloseVideo={handleExitVideo}
            />
            : null}
          <DesktopShare {...{
              handleShareScreen,
              handleUnshareScreen,
              isVideoBroadcasting,
              isUserPresenter,
            }}
          />
        </div>
      </div>
    );
  }
}

export default ActionsBar;
