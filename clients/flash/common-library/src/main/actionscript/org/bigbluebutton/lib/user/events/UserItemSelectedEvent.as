package org.bigbluebutton.lib.user.events {
	import flash.events.Event;
	import flash.geom.Point;
	
	import org.bigbluebutton.lib.user.models.User;
	
	public class UserItemSelectedEvent extends Event {
		public static var SELECTED:String = "USER_ITEM_SELECTED_EVENT";
		
		public var user:User;
		public var globalPos:Point;
		public var width:Number;
		public var height:Number;
		
		public function UserItemSelectedEvent(u:User, gp:Point, w:Number, h:Number) {
			super(SELECTED, true, false);
			
			user = u;
			globalPos = gp;
			width = w;
			height = h;
		}
	}
}
