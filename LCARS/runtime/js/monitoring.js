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

function populateOsVersion() {
	$.getJSON(
		lcarsAPI + "osversion",
		function(data, status) {
			if(status === "success") {
				var divHTML = "";
				divHTML += "<b>OS Version:</b> " + data[0].name + " (" + data[0].major + "." + data[0].minor + "." + data[0].patch + ")<br>";

				$("#os-version").html(divHTML);
			}
		}
	);
}

function populateInterfaceDetails() {
	$.getJSON(
		lcarsAPI + "interfacedetails",
		function(data, status) {
			if(status === "success") {
				var divHTML = '<div><b>Interface Details</b></div>' + 
				'<table class="table"><thead><th>Interface</th><th>Outgoing Packets</th><th>Outgoing Bytes</th><th>Incoming Packets</th><th>Incoming Bytes</th></thead>';
				$.each(data, function(i, item) {
   					divHTML += '<tr><td>' + item.interface + '</td><td>' + item.opackets + '</td><td>' + item.obytes + '</td><td>' + item.ipackets + '</td><td>' + item.ibytes + '</td></tr>';
				});
				divHTML += '</table>';

				$("#interface-details").html(divHTML);
			}
		}
	);
}

function populateIptablesInfo() {
	$.getJSON(
		lcarsAPI + "iptables",
		function(data, status) {
			if(status === "success") {
				var divHTML = '<div><b>Iptables</b></div>' +
				'<ul><li><b>Total Rules: </b>' + data.length + '</li>' +
				'<li><b>Total Packets Caught: </b>' + data[0].totalpackets + '</li></ul>';

				$("#iptables-info").html(divHTML);
			}
		}
	);
}

$(document).ready(function () {
	populateLcarsLog();
	populateOsVersion();
	populateInterfaceDetails();
	populateIptablesInfo();
});