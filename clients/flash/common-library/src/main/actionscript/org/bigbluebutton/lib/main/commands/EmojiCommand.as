package org.bigbluebutton.lib.main.commands {
	
	import org.bigbluebutton.lib.main.models.IUserSession;
	import org.bigbluebutton.lib.user.services.IUsersService;
	
	import robotlegs.bender.bundles.mvcs.Command;
	
	public class EmojiCommand extends Command {
		
		[Inject]
		public var userSession:IUserSession;
		
		[Inject]
		public var userService:IUsersService;
		
		[Inject]
		public var status:String;
		
		override public function execute():void {
			trace("EmojiCommand.execute() - change emoji statu");
			userService.emojiStatus(status);
		}
	}
}
