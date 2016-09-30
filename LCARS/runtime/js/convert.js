function convertToGstar() {
	
	var logData = document.getElementById("logData");
	var output = document.getElementById("logDataOutput");
	var data = logData.value;
	var line = data.split("\n");
	var jsonLine;
	var ipColor = "black"
	var countryColor = "green"
	output.innerHTML = "";
	output.innerHTML = output.innerHTML + "new graph\n";

	for (var i = 0; i < line.length; i++){
		// Will need to refactor with regex to make dynamic.
		jsonLine = JSON.parse(line[i]);
		if(typeof jsonLine.ip == 'undefined' || typeof jsonLine.country == 'undefined'){
			output.innerHTML = output.innerHTML + "ip or country is undefined in: " + JSON.stringify(jsonLine) + "\n";
		} else {
			output.innerHTML = output.innerHTML + "add vertex ip" + jsonLine.ip + " with attributes(color=" + ipColor + ")" + "\n";
			output.innerHTML = output.innerHTML + "add vertex " + jsonLine.country.replace(/\s+/g, '') + " with attributes(color=" + countryColor + ")"+ "\n";
		}
	}

	for (var i = 0; i < line.length; i++) {
		jsonLine = JSON.parse(line[i]);
		if(typeof jsonLine.ip == 'undefined' || typeof jsonLine.country == 'undefined'){
			output.innerHTML = output.innerHTML + "ip or country is undefined in: " + JSON.stringify(jsonLine) + "\n";
		} else {
		output.innerHTML = output.innerHTML + "add edge ip" + jsonLine.ip + " - " + jsonLine.country.replace(/\s+/g, '') + "\n";
		}
	}
}