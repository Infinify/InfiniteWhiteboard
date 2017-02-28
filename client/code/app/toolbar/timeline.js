var now = document.getElementById("now");
var timeLineSlide = document.getElementById("timelineslide");
timeLineSlide.onchange = timeLineSlide.oninput = function(event) {
  window.timestamp = minTime + (maxTime - minTime) * timeLineSlide.value / 100;
  now.textContent = new Date(timestamp);
  window.timeAnimation(false, true);
};

function updateTimeLine() {
  var t = window.timestamp || maxTime;
  now.textContent = new Date(t);
  timeLineSlide.value = 100 * (t - minTime) / (maxTime - minTime);
}
document.addEventListener("timeAnimation", updateTimeLine);

if (!Math.sign) {
  Math.sign = function(x) {
    // If x is NaN, the result is NaN.
    // If x is -0, the result is -0.
    // If x is +0, the result is +0.
    // If x is negative and not -0, the result is -1.
    // If x is positive and not +0, the result is +1.
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
      return Number(x);
    }
    return x > 0 ? 1 : -1;
  };
}

var timeCallerTimeout;
var timeLapseButton = document.getElementById("timeLapseButton");
function stopTimeAnimation() {
  timeLapseButton.innerHtml = '<i class="icon-play"></i>';
  timeCallerTimeout = clearInterval(timeCallerTimeout);
  window.timeAnimation();
}

var timeStep = (-1000) * 60 * 60;
function timeCaller() {
  timestamp += timeStep;
  if (timestamp >= maxTime || timestamp <= minTime) {
    stopTimeAnimation();
  } else {
    window.timeAnimation(true);
  }
}

var timeRange = document.getElementById("timerange");
timeRange.onchange = function() {
  var value = timeRange.value;
  timeStep = Math.sign(value) * (Math.exp(Math.abs(value)) - 1);
};
timeRange.value = Math.sign(timeStep) * Math.log(Math.abs(timeStep) + 1);

function startTimeAnimation() {
  timeLapseButton.innerHtml = '<i class="icon-pause"></i>';
  timestamp = Math.min(
    maxTime,
    Math.max(minTime, window.timestamp || +new Date())
  );
  if (timestamp === maxTime || timestamp === minTime) {
    timeStep = -timeStep;
    timeRange.slider(
      "value",
      Math.sign(timeStep) * Math.log(Math.abs(timeStep) + 1)
    );
  }
  timeCallerTimeout = setInterval(timeCaller, 15);
}

document.getElementById("timeLapseButton").onclick = function() {
  if (timeCallerTimeout) {
    stopTimeAnimation();
  } else {
    startTimeAnimation();
  }
};

document.getElementById("firstPathButton").onclick = function() {
  window.timestamp = minTime;
  window.timeAnimation();
};

document.getElementById("nowButton").onclick = function() {
  window.timestamp = +new Date();
  window.timeAnimation();
};
