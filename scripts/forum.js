require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , ui:
          { consts: require('dmz/ui/consts')
          , layout: require("dmz/ui/layout")
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , messageBox: require("dmz/ui/messageBox")
          , graph: require("dmz/ui/graph")
          }
       , stance: require("stanceConst")
       , time: require("dmz/runtime/time")
       , util: require("dmz/types/util")
       }
   , PostItem = require("PosItem")

   // UI elements
   , form = dmz.ui.loader.load("ForumTreeForm.ui")
   , tree = form.lookup ("treeWidget")
   , textBox = form.lookup ("textEdit")
   , replyButton = form.lookup ("replyButton")
   , dialog = dmz.ui.loader.load("NewForumPostDialog.ui")
   , replyTitleText = dialog.lookup("titleEdit")
   , postText = dialog.lookup("postTextEdit")
   , messageLengthRem = dialog.lookup("charRemAmt")
   , buttonBox = dialog.lookup("buttonBox")
   , _forumBox = form.lookup("forumBox")
   , _forumLayout = dmz.ui.layout.createVBoxLayout()

   // Object Lists
   , ForumList = {}
   , PostList = {}
   , GroupList = {}
   , _itemCache = []
   , _itemList = []
   , _forum
   , _group

   // Variables
   , _forumMod
   , UnreadPostBrush = dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.3 })
   , ReadPostBrush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: 1 })

   // Functions
   , toDate = dmz.util.timeStampToDate
   , _setupView
   , _addPost
   , _addComment
   , _refresh
   ;

_addPost = function (forumHandle, post) {

};

_addComment = function (postHandle, comment) {

   self.log.warn("post: " + postHandle);
   self.log.warn("comment: " + comment);
};

_refresh = function () {

   // remove all post item widgets from layout
   Object.keys(_itemList).forEach(function (handle) {

      var item = _itemList[handle];

      _itemLayout.removeWidget(item.widget());
      _itemCache.push(item);

      delete _itemList[handle];
   });

   // add all of current forum post to layout
   Object.keys(PostList).forEach(function (postHandle) {

      var post = PostList[postHandle]
        , item
        , commentList
        ;

      if (post.forum === _forum) {

         item = _itemCache.pop();

         if (!item) {

            item = PostItem.create();
            item.onSubmitComment (self, _addComment);
         }

         item.set({handle: postHandle});
         _itemLayout.insertWidget(0, item.widget());
         _itemList[postHandle] = item;
         dmz.object.dumpObjectAttributes(parseInt(postHandle));

         commentList = dmz.object.subLinks(postHandle, dmz.stance.ParentHandle);
         self.log.warn("subLinks: " + commentList);

         if (commentList) {

            self.log.warn("post: " + postHandle + " has " + commentList.length + " comments");
         }
         else { self.log.warn("post: " + postHandle + " has ZERO comments"); }

//         Object.keys(commentList).forEach(function(commentHandle) {

//         });
      }
   });
};

_setupView = function () {

   _forumBox.layout(_forumLayout, true);

//   layout.addStretch(1);

//   var layout = _frame.layout(dmz.ui.layout.createVBoxLayout(), true)
//     , post
//     , lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere risus eu nisi imperdiet pellentesque. Duis a turpis nec ante euismod hendrerit non nec odio. Quisque vel nunc vel massa tempor condimentum.\n\nProin nisl nibh, placerat non lacinia sed, luctus ullamcorper lorem. Nulla massa dui, condimentum ac blandit dapibus, aliquam sit amet nunc. Vestibulum lacus."
//     ;

//   if (layout) {

//      for (var ix = 0; ix < 10; ix++) {

//         self.log.warn("ix: " + ix);

//         post = PostItem.create(ix, {
//            by: "Scottie-" + ix,
//            at: (new Date()).toString("dd/MM/yyyy"),
//            message: ((ix % 2) ? lorem : "WhooHoo!!!")
//         });

//         post.onSubmitComment (self, _addComment);

//         layout.insertWidget(0, post.widget());
//      }

////      post = PostItem.create({ by: "Scottie-!!!!", message: lorem+lorem+lorem+lorem+lorem+lorem+lorem });
////      layout.addWidget(post.widget())

////      layout.addStretch(1);
//   }
};

(function () {

   _setupView();
}());

//dmz.object.create.observe(self, function (handle, objType) {

//   var obj
//     ;

//   if (objType) {

//      if (objType.isOfType(dmz.stance.PostType)) {

//         obj = PostList[handle] || {};

//         PostList[handle] = obj;
//      }
//   }
//});

// -------------------------------------------------------------------
// --------------------- old forum code ------------------------------
// -------------------------------------------------------------------

