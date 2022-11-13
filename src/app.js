/**
 * TODO: 
 * [ ] Delete itinerary
 * [ ] Update departure countdown
 * [ ] Loading animation
 */

class StationComponentElement extends HTMLElement {
  
  constructor(label) {
    super();
    this.data = {
    	label: this.getAttribute("label")
    };
  }

  connectedCallback() {
  	console.log('Custom square element added to page.', this);
  	
  	var label = document.querySelector(".station-label");
  	label.textContent = this.data.label;
	}

};

class Itinerary {

	constructor(departure, destination, createdTs) {
		this.destination = destination || null;
		this.departure = departure || null;
		this.createdTs = createdTs || Date.now();
		this.connections = [];
		this.lastCachedTs = 0;
	}

	getID() {
		return this.departure.id + "::" + this.destination.id;
	}

	serialize() {
		return {
			created: this.createdTs,
			destination: this.destination,
			departure: this.departure,
		};
	}

	setDestination(destination) {
		this.destination = destination;
	}

	setDeparture(departure) {
		this.departure = departure;
	}

	cacheExpired() {
		const CACHE_TIMEOUT = 1000 * 30;
		return !this.lastCachedTs || (this.lastCachedTs && Date.now() + CACHE_TIMEOUT > this.lastCachedTs);
	}

	updateConnections(force) {
		const now = Date.now();

		// Return from Cache
		if (!force && !this.cacheExpired()) {
			console.warn("Using cached connectsion", this.connections);
			return Promise.resolve(this.connections);
		}

		return findNextDeparture(this)
			.then((connections) => {
				this.lastCached = now;
				this.connections = connections || [];
			});
	}

	getNextConnection() {
		var next = getNextConnection(this.connections);
		if (!next) {
			return this.updateConnections()
				.then(() => getNextConnection(this.connections));
		}
		return Promise.resolve(next);
	}

}

class StationForm {

	constructor(id) {
		this.state = 'init';
		this.form = document.forms[id];
	}

	reset() {
		this.toggleSubmitButton(false);
		this.form['destination'].value = '';
		this.form['departure'].value = '';

		var lists = [
			document.getElementById('departureCandidatesList'),
			document.getElementById('destinationCandidatesList')
		];

		for (var i = 0; i < lists.length; ++i) {
			var node = lists[i];
			node.classList.remove('hidden');
			node.innerHTML = '';
		}
	}

	setDeparture(value) {
		this.form['departure'].value = value;
	}

	setDestination(value) {
		this.form['destination'].value = value;
	}

	toggleSubmitButton(state) {
		this.form['submit'].classList.toggle('hidden', state);
	}

}

function onConnectionListNavInput(e, direction) {
	var listEle = e.parentNode.querySelector('.result-connections-list');
	//listEle.children[1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	var distance = listEle.scrollLeft + (listEle.children[1].offsetWidth * direction);
	listEle.scrollTo(distance, 0);
}


