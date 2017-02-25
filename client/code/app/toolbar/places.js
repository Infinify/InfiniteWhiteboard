function rand(max, min) {
  var diff = max - min;
  return min + Math.random() * diff;
}

document.getElementById(
  "randomLocationButton"
).onclick = function randomLocation() {
  var a = rand(0, -1000),
    e = Math.pow(2, -a),
    b = rand(100, -100) * e,
    c = rand(100, -100) * e,
    newLoc = "#" + a + "/" + b + "/" + c;

  window.stopFlying();
  window.location.href = newLoc;
};

document.getElementById("originButton").onclick = function origin() {
  window.stopFlying();
  window.location.href = "#0/0/0";
};
