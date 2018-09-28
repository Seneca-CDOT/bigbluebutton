package org.bigbluebutton.lib.voice.services {
	
	import flash.net.NetConnection;
	
	import org.bigbluebutton.lib.main.models.IConferenceParameters;
	import org.osflash.signals.ISignal;
	
	public interface IVoiceConnection {
		function get connectionFailureSignal():ISignal
		function get connectionSuccessSignal():ISignal
		function set uri(uri:String):void
		function get uri():String
		function get connection():NetConnection
		function get callActive():Boolean
		function get hangUpSuccessSignal():ISignal;
		function connect(confParams:IConferenceParameters, listenOnly:Boolean):void
		function disconnect(onUserCommand:Boolean):void
		function failedToJoinVoiceConferenceCallback(msg:String):*
		function disconnectedFromJoinVoiceConferenceCallback(msg:String):*
		function successfullyJoinedVoiceConferenceCallback(publishName:String, playName:String, codec:String):*
		function call(listenOnly:Boolean = false):void
		function hangUp():void
	}
}
