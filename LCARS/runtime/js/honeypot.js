

var lcarsAPI = "http://10.10.7.84:8081/";
var gstarAddress = "http://10.10.7.84/gstarstudio"
var currentLog = "";
var linkWeight = false;

function viewHoneypotLogs() {
    $("#honeypots").on("click", "td button", function() {

        clearModal(); 

        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).children("span").attr("title").toLowerCase();
        var host = $(this).closest("tr").find("td:nth-child(2)").text();
        var type = $(this).closest("tr").find("td:nth-child(3)").text();
        var date = $(this).closest("tr").find("td:nth-child(5)").text();
        var logCount = $(this).closest("tr").find("td:nth-child(6)").text();
            logCount = (+logCount.replace(',', ''));   // Remove the comma and cast to a Number
        var sampleBox = $(this).closest("tr").find("input");
        var sampleSize = sampleBox.val();
            sampleSize = (+sampleSize.replace(',',''));

        var rawLog = "/lcars/runtime/logs/longtail/"+host.toLowerCase()+".log";
        var parsedLog = "/lcars/runtime/logs/longtail/parsed_json/"+host.toLowerCase()+".log.json";

        if (button === "view") { 
            $("#log-modal").find("h4").text("Today's Log Data for " + type + " Honeypot: " + host);
            $("#log-identifier").html(host.toLowerCase());
 
            $("#log-data").load(rawLog);
        }

        else if ( (sampleSize > logCount) || (sampleSize < 0) ) {
            sampleBox.css("border", "1.5px solid red");
        }

        else {
            sampleBox.removeAttr("style");

            $.get(parsedLog, function(logData) {
                var dataToAnalyze;
                if (!sampleSize) {
                    dataToAnalyze = logData;
                } else {
                    dataToAnalyze = getRandomSample(logData, sampleSize);
                }

                if (button === "plot") {
                    currentLog = dataToAnalyze;
                    makePrebakedPlot(dataToAnalyze);

                    // $("#plot-modal").find("h4").text("Settings for hive plot:");
                    // $("#plot-data").html(hiveplot_settings_html);
                    // genAxisNameSelectors();
                }

                if (button === "to graph") {
                    makePrebakedGraph(dataToAnalyze);

                    // $("#graph-modal").find("h4").text("Settings for graph:");
                    // $("#graph-data").html(graph_settings_html);
                    // genAxisNameSelectors();
                }

                if (button === "to sql") {
                    var formatDate = date.replace(/ /g, "T");
                    var tableName = host + "_" + formatDate;

                    jsonToSQL(dataToAnalyze, tableName);
                }

            }, 'html');

        }

    });
}


function viewBlackridgeLogs() {
    $("#blackridge").on("click", "td button", function() {

        clearModal();

        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).children("span").attr("title").toLowerCase();
        var host = $(this).closest("tr").find("td:nth-child(2)").text();
        var date = $(this).closest("tr").find("select").val();

        var rawLog = "/lcars/runtime/logs/blackridge/" + date;
        var parsedLog = "/lcars/runtime/logs/blackridge/parsed_json/"+date+".json";

        if (button === "view") {
            $("#log-modal").find("h4").text(date + " BlackRidge Log Data for: " + host);
            $("#log-identifier").html(date);

            $("#log-data").load(rawLog);
        }

        if(button === "plot") {
          $.get(parsedLog, function(x){
            currentLog = x;
            makePrebakedPlot(x);
          },'html');

          // $("#plot-modal").find("h4").text("Settings for hive plot:");
          // $("#plot-data").html(hiveplot_settings_html);
          // genAxisNameSelectors();
        }

        if(button === "to graph") {
          $.get(parsedLog, function(x){
            makePrebakedGraph(x);
          },'html');

          // $("#graph-modal").find("h4").text("Settings for graph:");
          // $("#graph-data").html(graph_settings_html);
          // genAxisNameSelectors();
        }

        if (button === "to sql") {
            var tableName = host + "_" + date;

            $.get(parsedLog, function(logData) {
                jsonToSQL(logData, tableName);
            }, 'html');

        }

    });
}


