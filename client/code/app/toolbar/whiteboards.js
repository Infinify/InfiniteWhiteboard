var whiteboardData = {};
document.getElementById("logoutButton").addEventListener("click", function() {
  whiteboardData.aclUsers = [];
  whiteboardData.adminWhiteboards = [];
  whiteboardData.privateWhiteboards = [];
});

function onSelectWhiteboard(event) {
  var tmp = event.target;
  var name = tmp.dataset.name;
  if (name) {
    changeWhiteboard(name);
    event.stopPropagation();
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
var re = /(@(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/))?((?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+)/;
window.updateWhiteboardLists = function(callback) {
  sharedBoardsListContainer.innerHTML = "";
  privateBoardsContainer.innerHTML = "";
  publicBoardsContainer.innerHTML = "";

  ss.rpc("whiteboards.getWhiteboardNames", function(err, response) {
    if (err || !response) {
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

    whiteboardData.privateWhiteboards = privateBoards;

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

    whiteboardData.adminWhiteboards = [];
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
        whiteboardData.adminWhiteboards.push(user[i]);
      }
    }
    renderHtml(html, sharedBoardsListContainer);

    $("#search_input_public").fastLiveFilter("#publicBoardsContainer");
    $("#search_input_private").fastLiveFilter("#privateBoardsContainer");
    $("#search_input_shared").fastLiveFilter("#sharedBoardsListContainer");

    callback(response);
  });
};

var initChat = require("./chat");
window.updateWhiteboardLists(function() {
  // Update whiteboard ownership and admin access data before initializing chat
  initChat(window.whiteboard);
});

function selectRole(event) {
  var userName = this.dataset.username, newPermission = event.target.value;

  ss.rpc("acl.setUserRole", whiteboard, userName, newPermission, function(
    err,
    res
  ) {
    if (err) {
      console.log(arguments);
    }
  });
}

function removeUser() {
  var userName = this.dataset.username;

  ss.rpc("acl.removeUserRoles", whiteboard, userName, function(err, res) {
    if (err) {
      console.log(arguments);
      return;
    }
    var user = document.getElementById("aclUser-" + userName);
    user.parentNode.removeChild(user);
    var index = whiteboardData.aclUsers.indexOf(userName);
    if (index !== -1) {
      whiteboardData.aclUsers.splice(index, 1);
    }
  });
}

whiteboardData.aclUsers = [];
var aclWrapper = document.getElementById("aclWrapper");
window.populateAcl = function populateAcl() {
  aclWrapper.innerHTML = "";

  document.getElementById("shareLinkURL").value = location.origin +
    "/" +
    window.whiteboard;

  ss.rpc("acl.getUsersAndPermissions", whiteboard, function(err, res) {
    if (err || !res) {
      console.log(arguments);
      return;
    }
    whiteboardData.aclUsers = [];
    var aclPublicAccess = document.getElementById("aclPublicAccess");
    aclPublicAccess.querySelector("option[value=none]").selected = "selected";
    document.getElementById(
      "aclUsernameField"
    ).value = "Enter username to add...";
    var users = "";
    for (var i = 0; i < res.length; i++) {
      var user = res[i];
      var role = user.role;
      var userName = user.username;

      if (userName === "anyone") {
        aclPublicAccess.querySelector(
          "option[value=" + role + "]"
        ).selected = "selected";
        continue;
      }

      var data = { userName: userName, userId: user.id };

      data[role] = "selected";

      whiteboardData.aclUsers.push(userName);

      users += ss.tmpl["sharingSettings-aclUser"].render(data);
    }
    aclWrapper.innerHTML = users;

    [].slice
      .call(aclWrapper.querySelectorAll(".aclSelect"))
      .forEach(function(selector) {
        selector.onchange = selectRole;
      });

    [].slice
      .call(aclWrapper.querySelectorAll(".removeUserButton"))
      .forEach(function(button) {
        button.onclick = removeUser;
      });
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

  ss.rpc("whiteboards.createWhiteboard", val, function(err) {
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
      window.updateWhiteboardLists(function() {
        window.changeWhiteboard(val);
      });
      window.populateAcl();
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

var sharingSettingsDialog = $("#sharingSettingsDialog");
window.changeWhiteboard = function changeWhiteboard(toWhiteboard) {
  toWhiteboard = toWhiteboard || "_global";
  if (window.whiteboard === toWhiteboard) {
    return;
  }

  ss.rpc(
    "whiteboards.changeWhiteboard",
    window.whiteboard,
    toWhiteboard,
    function(err, result) {
      if (err) {
        console.log(arguments);
        return;
      }
      window.location.href = "#0/0/0";
    }
  );

  window.whiteboard = toWhiteboard;

  var url = toWhiteboard === "_global" ? "/" : "/" + toWhiteboard + "/";
  var log = document.getElementById("chatlog-" + toWhiteboard);
  history.pushState(null, toWhiteboard, url);

  ss.rpc("whiteboards.changePosition", toWhiteboard, url, function(err) {
    err && console.log(err);
  });

  [].slice
    .call(document.getElementById("chatLogs").children)
    .forEach(function(log) {
      log.style.display = "none";
    });

  if (!log) {
    initChat(toWhiteboard);
    log = document.getElementById("chatlog-" + toWhiteboard);
  }

  log.style.display = "";

  sharingSettingsDialog.dialog("close");

  window.populateAcl();

  document.dispatchEvent(new CustomEvent("clearCanvas"));
};

function whiteboardListClickHandler() {
  var style = this.nextElementSibling.style;
  style.display = style.display === "" ? "none" : "";
  var icon = this.querySelector("i").classList;
  icon.toggle("icon-plus-circled");
  icon.toggle("icon-minus-circled");
}
[].slice
  .call(document.querySelectorAll(".whiteboardList h4"))
  .forEach(function(whiteboardListHeader) {
    whiteboardListHeader.onclick = whiteboardListClickHandler;
  });

sharingSettingsDialog.dialog({
  dialogClass: "aclDialog",
  autoOpen: false,
  draggable: true,
  position: { my: "center", at: "center", of: window },
  maxHeight: 500,
  minHeight: 300,
  maxWidth: 400,
  minWidth: 400,
  create: function() {
    window.populateAcl();

    // start reacting to the change events of the permission dropdowns
    var dialog = document.getElementById("sharingSettingsDialog");

    dialog.querySelector("#aclPublicAccess").onchange = function(event) {
      var username = "anyone", newPermission = event.target.value;

      if (newPermission === "none") {
        ss.rpc("acl.removeUserRoles", whiteboard, username, function(err, res) {
          if (err) {
            console.log(arguments);
          }
        });
      } else {
        ss.rpc("acl.setUserRole", whiteboard, username, newPermission, function(
          err,
          res
        ) {
          if (err) {
            console.log(arguments);
          }
        });
      }
    };

    dialog.querySelector("#addUserButton").onclick = function() {
      var candidateUser = document.getElementById("aclUsernameField").value;

      // can't set roles for owner
      if (candidateUser === window.userObject.username) {
        return;
      }

      if (whiteboardData.aclUsers.indexOf(candidateUser) !== -1) {
        return;
      }

      // does uer exist
      ss.rpc("auth.getUserByName", candidateUser, function(err, res) {
        if (err) {
          console.log(arguments);
          return;
        }
        if (!res) {
          // username doesn't exist, try again
          return;
        }
        var permission = document.getElementById(
          "newUserPermission"
        ).selectedOptions[0].value;

        // add new permission
        ss.rpc(
          "acl.setUserRole",
          whiteboard,
          candidateUser,
          permission,
          function(err, res) {
            if (err) {
              console.log(arguments);
            }
          }
        );

        var data = { userName: candidateUser, userId: res._id };

        data[permission] = "selected";

        whiteboardData.aclUsers.push(candidateUser);

        var html = htmlToElement(
          ss.tmpl["sharingSettings-aclUser"].render(data)
        );

        aclWrapper.appendChild(html);

        html.querySelector(".aclSelect").onchange = selectRole;

        html.querySelector(".removeUserButton").onclick = removeUser;
      });
    };

    document.getElementById("aclUsernameField").onfocus = function() {
      this.value = "";
    };
  }
});

document.addEventListener("click", function(event) {
  if (event.target.id === "sharingSettingsButton") {
    sharingSettingsDialog.dialog("open");
  }
});

window.loggedInUserIsOwner = function(whiteboardQuery) {
  // if current whiteboard is in list of privately listed whiteboards
  if (whiteboardData.privateWhiteboards) {
    var privateWhiteboards = whiteboardData.privateWhiteboards, i;

    for (i = 0; i < privateWhiteboards.length; i++) {
      if (privateWhiteboards[i].name === whiteboardQuery) {
        return true;
      }
    }
  }

  return false;
};

window.userIsAdminOfCurrentWhiteboard = function() {
  if (whiteboardData.adminWhiteboards) {
    var i, l = whiteboardData.adminWhiteboards.length;

    for (i = 0; i < l; i++) {
      if (window.whiteboard === whiteboardData.adminWhiteboards[i].resource) {
        return true;
      }
    }
  }
  return false;
};
