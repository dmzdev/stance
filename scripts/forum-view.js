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
   , _commentAdd = {}

   // Object Lists
   , _master = { items: [], posts: [], comments: [], forums: [] }
   , _exports = {}
   , _commentCache = []
   , _postCache = []
   , _postList = []
   , _commentList = []
   , _forumHandle

   // Variables
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))

   // Functions
   , toDate = dmz.util.timeStampToDate
//   , _htmlLink
   , _setupView
   , _updatePostedBy
   , _updatePostedAt
   , _updateMessage
   , _addPost
   , _addComment
   , _addCommentClicked
   , _createPost
   , _createComment
   , _refresh
   , _reset
   , _load
   , _updateForumForUser
   ;

(function () {

   var content = _scrollArea.widget()
     , avatar = _view.lookup("avatarLabel")
     ;

   if (content) {

      content.layout(_mainLayout);
      _mainLayout.addStretch(1);
   }

   if (avatar) { avatar.pixmap(AvatarDefault); }
}());

//_htmlLink = function (text) { return "<a href=\"javascript://\">"+ text + "</a>"; };

_addPost = function (postHandle) {

   var post = { handle: postHandle }
     , comment
     , layout
     , label
     , form
     ;

   post.layout = dmz.ui.layout.createGridLayout();
   post.layout.property("spacing", 4);
   post.layout.margins(4);
   post.layout.columnMinimumWidth(0, 58);

   _mainLayout.insertLayout(0, post.layout);
   _mainLayout.property("spacing", 4);
   _mainLayout.margins(4);

   post.showComments = false;
   post.commentList = [];

   post.item = _postCache.pop();
   if (!post.item) { post.item = dmz.ui.loader.load("PostItem"); }

   post.avatar = post.item.lookup("avatarLabel");
   post.avatar.pixmap(AvatarDefault);

   post.postedBy = post.item.lookup("postedByLabel");
   post.postedAt = post.item.lookup("postedAtLabel");
   post.message = post.item.lookup("messageLabel");
///   post.commentCountLabel = post.item.lookup("commentCountLabel");
//   post.widget = dmz.ui.widget.create();
   post.layout.addWidget(post.item, 0, 0, 1, 2);
   post.item.show();

//   post.toggleComments = function () {

//      post.showComments = !post.showComments;

//      Object.keys(post.commentList).forEach(function(key) {

//         var comment = post.commentList[key];
//         if (comment && comment.item) { comment.item.visible(post.showComments); }
//      });
//   };

   _postList[postHandle] = post;

//   post.commentCountLabel.observe(self, "linkActivated", post.toggleComments);

   post.item.observe(self, "commentAddLabel", "linkActivated", function (link) {

//      _mainLayout.removeLayout(post.layout);
//      post.layout.setParent();
//      _mainLayout.insertLayout(0, post.layout);
//      _scrollArea.ensureVisible(post.item);

      _addCommentClicked (postHandle);
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
//      comment.item.visible(post.showComments);
      comment.item.show();

//      post.commentCountLabel.text(_htmlLink(post.commentList.length + " Comments"));

      _commentList[commentHandle] = comment;

      comment.item.observe(self, "commentAddLabel", "linkActivated", function (link) {

         _addCommentClicked (postHandle);
      });

      _updatePostedBy(commentHandle);
      _updatePostedAt(commentHandle);
      _updateMessage(commentHandle);
   }
};

_addCommentClicked = function (postHandle) {

   var show
     , post = _postList[postHandle]
     ;

   if (!_commentAdd.form) {

      _commentAdd.form = dmz.ui.loader.load("CommentAdd");
      _commentAdd.textEdit = _commentAdd.form.lookup("textEdit");
      _commentAdd.avatar = _commentAdd.form.lookup("avatarLabel");
      _commentAdd.avatar.pixmap(AvatarDefault);

      _commentAdd.form.observe(self, "submitButton", "clicked", function () {

         var textEdit = _commentAdd.textEdit
           , form = _commentAdd.form
           , post = _commentAdd.post
           , message
           ;

         if (post) {

            if (textEdit) {

               message = textEdit.text();
               if (message) { _createComment (post.handle, message); }
               textEdit.clear();
            }

            post.layout.removeWidget(form);
            _commentAdd.post = false;
         }

         form.hide();
         _postTextEdit.setFocus();
      });

      _commentAdd.form.observe(self, "cancelButton", "clicked", function () {

         if (_commentAdd.textEdit) { _commentAdd.textEdit.clear(); }
         if (_commentAdd.post) { _commentAdd.post.layout.removeWidget(_commentAdd.form); }
         _commentAdd.post = false;
         _commentAdd.form.hide();
         _postTextEdit.setFocus();
      });
   }

   if (_commentAdd.form.visible()) {

      if (_commentAdd.post.handle !== post.handle) {

         _commentAdd.form.hide();
         _commentAdd.post.layout.removeWidget(_commentAdd.form);
         _commentAdd.post = false;
         show = true;
      }
      else { _commentAdd.textEdit.setFocus(); }

   }
   else { show = true; }

   if (show) {

//         if (!post.showComments) { post.toggleComments(); }

      post.layout.addWidget(_commentAdd.form, post.layout.rowCount(), 1);
      _commentAdd.form.show();
      _commentAdd.post = post;

      dmz.time.setTimer(self, 0.1, function () {

         _scrollArea.ensureVisible(_commentAdd.form);
         _commentAdd.textEdit.setFocus();
      });
   }
};

_updatePostedBy = function (handle) {

   var item = _postList[handle]
     , data = _master.posts[handle]
     ;

   if (!item) {

      item = _commentList[handle];
      data = _master.comments[handle];
   }

   if (item && item.postedBy && data && data.postedBy) {

      item.postedBy.text ("<b>" + data.postedBy + "</b>");
   }
};

_updatePostedAt = function (handle) {

   var item = _postList[handle]
     , data = _master.posts[handle];
     ;

   if (!item) {

      item = _commentList[handle];
      data = _master.comments[handle];
   }

   if (item && item.postedAt && data && data.postedAt) {

      item.postedAt.text("<span style=\"color:#939393;\">" + data.postedAt + "</span>");
   }
};

_updateMessage = function (handle) {

   var item = _postList[handle]
     , data = _master.posts[handle]
     ;

   if (!item) {

      item = _commentList[handle];
      data = _master.comments[handle];
   }

   if (item && item.message && data && data.message) { item.message.text(data.message); }
};

_createPost = function (parent, message) {

   var post
     , item
     , hil = dmz.object.hil()
     ;

   if (hil && parent && message) {

      post = dmz.object.create(dmz.stance.PostType);
      dmz.object.text(post, dmz.stance.TextHandle, message);
      dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
      dmz.object.link(dmz.stance.ParentHandle, post, parent);
      dmz.object.link(dmz.stance.CreatedByHandle, post, hil);
      dmz.object.activate(post);

      item = _postList[post];
      if (item) { _scrollArea.ensureVisible (item.item); }
   }
};

_createComment = function (parent, message) {

   var comment
     , item
     , hil = dmz.object.hil()
     ;

   if (hil && parent && message) {

      comment = dmz.object.create(dmz.stance.CommentType);
      dmz.object.text(comment, dmz.stance.TextHandle, message);
      dmz.object.timeStamp(comment, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
      dmz.object.link(dmz.stance.ParentHandle, comment, parent);
      dmz.object.link(dmz.stance.CreatedByHandle, comment, hil);
      dmz.object.activate(comment);

      item = _commentList[comment];
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

_updateForumForUser = function (userHandle) {

   var forumHandle
     , forumList
     , forum
     , group
     ;

   group = dmz.stance.getUserGroupHandle(userHandle);

   forumList = _master.forums.filter(function (element, index) {

      return element.group === group;
   });

   forum = forumList.pop();
   if (forum) { forumHandle = forum.handle; }

   if (forumHandle !== _forumHandle) {

      _reset ();
      _forumHandle = forumHandle;

      if (_forumHandle) { _load(); }
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
      else if (type.isOfType(dmz.stance.CommentType)) { _master.comments[handle] = obj; }
      else if (type.isOfType(dmz.stance.ForumType)) { _master.forums[handle] = obj; }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtGameTimeHandle,
function (handle, attr, value) {

   var item = _master.posts[handle]
     , timeStamp = toDate(value).toString("F")
//     , timeStamp = toDate(value).toString("MM/dd/yy at hh:mm tt")
//     , timeStamp = toDate(value).toString("MMM dd, yyyy - hh:mm tt")
     ;

   if (!item) { item = _master.comments[handle]; }
   if (item) { item.postedAt = "-  " + timeStamp; }

   _updatePostedAt(handle);
});

dmz.object.text.observe(self, dmz.stance.TextHandle, function (handle, attr, value) {

   var item = _master.posts[handle];

   if (!item) { item = _master.comments[handle]; }
   if (item) { item.message = value; }

   _updateMessage(handle);
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var item = _master.posts[superHandle];

   if (!item) { item = _master.comments[superHandle]; }
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

   var type = dmz.object.type(superHandle)
     , item
     , parent
     ;

   if (type) {

      if (type.isOfType(dmz.stance.PostType)) {

         item = _master.posts[superHandle];
         parent = _master.forums[subHandle];

         if (item && parent) { item.forum = subHandle; }

         if (subHandle === _forumHandle) { _addPost(superHandle); }
      }
      else if (type.isOfType(dmz.stance.CommentType)) {

         item = _master.comments[superHandle];
         parent = _master.posts[subHandle];

         if (item && parent) { item.post = subHandle; }

         if (parent && (parent.forum === _forumHandle)) { _addComment(subHandle, superHandle); }
      }
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

      if (value) { _updateForumForUser(objHandle); }
      else { _updateForumForUser(); }
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      module.addPage ("Forum", _view, function () {

         if (!_forumHandle) { _updateForumForUser(dmz.object.hil()); }
      });
   }
});
