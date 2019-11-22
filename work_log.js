//Work Log Javascript File

var timerActive = false;
var activeTopicId = "";
var time = null;
var events = [];
var topics = {};
var startedTime = "";
var timeElapsed = 0;
var previousTimeTally = 0;

var updateTickers = true;

var timeElapsedAtAlert = 0;
var timestampAtAlert = "";
var timeoutVar = null;

var show_events = true;

var MODAL_TIME_CONSTANT = 900000;

$( document ).ready(function() {
	setupEnvironment();
});

/* Setup environment when page is first loaded */
function setupEnvironment() {
	hideTemplates();
	startClock();
	setupStorage();
	render();
	attachListeners();
	checkFileAPI();
}

/* Hide templates used for dynamic content generation */
function hideTemplates() {
	$("#template").hide();
	$("#alert-template").hide();
	$("#event-template").hide();
	$("#showEvents").hide();
	$("#stopTimer").hide();
}

/* Pull data from storage when page first loads */
function setupStorage() {
	events = JSON.parse(localStorage.getItem("events"));
	if (events == null) {
		events = [];
	}

	topics = JSON.parse(localStorage.getItem("topics"));
	if (topics == null) {
		topics = {};
	}

	activeTopicId = localStorage.getItem("activeID");

	if (localStorage.getItem("startedTime") != "" && localStorage.getItem("startedTime") != null) {
		startedTime = Date.parse(localStorage.getItem("startedTime"));
	}

	updateTickers = false;
	if (localStorage.getItem("timerActive") == "true") {
		timerActive = true;
	}

	if (timerActive) {
		checkIfActive();
	}
}

/* Start clock timer */
function startClock() {
	clockTick();
}

/* Re-render topic and events lists */
function render() {
	if (activeTopicId != "" && activeTopicId != null) {
		document.title = "Work Log - " + topics[activeTopicId].name;
		$("#timeElapsed").html(formatCounter(topics[activeTopicId].time));
	}
	renderTopics();
	renderEvents();
}

/* Recreates topics list. Should also highlight the active topic (if there is one) */
function renderTopics() {
	$("#list_items").html("");

	for (var key in topics) {
		var topicDiv = $("#template").clone();
		var topicButton = topicDiv.find("#work-template");
		var timeElapsed = topicDiv.find("#time-elapsed");

		timeElapsed.html(formatCounter(topics[key].time));
		topicButton.html(topics[key].name);
		topicButton.val(topics[key].id);
		topicButton.attr("id", topics[key].id);
		topicDiv.attr("id", "work"+topics[key].id);
		timeElapsed.attr("id", "time-elapsed-"+topics[key].id);
		$("#list_items").append(topicDiv);
		topicDiv.show();
	}

	setActiveTopic();
}

function hideEvents() {
	show_events = false;
	renderEvents();

	$("#hideEvents").hide();
	$("#showEvents").show();
}

function showEvents() {
	show_events = true;
	renderEvents();

	$("#hideEvents").show();
	$("#showEvents").hide();
}

/* Recreates the events list. Only shows the latest 10 events. */
function renderEvents() {
	$("#event-items").html("");

	if (show_events) {
		var i = 0;
		if (events.length > 10) {
			i = events.length - 10;
		}
		for (;i < events.length; i++) {
			var eventsListItem = $("#event-template").clone();
			eventsListItem.html(events[i]);
			$("#event-items").append(eventsListItem);
			eventsListItem.show();
		}
	}
}

/* Attaches button listeners */
function attachListeners() {
	$("body").on('click', '.topicButton', selectTopic);
	$("body").on('click', '#deleteTopic', deleteTopic);
	$("body").on('click', '#startTimer', startTimer);
	$("body").on('click', '#stopTimer', stopTimer);
	$("body").on('click', '#startTimer', startTimer);
	$("body").on('click', '#save_button', save_data);
	$("body").on('click', '#clear-data', clearData);
	$("body").on('click', '#isActiveModalReject', modalReject);
	$("body").on('click', '#isActiveModalAccept', modalAccept);
	$("body").on('click', '#hideEvents', hideEvents);
	$("body").on('click', '#showEvents', showEvents);

	$("#import_button").change(import_data);

	$("#list_submit").on('keypress', function(e) {
	if (e.which == 13) {

		var id = addNewTopic($(this).val());

		$(this).val("");
		render();
	}

	$("body").on('click', '#createWorkItem', function() {
		addNewTopic($("#list_submit").val());
		$("#list_submit").val("");
		render();
	});
});
}

