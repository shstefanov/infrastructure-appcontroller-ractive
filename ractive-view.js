var _          = require("underscore");
var Ractive    = require("ractive/ractive.runtime.js" );

var config     = require("config");
Ractive.DEBUG  = config.debug;

module.exports = Ractive.extend({

  data:{
    
    condition: function(condition, val_1, vl_2){
      return condition ? val_1 : (vl_2 || null);
    },

    resolveComponent: function(name, properties){
      
      if(this.partials[name]) return name;

      var component, partial, components = this.__proto__.constructor.components;
      try{
        if(!components[name]) throw new Error("Component not found");
        partial   = { "v":3, "t": [{ "t":7, "e": name } ] };
        this.partials[name]   = partial;
        if(properties) this.bindComponentVars(partial, properties );
      }
      catch(err){
        this.partials[name] = {"v":3,"t":[{"t":7,"e":"p","a":{"class":"alert alert-danger"},"f":["Error: Component '"+name+"'' can't be resolved"]}]};
      }
      return name;
    }

  },

  oninit: function() {
    if(this.initialize) { this.initialize(); }
  },

  bindComponentVars: function(partial, properties){
    partial.t[0].a = _.mapObject(properties, function(val){ return [ { "t":2, "r": val } ]; });
  },

  toggle: function(path){
    var paths = Array.prototype.slice.call(arguments);
    for(var i=0;i<paths.length;i++){
      this.set(paths[i], !this.get(paths[i]));
    }
  },

  fetch: function(obj){
    var result = {};
    for(var key in obj) {
      var target = obj[key];
      if(target.indexOf("*")){
        var parts = target.split(/[.\[]\*[.\]]/);
        var targetObj = this.get(parts[0]);
        if(!target[1]){
          result[key] = targetObj;
        }
        else if(_.isArray(targetObj)){
          result[key] = new Array(targetObj.length);
          for(var i=0;i<targetObj.length;i++){
            result[key][i] = this.get(target.replace("*", i));
          }
        }
        else if(_.isObject(targetObj)){
          result[key] = {};
          for(var targetKey in targetObj){
            result[key][targetKey] = this.get(target.replace("*", targetKey));
          }
        }
        else{
          result[key] = targetObj;
        }
      }
      else{
        result[key] = this.get(target);
      }
    }
    return result;
  },

  radioToggle: function(path){
    var parts      = path.split(".");
    var parentPath = parts.slice(0,-1).join(".");
    var target     = parts.slice(-1).pop();
    var active     = this.get(parentPath+".__active");
    if(active){
      this.toggle(parentPath+"."+active);
    }
    if(target === active){
      this.set(parentPath+".__active", null);
      return this;
    }
    else{
      this.set(parentPath+".__active", target);
      this.toggle(path);
    }
    return this;
  }



});
