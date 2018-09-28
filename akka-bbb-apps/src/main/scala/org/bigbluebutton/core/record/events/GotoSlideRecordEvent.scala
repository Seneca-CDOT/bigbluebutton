/**
 * BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
 *
 * Copyright (c) 2017 BigBlueButton Inc. and by respective authors (see below).
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

package org.bigbluebutton.core.record.events

class GotoSlideRecordEvent extends AbstractPresentationRecordEvent {
  import GotoSlideRecordEvent._

  setEvent("GotoSlideEvent")

  def setSlide(slide: Integer) {
    /*
     * Subtract 1 from the page number to be zero-based to be
     * compatible with 0.81 and earlier. (ralam Sept 2, 2014)
     */
    eventMap.put(SLIDE, Integer.toString(slide - 1))
  }

  def setId(id: String) {
    eventMap.put(ID, id)
  }
}

object GotoSlideRecordEvent {
  protected final val SLIDE = "slide"
  protected final val ID = "id"
}