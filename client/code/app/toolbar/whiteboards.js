var whiteboardData = {};
$("#logoutButton").click(function() {
  whiteboardData.aclUsers = [];
  whiteboardData.adminWhiteboards = [];
  whiteboardData.privateWhiteboards = [];
});

var toolHeaderText = "Whiteboards";

var eventType = "touchend click";
function myCustomBind(controlName, callback) {
  $(controlName).off(eventType).on(eventType, function(e) {
    callback.call(this, e);
  });
}

var globalRE = /globalWhiteboard/;
function whiteboardLinkHandlers() {
  myCustomBind(".whiteboardlink", function(event) {
    if (this.text) {
      // Chrome ipad fix for multi whiteboards
      changeWhiteboard(
        globalRE.test(this.className) ? "_global" : $(this).attr("data-name")
      );
      event.stopPropagation();
      event.preventDefault();
    }
  });
}
var publicBoardsContainer = $("#publicBoardsContainer");
var privateBoardsContainer = $("#privateBoardsContainer");
var $sharedBoardsListContainer = $("#sharedBoardsListContainer");
var re = /(@(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/))?((?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+)/;
window.updateWhiteboardLists = function(callback) {
  $sharedBoardsListContainer.html("");
  privateBoardsContainer.html("");
  publicBoardsContainer.html("");

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
    privateBoardsContainer.append(html);
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
    publicBoardsContainer.append(html);
    html = "";

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
    publicBoardsContainer.append(html);
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
    $sharedBoardsListContainer.append(html);

    whiteboardLinkHandlers();

    $("#search_input_public").fastLiveFilter("#publicBoardsContainer");
    $("#search_input_private").fastLiveFilter("#privateBoardsContainer");
    var search_input_shared = $("#search_input_shared");
    search_input_shared.fastLiveFilter("#sharedBoardsListContainer");
    search_input_shared.one("focus", function() {
      $(this).val("");
    });

    callback(response);
  });
};

var initChat = require("./chat");
window.updateWhiteboardLists(function() {
  // Update whiteboard ownership and admin access data before initializing chat
  initChat(window.whiteboard);
});

whiteboardData.aclUsers = [];
window.populateAcl = function populateAcl() {
  $("#aclWrapper").html("");

  $("#shareLinkURL").val(location.origin + "/" + window.whiteboard);

  ss.rpc("acl.getUsersAndPermissions", whiteboard, function(err, res) {
    if (err || !res) {
      console.log(arguments);
      return;
    }
    whiteboardData.aclUsers = [];
    var aclPublicAccess = $("#aclPublicAccess");
    aclPublicAccess.find("option[value=none]").attr("selected", "selected");
    $("#aclUsernameField").val("Enter username to add...");
    var users = "";
    for (var i = 0; i < res.length; i++) {
      var user = res[i];
      var role = user.role;
      var userName = user.username;

      if (userName === "anyone") {
        aclPublicAccess
          .find("option[value=" + role + "]")
          .attr("selected", "selected");
        continue;
      }

      var data = { userName: userName, userId: user.id };

      data[role] = "selected";

      whiteboardData.aclUsers.push(userName);

      users += ss.tmpl["sharingSettings-aclUser"].render(data);
    }
    $("#aclWrapper").html(users);
  });
};

var newWhiteboardNameField = $("#newWhiteboardNameField");
var whiteboardsHeader = $(
  ".toolHeaderText",
  document.getElementById("whiteboards")
);
function newWhiteboard() {
  whiteboardsHeader.html("Checking&hellip;");

  var val = newWhiteboardNameField.val();
  newWhiteboardNameField.val("");

  ss.rpc("whiteboards.createWhiteboard", val, function(err) {
    if (!err) {
      whiteboardsHeader
        .html(
          '<span style="color:green; font-size:12px;">Success</span>'
        )
        .delay(2000)
        .fadeOut(1000, function() {
          whiteboardsHeader.html(toolHeaderText).fadeIn();
        });
      window.updateWhiteboardLists(function() {
        window.changeWhiteboard(val);
      });
      window.populateAcl();
    } else {
      whiteboardsHeader
        .html(
          '<span style="color:red; font-size:12px;"> ' +
            (err || "Choose a different name") +
            " </span>"
        )
        .delay(2000)
        .fadeOut(1000, function() {
          whiteboardsHeader.html(toolHeaderText).fadeIn();
        });
    }
  });
}

