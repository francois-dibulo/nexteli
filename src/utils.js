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

/**
 * Prepends a zero for all numbers below 9
 * @example 5 -> "05", 12 -> "12"
 * @param {Number} num
 * @return {String}
 */
function prependZero(num) {
  return num < 10 ? '0' + num : num;
}

/**
 * Converts seconds to minutes (rounded)
 * @param {Number} seconds
 * @return {Number}
 */
function getMinutesHuman(seconds) {
  return Math.floor(seconds / 60);
}

/**
 * Returns true if we are in the PWA app
 * @return {boolean}
 */
function isPWA() {
  // See manifest.webmanifest - the PAW appends a 'ctx' param
  return window.location.search.indexOf("ctx=pwa") > -1;
}

/**
 * Returns true if we are likely on a mobile phone
 * @return {boolean}
 */
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
