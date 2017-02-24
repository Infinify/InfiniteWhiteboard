$("#toolContainer").append(ss.tmpl["toolbar-timeline"].render({}));

var now = document.getElementById("now");
var timeLineSlide = $("#timelineslide").slider({
  range: "max",
  min: 0,
  max: 100,
  value: 0,
  slide: function(event, ui) {
    window.timestamp = minTime + (maxTime - minTime) * ui.value / 100;
    now.textContent = new Date(timestamp);
    window.timeAnimation(false, true);
  }
});

function updateTimeLine() {
  var t = window.timestamp || maxTime;
  now.textContent = new Date(t);
  timeLineSlide.slider("value", 100 * (t - minTime) / (maxTime - minTime));
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
function stopTimeAnimation() {
  $("#timeLapseButton")
    .html('<i class="icon-play"></i>')
    .removeClass("icon-pause");
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

var timeRange = $("#timerange").slider({
  range: "max",
  min: -16,
  max: 16,
  value: Math.sign(timeStep) * Math.log(Math.abs(timeStep) + 1),
  slide: function(event, ui) {
    var value = ui.value;
    timeStep = Math.sign(value) * (Math.exp(Math.abs(value)) - 1);
  }
});

function startTimeAnimation() {
  $("#timeLapseButton")
    .html('<i class="icon-pause"></i>')
    .removeClass("icon-play");
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

$("#timeLapseButton").mousedown(function() {
  if (timeCallerTimeout) {
    stopTimeAnimation();
  } else {
    startTimeAnimation();
  }
});

$("#firstPathButton").mousedown(function() {
  window.timestamp = minTime;
  window.timeAnimation();
});

$("#nowButton").mousedown(function() {
  window.timestamp = +new Date();
  window.timeAnimation();
});
