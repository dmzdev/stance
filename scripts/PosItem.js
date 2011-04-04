var util = require("dmz/types/util")
  , graph = require("dmz/ui/graph")
  , resources = require("dmz/runtime/resources")
  , PostItem
  ;

PostItem = function (params) {

   var postedBy = params && params.postedBy || "Anonymous"
     , postedAt = params && params.postedAt || new Date ()
     , message = params && params.message
     , avatarBoxFile = resources.findFile("AvatarBox")
     , avatarDefaultFile = resources.findFile("AvatarDefault")
     ;

//   if (scene) { this.bg = scene.addRect(0, 0, 200, 100); }
//   else { this.bg = graph.createRectItem(0, 0, 300, 100); }
   this.bg = graph.createRectItem(0, 0, 400, 300);
   this.bg.pos(-145, 0);

   var pix = graph.createPixmap(58, 68);
   pix.load(avatarBoxFile);
   this.avatarBox = graph.createPixmapItem(pix, this.bg);
   this.avatarBox.pos(4, 4);

//   this.avatar = graph.createPixmapItem(avatarDefaultFile, this.avatarBox);
//   this.avatar.pos(4, 4);

   postedAt = postedAt.toString ("MM/dd/yyyy");
   this.postedBy = graph.createTextItem("Posted by: " + postedBy + " at: " + postedAt, this.bg);
   this.postedBy.pos(70, 4);

   message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere risus eu nisi imperdiet pellentesque. Duis a turpis nec ante euismod hendrerit non nec odio. Quisque vel nunc vel massa tempor condimentum. Proin nisl nibh, placerat non lacinia sed, luctus ullamcorper lorem. Nulla massa dui, condimentum ac blandit dapibus, aliquam sit amet nunc. Vestibulum lacus."

   this.message = graph.createTextItem(message, this.bg);
   this.message.pos(70, 40);
};

exports.isTypeOf = function (value) {

   return PostItem.prototype.isPrototypeOf(value) ? value : undefined;
};

exports.create = function (params) {

   var result = new PostItem(params);
//   if (arguments.length > 0) { result.set.apply(result, arguments); }
   return result;
};

PostItem.prototype.create = exports.create;

//PostItem.prototype.toString = function () {

//   return "PostItem";
//};

PostItem.prototype.item = function () {

   return this.bg;
};

PostItem.prototype.pos = function () {

   return this.pos (argument);
};
