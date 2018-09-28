package org.bigbluebutton.lib.main.services {
	
	import flash.net.NetConnection;
	
	import org.bigbluebutton.lib.common.models.IMessageListener;
	import org.bigbluebutton.lib.main.models.IConferenceParameters;
	import org.osflash.signals.ISignal;
	
	public interface IBigBlueButtonConnection {
		function set uri(uri:String):void;
		function get uri():String;
		function get connection():NetConnection;
		function connect(params:IConferenceParameters, tunnel:Boolean = false):void;
		function disconnect(logoutOnUserCommand:Boolean):void;
		function sendMessage(service:String, onSuccess:Function, onFailure:Function, message:Object = null):void;
		function get connectionFailureSignal():ISignal;
		function get connectionSuccessSignal():ISignal;
		function get userId():String;
		function addMessageListener(listener:IMessageListener):void
		function removeMessageListener(listener:IMessageListener):void
	}
}
