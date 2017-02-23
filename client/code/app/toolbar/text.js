var textToolParams = window.textToolParams = {
  fillColor: "",
  bold: false,
  italic: false,
  emphasis: "",
  fontFamily: "Courier New",
  fontSize: 30
};

i18n.init({ resStore: require("./translations/places_i18n") });

var t = i18n.t;

$("#toolContainer").append(
  ss.tmpl["toolbar-tool"].render({
    toolId: "textTool",
    toolIconClasses: "icon-text toolIcon textIcon",
    toolHeaderText: t("Text")
  })
);

$("#toolbarWrapper").append(ss.tmpl["toolbar-textPreview"].render({}));

var textTool = $("#textTool");

$(".toolContent", textTool).append(ss.tmpl["toolbar-text"].render({}));

textTool.on("click", function() {
  if (textTool.hasClass("open")) {
    window.textTool.activate();
    delete window.timestamp;
    window.timeAnimation();
    if (window.newTextItem) {
      window.newTextItem.visible = true;
      $("#textPreviewWrapper").show();
    }
  } else {
    nopTool.activate();
    if (window.newTextItem) {
      window.newTextItem.visible = false;
    }
    $("#textPreviewWrapper").hide();
  }
});

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

$("#textSizeSlider").slider({
  range: "max",
  min: 10,
  max: 250,
  value: 40,
  step: 1,
  slide: function(event, ui) {
    textToolParams.textSize = ui.value;
    $("#currentFontSizeDisplay").html(ui.value + "px");

    if (window.newTextItem) {
      window.newTextItem.fontSize = ui.value;
      window.newTextItem.leading = ui.value * 1.3;
    }
  }
});

$("#textFontSelection").on("change", function(event) {
  textToolParams.fontFamily = event.target.value;
  window.newTextItem
    ? window.newTextItem.fontFamily = event.target.value
    : null;
});

var $emphasisButtons = $("#emphasisButtons");
$emphasisButtons.buttonset();
$emphasisButtons.find("label").unbind("mouseup");
// small hack for making buttonset react on click events while simultaneously moving the mouse
$emphasisButtons.on("change", function() {
  var bold = $("#emphasisBold").prop("checked"),
    italic = $("#emphasisItalic").prop("checked");

  textToolParams.emphasis = "";
  window.newTextItem ? window.newTextItem.fontWeight = "" : null;

  if (bold && italic) {
    textToolParams.emphasis = "bold italic";
    window.newTextItem ? window.newTextItem.fontWeight = "bold italic" : null;
  } else {
    if (bold) {
      textToolParams.emphasis = "bold";
      window.newTextItem ? window.newTextItem.fontWeight = "bold" : null;
    }

    if (italic) {
      textToolParams.emphasis = "italic";
      window.newTextItem ? window.newTextItem.fontWeight = "italic" : null;
    }
  }
});

var textPreviewWrapper = $("#textPreviewWrapper");
var textPreview = $("#textPreview");
textPreview.elastic();
textPreview.on("keyup", function() {
  var error = textPreviewWrapper.find("p.error");
  var newVal = textPreview.val();
  if (newVal.length > 512) {
    error.css("display", "block");
    textPreview.val(window.newTextItem.content);
    return;
  } else if (newVal.length === 512) {
    error.css("display", "block");
  } else {
    error.css("display", "none");
  }
  window.newTextItem.content = newVal;
});

$("#newTextOKButton").click(function() {
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
  textPreview.val("");
  textPreviewWrapper.hide();
  $("body").css("cursor", "default");
});

$("#newTextCancelButton").click(function() {
  window.newTextItem.content = "";
  window.newTextItem.selected = false;
  window.newTextItem.remove();
  delete window.newTextItem;
  textPreview.val("");
  textPreviewWrapper.hide();
  $("body").css("cursor", "default");
});
