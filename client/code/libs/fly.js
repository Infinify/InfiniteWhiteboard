var interval, po = window.org.polymaps, currentTarget;

window.stopFlying = function () {
    if (interval) {
        clearInterval(interval);
        interval = 0;
    }
};

function animateCenterZoom(map, l1, z1) {

    var nextTarget = '#' + z1 + '/' + l1.lon + '/' + l1.lat;

    var start = po.map.locationCoordinate(map.center()),
        end   = po.map.locationCoordinate(l1);

    var c0 = { x: start.column, y: start.row },
        c1 = { x: end.column, y: end.row };

    // how much world can we see at zoom 0?
    var w0 = visibleWorld(map);

    // z1 is ds times bigger than this zoom:
    var ds = Math.pow(2, z1 - map.zoom());

    // so how much world at zoom z1?
    var w1 = w0 / ds;

    if (interval) {
        clearInterval(interval);
        interval = 0;
    }
    
    if (currentTarget === nextTarget) {
        window.location.href = currentTarget;
        return;
    }
    
    currentTarget = nextTarget;
    // GO!
    try {
        animateStep(map, c0, w0, c1, w1);
    } catch (e) {
        window.location.href = currentTarget;
        clearInterval(interval);
        interval = 0;
    }
}

function visibleWorld(map) {
    // how much world can we see at zoom 0?
    var tileCenter = po.map.locationCoordinate(map.center());
    var topLeft = map.pointCoordinate(tileCenter, { x:0, y:0 });
    var bottomRight = map.pointCoordinate(tileCenter, map.size())
    var correction = Math.pow(2, topLeft.zoom);
    topLeft.column /= correction;
    bottomRight.column /= correction;
    topLeft.row /= correction;
    bottomRight.row /= correction;
    topLeft.zoom = bottomRight.zoom = 0;
    return Math.max(bottomRight.column-topLeft.column, bottomRight.row-topLeft.row);
}

/*

 From "Smooth and efficient zooming and panning"
 by Jarke J. van Wijk and Wim A.A. Nuij

 You only need to understand section 3 (equations 1 through 5)
 and then you can skip to equation 9, implemented below:

 */

function sq(n) { return n*n; }
function dist(a,b) { return Math.sqrt(sq(b.x-a.x)+sq(b.y-a.y)); }
function lerp1(a,b,p) { return a + ((b-a) * p) }
function lerp2(a,b,p) { return { x: lerp1(a.x,b.x,p), y: lerp1(a.y,b.y,p) }; }
function cosh(x) { return (Math.exp(x) + Math.exp(-x)) / 2; }
function sinh(x) { return (Math.exp(x) - Math.exp(-x)) / 2; }
function tanh(x) { return sinh(x) / cosh(x); }

function animateStep(map,c0,w0,c1,w1,V,rho) {

    // see section 6 for user testing to derive these values (they can be tuned)
    if (V === undefined)     V = 0.7;  // section 6 suggests 0.9
    if (rho === undefined) rho = 1.42; // section 6 suggests 1.42

    // simple interpolation of positions will be fine:
    var u0 = 0,
        u1 = dist(c0,c1);

    // i = 0 or 1
    function b(i) {
        var n = sq(w1) - sq(w0) + ((i ? -1 : 1) * Math.pow(rho,4) * sq(u1-u0));
        var d = 2 * (i ? w1 : w0) * sq(rho) * (u1-u0);
        return n / d;
    }

    // give this a b(0) or b(1)
    function r(b) {
        return Math.log(-b + Math.sqrt(sq(b)+1));
    }

    var r0 = r(b(0)),
        r1 = r(b(1)),
        S = (r1-r0) / rho; // "distance"

    function u(s) {
        var a = w0/sq(rho),
            b = a * cosh(r0) * tanh(rho*s + r0),
            c = a * sinh(r0);
        return b - c + u0;
    }

    function w(s) {
        return w0 * cosh(r0) / cosh(rho*s + r0);
    }

    // special case
    if (Math.abs(u0-u1) < 0.000001) {
        if (Math.abs(w0-w1) < 0.000001) return;

        var k = w1 < w0 ? -1 : 1;
        S = Math.abs(Math.log(w1/w0)) / rho;
        u = function(s) {
            return u0;
        }
        w = function(s) {
            return w0 * Math.exp(k * rho * s);
        }
    }

    var t0 = Date.now();
    interval = window.interval = setInterval(function() {
        var t1 = Date.now();
        var t = (t1 - t0) / 1000.0;
        var s = V * t;
        if (s > S) {
            s = S;
            clearInterval(interval);
            interval = 0;
        }
        var us = u(s);
        var pos = lerp2(c0,c1,(us-u0)/(u1-u0));
        applyPos(map, pos, w(s));
    }, 40);

}

function applyPos(map,pos,w) {
    var w0 = visibleWorld(map), // how much world can we see at zoom 0?
        size = map.size(),
        z = Math.log(w0/w) / Math.LN2,
        p = { x: size.x / 2, y: size.y / 2 },
        l  = po.map.coordinateLocation({ row: pos.y, column: pos.x, zoom: 0 });
    if (!isFinite(z) || !isFinite(p.x) || !isFinite(p.y) || !isFinite(pos.y) || !isFinite(pos.x)) {
        window.location.href = currentTarget;
        clearInterval(interval);
        interval = 0;
        return;
    }
    map.zoomBy(z, p, l);
}
