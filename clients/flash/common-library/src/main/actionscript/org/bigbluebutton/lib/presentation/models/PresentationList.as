package org.bigbluebutton.lib.presentation.models {
	
	import mx.collections.ArrayCollection;
	
	import org.bigbluebutton.lib.main.models.IConferenceParameters;
	import org.bigbluebutton.lib.main.models.IUserSession;
	import org.bigbluebutton.lib.whiteboard.models.IAnnotation;
	import org.osflash.signals.ISignal;
	import org.osflash.signals.Signal;
	
	public class PresentationList {
		
		[Inject]
		public var userSession:IUserSession;
		
		[Inject]
		public var conferenceParameters:IConferenceParameters;
		
		private var _presentations:ArrayCollection = new ArrayCollection();
		
		private var _currentPresentation:Presentation;
		
		private var _presentationChangeSignal:ISignal = new Signal();
		
		private var _slideChangeSignal:ISignal = new Signal();
		
		private var _viewedRegionChangeSignal:ISignal = new Signal();
		
		private var _cursorUpdateSignal:ISignal = new Signal();
		
		private var _annotationHistorySignal:ISignal = new Signal();
		
		private var _annotationUpdatedSignal:ISignal = new Signal();
		
		private var _annotationUndoSignal:ISignal = new Signal();
		
		private var _annotationClearSignal:ISignal = new Signal();
		
		private var _cursorXPercent:Number = -1;
		
		private var _cursorYPercent:Number = -1;
		
		public function PresentationList() {
		}
		
		public function addPresentation(presentationName:String, id:String, numberOfSlides:int, current:Boolean):Presentation {
			trace("Adding presentation " + presentationName);
			for (var i:int = 0; i < _presentations.length; i++) {
				var p:Presentation = _presentations[i];
				if (p.id == id) {
					return p;
				}
			}
			var presentation:Presentation = new Presentation(presentationName, id, changeCurrentPresentation, numberOfSlides, current);
			presentation.slideChangeSignal.add(slideChangeSignal.dispatch);
			_presentations.addItem(presentation);
			return presentation;
		}
		
		public function removePresentation(presentationName:String):void {
			for (var i:int = 0; i < _presentations.length; i++) {
				var p:Presentation = _presentations[i];
				if (p.fileName == presentationName) {
					trace("Removing presentation " + presentationName);
					_presentations.removeItemAt(i);
				}
			}
		}
		
		public function getPresentation(presentationName:String):Presentation {
			trace("PresentProxy::getPresentation: presentationName=" + presentationName);
			for (var i:int = 0; i < _presentations.length; i++) {
				var p:Presentation = _presentations[i];
				if (p.fileName == presentationName) {
					return p;
				}
			}
			return null;
		}
		
		public function getPresentationByID(presentationID:String):Presentation {
			trace("PresentProxy::getPresentation: presentationID=" + presentationID);
			for (var i:int = 0; i < _presentations.length; i++) {
				var p:Presentation = _presentations[i];
				if (p.id == presentationID) {
					return p;
				}
			}
			return null;
		}
		
		public function cursorUpdate(xPercent:Number, yPercent:Number):void {
			_cursorXPercent = xPercent;
			_cursorYPercent = yPercent;
			if (_currentPresentation != null && _currentPresentation.currentSlideNum >= 0) {
				_cursorUpdateSignal.dispatch(xPercent, yPercent);
			}
		}
		
		public function addAnnotationHistory(whiteboardID:String, annotationArray:Array):void {
			var whiteboardIDParts:Array = whiteboardID.split("/");
			var presentationID:String = whiteboardIDParts[0];
			var pageNumber:int = parseInt(whiteboardIDParts[1]) - 1;
			var presentation:Presentation = getPresentationByID(presentationID);
			if (presentation != null) {
				if (presentation.addAnnotationHistory(pageNumber, annotationArray)) {
					if (presentation == _currentPresentation && pageNumber == _currentPresentation.currentSlideNum) {
						_annotationHistorySignal.dispatch();
					}
				}
			}
		}
		
		public function addAnnotation(annotation:IAnnotation):void {
			var newAnnotation:IAnnotation = _currentPresentation.addAnnotation(_currentPresentation.currentSlideNum, annotation);
			if (newAnnotation != null) {
				_annotationUpdatedSignal.dispatch(newAnnotation);
			}
		}
		
		public function clearAnnotations():void {
			if (_currentPresentation != null && _currentPresentation.currentSlideNum >= 0) {
				if (_currentPresentation.clearAnnotations(_currentPresentation.currentSlideNum)) {
					_annotationClearSignal.dispatch();
				}
			}
		}
		
		public function undoAnnotation():void {
			if (_currentPresentation != null && _currentPresentation.currentSlideNum >= 0) {
				var removedAnnotation:IAnnotation = _currentPresentation.undoAnnotation(_currentPresentation.currentSlideNum);
				if (removedAnnotation != null) {
					_annotationUndoSignal.dispatch(removedAnnotation);
				}
			}
		}
		
		public function setViewedRegion(x:Number, y:Number, widthPercent:Number, heightPercent:Number):void {
			if (_currentPresentation != null && _currentPresentation.currentSlideNum >= 0) {
				if (_currentPresentation.setViewedRegion(_currentPresentation.currentSlideNum, x, y, widthPercent, heightPercent)) {
					_viewedRegionChangeSignal.dispatch(x, y, widthPercent, heightPercent);
				}
			}
		}
		
		private function changeCurrentPresentation(p:Presentation):void {
			currentPresentation = p;
		}
		
		public function get currentPresentation():Presentation {
			return _currentPresentation;
		}
		
		public function set currentPresentation(p:Presentation):void {
			if (_currentPresentation != null) {
				_currentPresentation.current = false;
			}
			_currentPresentation = p;
			_currentPresentation.current = true;
			_presentationChangeSignal.dispatch();
		}
		
		public function get presentationChangeSignal():ISignal {
			return _presentationChangeSignal;
		}
		
		public function get slideChangeSignal():ISignal {
			return _slideChangeSignal;
		}
		
		public function get viewedRegionChangeSignal():ISignal {
			return _viewedRegionChangeSignal;
		}
		
		public function get cursorUpdateSignal():ISignal {
			return _cursorUpdateSignal;
		}
		
		public function get annotationHistorySignal():ISignal {
			return _annotationHistorySignal;
		}
		
		public function get annotationUpdatedSignal():ISignal {
			return _annotationUpdatedSignal;
		}
		
		public function get annotationUndoSignal():ISignal {
			return _annotationUndoSignal;
		}
		
		public function get annotationClearSignal():ISignal {
			return _annotationClearSignal;
		}
		
		public function get cursorXPercent():Number {
			return _cursorXPercent;
		}
		
		public function get cursorYPercent():Number {
			return _cursorYPercent;
		}
	}
}
