package org.bigbluebutton.api2;

import org.bigbluebutton.api.domain.RecordingMetadata;
import scala.Option;

import java.io.File;
import java.util.ArrayList;
import java.util.Map;

public interface RecordingServiceGW {

  String getRecordings2x(ArrayList<RecordingMetadata> recs);
  Option<RecordingMetadata> getRecordingMetadata(File xml);
  void saveRecordingMetadata(File xml, RecordingMetadata metadata);
}
