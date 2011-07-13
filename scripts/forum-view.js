require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , message: require("dmz/runtime/messaging")
       , resources: require("dmz/runtime/resources")
       , stance: require("stanceConst")
       , time: require("dmz/runtime/time")
       , util: require("dmz/types/util")
       , ui:
          { consts: require('dmz/ui/consts')
          , graph: require("dmz/ui/graph")
          , layout: require("dmz/ui/layout")
          , label: require("dmz/ui/label")
          , loader: require('dmz/ui/uiLoader')
          , messageBox: require("dmz/ui/messageBox")
          , mainWindow: require("dmz/ui/mainWindow")
          }
       , forumView: require("static-forum-view")
       }

   // Object Lists
   , _master = { items: [], posts: [], comments: [], forums: [] }
   , _exports = {}
   , _commentCache = []
   , _postCache = []
   , _postList = []
   , _commentList = []
   , _forumHandle

   // Variables
   , RetData = false
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , IsCurrentWindow = false
   , MaxMessageLength = 500

   // Functions
   , toDate = dmz.util.timeStampToDate
   ;

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

(function () {

   RetData = dmz.forumView.setupForumView(
      { self: self
      , postType: dmz.stance.PostType
      , commentType: dmz.stance.CommentType
      , forumType: dmz.stance.ForumType
      , parentHandle: dmz.stance.ParentHandle
      , groupLinkHandle: dmz.stance.ForumLink
      , highlight: function () { MainModule.highlight("Forum"); }
      , canReplyTo: function () { return true; }
      , canPost: function () { return true; }
      , messageLength: MaxMessageLength
      });
}());

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;
   if (Mode === dmz.module.Activate) {

      if (RetData && RetData.update && RetData.onHome && RetData.widget) {

         module.addPage("Forum", RetData.widget, RetData.update, RetData.onHome);
      }
   }
});


