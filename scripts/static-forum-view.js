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
       }

   // Consts
   , AVATAR_HEIGHT = 50
   , AVATAR_WIDTH = 50
   ;

dmz.util.defineConst(exports, "setupForumView", function (forumData) {

   var retData = { update: false, onHome: false, widget: false, observers: {} }
     , content
     , avatar
        // UI elements
     , _view = false
     , _scrollArea = false
     , _mainLayout = false
     , _postTextEdit = false
     , _submitButton = false
     , _commentAdd = false
     , _NoPostWarning =
          dmz.ui.messageBox.create(
             { type: dmz.ui.messageBox.Warning
              , text: "You must log in to the server to add new posts!"
              , informativeText: "If you want to add a new post, please restart STANCE."
              , standardButtons: [dmz.ui.messageBox.Ok]
              , defaultButton: dmz.ui.messageBox.Ok
              }
              , dmz.ui.mainWindow.centralWidget()
              )

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
     , IsCurrentWindow = false
     , MaxMessageLength = 0

     , _Self
     , _PostType
     , _CommentType
     , _ForumType
     , _ParentLinkHandle
     , _ForumLinkHandle
     , _UseForumDataForAdmin

     , _LatestTimeStamp = 0

     // Functions
     , _CanReplyTo
     , _CanPost
     , _Highlight
     , _ExtraInfo
     , _OnNewPost

     , toDate = dmz.util.timeStampToDate
     , _setupView
     , _updatePostedBy
     , _updatePostedAt
     , _updateMessage
     , _updateExtraInfo
     , _addPost
     , _addComment
     , _addCommentClicked
     , _createPost
     , _createComment
     , _refresh
     , _reset
     , _load
     , _updateForumForUser
     , _setUserAvatar
     ;

   _Self = forumData.self;
   _PostType = forumData.postType;
   _CommentType = forumData.commentType;
   _ForumType = forumData.forumType;
   _ForumLinkHandle = forumData.groupLinkHandle;
   _ParentLinkHandle = forumData.parentHandle;
   _CanReplyTo = forumData.canReplyTo;
   _CanPost = forumData.canPost;
   _UseForumDataForAdmin = forumData.useForumData;
   _Highlight = forumData.highlight;
   _ExtraInfo = forumData.extraInfo ? forumData.extraInfo : function () { return ""; };
   _OnNewPost = forumData.onNewPost ? forumData.onNewPost : function () {};

   MaxMessageLength = forumData.messageLength;

   if (_Self && _PostType && _CommentType && _ForumType && _ParentLinkHandle &&
      _CanReplyTo && _CanPost && _Highlight) {

      _view = dmz.ui.loader.load("ForumView.ui");
      retData.widget = _view;
      _scrollArea = _view.lookup("scrollArea");
      _mainLayout = dmz.ui.layout.createVBoxLayout();
      _postTextEdit = _view.lookup("postTextEdit");
      _submitButton = _view.lookup("postSubmitButton");
      _commentAdd = {};

      content = _scrollArea.widget();
      avatar = _view.lookup("avatarLabel");

      if (content) {

         content.layout(_mainLayout);
         _mainLayout.addStretch(1);
      }

      if (avatar) { avatar.pixmap(AvatarDefault); }

      dmz.stance.addUITextLimit
         ( _Self
         , MaxMessageLength
         , _view.lookup("postTextEdit")
         , _view.lookup("postSubmitButton")
         , _view.lookup("currentCharAmt")
         , _view.lookup("totalCharAmt")
         );

      _setUserAvatar = function (userHandle, labelWidget) {

         var avatar = AvatarDefault
           , resource
           ;

         if (labelWidget) {

            if (userHandle) {

               resource = dmz.object.text(userHandle, dmz.stance.PictureHandle);
               resource = dmz.resources.findFile(resource);
               if (resource) { avatar = dmz.ui.graph.createPixmap(resource); }
               if (avatar) { avatar = avatar.scaled(50, 50); }
            }
            labelWidget.pixmap(avatar);
         }
      };

      _updateExtraInfo =  function (handle) {

         var item = _postList[handle]
           , info
           ;

         if (!item) { item = _commentList[handle]; }
         if (item) {

            info = _ExtraInfo(handle);
            _Self.log.warn ("uEI:", handle, info);
            if (info && info.length && item.extra) {

               item.extra.text (info);
               item.extra.show();
            }
            else if (item.extra) { item.extra.hide(); }
         }
      };

      retData.updateExtraInfo = _updateExtraInfo;
      _addPost = function (postHandle) {

         var post = { handle: postHandle }
           , comment
           , layout
           , label
           , form
           , count
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
         post.unread = post.item.lookup("unreadLabel");
         post.unread.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify")));
         post.unread.hide();

         post.postedBy = post.item.lookup("postedByLabel");
         post.postedAt = post.item.lookup("postedAtLabel");
         post.message = post.item.lookup("messageLabel");
         post.extra = post.item.lookup("extraInfoLabel");
         post.extra.hide();
         post.commentAddLabel = post.item.lookup("commentAddLabel");
         post.layout.addWidget(post.item, 0, 0, 1, 2);
         post.item.show();

         _postList[postHandle] = post;

         if (_CanReplyTo(postHandle)) {

            post.commentAddLabel.observe(_Self, "linkActivated", function (link) {

               _addCommentClicked (postHandle);
            });
         }
         else { post.commentAddLabel.hide(); }

         _updatePostedBy(postHandle);
         _updatePostedAt(postHandle);
         _updateMessage(postHandle);
         _Self.log.warn ("call UEI", postHandle);
         _updateExtraInfo(postHandle);
         _Self.log.warn ("leaving UEI", postHandle);
      };

      _addComment = function (postHandle, commentHandle) {

         var post = _postList[postHandle]
           , comment = {}
           , text
           , count
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
            comment.unread = comment.item.lookup("unreadLabel");
            comment.extra = comment.item.lookup("extraInfoLabel");
            comment.extra.hide();
            comment.commentAddLabel = comment.item.lookup("commentAddLabel");
            comment.unread.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify")));
            comment.unread.hide();

            post.commentList.push(comment);
            post.layout.addWidget(comment.item, post.layout.rowCount(), 1);
            comment.item.show();

            _commentList[commentHandle] = comment;

            if (_CanReplyTo(commentHandle)) {

               comment.commentAddLabel.observe(_Self, "linkActivated", function (link) {

                  _addCommentClicked (postHandle);
               });
            }
            else { comment.commentAddLabel.hide(); }

            _updatePostedBy(commentHandle);
            _updatePostedAt(commentHandle);
            _updateMessage(commentHandle);
            _Self.log.warn ("call comment UEI", commentHandle, dmz.object.type(commentHandle));
            _updateExtraInfo(commentHandle);
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
            _setUserAvatar(dmz.object.hil(), _commentAdd.avatar);

            dmz.stance.addUITextLimit
               ( _Self
               , MaxMessageLength
               , _commentAdd.textEdit
               , _commentAdd.form.lookup("submitButton")
               , _commentAdd.form.lookup("currentCharAmt")
               , _commentAdd.form.lookup("totalCharAmt")
               );

            _commentAdd.form.observe(_Self, "submitButton", "clicked", function () {

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

            _commentAdd.form.observe(_Self, "cancelButton", "clicked", function () {

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

            post.layout.addWidget(_commentAdd.form, post.layout.rowCount(), 1);
            _commentAdd.form.show();
            _commentAdd.post = post;

            dmz.time.setTimer(_Self, 0.1, function () {

               _scrollArea.ensureVisible(_commentAdd.form);
               _commentAdd.textEdit.setFocus();
            });
         }
         else { _NoPostWarning.open(_Self, function () {}); }
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

            if (_UseForumDataForAdmin &&
               dmz.object.flag(data.authorHandle, dmz.stance.AdminHandle)) {

               item.postedBy.text ("<b>" + dmz.stance.getDisplayName(_forumHandle) + "</b>");
               _setUserAvatar(_forumHandle, item.avatar);
            }
            else {

               item.postedBy.text ("<b>" + data.postedBy + "</b>");
               _setUserAvatar(data.authorHandle, item.avatar);
            }
         }
      };

      _updatePostedAt = function (handle) {

         var item = _postList[handle]
           , data = _master.posts[handle]
           , hil = dmz.object.hil()
           , count
           , time
           ;

         if (!item) {

            item = _commentList[handle];
            data = _master.comments[handle];
         }

         if (item && item.postedAt && data && data.postedAt) {

            item.postedAt.text(
               "<span style=\"color:#939393;\">- " +
               toDate(data.postedAt).toString("MMM-dd-yyyy hh:mm:ss tt") +
               "</span>"
               );
            if (data.postedAt && (data.postedAt > _LatestTimeStamp)) {

               item.unread.show();
               if (!IsCurrentWindow) { _Highlight(); }
            }
            else {
               item.unread.hide();

            }
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

            post = dmz.object.create(_PostType);
            _OnNewPost(post);
            dmz.object.text(post, dmz.stance.TextHandle, message);
            dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
            dmz.object.link(_ParentLinkHandle, post, parent);
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

            comment = dmz.object.create(_CommentType);
            dmz.object.text(comment, dmz.stance.TextHandle, message);
            dmz.object.timeStamp(comment, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
            dmz.object.link(_ParentLinkHandle, comment, parent);
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

            posts = dmz.object.superLinks(_forumHandle, _ParentLinkHandle);
            if (posts) {

               posts.forEach(function(postHandle) {

                  _addPost(postHandle);

                  var comments = dmz.object.superLinks(postHandle, _ParentLinkHandle);
                  if (comments) {

                     comments.forEach(function(commentHandle) {

                        _addComment(postHandle, commentHandle);
                     });
                  }
               });
            }
         }
      };

      _updateForumForUser = function (userHandle, forumHandle) {

         var forumHandle
           , forumList
           , forum
           , group
           , avatar = _view.lookup("avatarLabel")
           ;

         _Self.log.warn ("Update forum for user:", dmz.stance.getDisplayName(userHandle));
         group = dmz.stance.getUserGroupHandle(userHandle);

         if (avatar) { _setUserAvatar(userHandle, avatar); }
         forumList = _master.forums.filter(function (element, index) {

            return (element.group === group) &&
               (forumHandle ? (forumHandle === element.handle) : true);
         });

         forum = forumList.pop();
         if (!forumHandle && forum) { forumHandle = forum.handle; }

         if (forumHandle !== _forumHandle) {

            _reset ();
            _forumHandle = forumHandle;

            if (_forumHandle) { _load(); }
         }
      };

      dmz.time.setRepeatingTimer(_Self, 1, function () {

         var msg =
            "<font color=\"red\">This action can not be used while a " + _PostType +
            " is active.</font>";
         if (_CanPost(_forumHandle)) {

            if (_postTextEdit.text() === msg) { _postTextEdit.clear(); }
            _postTextEdit.enabled(true);
            _submitButton.enabled(true);
         }
         else {

            _postTextEdit.text(msg);
            _postTextEdit.enabled(false);
            _submitButton.enabled(false);
         }
      });

      _submitButton.observe(_Self, "clicked", function () {

         _createPost (_forumHandle, _postTextEdit.text());
         _postTextEdit.clear();
      });

      retData.observers.create = function (handle, type) {

         var obj = { handle: handle }
           ;

         if (type) {

            if (type.isOfType(_PostType)) { _master.posts[handle] = obj; }
            else if (type.isOfType(_CommentType)) { _master.comments[handle] = obj; }
            else if (type.isOfType(_ForumType)) { _master.forums[handle] = obj; }
         }
      };

//      dmz.object.create.observe(_Self, function (handle, type) {

//         var obj = { handle: handle }
//           ;

//         if (type) {

//            if (type.isOfType(_PostType)) { _master.posts[handle] = obj; }
//            else if (type.isOfType(_CommentType)) { _master.comments[handle] = obj; }
//            else if (type.isOfType(_ForumType)) { _master.forums[handle] = obj; }
//         }
//      });

      retData.observers.text = function (handle, attr, value) {

         var item = _master.posts[handle];

         if (!item) { item = _master.comments[handle]; }
         if (item) { item.message = value; }

         _updateMessage(handle);
      };

//      dmz.object.text.observe(_Self, dmz.stance.TextHandle, function (handle, attr, value) {

//         var item = _master.posts[handle];

//         if (!item) { item = _master.comments[handle]; }
//         if (item) { item.message = value; }

//         _updateMessage(handle);
//      });

      retData.observers.createdBy = function (linkObjHandle, attrHandle, superHandle, subHandle) {

         var item = _master.posts[superHandle];

         if (!item) { item = _master.comments[superHandle]; }
         if (item) {

            item.postedBy = dmz.stance.getDisplayName(subHandle);
            item.authorHandle = subHandle;
         }

         _updatePostedBy(superHandle);
      }
//      dmz.object.link.observe(_Self, dmz.stance.CreatedByHandle,
//      function (linkObjHandle, attrHandle, superHandle, subHandle) {

//         var item = _master.posts[superHandle];

//         if (!item) { item = _master.comments[superHandle]; }
//         if (item) {

//            item.postedBy = dmz.stance.getDisplayName(subHandle);
//            item.authorHandle = subHandle;
//         }

//         _updatePostedBy(superHandle);
//      });

      retData.observers.createdAt = function (handle, attr, value) {

         var item = _master.posts[handle];
         if (!item) { item = _master.comments[handle]; }
         if (item) { item.postedAt = value; }
         _updatePostedAt(handle);
      };

//      dmz.object.timeStamp.observe(_Self, dmz.stance.CreatedAtServerTimeHandle,
//      function (handle, attr, value) {

//         var item = _master.posts[handle];
//         if (!item) { item = _master.comments[handle]; }
//         if (item) { item.postedAt = value; }
//         _updatePostedAt(handle);
//      });

      retData.observers.forumLink = function (linkObjHandle, attrHandle, groupHandle, forumHandle) {

         var forum = _master.forums[forumHandle];
//         _Self.log.warn (_ForumLinkHandle, groupHandle, forumHandle, forum);
         if (forum) { forum.group = groupHandle; }
      };

//      dmz.object.link.observe(_Self, _ForumLinkHandle,
//      function (linkObjHandle, attrHandle, groupHandle, forumHandle) {

//         var forum = _master.forums[forumHandle];
//         _Self.log.warn (_ForumLinkHandle, groupHandle, forumHandle, forum);
//         if (forum) { forum.group = groupHandle; }
//      });

      retData.observers.parentLink = function (linkObjHandle, attrHandle, superHandle, subHandle) {

         var type = dmz.object.type(superHandle)
           , item
           , parent
           ;

         if (type) {

            if (type.isOfType(_PostType)) {

               item = _master.posts[superHandle];
               parent = _master.forums[subHandle];

               if (item && parent) { item.forum = subHandle; }

               if (subHandle === _forumHandle) { _addPost(superHandle); }
            }
            else if (type.isOfType(_CommentType)) {

               item = _master.comments[superHandle];
               parent = _master.posts[subHandle];

               if (item && parent) { item.post = subHandle; }

               if (parent && (parent.forum === _forumHandle)) { _addComment(subHandle, superHandle); }
            }
         }
      };
//      dmz.object.link.observe(_Self, _ParentLinkHandle,
//      function (linkObjHandle, attrHandle, superHandle, subHandle) {

//         var type = dmz.object.type(superHandle)
//           , item
//           , parent
//           ;

//         if (type) {

//            if (type.isOfType(_PostType)) {

//               item = _master.posts[superHandle];
//               parent = _master.forums[subHandle];

//               if (item && parent) { item.forum = subHandle; }

//               if (subHandle === _forumHandle) { _addPost(superHandle); }
//            }
//            else if (type.isOfType(_CommentType)) {

//               item = _master.comments[superHandle];
//               parent = _master.posts[subHandle];

//               if (item && parent) { item.post = subHandle; }

//               if (parent && (parent.forum === _forumHandle)) { _addComment(subHandle, superHandle); }
//            }
//         }
//      });

      retData.update = function (forumHandle) {

         IsCurrentWindow = true;
         if (!_forumHandle) { _updateForumForUser(dmz.object.hil(), forumHandle); }
      };

      retData.onHome = function () {

         var posts = dmz.object.superLinks(_forumHandle, _ParentLinkHandle);
         IsCurrentWindow = false;
         if (posts) {

            dmz.object.timeStamp(dmz.object.hil(), dmz.stance.ForumTimeHandle, _LatestTimeStamp);
            posts.forEach(function (postHandle) {

               _postList[postHandle].unread.hide();
               var comments = dmz.object.superLinks(postHandle, _ParentLinkHandle);
               if (comments) {

                  comments.forEach(function (commentHandle) {

                     if (_commentList[commentHandle]) {

                        _commentList[commentHandle].unread.hide();
                     }
                  });
               }
            });
         }
      };
   }
   else {

      _Self.log.error ("_PostType", forumData.postType);
      _Self.log.error ("_CommentType", forumData.commentType);
      _Self.log.error ("_ForumType", forumData.forumType);
      _Self.log.error ("_ForumLinkHandle", forumData.groupLinkHandle);
      _Self.log.error ("_ParentLinkHandle", forumData.parentHandle);
      _Self.log.error ("MaxMessageLength", forumData.messageLength);
      _Self.log.error ("_CanReplyTo", forumData.canReplyTo ? true : false);
      _Self.log.error ("_CanPost", forumData.canPost ? true : false);
      _Self.log.error ("_Highlight", forumData.highlight ? true : false);
   }

   return retData;
});
