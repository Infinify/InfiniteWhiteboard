const Chrome = require("chrome-remote-interface");

const origin = "https://iws.nu";

module.exports = (req, res) => {
  Chrome.New((err, tab) => {
    if (err) {
      console.log(err);
      return Chrome.Close(tab);
    }
    Chrome(chromeInstance => {
      const { Page, DOMStorage } = chromeInstance;
      const start = Date.now();

      DOMStorage.domStorageItemAdded(({ storageId, key }) => {
        if (storageId.securityOrigin !== origin || key !== "_screen") return;
        Page.captureScreenshot()
          .then(({ data }) => {
            const img = Buffer.from(data, "base64");

            res.writeHead(200, {
              "Content-Type": "image/png",
              "Content-Length": img.length
            });

            res.end(img);
            let end = Date.now();
            console.log("screenshot: " + (end - start) + "ms");

            return Promise.all([Chrome.Close(tab), chromeInstance.close()]);
          })
          .catch(err => {
            console.log(err);
          });
      });

      DOMStorage.enable();
      Page.enable();

      chromeInstance.once("ready", () => {
        Page.navigate({ url: origin + req.url });
      });
    });
  });
};
