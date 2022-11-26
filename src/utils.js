/**
 * Takes seconds and outputs it as formated time string
 * @example 65 seconds -> "01:05"
 * @param {Number} input_seconds - The seconds to display
 * @return {String}
 */
function getFormatedSeconds(input_seconds) {
  var zero = function(num) {
    return num < 10 ? '0' + num : num;
  };
  var minutes = Math.floor(input_seconds / 60);
  var seconds = input_seconds - (minutes * 60);
  return zero(minutes) + ':' + zero(seconds);
}

function getMinutesHuman(input_seconds) {
  var zero = function(num) {
    return num < 10 ? '0' + num : num;
  };
  var minutes = Math.floor(input_seconds / 60);
  return minutes;
}

function isMobile() {
   if (navigator.userAgent.match(/Android/i)
       || navigator.userAgent.match(/webOS/i)
       || navigator.userAgent.match(/iPhone/i)
       || navigator.userAgent.match(/iPod/i)
       || navigator.userAgent.match(/BlackBerry/i)
       || navigator.userAgent.match(/Windows Phone/i)) {
      return true;
    }
    return false;
}
