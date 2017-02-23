window.cutHex = function cutHex(h) {
  return h.charAt(0) === "#" ? h.substring(1, 7) : h;
};

window.hexToR = function hexToR(h) {
  return parseInt(cutHex(h).substring(0, 2), 16);
};

window.hexToG = function hexToG(h) {
  return parseInt(cutHex(h).substring(2, 4), 16);
};

window.hexToB = function hexToB(h) {
  return parseInt(cutHex(h).substring(4, 6), 16);
};

require("/toolbar/login");
require("/toolbar/pencil");
require("/toolbar/shapes");
require("/toolbar/text");
require("/toolbar/whiteboards");
require("/toolbar/timeline");
require("/toolbar/places");
var drawToolHandler = require("/drawToolHandler");
var tools = [
  "login",
  "pencil",
  "shapes",
  "textTool",
  "whiteboards",
  "timeMachine",
  "places",
  "interact"
];
var toolClasses = tools.reduce(
  function(map, tool) {
    map[tool] = document.getElementById(tool).classList;
    return map;
  },
  {}
);

$(".toolHeader").on("click", function(event) {
  var target = this.parentNode;
  target.classList.toggle("open");
  var id = target.id;

  tools.forEach(function(tool) {
    if (id !== tool) {
      var classes = toolClasses[tool];
      if (classes.contains("open")) {
        classes.remove("open");
      }
    }
  });

  drawToolHandler();
}).hover(function() {
  $(this).find("i").toggleClass("iconHover");
});

var toolbarWrapperDOM = $(document.getElementById("toolbarWrapper"));
$("#hideToolbarButton").on("click", function() {
  toolbarWrapperDOM.hide("slide", { direction: "left" }, 300);
});

$("#showToolbarButton").on("click", function() {
  toolbarWrapperDOM.show("drop", { direction: "left" }, 300, function() {});
});
