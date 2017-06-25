
// Interval on which stats will update
var updateMilliseconds = 30000;

// Counts number of profiles in the database for display
function updateProfileCount() {
    $.getJSON(
        _lcarsAPI + "profiles",
        function (data, status) {
            if (data[0].profiles__pid) {
                var count = data.length || 0;
                $("#profile-count").html(count);
            }
        }
    );
    if ($("#profile-count").html() === "") {
        $("#profile-count").html(0);
    }
}

// Counts number of response recipes in the database for display
function updateResponseCount() {
    $.getJSON(
        _lcarsAPI + "responserecipes",
        function (data, status) {
            if (data[0].responserecipes__rrid) {
                var count = data.length || 0;
                $("#response-count").html(count);
            }
        }
    );
    if ($("#response-count").html() === "") {
        $("#response-count").html(0);
    }
}

// Count number of rules on RFW on .84
function updateFirewallCount() {
    $.getJSON(
        _rfwAPI + "list",
        function (data, status) {
            var count = data.length || 0;
            $("#firewall-count").html(count);
        }
    );
    if ($("#firewall-count").html() === "") {
        $("#firewall-count").html(0);
    }
}

// Gets the number of current log entries (according to data from Longtail)
function updateLogEntriesCount() {
    $.getJSON(
        _lcarsAPI + "logentries",
        function (data, status) {
           if (status === "success") {
              var count = Number(data.logCount).toLocaleString();
              $("#log-count").html(count);;
           }
        }
    );
}

// Get the number of current attacks (according to Longtail)
function updateAttacksCount() {
    $.getJSON(
        _lcarsAPI + "attacks",
        function (data, status) {
           if (status === "success") {
              var count = Number(data.attacksCount).toLocaleString();
              $("#attack-count").html(count);;
           }
        }
    );
}

function updateHoneypotCount() {
    $.getJSON(
        _lcarsAPI + "hpinfo",
        function (data, status) {
            var count = data.length || 0;
            $("#honeypot-count").html(count);
            if ($("#honeypot-count").html() === "") {
                $("#honeypot-count").html(0);
            }
        });
}


// Populates the Attack Originations table with country data
function populateCountryData() {
    $.getJSON(
        _lcarsAPI + "countrydata",
        function (data, status) {
            if (status === "success") {
                $("#country-data").empty();
                var totalAttacks = 0;
                $.each(data, function(i, item) {
                    var country = data[i].country;
                    var attackCount = data[i].attacks;
                    country = country.replace(/_/g, " ");
                    totalAttacks += attackCount;
                    attackCount = Number(attackCount).toLocaleString();
                    $("#country-data").append('<tr><td>' + country + '</td>'
                                            + '<td class="fs15 fw700 text-right">' + attackCount + '</td></tr>');
                });
                totalAttacks = Number(totalAttacks).toLocaleString();
                $("#attack-heading").text(totalAttacks + " Attacks from " + data.length + " Countries");
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
        updateHoneypotCount();
        populateCountryData();

        // Cron job gets new honeypot logs every hour on the 15 minute mark so update these numbers then
        setIntervalAdapted(updateLogEntriesCount, 60, 905);
        setIntervalAdapted(updateHoneypotCount, 60, 905);
        // Longtail updates this number every 5 minutes so update it here every 5 minutes
        setIntervalAdapted(updateAttacksCount, 5, 5);
});

// Update stats on specified interval
setInterval(function() {
	updateProfileCount();
	updateResponseCount();
	updateFirewallCount();
}, updateMilliseconds);
