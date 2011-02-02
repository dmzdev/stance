var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , defs: require("dmz/runtime/definitions")
       , message: require("dmz/runtime/messaging")
       , ui:
          { consts: require('dmz/ui/consts')
          , file: require("dmz/ui/fileDialog")
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , widget: require("dmz/ui/widget")
          , layout: require("dmz/ui/layout")
          , button: require("dmz/ui/button")
          , lineEdit: require("dmz/ui/lineEdit")
          }
       , timer: require('dmz/runtime/time')
       }

  // UI elements
  , form = dmz.ui.loader.load("ForumTreeForm.ui")
  , tree = form.lookup ("treeWidget")
  , textBox = form.lookup ("textEdit")
  , replyTitleText = form.lookup("titleEdit")
  , postText = form.lookup("postTextEdit")
  , submitPostButton = form.lookup("submitButton")

  // Handles
  , PostTextHandle = dmz.defs.createNamedHandle("Post_Text")
  , PostTitleHandle = dmz.defs.createNamedHandle("Post_Title")
  , PostAuthorHandle = dmz.defs.createNamedHandle("Post_Author")
  , PostParentLinkHandle = dmz.defs.createNamedHandle("Post_Parent")
//  , PostForumLinkHandle = dmz.defs.createNamedHandle("Post_Forum")
  , PostDateHandle = dmz.defs.createNamedHandle("Post_Date")

  , ForumNameHandle = dmz.defs.createNamedHandle("Forum_Name")

  // Object Types
  , PostType = dmz.objectType.lookup("forum_post")
  , ForumType = dmz.objectType.lookup("forum_type")

  // Object Lists
  , ForumList = {}
  , PostList = {}

  // Function decls
  , forumRoot
  , convertNewPost
  , testMessages
  , newPost
  , newForum
  , collapseAll
  ;

dmz.object.create.observe(self, function (handle, objType) {

   var parent = false
     , parentLinks
     , parent
     , child
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
               tree.currentItem(child.widget);
            }
         }
      }
      else if (objType.isOfType(ForumType)) {

         ForumList[handle] =
            { widget: tree.add([dmz.object.text(handle, ForumNameHandle), "", "", ""])
            };

         ForumList[handle].widget.data(0, handle);
      }
   }
});

tree.observe (self, "currentItemChanged", function (curr) {

   var parentHandle = curr.data(0)
     ;
   textBox.text (curr.text(3));
   if (submitPostButton.enabled()) {

      submitPostButton.enabled(false);
      replyTitleText.enabled(false);
      postText.enabled(false);
   }

   replyTitleText.enabled(true);
   postText.enabled(true);
   submitPostButton.enabled(true);
   submitPostButton.observe(self, "clicked", function () {

      var text = postText.text()
        , title = replyTitleText.text()
        , author = "Tester"
        , post
        , forum
        ;
      replyTitleText.clear();
      postText.clear();
      replyTitleText.enabled(false);
      postText.enabled(false);
      submitPostButton.enabled(false);

      if (parentHandle) {

         post = dmz.object.create(PostType);
         dmz.object.text(post, PostTextHandle, text);
         dmz.object.text(post, PostAuthorHandle, author);
         dmz.object.text(post, PostTitleHandle, title);
         dmz.object.text(post, PostDateHandle, new Date());
         dmz.object.link(PostParentLinkHandle, parentHandle, post);
         dmz.object.activate(post);
      }
   });
});

newForum = function (title) {

   var forum
     ;

   if (title) {

      forum = dmz.object.create(ForumType);
      dmz.object.text(forum, ForumNameHandle, title);
      dmz.object.activate(forum);
   }
}

form.show();
