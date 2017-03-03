const Chrome = require("chrome-remote-interface");

const origin = "https://iws.nu";

module.exports = (req, res) => {
  Chrome.New((err, tab) => {
    Chrome(chromeInstance => {
      const { Page, DOMStorage } = chromeInstance;

      const start = Date.now();
      function takeScreenshot({ storageId, key }) {
        if (storageId.securityOrigin !== origin || key !== "_screen") return;
        Page
          .captureScreenshot()
          .then(({ data }) => {
            const img = new Buffer(data, "base64");

            res.writeHead(200, {
              "Content-Type": "image/png",
              "Content-Length": img.length
            });

            res.end(img);
            let end = Date.now();
            console.log("screenshot: " + (end - start) + "ms");

            Chrome.Close(tab).catch(err => {
              console.log(err);
            });

            chromeInstance.close().catch(err => {
              console.log(err);
            });
          })
          .catch(err => {
            console.log(err);
          });
      }

      DOMStorage.domStorageItemAdded(takeScreenshot);
      DOMStorage.enable();
      Page.enable();

      chromeInstance.once("ready", () => {
        Page.navigate({ url: origin + req.url });
      });
    });
  });
};
