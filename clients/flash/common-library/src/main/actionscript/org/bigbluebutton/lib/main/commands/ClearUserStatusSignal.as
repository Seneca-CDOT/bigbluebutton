package org.bigbluebutton.lib.main.commands {
	
	import org.osflash.signals.Signal;
	
	public class ClearUserStatusSignal extends Signal {
		public function ClearUserStatusSignal() {
			/**
			 * @1 userID
			 */
			super(String);
		}
	}
}
