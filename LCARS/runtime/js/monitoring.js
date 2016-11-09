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

$(document).ready(function () {
	populateLcarsLog();
});