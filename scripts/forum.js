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
  , puts = require('sys').puts

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
  , PostForumLinkHandle = dmz.defs.createNamedHandle("Post_Forum")
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

   self.log.warn ("Object created");
   if (objType) {

      if (objType.isOfType(PostType)) {

         PostList[handle] =
            { widget: false
            , parent: false
            , forum: false
            , author: ""
            , title: ""
            , text: ""
            , date: ""
            };
      }
      else if (objType.isOfType(ForumType)) {

         self.log.warn ("Creating forum");
         ForumList[handle] = { widget: false };
      }
   }
});


dmz.object.text.observe(self, function (handle, attr, text) {

   var object
     , index
     ;

   if (attr === ForumNameHandle) { self.log.warn ("ForumNameHandle"); }
   if (ForumList[handle]) {

      self.log.warn ("object.text.observe:", handle, attr, text);
      object = ForumList[handle];
      if (object.widget) { object.widget.text (0, text); }
      else { object.widget = tree.add([text, "", "", ""]); }
   }
   else if (PostList[handle]) {

      object = PostList[handle];

      // Determine handle, update widget in tree
      switch (attr) {

      case PostTitleHandle: index = 0; break;
      case PostAuthorHandle: index = 1; break;
      case PostDateHandle: index = 2; break;
      case PostTextHandle: index = 3; break;
      default: index = -1; break;
      }

      if (object.widget && (index >= 0)) { object.widget.text(index, text); }
   }
});

// New posts sub to forum type and sub to parent
// Don't watch for updates to forum type link
// Set forum type link to parent link type
// Add new post as child to Super's widget
dmz.object.link.observe(self, function (LinkHandle, AttrHandle, SuperHandle, SubHandle) {

   //      case PostParentLinkHandle: break;

   var parent
     , child
     ;

   if (AttrHandle === PostForumLinkHandle) {

      child = PostList[SubHandle];
      if (child) { child.forum = SuperHandle; }
   }
   else if (AttrHandle === PostParentLinkHandle) {

      parent = PostList[SuperHandle] ? PostList[SuperHandle] : ForumList[SuperHandle];
      child = PostList[SubHandle];
      if (parent && child) {

         child.widget = parent.widget.add ([child.title, child.poster, child.date, child.text]);

      }
      else {

         puts ("Link error:", parent, child);
      }
   }
});

//      case PostForumLinkHandle: break;





tree.observe (self, "currentItemChanged", function (curr) {

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

      var post = postText.text()
        , title = replyTitleText.text()
        ;
      replyTitleText.clear();
      postText.clear();
      replyTitleText.enabled(false);
      postText.enabled(false);
      submitPostButton.enabled(false);
      newPost(data, post, "Obama", title);
   });
});

forumRoot =
   { children: []
   , text: "Root"
   , poster: "Root"
   , title: "Root"
   , id: ""
   , widget: tree.root()
   };

//newPost = function (parent, text, poster, title) {

//   var result
//     , textWidget
//     , layout
//     , button
//     ;

//   result =
//      { children: [] // Array of posts
//      , text: text // String
//      , poster: poster // String username
//      , title: title ? title: "Re: " + parent.title // String
//      , id: parent.id + parent.children.length.toString() // String
//      , date: new Date() // Replace with additional argument -- need to take post date as another piece of data
//      };

//   result.widget = parent.widget.add ([result.title, result.poster, result.date, result.id]);
//   result.widget.data(0, result);
//   parent.widget.expand();
//   tree.currentItem(result.widget);
//   return result;
//};

newPost = function (parentHandle, text, author, title, date) {

   var post
     , parent
     ;

   if (parentHandle) {

      post = dmz.object.create(PostType);
      dmz.object.text(post, PostTextHandle, text);
      dmz.object.text(post, PostAuthorHandle, author);
      dmz.object.text(post, PostTitleHandle, title);
      dmz.object.text(post, PostDateHandle, date);

      if (ForumList[parentHandle]) {

         dmz.object.link(PostForumLinkHandle, parentHandle, post);
         dmz.object.link(PostParentLinkHandle, parentHandle, post);
      }
      else if (PostType[parentHandle]) {

         dmz.object.link(PostParentLinkHandle, parentHandle, post);
         dmz.object.link(
            PostForumLinkHandle,
            dmz.object.superLinks(parentHandle, PostForumLinkHandle)[0],
            post);
      }


   }
};

newForum = function (title) {

   var forum
     ;

   if (title) {

      forum = dmz.object.create(ForumType);
      self.log.warn ("title:", title, forum, ForumType);
      dmz.object.text(forum, ForumNameHandle, title);
   }
}

puts('Script: ' + self.name);

form.show();

//widget.lookup("lcd").value (100);

//form.observe(self, "pushButton", "clicked", function () { tree.clear(); });

tree.columnCount (3);
tree.headerLabels (["Title", "Author", "Post Time"]);

testMessages =
   [ { id: "0", title: "Congress", poster: "", text: "" }
   , { id: "1", title: "White House", poster: "", text: "" }
   , { id: "2", title: "Drug Cartel", poster: "", text: "" }
   , { id: "00", title: "Health Care", poster: "Kennedy", text: "Nationalize Health Care!" }
   , { id: "000", title: "", poster: "Nixon", text: "Don't be silly" }
   , { id: "001", title: "I don't know...", poster: "Clinton", text: "This seems like a bit of a risky idea." }
   , { id: "002", title: "GENIUS!", poster: "Obama", text: "I'm going to do this for sure!" }
   , { id: "0020", title: "", poster: "Palin", text: "STFU DIAF" }
   , { id: "0021", title: "Not if I have anything to say about it!", poster: "Palin",  text: "I'm coming for you!" }
   , { id: "01", title: "I can see Russia!", poster: "Palin", text: "See! I can be famous!" }
   , { id: "10", title: "Budget", poster: "Biden", text: "Are we screwed, or what?" }
   , { id: "11", title: "Small Government", poster: "Tea Party", text: "We hate big government!" }
   , { id: "110", title: "Uh...", poster: "NY Times", text: "So we should cut all government spending?" }
   , { id: "1100", title: "", poster: "Tea Party", text: "Hell yes!" }
   , { id: "11000", title: "", poster: "NY Times", text: "So we'll start by cutting unemployment, and medicare..." }
   , { id: "110000", title: "", poster: "Tea Party", text: "Wait, what? No, I LIKE that stuff. It helps ME!" }
   , { id: "20", title: "Smoking crack", poster: "Junkie Jim", text: "I want to quit!" }
   , { id: "21", title: "$10000 bounty", poster: "Leader", text: "I'll pay $10000 for the head of that federal marshall" }
   , { id: "210", title: "Done", poster: "Enforcer", text: "I left his head on your front porch." }
   , { id: "200", title: "", poster: "Dealer", text: "Aww, don't be that way! Here's a free sample, on the house." }
   , { id: "22", title: "Conquering America", poster: "Leader", text: "Let's get this underway already!" }
   ];

newForum ("Congress");
newForum ("White House");
newForum ("Drug Cartel");

self.log.warn("Mite arena:", dmz.object.create("mite_arena"));

//tree.resizeColumnToContents(0);
//tree.collapseAll();


//dmz.module.subscribe(self, "main", function (Mode, module) {

//   if (Mode === dmz.module.Activate) {

//      _main = module
//      _main.addPage (self.name, form);
//   }
//});
