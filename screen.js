const Chrome = require("chrome-remote-interface");

module.exports = (req, res) => {
  Chrome.New((err, tab) => {
    Chrome(chromeInstance => {
      const { Page, DOMStorage } = chromeInstance;

      let once = false;
      const now = Date.now();
      function takeScreenshot() {
        if (once) return;
        once = true;
        setTimeout(
          () => {
            Page
              .captureScreenshot()
              .then(({ data }) => {
                const img = new Buffer(data, "base64");

                res.writeHead(200, {
                  "Content-Type": "image/png",
                  "Content-Length": img.length
                });

                res.end(img);
                let endTime = Date.now();
                console.log("success in: " + (+endTime - (+now)) + "ms");

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
          },
          1000
        );
      }

      DOMStorage.domStorageItemUpdated(takeScreenshot);
      DOMStorage.domStorageItemAdded(takeScreenshot);
      DOMStorage.enable();
      Page.enable();

      chromeInstance.once("ready", () => {
        Page.navigate({ url: "https://iws.nu" + req.url });
      });
    });
  });
};
