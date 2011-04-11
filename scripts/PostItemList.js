var dmz =
    { util: require("dmz/types/util")
    , graph: require("dmz/ui/graph")
    }
  // Variables

  // Functions
  , PostItemList
  ;

PostItemList = function (parent) {

   this.list = new Array();

   this.bg = dmz.graph.createRectItem(parent);
};

exports.isTypeOf = function (value) {

   return PostItemList.prototype.isPrototypeOf(value) ? value : undefined;
};

exports.create = function (parent) {

   var result = new PostItemList(parent);
//   if (arguments.length > 0) { result.set.apply(result, arguments); }
   return result;
};

PostItemList.prototype.create = exports.create;

PostItemList.prototype.item = function () {

   return this.bg;
};

PostItemList.prototype.pos = function () {

   return this.bg.pos (argument);
};

PostItemList.prototype.postsInserted = function (index, count) {

   var point = [0, 0];

   this.list.push(thePost);

   return (this.list.length - 1);
}
