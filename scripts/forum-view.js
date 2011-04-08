require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
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
          }
       }

   // UI elements
   , _view = dmz.ui.loader.load("ForumView.ui")
   , _scrollArea = _view.lookup("scrollArea")
   , _mainLayout = dmz.ui.layout.createVBoxLayout()
   , _postTextEdit = _view.lookup("postTextEdit")

   // Object Lists
   , _master = { posts: [], forums: [] }
   , _exports = {}
   , _commentAddCache = []
   , _commentCache = []
   , _postCache = []
   , _postList = []
   , _commentList = []
   , _forumHandle

   // Variables
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))

   // Functions
   , toDate = dmz.util.timeStampToDate
   , _htmlLink
   , _setupView
   , _updatePostedBy
   , _updatePostedAt
   , _updateMessage
   , _addPost
   , _addComment
   , _createPost
   , _refresh
   , _reset
   , _load
   , _setForum
   ;

(function () {

   var content = _scrollArea.widget()
     , photo = _view.lookup("avatarLabel")
     ;

   if (content) {

      content.layout(_mainLayout);
      _mainLayout.addStretch(1);
   }

   if (photo) { photo.pixmap(AvatarDefault); }
}());

_htmlLink = function (text) { return "<a href=\"javascript://\">"+ text + "</a>"; };

_addPost = function (postHandle) {

   var post = { handle: postHandle }
     , comment
     , layout
     , label
     , form
     ;

   post.layout = dmz.ui.layout.createGridLayout();
   post.layout.property("spacing", 0);

   _mainLayout.insertLayout(0, post.layout);
   _mainLayout.property("spacing", 4);

   post.showComments = false;
   post.commentList = [];

   post.item = _postCache.pop();
   if (!post.item) { post.item = dmz.ui.loader.load("PostItem"); }

   post.avatar = post.item.lookup("avatarLabel");
   post.avatar.pixmap(AvatarDefault);

   post.postedBy = post.item.lookup("postedByLabel");
   post.postedAt = post.item.lookup("postedAtLabel");
   post.message = post.item.lookup("messageLabel");
   post.commentCountLabel = post.item.lookup("commentCountLabel");
   post.layout.addWidget(post.item, 0, 0, 1, 2);
   post.item.show();

   form = _commentAddCache.pop();
   if (!form) { form = dmz.ui.loader.load("CommentAdd"); }

   post.layout.addWidget(form, post.layout.rowCount(), 1);
   form.hide();

   form.observe(self, "submitButton", "clicked", function () {

      var textEdit = form.lookup("textEdit")
        , message;

      if (textEdit) {

         message = textEdit.text();
         if (message) {

            if (!post.showComments) { post.toggleComments(); }
            _createPost(post.handle, message);
         }

         textEdit.clear();
      }

      form.hide();
   });

   post.toggleComments = function () {

      post.showComments = !post.showComments;

      Object.keys(post.commentList).forEach(function(key) {

         var comment = post.commentList[key];
         if (comment && comment.item) { comment.item.visible(post.showComments); }
      });
   };

   _postList[postHandle] = post;

   post.commentCountLabel.observe(self, "linkActivated", post.toggleComments);

   post.item.observe(self, "commentAddLabel", "linkActivated", function (link) {

      form.visible(!form.visible());
      _scrollArea.ensureVisible(form);
   });

   _updatePostedBy(postHandle);
   _updatePostedAt(postHandle);
   _updateMessage(postHandle);
};

_addComment = function (postHandle, commentHandle) {

   var post = _postList[postHandle]
     , comment = {}
     , text
     ;

   if (post) {

      comment.post = postHandle;
      comment.handle = commentHandle;

      comment.item = _commentCache.pop();
      if (!comment.item) { comment.item = dmz.ui.loader.load("CommentItem"); }

      comment.avatar = comment.item.lookup("avatarLabel");
      comment.avatar.pixmap(AvatarDefault);

      comment.postedBy = comment.item.lookup("postedByLabel");
      comment.postedAt = comment.item.lookup("postedAtLabel");
      comment.message = comment.item.lookup("messageLabel");

      post.commentList.push(comment);
      post.layout.addWidget(comment.item, post.layout.rowCount(), 1);
      comment.item.visible(post.showComments);

      post.commentCountLabel.text(_htmlLink(post.commentList.length + " Comments"));

      _commentList[commentHandle] = comment;

      _updatePostedBy(commentHandle);
      _updatePostedAt(commentHandle);
      _updateMessage(commentHandle);
   }
};

_updatePostedBy = function (handle) {

   var item = _postList[handle];
   if (!item) { item = _commentList[handle]; }

   if (item && item.postedBy) {

      item.postedBy.text ("<b>" + _master.posts[handle].postedBy + "</b>");
   }
};

