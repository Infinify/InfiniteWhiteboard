function bot(url, name) {
  const d = +new Date();
  const img = `https://iws.nu/_screen${url}?d=${d}`;
  name = name || "Global whiteboard";
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta property="og:url" content="https://iws.nu${url}">
<meta property="og:title" content="Infinite Whiteboard">
<meta property="og:site_name" content="Infinite Whiteboard">
<meta property="og:description" content="${name}">
<meta property="og:image" content="http://iws.nu/_screen${url}?d=${d}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:width" content="1920">
<meta property="og:image:height" content="1013">
<meta property="og:type" content="website">
<meta property="fb:app_id" content="388710587926740">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@infinify">
<meta name="twitter:creator" content="@infinify">
<meta name="twitter:title" content="${name}">
<meta name="twitter:description" content="Infinite Whiteboard - The real-time collaboration space">
<meta name="twitter:image:alt" content="Infinite Whiteboard - The real-time collaboration space">
<meta name="twitter:image" content="${img}">
<title>Infinite Whiteboard</title>
</head><body></body>`;
}

module.exports = (req, res, next) => {
  if (
    /^(facebookexternalhit)|(Facebot)|(Twitterbot)|(Pinterest)/gi.test(
      req.headers["user-agent"]
    )
  ) {
    res.writeHead(200, { "content-type": "text/html; charset=UTF-8" });
    res.end(bot(req.url, req.url.slice(1)));
  } else {
    next();
  }
};
