package org.bigbluebutton.air.settings.views {
	import spark.components.Scroller;
	import spark.layouts.HorizontalAlign;
	import spark.layouts.VerticalLayout;
	
	import org.bigbluebutton.air.common.views.NoTabView;
	import org.bigbluebutton.air.main.views.TopToolbarAIR;
	import org.bigbluebutton.lib.settings.views.SettingsViewBase;
	
	public class SettingsView extends NoTabView {
		private var _settingsView:SettingsViewBase;
		
		public function SettingsView() {
			super();
			
			var vLayout:VerticalLayout = new VerticalLayout();
			vLayout.gap = 0;
			vLayout.horizontalAlign = HorizontalAlign.CENTER;
			layout = vLayout;
			
			_settingsView = new SettingsViewBase();
			_settingsView.percentWidth = 100;
			
			var scroller:Scroller = new Scroller();
			scroller.percentWidth = 100;
			scroller.percentHeight = 100;
			scroller.viewport = _settingsView;
			
			addElement(scroller);
		}
		
		override protected function createToolbar():TopToolbarAIR {
			return new TopToolbarSettings();
		}
	}
}
