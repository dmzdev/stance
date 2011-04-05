var dmz =
   { ui:
      { loader: require('dmz/ui/uiLoader')
      , layout: require("dmz/ui/layout")
      , label: require("dmz/ui/label")
      , graph: require("dmz/ui/graph")
      }
   , util: require("dmz/types/util")
   , resources: require("dmz/runtime/resources")
   }

  // Variables
  // Functions
  , toDate = dmz.util.timeStampToDate
  , PostItem
  ;

PostItem = function () {

   this.form = dmz.ui.loader.load("PostItem")
   this.avatar = this.form.lookup("avatarLabel")
   this.postedBy = this.form.lookup("postedByLabel")
   this.postedAt = this.form.lookup("postedAtLabel")
   this.message = this.form.lookup("messageLabel")
};

exports.isTypeOf = function (value) {

   return PostItem.prototype.isPrototypeOf(value) ? value : undefined;
};

exports.create = function () {

   var result = new PostItem();
   if (arguments.length > 0) { result.set.apply(result, arguments); }
   return result;
};

PostItem.prototype.create = exports.create;

//PostItem.prototype.toString = function () {

//   return "PostItem";
//};

PostItem.prototype.widget = function () {

   return this.form;
};

PostItem.prototype.set = function (params) {

   var time;

   if (params.avatar) {

   }

   if (params.by) { this.postedBy.text(params.by); }

   if (params.at) {

      if (params.at instanceof Date) { time = params.at; }
      else { time = toDate(params.at); }

      this.postedAt.text(time);
   }

   if (params.message) { this.message.text(params.message); }
};
