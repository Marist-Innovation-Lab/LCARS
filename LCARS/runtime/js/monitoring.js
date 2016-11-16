var lcarsAPI = "http://10.10.7.84:8081/";

function populateLcarsLog() {
	$.getJSON(
		lcarsAPI + "lcarslog",
		function(data, status) {
			if(status === "success") {
				var logHTML = "";
				for(var i = 0; i < data.length; i++) {
					logHTML += "[" + data[i].lcarslogentries__createdate + "] " + data[i].lcarslogentries__category + " : " + data[i].lcarslogentries__message + "<br>";
				}
				
				$("#lcars-log").html(logHTML);
			}
		}
	);
}

function populateOsInfo() {
	$.getJSON(
		lcarsAPI + "osversion",
		function(data, status) {
			if(status === "success") {
				var osInfoHTML = "";
				osInfoHTML += "<b>OS Version:</b> " + data[0].name + " (" + data[0].major + "." + data[0].minor + "." + data[0].patch + ")";

				$("#osquery").html(osInfoHTML);
			}
		}
	);
}

$(document).ready(function () {
	populateLcarsLog();
	populateOsInfo();
});