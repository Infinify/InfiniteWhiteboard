function clickHandler(e) {
  var msgDiv = e.target;
  while (!msgDiv.classList.contains("messageElement")) {
    msgDiv = msgDiv.parentNode;
  }
  if (!msgDiv.classList.contains("messageElement")) {
    return;
  }

  var href = msgDiv.querySelector("a").hash;
  var args = href.slice(1).split("/").map(Number);
  if (args.length < 3 || args.some(isNaN)) {
    return true;
  }

  var time = +msgDiv.dataset["timemachine"];

  switch (e.target.className) {
    case "time":
      // Jump in time when clicking on timestamp
      window.timestamp = time;
      window.timeAnimation();
      break;

    case "location":
    case "icon-target target":
      // Jump to position directly when clicking the cross-hair icon
      window.location.href = href;
      break;

    case "user":
      // Do both, i.e. Jump in time and animate position when clicking on user
      window.timestamp = time;
      window.timeAnimation();
      window.animateCenterZoom(
        window.map,
        { lon: args[2], lat: args[1] },
        args[0]
      );
      break;

    default:
      return true;
  }

  // TODO disable all tools when jumping using chat

  return false;
}

function messageTemplate(data) {
  var href = data.href,
    user = data.user,
    time = data.time,
    message = data.message;

  return '<div class="messageElement">' +
    "<p>" +
    '<a href="' +
    href +
    '" tabindex="-1" title="Jump to message origin"><span class="location"><i class="icon-target target"></i></span></a>' +
    '<span class="user" title="Fly to message origin WITH ANIMATION =)">' +
    user +
    "</span>" +
    '<span class="time" style="float: right;">' +
    time +
    "</span>" +
    "</p>" +
    '<p class="message">' +
    message +
    "</p>" +
    '<p style="clear:both;"></p>' +
    "</div>";
}

function renderMessage(messageContainer, message, pending) {
  var tm = new Date(
    message.timemachine || message.timestamp || message.timeStamp
  );
  var d = new Date(message.timeStamp);
  var sender = message.sender;
  var messageElement = htmlToElement(
    messageTemplate({
      time: d.toString("d.M.yyyy hh:mm"),
      message: message.message,
      href: message.location,
      user: sender
    })
  );

  messageContainer.appendChild(messageElement);

  messageElement.dataset["timemachine"] = +tm;

  var userObject = window.userObject;
  var classList = messageElement.classList;
  if (sender === userObject.username || sender === userObject.anonymous) {
    classList.add("sent");
  } else {
    classList.add("recieved");
  }
  if (pending) {
    classList.add("pending");
  }

  return messageElement;
}

function send() {
  var whiteboard = window.whiteboard || "_global";
  var messageField = document.getElementById(whiteboard + "-messageField");
  var val = messageField.value;
  if (val.length === 0) {
    return;
  }
  messageField.value = "";
  messageField.focus();

  var userObject = window.userObject;
  var message = {
    message: val,
    timeStamp: new Date(),
    timemachine: window.timestamp,
    sender: userObject.username || userObject.anonymous,
    location: window.location.hash,
    whiteboard: whiteboard,
    uuid: window.name
  };

  var messageContainer = document
    .getElementById("chatlog-" + whiteboard)
    .querySelector(".messageContainer");

  var element = renderMessage(messageContainer, message, true);

  linkify([element.querySelector(".message")]);

  messageContainer.scrollTop = messageContainer.scrollHeight;

  ss.rpc("iwb.sendMessage", message, function(err) {
    if (err) {
      console.log(err);
      element.classList.add("failed");
      // TODO show notification of failed sending with button to resend and mark message as not sent
      return;
    }
    element.classList.remove("pending");
  });
}

var whiteboardUsers = {};
function userCreator(map, name) {
  if (map.users[name]) {
    return map;
  }
  var div = document.createElement("div");
  div.textContent = name;
  div.className = "userItem";
  var user = map.users[name] = { name: name, div: div };
  div.onclick = function() {
    if (user.pos) {
      window.location = user.pos;
    }
  };
  map.userListDiv.appendChild(div);
  return map;
}

function updateCount(wb) {
  wb = whiteboardUsers[wb];
  if (!wb) return;
  var count = Object.keys(wb.users).length;
  wb.userCount.textContent = count === 1
    ? "Only you online"
    : count + " Users online";
}

