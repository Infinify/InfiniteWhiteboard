var initChat = require("./chat");

function showLoading(spinner, message) {
  $(spinner).fadeIn(400).find(".spinnerText").html(message).fadeIn(400);
}

function hideLoading(spinner) {
  $(spinner).fadeOut(400).find("spinnerText").html("");
}

i18n.init({ resStore: require("./translations/login_i18n") });

var t = i18n.t;

$("#toolContainer").append(
  ss.tmpl["toolbar-tool"].render({
    toolId: "login",
    toolIconClasses: "toolIcon icon-infinity",
    toolHeaderText: t("Login")
  })
);

$(".toolContent", document.getElementById("login")).prepend(
  ss.tmpl["toolbar-login"].render({
    usernameFieldText: t("username"),
    passwordFieldText: "password",
    loginButtonText: t("Login"),
    registerButtonText: t("Register")
  })
);

var usernameField = document.getElementById("usernameField");
var passwordField = document.getElementById("passwordField");
var $toolbarHeader = $("#toolbarHeader");
var $logoutButton = $("#logoutButton");
var $displayName = $("#displayName");
var $login = $("#login");

function loginSuccessHandler() {
  ss.rpc("auth.getUserObject", function(err, response) {
    if (err) {
      console.log(arguments);
      return;
    }
    window.userObject = response;
  });

  $toolbarHeader.addClass("loggedIn");

  $logoutButton.show();

  $displayName.html(usernameField.value).fadeIn(200);

  window.updateWhiteboardLists(function() {
    $("#privateBoards").show();
    $("#sharedBoards").show();
    $(".chatlog").remove();

    initChat(window.whiteboard);
    populateAcl();
  });

  $("#privateBoards").accordion("option", "active", false);
  $("#sharedBoards").accordion("option", "active", false);
  $("#newWhiteboardFieldText").html("Create new personal whiteboard");

  $("#loginSpinner")
    .find(".spinnerText")
    .hide()
    .html(t("Welcome!"))
    .fadeIn(500)
    .delay(1000)
    .fadeOut(400, function() {
      hideLoading("#loginSpinner", "");
      $login.removeClass("open").hide("Blind");
    });
}

function getLoginHash() {
  //noinspection JSPotentiallyInvalidConstructorUsage
  var shaObj = new jsSHA(usernameField.value + passwordField.value, "TEXT");
  return shaObj.getHash("SHA-512", "B64");
}

var $loginDiv = $("#loginDiv");
$("#registerButton").mousedown(function() {
  $loginDiv.hide();
  showLoading("#loginSpinner", t("checkingUsernameMessage"));
  ss.rpc(
    "auth.register",
    { username: usernameField.value, hash: getLoginHash() },
    function(err) {
      if (err) {
        $("#loginSpinner")
          .find(".spinnerText")
          .hide()
          .html(
            err !== "userExists"
              ? '<span style="color:red;">' + err + "<span>"
              : '<span style="color:red;">' +
                  t("usernameTakenMessage") +
                  "</br><span></span>" +
                  t("chooseDifferentUsernameMessage") +
                  "</span>"
          )
          .fadeIn(500)
          .delay(3000)
          .fadeOut(400, function() {
            hideLoading("#loginSpinner", "");
            $loginDiv.fadeIn(400);
          });
      } else {
        loginSuccessHandler();
      }
    }
  );
});

function login() {
  $loginDiv.hide();
  showLoading("#loginSpinner", t("loggingInMessage"));
  ss.rpc(
    "auth.login",
    { username: usernameField.value, hash: getLoginHash() },
    function(err, success) {
      if (!err && success) {
        loginSuccessHandler();
      } else {
        $("#loginSpinner")
          .find(".spinnerText")
          .hide()
          .html(
            '<span style="color:red;">' +
              t("loginFailedMessage") +
              "</span></br><span>" +
              (err || t("checkUserAndPassMessage")) +
              "</span>"
          )
          .fadeIn(500)
          .delay(3000)
          .hide(0, function() {
            hideLoading("#loginSpinner");
            $loginDiv.fadeIn(400);
          });
      }
    }
  );
}

$("#loginButton").mousedown(login);
var $username = $("#usernameField");
var $password = $("#passwordField");
$username.keyup(function(event) {
  if (event.keyCode === 13) {
    $password.focus();
  }
});
$password.keyup(function(event) {
  if (event.keyCode === 13) {
    login();
  }
});
$username.one("focus", function() {
  $(this).val("");
});
$password.one("focus", function() {
  $(this).val("");
});

var $userHeader = $("#user").find("a");
$logoutButton.click(function() {
  var userObject = window.userObject;

  ss.rpc("auth.logout", null, function(err, success) {
    if (err) {
      console.log(arguments);
      return;
    }
    $userHeader.html("Login").fadeIn(200);
    $login.removeClass("open").removeClass("loggedIn").show();
    $loginDiv.show("bounce");
    $logoutButton.hide();
    $displayName.html(userObject.anonymous);
    $toolbarHeader.removeClass("loggedIn");

    $("#privateBoards").hide();
    $("#sharedBoards").hide();
    $("#newWhiteboardFieldText").html("Create new public whiteboard");

    userObject.hash = userObject.id = userObject.username = null;

    window.updateWhiteboardLists(function(response) {
      var anyone = response.anyone.map(function(aclEntry) {
        return aclEntry.resource;
      });
      var publicBoards = response.publicBoards.map(function(publicBoard) {
        return publicBoard.name;
      });
      var current = window.whiteboard;
      if (
        anyone.indexOf(current) === -1 && publicBoards.indexOf(current) === -1
      ) {
        // subscribe to global chat and pubsub
        $(".chatlog").remove();
        changeWhiteboard("_global");
      }
    });

    window.populateAcl();
  });
});

$("#loginSpinner").spin({
  color: "#CFCFCF",
  radius: 30,
  speed: 0.8,
  lines: 30,
  top: "0px",
  left: "60px"
});

hideLoading("#loginSpinner");

ss.rpc("auth.getUserObject", function(err, userObject) {
  if (err) {
    console.log(err);
    return;
  }

  window.userObject = userObject;

  if (userObject.username) {
    $("#login").addClass("loggedIn").hide();
    $("#loginDiv").hide();
    $("#logoutDiv").show();
    $("#logoutButton").show();
    $("#displayName").html(userObject.username);
    $("#toolbarHeader").addClass("loggedIn");
    $("#privateBoards").show();
    $("#newWhiteboardFieldText").html("Create new personal whiteboard");
  } else {
    $("#displayName").html(userObject.anonymous);
    $("#sharedBoards").hide();
    $("#privateBoards").hide();
  }
});
