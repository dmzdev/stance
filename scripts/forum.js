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
       , const: require("const")
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

   // Object Lists
   , ForumList = {}
   , PostList = {}
   , GroupList = {}

   // Variables
   , UnreadPostBrush = dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.3 })
   , ReadPostBrush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: 1 })

   ;

dmz.object.create.observe(self, function (handle, objType) {

   var child;

   if (objType) {

      if (objType.isOfType(dmz.const.PostType)) {

         PostList[handle] = { widget: false };
      }
      else if (objType.isOfType(dmz.const.ForumType)) {

         ForumList[handle] =
            { widget: tree.add([dmz.const._getDisplayName(handle), "", "", ""])
            };

         ForumList[handle].widget.data(0, handle);
         tree.resizeColumnToContents(0);
      }
      else if (objType.isOfType(dmz.const.GroupType)) { GroupList[handle] = []; }
   }
});

dmz.object.text.observe(self, dmz.const.NameHandle, function (handle, attr, value) {

   if (ForumList[handle]) {

      ForumList[handle].widget.text(0, value);
      tree.resizeColumnToContents(0);
   }
});

dmz.object.link.observe(self, dmz.const.ForumLink,
function (linkObjHandle, attrHandle, groupHandle, forumHandle) {

   GroupList[groupHandle].push(forumHandle);
});

dmz.object.text.observe(self, dmz.const.TitleHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) {

      post.widget.text(0, value);
      tree.resizeColumnToContents(0);
   }
});

dmz.object.text.observe(self, dmz.const.CreatedAtHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) { post.widget.text(2, value); }
});

dmz.object.text.observe(self, dmz.const.TextHandle, function (handle, attr, value) {

   var post = PostList[handle];
   if (post && post.widget) { post.widget.text(3, value); }
});

dmz.object.link.observe(self, dmz.const.CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var post = PostList[superHandle];
   if (post && post.widget) { post.widget.text(1,dmz.const._getDisplayName(subHandle)); }
});

dmz.object.link.observe(self, dmz.const.ParentHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var child = PostList[superHandle]
     , parent = PostList[subHandle] ? PostList[subHandle] : ForumList[subHandle]
     , author = dmz.const._getAuthorName(superHandle)
     , title = dmz.object.text(superHandle, dmz.const.TitleHandle)
     , text = dmz.object.text(superHandle, dmz.const.TextHandle)
     , createdAt = dmz.object.text(superHandle, dmz.const.CreatedAtHandle)
     , hil
     , backgroundBrush = UnreadPostBrush
     , postsRead
     ;

   if (child && parent && parent.widget) {

      child.widget = parent.widget.add ([title, author, createdAt, text]);
      child.widget.data(0, superHandle);
      hil = dmz.object.hil();
      if (hil) {

         postsRead = dmz.object.subLinks(hil, dmz.const.PostVisitedHandled);
         if (postsRead && (postsRead.indexOf(child) !== -1)) {

            backgroundBrush = ReadPostBrush;
         }
      }
      child.widget.background(0, backgroundBrush);
      tree.resizeColumnToContents(0);
      tree.resizeColumnToContents(1);
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

   if (value && type && type.isOfType(dmz.const.UserType)) {

      postsRead = dmz.object.subLinks(objHandle, dmz.const.PostVisitedHandle);
      currGroup = dmz.object.superLinks(objHandle, dmz.const.GroupMembersHandle);
      if (currGroup && currGroup[0]) {

         Object.keys(ForumList).forEach(function (forumHandle) {

            var linkedGroups
              ;

            forumHandle = parseInt(forumHandle);
            dmz.object.flag(
               forumHandle,
               dmz.const.VisibleHandle,
               GroupList[currGroup[0]].indexOf(forumHandle) !== -1);
         });
      }

      Object.keys(PostList).forEach(function (item) {

         var post = PostList[item]
           , data = post.widget.data(0)
           , index = -1
           ;

         if (postsRead) { index = postsRead.indexOf(data); }
         if (index >= 0) {

            post.widget.background(0, ReadPostBrush);
            if (postsRead) { postsRead.splice(index, 1); }
         }
         else { post.widget.background(0, UnreadPostBrush); }
      });

      currHandle = tree.currentItem();
      if (currHandle) {

         currHandle = currHandle.data(0);
         tree.currentItem().background(ReadPostBrush);
         if (!dmz.object.linkHandle(dmz.const.PostVisitedHandle, objHandle, currHandle)) {

            dmz.object.link(dmz.const.PostVisitedHandle, objHandle, currHandle);
         }
      }
   }
});


dmz.object.flag.observe(self, dmz.const.VisibleHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     ;

   if (type && type.isOfType(dmz.const.ForumType)) {

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

      if (hil && !dmz.object.linkHandle(dmz.const.PostVisitedHandle, hil, currHandle) &&
         type.isOfType(dmz.const.PostType)) {

         dmz.object.link(dmz.const.PostVisitedHandle, hil, currHandle);
         curr.background(0, ReadPostBrush);
      }

      if (type.isOfType(dmz.const.ForumType)) {

         replyButton.text("New Thread");
         parentHandle = currHandle;
         maxPostLength = 1000;
      }
      else if (type.isOfType(dmz.const.PostType)) {

         replyButton.text("New Reply");
         maxPostLength = 400;
         parentHandle = dmz.object.subLinks(currHandle, dmz.const.ParentHandle)[0];
         if (dmz.object.type(parentHandle).isOfType(dmz.const.ForumType)) {

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

         if (type.isOfType(dmz.const.PostType)) {

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

                  post = dmz.object.create(dmz.const.PostType);
                  dmz.object.text(post, dmz.const.TitleHandle, title);
                  dmz.object.text(post, dmz.const.TextHandle, text);
                  dmz.object.text(post, dmz.const.CreatedAtHandle, new Date());
                  dmz.object.link(dmz.const.ParentHandle, post, parentHandle);
                  dmz.object.link(dmz.const.CreatedByHandle, post, author);
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

      members = dmz.object.subLinks(objHandle, dmz.const.ParentHandle);
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
   else if (GroupList[objHandle] && (GroupList[objHandle] !== -1)) {

      dmz.object.destroy(GroupList[objHandle]);
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
