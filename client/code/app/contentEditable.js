var htmlRoot = document.getElementById("html");

function initializeContentEditableUI(event) {
  var cancelButton = document.createElement("button");
  var saveButton = document.createElement("button");
  var wrap = document.createElement("div");

  cancelButton.textContent = "Cancel";
  saveButton.textContent = "Save";
  wrap.appendChild(cancelButton);
  wrap.appendChild(saveButton);
  wrap.className = "htmlTool";

  document.body.appendChild(wrap);

  htmlRoot.classList.add("active");

  var detail = event.detail;
  var html = detail.html;
  var edit = detail.edit;
  var htmlElement = html.elem;

  htmlElement.contentEditable = "true";

  function removeContentEditableUI() {
    wrap.parentNode.removeChild(wrap);
    htmlRoot.classList.remove("active");
    htmlElement.contentEditable = "inherit";
  }

  cancelButton.onclick = function cancel() {
    removeContentEditableUI();

    if (edit) {
      htmlElement.innerHTML = html.content;
    } else {
      html.visible = false;
      html.remove();
    }
  };

  saveButton.onclick = function save() {
    removeContentEditableUI();

    html.content = htmlElement.innerHTML;

    if (edit) {
      updateObject(html);
    } else {
      send(html);
    }
  };
}

document.addEventListener("htmlEditor", initializeContentEditableUI);
