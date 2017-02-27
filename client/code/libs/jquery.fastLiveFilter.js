/**
 * fastLiveFilter jQuery plugin 1.0.3
 * 
 * Copyright (c) 2011, Anthony Bush
 * License: <http://www.opensource.org/licenses/bsd-license.php>
 * Project Website: http://anthonybush.com/projects/jquery_fast_live_filter/
 **/

function fastLiveFilter(input, list, options) {
	// Options: input, list, timeout, callback
	options = options || {};
	var timeout = options.timeout || 0;
	var callback = options.callback || function() {};
	
	var keyTimeout;

  var lis = list.children;
  var len = lis.length;
	var oldDisplay = len > 0 ? lis[0].style.display : "block";
	callback(len); // do a one-time callback on initialization to make sure everything's in sync
	
	input.onchange = function onChange() {
		// var startTime = new Date().getTime();
		var filter = input.value.toLowerCase();
		var li;
		var numShown = 0;
    lis = list.children;
    len = lis.length;
		for (var i = 0; i < len; i++) {
			li = lis[i];
			if ((li.textContent || li.innerText || "").toLowerCase().indexOf(filter) >= 0) {
				if (li.style.display == "none") {
					li.style.display = oldDisplay;
				}
				numShown++;
			} else {
				if (li.style.display != "none") {
					li.style.display = "none";
				}
			}
		}
		callback(numShown);
		return false;
	};
	input.onkeydown = function onKeyDown() {
		// TODO: one point of improvement could be in here: currently the change event is
		// invoked even if a change does not occur (e.g. by pressing a modifier key or
		// something)
		clearTimeout(keyTimeout);
		keyTimeout = setTimeout(onChange, timeout);
	};
}
window.fastLiveFilter = fastLiveFilter;