function viewParsedLogs() {
    $("#data-view").on("click", function() {
        var id = $("#log-identifier").text();
        var parsedFile;
        var rawFile;
        
        // Longtail Log
        if (id.match(/[A-Za-z]+/g)) {
            parsedFile = "/lcars/runtime/logs/longtail/parsed_json/"+id+".log.json";   
            rawFile = "/lcars/runtime/logs/longtail/"+id+".log";
        // BlackRidge Log
        } else {
            parsedFile = "/lcars/runtime/logs/blackridge/parsed_json/"+id+".json";
            rawFile = "/lcars/runtime/logs/blackridge/"+id;
        }

        if ($(this).text() === "View Parsed") {
            $(this).html("View Raw");
            $("#log-data").load(parsedFile);
        }
        else if ($(this).text() === "View Raw") {
            $(this).html("View Parsed");
            $("#log-data").load(rawFile);
        }
    });
}


// Launch G* Studio in a new tab and populate the editor panes with commands from LCARS
function launchGstar() {
    // Get textarea values for G* commands and SQL Commands
    var gstarCommands = $("#logDataOutput").val();
    var sqlCommands = $("#sql-commands").val();
    // Launch G* Studio in a new tab
    var gstarWindow = window.open("/gstarstudio", "_blank");
    gstarWindow.focus();

    // On page load, populate the graph and database editors with their respective data
    $(gstarWindow).on("load", function() {
        var graphEditor = gstarWindow.document.getElementById("text-editor");
        var dbEditor = gstarWindow.document.getElementById("database-editor");
        graphEditor.innerHTML = gstarCommands;
        dbEditor.innerHTML = sqlCommands;
    });
}


// Function to get a random sample of log data
function getRandomSample(data, sampleSize) {

    var fullData = data.split('\n');
    var dataSize = fullData.length - 1;

    var randomLineSelection = [];
    for (var i = 0; i < sampleSize; i ++) {
        var randomLine = Math.floor(Math.random() * dataSize);

        function check(line) {
            if (randomLineSelection.indexOf(randomLine) > -1) {
                randomLine = Math.floor(Math.random() * dataSize);
                check(randomLine);
            } else {
                randomLineSelection.push(line);
            }
        }

        check(randomLine);
    }

    var sample = "";
    for (var i = 0; i < fullData.length; i++) {
        if (randomLineSelection.indexOf(i) > -1) {
            sample = sample + fullData[i] + "\n";
        }
    }

    return sample; 

}