/* Checks if browser can read files for file import */
function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true; 
    } else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}

/* Fetches current time and updates timer/clock */
function clockTick() {
	var current_time = new Date();

	updateTimer(current_time);
	updateClock(current_time);
	setTimeout(clockTick, 500);
}

/* Updates Main Clock */
function updateClock(current_time) {
	 time = formatTimeElement(current_time);
	 $("#time").html(`Time: ${time}`);
}

/* Updates Work Item Timer */
function updateTimer(current_time) {
	if (timerActive && updateTickers) {
	 	timeElapsed = (current_time.valueOf() - startedTime.valueOf()) / 1000;

	 	var timeSeconds = previousTimeTally + timeElapsed;
	 	var timeString = formatCounter(timeSeconds);

	 	$("#timeElapsed").html(timeString);
	 	$("#time-elapsed-"+activeTopicId).html(timeString);
	 }
}

/* Formats a full datetime string */
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

/* Formats the work item timer value depending on length of time worked */
function formatCounter(timeSeconds) {
 	var timeString;
 	if (timeSeconds < 60) {
 		timeString = Math.floor(timeSeconds) + "s";
 	} else if (timeSeconds < 3600) {
 		timeString = Math.floor(timeSeconds / 60) + "m " + Math.floor(timeSeconds % 60) + "s";
 	} else {
 		timeString = Math.floor(timeSeconds / 3600) + "h " + Math.floor(timeSeconds / 60) + "m " + Math.floor(timeSeconds % 60) + "s";
 	}

 	return timeString;
}

/* Stops timer (if running) */
function stopTimer() {
	stopTimerUtils(timeElapsed, time);
}

function stopTimerUtils(timeElapsed, time) {
	if (timerActive) {
		timerActive = false;
		updateTickers = false;
		previousTimeTally += timeElapsed;
		topics[activeTopicId].time = previousTimeTally;
		timeElapsed = 0;

		var eventString = `Stopped working on '${topics[activeTopicId].name}' at ${time}`;
		pushEvent(eventString);

		$("#elapsedButton").prop("disabled", true);
		$("#topic").removeClass("btn-outline-primary").addClass("btn-light");
		$("#time-elapsed-"+activeTopicId).prop("disabled", true);
		$("#stopTimer").hide();
		$("#startTimer").show();
		
		setActiveTopic();

		localStorage.setItem("timerActive", false);
	}
	clearTimeout(timeoutVar);
}

/* Loads timer information */
function loadTimer() {
	previousTimeTally = topics[activeTopicId].time;
	$("#timeElapsed").html(formatCounter(previousTimeTally));
	$("#time-elapsed-"+activeTopicId).html(formatCounter(previousTimeTally));
}

/* Starts the timer (if stopped) */
function startTimer() {
	if (!timerActive) {
		timeElapsed = 0;
		loadTimer();
		startedTime = new Date();
		timerActive = true;
		updateTickers = true;
		var eventString = `Started working on '${topics[activeTopicId].name}' at ${time}`;
		pushEvent(eventString);

		$("#elapsedButton").prop("disabled", false);
		$("#topic").removeClass("btn-light").addClass("btn-outline-primary");
		$("#time-elapsed-"+activeTopicId).prop("disabled", false);
		
		setActiveTopic();

		timeoutVar = setTimeout(checkIfActive, MODAL_TIME_CONSTANT);

		$("#stopTimer").show();
		$("#startTimer").hide();

		localStorage.setItem("startedTime", startedTime);
		localStorage.setItem("timerActive", true);
	}
}

