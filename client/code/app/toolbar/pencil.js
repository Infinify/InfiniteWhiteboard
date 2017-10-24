var hexToRgbA = require('./hexToRgbA.js');

var pencilStrokeWidth = document.getElementById("pencilStrokeWidth");
var pencilStrokeWidthValue = document.getElementById("pencilStrokeWidthValue");
pencilStrokeWidth.oninput = function() {
  var value = pencilStrokeWidth.value;
  window.currentStrokeStyle.strokeWidth = value;
  pencilStrokeWidthValue.textContent = value;
};

document.getElementById("miterSelector").onchange = function(event) {
  window.pencilCap = event.currentTarget.value.toLowerCase();
};

function colorPickedHandler(color, which) {
  if (color) {
    window.currentStrokeStyle[which + "Color"] = new paper.Color(color);
  } else {
    delete window.currentStrokeStyle[which + "Color"];
  }
  document.dispatchEvent(new CustomEvent("setColor"));
}

var fillColor = document.getElementById("currentFillColor");
var fillAlpha = document.getElementById("pencilFillAlpha");
fillAlpha.onchange = fillColor.onchange = function colorPickedHandlerFill() {
  colorPickedHandler(hexToRgbA(fillColor.value, fillAlpha.value), "fill");
};
fillAlpha.oninput = function updateOpacity() {
  fillColor.style.opacity = fillAlpha.value;
};

var strokeColor = document.getElementById("currentStrokeColor");
var strokeAlpha = document.getElementById("pencilStrokeAlpha");
strokeAlpha.onchange = strokeColor.onchange = function colorPickedHandlerStroke() {
  colorPickedHandler(hexToRgbA(strokeColor.value, strokeAlpha.value), "stroke");
};
strokeAlpha.oninput = function updateOpacity() {
  strokeColor.style.opacity = strokeAlpha.value;
};

var palette = document.querySelector(".palette");
palette.onclick = function(event) {
  var parent = event.target.parentElement;
  var li = parent === palette ? event.target : parent;
  var fill = new paper.Color(li.querySelector(".fill").style.backgroundColor);
  var stroke = new paper.Color(li.querySelector(".stroke").style.backgroundColor);
  currentStrokeStyle.fillColor = fill;
  currentStrokeStyle.strokeColor = stroke;
  fillAlpha.value = fill && fill._alpha ? fill._alpha : 1;
  strokeAlpha.value = stroke && stroke._alpha ? stroke._alpha : 1;
  fillColor.value = fill.toCSS(true);
  strokeColor.value = stroke.toCSS(true);
};

document.addEventListener("setColor", function() {
  var fill = currentStrokeStyle.fillColor;
  fillAlpha.value = fill ? fill._alpha : 0;
  fill = fill && fill.toCSS ? fill.toCSS(true) : "";
  var stroke = currentStrokeStyle.strokeColor;
  strokeAlpha.value = stroke && stroke._alpha ? stroke._alpha : 1;
  stroke = stroke && stroke.toCSS
    ? stroke.toCSS(true)
    : stroke;
  fillColor.value = fill;
  strokeColor.value = stroke;
  palette.insertBefore(
    htmlToElement(
      "<li>" +
        '<div class="stroke" style="background-color: ' +
        hexToRgbA(strokeColor.value, strokeAlpha.value) +
        '"></div>' +
        '<div class="fill" style="background-color: ' +
        hexToRgbA(fillColor.value, fillAlpha.value) +
        '"></div>' +
        "</li>"
    ),
    palette.firstChild
  );
});

colorPickedHandler(window.initColor, "stroke");

var colorPickerClasses = document.getElementById("colorPickerTool").classList;
var drawToolClasses = document.getElementById("drawTool").classList;
var pencil = document.getElementById("pencil");
var pencilClasses = pencil.classList;
pencil.querySelector(".toolHeader").onclick = function() {
  if (pencilClasses.contains("open")) {
    nopTool.activate();
    return;
  }

  var currentStrokeStyle = window.currentStrokeStyle;
  currentStrokeStyle.strokeWidth = pencilStrokeWidth.value;

  currentStrokeStyle.fillColor = new paper.Color(hexToRgbA(fillColor.value, fillAlpha.value));

  currentStrokeStyle.strokeColor = new paper.Color(hexToRgbA(strokeColor.value, strokeAlpha.value));

  if (
    !colorPickerClasses.contains("active") &&
      !drawToolClasses.contains("active")
  ) {
    window.drawTool.activate();
  }
  delete window.timestamp;
  window.timeAnimation();
};
