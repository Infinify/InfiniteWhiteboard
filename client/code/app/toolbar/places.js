i18n.init({ resStore: require("./translations/places_i18n") });

var t = i18n.t;

$("#toolContainer").append(
  ss.tmpl["toolbar-tool"].render({
    toolId: "places",
    toolIconClasses: "icon-location toolIcon placesIcon",
    toolHeaderText: t("Locations")
  })
);

$(".toolContent", document.getElementById("places")).append(
  ss.tmpl["toolbar-places"].render({
    OriginText: t("Origin"),
    RandomText: t("Random Location")
  })
);

function rand(max, min) {
  var diff = max - min;
  return min + Math.random() * diff;
}

$("#randomLocationButton").mousedown(function randomLocation() {
  var a = rand(0, -1000),
    e = Math.pow(2, -a),
    b = rand(100, -100) * e,
    c = rand(100, -100) * e,
    newLoc = "#" + a + "/" + b + "/" + c;

  window.stopFlying();
  window.location.href = newLoc;
});

$("#originButton").mousedown(function origin() {
  window.stopFlying();
  window.location.href = "#0/0/0";
});