$("#newWhiteboardButton").mousedown(newWhiteboard);

newWhiteboardNameField.keyup(function(event) {
  if (event.keyCode === 13) {
    newWhiteboard();
  }
});

newWhiteboardNameField.one("focus", function() {
  $(this).val("");
});

var search_input_public = $("#search_input_public");
search_input_public.one("focus", function() {
  $(this).val("");
});
var publicBoards = $("#publicBoards");
search_input_public.keyup(function(event) {
  if (event.keyCode === 13) {
    var elems = $("li", publicBoards), tmp, i, il;
    for (i = 0, il = elems.length; i < il; i++) {
      tmp = elems[i];
      if (tmp.style.display !== "none") {
        tmp = tmp.children[0];
        changeWhiteboard(
          globalRE.test(tmp.className) ? "_global" : tmp.dataset.name
        );
        return;
      }
    }
  }
});
var search_input_private = $("#search_input_private");
search_input_private.one("focus", function() {
  $(this).val("");
});
var privateBoards = $("#privateBoards");
search_input_private.keyup(function(event) {
  if (event.keyCode === 13) {
    var elems = $("li", privateBoards), tmp, i, il;
    for (i = 0, il = elems.length; i < il; i++) {
      tmp = elems[i];
      if (tmp.style.display !== "none") {
        tmp = tmp.children[0];
        changeWhiteboard(
          globalRE.test(tmp.className) ? "_global" : tmp.dataset.name
        );
        return;
      }
    }
  }
});

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

  $("> div", document.getElementById("chat")).hide();

  if (!log) {
    initChat(toWhiteboard);
    log = document.getElementById("chatlog-" + toWhiteboard);
  }

  $(log).show();

  sharingSettingsDialog.dialog("close");

  window.populateAcl();

  document.dispatchEvent(new CustomEvent("clearCanvas"));
};

$(".whiteboardList h4").on("click", function() {
  $(this.nextElementSibling).fadeToggle();
  $(this)
    .find("i")
    .toggleClass("icon-plus-circled")
    .toggleClass("icon-minus-circled");
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
    var dialog = $("#sharingSettingsDialog");
    dialog.on("change", ".aclSelect", function(event) {
      var userName = $(this).attr("data-username"),
        newPermission = event.target.value;

      ss.rpc("acl.setUserRole", whiteboard, userName, newPermission, function(
        err,
        res
      ) {
        if (err) {
          console.log(arguments);
        }
      });
    });

    dialog.on("change", "#aclPublicAccess", function(event) {
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
    });

    dialog.on("click", ".removeUserButton", function() {
      var userId = $(this).attr("data-userId"),
        userName = $(this).attr("data-username"),
        i;

      ss.rpc("acl.removeUserRoles", whiteboard, userName, function(err, res) {
        if (err) {
          console.log(arguments);
          return;
        }
        $("#aclUser-" + userName).remove();
        var index = whiteboardData.aclUsers.indexOf(userName);
        if (index !== -1) {
          whiteboardData.aclUsers.splice(i, 1);
        }
      });
    });

    dialog.on("click", "#addUserButton", function() {
      var candidateUser = $("#aclUsernameField").val();

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
        var permission = $("#newUserPermission").find(":selected").val();

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

        $(
          "#aclWrapper"
        ).append(ss.tmpl["sharingSettings-aclUser"].render(data));
      });
    });

    $("#aclUsernameField").on("focus", function() {
      $(this).val("");
    });
  }
});

$(document).on("click", "#sharingSettingsButton", function() {
  sharingSettingsDialog.dialog("open");
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
