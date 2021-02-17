var adminWhiteboards = [];
var privateWhiteboards = [];

document.getElementById("logoutButton").addEventListener("click", function() {
  adminWhiteboards = [];
  privateWhiteboards = [];
});

function onSelectWhiteboard(event) {
  var tmp = event.target;
  var name = tmp.dataset.name;
  if (name) {
    changeWhiteboard(name);
    event.stopPropagation();
    event.preventDefault();
  }
  if (tmp.nodeName === "A") {
    event.preventDefault();
  }
}
var whiteboardToolContent = document.querySelector("#whiteboards .toolContent");
whiteboardToolContent.onclick = onSelectWhiteboard;
whiteboardToolContent.ontouchend = onSelectWhiteboard;

var publicBoardsContainer = document.getElementById("publicBoardsContainer");
var privateBoardsContainer = document.getElementById("privateBoardsContainer");
var sharedBoardsListContainer = document.getElementById(
  "sharedBoardsListContainer"
);

var initChat = require("./chat");
var populateAcl = require("./acl");
var chatLogs = document.getElementById("chatLogs");
var re = /(@(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:_))?((?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+)/;
window.updateWhiteboardLists = function updateWhiteboardLists() {
  sharedBoardsListContainer.innerHTML = "";
  privateBoardsContainer.innerHTML = "";
  publicBoardsContainer.innerHTML = "";
  chatLogs.innerHTML = "";

  return ss.rpc("whiteboards.getWhiteboardNames").then(function(response) {
    if (!response) {
      console.log(arguments);
      return;
    }

    var privateBoards = response.privateBoards,
      publicBoards = response.publicBoards,
      anyone = response.anyone,
      user = response.user,
      html = "",
      comps,
      name,
      role,
      uri,
      l,
      i;

    privateWhiteboards = privateBoards;

    for (i = 0, l = privateBoards.length; i < l; i++) {
      uri = privateBoards[i].name;
      comps = re.exec(uri);
      name = decodeURIComponent(comps[2]);
      html += '<li><a class="whiteboardlink" href="/' +
        uri +
        '/" data-name="' +
        uri +
        '">' +
        name +
        "</a></li>";
    }
    renderHtml(html, privateBoardsContainer);
    html = "";

    for (i = 0, l = publicBoards.length; i < l; i++) {
      uri = publicBoards[i].name;
      if (uri === "_global") continue;
      name = decodeURIComponent(uri);
      html += '<li><a class="whiteboardlink" href="/' +
        uri +
        '/" data-name="' +
        uri +
        '">' +
        name +
        "</a></li>";
    }

    for (i = 0, l = anyone.length; i < l; i++) {
      uri = anyone[i].resource;
      name = decodeURIComponent(uri);
      role = anyone[i].role;
      html += '<li><a class="whiteboardlink" href="/' +
        uri +
        '/" data-name="' +
        uri +
        '" title="' +
        role +
        '">' +
        name +
        "</a></li>";
    }
    renderHtml(html, publicBoardsContainer);
    html = "";

    adminWhiteboards = [];
    for (i = 0, l = user.length; i < l; i++) {
      //noinspection JSCheckFunctionSignatures
      comps = re.exec(user[i].resource);
      uri = user[i].resource;
      name = decodeURIComponent(uri);
      role = user[i].role;
      html += '<li><a class="whiteboardlink" href="/' +
        uri +
        '/" data-name="' +
        uri +
        '" title="' +
        role +
        '">' +
        name +
        "</a></li>";

      if (role === "admin") {
        adminWhiteboards.push(user[i]);
      }
    }
    renderHtml(html, sharedBoardsListContainer);

    var current = window.whiteboard;
    var hasAccess = user.some(function(acl) {
      return acl.resource === current;
    }) || anyone.some(function(acl) {
        return acl.resource === current;
      }) || privateBoards.some(function(board) {
        return board.name === current;
      }) || publicBoards.some(function(board) {
        return board.name === current;
      });
    if (!hasAccess) {
      return changeWhiteboard("_global");
    } else {
      return Promise.all([populateAcl(), initChat(current)]);
    }
  });
};

var newWhiteboardNameField = document.getElementById("newWhiteboardNameField");
var whiteboardsHeader = document
  .getElementById("whiteboards")
  .querySelector(".toolHeaderText");

function newWhiteboard() {
  whiteboardsHeader.innerHTML = "Checking&hellip;";

  var val = newWhiteboardNameField.value;
  newWhiteboardNameField.value = "";

  ss.rpc("whiteboards.createWhiteboard", val, function(err, name) {
    var msg = err ? err || "Choose a different name" : "Success";
    whiteboardsHeader.innerHTML = '<span style="font-size:12px;"> ' +
      msg +
      "</span>";
    whiteboardsHeader.firstChild.style.color = err ? "red" : "green";
    setTimeout(
      function() {
        whiteboardsHeader.innerHTML = "Whiteboards";
      },
      3000
    );

    if (!err) {
      changeWhiteboard(name);
      updateWhiteboardLists();
    }
  });
}

document.getElementById("newWhiteboardButton").onclick = newWhiteboard;

newWhiteboardNameField.onkeyup = function(event) {
  if (event.keyCode === 13) {
    newWhiteboard();
  }
};

var search_input_public = document.getElementById("search_input_public");
var publicBoards = document.getElementById("publicBoards");
search_input_public.onkeyup = function(event) {
  if (event.keyCode === 13) {
    var elems = publicBoards.querySelectorAll("li"), tmp, i, il;
    for (i = 0, il = elems.length; i < il; i++) {
      tmp = elems[i];
      if (tmp.style.display !== "none") {
        tmp = tmp.children[0];
        changeWhiteboard(tmp.dataset.name);
        return;
      }
    }
  }
};

var search_input_shared = document.getElementById("search_input_shared");
var sharedBoards = document.getElementById("sharedBoards");
search_input_shared.onkeyup = function(event) {
  if (event.keyCode === 13) {
    var elems = sharedBoards.querySelectorAll("li"), tmp, i, il;
    for (i = 0, il = elems.length; i < il; i++) {
      tmp = elems[i];
      if (tmp.style.display !== "none") {
        tmp = tmp.children[0];
        changeWhiteboard(tmp.dataset.name);
        return;
      }
    }
  }
};

var search_input_private = document.getElementById("search_input_private");
var privateBoards = document.getElementById("privateBoards");
search_input_private.onkeyup = function(event) {
  if (event.keyCode === 13) {
    var elems = privateBoards.querySelectorAll("li"), tmp, i, il;
    for (i = 0, il = elems.length; i < il; i++) {
      tmp = elems[i];
      if (tmp.style.display !== "none") {
        tmp = tmp.children[0];
        changeWhiteboard(tmp.dataset.name);
        return;
      }
    }
  }
};

fastLiveFilter(search_input_public, publicBoardsContainer);
fastLiveFilter(search_input_private, privateBoardsContainer);
fastLiveFilter(search_input_shared, sharedBoardsListContainer);

var loadWhiteboard = require("../loadWhiteboard");

function changeWhiteboard(toWhiteboard) {
  toWhiteboard = toWhiteboard || "_global";

  var fromWhiteboard = window.whiteboard;
  if (fromWhiteboard === toWhiteboard) {
    return;
  }

  window.whiteboard = toWhiteboard;

  ss.rpc("whiteboards.changeWhiteboard", fromWhiteboard, toWhiteboard, function(
    err,
    result
  ) {
    if (err) {
      console.log(arguments);
      return;
    }
    window.location.href = "#0/0/0";
  });

  var url = toWhiteboard === "_global" ? "/" : "/" + toWhiteboard + "/";
  var log = document.getElementById("chatlog-" + toWhiteboard);
  history.pushState(null, toWhiteboard, url);

  ss.rpc("whiteboards.changePosition", toWhiteboard, url, function(err) {
    err && console.log(err);
  });

  [].slice.call(chatLogs.children).forEach(function(log) {
    log.style.display = "none";
  });

  var chatPromise;
  if (!log) {
    chatPromise = initChat(toWhiteboard);
    log = document.getElementById("chatlog-" + toWhiteboard);
  }

  log.style.display = "";

  document.dispatchEvent(new CustomEvent("clearCanvas"));

  return Promise.all([
    loadWhiteboard(toWhiteboard),
    populateAcl(),
    chatPromise
  ]);
}

function whiteboardListClickHandler() {
  var style = this.nextElementSibling.style;
  style.display = style.display === "" ? "none" : "";
  var icon = this.querySelector("i").classList;
  icon.toggle("icon-plus-circled");
  icon.toggle("icon-minus-circled");
}
[].slice
  .call(document.querySelectorAll(".whiteboardList > h4"))
  .forEach(function(whiteboardListHeader) {
    whiteboardListHeader.onclick = whiteboardListClickHandler;
  });

window.loggedInUserIsOwner = function(name) {
  return privateWhiteboards.some(function(whiteboard) {
    return whiteboard.name === name;
  });
};

window.userIsAdminOfCurrentWhiteboard = function() {
  var name = window.whiteboard;
  return adminWhiteboards.some(function(whiteboard) {
    return whiteboard.resource === name;
  });
};

function parseUrl(url) {
  var query, pairs, path, tmp, il, i, t;

  if (url) {
    query = url.substring(url.indexOf("?") + 1);
    query = query.substring(0, query.indexOf("#"));
  } else {
    query = location.search.slice(1);
  }

  path = location.pathname.split("/");

  //noinspection JSUnusedAssignment
  if (
    path.length > 3 && (t = parseInt(path[3], 10)) ||
      path.length > 2 && (t = parseInt(path[2], 10))
  ) {
    window.timestamp = t;
  }
  window.whiteboard = "_global";
  if (
    path.length > 2 &&
      path[1].length > 1 &&
      path[2].length > 0 &&
      !parseInt(path[2], 10)
  ) {
    window.whiteboard = path[1] + "/" + path[2];
  } else if (path.length > 1 && path[1].length > 0) {
    window.whiteboard = path[1];
  }

  pairs = query.split("&");
  for (i = 0, il = pairs.length; i < il; i++) {
    tmp = pairs[i].split("=");
    switch (tmp[0]) {
      case "whiteboard":
        window.whiteboard = tmp[1];
        break;

      case "time":
        window.timestamp = +tmp[1];
        break;
    }
  }
}

window.onpopstate = function() {
  var returnLocation = history.location || document.location;

  var current = window.whiteboard;
  parseUrl(returnLocation.href);
  var whiteboard = window.whiteboard;
  if (whiteboard === current) {
    return;
  }

  changeWhiteboard(whiteboard);
};

parseUrl();

var whiteboard = window.whiteboard;

document.addEventListener("userObject", function() {
  Promise
    .all([updateWhiteboardLists(), loadWhiteboard(whiteboard)])
    .then(function() {
      // Issue domStorageItemAdded event to trigger screenshot readiness
      localStorage.removeItem("_screen");
      localStorage.setItem("_screen", new Date());
      document.dispatchEvent(new CustomEvent("finishedRender"));
    })
    .catch(function(err) {
      console.log(err);
    });

  ss.rpc("whiteboards.changeWhiteboard", !1, whiteboard, function(err) {
    if (err) {
      console.log(err);
      // TODO notification with retry button
    }
  });
});
