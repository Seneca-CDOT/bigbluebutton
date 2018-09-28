/**
 * BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
 *
 * Copyright (c) 2018 BigBlueButton Inc. and by respective authors (see below).
 *
 * This program is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License as published by the Free Software
 * Foundation; either version 3.0 of the License, or (at your option) any later
 * version.
 *
 * BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along
 * with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.bigbluebutton.common.logging {
	import com.adobe.crypto.SHA256;
	import com.asfusion.mate.events.Dispatcher;

	import org.bigbluebutton.core.Options;
	import org.bigbluebutton.main.events.ClientStatusEvent;
	import org.bigbluebutton.main.model.options.LoggingOptions;
	import org.bigbluebutton.util.i18n.ResourceUtil;

	public class DisplayWarningAction implements GlobalExceptionHandlerAction {

		private var dispatcher:Dispatcher = new Dispatcher();

		private var loggingOptions:LoggingOptions;

		public function DisplayWarningAction():void {
			loggingOptions = Options.getOptions(LoggingOptions) as LoggingOptions;
		}

		public function handle(error:Object):void {
			if (loggingOptions.reportErrorsInUI && error is Error) {
				var errorObj:Error = error as Error;
				var errorId:String = SHA256.hash(errorObj.getStackTrace()).substr(0, 8);
				var fullMessage:String = "Error ID : " + errorObj.errorID + "\nUnique ID : " + errorId + "\nMessage : " + errorObj.message + "\n" + errorObj.getStackTrace();
				dispatcher.dispatchEvent(new ClientStatusEvent(ClientStatusEvent.GLOBAL_EXCEPTION, ResourceUtil.getInstance().getString('bbb.error.catch.title', [errorId]), ResourceUtil.getInstance().getString('bbb.error.catch.message', [errorId]), fullMessage));
			}
		}
	}
}
