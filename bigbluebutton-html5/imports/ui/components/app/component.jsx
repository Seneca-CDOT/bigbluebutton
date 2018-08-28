import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import Modal from 'react-modal';
import cx from 'classnames';
import Resizable from 're-resizable';
import browser from 'browser-detect';
import ToastContainer from '../toast/container';
import ModalContainer from '../modal/container';
import NotificationsBarContainer from '../notifications-bar/container';
import AudioContainer from '../audio/container';
import ChatAlertContainer from '../chat/alert/container';
import { styles } from './styles';

const MOBILE_MEDIA = 'only screen and (max-width: 40em)';
const USERLIST_COMPACT_WIDTH = 50;

const intlMessages = defineMessages({
  userListLabel: {
    id: 'app.userList.label',
    description: 'Aria-label for Userlist Nav',
  },
  chatLabel: {
    id: 'app.chat.label',
    description: 'Aria-label for Chat Section',
  },
  mediaLabel: {
    id: 'app.media.label',
    description: 'Aria-label for Media Section',
  },
  actionsBarLabel: {
    id: 'app.actionsBar.label',
    description: 'Aria-label for ActionsBar Section',
  },
});

const propTypes = {
  fontSize: PropTypes.string,
  navbar: PropTypes.element,
  sidebar: PropTypes.element,
  media: PropTypes.element,
  actionsbar: PropTypes.element,
  closedCaption: PropTypes.element,
  userList: PropTypes.element,
  chat: PropTypes.element,
  locale: PropTypes.string,
  intl: intlShape.isRequired,
};

const defaultProps = {
  fontSize: '16px',
  navbar: null,
  sidebar: null,
  media: null,
  actionsbar: null,
  closedCaption: null,
  userList: null,
  chat: null,
  locale: 'en',
};

class App extends Component {
  constructor() {
    super();

    this.state = {
      compactUserList: false,
      enableResize: !window.matchMedia(MOBILE_MEDIA).matches,
    };

    this.handleWindowResize = throttle(this.handleWindowResize).bind(this);
  }

