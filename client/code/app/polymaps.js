var po = org.polymaps;
var mapDiv = document.getElementById("map");
mapDiv.tabIndex = 1;
var svg = po.svg("svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
var map = window.map = po
  .map()
  .container(mapDiv.appendChild(svg))
  .add(po.interact())
  .add(po.hash())
  .add(po.compass().position("bottom-left"));

var compassStyle = document.querySelector(".compass").style;
document.getElementById("compassToggle").onclick = function() {
  compassStyle.display = compassStyle.display === "" ? "none" : "";
};

window.mapData = function mapData() {
  return {
    mapZoom: map.zoom(),
    c0: map.pointCoordinate(map.locationCoordinate(map.center()), {
      x: 0,
      y: 0
    })
  };
};

function iwbData() {
  return { whiteboard: window.whiteboard, data: mapData(), sid: getId() };
}

window.send = function(paperItem) {
  var iwb = iwbData(), tmpSelected = paperItem.selected, r = Math.random();

  paperItem.selected = false;
  iwb.r = paperItem.r = r;

  iwb.paper = paperItem.toJSON();

  paperItem.selected = tmpSelected;
  paperItem.removeOnNewObject = true;

  ss.rpc("iwb.send", iwb, function(err) {
    if (err) {
      console.log(err);
      // TODO add notification
      // gray/shade out objects and show retry
    }
  });
};

window.updateObject = function(paperItem) {
  var tmp = iwbData(), tmpSelected = paperItem.selected, r = Math.random();

  paperItem.selected = false;

  tmp.r = paperItem.r = r;
  tmp.paper = paperItem.toJSON();
  tmp._id = paperItem.iwb._id;
  tmp.deleted = paperItem.deleted;

  paperItem.selected = tmpSelected;
  paperItem.removeOnNewObject = true;

  ss.rpc("iwb.update", tmp, function(err) {
    if (err) {
      console.log(err);
      // TODO add notification
    }
  });
};
