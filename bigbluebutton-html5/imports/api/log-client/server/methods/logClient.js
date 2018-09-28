import Logger from '/imports/startup/server/logger';
import Users from '/imports/api/users';

const logClient = function (type, log, fullInfo = {}) {
  const SERVER_CONN_ID = this.connection.id;
  const User = Users.findOne({ connectionId: SERVER_CONN_ID });
  const logContents = { fullInfo };

  if (User) {
    if ((fullInfo.credentials && User.meetingId === fullInfo.credentials.meetingId) ||
      ((fullInfo.meetingId && User.meetingId === fullInfo.meetingId))) {
      logContents.validUser = 'valid';
    } else {
      logContents.validUser = 'invalid';
    }
  } else {
    logContents.validUser = 'notFound';
  }

  const topic = typeof logContents == 'Object' ? logContents.topic : null;

  if (typeof log === 'string' || log instanceof String) {
    Logger.log(type, `${topic || 'CLIENT'} LOG: ${log}\n`, logContents);
  } else {
    Logger.log(type, `${topic || 'CLIENT'} LOG: ${JSON.stringify(log)}\n`, logContents);
  }
};

export default logClient;
