//Work Log Javascript File

var timeRunning = false;
var activeTopicId = "";
var time = null;
var events = [];
var topics = {};
var startedTime = "";
var timeElapsed = 0;
var previousTimeTally = 0;

$( document ).ready(function() {
	setupEnvironment();
});

function setupEnvironment() {
	hideTemplates();
	setupStorage();
	setClock();
	renderTopics();
	attachListeners();
	checkFileAPI();
}

function attachListeners() {
	$("body").on('click', '.topicButton', changeTopic);

	$("body").on('click', '#toggle', function() {
		adjustRunning(!timeRunning);
	});

	$("body").on('click', '#save_button', save_data);
	$("#import_button").change(import_data);

	$("#list_submit").on('keypress', function(e) {
	if (e.which == 13) {

		var id = addNewTopic($(this).val());

		$(this).val("");
		renderTopics();
	}
});
}

function hideTemplates() {
	$("#template").hide();
	$("#event").hide();
	$("#alert-template").hide();
}

function setupStorage() {
	events = JSON.parse(localStorage.getItem("events"));
	if (events == null) {
		events = [];
	}

	if (events != null && events != "" && events.length > 0) {
		console.log(events);
		updateEvent(events[events.length-1], false)
	}

	topics = JSON.parse(localStorage.getItem("topics"));
	if (topics == null) {
		topics = {};
	}

	activeTopicId = localStorage.getItem("activeID");
}

function setClock() {
	var current_time = new Date();


	 if (timeRunning) {
	 	timeElapsed = (current_time.valueOf() - startedTime.valueOf()) / 1000;

	 	var timeSeconds = previousTimeTally + timeElapsed;
	 	var timeString = formatCounter(timeSeconds);

	 	$("#timeElapsed").html(timeString);
	 }

	 time = formatTimeElement(current_time);
	 $("#time").html(`Current Time: ${time}`);
	 setTimeout(setClock, 500);
}

function formatTimeElement(date) {
	h = date.getHours();
	m = date.getMinutes();
	s = date.getSeconds();
	if (m < 10)
		m = `0${m}`;
	if (s < 10)
		s = `0${s}`;
	return `${h}:${m}:${s}`;
}

function formatCounter(timeSeconds) {
 	var timeString;
 	var elapsedDate = new Date(timeSeconds*1000);
 	if (timeSeconds < 60) {
 		timeString = elapsedDate.getSeconds() + "s";
 	} else if (timeSeconds < 3600) {
 		timeString = elapsedDate.getMinutes() + "m " + elapsedDate.getSeconds() + "s";
 	} else {
 		timeString = formatTimeElement(elapsedDate);
 	}

 	return timeString;
}

function renderTopics() {
	$("#list_items").html("");

	for (var key in topics) {
		var topicButton = $("#template").clone();
		topicButton.html(topics[key].name);
		topicButton.val(topics[key].id);
		topicButton.attr("id", topics[key].id);
		$("#list_items").append(topicButton);
		topicButton.show();
	}

	if (activeTopicId != null && activeTopicId != "") {
		setTopicAlert(topics[activeTopicId].name);
	}

	highlightActive();
}

function setTopicAlert(val) {
	$("#topic").html("Current Topic: " + val);
}

function addNewTopic(topic) {
	var topicId = Math.floor(100000 + Math.random() * 900000);
	topics[topicId] = {id: topicId, name: topic, time: 0};
	storeTopics(topics);
}

function changeTopic() {
	if (activeTopicId != $(this).val()) {

		if (activeTopicId != null && activeTopicId != "") {
			adjustRunning(false);
			topics[activeTopicId].time = previousTimeTally;
			unhighlightActive();
		}

		activeTopicId = $(this).val();
		setTopicAlert($(this).html());
		storeActiveID(activeTopicId);

		highlightActive();
		previousTimeTally = topics[activeTopicId].time;
		$("#timeElapsed").html(formatCounter(previousTimeTally));
	} else {
		adjustRunning(!timeRunning, true);
	}

	storeLocalStorage(events, topics, activeTopicId);
}

function unhighlightActive() {
	$(`#${activeTopicId}`).removeClass("btn-success").removeClass("btn-danger").addClass("btn-light");
}

function highlightActive() {
	var activeTopic = $(`#${activeTopicId}`);
	activeTopic.removeClass("btn-light")

	if (timeRunning) {
		activeTopic.addClass("btn-danger");
	} else {
		activeTopic.addClass("btn-success");
	}
}

function adjustRunning(state, keepTime=false) {
	var eventString = "";
	if (timeRunning && !state) {
		eventString = `Stopped working on '${topics[activeTopicId].name}' at ${time}`;
	}

	if (!timeRunning && state) {
		eventString = `Started work on '${topics[activeTopicId].name}' at ${time}`;
	}

	adjustRunningHelper(state, eventString, true, keepTime);
}

function adjustRunningHelper(state, eventString, store=true, keepTime=false) {
	updateEvent(eventString, store);

	timeRunning = state;

	if (timeRunning) {
		$("#toggle").html("Stop");
		$("#toggle").removeClass("btn-success").addClass("btn-danger");
		$(`#${activeTopicId}`).removeClass("btn-success").addClass("btn-danger");
		startedTime = new Date();
		$("#timeElapsed").prop("disabled", false);
	} else {
		if (keepTime) {
			previousTimeTally += timeElapsed;
		}
		$("#timeElapsed").prop("disabled", true);
		$("#toggle").html("Start");
		$("#toggle").removeClass("btn-danger").addClass("btn-success");
		$(`#${activeTopicId}`).removeClass("btn-danger").addClass("btn-success");
	}
	timeElapsed = 0;
}

function updateEvent(eventString, store=true) {
	if (eventString != "") {
		$("#event").html(eventString);
		$("#event").show();

		if (store) {
		events.push(eventString);
		console.log(events);

		storeEvents(events);
		}
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

			storeLocalStorage(events, topics, activeTopicId);
			renderTopics();

			if (events != null && events != "" && events.length > 0) {
				adjustRunningHelper(false, events[events.length-1], true)
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

function storeEvents(events) {
	storeLocalStorage(events, "", "");
}

function storeTopics(topics) {
	storeLocalStorage("", topics, "");
}

function storeActiveID(activeID) {
	storeLocalStorage("", "", activeID);
}

function storeLocalStorage(events="", topics="", activeID="") {
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