  componentDidMount() {
    const { locale } = this.props;

    Modal.setAppElement('#app');
    document.getElementsByTagName('html')[0].lang = locale;
    document.getElementsByTagName('html')[0].style.fontSize = this.props.fontSize;

    const BROWSER_RESULTS = browser();
    const body = document.getElementsByTagName('body')[0];
    if (BROWSER_RESULTS && BROWSER_RESULTS.name) {
      body.classList.add(`browser-${BROWSER_RESULTS.name}`);
    }
    if (BROWSER_RESULTS && BROWSER_RESULTS.os) {
      body.classList.add(`os-${BROWSER_RESULTS.os.split(' ').shift().toLowerCase()}`);
    }

    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize, false);
  }

  handleWindowResize() {
    const { enableResize } = this.state;
    const shouldEnableResize = !window.matchMedia(MOBILE_MEDIA).matches;
    if (enableResize === shouldEnableResize) return;

    this.setState({ enableResize: shouldEnableResize });
  }

  renderNavBar() {
    const { navbar } = this.props;

    if (!navbar) return null;

    return (
      <header className={styles.navbar}>
        {navbar}
      </header>
    );
  }

  renderSidebar() {
    const { sidebar } = this.props;

    if (!sidebar) return null;

    return (
      <aside className={styles.sidebar}>
        {sidebar}
      </aside>
    );
  }

  renderClosedCaption() {
    const { closedCaption } = this.props;

    if (!closedCaption) return null;

    return (
      <div className={styles.closedCaptionBox}>
        {closedCaption}
      </div>
    );
  }

  renderUserList() {
    const { intl, chatIsOpen } = this.props;
    let { userList } = this.props;
    const { compactUserList } = this.state;

    if (!userList) return null;

    const userListStyle = {};
    userListStyle[styles.compact] = compactUserList;
    userList = React.cloneElement(userList, {
      compact: compactUserList,
    });

    return (
      <div
        className={cx(styles.userList, userListStyle)}
        aria-label={intl.formatMessage(intlMessages.userListLabel)}
        aria-hidden={chatIsOpen}
      >
        {userList}
      </div>
    );
  }

  renderUserListResizable() {
    const { userList } = this.props;

    // Variables for resizing user-list.
    const USERLIST_MIN_WIDTH_PX = 100;
    const USERLIST_MAX_WIDTH_PX = 240;
    const USERLIST_DEFAULT_WIDTH_RELATIVE = 18;

    // decide whether using pixel or percentage unit as a default width for userList
    const USERLIST_DEFAULT_WIDTH = (window.innerWidth * (USERLIST_DEFAULT_WIDTH_RELATIVE / 100.0)) < USERLIST_MAX_WIDTH_PX ? `${USERLIST_DEFAULT_WIDTH_RELATIVE}%` : USERLIST_MAX_WIDTH_PX;

    if (!userList) return null;

    const resizableEnableOptions = {
      top: false,
      right: true,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    };

    return (
      <Resizable
        defaultSize={{ width: USERLIST_DEFAULT_WIDTH }}
        minWidth={USERLIST_MIN_WIDTH_PX}
        maxWidth={USERLIST_MAX_WIDTH_PX}
        ref={(node) => { this.resizableUserList = node; }}
        className={styles.resizableUserList}
        enable={resizableEnableOptions}
        onResize={(e, direction, ref) => {
          const { compactUserList } = this.state;
          const shouldBeCompact = ref.clientWidth <= USERLIST_COMPACT_WIDTH;
          if (compactUserList === shouldBeCompact) return;
          this.setState({ compactUserList: shouldBeCompact });
        }}
      >
        {this.renderUserList()}
      </Resizable>
    );
  }

  renderChat() {
    const { chat, intl } = this.props;

    if (!chat) return null;

    return (
      <section
        className={styles.chat}
        aria-label={intl.formatMessage(intlMessages.chatLabel)}
      >
        {chat}
      </section>
    );
  }

  renderChatResizable() {
    const { chat } = this.props;

    // Variables for resizing chat.
    const CHAT_MIN_WIDTH_PX = 180;
    const CHAT_MAX_WIDTH_PX = 310;
    const CHAT_DEFAULT_WIDTH_RELATIVE = 25;

    // decide whether using pixel or percentage unit as a default width for chat
    const CHAT_DEFAULT_WIDTH = (window.innerWidth * (CHAT_DEFAULT_WIDTH_RELATIVE / 100.0)) < CHAT_MAX_WIDTH_PX ? `${CHAT_DEFAULT_WIDTH_RELATIVE}%` : CHAT_MAX_WIDTH_PX;

    if (!chat) return null;

    const resizableEnableOptions = {
      top: false,
      right: true,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    };

    return (
      <Resizable
        defaultSize={{ width: CHAT_DEFAULT_WIDTH }}
        minWidth={CHAT_MIN_WIDTH_PX}
        maxWidth={CHAT_MAX_WIDTH_PX}
        ref={(node) => { this.resizableChat = node; }}
        className={styles.resizableChat}
        enable={resizableEnableOptions}
      >
        {this.renderChat()}
      </Resizable>
    );
  }

  renderMedia() {
    const {
      media, intl, chatIsOpen, userlistIsOpen,
    } = this.props;

    if (!media) return null;

    return (
      <section
        className={styles.media}
        aria-label={intl.formatMessage(intlMessages.mediaLabel)}
        aria-hidden={userlistIsOpen || chatIsOpen}
      >
        {media}
        {this.renderClosedCaption()}
      </section>
    );
  }

  renderActionsBar() {
    const {
      actionsbar, intl, userlistIsOpen, chatIsOpen,
    } = this.props;

    if (!actionsbar) return null;

    return (
      <section
        className={styles.actionsbar}
        aria-label={intl.formatMessage(intlMessages.actionsBarLabel)}
        aria-hidden={userlistIsOpen || chatIsOpen}
      >
        {actionsbar}
      </section>
    );
  }

  render() {
    const { params, userlistIsOpen } = this.props;
    const { enableResize } = this.state;

    return (
      <main className={styles.main}>
        <NotificationsBarContainer />
        <section className={styles.wrapper}>
          <div className={styles.content}>
            {this.renderNavBar()}
            {this.renderMedia()}
            {this.renderActionsBar()}
          </div>
          {enableResize ? this.renderUserListResizable() : this.renderUserList()}
          {userlistIsOpen && enableResize ? <div className={styles.userlistPad} /> : null}
          {enableResize ? this.renderChatResizable() : this.renderChat()}
          {this.renderSidebar()}
        </section>
        <ModalContainer />
        <AudioContainer />
        <ToastContainer />
        <ChatAlertContainer currentChatID={params.chatID} />
      </main>
    );
  }
}

App.propTypes = propTypes;
App.defaultProps = defaultProps;

export default injectIntl(App);