function checkIfActive() {
	timeElapsedAtAlert = timeElapsed;
	timestampAtAlert = time;
	updateTickers = false;

	$("#elapsedButton").prop("disabled", true);
	$("#topic").removeClass("btn-outline-primary").addClass("btn-light");
	$("#time-elapsed-"+activeTopicId).prop("disabled", true);
	$("#stopTimer").hide();
	$("#startTimer").show();

	$('#isActiveModalLabel').html("Are you still working on '" + topics[activeTopicId].name + "'?");
	$('#isActiveModal').modal();
}

function modalReject() {
	stopTimerUtils(timeElapsedAtAlert, timestampAtAlert);
}

function modalAccept() {
	$("#elapsedButton").prop("disabled", false);
	$("#topic").removeClass("btn-light").addClass("btn-outline-primary");
	$("#time-elapsed-"+activeTopicId).prop("disabled", false);
	$("#stopTimer").show();
	$("#startTimer").hide();

	updateTickers = true;
	timeoutVar = setTimeout(checkIfActive, MODAL_TIME_CONSTANT);
}

function pushEvent(eventString) {
	events.push(eventString);
	renderEvents();
}

/* Sets the value of the topic alert */
function setTopicAlert(val) {
	$("#topic").html(val);
}

/* Adds new Topic to list */
function addNewTopic(topic) {
	if (topic != "") {
		var topicId = Math.floor(100000 + Math.random() * 900000);
		topics[topicId] = {id: topicId, name: topic, time: 0};

		if (activeTopicId == "" || activeTopicId == null || timerActive == false) {
			activeTopicId = topicId;
		}
		storeTopics();
	}
}

function deleteTopic() {
	var topicId = $(this).parent().parent().parent().attr("id").substring(4);
	setTimeout(deleteUtils, 500, topicId);
}

function deleteUtils(topicId) {
	if (activeTopicId == topicId) {
		if (timerActive) {
			if (updateTickers) {
				stopTimer();
			} else {
				stopTimerUtils(timeElapsedAtAlert, timestampAtAlert);
			}
		}
		activeTopicId = "";
	}
	delete topics[topicId];
	storeTopics()
	renderTopics();
}

/* Selects a topic to be active (may be the current active topic) */
function selectTopic() {
	//Topic is different than existing active topic
	if (activeTopicId != $(this).val()) {
		if (activeTopicId != null && activeTopicId != "") {
			stopTimer();
			unsetActiveTopic();
		}

		activeTopicId = $(this).val();
		storeActiveID();

		setActiveTopic();
		startTimer();

		document.title = "Work Log - " + topics[activeTopicId].name;
	} else {
		toggleTimer(!timerActive);
	}

	renderEvents();
	storeLocalStorage(events, topics, activeTopicId);
}

function unsetActiveTopic() {
	$(`#${activeTopicId}`).removeClass("btn-success").removeClass("btn-danger").addClass("btn-light");
}

function setActiveTopic() {
	var activeTopic = $(`#${activeTopicId}`);
	activeTopic.removeClass("btn-light").removeClass("btn-danger").removeClass("btn-success");

	if (timerActive) {
		activeTopic.addClass("btn-danger");
	} else {
		activeTopic.addClass("btn-success");
	}

	if (activeTopicId != null && activeTopicId != "") {
		setTopicAlert(topics[activeTopicId].name);
	}
}

function toggleTimer(state) {
	if (timerActive && !state) {
		stopTimer();
	} else if (!timerActive && state) {
		startTimer();
	}
}

function clearData() {
	localStorage.clear();
	location.reload();
}

function save_data() {
	var new_events = events.slice(0);

	if (timerActive) {
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

function import_data(event) {
	var reader = new FileReader();
	var f = event.target.files[0];
    // Closure to capture the file information.
	reader.onloadend = (function(file) {
		return function(e) {

			var file_dump = JSON.parse(e.target.result);
			events = file_dump.events;
			topics = file_dump.topics;
			activeTopicId = file_dump.activeID;

			storeLocalStorage(events, topics, activeTopicId);
			render();

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

function storeEvents() {
	storeLocalStorage(events, "", "");
}

function storeTopics() {
	storeLocalStorage("", topics, "");
}

function storeActiveID() {
	storeLocalStorage("", "", activeTopicId);
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