/**
 * TODO: 
 * [ ] On remove connection -> load new ones. Remove from itineries array
 * [ ] Loading animation
 */

const STORAGE_KEY = "itineraries";

var itineraries = [];
var currentItinerary = null;
var stationForm = null;

function getItineraryById(id) {
	for (var i = 0; i < itineraries.length; i++) {
		if (itineraries[i].getID() === id) {
			return itineraries[i];
		}
	}
	return null;
}

function onConnectionListNavInput(e, direction) {
	var listEle = e.parentNode.querySelector('.result-connections-list');
	//listEle.children[1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	var distance = listEle.scrollLeft + (listEle.children[1].offsetWidth * direction);
	listEle.scrollTo(distance, 0);
}

function updateItinerary(itinerary) {
	// return itinerary.updateConnections(currentItinerary)
	// 	.then(() => {
	// 		renderConnectionsList(itinerary);
	// });
}

function showForm() {
	stationForm.reset();
	currentItinerary = new Itinerary();
	if (itineraries.length) {
		document.getElementById('btn-show-connections').classList.toggle('hidden', !itineraries.length);
	}
	ViewManager.show('view-search');
}

function showConnections() {
	ViewManager.show('view-result');
}

function clearAll() {
	const conf = confirm('Do you want to delete all your rides?');
	if (conf) {
		clearStorage();
		itineraries = [];
		showForm();
	}
}

function clearStorage() {
	localStorage.removeItem(STORAGE_KEY);
}

function persistStorage() {
	var serializedItineraries = [];
	for (var i = 0; i < itineraries.length; i++) {
		const serializedItinerary = itineraries[i].serialize();
		serializedItineraries.push(serializedItinerary);
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedItineraries));
}

function restoreStorage() {
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
	showConnections();

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

	var listContainerEle = document.getElementById('result-list');
	listContainerEle.appendChild(tmplNode);

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
	const tmpl = document.getElementById('departure-slot-item');
	const tmplNode = tmpl.content.cloneNode(true);
	let departureSlotEle = tmplNode.querySelector('departure-slot');
	departureSlotEle.setAttribute('data-itinerary-id', itinerary.getID());
	departureSlotEle.setAttribute('data-connection-json', JSON.stringify(connection));
	return departureSlotEle;
}

function setupServiceWorker() {
	if ('serviceWorker' in navigator) {

		if (isMobile() && !isPWA()) {
			document.getElementById("pwa-install-app-container").classList.remove("hidden");
		}

		window.addEventListener('beforeinstallprompt', (event) => {
		  // Prevent the mini-infobar from appearing on mobile.
		  event.preventDefault();
		  console.log('👍', 'beforeinstallprompt', event);
		  // Stash the event so it can be triggered later.
		  window.deferredPrompt = event;
		  // Remove the 'hidden' class from the install button container.
		  //divInstall.classList.toggle('hidden', false);
		});

		document.getElementById('btn-install-app').addEventListener('click', async () => {
      if (window.deferredPrompt !== null) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            window.deferredPrompt = null;
            document.getElementById("pwa-install-app-container").classList.add("hidden");
        }
      }
    });

	  navigator.serviceWorker.register('./service-worker.js')
	  	.then(() => console.log("Install succeeded"))
    	.catch((e) => console.error(e));
	}
}

function init() {
	customElements.define("departure-slot", DepartureSlotElement);

	currentItinerary = new Itinerary();
	stationForm = new StationForm('form-search');

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
	document.getElementById('btn-show-connections').addEventListener('click', showConnections);

	setupServiceWorker();
	ViewManager.init();
	if (!restoreStorage()) {
		showForm();
	}
}

window.onload = init;