dmz.object.create.observe(self, function (handle, objType) {

   var child
     , post
     ;

   if (objType) {

      if (objType.isOfType(dmz.stance.PostType)) {

         PostList[handle] = { widget: false };
      }
      else if (objType.isOfType(dmz.stance.ForumType)) {

         ForumList[handle] =
            { widget: tree.add([dmz.stance.getDisplayName(handle), "", "", ""])
            };

         ForumList[handle].widget.data(0, handle);
         tree.resizeColumnToContents(0);
      }
      else if (objType.isOfType(dmz.stance.GroupType)) { GroupList[handle] = []; }
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle, function (handle, attr, value) {

   if (ForumList[handle]) {

      ForumList[handle].widget.text(0, value);
      tree.resizeColumnToContents(0);
   }
});

dmz.object.link.observe(self, dmz.stance.ForumLink,
function (linkObjHandle, attrHandle, groupHandle, forumHandle) {

   GroupList[groupHandle].push(forumHandle);
});

dmz.object.text.observe(self, dmz.stance.TitleHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) {

      post.widget.text(0, value);
      tree.resizeColumnToContents(0);
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtGameTimeHandle,
function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) { post.widget.text(2, toDate(value)); }

   var item = _itemList[handle];
   if (item) { item.set({ at: toDate(value).toString("MMM dd, yyyy - hh:mm tt") }); }
});

dmz.object.text.observe(self, dmz.stance.TextHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) { post.widget.text(3, value); }

   var item = _itemList[handle];
   if (item) { item.set({ message: value }); }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var post = PostList[superHandle];
   if (post && post.widget) { post.widget.text(1,dmz.stance.getDisplayName(subHandle)); }

   var item = _itemList[superHandle];
   if (item) { item.set({ by: dmz.stance.getDisplayName(subHandle) }); }
});

dmz.object.link.observe(self, dmz.stance.ParentHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var child = PostList[superHandle]
     , parent = PostList[subHandle] ? PostList[subHandle] : ForumList[subHandle]
     , author = dmz.stance.getAuthorName(superHandle)
     , title = dmz.object.text(superHandle, dmz.stance.TitleHandle)
     , text = dmz.object.text(superHandle, dmz.stance.TextHandle)
     , createdAt = dmz.object.timeStamp(superHandle, dmz.stance.CreatedAtGameTimeHandle)
     , hil
     , backgroundBrush = UnreadPostBrush
     , postsRead
     ;

   if (child && parent && parent.widget) {

      child.forum = subHandle;

      child.widget = parent.widget.add ([title, author, toDate(createdAt), text]);
      child.widget.data(0, superHandle);
      hil = dmz.object.hil();
      if (hil) {

         postsRead = dmz.object.subLinks(hil, dmz.stance.PostVisitedHandle);
         if (postsRead && (postsRead.indexOf(superHandle) !== -1)) {

            backgroundBrush = ReadPostBrush;
         }
      }
      child.widget.background(0, backgroundBrush);
      parent.widget.expand();
      tree.resizeColumnToContents(0);
      tree.resizeColumnToContents(1);
   }

   var item = _itemList[subHandle];
   if (item) {

      item.addComment(superHandle);
   }

   if (_group && _forum && _forumMod) {

      if (subHandle == _forum) { _forumMod.addPost(superHandle); }
      else { _forumMod.addComment(subHandle, superHandle); }
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var type = dmz.object.type(objHandle)
     , postsRead
     , currHandle
     , currGroup
     , forum
     ;

   if (type && type.isOfType(dmz.stance.UserType)) {

      if (value) {

         _group = dmz.stance.getUserGroupHandle(objHandle);

         if (_group) {

            currGroup = GroupList[_group];
            if (currGroup) { _forum = currGroup[0]; }
         }

         if (_forumMod) { _forumMod.setForum(_forum); }

         postsRead = dmz.object.subLinks(objHandle, dmz.stance.PostVisitedHandle);
         currGroup = dmz.stance.getUserGroupHandle(objHandle);
         if (currGroup) {

            Object.keys(ForumList).forEach(function (forumHandle) {

               var linkedGroups
                 ;

               forumHandle = parseInt(forumHandle);
               dmz.object.flag(
                  forumHandle,
                  dmz.stance.VisibleHandle,
                  GroupList[currGroup].indexOf(forumHandle) !== -1);
            });
         }

         Object.keys(PostList).forEach(function (item) {

            var post = PostList[item]
              , data
              , index = -1
              ;

            if (post.widget) {

               data = post.widget.data(0);
               if (postsRead) { index = postsRead.indexOf(data); }
               if (index >= 0) {

                  post.widget.background(0, ReadPostBrush);
                  if (postsRead) { postsRead.splice(index, 1); }
               }
               else { post.widget.background(0, UnreadPostBrush); }
            }
         });

         currHandle = tree.currentItem();
         if (currHandle) {

            currHandle = currHandle.data(0);
            tree.currentItem().background(ReadPostBrush);
            if (!dmz.object.linkHandle(dmz.stance.PostVisitedHandle, objHandle, currHandle)) {

               dmz.object.link(dmz.stance.PostVisitedHandle, objHandle, currHandle);
            }
         }
      }
      else {

         _group = false;
         _forum = false;
      }

//      _refresh();
   }
});


