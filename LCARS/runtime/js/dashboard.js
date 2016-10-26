var lcarsAPI = "http://10.10.7.84:8081/";
var rfwAPI   = "http://10.10.7.84:7390/";


// Interval on which stats will update
var updateMilliseconds = 30000;

// Counts number of profiles in the database for display
function updateProfileCount() {
	var profileCount = 0;

	$.getJSON(
      lcarsAPI + "profiles",
      function (data, status) {
         if (data[0].profiles__pid) {
                $.each(data, function(i, item) {
                    profileCount++;
                });
                $("#profile-count").html(profileCount);
          }
      });	
}

// Counts number of response recipes in the database for display
function updateResponseCount() {
	var responseCount = 0;

	$.getJSON(
      lcarsAPI + "responserecipes",
      function (data, status) {
         if (data[0].responserecipes__rrid) {
                $.each(data, function(i, item) {
                    responseCount++;
                });
                $("#response-count").html(responseCount);
          }
      });	
}

// Count number of rules on RFW on .84
function updateFirewallCount() {
	var firewallCount = 0;

	$.getJSON(
      rfwAPI + "list",
      function (data, status) {
        $.each(data, function(i, item) {
            firewallCount++;
        });
        $("#firewall-count").html(firewallCount);
      });	
}

// Update stats on page load
$(document).ready(function() {
	updateProfileCount();
	updateResponseCount();
	updateFirewallCount();
});

// Update stats on specified interval
setInterval(function() {
	updateProfileCount();
	updateResponseCount();
	updateFirewallCount();
}, updateMilliseconds);