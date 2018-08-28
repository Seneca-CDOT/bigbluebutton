import React from 'react';
import PropTypes from 'prop-types';
import { styles } from './styles';
import UserParticipants from './user-participants/component';
import UserMessages from './user-messages/component';

const propTypes = {
  openChats: PropTypes.arrayOf(String).isRequired,
  users: PropTypes.arrayOf(Object).isRequired,
  compact: PropTypes.bool,
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({}).isRequired,
  meeting: PropTypes.shape({}),
  isBreakoutRoom: PropTypes.bool,
  getAvailableActions: PropTypes.func.isRequired,
  normalizeEmojiName: PropTypes.func.isRequired,
  isMeetingLocked: PropTypes.func.isRequired,
  isPublicChat: PropTypes.func.isRequired,
  setEmojiStatus: PropTypes.func.isRequired,
  assignPresenter: PropTypes.func.isRequired,
  removeUser: PropTypes.func.isRequired,
  toggleVoice: PropTypes.func.isRequired,
  changeRole: PropTypes.func.isRequired,
  roving: PropTypes.func.isRequired,
};

const defaultProps = {
  compact: false,
  isBreakoutRoom: false,
  // This one is kinda tricky, meteor takes sometime to fetch the data and passing down
  // So the first time its create, the meeting comes as null, sending an error to the client.
  meeting: {},
};

class UserContent extends React.PureComponent {
  render() {
    const {
      users,
      compact,
      intl,
      currentUser,
      meeting,
      isBreakoutRoom,
      setEmojiStatus,
      assignPresenter,
      removeUser,
      toggleVoice,
      changeRole,
      getAvailableActions,
      normalizeEmojiName,
      isMeetingLocked,
      roving,
      handleEmojiChange,
      getEmojiList,
      getEmoji,
      isPublicChat,
      openChats,
    } = this.props;

    return (
      <div
        data-test="userListContent"
        className={styles.content}
        role="complementary"
      >
        <UserMessages
          {...{
            isPublicChat,
            openChats,
            compact,
            intl,
            roving,
          }}
        />
        <UserParticipants
          {...{
            users,
            compact,
            intl,
            currentUser,
            meeting,
            isBreakoutRoom,
            setEmojiStatus,
            assignPresenter,
            removeUser,
            toggleVoice,
            changeRole,
            getAvailableActions,
            normalizeEmojiName,
            isMeetingLocked,
            roving,
            handleEmojiChange,
            getEmojiList,
            getEmoji,
          }}
        />
      </div>
    );
  }
}

UserContent.propTypes = propTypes;
UserContent.defaultProps = defaultProps;

export default UserContent;
