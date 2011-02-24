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

   // Handles
   , PostTextHandle = dmz.defs.createNamedHandle("Post_Text")
   , PostTitleHandle = dmz.defs.createNamedHandle("Post_Title")
   , PostAuthorHandle = dmz.defs.createNamedHandle("Post_Author")
   , PostParentLinkHandle = dmz.defs.createNamedHandle("Post_Parent")
   , PostDateHandle = dmz.defs.createNamedHandle("Post_Date")

   , ForumNameHandle = dmz.defs.createNamedHandle("Forum_Name")

   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")
   , GroupForumHandle = dmz.defs.createNamedHandle("group_forum")

   , UserRealNameHandle = dmz.defs.createNamedHandle("user_real_name")
   , UserAuthoredPostLinkHandle = dmz.defs.createNamedHandle("user_authored_post_link")
   , UserReadPostLinkHandle = dmz.defs.createNamedHandle("user_read_post_link")

   // Devtools type, handle
   , CurrentUserHandle = dmz.defs.createNamedHandle("current_user")
   , CurrentUserType = dmz.objectType.lookup("current_user")

   // Object Types
   , PostType = dmz.objectType.lookup("forum_post")
   , ForumType = dmz.objectType.lookup("forum_type")
   , GroupType = dmz.objectType.lookup("group")
   , UserType = dmz.objectType.lookup("user")

   // Object Lists
   , ForumList = {}
   , PostList = {}

   // Variables

//   , CurrentAuthor = "Tester" // Convert to dmz.object call later.
   , CurrentUser = false
   , UnreadPostBrush = dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.3 })
   , ReadPostBrush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: 1 })

   // Test Function decls
   , newForum
   ;

dmz.object.create.observe(self, function (handle, objType) {

   var parent = false
     , parentLinks
     , parent
     , child
     , text
     ;

   if (objType) {

      if (objType.isOfType(PostType)) {

         PostList[handle] =
            { widget: false
            , title: dmz.object.text(handle, PostTitleHandle)
            , author: dmz.object.text(handle, PostAuthorHandle)
            , date: dmz.object.text(handle, PostDateHandle)
            , text: dmz.object.text(handle, PostTextHandle)
            };

         parentLinks = dmz.object.superLinks(handle, PostParentLinkHandle);
         if (parentLinks) {

            parent = PostList[parentLinks[0]] ? PostList[parentLinks[0]] : ForumList[parentLinks[0]];
            if (parent) {

               child = PostList[handle];

               if (!child.title || (child.title === undefined) || (child.title === "")) {

                  child.title = parent.title ? "Re: " + parent.title : "Untitled";
               }

               if (!child.author || (child.author === undefined) || (child.author === "")) {

                  child.author = "Hacker McGee";
               }

               if (!child.date || (child.date === undefined) || (child.date === "")) {

                  child.date = "Date Error!";
               }

               if (!child.text || (child.text === undefined) || (child.text === "")) {

                  child.text = "No text.";
               }

               child.widget = parent.widget.add ([child.title, child.author, child.date, child.text]);
               child.widget.data(0, handle);
               if (dmz.object.link(UserReadPostLinkHandle, CurrentUser, handle)) {

                  child.widget.background(0, UnreadPostBrush);
               }
               else { child.widget.background(0, ReadPostBrush); }

               tree.currentItem(child.widget);
               tree.resizeColumnToContents(0);
               tree.resizeColumnToContents(1);
            }
         }
      }
      else if (objType.isOfType(ForumType)) {

         ForumList[handle] =
            { widget: tree.add([dmz.object.text(handle, ForumNameHandle), "", "", ""])
            };

         ForumList[handle].widget.data(0, handle);
         tree.resizeColumnToContents(0);
      }
      else if (objType.isOfType(GroupType)) {

         child = dmz.object.create(ForumType);
         text = dmz.object.text(handle, GroupNameHandle);
         dmz.object.text(child, ForumNameHandle, text);
         dmz.object.activate(child);
         dmz.object.link(GroupForumHandle, objHandle, child);
      }
   }
});


// Devtools
dmz.object.link.observe(self, CurrentUserHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var type = dmz.object.type(subHandle)
     , postsRead
     , currHandle
     ;
   if (type && type.isOfType(UserType)) {

      CurrentUser = subHandle;
      postsRead = dmz.object.subLinks(CurrentUser, UserReadPostLinkHandle);
      self.log.warn ("Posts read:", postsRead);
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
         if (!dmz.object.linkHandle(UserReadPostLinkHandle, CurrentUser, currHandle)) {

            dmz.object.link(UserReadPostLinkHandle, CurrentUser, currHandle);
         }
      }
   }
});

dmz.object.link.observe(self, UserReadPostLinkHandle, function (linkObjHandle, attrHandle, superHandle, subHandle) {

   if (PostList[subHandle]) {

//      self.log.warn ("This is where the linking would happen...");
      PostList[subHandle].widget.background(0, ReadPostBrush);
   }
});


tree.observe (self, "currentItemChanged", function (curr) {

   var currHandle = curr.data(0)
     , type = dmz.object.type(currHandle)
     , parentHandle
     , maxPostLength
     ;
   textBox.text (curr.text(3));

   if (!dmz.object.linkHandle(UserReadPostLinkHandle, CurrentUser, currHandle) &&
      type.isOfType(PostType)) {

      dmz.object.link(UserReadPostLinkHandle, CurrentUser, currHandle);
   }

   if (type.isOfType(ForumType)) {

      replyButton.text("New Thread");
      parentHandle = currHandle;
      maxPostLength = 1000;
   }
   else if (type.isOfType(PostType)) {

      replyButton.text("New Reply");
      maxPostLength = 400;
      parentHandle = dmz.object.superLinks(currHandle, PostParentLinkHandle)[0];
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

         var text
           , title
           , author
           , authorName
           , post
           , mb
           ;

         if (value) {

            text = postText.text();
            title = replyTitleText.text();
            author = CurrentUser;

            if ((text.length <= maxPostLength) && parentHandle) {

               post = dmz.object.create(PostType);
               dmz.object.text(post, PostTextHandle, text);
               authorName = dmz.object.text(author, UserRealNameHandle);
               dmz.object.text(post, PostAuthorHandle, authorName);
               dmz.object.text(post, PostTitleHandle, title);
               dmz.object.text(post, PostDateHandle, new Date());
               dmz.object.link(PostParentLinkHandle, parentHandle, post);
               dmz.object.link(UserAuthoredPostLinkHandle, author, post);
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
