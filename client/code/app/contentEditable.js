var htmlR = document.getElementById("html");
var htmlE = document.getElementById("htmlContainer");
var htmlr = $(htmlR);
var html = $(htmlE);

function initCE(htmlElem, edit) {
  var domElem = document.getElementById(htmlElem.elemId);
  htmlr.css("pointer-events", "all");
  html.css("z-index", "1");
  var save = $("<button>Save</button>");
  var cancelButton = $("<button>Cancel</button>");
  var wrap = $('<div class="htmlTool"></div>');
  var controls = $("<div></div>");
  var body = $("body");
  wrap.append(controls);
  body.append(wrap);
  controls.append(cancelButton);
  controls.append(save);
  function cancel() {
    wrap.remove();
    htmlElem.visible = false;
    htmlElem.remove();
    htmlr.css("pointer-events", "none");
    html.css("z-index", "");
  }
  var onSave = function onSave() {
    htmlElem.content = domElem.innerHTML;
    htmlr.css("pointer-events", "none");
    html.css("z-index", "");
    if (edit) {
      updateObject(htmlElem);
    } else {
      send(htmlElem);
    }
    save.off("click", onSave);
    cancelButton.off("click", cancel);
    controls.remove();
  };
  save.on("click", onSave);
  cancelButton.on("click", cancel);
}

$(window).on("htmlEditor", function(event, data) {
  var html = data.html;
  var edit = data.edit;
  initCE(html, edit);
});
