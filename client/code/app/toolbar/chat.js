function clickHandler(e) {
  var msgDiv = e.currentTarget;
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
    case "icon-target-3 target":
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

function renderMessage(messageContainer, message, pending) {
  var tm = new Date(
    message.timemachine || message.timestamp || message.timeStamp
  );
  var d = new Date(message.timeStamp);
  var sender = message.sender;
  var messageElement = htmlToElement(
    ss.tmpl["chat-message"].render({
      time: d.toString("d.M.yyyy hh:mm"),
      timemachine: tm.toString("d.M.yyyy hh:mm"),
      message: message.message,
      href: message.location,
      user: sender
    })
  );

  messageContainer.appendChild(messageElement);

  messageElement.querySelector(".location").onclick = clickHandler;
  messageElement.querySelector(".user").onclick = clickHandler;
  messageElement.querySelector(".time").onclick = clickHandler;

  $(messageElement.querySelector(".message")).linkify();

  messageElement.dataset["timemachine"] = +tm;

  if (
    sender === window.userObject.username ||
      sender === window.userObject.anonymous
  ) {
    messageElement.classList.add("sent");
    if (pending) {
      messageElement.classList.add("pending");
    }
  } else {
    messageElement.classList.add("recieved");
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

  var message = {
    message: val,
    timeStamp: new Date(),
    timemachine: window.timestamp,
    sender: window.userObject.username || window.userObject.anonymous,
    location: window.location.hash,
    whiteboard: whiteboard,
    uuid: window.name
  };

  var messageContainer = document
    .getElementById("chatlog-" + message.whiteboard)
    .querySelector(".messageContainer");

  var element = renderMessage(messageContainer, message, true);

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
  div.class = "userItem";
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

function initChat(whiteboard) {
  var template = whiteboard &&
    (window.loggedInUserIsOwner(whiteboard) ||
      window.userIsAdminOfCurrentWhiteboard(whiteboard))
    ? "chat-chat_owner"
    : "chat-chat";

  var comps = re.exec(whiteboard);
  var whiteboardName = comps[2];
  var owner = comps[1];
  if (owner) {
    owner = owner.substring(1, owner.length - 1);
  } else {
    owner = "Public";
  }

  chatLogs.appendChild(
    htmlToElement(
      ss.tmpl[template].render({
        chatlogId: whiteboard,
        chatlogName: whiteboard,
        chatlogDisplayName: (
          whiteboard === "_global"
            ? "Global whiteboard"
            : decodeURIComponent(whiteboardName)
        ),
        whiteboardOwner: owner,
        submitMessageIcon: "icon-ok-circled"
      })
    )
  );

  document.getElementById(
    window.whiteboard + "-submitMessageButton"
  ).onclick = send;

  var currentChatLog = document.getElementById("chatlog-" + whiteboard);

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

  ss.rpc("whiteboards.getOnlineUsers", whiteboard, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      res.reduce(userCreator, wb);
      updateCount(window.whiteboard);
    }
  });

  ss.rpc("iwb.getChatlog", whiteboard, 0, function(err, messages) {
    if (err || !messages) {
      console.log(arguments);
      return;
    }

    var messageContainer = document
      .getElementById("chatlog-" + whiteboard)
      .querySelector(".messageContainer");

    for (var i = messages.length - 1; i >= 0; i--) {
      renderMessage(messageContainer, messages[i]);
    }

    messageContainer.scrollTop = messageContainer.scrollHeight;

    currentChatLog.display = "";
  });
}

ss.event.on("newMessage", function(message) {
  if (message.uuid === window.name) {
    return;
  }

  var messageContainer = document
    .getElementById("chatlog-" + message.whiteboard)
    .querySelector(".messageContainer");

  renderMessage(messageContainer, message);

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
