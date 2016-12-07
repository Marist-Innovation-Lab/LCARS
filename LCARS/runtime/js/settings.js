function genAxisNameSelectors(){
		// Clear any existing HTML first
		document.getElementById("axisNames").innerHTML = "";
		var selectElement = document.getElementById("numAxes");
		var axes = parseInt(selectElement.options[selectElement.selectedIndex].value);

		for (var i = 1; i <= axes; i++){
			document.getElementById("axisNames").innerHTML += "<input type='text' class='axisName' value='axis" + i + "'>&nbsp;&nbsp;&nbsp;";
		}
		genConnections(axes);
	}

function genConnections(x){
	var connections = document.getElementById("connections");
	// Clear any existing HTML first
	connections.innerHTML = "";
	for(var i = 0; i < x - 1; i++){
		connections.innerHTML += "FROM <input type='text' id='connection" + i + "source'>&nbsp; TO <input type='text' id='connection" + i + "target'><br>";  
	}
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
	var wnd = window.open("./hiveplot.html");
	wnd.addEventListener('load', function(){
		wnd.spawnPlot(formData);	
	});
	
	// document.getElementById("hiveFrame").contentWindow.spawnPlot(pressed, formData);

	// Debugging printouts
	// console.log(formData);
}