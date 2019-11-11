//Work Log Javascript File

var timeRunning = false;
var activeTopicId = "";
var time = null;
var events = [];
var topics = {};

$( document ).ready(function() {
	setupEnvironment();
});

function setupEnvironment() {
	$("#template").hide();

	$("#event").hide();

	$("#alert-template").hide();
	setupStorage();
	setClock();

	$("body").on('click', '.topicButton', changeTopic);

	$("body").on('click', '#toggle', function() {
		adjustRunning(!timeRunning);
	});

	$("body").on('click', '#save_button', save_data);

	renderTopics();

	checkFileAPI();
	$("#import_button").change(import_data);
}

function setupStorage() {
	events = JSON.parse(localStorage.getItem("events"));
	if (events == null) {
		events = [];
	}

	if (events != null && events != "" && events.length > 0) {
		console.log(events);
		$("#event").html(events[events.length-1]);
		$("#event").show();
	}

	topics = JSON.parse(localStorage.getItem("topics"));
	if (topics == null) {
		topics = {};
	}

	activeTopicId = localStorage.getItem("activeID");
}

function setClock() {
 var current_time = new Date();
 var h = current_time.getHours();
 var m = formatTimeElement(current_time.getMinutes());
 var s = formatTimeElement(current_time.getSeconds());
 time = `${h}:${m}:${s}`
 $("#time").html(`Current Time: ${time}`);
 setTimeout(setClock, 500);
}

function formatTimeElement(num) {
	if (num < 10)
		return `0${num}`;
	else
		return num
}

$("#list_submit").on('keypress', function(e) {
	if (e.which == 13) {

		addNewTopic($(this).val());

		$(this).val("");
		renderTopics();
	}
});

function renderTopics() {
	$("#list_items").html("");

	for (var key in topics) {
		var topicButton = $("#template").clone();
		topicButton.html(topics[key].name);
		topicButton.val(topics[key].id);
		$("#list_items").append(topicButton);
		topicButton.show();
	}

	if (activeTopicId != null && activeTopicId != "") {
		$("#topic").html("Current Topic: " + topics[activeTopicId].name);
	}
}

function addNewTopic(topic) {
	var topicId = Math.floor(100000 + Math.random() * 900000);
	topics[topicId] = {id: topicId, name: topic};
	updateTopics(topics);
}

function changeTopic() {
	if (activeTopicId != $(this).val()) {
		activeTopicId = $(this).val();
		$("#topic").html("Current Topic: " + $(this).html());
		console.log("changing topics");
		updateActiveID(activeTopicId);

		adjustRunning(false);
	}
}

function adjustRunning(state) {
	var eventString = "";
	if (timeRunning && !state) {
		eventString = `Stopped working on '${topics[activeTopicId].name}' at ${time}`;
	}

	if (!timeRunning && state) {
		eventString = `Started work on '${topics[activeTopicId].name}' at ${time}`;
	}

	adjustRunningHelper(state, eventString);
}

function adjustRunningHelper(state, eventString) {
	updateEvent(eventString);

	timeRunning = state;

	if (timeRunning) {
		$("#toggle").html("Stop");
		$("#toggle").removeClass("btn-success").addClass("btn-danger");
	} else {
		$("#toggle").html("Start");
		$("#toggle").removeClass("btn-danger").addClass("btn-success");
	}
}

function updateEvent(eventString) {
	if (eventString != "") {
		$("#event").html(eventString);
		$("#event").show();
		events.push(eventString);
		console.log(events);

		updateEvents(events);
	}
}

function save_data() {
	var new_events = events.slice(0);

	if (timeRunning) {
		new_events.push(`Stopped working on '${topics[activeTopicId].name}' at ${time}`);
	}
	var file_dump = {"events" : new_events, "topics" : topics, "activeID": activeTopicId}
	var blob = new Blob([JSON.stringify(file_dump, null, 2)], {type : 'application/json'});
	var url = window.URL.createObjectURL(blob);
	$("#file_download").html(url);
	$("#file_download").attr("href", url);
	$("#file_download").attr("download", "work_log_dump.json");
	$("#file_download")[0].click();
}

function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true; 
    } else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}

function import_data(event) {
	var reader = new FileReader();
	var f = event.target.files[0];
    console.log(event.target.files[0]);

    // Closure to capture the file information.
	reader.onloadend = (function(file) {
		return function(e) {
			console.log(e.target.result);

			var file_dump = JSON.parse(e.target.result);
			events = file_dump.events;
			topics = file_dump.topics;
			activeTopicId = file_dump.activeID;

			updateLocalStorage(events, topics, activeTopicId);
			renderTopics();

			if (events != null && events != "" && events.length > 0) {
				adjustRunningHelper(false, events[events.length-1])
			}

			var updateAlert = $("#alert-template").clone();
			$("#alerts").append(updateAlert);
			updateAlert.show();

			setTimeout(function() {
		        updateAlert.alert('close');
		    }, 10000);
		};
	})(f);

	// Read in the image file as text
	reader.readAsText(f);
}

function updateEvents(events) {
	updateLocalStorage(events, "", "");
}

function updateTopics(topics) {
	updateLocalStorage("", topics, "");
}

function updateActiveID(activeID) {
	updateLocalStorage("", "", activeID);
}

function updateLocalStorage(events="", topics="", activeID="") {
	if (events != null && events != "") {
		localStorage.setItem("events", JSON.stringify(events));
	}
	
	if (topics != null && topics != "") {
		localStorage.setItem("topics", JSON.stringify(topics));
	}
	
	if (activeID != null && activeID != "") {
		localStorage.setItem("activeID", activeID);
	}
}