var textToolParams = window.textToolParams = {
  fillColor: "",
  bold: false,
  italic: false,
  emphasis: "",
  fontFamily: "Courier New",
  fontSize: 30
};

var textTool = document.getElementById("textTool");

var textPreviewWrapper = document.getElementById("textPreviewWrapper");

textTool.querySelector(".toolHeader").onclick = function() {
  if (!textTool.classList.contains("open")) {
    window.textTool.activate();
    delete window.timestamp;
    window.timeAnimation();
    if (window.newTextItem) {
      window.newTextItem.visible = true;
      textPreviewWrapper.style.display = "block";
    }
  } else {
    nopTool.activate();
    if (window.newTextItem) {
      window.newTextItem.visible = false;
    }
    textPreviewWrapper.style.display = "none";
  }
};

function colorPickedHandlerFill() {
  var color = $("#textFillColor").spectrum("get").toRgb();
  textToolParams.fillColor = new paper.Color(
    color.r / 256,
    color.g / 256,
    color.b / 256
  );

  if (window.newTextItem) {
    window.newTextItem.fillColor = new paper.Color(
      color.r / 256,
      color.g / 256,
      color.b / 256
    );
  }
}

$("#textFillColor").spectrum({
  color: "#000000",
  showInitial: true,
  showInput: true,
  clickoutFiresChange: true,
  change: colorPickedHandlerFill,
  move: colorPickedHandlerFill,
  allowEmpty: true
});

var currentFontSizeDisplay = document.getElementById("currentFontSizeDisplay");
$("#textSizeSlider").slider({
  range: "max",
  min: 10,
  max: 250,
  value: 40,
  step: 1,
  slide: function(event, ui) {
    textToolParams.textSize = ui.value;
    currentFontSizeDisplay.textContent = ui.value + "px";

    if (window.newTextItem) {
      window.newTextItem.fontSize = ui.value;
      window.newTextItem.leading = ui.value * 1.3;
    }
  }
});

document.getElementById("textFontSelection").onchange = function(event) {
  textToolParams.fontFamily = event.target.value;
  window.newTextItem
    ? window.newTextItem.fontFamily = event.target.value
    : null;
};

var emphasisBold = document.getElementById("emphasisBold");
var emphasisItalic = document.getElementById("emphasisItalic");
var boldButton = emphasisBold.nextElementSibling.classList;
var italicButton = emphasisItalic.nextElementSibling.classList;
function onEmphasisButtonChange() {
  var bold = emphasisBold.checked;
  var italic = emphasisItalic.checked;
  var props = [];

  if (bold) {
    props.push("bold");
    boldButton.add("ui-state-active")
  } else {
    boldButton.remove("ui-state-active");
  }

  if (italic) {
    props.push("italic");
    italicButton.add("ui-state-active")
  } else {
    italicButton.remove("ui-state-active");
  }
  
  var emphasis = props.join(" ");
  textToolParams.emphasis = emphasis;
  if (window.newTextItem) {
    window.newTextItem.fontWeight = emphasis
  }
}

[].slice.call(document.querySelectorAll("#emphasisButtons input")).forEach(function (emphasisButton) {
  emphasisButton.oninput = emphasisButton.onclick = onEmphasisButtonChange;
});

var textPreview = document.getElementById("textPreview");
textPreview.onkeyup = function() {
  var error = textPreviewWrapper.querySelector("p.error");
  var newVal = textPreview.value;
  if (newVal.length > 512) {
    error.style.display = "block";
    textPreview.value = window.newTextItem.content;
    return;
  } else if (newVal.length === 512) {
    error.style.display = "block";
  } else {
    error.style.display = "none";
  }
  window.newTextItem.content = newVal;
};

document.getElementById("newTextOKButton").onclick = function() {
  if (window.newTextItem.content.length > 512) {
    return;
  }
  if (!window.newTextItem.iwb && window.send) {
    window.send(window.newTextItem);
  } else if (window.updateObject) {
    window.updateObject(window.newTextItem);
  }
  window.newTextItem.content = "";
  window.newTextItem.selected = false;
  window.newTextItem.remove();
  delete window.newTextItem;
  textPreview.value = "";
  textPreviewWrapper.style.display = "none";
  document.body.style.cursor = "default";
};

document.getElementById("newTextCancelButton").onclick = function() {
  window.newTextItem.content = "";
  window.newTextItem.selected = false;
  window.newTextItem.remove();
  delete window.newTextItem;
  textPreview.value = "";
  textPreviewWrapper.style.display = "none";
  document.body.style.cursor = "default";
};