function init() {

	const STORAGE_KEY = "itineraries";

	//customElements.define("station-input", StationComponentElement);
	var itineraries = [];
	var currentItinerary = new Itinerary();
	var stationForm = new StationForm('form-search');

	function showForm() {
		stationForm.reset();
		currentItinerary = new Itinerary();
		ViewManager.show('view-search');
	}

	function clearAll() {
		const conf = confirm('Do you want to delete all your rides?');
		if (conf) {
			localStorage.removeItem(STORAGE_KEY);
			itineraries = [];
			showForm();
		}
	}

	function persistStorage() {
		var serializedItineraries = [];
		for (var i = 0; i < itineraries.length; i++) {
			const serializedItinerary = itineraries[i].serialize();
			console.log("persist", serializedItinerary);
			serializedItineraries.push(serializedItinerary);
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedItineraries));
	}

	function restoreStorage() {
		//localStorage.removeItem(STORAGE_KEY);
		var success = false;
		try {
			var data = localStorage.getItem(STORAGE_KEY);
		  if (data) {
		    storageItineraries = JSON.parse(data);
		    if (storageItineraries && storageItineraries.length) {

		    	storageItineraries.sort((a, b) => {
		    		return a.created - b.created;
		    	});

		    	for (var i = 0; i < storageItineraries.length; i++) {
		    		var it = storageItineraries[i];
		    		const itineraryInstance = new Itinerary(it.departure, it.destination, it.created);
		    		itineraries.push(itineraryInstance);
		    	}

		    	// We need a Queue, otherwise the list of itineraries is not in order of the
		    	// createdTs, but of which connections are loaded first
		    	var itinerariesQueue = itineraries.slice();
		    	var workQueue = function workQueue(itineraryInstance) {
		    		if (!itineraryInstance) {
		    			return;
		    		}

		    		onStationsSelected(itineraryInstance).then(() => {
		    			workQueue(itinerariesQueue.shift());
		    		});
		    	};

		    	workQueue(itinerariesQueue.shift());

			    if (itineraries.length) {
						success = true;
			    }

			  }
		  }
		} catch (e) {
			console.error(e);
		}
		return success;
	}

	function removeIternary(id) {
		var index = -1;
		for (var i = itineraries.length - 1; i >= 0; i--) {
			if (itineraries[i].getID() === id) {
				itineraries.splice(i, 1);
				break;
			}
		}
		persistStorage();

		if (!itineraries.length) {
			showForm();
		}
	}

	function searchStations(departure, destination) {

		return new Promise((resolve) => {

			if (!departure || !destination) return resolve(false);

			findStationsCandidates(departure).then((departureCandidates) => {
					// { stations: [ { id, name, score, coordinate, icon } ] }

					findStationsCandidates(destination).then((destinationCandidates) => {

						console.info("Candidates", departureCandidates, destinationCandidates);

						if (departureCandidates && departureCandidates.length) {
							fillCandidatesList(document.getElementById('departureCandidatesList'), departureCandidates, true);
						}

						if (departureCandidates && departureCandidates.length) {
							fillCandidatesList(document.getElementById('destinationCandidatesList'), destinationCandidates, false);
						}

						resolve(true);

					});
			});

		});

	}

	function fillCandidatesList(el, candidates, isDeparture) {
		el.innerHTML = "";
		const tmpl = document.getElementById('candidate-list-item');

		for (var i = 0; i < candidates.length; i++) {
			const tmplNode = tmpl.content.cloneNode(true);
			const candidate = candidates[i];
			if (!candidate.icon) continue;
			
			let li = tmplNode.querySelector("li");
			li.setAttribute('data-id', candidate.id);

			let name = tmplNode.querySelector(".candidate-name");
			name.textContent = candidate.name;

			let img = tmplNode.querySelector(".candidate-icon");
			img.src = `assets/${candidate.icon}.png`;
			img.setAttribute("alt", candidate.icon);
			img.setAttribute("title", candidate.icon);

			el.appendChild(tmplNode);

			(function(candidate) {
				li.addEventListener("click", function() {
					addStation(candidate, isDeparture);
					if (li.parentNode) {
						li.parentNode.classList.add("hidden");
					}
				});
			})(candidate);
		}
	}

	function addStation(candidate, isDeparture) {
		if (isDeparture) {
			currentItinerary.setDeparture(candidate);
			stationForm.setDeparture(candidate.name);
		} else {
			currentItinerary.setDestination(candidate);
			stationForm.setDestination(candidate.name);
		}

		if (currentItinerary.departure && currentItinerary.destination) {
			itineraries.push(currentItinerary);
			persistStorage();
			stationForm.reset();
			onStationsSelected(currentItinerary);
		}
		console.log("currentItinerary", currentItinerary);
	}

	function onStationsSelected(currentItinerary) {
		ViewManager.show('view-result');

		return currentItinerary.updateConnections(currentItinerary)
			.then(() => {
				renderConnectionsList(currentItinerary);
			// currentItinerary.getNextConnection().then((next) => {
			// 	if (next) {
			// 		renderConnectionItem(currentItinerary, next);
			// 	}
			// });
		});
	}

	function renderConnectionsList(itinerary) {

		const tmpl = document.getElementById('result-list-item');
		const tmplNode = tmpl.content.cloneNode(true);
		let li = tmplNode.querySelector("li");

		li.setAttribute('data-id', itinerary.getID());

		let departure = tmplNode.querySelector(".result-departure");
		departure.textContent = itinerary.departure.name;

		let destination = tmplNode.querySelector(".result-destination");
		destination.textContent = itinerary.destination.name;

		let connectionsList = tmplNode.querySelector(".result-connections-list");

		let removeConnectionButton = document.createElement('div');
		removeConnectionButton.classList.add('btn-remove-itinererary', 'flex', 'flex-col', 'justify-center', 'font-700', 'font-white');
		removeConnectionButton.innerHTML = "X";
		connectionsList.appendChild(removeConnectionButton);

		removeConnectionButton.addEventListener('click', () => {
			var conf = confirm("Do you want to remove this item?");
			if (conf) {
				var id = li.getAttribute("data-id");
				if (id) {
					removeIternary(id);
					li.remove();
				}
			}
		});

		for (var i = 0; i < itinerary.connections.length; i++) {
			if (itinerary.connections[i].delta > 0) {
				var connectionCard = renderConnectionItem(itinerary, itinerary.connections[i]);
				if (connectionCard) {
					connectionsList.appendChild(connectionCard);
				}
			}
		}

		document.getElementById('result-list').appendChild(tmplNode);

		// Scroll further, to hide remove button on the left
		setTimeout(() => {
			var listEle = tmplNode; //e.parentNode.querySelector('.result-connections-list');
			//listEle.children[1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
			var distance = removeConnectionButton.offsetWidth;// listEle.scrollLeft + (listEle.children[1].offsetWidth * direction);
			connectionsList.scrollTo(distance, 0);
		}, 100);

		// We need to check if the remove button is visible. If yes, then we need to hide the
		// nav-prev button, so that we can actually click on it (:
		let options = {
		  root: connectionsList,
		  rootMargin: '0px',
		  threshold: 0.5
		};

		let observer = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				var prevEle = entry.target.parentNode.parentNode.querySelector('.connection-nav-prev');
				if (prevEle) {
					prevEle.classList.toggle('hidden', entry.isIntersecting);
				}
			});
		}, options);

		observer.observe(removeConnectionButton);
	}

	function renderConnectionItem(itinerary, connection) {
		const tmpl = document.getElementById('connection-item');
		const tmplNode = tmpl.content.cloneNode(true);

		let line = tmplNode.querySelector(".result-line");
		line.textContent = connection.line;
		if (itinerary.departure.icon === "tram") {
			line.textContent = `Tram ${connection.line}`;
		}

		let time = tmplNode.querySelector(".result-time");
		time.textContent = connection.delta < 60000 ? "now" : connection.delta_str + "'";

		let hour = tmplNode.querySelector('.result-departure-time');
		var departureTime = new Date(connection.departure.date);
		hour.textContent = departureTime.getHours() + ":" + departureTime.getMinutes();

		let duration = tmplNode.querySelector('.result-duration');
		duration.textContent = "Duration: " + getMinutesHuman(connection.duration) + " mins";

		if (connection.departure.platform) {
			let platform = tmplNode.querySelector(".result-platform");
			platform.textContent = `Platform ${connection.departure.platform}`;
		}

		let img = tmplNode.querySelector(".result-icon");
		img.src = `assets/${itinerary.departure.icon}.png`;
		img.setAttribute("alt", itinerary.departure.icon);
		img.setAttribute("title", itinerary.departure.icon);

		return tmplNode;
		//document.getElementById('result-list').appendChild(tmplNode);
	}
	
	stationForm.form.addEventListener('submit', function(e) {
		const departure = e.target.departure.value.trim();
		const destination = e.target.destination.value.trim();

		if (departure && destination) {
			searchStations(departure, destination)
				.then((success) => {
					if (success) {
						stationForm.toggleSubmitButton(true);
					} else {
						console.warn('Could not find stations', departure, destination);
					}
				}).catch((e) => console.warn(e));
		}

		e.preventDefault();
		return false;
	});

	document.getElementById('btn-go-form').addEventListener('click', showForm);
	//document.getElementById('btn-clear-all').addEventListener('click', clearAll);


	ViewManager.init();
	if (!restoreStorage()) {
		showForm();
	}

}

window.onload = init;
