/**
 * BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
 * 
 * Copyright (c) 2012 BigBlueButton Inc. and by respective authors (see below).
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

package org.bigbluebutton.presentation.imp;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import org.bigbluebutton.presentation.PageConverter;
import org.bigbluebutton.presentation.UploadedPresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Png2SwfPageConverter implements PageConverter {
  private static Logger log = LoggerFactory.getLogger(Png2SwfPageConverter.class);

  private String SWFTOOLS_DIR;

  public boolean convert(File presentationFile, File output, int page, UploadedPresentation pres){		
    String COMMAND = SWFTOOLS_DIR + File.separator + "png2swf -o " + output.getAbsolutePath() + " " + presentationFile.getAbsolutePath();		

    boolean done = new ExternalProcessExecutor().exec(COMMAND, 60000); 	            

    if (done && output.exists()) {
      return true;		
    } else {
      Map<String, Object> logData = new HashMap<String, Object>();
      logData.put("meetingId", pres.getMeetingId());
      logData.put("presId", pres.getId());
      logData.put("filename", pres.getName());
      logData.put("message", "Failed to convert PNG doc to SWF.");
      Gson gson = new Gson();
      String logStr = gson.toJson(logData);
      log.warn("-- analytics -- " + logStr);

      return false;
    }
  }

  public void setSwfToolsDir(String dir) {
    SWFTOOLS_DIR = dir;
  }

}
