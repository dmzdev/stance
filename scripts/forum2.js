var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , ui:
          { consts: require('dmz/ui/consts')
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , messageBox: require("dmz/ui/messageBox")
          , graph: require("dmz/ui/graph")
          }
       }

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
//   , forumDock = dmz.ui.mainWindow.createDock
//     ( "Forum"
//     , { area: dmz.ui.consts.LeftDockWidgetArea
//       , floating: false
//       }
//     , form
//     )

   // Handles
   , TextHandle = dmz.defs.createNamedHandle("text")
   , TitleHandle = dmz.defs.createNamedHandle("title")
   , CreatedByHandle = dmz.defs.createNamedHandle("created_by")
   , ParentHandle = dmz.defs.createNamedHandle("parent")
   , CreatedAtHandle = dmz.defs.createNamedHandle("created_at")
   , NameHandle = dmz.defs.createNamedHandle("name")
   , DisplayNameHandle = dmz.defs.createNamedHandle("display_name")
   , PostVisitedHandle = dmz.defs.createNamedHandle("post_visited")
   , VisibleHandle = dmz.defs.createNamedHandle("visible")

   // Object Types
   , PostType = dmz.objectType.lookup("post")
   , ForumType = dmz.objectType.lookup("forum")
   , GroupType = dmz.objectType.lookup("group")
   , UserType = dmz.objectType.lookup("user")

   // Object Lists
   , ForumList = {}
   , PostList = {}

   // Variables
   , UnreadPostBrush = dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.3 })
   , ReadPostBrush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: 1 })

   // Function decls
   , _getDisplayName
   , _getAuthorName
   , _getAuthorHandle
   ;

_getDisplayName = function (handle) {

   var name = dmz.object.text (handle, DisplayNameHandle);
   if (!name || (name === undefined)) { name = dmz.object.text (handle, NameHandle); }
   return name;
}


_getAuthorName = function (handle) {

   return _getDisplayName(_getAuthorHandle(handle));
}


_getAuthorHandle = function (handle) {

   var parentLinks = dmz.object.subLinks (handle, CreatedByHandle)
     , parent
     ;

   parentLinks = dmz.object.subLinks (handle, CreatedByHandle);
   if (parentLinks) { parent = parentLinks[0]; }

   return parent;
}


dmz.object.create.observe(self, function (handle, objType) {

   if (objType) {

      if (objType.isOfType(PostType)) {

         PostList[handle] = { widget: false };
      }
      else if (objType.isOfType(ForumType)) {

         ForumList[handle] =
            { widget: tree.add([_getDisplayName(handle), "", "", ""])
            };

         ForumList[handle].widget.data(0, handle);
         tree.resizeColumnToContents(0);
      }
   }
});

dmz.object.text.observe(self, TitleHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) {

      post.widget.text(0, value);
      tree.resizeColumnToContents(0);
   }
});

dmz.object.text.observe(self, CreatedAtHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) { post.widget.text(2, value); }
});

dmz.object.text.observe(self, TextHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) { post.widget.text(3, value); }
});

dmz.object.link.observe(self, CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var post = PostList[superHandle];
   if (post && post.widget) { post.widget.text(1,_getDisplayName(subHandle)); }
});

dmz.object.link.observe(self, ParentHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var child = PostList[superHandle]
     , parent = PostList[subHandle] ? PostList[subHandle] : ForumList[subHandle]
     , author = _getAuthorName(superHandle)
     , title = dmz.object.text(superHandle, TitleHandle)
     , text = dmz.object.text(superHandle, TextHandle)
     , createdAt = dmz.object.text(superHandle, CreatedAtHandle)
     ;

   if (child && parent && parent.widget) {

      child.widget = parent.widget.add ([title, author, createdAt, text]);
      child.widget.data(0, superHandle);
      child.widget.background(0, UnreadPostBrush);
      tree.currentItem (child.widget);
      tree.resizeColumnToContents(0);
      tree.resizeColumnToContents(1);
   }
});

// Devtools
dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (ObjHandle, attrHandle, value) {

   var type = dmz.object.type(ObjHandle)
     , postsRead
     , currHandle
     ;

   if (value && type && type.isOfType(UserType)) {

//      postsRead = dmz.object.subLinks(ObjHandle, PostVisitedHandle);
//      self.log.warn ("Posts read:", postsRead);
//      Object.keys(PostList).forEach(function (item) {

//         var post = PostList[item]
//           , data = post.widget.data(0)
//           , index = -1
//           ;

//         if (postsRead) { index = postsRead.indexOf(data); }
//         if (index >= 0) {

//            post.widget.background(0, ReadPostBrush);
//            if (postsRead) { postsRead.splice(index, 1); }
//         }
//         else { post.widget.background(0, UnreadPostBrush); }
//      });

//      currHandle = tree.currentItem();
//      if (currHandle) {

//         currHandle = currHandle.data(0);
//         if (!dmz.object.linkHandle(PostVisitedHandle, ObjHandle, currHandle)) {

//            dmz.object.link(PostVisistedHandle, ObjHandle, currHandle);
//         }
//      }
   }
});


dmz.object.flag.observe(self, VisibleHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     ;

   if (type && type.isOfType(ForumType)) {

      ForumList[handle].widget.hidden(!value);
   }
});


dmz.object.link.observe(self, PostVisitedHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var post = PostList[subHandle];

   if (post && post.widget) {

//      self.log.warn ("This is where the linking would happen...");
      post.widget.background(0, ReadPostBrush);
   }
});


tree.observe (self, "currentItemChanged", function (curr) {

   var currHandle = curr.data(0)
     , type = dmz.object.type(currHandle)
     , parentHandle
     , maxPostLength
     , hil = dmz.object.hil()
     ;

   textBox.text (curr.text(3));

   if (hil && !dmz.object.linkHandle(PostVisitedHandle, hil, currHandle) &&
      type.isOfType(PostType)) {

      dmz.object.link(PostVisitedHandle, hil, currHandle);
   }

   if (type.isOfType(ForumType)) {

      replyButton.text("New Thread");
      parentHandle = currHandle;
      maxPostLength = 1000;
   }
   else if (type.isOfType(PostType)) {

      replyButton.text("New Reply");
      maxPostLength = 400;
      parentHandle = dmz.object.subLinks(currHandle, ParentHandle)[0];
      if (dmz.object.type(parentHandle).isOfType(ForumType)) {

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

      dialog.open(self, function (value, dialog) {

         var author = dmz.object.hil()
           , title
           , text
           , post
           , mb
           ;

         if (value && author) {

            text = postText.text();
            title = replyTitleText.text();

            if ((text.length <= maxPostLength) && parentHandle) {

               post = dmz.object.create(PostType);
               dmz.object.text(post, TitleHandle, title);
               dmz.object.text(post, TextHandle, text);
               dmz.object.text(post, CreatedAtHandle, new Date());
               dmz.object.link(ParentHandle, post, parentHandle);
               dmz.object.link(CreatedByHandle, post, author);
               dmz.object.activate(post);
            }
         }

         replyTitleText.clear();
         postText.clear();
      });
   });
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      module.addPage ("Forum", form);
   }
});
