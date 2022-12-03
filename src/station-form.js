
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
