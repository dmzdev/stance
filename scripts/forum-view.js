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
       , forumView: require("static-forum-view")
       }
   // Constants
   , EFF_COMM_COUNT_1 = 2 // Number of tagged forum posts for achievement
   , EFF_COMM_COUNT_2 = 4
   , EFF_COMM_COUNT_3 = 6

   // Variables
   , RetData = false
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , MaxMessageLength = 2000
   , userForumPostTable = {}
   , postList = {}
   ;


dmz.module.subscribe(self, "main", function (Mode, module) {

   var forumData;
   if (Mode === dmz.module.Activate) {

      forumData =
         { self: self
         , postType: dmz.stance.PostType
         , commentType: dmz.stance.CommentType
         , timeHandle: dmz.stance.ForumTimeHandle
         , forumType: dmz.stance.ForumType
         , parentHandle: dmz.stance.ParentHandle
         , groupLinkHandle: dmz.stance.ForumLink
         , showItemHasBeenTagged: true
         , highlight: function (handle) { module.highlight("Forum"); }
         , forumLabelText: "Post a Messege:"
         , canReplyTo: function () { return dmz.stance.isAllowed(dmz.object.hil(), dmz.stance.ForumPostFlag); }
         , postBlocked: function () {

              var allowed = dmz.stance.isAllowed(dmz.object.hil(), dmz.stance.ForumPostFlag);
              return allowed ? false : "You do not have permission to post here.";
           }
         , messageLength: MaxMessageLength
         };
      RetData = dmz.forumView.setupForumView(forumData);

      LoginSkippedMessage.subscribe(self, function (data) {

         LoginSkipped = true;
         RetData.hideTagButtons();
         RetData.hideDeleteButtons();
      });
      dmz.object.create.observe(self, function (handle, type) {

         var obj = { handle: handle };
         RetData.observers.create(handle, type);
         if (type.isOfType(dmz.stance.PostType) || type.isOfType(dmz.stance.CommentType)) {

            postList[handle] = obj;
         }
      });
      dmz.object.text.observe(self, dmz.stance.TextHandle, RetData.observers.text);
      dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle, RetData.observers.createdAt);
      dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
      function (linkObjHandle, attrHandle, superHandle, subHandle) {

         var authorHandle = subHandle
           , achievement
           , length
           ;
         if (postList[superHandle] &&
            dmz.stance.getTags(dmz.object.data(superHandle, dmz.stance.TagHandle)).length) {

            if (!userForumPostTable[authorHandle]) { userForumPostTable[authorHandle] = {}; }
            userForumPostTable[authorHandle][superHandle] = 1;

            length = Object.keys(userForumPostTable[authorHandle]).length;
            if (length >= EFF_COMM_COUNT_3) { achievement = dmz.stance.EffectiveCommunicatorThreeAchievement; }
            else if (length >= EFF_COMM_COUNT_2) { achievement = dmz.stance.EffectiveCommunicatorTwoAchievement; }
            else if (length >= EFF_COMM_COUNT_1) { achievement = dmz.stance.EffectiveCommunicatorOneAchievement; }

            if (achievement && !dmz.stance.hasAchievement(authorHandle, achievement)) {

               dmz.time.setTimer(self, function () { dmz.stance.unlockAchievement(authorHandle, achievement); });
            }
         }

         RetData.observers.createdBy(linkObjHandle, attrHandle, superHandle, subHandle);
      });
      dmz.object.link.observe(self, dmz.stance.ForumLink, RetData.observers.forumLink);
      dmz.object.link.observe(self, dmz.stance.ParentHandle, RetData.observers.parentLink);
      dmz.object.flag.observe(self, dmz.stance.ActiveHandle, RetData.observers.onActive);
      dmz.object.data.observe(self, dmz.stance.TagHandle, function (handle, attr, data) {

         var authorHandle
           , achievement = false
           , length = 0
           ;

         RetData.observers.tag(handle, attr, data);
         if (postList[handle]) {

            authorHandle = dmz.stance.getAuthorHandle(handle);
            if (authorHandle) {

               if (!userForumPostTable[authorHandle]) { userForumPostTable[authorHandle] = {}; }
               userForumPostTable[authorHandle][handle] = 1;

               length = Object.keys(userForumPostTable[authorHandle]).length;
               if (length >= EFF_COMM_COUNT_3) { achievement = dmz.stance.EffectiveCommunicatorThreeAchievement; }
               else if (length >= EFF_COMM_COUNT_2) { achievement = dmz.stance.EffectiveCommunicatorTwoAchievement; }
               else if (length >= EFF_COMM_COUNT_1) { achievement = dmz.stance.EffectiveCommunicatorOneAchievement; }

               if (achievement && !dmz.stance.hasAchievement(authorHandle, achievement)) {

                  dmz.stance.unlockAchievement(authorHandle, achievement);
               }
            }
         }
      });
      dmz.object.state.observe(self, dmz.stance.Permissions, RetData.observers.permissions);

      dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
      function (linkObjHandle, attrHandle, userHandle, groupHandle) {

         if (dmz.object.hil() === userHandle) {

            RetData.updateForUser(userHandle, 0, LoginSkipped);
            RetData.checkHighlight();
         }
      });

      dmz.object.flag.observe(self, dmz.object.HILAttribute,
      function (objHandle, attrHandle, value) {

         var type = dmz.object.type(objHandle);
         if (value && type && type.isOfType(dmz.stance.UserType)) {

            if (dmz.stance.isAllowed(objHandle, dmz.stance.DeletePostsFlag) && !LoginSkipped) {

               dmz.time.setTimer(self, function () {

                  RetData.showDeleteButtons();
               });
            }
            else { RetData.hideDeleteButtons(); }
            if (dmz.stance.isAllowed(objHandle, dmz.stance.TagDataFlag) && !LoginSkipped) {

               dmz.time.setTimer(self, function () {

                  RetData.showTagButtons();
               });
            }
            else {

               dmz.time.setTimer(self, function () {

                  RetData.hideTagButtons();
               });
            }
            RetData.updateForUser(objHandle, 0, LoginSkipped);
            RetData.checkHighlight();
         }
      });

      if (RetData && RetData.update && RetData.onHome && RetData.widget) {

         module.addPage
            ( "Forum"
            , RetData.widget
            , function (width, height) { RetData.update(); }
            , RetData.onHome
            );
      }
   }
});

