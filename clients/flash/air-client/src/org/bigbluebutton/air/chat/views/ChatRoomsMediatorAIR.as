package org.bigbluebutton.air.chat.views {
	import org.bigbluebutton.air.common.PageEnum;
	import org.bigbluebutton.air.main.models.IUISession;
	import org.bigbluebutton.lib.chat.views.ChatRoomsMediatorBase;
	
	import spark.events.IndexChangeEvent;
	
	public class ChatRoomsMediatorAIR extends ChatRoomsMediatorBase {
		
		[Inject]
		public var uiSession:IUISession;
		
		override protected function onListIndexChangeEvent(e:IndexChangeEvent):void {
			var item:Object = dataProvider.getItemAt(e.newIndex);
			uiSession.pushPage(PageEnum.CHAT, {userId: item.userId, publicChat: item.isPublic});
			//uiSession.chatInfo = new ChatRoomVO(item.userId, item.isPublic);
		}
	}
}