dmz.object.flag.observe(self, dmz.stance.VisibleHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     ;

   if (type && type.isOfType(dmz.stance.ForumType)) {

      ForumList[handle].widget.hidden(!value);
   }
});

tree.observe(self, "itemActivated", function (item) {

   tree.resizeColumnToContents(0);
   tree.resizeColumnToContents(1);
});

tree.observe(self, "itemExpanded", function (item) {

   tree.resizeColumnToContents(0);
   tree.resizeColumnToContents(1);
});

tree.observe (self, "currentItemChanged", function (curr) {

   var currHandle = curr.data(0)
     , type = dmz.object.type(currHandle)
     , parentHandle
     , maxPostLength
     , hil = dmz.object.hil()
     , text
     ;

   if (currHandle && type) {

      replyButton.enabled(true);
      text = curr.text(3);
      textBox.text (text ? text : " ");

      if (hil && type.isOfType(dmz.stance.PostType) &&
         !dmz.object.linkHandle(dmz.stance.PostVisitedHandle, hil, currHandle)) {

         dmz.object.link(dmz.stance.PostVisitedHandle, hil, currHandle);
      }

      curr.background(0, ReadPostBrush);

      if (type.isOfType(dmz.stance.ForumType)) {

         replyButton.text("New Thread");
         parentHandle = currHandle;
         maxPostLength = 1000;
      }
      else if (type.isOfType(dmz.stance.PostType)) {

         replyButton.text("New Reply");
         maxPostLength = 400;
         parentHandle = dmz.object.subLinks(currHandle, dmz.stance.ParentHandle)[0];
         if (dmz.object.type(parentHandle).isOfType(dmz.stance.ForumType)) {

            parentHandle = currHandle;
         }
      }

      messageLengthRem.text(maxPostLength);

      postText.observe(self, "textChanged", function () {

         var length = postText.text().length
           , diff = maxPostLength - length
           , color = "black"
           ;

         buttonBox.enabled(length < maxPostLength);
         if (length > maxPostLength) { color = "red"; }
         else if (length > (maxPostLength / 2)) { color = "blue"; }
         else if (length > (maxPostLength / 4)) { color = "green"; }
         messageLengthRem.text("<font color="+color+">"+diff+"</font>");
      });

      replyButton.observe(self, "clicked", function () {

         if (type.isOfType(dmz.stance.PostType)) {

            text = "Re: " + curr.text(0);
            replyTitleText.text(text);
         }

         dialog.open(self, function (value, dialog) {

            var author = dmz.object.hil()
              , title
              , parentTitle
              , text
              , post
              , mb
              ;

            if (value && author) {

               text = postText.text();
               text = text ? text : "No Text Entered.";
               title = replyTitleText.text();
               title = title ? title : "Untitled";

               if ((text.length <= maxPostLength) && parentHandle) {

                  post = dmz.object.create(dmz.stance.PostType);
                  dmz.object.text(post, dmz.stance.TitleHandle, title);
                  dmz.object.text(post, dmz.stance.TextHandle, text);
                  dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
                  dmz.object.link(dmz.stance.PostVisitedHandle, author, post);
                  dmz.object.link(dmz.stance.ParentHandle, post, parentHandle);
                  dmz.object.link(dmz.stance.CreatedByHandle, post, author);
                  dmz.object.activate(post);
               }
            }

            replyTitleText.clear();
            postText.clear();
         });
      });
   }
});

dmz.object.destroy.observe(self, function (objHandle) {

   var members
     , parent
     ;
   if (ForumList[objHandle]) {

      members = dmz.object.subLinks(objHandle, dmz.stance.ParentHandle);
      if (members) {

         members.forEach(function (handle) { dmz.object.destroy(handle); });
      }

      parent = ForumList[objHandle].widget.parent();
      if (parent) { parent.takeChild(ForumList[objHandle].widget); }
   }
   else if (PostList[objHandle]) {

      parent = PostList[objHandle].widget.parent();
      if (parent) { parent.takeChild(PostList[objHandle].widget); }
   }
   else if (_itemList[objHandle]) {

   }
   else if (GroupList[objHandle] && (GroupList[objHandle] !== -1)) {

      dmz.object.destroy(GroupList[objHandle]);
   }
});

dmz.module.subscribe(self, "forum-view", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      _forumMod = module;
      _forumLayout.addWidget(_forumMod.getView());
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      module.addPage ("Forum", form, function () {

         Object.keys(PostList).forEach(function (post) {

            if (post.widget) { post.widget.collapse(); }
         });
         tree.resizeColumnToContents(0);
      });
   }
});
