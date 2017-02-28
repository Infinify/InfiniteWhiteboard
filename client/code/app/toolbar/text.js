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

var textFillColorDiv = document.getElementById("textFillColor");
var textFillColor = tinycolorpicker(textFillColorDiv);
textFillColorDiv.onchange = function colorPickedHandlerFill() {
  var color = textFillColor.colorHex;
  textToolParams.fillColor = new paper.Color(color);

  if (window.newTextItem) {
    window.newTextItem.fillColor = new paper.Color(color);
  }
};

var currentFontSizeDisplay = document.getElementById("currentFontSizeDisplay");
var textSizeSlider = document.getElementById("textSizeSlider");
textSizeSlider.onchange = textSizeSlider.oninput = function() {
  var value = textSizeSlider.value;
  textToolParams.textSize = value;
  currentFontSizeDisplay.textContent = value + "px";

  if (window.newTextItem) {
    window.newTextItem.fontSize = value;
    window.newTextItem.leading = value * 1.3;
  }
};

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
    boldButton.add("ui-state-active");
  } else {
    boldButton.remove("ui-state-active");
  }

  if (italic) {
    props.push("italic");
    italicButton.add("ui-state-active");
  } else {
    italicButton.remove("ui-state-active");
  }

  var emphasis = props.join(" ");
  textToolParams.emphasis = emphasis;
  if (window.newTextItem) {
    window.newTextItem.fontWeight = emphasis;
  }
}

[].slice
  .call(document.querySelectorAll("#emphasisButtons input"))
  .forEach(function(emphasisButton) {
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
