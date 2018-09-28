import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cx from 'classnames';
import Icon from '/imports/ui/components/icon/component';
import BreakoutJoinConfirmation from '/imports/ui/components/breakout-join-confirmation/container';
import Dropdown from '/imports/ui/components/dropdown/component';
import DropdownTrigger from '/imports/ui/components/dropdown/trigger/component';
import DropdownContent from '/imports/ui/components/dropdown/content/component';
import DropdownList from '/imports/ui/components/dropdown/list/component';
import DropdownListItem from '/imports/ui/components/dropdown/list/item/component';
import { withModalMounter } from '/imports/ui/components/modal/service';
import { defineMessages, injectIntl } from 'react-intl';
import { styles } from './styles.scss';
import Button from '../button/component';
import RecordingIndicator from './recording-indicator/component';
import SettingsDropdownContainer from './settings-dropdown/container';

const intlMessages = defineMessages({
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  },
  recordingSession: {
    id: 'app.navBar.recording',
    description: 'label for when the session is being recorded',
  },
  recordingIndicatorOn: {
    id: 'app.navBar.recording.on',
    description: 'label for indicator when the session is being recorded',
  },
  recordingIndicatorOff: {
    id: 'app.navBar.recording.off',
    description: 'label for indicator when the session is not being recorded',
  },
});

const propTypes = {
  presentationTitle: PropTypes.string.isRequired,
  hasUnreadMessages: PropTypes.bool.isRequired,
  beingRecorded: PropTypes.object.isRequired,
};

const defaultProps = {
  presentationTitle: 'Default Room Title',
  hasUnreadMessages: false,
  beingRecorded: false,
};

const SHORTCUTS_CONFIG = Meteor.settings.public.app.shortcuts;
const TOGGLE_USERLIST_AK = SHORTCUTS_CONFIG.toggleUserList.accesskey;

const openBreakoutJoinConfirmation = (breakout, breakoutName, mountModal) =>
  mountModal(<BreakoutJoinConfirmation
    breakout={breakout}
    breakoutName={breakoutName}
  />);

const closeBreakoutJoinConfirmation = mountModal =>
  mountModal(null);

class NavBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isActionsOpen: false,
      didSendBreakoutInvite: false,
    };

    this.handleToggleUserList = this.handleToggleUserList.bind(this);
  }

  handleToggleUserList() {
    this.props.toggleUserList();
  }

  componentDidUpdate(oldProps) {
    const {
      breakouts,
      getBreakoutJoinURL,
      isBreakoutRoom,
    } = this.props;

    const hadBreakouts = oldProps.breakouts.length;
    const hasBreakouts = breakouts.length;

    if (!hasBreakouts && hadBreakouts) {
      closeBreakoutJoinConfirmation(this.props.mountModal);
    }

    breakouts.forEach((breakout) => {
      if (!breakout.users) {
        return;
      }

      if (!this.state.didSendBreakoutInvite && !isBreakoutRoom) {
        this.inviteUserToBreakout(breakout);
      }
    });

    if (!breakouts.length && this.state.didSendBreakoutInvite) {
      this.setState({ didSendBreakoutInvite: false });
    }
  }

  inviteUserToBreakout(breakout) {
    const {
      mountModal,
    } = this.props;

    this.setState({ didSendBreakoutInvite: true }, () => {
      openBreakoutJoinConfirmation.call(this, breakout, breakout.name, mountModal);
    });
  }

  renderPresentationTitle() {
    const {
      breakouts,
      isBreakoutRoom,
      presentationTitle,
    } = this.props;

    if (isBreakoutRoom || !breakouts.length) {
      return (
        <h1 className={styles.presentationTitle}>{presentationTitle}</h1>
      );
    }
    const breakoutItems = breakouts.map(breakout => this.renderBreakoutItem(breakout));

    return (
      <Dropdown isOpen={this.state.isActionsOpen}>
        <DropdownTrigger>
          <h1 className={cx(styles.presentationTitle, styles.dropdownBreakout)}>
            {presentationTitle} <Icon iconName="down-arrow" />
          </h1>
        </DropdownTrigger>
        <DropdownContent
          placement="bottom"
        >
          <DropdownList>
            {breakoutItems}
          </DropdownList>
        </DropdownContent>
      </Dropdown>
    );
  }

  renderBreakoutItem(breakout) {
    const {
      mountModal,
    } = this.props;

    const breakoutName = breakout.name;

    return (
      <DropdownListItem
        className={styles.actionsHeader}
        key={_.uniqueId('action-header')}
        label={breakoutName}
        onClick={openBreakoutJoinConfirmation.bind(this, breakout, breakoutName, mountModal)}
      />
    );
  }

  render() {
    const {
      hasUnreadMessages, beingRecorded, isExpanded, intl,
    } = this.props;

    const recordingMessage = beingRecorded.recording ? 'recordingIndicatorOn' : 'recordingIndicatorOff';

    const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages;

    return (
      <div className={styles.navbar}>
        <div className={styles.left}>
          <Button
            data-test="userListToggleButton"
            onClick={this.handleToggleUserList}
            ghost
            circle
            hideLabel
            label={intl.formatMessage(intlMessages.toggleUserListLabel)}
            aria-label={intl.formatMessage(intlMessages.toggleUserListAria)}
            icon="user"
            className={cx(toggleBtnClasses)}
            aria-expanded={isExpanded}
            aria-describedby="newMessage"
            accessKey={TOGGLE_USERLIST_AK}
          />
          <div
            id="newMessage"
            aria-label={hasUnreadMessages ? intl.formatMessage(intlMessages.newMessages) : null}
          />
        </div>
        <div className={styles.center}>
          {this.renderPresentationTitle()}
          {beingRecorded.record ?
            <span className={styles.presentationTitleSeparator}>|</span>
          : null}
          <RecordingIndicator
            {...beingRecorded}
            title={intl.formatMessage(intlMessages[recordingMessage])}
          />
        </div>
        <div className={styles.right}>
          <SettingsDropdownContainer />
        </div>
      </div>
    );
  }
}

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default withModalMounter(injectIntl(NavBar));
