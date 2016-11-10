var lcarsAPI = "http://10.10.7.84:8081/";
var rfwAPI   = "http://10.10.7.84:7390/";


// Interval on which stats will update
var updateMilliseconds = 30000;

// Counts number of profiles in the database for display
function updateProfileCount() {

	$.getJSON(
      lcarsAPI + "profiles",
      function (data, status) {
         if (data[0].profiles__pid) {
         	var count = data.length || 0;
            $("#profile-count").html(count);
          }
      });
    if($("#profile-count").html() === "") {
    	$("#profile-count").html(0);
    }		
}

// Counts number of response recipes in the database for display
function updateResponseCount() {
	
	$.getJSON(
      lcarsAPI + "responserecipes",
      function (data, status) {
         if (data[0].responserecipes__rrid) {
         	var count = data.length || 0;
            $("#response-count").html(count);
          }
      });
    if($("#response-count").html() === "") {
    	$("#response-count").html(0);
    }		
}

// Count number of rules on RFW on .84
function updateFirewallCount() {
	$.getJSON(
      rfwAPI + "list",
      function (data, status) {
      	var count = data.length || 0;
        $("#firewall-count").html(count);
      });
    if($("#firewall-count").html() === "") {
    	$("#firewall-count").html(0);
    }	
}

// Gets the number of current log entries (according to data from Longtail)
function updateLogEntriesCount() {
    $.getJSON(
        lcarsAPI + "logentries",
        function (data, status) {
           if (status === "success") {
              var count = Number(data.logCount).toLocaleString();
              $("#log-count").html(count);;
           }
        });
}

// Get the number of current attacks (according to Longtail)
function updateAttacksCount() {
    $.getJSON(
        lcarsAPI + "attacks",
        function (data, status) {
           if (status === "success") {
              var count = Number(data.attacksCount).toLocaleString();
              $("#attack-count").html(count);;
           }
        });
}


// Update stats on page load
$(document).ready(function() {
	updateProfileCount();
	updateResponseCount();
	updateFirewallCount();
        updateLogEntriesCount();
        updateAttacksCount();

        // Cron job gets new logs every 20 minutes so update this number every 20 minutes
        setIntervalAdapted(updateLogEntriesCount, 20, 5);
        // Longtail updates this number every 5 minutes so update it here every 5 minutes
        setIntervalAdapted(updateAttacksCount, 5, 5);
});

// Update stats on specified interval
setInterval(function() {
	updateProfileCount();
	updateResponseCount();
	updateFirewallCount();
}, updateMilliseconds);