_updatePostedAt = function (handle) {

   var item = _postList[handle];
   if (!item) { item = _commentList[handle]; }

   if (item && item.postedAt) {

      item.postedAt.text(_master.posts[handle].postedAt);
   }
};

_updateMessage = function (handle) {

   var item = _postList[handle];
   if (!item) { item = _commentList[handle]; }

   if (item && item.message) {

      item.message.text(_master.posts[handle].message);
   }
};

_createPost = function (parent, message) {

   var post
     , hil = dmz.object.hil()
     ;

   if (hil && parent && message) {

      post = dmz.object.create(dmz.stance.PostType);
      dmz.object.text(post, dmz.stance.TitleHandle, "Reply to: " + parent);
      dmz.object.text(post, dmz.stance.TextHandle, message);
      dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
      dmz.object.link(dmz.stance.PostVisitedHandle, hil, post);
      dmz.object.link(dmz.stance.ParentHandle, post, parent);
      dmz.object.link(dmz.stance.CreatedByHandle, post, hil);
      dmz.object.activate(post);

      var item = _postList[post];
      if (!item) { item = _commentList[post]; }
      if (item) { _scrollArea.ensureVisible (item.item); }
   }
};

_reset = function () {

   _postList.forEach(function(post) {

      post.commentList.forEach(function(comment) {

         post.layout.removeWidget(comment.item);
         comment.item.hide();
         _commentCache.push (comment.item);
         delete post.commentList[comment.handle];
      });

      post.layout.removeWidget(post.item);
      post.item.hide();
      _postCache.push (post.item);

      _mainLayout.removeLayout(post.layout);

      delete _postList[post.handle];
   });
};

_load = function () {

   var posts;

   if (_forumHandle) {

      posts = dmz.object.superLinks(_forumHandle, dmz.stance.ParentHandle);
      if (posts) {

         posts.forEach(function(postHandle) {

            _addPost(postHandle);

            var comments = dmz.object.superLinks(postHandle, dmz.stance.ParentHandle);
            if (comments) {

               comments.forEach(function(commentHandle) {

                  _addComment(postHandle, commentHandle);
               });
            }
         });
      }
   }
};

_setForum = function (handle) {

   if (handle !== _forumHandle) {

      _reset ();
      _forumHandle = handle;
      _load();
   }
};

_view.observe(self, "postSubmitButton", "clicked", function () {

   _createPost (_forumHandle, _postTextEdit.text());
   _postTextEdit.clear();
});

dmz.object.create.observe(self, function (handle, type) {

   var obj = { handle: handle }
     ;

   if (type) {

      if (type.isOfType(dmz.stance.PostType)) { _master.posts[handle] = obj; }
      else if (type.isOfType(dmz.stance.ForumType)) { _master.forums[handle] = obj; }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtGameTimeHandle,
function (handle, attr, value) {

   var item = _master.posts[handle]
     , timeStamp = toDate(value).toString("MMM dd, yyyy - hh:mm tt")
     ;

   if (item) { item.postedAt = timeStamp; }

   _updatePostedAt(handle);
});

dmz.object.text.observe(self, dmz.stance.TextHandle, function (handle, attr, value) {

   var item = _master.posts[handle];
   if (item) { item.message = value; }

   _updateMessage(handle);
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var item = _master.posts[superHandle];
   if (item) { item.postedBy = dmz.stance.getDisplayName(subHandle); }

   _updatePostedBy(superHandle);
});

dmz.object.link.observe(self, dmz.stance.ForumLink,
function (linkObjHandle, attrHandle, groupHandle, forumHandle) {

   var forum = _master.forums[forumHandle]
     ;

   if (forum) { forum.group = groupHandle; }
});

dmz.object.link.observe(self, dmz.stance.ParentHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var post = _master.posts[superHandle]
     ;

   if (post) {

      if (_master.posts[subHandle]) { post.parent = subHandle; }
      else if (_master.forums[subHandle]) { post.forum = subHandle; }

      if (subHandle == _forumHandle) { _addPost(superHandle); }
      else { _addComment(subHandle, superHandle); }
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var type = dmz.object.type(objHandle)
     , forumHandle = 0
     , forumList
     , forum
     , group
     ;

   if (type && type.isOfType(dmz.stance.UserType)) {

      if (value) {

         group = dmz.stance.getUserGroupHandle(objHandle);

         forumList = _master.forums.filter(function (element, index) {

            return element.group === group;
         });

         forum = forumList.pop();
         if (forum) { forumHandle = forum.handle; }
      }

      _setForum(forumHandle);
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      module.addPage ("Forum", _view);
   }
});
