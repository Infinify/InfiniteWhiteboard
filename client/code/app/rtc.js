var streamChannels = [];
document.addEventListener("finishedRender", function() {
  var host = location.hostname === "localhost"
    ? location.hostname + ":" + (+location.port + 100)
    : location.host;
  var quickConnectObj = quickconnect("//" + host + "/_rtc", {
    room: window.whiteboard,
    iceServers: [
      { url: 'stun:stun.l.google.com:19302' },
      { url: 'stun:stun1.l.google.com:19302' },
      { url: 'stun:stun2.l.google.com:19302' },
      { url: 'stun:stun3.l.google.com:19302' },
      { url: 'stun:stun4.l.google.com:19302' }
    ]
  });

  quickConnectObj.createDataChannel("shared-drawing");
  quickConnectObj.on("channel:opened:shared-drawing", function(id, channel) {
    channel.onmessage = renderRealTimeObject;
    streamChannels.push(channel);
  });

  var realTimeObjects = {};
  document.addEventListener("clearCanvas", function() {
    streamChannels = [];
    realTimeObjects = {};
    quickConnectObj.endCalls();
    quickConnectObj.profile({ room: window.whiteboard });
  });

  var tileSize = 256;
  function renderRealTimeObject(evt) {
    var data = JSON.parse(evt.data);
    if (data.map) {
      var view = data.map;
      var zoom = view.mapZoom;
      var eventData = data.data;
      var currentZoom = map.zoom();
      var zoomDiff = currentZoom - zoom;
      var scale = Math.pow(2, zoomDiff);

      if (Math.abs(zoomDiff) > 7) {
        return;
      }

      var id = eventData.id;
      var eventName = data.event;
      var realTimeObject = realTimeObjects[id];
      if (eventName !== "down" && !realTimeObject) {
        return;
      }

      var style = eventData.style;
      if (style) {
        style.strokeColor = new paper.Color().importJSON(style.strokeColor);
        style.strokeWidth *= scale;
      }

      // Move to origin of drawing canvas
      var origin = view.c0;
      var point = eventData.point;
      var zoomFactor = Math.pow(2, zoom - Math.round(zoom));
      point.x += origin.column * tileSize * zoomFactor;
      point.y += origin.row * tileSize * zoomFactor;

      // Scale to current zoom level
      point.x *= scale;
      point.y *= scale;

      // Move to current location
      var mc = map.center();
      var center = map.locationPoint(mc);
      var tileCenter = map.locationCoordinate(mc);
      var currZoomFactor = Math.pow(2, currentZoom - Math.round(currentZoom));
      point.x += center.x - tileCenter.column * tileSize * currZoomFactor;
      point.y += center.y - tileCenter.row * tileSize * currZoomFactor;

      switch (eventName) {
        case "down":
          var path = window.onMouseDowns(eventData, true);
          realTimeObjects[id] = path;
          break;

        case "drag":
          window.onMouseDrags(eventData, true, realTimeObject);
          break;

        case "up":
          window.onMouseUps(eventData, true, realTimeObject);
          delete realTimeObjects[id];
          break;
      }
    }
  }
});

window.stream = function(event, data) {
  streamChannels.forEach(function(channel) {
    if (channel.readyState === "open") {
      channel.send(
        JSON.stringify({ map: window.mapData(), event: event, data: data })
      );
    }
  });
};
