// https://transport.opendata.ch/docs.html
const OPENDATA_BASE_URL = 'https://transport.opendata.ch/v1/';

function findStationsCandidates(query) {
	var url = `${OPENDATA_BASE_URL}locations?query=${query}&type=station`;

	var filterCandidates = function(candidates) {
		return candidates.stations.filter((c) => c.id);
	};

	return fetch(url)
		.then((r) => r.json())
		.then((r) => filterCandidates(r));
}


function findNextDeparture(itinerary) {
	var url = `${OPENDATA_BASE_URL}connections?from=${itinerary.departure.id}&to=${itinerary.destination.id}`;

	var formatConnections = function(connections) {
		var result = [];
		var now = Date.now();
		console.log("formatConnections", connections);
		
		for (var i = 0; i < connections.length; i++) {
			let connection = connections[i];

			var departureTimestamp = connection.from.departureTimestamp * 1000;
			var delta = departureTimestamp - now;
			var data = {
				// Duration in seconds
				duration: connection.to.arrivalTimestamp - connection.from.departureTimestamp,
				transfers: connection.transfers,
				line: connection.products.join(", "), // ['S2']
				departure: {
					date: connection.from.departure,
					ts: departureTimestamp,
					platform: connection.from.platform, // "4"
				},
				arrival: {
					ts: connection.to.arrivalTimestamp * 1000,
					date: connection.to.arrival,
					platform: connection.to.platform,
				},
				delta: delta,
				delta_str: getMinutesHuman(Math.round(delta / 1000))
			};
			result.push(data);
		}

		result = result.sort(function(a, b) {
			return a.departure.ts - b.departure.ts;
		});

		return result;
	};

	return fetch(url)
		.then((r) => r.json())
		.then((r) => formatConnections(r.connections));
}

function getNextConnection(connections) {
	const now = Date.now();
	var next = null;

	for (var i = 0; i < connections.length; i++) {
		var con = connections[i];

		if (now < con.departure.ts) {
			next = con;
			var delta = con.departure.ts - now;
			next.delta = delta;
			next.delta_str = getMinutesHuman(Math.round(delta / 1000));
			break;
		}
	}

	return next;
}
