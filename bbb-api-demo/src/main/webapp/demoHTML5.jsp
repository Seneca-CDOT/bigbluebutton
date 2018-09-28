<!--

BigBlueButton - http://www.bigbluebutton.org

Copyright (c) 2008-2015 by respective authors (see below). All rights reserved.

BigBlueButton is free software; you can redistribute it and/or modify it under the 
terms of the GNU Lesser General Public License as published by the Free Software 
Foundation; either version 3 of the License, or (at your option) any later 
version. 

BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY 
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A 
PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along 
with BigBlueButton; if not, If not, see <http://www.gnu.org/licenses/>.

Author: Fred Dixon <ffdixon@bigbluebutton.org>

-->

<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<% 
	request.setCharacterEncoding("UTF-8"); 
	response.setCharacterEncoding("UTF-8"); 
%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<title>Join Meeting via HTML5 Client</title>
</head>

<body>

<p>You must have the BigBlueButton HTML5 client installed to use this API demo.</p>

<%@ include file="bbb_api.jsp"%>

<%
if (request.getParameterMap().isEmpty()) {
	//
	// Assume we want to create a meeting
	//
	%>
<%@ include file="demo_header.jsp"%>

<h2>Join Meeting via HTML5 Client</h2>

<FORM NAME="form1" METHOD="GET">
<table cellpadding="5" cellspacing="5" style="width: 400px; ">
	<tbody>
		<tr>
			<td>&nbsp;</td>
			<td style="text-align: right; ">Full Name:</td>
			<td style="width: 5px; ">&nbsp;</td>
			<td style="text-align: left "><input type="text" autofocus required name="username" /></td>
		</tr>

		<tr>
			<td>&nbsp;</td>
			<td style="text-align: right; ">Meeting Name:</td>
			<td style="width: 5px; ">&nbsp;</td>
			<td style="text-align: left "><input type="text" required name="meetingname" value="Demo Meeting" /></td>
		<tr>

			<tr>
				<td>&nbsp;</td>
				<td style="text-align: right; ">Moderator Role:</td>
				<td style="width: 5px; ">&nbsp;</td>
				<td style="text-align: left "><input type=checkbox name=isModerator value="true" checked></td>
			<tr>

		<tr>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td><input type="submit" value="Join" /></td>
		<tr>
	</tbody>
</table>
<INPUT TYPE=hidden NAME=action VALUE="create">
</FORM>


<%
} else if (request.getParameter("action").equals("create")) {

	String username = request.getParameter("username");

	// set defaults and overwrite them if custom values exist
	String meetingname = "Demo Meeting";
	if (request.getParameter("meetingname") != null) {
		meetingname = request.getParameter("meetingname");
	}

	Boolean isModerator = new Boolean(false);
	Boolean isHTML5 = new Boolean(true);
	Boolean isRecorded = new Boolean(true);
	if (request.getParameter("isModerator") != null) {
		isModerator = Boolean.parseBoolean(request.getParameter("isModerator"));
	}

	String joinURL = getJoinURLExtended(username, meetingname, isRecorded.toString(), null, null, null, isHTML5.toString(), isModerator.toString());

	if (joinURL.startsWith("http://") || joinURL.startsWith("https://")) {
%>

<script language="javascript" type="text/javascript">
	window.location.href="<%=joinURL%>";
</script>

<%
	} else {
%>

Error: getJoinURL() failed
<p/>
<%=joinURL %>

<%
	}
}
%>


<%@ include file="demo_footer.jsp"%>

</body>
</html>
