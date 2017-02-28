var colorPickerToolButton = document.getElementById("colorPickerTool");
var pencilStrokeWidth = document.getElementById("pencilStrokeWidth");
var drawToolButton = document.getElementById("drawTool");
var pencil = document.getElementById("pencil");
pencil.querySelector(".toolHeader").onclick = function() {
  if (pencil.classList.contains("open")) {
    nopTool.activate();
    return;
  }

  window.currentStrokeStyle.strokeWidth = pencilStrokeWidth.value;

  var color = $("#currentFillColor").spectrum("get");
  color = color && color.toHexString();
  window.currentStrokeStyle.fillColor = color &&
    new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );

  color = $("#currentStrokeColor").spectrum("get");
  color = color && color.toHexString();
  window.currentStrokeStyle.strokeColor = color &&
    new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );

  if (
    !colorPickerToolButton.classList.contains("active") &&
      !drawToolButton.classList.contains("active")
  ) {
    window.drawTool.activate();
  }
  delete window.timestamp;
  window.timeAnimation();
};

function colorPickedHandler(color, which) {
  which = which || "stroke";
  if (color) {
    document.getElementById("currentStrokeColor").style.backgroundColor = color;
    window.currentStrokeStyle[which + "Color"] = new paper.Color(
      hexToR(color) / 256,
      hexToG(color) / 256,
      hexToB(color) / 256
    );
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
  document.dispatchEvent(new CustomEvent("setColor"));
}

colorPickedHandler(window.initColor);

pencilStrokeWidth.onchange = function() {
  window.currentStrokeStyle.strokeWidth = pencilStrokeWidth.value;
};

document.getElementById("miterSelector").onchange = function(event) {
  window.pencilCap = event.currentTarget.value.toLowerCase();
};

function colorPickedHandlerFill(color) {
  colorPickedHandler(color && color.toHexString(), "fill");
}
var fill = $("#currentFillColor").spectrum({
  color: "",
  showInitial: true,
  showInput: true,
  clickoutFiresChange: true,
  change: colorPickedHandlerFill,
  allowEmpty: true
});

function colorPickedHandlerStroke(color) {
  colorPickedHandler(color && color.toHexString());
}
var stroke = $("#currentStrokeColor").spectrum({
  color: window.initColor,
  showInitial: true,
  showInput: true,
  clickoutFiresChange: true,
  change: colorPickedHandlerStroke,
  allowEmpty: true
});

var palette = document.querySelector(".palette");
palette.onclick = function(event) {
  var parent = event.target.parentElement;
  var fillColor = parent.querySelector(".fill").style.backgroundColor;
  var strokeColor = parent.querySelector(".stroke").style.backgroundColor;
  currentStrokeStyle.fillColor = fillColor;
  currentStrokeStyle.strokeColor = strokeColor;
  fillColor = currentStrokeStyle.fillColor;
  fillColor = fillColor && fillColor.toCSS ? fillColor.toCSS() : fillColor;
  strokeColor = currentStrokeStyle.strokeColor;
  strokeColor = strokeColor && strokeColor.toCSS
    ? strokeColor.toCSS()
    : strokeColor;
  fill.spectrum("set", fillColor);
  stroke.spectrum("set", strokeColor);
};

document.addEventListener("setColor", function() {
  var fillColor = currentStrokeStyle.fillColor;
  fillColor = fillColor && fillColor.toCSS ? fillColor.toCSS() : fillColor;
  var strokeColor = currentStrokeStyle.strokeColor;
  strokeColor = strokeColor && strokeColor.toCSS
    ? strokeColor.toCSS()
    : strokeColor;
  fill.spectrum("set", fillColor);
  stroke.spectrum("set", strokeColor);
  palette.insertBefore(
    htmlToElement(
      "<li>" +
        '<div class="stroke" style="background-color: ' +
        strokeColor +
        '"></div>' +
        '<div class="fill" style="background-color: ' +
        fillColor +
        '"></div>' +
        "</li>"
    ),
    palette.firstChild
  );
});
