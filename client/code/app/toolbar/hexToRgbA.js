module.exports = function hexToRgbA(hex, alpha) {
  if (!/^#[A-Fa-f0-9]{3,6}$/.test(hex)) {
    throw Error("Input must be a rgb color hex string of a # and three or six hex chars after it e.g. #fff or #ffffff");
  }
  var color = parseInt(4 === hex.length ? hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex.substring(1), 16);
  return "rgba(" + [color >> 16 & 255, color >> 8 & 255, color & 255].join() + (alpha ? "," + alpha + ")" : ")");
};