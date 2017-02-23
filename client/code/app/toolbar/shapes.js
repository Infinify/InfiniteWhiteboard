i18n.init({ resStore: require("./translations/shapes_i18n") });

var t = i18n.t;

$("#toolContainer").append(
  ss.tmpl["toolbar-tool"].render({
    toolId: "shapes",
    toolIconClasses: "icon-whiteboard1 toolIcon shapesIcon",
    toolHeaderText: t("Shapes")
  })
);

$(".toolContent", document.getElementById("shapes")).append(
  ss.tmpl["toolbar-shapes"].render({})
);

var shapes = $("#shapes").on("click", function() {
  if (!shapes.hasClass("open")) {
    nopTool.activate();
    return;
  }
  window.currentStrokeStyle.strokeWidth = $("#shapeStrokeWidth").slider(
    "value"
  );

  var color = $("#currentShapeFillColor").spectrum("get");
  color = color && color.toHexString();
  window.currentStrokeStyle.fillColor = color &&
    new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );

  color = $("#currentShapeStrokeColor").spectrum("get");
  color = color && color.toHexString();
  window.currentStrokeStyle.strokeColor = color &&
    new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );

  delete window.timestamp;
  window.timeAnimation();
});

function colorPickedHandler(color, which) {
  which = which || "stroke";
  if (color) {
    var $currentColorDOM = $("#currentStrokeColor");
    $currentColorDOM.css("background-color", color);
    window.currentStrokeStyle[which + "Color"] = new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
}

colorPickedHandler(window.initColor);

$("#shapeStrokeWidth").slider({
  range: "max",
  min: 1,
  max: 50,
  value: window.currentStrokeStyle.strokeWidth || 10,
  slide: function(event, ui) {
    var currentWidth = ui.value;
    window.currentStrokeStyle.strokeWidth = currentWidth;
    $("#currentStrokeColor")
      .css("height", currentWidth)
      .css("width", currentWidth);
  }
});

function colorPickedHandlerFill(color) {
  colorPickedHandler(color && color.toHexString(), "fill");
}
$("#currentShapeFillColor").spectrum({
  color: "",
  showInitial: true,
  showInput: true,
  clickoutFiresChange: true,
  change: colorPickedHandlerFill,
  move: colorPickedHandlerFill,
  allowEmpty: true
});

function colorPickedHandlerStroke(color) {
  colorPickedHandler(color && color.toHexString());
}
$("#currentShapeStrokeColor").spectrum({
  color: window.initColor,
  showInitial: true,
  showInput: true,
  clickoutFiresChange: true,
  change: colorPickedHandlerStroke,
  move: colorPickedHandlerStroke,
  allowEmpty: true
});
