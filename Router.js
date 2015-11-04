// Backbone router needs jQuery to select 'window' and to attach 2 events to it
// Creating simple mockup

var Backbone               = require("backbone");
var Class                  = require("infrastructure/lib/Class");

if(!Backbone.$){
  var jQueryMockup = {
    on: function(event, handler){
      this.el.addEventListener(event, handler);
      return jQueryMockup;
    },
    off: function(event, handler){
      this.el.removeEventListener(event, handler);
      return jQueryMockup;
    }
  };

  Backbone.$ = function(el){
    jQueryMockup.el = el;
    return jQueryMockup;
  }  
}

function getLink(elem){
  if(elem.nodeName === "A") return elem;
  else if(!elem.parentNode) return null;
  else return getLink(elem.parentNode);
}

function getHref(elem, rootPath){
  if(!elem || !elem.href) return false;
  var href = elem.getAttribute("href");
  if( href.indexOf( "/" ) === 0 ){
    if( href.indexOf(rootPath) === 0 ) return href;
    else return false;
  }
  else if( href.indexOf( "javascript:" ) === -1 ) return rootPath + "/" + href;
  return false;
}

var BaseRouter = Backbone.Router.extend({
  
  initialize: function(routes, options){

    this.routes = routes;
    this.options = options || {};
    var pushState = this.options.pushState;

    var router  = this;
    var rootPath = document.getElementsByTagName("base")[0].href.replace(window.location.origin, "");
    this.rootPath = rootPath;
    if(pushState){
      document.body.addEventListener("click", function(e){
        var href = getHref(getLink(e.target), rootPath);
        if(href) {
          e.preventDefault();
          router.navigate(href.replace(/^\//, ""), true);
        }
      });
    }
    else{
      document.body.addEventListener("click", function(e){
        var href = getHref(getLink(e.target), rootPath);
        if(href) {
          if(href.indexOf(rootPath) === 0) href = href.replace(rootPath, "").replace(/^\//, ""); // strip rootPath from href
          e.preventDefault();
          router.navigate(href, true);
        }
      });
    }
  },

  startHistory: function(){
    Backbone.history.start({pushState: this.options.pushState});
  },

  back: function(n){
    Backbone.history.back(n || -1);
  },

  bindRoutes: function(){
    var rootPath = this.rootPath;
    var rootPrefix;
    if(this.options.pushState){
      rootPrefix = rootPath.replace(/^\//, "");
    }
    else rootPrefix = "";

    for(var routePath in this.routes){
      var routeName = this.routes[routePath];
      if(Array.isArray(routeName)){
        for(var i=0;i<routeName.length;i++){
          this.route((rootPrefix+routePath).replace(/^\/+/,"").replace(/\/+$/,"").replace(/\/+/,"/"), routeName[i]);
        }
      }
      else{
        this.route((rootPrefix+routePath).replace(/^\/+/,"").replace(/\/+$/,"").replace(/\/+/,"/"), routeName);
      }
    }
  }

});

BaseRouter.__className = "Router";
BaseRouter.extend      = Class.extend;
module.exports         = BaseRouter;



