var aclUsers = [];
document.getElementById("logoutButton").addEventListener("click", function() {
  aclUsers = [];
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
    var index = aclUsers.indexOf(userName);
    if (index !== -1) {
      aclUsers.splice(index, 1);
    }
  });
}

aclUsers = [];
var aclWrapper = document.getElementById("aclWrapper");
var aclPublicAccess = document.getElementById("aclPublicAccess");
var noPublicAccessOption = aclPublicAccess.querySelector("option[value=none]");
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
    aclUsers = [];
    noPublicAccessOption.selected = "selected";

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

      aclUsers.push(userName);

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

document.getElementById("aclPublicAccess").onchange = function(event) {
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

document.getElementById("addUserButton").onclick = function() {
  var candidateUser = document.getElementById("aclUsernameField").value;

  // can't set roles for owner
  if (candidateUser === window.userObject.username) {
    return;
  }

  if (aclUsers.indexOf(candidateUser) !== -1) {
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

    aclUsers.push(candidateUser);

    var html = htmlToElement(
      ss.tmpl["sharingSettings-aclUser"].render(data)
    );

    aclWrapper.appendChild(html);

    html.querySelector(".aclSelect").onchange = selectRole;

    html.querySelector(".removeUserButton").onclick = removeUser;
  });
};

var dialog = document.getElementById("sharingSettingsDialog");
var dialogStyle = dialog.style;
document.addEventListener("click", function(event) {
  if (event.target.id === "sharingSettingsButton") {
    dialogStyle.display = "";
  }
});

document.getElementById("closeAclDialogButton").onclick = function () {
  dialogStyle.display = "none";
};

document.addEventListener("clearCanvas", function() {
  dialogStyle.display = "none";
  populateAcl();
});

populateAcl();