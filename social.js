function bot(url, name) {
  const d = +new Date();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="og:url" content="https://iws.nu${url}"/>
  <meta property="og:title" content="Infinite Whiteboard"/>
  <meta property="og:site_name" content="Infinite Whiteboard"/>
  <meta property="og:description" content="${name}"/>
  <meta property="og:image" content="http://iws.nu/_screen${url}?d=${d}"/>
  <meta property="og:image:secure_url" content="https://iws.nu/_screen${url}?d=${d}"/>
  <meta property="og:image:width" content="1920"/>
  <meta property="og:image:height" content="1013"/>
  <meta property="og:type" content="website"/>
  <meta property="fb:app_id" content="388710587926740"/>
  <meta name="twitter:card" content="Infinite Whiteboard"/>
</head>
<body></body>`;
}

module.exports = (req, res, next) => {
  if (
    /^(facebookexternalhit)|(Facebot)|(Twitterbot)|(Pinterest)/gi.test(
      req.headers["user-agent"]
    )
  ) {
    res.end(bot(req.url, req.url.slice(1)));
  } else {
    next();
  }
};
