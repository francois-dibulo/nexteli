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
