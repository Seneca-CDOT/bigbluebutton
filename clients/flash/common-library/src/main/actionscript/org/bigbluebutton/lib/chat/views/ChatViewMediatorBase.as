package org.bigbluebutton.lib.chat.views {
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.ui.Keyboard;
	
	import mx.utils.StringUtil;
	
	import org.bigbluebutton.lib.chat.models.ChatMessageVO;
	import org.bigbluebutton.lib.chat.models.Conversation;
	import org.bigbluebutton.lib.chat.models.IChatMessagesSession;
	import org.bigbluebutton.lib.chat.services.IChatMessageService;
	import org.bigbluebutton.lib.main.models.IUserSession;
	import org.bigbluebutton.lib.user.models.User;
	
	import robotlegs.bender.bundles.mvcs.Mediator;
	
	public class ChatViewMediatorBase extends Mediator {
		
		[Inject]
		public var view:ChatViewBase;
		
		[Inject]
		public var chatMessageService:IChatMessageService;
		
		[Inject]
		public var chatMessagesSession:IChatMessagesSession;
		
		[Inject]
		public var userSession:IUserSession;
		
		protected var _publicChat:Boolean = true;
		
		protected var _user:User;
		
		override public function initialize():void {
			chatMessageService.sendMessageOnSuccessSignal.add(onSendSuccess);
			chatMessageService.sendMessageOnFailureSignal.add(onSendFailure);
			userSession.userList.userRemovedSignal.add(userRemoved);
			userSession.userList.userAddedSignal.add(userAdded);
			
			view.textInput.addEventListener(KeyboardEvent.KEY_DOWN, keyDownHandler);
			view.sendButton.addEventListener(MouseEvent.CLICK, sendButtonClickHandler);
		}
		
		protected function openChat(conv:Conversation):void {
			conv.newMessages = 0; //resetNewMessages();
			view.chatList.dataProvider = conv.messages;
		}
		
		private function onSendSuccess(result:String):void {
			view.textInput.enabled = true;
			view.textInput.text = "";
		}
		
		private function onSendFailure(status:String):void {
			view.textInput.enabled = true;
		}
		
		/**
		 * When user left the conference, add '[Offline]' to the username
		 * and disable text input
		 */
		protected function userRemoved(userID:String):void {
			if (view != null && _user && _user.userId == userID) {
				view.textInput.enabled = false;
			}
		}
		
		/**
		 * When user returned(refreshed the page) to the conference, remove '[Offline]' from the username
		 * and enable text input
		 */
		protected function userAdded(newuser:User):void {
			if ((view != null) && (_user != null) && (_user.userId == newuser.userId)) {
				view.textInput.enabled = true;
			}
		}
		
		private function keyDownHandler(e:KeyboardEvent):void {
			if (e.keyCode == Keyboard.ENTER && !e.shiftKey) {
				sendButtonClickHandler(null);
			}
		}
		
		private function sendButtonClickHandler(e:MouseEvent):void {
			var message:String = StringUtil.trim(view.textInput.text);
			
			if (message) {
				view.textInput.enabled = false;
				
				var currentDate:Date = new Date();
				//TODO get info from the right source
				var m:ChatMessageVO = new ChatMessageVO();
				m.fromUserID = userSession.userId;
				m.fromUsername = userSession.userList.getUser(userSession.userId).name;
				m.fromColor = "0";
				m.fromTime = currentDate.time;
				m.fromTimezoneOffset = currentDate.timezoneOffset;
				m.fromLang = "en";
				m.message = message;
				m.toUserID = _publicChat ? "public_chat_userid" : _user.userId;
				m.toUsername = _publicChat ? "public_chat_username" : _user.name;
				if (_publicChat) {
					m.chatType = "PUBLIC_CHAT";
					chatMessageService.sendPublicMessage(m);
				} else {
					m.chatType = "PRIVATE_CHAT";
					chatMessageService.sendPrivateMessage(m);
				}
			}
		}
		
		override public function destroy():void {
			chatMessageService.sendMessageOnSuccessSignal.remove(onSendSuccess);
			chatMessageService.sendMessageOnFailureSignal.remove(onSendFailure);
			userSession.userList.userRemovedSignal.remove(userRemoved);
			userSession.userList.userAddedSignal.remove(userAdded);
			
			view.textInput.removeEventListener(KeyboardEvent.KEY_DOWN, keyDownHandler);
			view.sendButton.removeEventListener(MouseEvent.CLICK, sendButtonClickHandler);
			
			super.destroy();
			view = null;
		}
	}
}
