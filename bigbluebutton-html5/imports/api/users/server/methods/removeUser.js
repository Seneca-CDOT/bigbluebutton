import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import RedisPubSub from '/imports/startup/server/redis';

export default function removeUser(credentials, userId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'EjectUserFromMeetingCmdMsg';

  const { requesterUserId, meetingId } = credentials;

  check(meetingId, String);
  check(requesterUserId, String);
  check(userId, String);

  const payload = {
    userId,
    ejectedBy: requesterUserId,
  };

  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
