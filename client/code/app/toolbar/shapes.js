var shapes = document.getElementById("shapes");
var shapeStrokeWidth = document.getElementById("shapeStrokeWidth");
shapes.querySelector(".toolHeader").onclick = function() {
  if (shapes.classList.contains("open")) {
    nopTool.activate();
    return;
  }
  window.currentStrokeStyle.strokeWidth = shapeStrokeWidth.value;

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
};

function colorPickedHandler(color, which) {
  which = which || "stroke";
  if (color) {
    window.currentStrokeStyle[which + "Color"] = new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );
    which = which[0].toUpperCase() + which.slice(1);
    document.getElementById(
      "current" + which + "Color"
    ).style.backgroundColor = color;
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
}

colorPickedHandler(window.initColor);

shapeStrokeWidth.onchange = function() {
  window.currentStrokeStyle.strokeWidth = shapeStrokeWidth.value;
};

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
