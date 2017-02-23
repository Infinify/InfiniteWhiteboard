i18n.init({ resStore: require("./translations/pencil_i18n") });

var t = i18n.t;

$("#toolContainer").append(
  ss.tmpl["toolbar-tool"].render({
    toolId: "pencil",
    toolIconClasses: "icon-brush1 toolIcon drawIcon",
    toolHeaderText: t("Pencil")
  })
);

$(".toolContent", document.getElementById("pencil")).append(
  ss.tmpl["toolbar-pencil"].render({})
);

var colorPickerToolButton = document.getElementById("colorPickerTool");
var drawToolButton = document.getElementById("drawTool");
var pencil = $("#pencil").on("click", function() {
  if (!pencil.hasClass("open")) {
    nopTool.activate();
    return;
  }

  window.currentStrokeStyle.strokeWidth = $("#pencilStrokeWidth").slider(
    "value"
  );

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

  if (!colorPickerToolButton.classList.contains("active") && !drawToolButton.classList.contains("active")) {
    window.drawTool.activate();
  }
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
  $(window).trigger("setColor");
}

colorPickedHandler(window.initColor);

$("#pencilStrokeWidth").slider({
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
    event.stopPropagation();
  }
});

$("#pencilSimplify").slider({
  range: "max",
  min: 0,
  max: 20,
  value: 1,
  slide: function(event, ui) {
    window.simplification = ui.value;
  }
});

$("#miterSelector").change(function(event) {
  window.pencilCap = event.currentTarget.value.toLowerCase();
});

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

var palette = $(".palette");
palette.on("click", function(event) {
  var jq = $(event.target.parentElement);
  var fillColor = jq.find(".fill").css("background-color");
  var strokeColor = jq.find(".stroke").css("background-color");
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
});

$(window).on("setColor", function() {
  var fillColor = currentStrokeStyle.fillColor;
  fillColor = fillColor && fillColor.toCSS ? fillColor.toCSS() : fillColor;
  var strokeColor = currentStrokeStyle.strokeColor;
  strokeColor = strokeColor && strokeColor.toCSS
    ? strokeColor.toCSS()
    : strokeColor;
  fill.spectrum("set", fillColor);
  stroke.spectrum("set", strokeColor);
  palette.prepend(
    "<li>" +
      '<div class="stroke" style="background-color: ' +
      strokeColor +
      '"/>' +
      '<div class="fill" style="background-color: ' +
      fillColor +
      '"/>' +
      "</li>"
  );
});
