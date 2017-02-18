// This file automatically gets called first by SocketStream and must always exist

// Make 'ss' available to all modules and the browser console
window.ss = require("socketstream");

var connectionDialog = $("#connectionDialog");
connectionDialog.dialog({
  autoOpen: true,
  modal: true,
  closeOnEscape: false,
  dialogClass: "connectionDialog",
  maxWidth: 300,
  minWidth: 300,
  draggable: false,
  create: function() {
    var connectionDialogSpinner = $("#connectionDialogSpinner").spin({
      color: "#CFCFCF",
      radius: 30,
      speed: 0.8,
      lines: 30,
      top: "0px",
      left: "100px"
    });
  }
}).css("visibility", "visible");

var reconnectAttempts = 0, timeoutHandle, timeLeft;
var reconnectionTimeout = 1;
ss.server.on("disconnect", function onDisconnect() {
  timeLeft = reconnectionTimeout * Math.pow(1.5, reconnectAttempts);
  reconnectAttempts++;
  console.log("Connection down :-(");
  connectionDialog.dialog("open");
  connectionDialog.show();
  $("#reconnectAttemptsDisplay").html(reconnectAttempts + " attempts");

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  var timeoutDisplay = $("#reconnectTimeoutDisplay");
  timeoutHandle = setInterval(
    function() {
      timeLeft -= 1;
      timeoutDisplay.html(
        timeLeft < 0
          ? "Reconnecting..."
          : "Reconnecting in " + Math.round(timeLeft) + " seconds."
      );
    },
    1000
  );
});

ss.server.on("reconnect", function onReconnect() {
  reconnectAttempts = 0;
  connectionDialog.dialog("close");
  console.log("Connection back up :-)");
  clearTimeout(timeoutHandle);
});

ss.server.on("ready", function onReady() {
  connectionDialog.dialog("close");
});

require("/polymaps");
require("/contentEditable");
require("/timeMachine");
require("/thinPaper");
require("/mfs");
require("/toolBar");
