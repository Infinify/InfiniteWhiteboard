/* encoding: utf-8

 ****  linkify plugin for jQuery - automatically finds and changes URLs in text content into proper hyperlinks  ****

 Version: 1.0

 Copyright (c) 2009
 Már Örlygsson  (http://mar.anomy.net/)  &
 Hugsmiðjan ehf. (http://www.hugsmidjan.is)

 Dual licensed under a MIT licence (http://en.wikipedia.org/wiki/MIT_License)
 and GPL 2.0 or above (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

 -----------------------------------------------------------------------------

 Demo and Qunit-tests:
 * <./jquery.linkify-1.0-demo.html>
 * <./jquery.linkify-1.0-test.html>

 Documentation:
 * ...

 Get updates from:
 * <http://github.com/maranomynet/linkify/>
 * <git://github.com/maranomynet/linkify.git>

 -----------------------------------------------------------------------------

 Requires:
 * jQuery (1.2.6 or later)

 Usage:

 jQuery('.articlebody').linkify();

 // adding plugins:
 jQuery.extend( jQuery.fn.linkify.plugins, {
 name1: {
 re:   RegExp
 tmpl: String/Function
 },
 name2: function(html){ return html; }
 });

 // Uses all plugins by default:
 jQuery('.articlebody').linkify();

 // Use only certain plugins:
 jQuery('.articlebody').linkify( 'name1,name2' );
 jQuery('.articlebody').linkify({  use: 'name1,name2'  });
 jQuery('.articlebody').linkify({  use: ['name1','name2']  });

 // Explicitly use all plugins:
 jQuery('.articlebody').linkify('*');
 jQuery('.articlebody').linkify({  use: '*'  });
 jQuery('.articlebody').linkify({  use: ['*']  });

 // Use no plugins:
 jQuery('.articlebody').linkify('');
 jQuery('.articlebody').linkify({  use: ''  });
 jQuery('.articlebody').linkify({  use: []  });
 jQuery('.articlebody').linkify({  use: ['']  });

 // Perfmorm actions on all newly created links:
 jQuery('.articlebody').linkify( function (links){ links.addClass('linkified'); } );
 jQuery('.articlebody').linkify({  handleLinks: function (links){ links.addClass('linkified'); }  });

 */
(function () {
  function type(obj) {
    return Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, '$1').toLowerCase();
  }
  var parseHTML = function(str) {
    var tmp = document.implementation.createHTMLDocument();
    tmp.body.innerHTML = str;
    return tmp.body;
  };
  function linkify(nodelist, cfg) {
    var cfgType = type(cfg);
    if (cfgType !== 'object') {
      cfg = {
        use: (cfgType === 'string') ? cfg : undefined,
        handleLinks: (cfgType === 'function') ? cfg : arguments[1]
      };
    }
    var use = cfg.use,
      allPlugins = linkify.plugins || {},
      plugins = [],
      tmpCont = null,
      newLinks = [],
      callback = cfg.handleLinks;
    if (use === undefined)
    {
      for (var name in allPlugins) {
        if (allPlugins.hasOwnProperty(name)) {
          plugins.push(allPlugins[name]);
        }
      }
    }
    else {
      use = Array.isArray(use) ? use : use.trim().split(/ *, */);
      var pluginDefinition,
        pluginName;
      for (var i = 0, ul = use.length; i < ul; i++) {
        pluginName = use[i];
        pluginDefinition = allPlugins[pluginName];
        if (pluginDefinition) {
          plugins.push(pluginDefinition);
        }
      }
    }
    for (var n = 0; n < nodelist.length; ++n) {
      var item = nodelist[n];
      var childNodes = item.childNodes,
        j = childNodes.length;
      while (j--) {
        var node = childNodes[j];
        if (node.nodeType === 3) {
          var html = node.nodeValue;
          if (html.length > 1 && /\S/.test(html)) {
            var htmlChanged = false,
              preHtml,
              parent,
              ref;
            tmpCont = tmpCont || document.implementation.createHTMLDocument().body;
            tmpCont.innerHTML = '';
            tmpCont.appendChild(node.cloneNode(false));
            var tmpContNodes = tmpCont.childNodes;

            for (var k = 0, plugin; (plugin = plugins[k]); k++) {
              var l = tmpContNodes.length,
                tmpNode;
              while (l--) {
                tmpNode = tmpContNodes[l];
                if (tmpNode.nodeType == 3) {
                  html = tmpNode.nodeValue;
                  if (html.length > 1 && /\S/.test(html)) {
                    preHtml = html;
                    html = html
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;');
                    html = type(plugin) === 'function' ?
                      plugin(html) :
                      html.replace(plugin.re, plugin.tmpl);
                    if (preHtml !== html) {
                      htmlChanged = true;
                      ref = tmpNode.nextElementSibling;
                      parent = tmpNode.parentNode;
                      parent.removeChild(tmpNode);
                      [].slice.call(parseHTML(html).children).forEach(function (child) {
                        parent.insertBefore(child, ref);
                      });
                    }
                  }
                }
              }
            }
            html = tmpCont.innerHTML;
            if (callback) {
              html = parseHTML(html);
              newLinks = newLinks.concat([].slice.call(html.querySelectorAll('a')).reverse());
            }
            if (htmlChanged) {
              ref = node.nextElementSibling;
              parent = node.parentNode;
              parent.removeChild(node);
              [].slice.call(parseHTML(html).children).forEach(function (child) {
                parent.insertBefore(child, ref);
              });
            }
          }
        }
        else if (node.nodeType == 1 && !/^(a|button|textarea)$/i.test(node.tagName)) {
          arguments.callee.call(node);
        }
      }
    }
    callback && callback(newLinks.reverse());
    return nodelist;
  }

  linkify.plugins = {
    // default links plugin
    linkifier: function (html) {
      var noProtocolUrl = /(^|["'(\s]|&lt;)(www\..+?\..+?)((?:[:?]|\.+)?(?=(?:\s|$)|&gt;|[)"',]))/g,
        httpOrMailtoUrl = /(^|["'(\s]|&lt;)((?:(?:https?|ftp):\/\/|mailto:).+?)((?:[:?]|\.+)?(?=(?:\s|$)|&gt;|[)"',]))/g;
      return html
        .replace(noProtocolUrl, '$1<a href="<``>://$2">$2</a>$3')  // NOTE: we escape `"http` as `"<``>` to make sure `httpOrMailtoUrl` below doesn't find it as a false-positive
        .replace(httpOrMailtoUrl, '$1<a href="$2">$2</a>$3')
        .replace(/"<``>/g, '"http');  // reinsert `"http`
    },
    // default mailto: plugin
    mailto: {
      re: /(^|["'(\s]|&lt;)([a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?=(\s|$)|&gt;|[)"',])/gi,
      tmpl: '$1<a href="mailto:$2">$2</a>$3'
    }
  };

  window.linkify = linkify;
})();