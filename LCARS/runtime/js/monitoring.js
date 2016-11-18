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
				var divHTML = '<b>Interface Details</b>';
				divHTML += '<table class="table" style="width: 50%;"><thead><th>Outgoing Packets</th><th>Incoming Packets</th><th>Interfaces</th></thead>';
				divHTML += '<tr><td><canvas id="outgoing-canvas" height="140" width="140" style="margin: 15px 10px 10px 0"></canvas></td>';
				divHTML += '<td><canvas id="incoming-canvas" height="140" width="140" style="margin: 15px 10px 10px 0"></canvas></td>';
				divHTML += '<td><ul style="list-style-type:none;">';

				var interfaceLabels = [];
				var outgoingData = [];
				var incomingData = [];
				var colors = [];
				var hoverColors = [];
				$.each(data, function(i, item) {
					colors.push(getRandomColor());
					hoverColors.push('#EEEEEE');
					divHTML += '<li><i class="fa fa-square" style="color:' + colors[i] + '"></i> ' + item.interface + '</li>';
   					interfaceLabels.push(item.interface);
   					outgoingData.push(item.opackets);
   					incomingData.push(item.ipackets);
				});
				divHTML += '</ul></td></tr></table>';

				$("#interface-details").html(divHTML);

				createInterfaceChart(interfaceLabels, outgoingData, colors, hoverColors, "outgoing-canvas");
				createInterfaceChart(interfaceLabels, incomingData, colors, hoverColors, "incoming-canvas");

				
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

function createInterfaceChart(labels, data, colors, hoverColors, canvasid) {
	var options = {
      legend: false,
      responsive: false
    };

    new Chart(document.getElementById(canvasid), {
      type: 'pie',
      tooltipFillColor: "rgba(51, 51, 51, 0.55)",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          hoverBackgroundColor: hoverColors
        }]
      },
      options: options
    });
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

$(document).ready(function () {
	populateLcarsLog();
	populateOsVersion();
	populateInterfaceDetails();
	populateIptablesInfo();
	createInterfaceChart();
});