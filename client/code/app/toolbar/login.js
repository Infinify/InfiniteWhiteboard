var initChat = require("./chat");

var loginSpinner = document.getElementById("loginSpinner");
var spinnerText = loginSpinner.querySelector(".spinnerText");

function showLoading(message) {
  loginSpinner.style.display = "";
  spinnerText.innerHTML = message;
}

function hideLoading() {
  loginSpinner.style.display = "none";
  spinnerText.innerHTML = "";
}

new Spinner({
  color: "#CFCFCF",
  radius: 30,
  speed: 0.8,
  lines: 30,
  top: "0px",
  left: "60px"
}).spin(loginSpinner);

var newWhiteboardFieldText = document.getElementById("newWhiteboardFieldText");
var usernameField = document.getElementById("usernameField");
var passwordField = document.getElementById("passwordField");
var toolbarHeader = document.getElementById("toolbarHeader");
var privateBoards = document.getElementById("privateBoards");
var sharedBoards = document.getElementById("sharedBoards");
var logoutButton = document.getElementById("logoutButton");
var displayName = document.getElementById("displayName");
var chatLogs = document.getElementById("chatLogs");
var loginTool = document.getElementById("login");

function loginSuccessHandler() {
  ss.rpc("auth.getUserObject", function(err, response) {
    if (err) {
      console.log(arguments);
      return;
    }
    window.userObject = response;
  });

  logoutButton.style.display = "";

  spinnerText.innerHTML = "Welcome!";

  loginTool.classList.add("loggedIn");
  
  toolbarHeader.classList.add("loggedIn");

  displayName.textContent = usernameField.value;

  newWhiteboardFieldText.textContent = "Create new personal whiteboard";

  window.updateWhiteboardLists(function() {
    privateBoards.style.display = "";
    sharedBoards.style.display = "";
    chatLogs.innerHTML = "";

    initChat(window.whiteboard);
    populateAcl();
  });
  
  setTimeout(
    function() {
      hideLoading();
      loginTool.classList.remove("open");
      loginTool.style.display = "none";
    },
    2000
  );
}

function getLoginHash() {
  //noinspection JSPotentiallyInvalidConstructorUsage
  var shaObj = new jsSHA(usernameField.value + passwordField.value, "TEXT");
  return shaObj.getHash("SHA-512", "B64");
}

var loginDiv = document.getElementById("loginDiv");
document.getElementById("registerButton").onclick = function() {
  loginDiv.style.display = "none";
  showLoading("Checking username availability");
  ss.rpc(
    "auth.register",
    { username: usernameField.value, hash: getLoginHash() },
    function(err) {
      if (err) {
        spinnerText.innerHTML = err !== "userExists"
          ? '<span style="color:red;">' + err + "<span>"
          : '<span style="color:red;">Username already taken</span></br><span>Please try a different one</span>';
        setTimeout(
          function() {
            hideLoading();
            loginDiv.style.display = "";
          },
          3000
        );
      } else {
        loginSuccessHandler();
      }
    }
  );
};

function login() {
  loginDiv.style.display = "none";
  showLoading("Login in.");
  ss.rpc(
    "auth.login",
    { username: usernameField.value, hash: getLoginHash() },
    function(err, success) {
      if (!err && success) {
        loginSuccessHandler();
      } else {
        spinnerText.innerHTML = '<span style="color:red;">Login failed</span></br><span>' +
          (err || "Please double check our username and password") +
          "</span>";
        setTimeout(
          function() {
            hideLoading();
            loginDiv.style.display = "";
          },
          3000
        );
      }
    }
  );
}

document.getElementById("loginButton").onmousedown = login;
function loginOnEnter(event) {
  if (event.keyCode === 13) {
    login();
  }
}
usernameField.onkeyup = passwordField.onkeyup = loginOnEnter;

logoutButton.onclick = function() {
  var userObject = window.userObject;

  ss.rpc("auth.logout", null, function(err, success) {
    if (err) {
      console.log(arguments);
      return;
    }

    loginDiv.style.display = "";
    loginTool.style.display = "";

    sharedBoards.style.display = "none";
    logoutButton.style.display = "none";
    privateBoards.style.display = "none";

    loginTool.classList.remove("open");
    loginTool.classList.remove("loggedIn");
    toolbarHeader.classList.remove("loggedIn");

    displayName.textContent = userObject.anonymous;
    newWhiteboardFieldText.textContent = "Create new public whiteboard";

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
        chatLogs.innerHTML = "";
        changeWhiteboard("_global");
      }
    });

    window.populateAcl();
  });
};

ss.rpc("auth.getUserObject", function(err, userObject) {
  if (err) {
    console.log(err);
    return;
  }

  window.userObject = userObject;

  if (userObject.username) {
    newWhiteboardFieldText.textContent = "Create new personal whiteboard";
    displayName.textContent = userObject.username;

    toolbarHeader.classList.add("loggedIn");
    loginTool.classList.add("loggedIn");

    loginTool.style.display = "none";
    loginDiv.style.display = "none";

    privateBoards.style.display = "";
    sharedBoards.style.display = "";
    logoutButton.style.display = "";
  } else {
    displayName.textContent = userObject.anonymous;

    privateBoards.style.display = "none";
    sharedBoards.style.display = "none";
  }
});
