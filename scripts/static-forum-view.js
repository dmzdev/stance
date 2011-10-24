require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
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
   , RED_BUTTON = "* { background-color: red; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; }"
   , GREEN_BUTTON = "* { background-color: green; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; }"
   , YELLOW_BUTTON = "* { background-color: yellow; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; }"
   , TAG_MESSAGE = dmz.message.create("TagMessage")
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

     // Object Lists
     , _master = { items: [], posts: [], comments: [], forums: [] }
     , _exports = {}
     , _commentCache = []
     , _postCache = []
     , _postList = {}
     , _commentList = {}
     , _forumHandle

     // Variables
     , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
     , IsCurrentWindow = false
     , viewedWindow = false
     , MaxMessageLength = 0
     , MaxReplyLength = 0

     , _Self
     , _PostType
     , _CommentType
     , _ForumType
     , _ParentLinkHandle
     , _ForumLinkHandle
     , _UseForumDataForAdmin
     , _TimeHandle
     , _ShowTagButton = false
     , _ShowTagLabel = false
     , _EmailMod
     , _TechList
     , _LoginSkipped

     , _LatestTimeStamp = -1
     , _WasBlocked = false
     , _ShowDeleteButtons = false

     // Functions
     , _CanReplyTo
     , _PostBlocked
     , _Highlight
     , _CanHighlight
     , _OnNewPost
     , _unviewedHighlight

     , toDate = dmz.util.timeStampToDate
     , _setupView
     , _updatePostedBy
     , _updatePostedAt
     , _updateMessage
     , _updateTags
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
   _PostBlocked = forumData.postBlocked;
   _UseForumDataForAdmin = forumData.useForumData || function () { return false; };
   _TimeHandle = forumData.timeHandle;
   _Highlight = forumData.highlight;
   _CanHighlight = forumData.canHighlight || function () { return true; };
   _OnNewPost = forumData.onNewPost || function () {};
   _EmailMod = forumData.emailMod;
   _TechList = forumData.techList;

   MaxMessageLength = forumData.messageLength;
   MaxReplyLength = forumData.replyLength || MaxMessageLength;

   if (_Self && _PostType && _CommentType && _ForumType && _ParentLinkHandle &&
      _CanReplyTo && _PostBlocked && _Highlight && _TimeHandle && _CanHighlight) {

      _view = dmz.ui.loader.load("ForumView.ui");
      retData.widget = _view;
      _scrollArea = _view.lookup("scrollArea");
      retData.scrollArea = _scrollArea;
      retData.postArea = _view.lookup("postFrame");
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
               if (avatar) { avatar = avatar.scaled(AVATAR_WIDTH, AVATAR_HEIGHT); }
            }
            labelWidget.pixmap(avatar);
         }
      };

      _addPost = function (postHandle) {

         var post = { handle: postHandle }
           , comment
           , layout
           , label
           , form
           , count
           , pic
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
         post.close = post.item.lookup("closeButton");
         if (!_ShowDeleteButtons) { post.close.hide(); }
         post.cancel = post.item.lookup("cancelButton");
         post.close.styleSheet(RED_BUTTON);
         post.cancel.styleSheet(RED_BUTTON);
         post.cancel.hide();
         post.confirmDelete = false;
         post.tagButton = post.item.lookup("tagButton");
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile("tagButton"));
         if (pic) { post.tagButton.setIcon(pic); }
         post.tagButton.styleSheet(YELLOW_BUTTON);
         if (!_ShowTagButton) { post.tagButton.hide(); }
         post.tagLabel = post.item.lookup("tagLabel");
         if (!_ShowTagLabel) { post.tagLabel.hide(); }

         post.postedBy = post.item.lookup("postedByLabel");
         post.postedAt = post.item.lookup("postedAtLabel");
         post.message = post.item.lookup("messageLabel");
         post.commentAddLabel = post.item.lookup("commentAddLabel");
         post.layout.addWidget(post.item, 0, 0, 1, 2);
         post.item.show();

         _postList[postHandle] = post;

         post.cancel.observe(_Self, "clicked", function () {

            post.confirmDelete = false;
            post.cancel.hide();
            post.close.styleSheet(RED_BUTTON);
         });

         post.close.observe(_Self, "clicked", function () {;

            if (!post.confirmDelete) {

               post.confirmDelete = true;
               post.cancel.show();
               post.close.styleSheet(GREEN_BUTTON);
            }
            else {

               post.cancel.click();
               dmz.object.flag(post.handle, dmz.stance.ActiveHandle, false);
            }
         });

         post.tagButton.observe(_Self, "clicked", function () {

            TAG_MESSAGE.send(dmz.data.wrapHandle(postHandle));
         });

         if (_CanReplyTo(postHandle, _forumHandle)) {

            post.commentAddLabel.show();
            post.commentAddLabel.observe(_Self, "linkActivated", function (link) {

               _addCommentClicked (postHandle);
            });
         }
         else { post.commentAddLabel.hide(); }

         _updatePostedBy(postHandle);
         _updatePostedAt(postHandle);
         _updateMessage(postHandle);
         _updateTags(postHandle);
      };

      _addComment = function (postHandle, commentHandle) {

         var post = _postList[postHandle]
           , comment = {}
           , text
           , count
           , pic
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
            comment.commentAddLabel = comment.item.lookup("commentAddLabel");
            comment.unread.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify")));
            comment.unread.hide();
            comment.close = comment.item.lookup("closeButton");
            if (!_ShowDeleteButtons) { comment.close.hide(); }
            comment.cancel = comment.item.lookup("cancelButton");
            comment.close.styleSheet(RED_BUTTON);
            comment.cancel.styleSheet(RED_BUTTON);
            comment.cancel.hide();
            comment.confirmDelete = false;
            comment.tagButton = comment.item.lookup("tagButton");
            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile("tagButton"));
            if (pic) { comment.tagButton.setIcon(pic); }
            comment.tagButton.styleSheet(YELLOW_BUTTON);
            if (!_ShowTagButton) { comment.tagButton.hide(); }
            comment.tagLabel = comment.item.lookup("tagLabel");
            if (!_ShowTagLabel) { comment.tagLabel.hide(); }

            post.commentList.push(comment);
            post.layout.addWidget(comment.item, post.layout.rowCount(), 1);
            comment.item.show();

            _commentList[commentHandle] = comment;

            comment.cancel.observe(_Self, "clicked", function () {

               comment.confirmDelete = false;
               comment.cancel.hide();
               comment.close.styleSheet(RED_BUTTON);
            });

            comment.close.observe(_Self, "clicked", function () {;

               if (!comment.confirmDelete) {

                  comment.confirmDelete = true;
                  comment.cancel.show();
                  comment.close.styleSheet(GREEN_BUTTON);
               }
               else {

                  comment.cancel.click();
                  dmz.object.flag(comment.handle, dmz.stance.ActiveHandle, false);
               }
            });

            comment.tagButton.observe(_Self, "clicked", function () {

               TAG_MESSAGE.send(dmz.data.wrapHandle(commentHandle));
            });

            if (_CanReplyTo(commentHandle, _forumHandle)) {

               comment.commentAddLabel.show();
               comment.commentAddLabel.observe(_Self, "linkActivated", function (link) {

                  _addCommentClicked (postHandle);
               });
            }
            else { comment.commentAddLabel.hide(); }

            _updatePostedBy(commentHandle);
            _updatePostedAt(commentHandle);
            _updateMessage(commentHandle);
            _updateTags(commentHandle);
            if (!_CanReplyTo(postHandle, _forumHandle)) { post.commentAddLabel.hide(); }
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
            _commentAdd.cancel = _commentAdd.form.lookup("cancelButton");
            _setUserAvatar(dmz.object.hil(), _commentAdd.avatar);

            dmz.stance.addUITextLimit
               ( _Self
               , MaxReplyLength
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
                  delete post.addComment;
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
               delete post.addComment;
               _postTextEdit.setFocus();
            });
         }

         if (_commentAdd.form.visible()) {

            if (_commentAdd.post.handle !== post.handle) {

               _commentAdd.form.hide();
               _commentAdd.post.layout.removeWidget(_commentAdd.form);
               _commentAdd.post = false;
               delete post.addComment;
               show = true;
            }
            else { _commentAdd.textEdit.setFocus(); }

         }
         else { show = true; }

         if (show) {

            post.layout.addWidget(_commentAdd.form, post.layout.rowCount(), 1);
            post.addComment = _commentAdd.form;
            _commentAdd.form.show();
            _commentAdd.post = post;

            dmz.time.setTimer(_Self, 0.1, function () {

               _scrollArea.ensureVisible(_commentAdd.form);
               _commentAdd.textEdit.setFocus();
            });
         }
      };

      _updatePostedBy = function (handle) {

         var item = _postList[handle]
           , data = _master.posts[handle]
           , hil = dmz.object.hil()
           ;

         if (data) { _unviewedHighlight(data, hil); }

         if (!item) {

            item = _commentList[handle];
            data = _master.comments[handle];
         }

         if (data && data.postedBy) {

            if (item && item.postedBy) {

               if (_UseForumDataForAdmin(_forumHandle)) {

                  item.postedBy.text ("<b>" + dmz.stance.getDisplayName(_forumHandle) + "</b>");
                  _setUserAvatar(_forumHandle, item.avatar);
               }
               else {

                  item.postedBy.text ("<b>" + data.postedBy + "</b>");
                  _setUserAvatar(data.authorHandle, item.avatar);
               }
               if (data.postedAt && (data.postedAt > _LatestTimeStamp) &&
                  (data.authorHandle && (data.authorHandle !== hil))) {

                  item.unread.show();
                  if (!IsCurrentWindow && data.active &&
                     _CanHighlight(_master.forums, data.handle)) {

                     _Highlight();
                  }
               }
               else { item.unread.hide(); }
            }
            else { _unviewedHighlight(data, hil); }
         }
      };

      _updateTags = function (handle) {

         var item = _postList[handle]
           , data = _master.posts[handle]
           , str
           ;

         if (!item) {

            item = _commentList[handle];
            data = _master.comments[handle];
         }

         if (item && item.tagLabel) {

            if (data && data.tags) { item.tagLabel.text(data.tags.toString()); }
            else { item.tagLabel.text(""); }
         }
      };

      _updatePostedAt = function (handle) {

         var item = _postList[handle]
           , data = _master.posts[handle]
           , hil = dmz.object.hil()
           , count
           , time
           ;

         if (data) { _unviewedHighlight(data, hil); }

         if (!item) {

            item = _commentList[handle];
            data = _master.comments[handle];
         }

         if (data) {

            if (item && item.postedAt) {

               item.postedAt.text(
                  "<span style=\"color:#939393;\">- " +
                  (data.postedAt ? toDate(data.postedAt).toString(dmz.stance.TIME_FORMAT) : "Less than 5 min ago") +
                  "</span>");
               if (data.postedAt && (data.postedAt > _LatestTimeStamp) &&
                  (data.authorHandle && (data.authorHandle !== hil))) {

                  item.unread.show();
                  if (!IsCurrentWindow && data.active &&
                     _CanHighlight (_master.forums, data.handle)) {

                     _Highlight();
                  }
               }
               else { item.unread.hide(); }
            }
            else { _unviewedHighlight(data, hil); }
         }
      };

      _unviewedHighlight = function (data, hil) {

         var handle
           , forumHandle
           ;

         if (!viewedWindow) {

            if (hil && data.active && data.postedAt && (_LatestTimeStamp !== -1) &&
               (data.postedAt > _LatestTimeStamp) &&
               (data.authorHandle && (data.authorHandle !== hil))) {

               if (_master.comments[data.handle]) {

                  handle = (dmz.object.subLinks(data.handle, _ParentLinkHandle) || [])[0];
               }
               else if (_master.posts[data.handle]) { handle = data.handle; }
               forumHandle = (dmz.object.subLinks(handle, _ParentLinkHandle) || [])[0];

               if (forumHandle &&
                  _CanHighlight(_master.forums, data.handle) &&
                  dmz.object.linkHandle(
                     _ForumLinkHandle,
                     forumHandle,
                     dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

                  _Highlight(forumHandle);
               }
            }
         }
      };

      retData.setTimestamp = function (timestamp) { _LatestTimeStamp = timestamp; };

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
           , groupHandle = false
           , recipientList = []
           ;

         if (hil && parent && message) {

            post = dmz.object.create(_PostType);
            _OnNewPost(post);
            dmz.object.text(post, dmz.stance.TextHandle, message);
            dmz.object.flag(post, dmz.stance.ActiveHandle, true);
            dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, 0);
            dmz.object.flag(post, dmz.stance.UpdateStartTimeHandle, true);
            dmz.object.link(_ParentLinkHandle, post, parent);
            dmz.object.link(dmz.stance.CreatedByHandle, post, hil);
            dmz.object.activate(post);
            if (_EmailMod && _TechList) {

               if (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.TECH_PERMISSION) {

                  groupHandle = dmz.stance.getUserGroupHandle(hil);
                  if (groupHandle) {

                     recipientList = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle) || [];
                     if (recipientList.indexOf(hil) !== -1) {

                        recipientList.splice(recipientList.indexOf(hil), 1);
                     }
                     recipientList = recipientList.concat(_TechList);
                     recipientList = recipientList.filter(function (userHandle) {

                        return dmz.object.flag(userHandle, dmz.stance.ActiveHandle);
                     });
                     _EmailMod.sendEmail
                        ( recipientList
                        , "STANCE Tech has posted to the help forum. (DO NOT REPLY)"
                        , "Post: " + message
                        );
                  }
               }
               else {

                  recipientList = _TechList;
                  recipientList = recipientList.filter(function (techHandle) {

                     return dmz.object.flag(techHandle, dmz.stance.ActiveHandle);
                  });
                  recipientList.push(hil);
                  _EmailMod.sendEmail
                     ( recipientList
                     , "STANCE User " + dmz.stance.getDisplayName(hil) +" has posted to the help forum. (DO NOT REPLY)"
                     , "Post: " + message
                     );
               }
            }

            item = _postList[post];
            if (item) { _scrollArea.ensureVisible (item.item); }
         }
      };

      _createComment = function (parent, message) {

         var comment
           , item
           , hil = dmz.object.hil()
           , parentAuthor
           , recipientList = []
           ;

         if (hil && parent && message) {

            comment = dmz.object.create(_CommentType);
            dmz.object.text(comment, dmz.stance.TextHandle, message);
            dmz.object.flag(comment, dmz.stance.ActiveHandle, true);
            dmz.object.timeStamp(comment, dmz.stance.CreatedAtServerTimeHandle, 0);
            dmz.object.flag(comment, dmz.stance.UpdateStartTimeHandle, true);
            dmz.object.link(_ParentLinkHandle, comment, parent);
            dmz.object.link(dmz.stance.CreatedByHandle, comment, hil);
            dmz.object.activate(comment);
            if (_EmailMod && _TechList) {

               parentAuthor = dmz.object.subLinks(parent, dmz.stance.CreatedByHandle) || [];
               if (parentAuthor.length) {

                  parentAuthor = parentAuthor[0];
                  recipientList.push(parentAuthor);
                  if (parentAuthor !== hil) { recipientList.push(hil); }
                  if (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.TECH_PERMISSION) {

                     if (dmz.object.scalar(parentAuthor, dmz.stance.Permissions) === dmz.stance.TECH_PERMISSION) {

                        _EmailMod.sendEmail
                           ( recipientList
                           , "STANCE Tech has followed up on his own help post. (DO NOT REPLY)"
                           , "Comment: " + message
                           );
                     }
                     else {

                        _EmailMod.sendEmail
                           ( recipientList
                           , "STANCE Tech has commented on a help post from " + dmz.stance.getDisplayName(parentAuthor) + ". (DO NOT REPLY)"
                           , "Comment: " + message
                           );
                     }
                  }
                  else {

                     if (dmz.object.scalar(parentAuthor, dmz.stance.Permissions) === dmz.stance.TECH_PERMISSION) {

                        _EmailMod.sendEmail
                           ( recipientList
                           , "STANCE User " + dmz.stance.getDisplayName(hil) + " has commented on the Tech's help post. (DO NOT REPLY)"
                           , "Comment: " + message
                           );
                     }
                     else {

                        _EmailMod.sendEmail
                           ( recipientList
                           , "STANCE User " + dmz.stance.getDisplayName(hil) + " has commented on a help post from " + dmz.stance.getDisplayName(parentAuthor) + ". (DO NOT REPLY)"
                           , "Comment: " + message
                           );
                     }
                  }
               }
            }

            item = _commentList[comment];
            if (item) { _scrollArea.ensureVisible (item.item); }
         }
      };

      _reset = function () {

         Object.keys(_postList).forEach(function (key) {

            var post = _postList[key];
            post.commentList.forEach(function (comment) {

               post.layout.removeWidget(comment.item);
               comment.item.hide();
               _commentCache.push (comment.item);
               delete post.commentList[comment.handle];
            });

            if (post.addComment) { post.addComment.cancel.click(); }
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

            posts = dmz.object.superLinks(_forumHandle, _ParentLinkHandle) || [];
            posts.forEach(function(postHandle) {

               if (_master.posts[postHandle].active) {

                  _addPost(postHandle);
                  var comments = dmz.object.superLinks(postHandle, _ParentLinkHandle) || [];
                  comments.forEach(function(commentHandle) {

                     if (_master.comments[commentHandle].active) {

                        _addComment(postHandle, commentHandle);
                     }
                  });
               }
            });
            viewedWindow = true;
         }
      };

      retData.checkHighlight = function () {

         var posts = dmz.object.superLinks(_forumHandle, _ParentLinkHandle) || []
           , latest = 0
           , hil = dmz.object.hil()
           ;

         _LatestTimeStamp = dmz.stance.userAttribute(hil, _TimeHandle) || 0;
         posts.forEach(function (postHandle) {

            var comments = dmz.object.superLinks(postHandle, _ParentLinkHandle) || []
              , timestamp = dmz.object.timeStamp(postHandle, dmz.stance.CreatedAtServerTimeHandle) || 0
              ;

            if (dmz.object.flag(postHandle, dmz.stance.ActiveHandle) && (timestamp > latest) &&
               !dmz.object.linkHandle(dmz.stance.CreatedByHandle, postHandle, hil) &&
               _CanHighlight(_master.forums, postHandle)) {

               latest = timestamp;
            }
            comments.forEach(function (commentHandle) {

               var timestamp = dmz.object.timeStamp(commentHandle, dmz.stance.CreatedAtServerTimeHandle) || 0;
               if (dmz.object.flag(commentHandle, dmz.stance.ActiveHandle) && (timestamp > latest) &&
                  !dmz.object.linkHandle(dmz.stance.CreatedByHandle, commentHandle, hil) &&
                  _CanHighlight(_master.forums, commentHandle)) {

                  latest = timestamp;
               }
            });
         });
         if (latest > _LatestTimeStamp) { _Highlight(); }
      };

      _updateForumForUser = function (userHandle, forumHandle, loginSkipped) {

         var forumList
           , forum
           , group
           , avatar = _view.lookup("avatarLabel")
           ;

         _ShowDeleteButtons = dmz.stance.isAllowed(userHandle, dmz.stance.DeletePostsFlag);
         _ShowTagButton = (dmz.stance.isAllowed(userHandle, dmz.stance.TagDataFlag) && !loginSkipped);
         _ShowTagLabel = dmz.stance.isAllowed(userHandle, dmz.stance.SeeTagFlag);
         _LatestTimeStamp = dmz.stance.userAttribute(userHandle, _TimeHandle) || 0;
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

      retData.updateForUser = _updateForumForUser;

      dmz.time.setRepeatingTimer(_Self, 1, function () {

         var msg = _PostBlocked(_forumHandle);
         if (!msg && _WasBlocked) {

            _postTextEdit.clear();
            _postTextEdit.enabled(true);
            _submitButton.enabled(true);
            _WasBlocked = false;
         }
         else if (msg) {

            _postTextEdit.text("<font color=\"red\">" + msg + "</font>");
            _postTextEdit.enabled(false);
            _submitButton.enabled(false);
            _WasBlocked = true;
         }
      });

      _submitButton.observe(_Self, "clicked", function () {

         _createPost (_forumHandle, _postTextEdit.text());
         _postTextEdit.clear();
      });

      retData.observers.create = function (handle, type) {

         var obj = { handle: handle, active: true };
         if (type) {

            if (type.isOfType(_PostType)) { _master.posts[handle] = obj; }
            else if (type.isOfType(_CommentType)) { _master.comments[handle] = obj; }
            else if (type.isOfType(_ForumType)) { _master.forums[handle] = obj; }
         }
      };

      retData.observers.text = function (handle, attr, value) {

         var item = _master.posts[handle];

         if (!item) { item = _master.comments[handle]; }
         if (item) { item.message = value; }

         _updateMessage(handle);
      };

      retData.observers.createdBy = function (linkObjHandle, attrHandle, superHandle, subHandle) {

         var item = _master.posts[superHandle];

         if (!item) { item = _master.comments[superHandle]; }
         if (item) {

            item.postedBy = dmz.stance.getDisplayName(subHandle);
            item.authorHandle = subHandle;
         }

         _updatePostedBy(superHandle);
      };

      retData.observers.createdAt = function (handle, attr, value) {

         var item = _master.posts[handle];
         if (!item) { item = _master.comments[handle]; }
         if (item) { item.postedAt = value; }
         _updatePostedAt(handle);
      };

      retData.observers.tag = function (handle, attr, value) {

         var item = _master.posts[handle];
         if (!item) { item = _master.comments[handle]; }
         if (item) {

            item.tags = dmz.stance.getTags(value);
            _updateTags(handle);
         }
      };

      retData.observers.forumLink = function (linkObjHandle, attrHandle, forumHandle, groupHandle) {

         var forum = _master.forums[forumHandle];
         if (forum) { forum.group = groupHandle; }
      };

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

               if ((subHandle === _forumHandle) && item.active) {

                  _addPost(superHandle);
               }
            }
            else if (type.isOfType(_CommentType)) {

               item = _master.comments[superHandle];
               parent = _master.posts[subHandle];

               if (item && parent) { item.post = subHandle; }

               if (parent && (parent.forum === _forumHandle) && item.active) {

                  if (!parent.active) {

                     dmz.object.flag(superHandle, dmz.stance.ActiveHandle, false);
                  }
                  else { _addComment(subHandle, superHandle); }

               }
            }
         }
      };

      retData.hideTagButtons = function () {

         Object.keys(_postList).forEach(function (key) {

            if (_postList[key].tagButton) {

               _postList[key].tagButton.hide();
            }
         });
         Object.keys(_commentList).forEach(function (key) {

            if (_commentList[key].tagButton) {

               _commentList[key].tagButton.hide();
            }
         });
      }

      retData.hideDeleteButtons = function () {

         Object.keys(_postList).forEach(function (key) {

            if (_postList[key].close) {

               _postList[key].close.hide();
            }
         });
         Object.keys(_commentList).forEach(function (key) {

            if (_commentList[key].close) {

               _commentList[key].close.hide();
            }
         });
      }

      retData.update = function (forumHandle) {

         IsCurrentWindow = true;
         if (!_forumHandle || forumHandle) {

            _updateForumForUser(dmz.object.hil(), forumHandle);
         }
      };

      retData.onHome = function () {

         var posts = dmz.object.superLinks(_forumHandle, _ParentLinkHandle)
           , latest = _LatestTimeStamp
           ;
         IsCurrentWindow = false;
         if (posts) {

            posts.forEach(function (postHandle) {

               var comments = dmz.object.superLinks(postHandle, _ParentLinkHandle) || []
                 , timestamp = dmz.object.timeStamp(postHandle, dmz.stance.CreatedAtServerTimeHandle)
                 ;

               if (_master.posts[postHandle].active) {

                  if (timestamp && (timestamp > latest)) { latest = timestamp; }
                  _postList[postHandle].unread.hide();
                  comments.forEach(function (commentHandle) {

                     var timestamp = dmz.object.timeStamp(commentHandle, dmz.stance.CreatedAtServerTimeHandle);
                     if (timestamp && (timestamp > latest)) { latest = timestamp; }
                     if (_commentList[commentHandle]) {

                        _commentList[commentHandle].unread.hide();
                     }
                  });
               }
            });
            dmz.stance.userAttribute(dmz.object.hil(), _TimeHandle, latest);
         }
      };

      retData.observers.permissions = function (handle, attr, value, prev) {

         if ((handle === dmz.object.hil()) && prev &&
            value.xor(prev).and(dmz.stance.TagDataFlag.or(dmz.stance.SeeTagFlag)).bool()) {

            _updateForumForUser(handle);
         }
      };

      retData.observers.onActive = function (handle, attr, value, prev) {

         var data = _master.posts[handle] || _master.comments[handle]
           , post = _postList[handle]
           , comment = _commentList[handle]
           ;

         if (data && data.active && !value) {

            data.active = false;
            if (post) {

               post.commentList.forEach(function (comment) {

                  _master.comments[comment.handle].active = false;
                  dmz.object.flag(comment.handle, dmz.stance.ActiveHandle, false);
               });
               _reset();
               _load();
            }
            else if (comment) {

               _reset();
               _load();
            }
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
      _Self.log.error ("_PostBlocked", forumData.postBlocked ? true : false);
      _Self.log.error ("_Highlight", forumData.highlight ? true : false);
   }

   return retData;
});
