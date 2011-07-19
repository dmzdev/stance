var dmz =
   { defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , util: require("dmz/types/util")
   }
   , _exports = {}

   , ObjectTypes =
      { AdvisorType: dmz.objectType.lookup("advisor")
      , EmailType: dmz.objectType.lookup("email")
      , ForumType: dmz.objectType.lookup("forum")
      , GameType: dmz.objectType.lookup("game")
      , GroupType: dmz.objectType.lookup("group")
      , LobbyistType: dmz.objectType.lookup("lobbyist")
      , MemoType: dmz.objectType.lookup("media-memo")
      , NewspaperType: dmz.objectType.lookup("media-newspaper")
      , PinType: dmz.objectType.lookup("map_push_pin")
      , PostType: dmz.objectType.lookup("post")
      , CommentType: dmz.objectType.lookup("comment")
      , QuestionType: dmz.objectType.lookup("question")
      , AnswerType: dmz.objectType.lookup("answer")
      , UserType: dmz.objectType.lookup("user")
      , VideoType: dmz.objectType.lookup("media-video")
      , VoteType: dmz.objectType.lookup("vote")
      , DecisionType: dmz.objectType.lookup("decision")
      }

   , Handles =
      { ActiveHandle: dmz.defs.createNamedHandle("Active")
      , AdminHandle: dmz.defs.createNamedHandle("admin_user")
      , AdvisorGroupHandle: dmz.defs.createNamedHandle("advisor_group")
      , BioHandle: dmz.defs.createNamedHandle("bio")
      , CommentHandle: dmz.defs.createNamedHandle("comment")
      , CreatedByHandle: dmz.defs.createNamedHandle("created_by")
      , DisplayNameHandle: dmz.defs.createNamedHandle("display_name")
      , DurationHandle: dmz.defs.createNamedHandle("duration")
      , ForumLink: dmz.defs.createNamedHandle("group_forum_link")
      , GameGroupHandle: dmz.defs.createNamedHandle("game_group")
      , GameForumsHandle: dmz.defs.createNamedHandle("game_forums")
//      , GameMediaHandle: dmz.defs.createNamedHandle("game_media")
      , GameUngroupedUsersHandle: dmz.defs.createNamedHandle("game_ungrouped_users")
      , GroupMembersHandle: dmz.defs.createNamedHandle("group_members")
      , ID: dmz.defs.createNamedHandle("id")
      , NameHandle: dmz.defs.createNamedHandle("name")
      , ParentHandle: dmz.defs.createNamedHandle("parent")
      , PictureHandle: dmz.defs.createNamedHandle("picture")
      , EmailRecipientHandle: dmz.defs.createNamedHandle("email_recipient")
      , SentHandle: dmz.defs.createNamedHandle("sent")
      , TextHandle: dmz.defs.createNamedHandle("text")
      , TitleHandle: dmz.defs.createNamedHandle("title")
      , VisibleHandle: dmz.defs.createNamedHandle("visible")
      , BackgroundImageHandle: dmz.defs.createNamedHandle("background_image")
      , MapImageHandle: dmz.defs.createNamedHandle("map_image")
      , ComputerImageHandle: dmz.defs.createNamedHandle("computer_image")
      , TVImageHandle: dmz.defs.createNamedHandle("tv_image")
      , NewspaperImageHandle: dmz.defs.createNamedHandle("newspaper_image")
      , InboxImageHandle: dmz.defs.createNamedHandle("inbox_image")
      , PhoneImageHandle: dmz.defs.createNamedHandle("phone_image")
      , AdvisorImageHandle: dmz.defs.createNamedHandle("advisor_image")
      , AdvisorImageCountHandle: dmz.defs.createNamedHandle("advisor_image_count")
      , ExitImageHandle: dmz.defs.createNamedHandle("exit_image")
      , ResourceImageHandle: dmz.defs.createNamedHandle("resource_image")
      , VoteImageHandle: dmz.defs.createNamedHandle("vote_image")
      , CalendarImageHandle: dmz.defs.createNamedHandle("calendar_image")
      , ForumTimeHandle: dmz.defs.createNamedHandle("forum_time")

     , PositionHandle: dmz.defs.createNamedHandle("position")
     , GroupPinHandle: dmz.defs.createNamedHandle("group_pin")
     , ObjectHandle: dmz.defs.createNamedHandle("objectHandle")
//      , DisabledHandle: dmz.defs.createNamedHandle("disabled")
//      , PinCountHandle: dmz.defs.createNamedHandle("pin_count")
//      , PinActiveHandle: dmz.defs.createNamedHandle("Pin_Active")
//      , PinIDHandle: dmz.defs.createNamedHandle("pinID")
//      , PinTitleHandle: dmz.defs.createNamedHandle("pinTitle")
//      , PinDescHandle: dmz.defs.createNamedHandle("pinDescription")
//      , PinFileHandle: dmz.defs.createNamedHandle("pinFile")
//      , PinGroupCountHandle: dmz.defs.createNamedHandle("pinGroupCountHandle")


      , VoteLinkHandle: dmz.defs.createNamedHandle("vote_link")
      , QuestionLinkHandle: dmz.defs.createNamedHandle("question_link")
      , VoteState: dmz.defs.createNamedHandle("vote_state")
      , TotalHandle: dmz.defs.createNamedHandle("total")
      , ExpireHandle: dmz.defs.createNamedHandle("expire")

      , MediaHandle: dmz.defs.createNamedHandle("game_media")

      /* Time handles, and handles to be removed later */
      , UpdateTimeHandle: dmz.defs.createNamedHandle("update_time_handle")
      , CreatedAtServerTimeHandle: dmz.defs.createNamedHandle("created_at_server_time")
      , CreatedAtGameTimeHandle: dmz.defs.createNamedHandle("created_at_game_time")
      , GameStartTimeHandle: dmz.defs.createNamedHandle("game_start_time")
      , InGameStartTimeHandle: dmz.defs.createNamedHandle("in_game_start_time")
      , ServerTimeHandle: dmz.defs.createNamedHandle("server_time")
      }

   , Functions =
      { getDisplayName: false
      , getAuthorName: false
      , getAuthorHandle: false
      , getUserGroupHandle: false
      , addUITextLimit: false
      , getVoteStatus: false
      }

   , getDisplayName
   , getAuthorHandle
   , getAuthorName
   , getUserGroupHandle
   , getVoteStatus
   , addUITextLimit
   ;