var re = /(@(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/))?((?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+)/;
var chatLogs = document.getElementById("chatLogs");

function chatTemplate(data) {
  var chatlogId = data.chatlogId,
    whiteboardOwner = data.whiteboardOwner,
    chatlogDisplayName = data.chatlogDisplayName,
    chatlogName = data.chatlogName,
    owner = data.owner;

  return '<div class="chatlog" id="chatlog-' +
    chatlogId +
    '">' +
    '<div class="chatlogHeader">' +
    '<div class="whiteboardOwner">' +
    '<span style="font-size:10px">Owner</span><br>' +
    whiteboardOwner +
    "</div>" +
    '<div class="chatlogName">' +
    '<span style="font-size:10px">Whiteboard</span><br>' +
    chatlogDisplayName +
    "</div>" +
    '<div class="onlineUsers">' +
    '<span class="userCount">? User(s) online</span>' +
    '<div class="userList" style="display: none"></div>' +
    "</div>" +
    (owner
      ? '<button class="sharingSettingsButton whiteButton">Share</button>'
      : "") +
    "</div>" +
    '<div class="messageContainer scrollbarStyle1' +
    (owner ? " sharedChatContainer" : "") +
    '"></div>' +
    '<div class="chatField">' +
    '<textarea id="' +
    chatlogName +
    '-messageField" class="messageField" tabindex="1"></textarea>' +
    '<a id="' +
    chatlogName +
    '-submitMessageButton" class="submitMessageButton" href="#" tabindex="2" data-fieldId="' +
    chatlogName +
    '"><i class="icon-ok-circled"></i></a>' +
    "</div>" +
    "</div>";
}

function initChat(whiteboard) {
  var isOwner = whiteboard &&
    (window.loggedInUserIsOwner(whiteboard) ||
      window.userIsAdminOfCurrentWhiteboard(whiteboard));

  var comps = re.exec(whiteboard);
  var whiteboardName = comps[2];
  var owner = comps[1];
  if (owner) {
    owner = owner.substring(1, owner.length - 1);
  } else {
    owner = "Public";
  }

  var currentChatLog = htmlToElement(
    chatTemplate({
      chatlogId: whiteboard,
      chatlogName: whiteboard,
      chatlogDisplayName: (
        whiteboard === "_global"
          ? "Global whiteboard"
          : decodeURIComponent(whiteboardName)
      ),
      whiteboardOwner: owner,
      owner: isOwner
    })
  );

  chatLogs.appendChild(currentChatLog);

  document.getElementById(whiteboard + "-submitMessageButton").onclick = send;

  var userCount = currentChatLog.querySelector(".userCount");

  var userList = currentChatLog.querySelector(".userList");

  userCount.onclick = function() {
    userList.style.display = userList.style.display === "" ? "none" : "";
  };

  var wb = whiteboardUsers[whiteboard] = {
    userListDiv: userList,
    userCount: userCount,
    users: {}
  };

  return Promise.all([
    ss.rpc("whiteboards.getOnlineUsers", whiteboard).then(function(res) {
      res.reduce(userCreator, wb);
      updateCount(whiteboard);
    }),
    ss.rpc("iwb.getChatlog", whiteboard, 0).then(function(messages) {
      if (!messages) {
        console.log(arguments);
        return;
      }

      var messageContainer = currentChatLog.querySelector(".messageContainer");

      messageContainer.onclick = clickHandler;

      for (var i = messages.length - 1; i >= 0; i--) {
        renderMessage(messageContainer, messages[i]);
      }

      linkify(messageContainer.querySelectorAll(".message"));

      messageContainer.scrollTop = messageContainer.scrollHeight;

      currentChatLog.display = "";
    })
  ]);
}

ss.event.on("newMessage", function(message) {
  if (message.uuid === window.name) {
    return;
  }

  var messageContainer = document
    .getElementById("chatlog-" + message.whiteboard)
    .querySelector(".messageContainer");

  var element = renderMessage(messageContainer, message);

  linkify([element.querySelector(".message")]);

  messageContainer.scrollTop = messageContainer.scrollHeight;
});

ss.event.on("newPos", function(newPos, channel) {
  var wb = whiteboardUsers[channel];
  var user = wb && wb.users[newPos.user];
  if (!user) return;
  user.pos = newPos.url;
  user.offset = newPos.offset;
});
ss.event.on("sub", function(sub, channel) {
  var wb = whiteboardUsers[channel];
  if (!wb) return;
  var user = wb.users[sub.user];
  if (!user) {
    userCreator(wb, sub.user);
  }
  updateCount(channel);
});
ss.event.on("unsub", function(unsub, channel) {
  var wb = whiteboardUsers[channel];
  var user = wb && wb.users[unsub.user];
  if (!user) return;
  delete whiteboardUsers[channel][unsub.user];
  user.div.parentNode.removeChild(user.div);
  delete user.div;
  updateCount(channel);
});

var chat = document.getElementById("chat").style;

document.getElementById("hideChatButton").onclick = function() {
  chat.display = "none";
};

document.getElementById("showChatButton").onclick = function() {
  chat.display = "";
  setTimeout(function() {
    var messageContainer = document
      .getElementById("chatlog-" + window.whiteboard)
      .querySelector(".messageContainer");

    messageContainer.scrollTop = messageContainer.scrollHeight;
  });
};

// Keyboard (enter / return) behaviour
document.onkeypress = function(e) {
  switch (e.which) {
    case 13:
      // return-key
      if (document.activeElement.className === "messageField") {
        send();

        if (document.activeElement.value.length === 0) {
          return false;
        }
      }
      break;

    case 9:
      // tab
      break;

    default:
      break;
  }
  return true;
};

module.exports = initChat;