// Function to convert parsed JSON log file to SQL 'create table' and 'insert' statements
function jsonToSQL(data, tableName) {
    var createString = "CREATE TABLE IF NOT EXISTS \"" + tableName + "\" ( \n";
    var pkString = "  primary key(";
    var insertString = "INSERT INTO \"" + tableName + "\" VALUES \n";

    var lines = data.split('\n');

    for (var i = 0; i < lines.length; i++) {
        if (lines[i]) {   // Only process lines that are not empty
            var jsObj = JSON.parse(lines[i]);

            var valString = "   (";
            for (key in jsObj) {
                // Read the first line and determine the columns to create based on JSON attributes
                if (i === 0) {
                    pkString = pkString + key + ", ";
                    createString = createString + "   " + key + " text, \n";
                }

                var value = jsObj[key];
                value = value.replace(/'/g, "''");   // Escape single quotes that appear in values
                valString = valString + "'" + value + "', ";
            }

            valString = valString.replace(/, $/g, "),\n");
            // Only include unique entries, so check if the insert string already contains this data,
            // and if it doesn't, add it.
            if (!insertString.includes(valString)) {
                insertString = insertString + valString;
            }
        }
    }

    // Append primary key string to create string
    createString = createString + pkString;
    // Reformat last line of string with appropriate semi-colon endings
    createString = createString.replace(/, $/g, ")\n);\n");
    insertString = insertString.replace(/,\n$/g, ";");

    // Append the createString and insertString statements to the textbox
    // jQuery append() function doesn't work as expected with textareas, so val() is used
    var currentSQLText = $("#sql-commands").val();
    $("#sql-commands").val(currentSQLText + createString + "\n" + insertString + "\n\n");

}


// Clears out SQL Commands text area if clear button is clicked
function clearSQLCommands() {
    $("#clear-sql-commands").on("click", function() {
        $("#sql-commands").val("");
    });
}


// Clears out G* Commands text area if clear button is clicked
function clearGstarCommands() {
    $("#clear-gstar-commands").on("click", function() {
        $("#logDataOutput").val("");
    });
}


function clearModal() {
    $(".modal").on("hidden.bs.modal", function() {
        $("#log-data").html("");
        $("#data-view").html("View Parsed");
    });
}


// Populate the Longtail HP table with info about each active honeypot, including hostname and time it was last attacked
function populateHoneypots() {
    $.getJSON(
       lcarsAPI + "hpinfo",
       function (data, status) {
          if (status === "success") {
              $("#honeypots").empty();

              $.each(data, function(i, item) {
                  var hostname = data[i].hostname;
                  var loc;
                  if (hostname.includes("AWS")) {
                      loc = "AWS Cloud";
                  } else {
                      loc = "Marist";
                  }
 
                  $("#honeypots").append('<tr><th scope="row">' + (i+1) + '</th>'
                                       + '<td>' + hostname + '</td>'
                                       + '<td>SSH</td>'
                                       + '<td>' + loc + '</td>'
                                       + '<td>' + data[i].time + '</td>'
                                       + '<td>' 
                                         + Number(data[i].logCount).toLocaleString()
                                         + '<button type="button" class="btn btn-default btn-xs" data-toggle="modal" data-target="#log-modal" style="float:right; margin-right:25%;"><span title="View" class="glyphicon glyphicon-list"></span></button></td>'
                                       + '<td><div class="input-group">'
                                         + '<div style="padding-right:5px"><input class="form-control input-xs" type="text" placeholder="Sample Size" size=1></input></div>'
                                         + '<div class="input-group-btn"><button type="button" class="btn btn-default btn-xs analyze-btn"><span title="Plot" class="fa fa-line-chart"</span></button></div>'
                                         + '<div class="input-group-btn"><button type="button" class="btn btn-default btn-xs analyze-btn"><span title="To Graph" class="fa fa-share-alt"</span></button></div>'
                                         + '<div class="input-group-btn"><button type="button" class="btn btn-default btn-xs analyze-btn"><span title="To SQL" class="fa fa-database"</span></button></div>'
                                       + '</div></td></tr>');

              });

          }
       }
    );
}


function setLogsLastRefreshedTime() {
   var date = new Date();
   var mins = date.getMinutes();
   var currentHour = date.getHours();
   var lastHour;
   var day;

   if (currentHour == 00 && mins < 15) {
      lastHour = 23;
      day = "Yesterday";
   } else {
      lastHour = currentHour - 1;
      day = "Today";
   } 

   function refreshed(time) {
       $("#last-refreshed").html("Last refreshed: " + day + " at " + time);
   }

   if (mins < 15) {
      refreshed(lastHour + ":15:00");
   } else {
      refreshed(currentHour + ":15:00");
   }
}


function refreshLongtailImage() {
    // The ? + Math.random() appended to the URL below allows the image to actually refresh, without it the browser recognizes
    // that the URL path is the same and won't grab the new image from the Longtail site     
    $("#longtail-img").attr("src", "http://longtail.it.marist.edu/honey/dashboard_number_of_attacks.png?"+Math.random());
}


function switchLogTab() {
    $('#logs-tab a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })
}

$(document).ready(function() {
    populateHoneypots();
    viewHoneypotLogs();
    viewBlackridgeLogs();
    viewParsedLogs();
    clearSQLCommands();
    clearGstarCommands();
    setLogsLastRefreshedTime();

    // Call functions to refresh logs every hour on the 15 minute (thats when the cron job runs)
    setIntervalAdapted(populateHoneypots, 60, 905);
    setIntervalAdapted(setLogsLastRefreshedTime, 60, 905);
    setIntervalAdapted(refreshLongtailImage, 5, 5);

    switchLogTab();
});


/** 
 * An adaptation of the built in setInterval function - Runs a function at a specified interval on the interval
 * Main purpose is to sync page refresh with cron job in honeypot logs table
 * Example: setIntervalAdapted(func, 20) will run func() every 20 minutes on the 20 minute mark (:00, :20, and :40)
 * @param minuteInterval - interval (in minutes) in which function will run
 * @param [secondsOffset=0] - an optional parameter that allows you to specify a number of seconds after hh:mm:00 to start timeout, defaults to hh:mm:00  
 * http://stackoverflow.com/questions/28532731/how-to-run-a-javascript-function-every-10-minutes-specifically-on-the-10-minute
 */
function setIntervalAdapted(myFunction, minuteInterval, secondsOffset) {
    var date = new Date();
    var currentSeconds = (date.getMinutes() * 60) + (date.getSeconds());
    // converts the specified interval to seconds
    var interval = minuteInterval * 60;
    var secondsSinceLastTimerTrigger;
    var secondsUntilNextTimerTrigger;
    // set offset to 0 if none specified
    if (typeof secondsOffset === 'undefined') { secondsOffset = 0; }

    if (minuteInterval === 60 && secondsOffset > 0) {
        if (currentSeconds < secondsOffset) {
            secondsUntilNextTimerTrigger = secondsOffset - currentSeconds;
        } else {
            secondsUntilNextTimerTrigger = (interval - currentSeconds) + secondsOffset;
        }
    } else {
        secondsSinceLastTimerTrigger = currentSeconds % interval;
        secondsUntilNextTimerTrigger = interval - secondsSinceLastTimerTrigger + secondsOffset;
    }

    // If current time is :33 and the interval is 20, timeout needs to be set to run the function once time reaches :40
    // And then call the built in setInterval to execute the function every 20 minutes from this point
    setTimeout(function() {
        setInterval(myFunction, interval*1000); // *1000 converts back to milliseconds
        myFunction();
    }, secondsUntilNextTimerTrigger*1000);
}

// Creates gstar plot based on log data
function makePrebakedGraph(data){
    // var gstarWnd = window.open(gstarAddress);
    // var gstarTextArea = gstarWnd.document.getElementById("ace_content");
    //var output = document.getElementById("logDataOutput");
    var lines = data.split("\n");
    var dataKeys = Object.keys(JSON.parse(lines[0]));
    var jsonLine;
    var colorChoices = ["red","orange","cyan","blue","yellow","green","purple","pink","brown","grey"];
    var colors = {};
    var result = "new graph\n";

    // Assign colors to key types
    dataKeys.forEach(function(key){
      colors[key] = colorChoices.pop();
    });

    //output.innerHTML = "";
    //output.innerHTML = output.innerHTML + "new graph\n";
    //result = "";

    // function replacer(match) {
    //   return match.substring(1,match.length);
    // }

    // var regex = /#....../g;

    for (var i = 0; i < lines.length; i++){
      if(!lines[i]){continue;}
      jsonLine = JSON.parse(lines[i]);
      dataKeys.forEach(function(key){
        result = result + "add vertex " + jsonLine[key] + " with attributes(color=" + colors[key] + ")" + "\n";
        // result = result.replace(regex, replacer);
      });
    }

    //output.innerHTML = output.innerHTML + result;

    for (var i = 0; i < lines.length; i++) {
      if(!lines[i]){continue;}
      jsonLine = JSON.parse(lines[i]);
      for (var j = 0; j < dataKeys.length - 1; j++){
        result = result + "add edge " + jsonLine[dataKeys[j]] + " - " + jsonLine[dataKeys[j + 1]] + "\n";
      }
    }

    //output.innerHTML = output.innerHTML + result;
    var currentGstarText = $("#logDataOutput").val();
    $("#logDataOutput").val(currentGstarText + result + "\n\n");
}

function makePrebakedPlot(data){
  var formData = new Map();
  var lines = data.split("\n");
    var dataKeys = Object.keys(JSON.parse(lines[0]));
    var names = [];
    dataKeys.forEach(function(key){
      names.push(key);
    });

    while (names.length > 4){
      names.pop();
    }

    formData.set("axisNames", names);

    var connections = [];

    for(var i = 0; i < names.length - 1; i++){
      var source = names[i];
      var target = names[i + 1];
      var connectionObject = {
      "source": source,
      "target": target
    };
    connections.push(connectionObject);
    }

    formData.set("axisConnections", connections);
  // Open new window, and create hive plot
  var wnd = window.open("./hiveplot.html");
  wnd.addEventListener('load', function(){
    wnd.spawnPlot(formData);  
  });
}

function makePlot(){
  // Send form options to create hiveplot
  var formData = new Map();
  // Get axis names, and put into Map
  var axisNames = document.getElementsByClassName("axisName");
  var names = [];
  Array.prototype.forEach.call(axisNames,function(d){
    names.push(d.value.trim());
  });
  formData.set("axisNames", names);
  // Get axis connections, and put into Map
  var connections = [];

  for(var i = 0; i < document.getElementsByClassName("axisName").length - 1; i++){
    var source = document.getElementById("connection" + i + "source").value.trim();
    var target = document.getElementById("connection" + i + "target").value.trim();
    var connectionObject = {
      "source": source,
      "target": target
    };
    connections.push(connectionObject);
  }

  formData.set("axisConnections", connections);
  // Open new window, and create hive plot
  var wnd = window.open("../hiveplot.html");
  wnd.addEventListener('load', function(){
    wnd.spawnPlot(formData);  
  });
  
  // document.getElementById("hiveFrame").contentWindow.spawnPlot(pressed, formData);

  // Debugging printouts
  // console.log(formData);
}
