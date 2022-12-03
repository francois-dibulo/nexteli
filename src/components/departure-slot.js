// <departure-slot></departure-slot>
class DepartureSlotElement extends HTMLElement {
  
  constructor(label) {
    super();
    this.itinerary = {};
    this.connection = {};
    var id = this.getAttribute("data-itinerary-id");
    if (id) {
      this.itineraryId = id;
      this.itinerary = getItineraryById(id);
      try {
        var connectionData = this.getAttribute('data-connection-json')
        this.connection = JSON.parse(connectionData);
      } catch (e) {
        console.error(e);
      }

    }
  }

  connectedCallback() {
    const itinerary = this.itinerary;
    const connection = this.connection;
    
    let line = this.querySelector(".result-line");
    line.textContent = connection.line;
    if (itinerary.departure.icon === "tram") {
      line.textContent = `Tram ${connection.line}`;
    }

    let time = this.querySelector(".result-time");
    time.textContent = connection.delta < 60000 ? "now" : connection.delta_str + "'";

    let hour = this.querySelector('.result-departure-time');
    var departureTime = new Date(connection.departure.date);
    hour.textContent = prependZero(departureTime.getHours()) + ":" + prependZero(departureTime.getMinutes());

    let duration = this.querySelector('.result-duration');
    duration.textContent = "Duration: " + getMinutesHuman(connection.duration) + " mins";

    if (connection.departure.platform) {
      let platform = this.querySelector(".result-platform");
      platform.textContent = `Platform ${connection.departure.platform}`;
    }

    let img = this.querySelector(".result-icon");
    img.src = `assets/${itinerary.departure.icon}.png`;
    img.setAttribute("alt", itinerary.departure.icon);
    img.setAttribute("title", itinerary.departure.icon);

    this.updateConnection();
  }

  updateConnection() {
    const now = Date.now();

    if (this.connection.departure.ts <= now) {
      this.removeConnection();
      return;
    }

    this.updateDepartureDelta();
    setTimeout(this.updateConnection.bind(this), 10000);
  }

  updateDepartureDelta() {
    const now = Date.now();
    const delta = this.connection.departure.ts - now;
    this.connection.delta = delta;
    this.connection.delta_str = getMinutesHuman(Math.round(delta / 1000));

    let time = this.querySelector(".result-time");
    time.textContent = delta < 60000 ? "now" : this.connection.delta_str + "'";
  }

  removeConnection() {
    updateItinerary(this.itinerary);
    this.remove();
  }

};
