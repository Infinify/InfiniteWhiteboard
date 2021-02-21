const { app, BrowserWindow } = require("electron");
//const getPort = require("get-port");
const boardCache = require("./boardCache.js");
const server = require("./server");
require("electron-window-manager");

let url;
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(url);
}

app.on("ready", function () {
  //getPort({ port: 3000 }).then((port) => {
  const port = 3000;
  url = "http://localhost:" + port;
  boardCache
    .init()
    .then(() => server(0, port))
    .then(() => createWindow());
  //});
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
