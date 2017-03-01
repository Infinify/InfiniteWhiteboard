/**
 * @param {String} html representing a single element
 * @return {Element}
 */
window.htmlToElement = function htmlToElement(html) {
  var tmp = document.implementation.createHTMLDocument();
  tmp.body.innerHTML = html;
  return tmp.body.firstChild;
};

/**
 * @param {String} html representing any number of sibling elements
 * @return {NodeList}
 */
window.htmlToElements = function htmlToElements(html) {
  var tmp = document.implementation.createHTMLDocument();
  tmp.body.innerHTML = html;
  return tmp.body.childNodes;
};

/**
 * @param {String} html representing any number of sibling elements
 * @param {Element} root element to append children to
 * @return {Element[]}
 */
window.renderHtml = function renderHtml(html, root) {
  var nodeList = htmlToElements(html);
  return [].slice.call(nodeList).map(function(child) {
    return root.appendChild(child);
  });
};

require("/toolbar/login");
require("/toolbar/pencil");
require("/toolbar/shapes");
require("/toolbar/text");
require("/toolbar/acl");
require("/toolbar/whiteboards");
require("/toolbar/timeline");
require("/toolbar/places");

var tools = [
  "login",
  "pencil",
  "shapes",
  "textTool",
  "whiteboards",
  "timeMachine",
  "places",
  "interact"
];

var toolClasses = tools.reduce(
  function(map, tool) {
    map[tool] = document.getElementById(tool).classList;
    return map;
  },
  {}
);

var drawToolHandler = require("/drawToolHandler");
document.getElementById("toolbarWrapper").onclick = function onToolClick(
  event
) {
  var target = event.target;
  var currentTarget = event.currentTarget;

  while (!target.classList.contains("toolHeader") && target !== currentTarget) {
    target = target.parentNode;
  }

  if (!target.classList.contains("toolHeader")) {
    return;
  }

  target = target.parentNode;
  target.classList.toggle("open");

  var id = target.id;
  tools.forEach(function(tool) {
    if (id !== tool) {
      var classes = toolClasses[tool];
      if (classes.contains("open")) {
        classes.remove("open");
      }
    }
  });

  drawToolHandler();
};

function onHeaderHover() {
  var toolIcon = this.querySelector(".toolIcon");
  if (toolIcon) {
    toolIcon.classList.toggle("iconHover");
  }
}

[].slice
  .call(document.querySelectorAll(".toolHeader"))
  .forEach(function(toolHeader) {
    toolHeader.onmouseover = toolHeader.onmouseout = onHeaderHover;
  });

var toolbarStyle = document.getElementById("toolbarWrapper").style;

document.getElementById("hideToolbarButton").onclick = function() {
  toolbarStyle.display = "none";
};

document.getElementById("showToolbarButton").onclick = function() {
  toolbarStyle.display = "";
};
