var _            = require("underscore");
var helpers      = require("infrastructure/lib/helpers"); 
var Controller   = require("infrastructure/lib/client/Controller");
var Router       = require("infrastructure/lib/client/Router");

/*
  // Every controller can:
  {

    data: {...},  // attach data to main data namespace
    
    routes: {
      route_name: "method" or ["method", "method_2"],
    },

    observe: {
      dataPath: "method" or ["method", "method_2"],
    },

    events: {
      event_name: "method" or ["method", "method_2"],
    },

    config: "config.path" or { ... }

  }
*/

module.exports = Controller.extend("BaseRactiveAppController", {

  init: function(options, cb){
    var self = this;
    if(!document.body){
      window.onload = function(){
        self.init(options, cb);
      }
      return;
    }
    var app_config = {};
    if(this.config) app_config = helpers.resolve(options.config, this.config);

    this.options  = options;
    this.config   = options.config;
    this.settings = options.settings;

    this.setupRouter(options);

    helpers.chain([

      function(cb){
        if(this.Layout){
          var container = config.container;
          var element;
          if(!container) element = document.body;
          else           element = document.querySelector(container);
          var self = this;
          this.layout = new (this.Layout)({
            data: options.data,
            el:   element,
            onrender: function(){ self.layout = this; cb(); }
          });

        }
        else cb();  
      },

      function(cb){ this.setupControllers(cb); },

      function(cb){
        this.router.bindRoutes(this.routes);
        this.router.startHistory();
        this.trigger("ready");
        cb();
      }

    ])(cb, this);

  },

  setupRouter: function(options){
    this.router = new Router(options.routes);
  },

  setupControllers: function(cb){
    var self       = this;
    var App        = this.options.App;
    var observers  = [];
    var data       = this.options.data;
    var config     = this.config;

    this.routes && this.bindRoutes(this);

    if(this.data) _.extend(data, this.data );

    var controllerNames = _.without(_.keys(App.Controllers), "AppController");
    controllerNames = _.sortBy(controllerNames, function(controllerName){
      return typeof App.Controllers[controllerName].prototype.initOrder === "number"
        ? App.Controllers[controllerName].prototype.initOrder
        : controllerNames.length;
    });
    var initChain = controllerNames.map(function(controllerName){
      var controllerPrototype = App.Controllers[controllerName];

      if(controllerPrototype.prototype.config){
        if(_.isString(controllerPrototype.prototype.config)){
          controllerPrototype.prototype.config = helpers.resolve(config, controllerPrototype.prototype.config);
        }
      }

      if(controllerPrototype.prototype.data) self.set(controllerPrototype.prototype.data );
      var controller = self[controllerName] = new controllerPrototype();
      controller.routes && controller.bindRoutes(self);
      controller.app = self;
      if(controller.observe && self.bindObserver){
        observers.push(controller);
      }
      return controller;
    }).map(function(controller){
      if(!controller.init || controller.init.length!=2) return function(cb){
        controller.init.call(controller, self.options);
        cb();
      }
      return function(cb){
        controller.init.call(controller, self.options, cb );
      }
    });

    helpers.chain(initChain)(function(err){
      if(err) return cb(err);
      if(observers.length > 0){
        observers.forEach(function(observer){
          self.bindObserver(observer);
        });
      }
      cb();
    });
  },

  bindObserver: function(observer){
    for(var key in observer.observe){
      if(typeof observer[observer.observe[key]] === "function"){
        this.observe( key, observer[observer.observe[key]].bind(observer) );
      }
    }
  },

  get:          function(){ return   this.layout.get          .apply(this.layout, arguments);              },
  fetch:        function(){ return   this.layout.fetch        .apply(this.layout, arguments);              },
  set:          function(){          this.layout.set          .apply(this.layout, arguments); return this; },
  observe:      function(){          this.layout.observe      .apply(this.layout, arguments); return this; },
  toggle:       function(){          this.layout.toggle       .apply(this.layout, arguments); return this; },
  radioToggle:  function(){          this.layout.radioToggle  .apply(this.layout, arguments); return this; },
  reset:        function(path, val){ this.layout.set(path, null); this.layout.set(path, val);              },
  navigate:     function(path){      this.router.navigate(path.replace(/^\//, ""), true ) },


});