getVoteStatus = function (handle) {

   var status = "E: " + handle
     , Active = dmz.object.flag(handle, Handles.ActiveHandle)
     , Submitted = dmz.object.flag(handle, Handles.VoteSubmittedHandle)
     , Approved = dmz.object.flag(handle, Handles.VoteApprovedHandle)
     , Result = dmz.object.flag(handle, Handles.VoteResultHandle)
     , noHandleList = dmz.object.subLinks(handle, Handles.VoteNoHandle)
     ;

   if (Active) {

      if (Submitted) { status = "SBMITD"; }
      else {

         if (Approved) { status = "ACTIVE"; }
         else { status = "DENIED"; }
      }
   }
   else {

      if (Result) { status = "PASSED"; }
      else if (!noHandleList) { status = "DENIED"; }
      else { status = "FAILED"; }
   }
   return status;
};

getDisplayName = function (handle) {

   var name = dmz.object.text (handle, Handles.DisplayNameHandle);
   if (!name || (name === undefined)) { name = dmz.object.text (handle, Handles.NameHandle); }
   return name;
};

getAuthorHandle = function (handle) {

   var parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle)
     , parent
     ;

   parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle);
   if (parentLinks) { parent = parentLinks[0]; }

   return parent;
};

getAuthorName = function (handle) { return getDisplayName(getAuthorHandle(handle)); }

getUserGroupHandle = function (userHandle) {

   var userGroupHandle = 0
     , retval = 0
     ;
   if (userHandle) {

      userGroupHandle = dmz.object.superLinks(userHandle, Handles.GroupMembersHandle);
      if (userGroupHandle && userGroupHandle[0]) { retval = userGroupHandle[0]; }
   }
   return retval;
};

addUITextLimit = function (script, maxLength, target, submitButton, current, total) {

   if (script && maxLength && target && current && total) {

      total.text(maxLength);
      current.text(maxLength);
      target.observe(script, "textChanged", function (textWidget) {

         var length = textWidget.text().length
           , color = "black"
           ;

         submitButton.enabled(length <= maxLength);
         if (length > maxLength) { color = "red"; }
         else if (length > (maxLength / 2)) { color = "blue"; }
         else if (length > (maxLength / 4)) { color = "green"; }
         current.text("<font color="+color+">"+(maxLength - length)+"</font>");
      });
   }
};

Functions.getDisplayName = getDisplayName;
Functions.getAuthorHandle = getAuthorHandle;
Functions.getAuthorName = getAuthorName;
Functions.getUserGroupHandle = getUserGroupHandle;
Functions.addUITextLimit = addUITextLimit;
Functions.getVoteStatus = getVoteStatus;

(function () {

   Object.keys(ObjectTypes).forEach(function (objectTypeName) {

      dmz.util.defineConst(exports, objectTypeName, ObjectTypes[objectTypeName]);
   });

   Object.keys(Handles).forEach(function (handleName) {

      dmz.util.defineConst(exports, handleName, Handles[handleName]);
   });

   Object.keys(Functions).forEach(function (fncName) {

      dmz.util.defineConst(exports, fncName, Functions[fncName]);
   });

}());
