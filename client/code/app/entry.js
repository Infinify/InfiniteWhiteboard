// This file automatically gets called first by SocketStream and must always exist

// Make 'ss' available to all modules and the browser console
window.ss = require("socketstream");

new Spinner({
  color: "#CFCFCF",
  radius: 30,
  speed: 0.8,
  lines: 30,
  top: "0px",
  left: "100px"
}).spin(document.getElementById("connectionDialogSpinner"));

var overlay = document.querySelector(".ui-widget-overlay").style;
var connectionDialog = document.getElementById("connectionDialog").style;

var timeoutHandle;
var reconnectAttempts = 0;
var reconnectionTimeout = 1;

ss.server.on("disconnect", function onDisconnect() {
  var timeLeft = reconnectionTimeout * Math.pow(1.5, reconnectAttempts);

  connectionDialog.display = "block";
  overlay.display = "block";

  reconnectAttempts++;
  document.getElementById(
    "reconnectAttemptsDisplay"
  ).textContent = reconnectAttempts + " attempts";

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  var timeoutDisplay = document.getElementById("reconnectTimeoutDisplay");
  timeoutHandle = setInterval(
    function() {
      timeLeft -= 1;
      timeoutDisplay.textContent = timeLeft < 0
        ? "Reconnecting..."
        : "Reconnecting in " + Math.round(timeLeft) + " seconds.";
    },
    1000
  );
});

ss.server.on("reconnect", function onReconnect() {
  connectionDialog.display = "none";
  overlay.display = "none";

  clearTimeout(timeoutHandle);
  reconnectAttempts = 0;
});

ss.server.on("ready", function onReady() {
  connectionDialog.display = "none";
  overlay.display = "none";
});

require("/polymaps");
require("/contentEditable");
require("/timeMachine");
require("/paperTools");
require("/mfs");
require("/loadWhiteboard");
require("/toolBar");
