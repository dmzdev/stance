var dmz =
   { ui:
      { loader: require('dmz/ui/uiLoader')
      , layout: require("dmz/ui/layout")
      , label: require("dmz/ui/label")
      , graph: require("dmz/ui/graph")
      }
   , util: require("dmz/types/util")
   , resources: require("dmz/runtime/resources")
   , sys: require("sys")
   }
  , toDate = dmz.util.timeStampToDate
  , PostItem
  , _self = dmz.sys.createSelf("PostItem-" + dmz.sys.createUUID())
  , _cache = []
  ;

PostItem = function () {

   this.handle = 0;

   this.form = dmz.ui.loader.load("PostItem");
   this.avatar = this.form.lookup("avatarLabel");
   this.postedBy = this.form.lookup("postedByLabel");
   this.postedAt = this.form.lookup("postedAtLabel");
   this.message = this.form.lookup("messageLabel");

   this.listFrame = this.form.lookup("commentListFrame");
   this.listFrame.hide();

   this.addFrame = this.form.lookup("commentAddFrame");
   this.addFrame.hide();

   this.listLayout = dmz.ui.layout.createVBoxLayout();
   this.addFrame.layout(this.listLayout, true);

   this.list = [];

   this.comment = this.form.lookup("commentTextEdit")

   var that = this;

   this.form.observe(_self, "commentCountLabel", "linkActivated", function (link) {

      var visible = that.listFrame.visible();
      that.listFrame.visible(!visible);
   });

   this.form.observe(_self, "commentAddLabel", "linkActivated", function (link) {

      var visible = that.addFrame.visible();
      that.addFrame.visible(!visible);
   });
};

exports.isTypeOf = function (value) {

   return PostItem.prototype.isPrototypeOf(value) ? value : undefined;
};

exports.create = function (params) {

   var result = new PostItem();
   if (arguments.length > 0) { result.set.apply(result, params); }
   return result;
};

//PostItem.prototype.create = exports.create;

//PostItem.prototype.toString = function () {

//   return "PostItem";
//};

PostItem.prototype.handle = function () {

   return this.handle;
};

PostItem.prototype.widget = function () {

   return this.form;
};

PostItem.prototype.set = function (params) {

   if (params) {

      if (params.handle) { this.handle = params.handle; }
      if (params.by) { this.postedBy.text(params.by); }
      if (params.at) { this.postedAt.text(params.at); }
      if (params.message) { this.message.text(params.message); }

      if (params.avatar) {

      }
   }
};

PostItem.prototype.reset = function () {

   this.handle = 0;
   this.postedBy.clear();
   this.postedAt.clear();
   this.message.clear();
   this.avatar.clear();
}

PostItem.prototype.addComment = function (comment) {

   var comment = _cache.pop();

   if (!comment) {

      comment = dmz.ui.loader.load("CommentItem");
   }
}

PostItem.prototype.onSubmitComment = function (self, func) {

   var that = this;

   this.form.observe(self, "commentSubmitButton", "clicked", function () {

      func(that.handle, that.comment.text());
      that.comment.clear();
      that.addFrame.hide();
   });
};
