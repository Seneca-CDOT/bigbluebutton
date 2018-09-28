import { check } from 'meteor/check';
import Users from '/imports/api/users';
import Logger from '/imports/startup/server/logger';
import ejectUserFromVoice from '/imports/api/voice-users/server/methods/ejectUserFromVoice';

const clearAllSessions = (sessionUserId) => {
  const serverSessions = Meteor.server.sessions;
  Object.keys(serverSessions)
    .filter(i => serverSessions[i].userId === sessionUserId)
    .forEach(i => serverSessions[i].close());
};

export default function removeUser(meetingId, userId) {
  check(meetingId, String);
  check(userId, String);

  const selector = {
    meetingId,
    userId,
  };

  const modifier = {
    $set: {
      connectionStatus: 'offline',
      validated: false,
      emoji: 'none',
      presenter: false,
      role: 'VIEWER',
    },
  };

  const cb = (err) => {
    if (err) {
      return Logger.error(`Removing user from collection: ${err}`);
    }

    const sessionUserId = `${meetingId}-${userId}`;
    clearAllSessions(sessionUserId);

    ejectUserFromVoice({
      requesterUserId: userId,
      meetingId,
    }, userId);

    return Logger.info(`Removed user id=${userId} meeting=${meetingId}`);
  };

  return Users.update(selector, modifier, cb);
}
