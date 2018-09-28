package org.bigbluebutton.lib.user.services {
	
	import org.bigbluebutton.lib.main.models.IUserSession;
	
	public class UsersMessageSender {
		public var userSession:IUserSession;
		
		// The default callbacks of userSession.mainconnection.sendMessage
		private var defaultSuccessResponse:Function = function(result:String):void {
			trace(result);
		};
		
		private var defaultFailureResponse:Function = function(status:String):void {
			trace(status);
		};
		
		public function UsersMessageSender() {
		}
		
		public function kickUser(userID:String):void {
			trace("UsersMessageSender::kickUser() -- Sending [participants.kickUser] message to server.. with message [userID:" + userID + "]");
			var message:Object = new Object();
			message["userID"] = userID;
			userSession.mainConnection.sendMessage("participants.kickUser", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function queryForParticipants():void {
			trace("UsersMessageSender::queryForParticipants() -- Sending [participants.getParticipants] message to server");
			userSession.mainConnection.sendMessage("participants.getParticipants", defaultSuccessResponse, defaultFailureResponse);
		}
		
		public function assignPresenter(userid:String, name:String, assignedBy:String):void {
			trace("UsersMessageSender::assignPresenter() -- Sending [participants.assignPresenter] message to server with message " + "[newPresenterID:" + userid + ", newPresenterName:" + name + ", assignedBy:" + assignedBy + "]");
			var message:Object = new Object();
			message["newPresenterID"] = userid;
			message["newPresenterName"] = name;
			message["assignedBy"] = assignedBy;
			userSession.mainConnection.sendMessage("participants.assignPresenter", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function emojiStatus(userID:String, emoji:String):void {
			var message:Object = new Object();
			message["emojiStatus"] = emoji;
			message["userId"] = userID;
			userSession.mainConnection.sendMessage("participants.userEmojiStatus", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function addStream(userID:String, streamName:String):void {
			trace("UsersMessageSender::addStream() -- Sending [participants.shareWebcam] message to server with message [streamName:" + streamName + "]");
			userSession.mainConnection.sendMessage("participants.shareWebcam", defaultSuccessResponse, defaultFailureResponse, streamName);
		}
		
		public function removeStream(userID:String, streamName:String):void {
			trace("UsersMessageSender::removeStream() -- Sending [participants.unshareWebcam] message to server");
			userSession.mainConnection.sendMessage("participants.unshareWebcam", defaultSuccessResponse, defaultFailureResponse, streamName);
		}
		
		public function queryForRecordingStatus():void {
			trace("UsersMessageSender::queryForRecordingStatus() -- Sending [queryForRecordingStatus] message to server")
			userSession.mainConnection.sendMessage("participants.getRecordingStatus", defaultSuccessResponse, defaultFailureResponse);
		}
		
		public function changeRecordingStatus(userID:String, recording:Boolean):void {
			trace("UsersMessageSender::changeRecordingStatus() -- Sending [changeRecordingStatus] message to server with message [userId:" + userID + ", recording:" + recording + "]");
			var message:Object = new Object();
			message["userId"] = userID;
			message["recording"] = recording;
			userSession.mainConnection.sendMessage("participants.setRecordingStatus", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function muteAllUsers(mute:Boolean):void {
			trace("UsersMessageSender::muteAllUsers() -- Sending [voice.muteAllUsers] message to server. mute=[" + mute + "]");
			var message:Object = new Object();
			message["mute"] = mute;
			userSession.mainConnection.sendMessage("voice.muteAllUsers", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function muteAllUsersExceptPresenter(mute:Boolean):void {
			trace("UsersMessageSender::muteAllUsers() -- Sending [voice.muteAllUsersExceptPresenter] message to server. mute=[" + mute + "]");
			var message:Object = new Object();
			message["mute"] = mute;
			userSession.mainConnection.sendMessage("voice.muteAllUsersExceptPresenter", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function muteUnmuteUser(userid:String, mute:Boolean):void {
			trace("UsersMessageSender::muteUnmuteUser() -- Sending [voice.muteUnmuteUser] message to server with message [userId:" + userid + ", mute:" + mute + "]");
			var message:Object = new Object();
			message["userId"] = userid;
			message["mute"] = mute;
			userSession.mainConnection.sendMessage("voice.muteUnmuteUser", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function ejectUser(userid:String):void {
			trace("UsersMessageSender::ejectUser() -- Sending [voice.kickUSer] message to server with message [userId:" + userid + "]");
			var message:Object = new Object();
			message["userId"] = userid;
			userSession.mainConnection.sendMessage("voice.kickUSer", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function getRoomMuteState():void {
			trace("UsersMessageSender::getRoomMuteState() -- Sending [voice.isRoomMuted] message to server");
			userSession.mainConnection.sendMessage("voice.isRoomMuted", defaultSuccessResponse, defaultFailureResponse);
		}
		
		public function getRoomLockState():void {
			trace("UsersMessageSender::getRoomLockState() -- Sending [lock.isRoomLocked] message to server");
			userSession.mainConnection.sendMessage("lock.isRoomLocked", defaultSuccessResponse, defaultFailureResponse);
		}
		
		public function setAllUsersLock(lock:Boolean, except:Array = null):void {
			trace("UsersMessageSender::setAllUsersLock() -- Sending [setAllUsersLock] message to server");
		}
		
		public function setUserLock(internalUserID:String, lock:Boolean):void {
			trace("UsersMessageSender::setUserLock() -- Sending [setUserLock] message to server - userId: [" + internalUserID + "] lock: [" + lock + "]");
			var message:Object = new Object();
			message["userId"] = internalUserID;
			message["lock"] = lock;
			userSession.mainConnection.sendMessage("lock.setUserLock", defaultSuccessResponse, defaultFailureResponse, message);
		}
		
		public function getLockSettings():void {
			trace("UsersMessageSender::getLockSettings() -- Sending [getLockSettings] message to server");
			userSession.mainConnection.sendMessage("lock.getLockSettings", defaultSuccessResponse, defaultFailureResponse);
		}
		
		public function saveLockSettings(newLockSettings:Object):void {
			trace("UsersMessageSender::saveLockSettings() -- Sending [saveLockSettings] message to server");
			userSession.mainConnection.sendMessage("lock.setLockSettings", defaultSuccessResponse, defaultFailureResponse, newLockSettings);
		}
		
		public function validateToken(internalUserID:String, authToken:String):void {
			trace("UsersMessageSender::validateToken() -- Sending [validateToken] message to server");
			var message:Object = new Object();
			message["userId"] = internalUserID;
			message["authToken"] = authToken;
			userSession.mainConnection.sendMessage("validateToken", defaultSuccessResponse, defaultFailureResponse, message);
		}
	}
}
