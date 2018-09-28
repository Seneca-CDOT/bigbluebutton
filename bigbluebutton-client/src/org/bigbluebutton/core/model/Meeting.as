package org.bigbluebutton.core.model
{
  public class Meeting
  {
    public var name:String = "";
    public var internalId:String = "";
    public var externalId:String = "" ;
    public var isBreakout:Boolean = false;
    public var defaultAvatarUrl:String = "";
    public var voiceConf:String = "";
    public var dialNumber:String = "";
    public var recorded:Boolean = false;
    public var defaultLayout:String = "";
    public var welcomeMessage:String = "";
    public var modOnlyMessage:String = "";
    public var allowStartStopRecording:Boolean = true;
    public var webcamsOnlyForModerator:Boolean = false;
    public var metadata:Object = null;
    public var muteOnStart:Boolean = false;
    public var customLogo:String = "";
    public var customCopyright:String = "";
  }
}