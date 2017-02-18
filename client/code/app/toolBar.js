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
var drawToolHandler = require("/toolbar/drawToolHandler");
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
var toolDivs = tools.reduce(
  function(map, tool) {
    map[tool] = document.getElementById(tool);
    return map;
  },
  {}
);
$("#toolContainer")
  .accordion({
    header: "div > h3",
    collapsible: true,
    active: false,
    heightStyle: "content"
  })
  .on("click", function(event) {
    var target = event.target;
    while (!target.classList.contains("tool") && target !== this) {
      target = target.parentNode;
    }
    if (!target.classList.contains("tool") || !target.id) {
      return;
    }

    var id = target.id;

    tools.forEach(function(tool) {
      if (id !== tool) {
        var classes = toolDivs[tool].classList;
        if (classes.contains("open")) {
          classes.remove("open");
        }
      }
    });

    drawToolHandler();
  });

$(".toolContainer .ui-accordion-header, .ui-accordion-header > *").attr(
  "tabindex",
  "-1"
);

var $toolHeader = $(".toolHeader");
$toolHeader.on("click", function() {
  $(this).parent().toggleClass("open");
});
$toolHeader.hover(function() {
  $(this).find("i").toggleClass("iconHover");
});

var toolbarWrapperDOM = $(document.getElementById("toolbarWrapper"));
$("#hideToolbarButton").on("click", function() {
  toolbarWrapperDOM.hide("slide", { direction: "left" }, 300);
});

$("#showToolbarButton").on("click", function() {
  toolbarWrapperDOM.show("drop", { direction: "left" }, 300, function() {});
});
