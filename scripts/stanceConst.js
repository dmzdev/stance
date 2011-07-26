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
        , AnswerType: dmz.objectType.lookup("answer")
        , CommentType: dmz.objectType.lookup("comment")
        , DecisionType: dmz.objectType.lookup("decision")
        , EmailType: dmz.objectType.lookup("email")
        , ForumType: dmz.objectType.lookup("forum")
        , GameType: dmz.objectType.lookup("game")
        , GroupType: dmz.objectType.lookup("group")
        , LobbyistType: dmz.objectType.lookup("lobbyist")
        , MemoType: dmz.objectType.lookup("media-memo")
        , NewspaperType: dmz.objectType.lookup("media-newspaper")
        , PinType: dmz.objectType.lookup("map_push_pin")
        , PostType: dmz.objectType.lookup("post")
        , QuestionType: dmz.objectType.lookup("question")
        , UserType: dmz.objectType.lookup("user")
        , VideoType: dmz.objectType.lookup("media-video")
        , VoteType: dmz.objectType.lookup("vote")
        }

   , Handles =
        { ActiveHandle: dmz.defs.createNamedHandle("Active")
        , AdminHandle: dmz.defs.createNamedHandle("admin_user")
        , BioHandle: dmz.defs.createNamedHandle("bio")
        , CommentHandle: dmz.defs.createNamedHandle("comment")
        , CreatedByHandle: dmz.defs.createNamedHandle("created_by")
        , DisplayNameHandle: dmz.defs.createNamedHandle("display_name")
        , DurationHandle: dmz.defs.createNamedHandle("duration")
        , ID: dmz.defs.createNamedHandle("id")
        , NameHandle: dmz.defs.createNamedHandle("name")
        , ParentHandle: dmz.defs.createNamedHandle("parent")
        , PictureHandle: dmz.defs.createNamedHandle("picture")
        , SentHandle: dmz.defs.createNamedHandle("sent")
        , TextHandle: dmz.defs.createNamedHandle("text")
        , TitleHandle: dmz.defs.createNamedHandle("title")
        , VisibleHandle: dmz.defs.createNamedHandle("visible")
        , PositionHandle: dmz.defs.createNamedHandle("position")
        , TotalHandle: dmz.defs.createNamedHandle("total")
        , ExpireHandle: dmz.defs.createNamedHandle("expire")
        , ObjectHandle: dmz.defs.createNamedHandle("objectHandle")

        // Object-specific handles
        , ForumTimeHandle: dmz.defs.createNamedHandle("forum_time")
        , VoteState: dmz.defs.createNamedHandle("vote_state")
        , EmailRecipientHandle: dmz.defs.createNamedHandle("email_recipient")
        , PinTotalHandle: dmz.defs.createNamedHandle("pin_total")

        // Link Attr Handles
        , AdvisorGroupHandle: dmz.defs.createNamedHandle("advisor_group")
        , ForumLink: dmz.defs.createNamedHandle("group_forum_link")
        , GameGroupHandle: dmz.defs.createNamedHandle("game_group")
        , GameUngroupedUsersHandle: dmz.defs.createNamedHandle("game_ungrouped_users")
        , GroupMembersHandle: dmz.defs.createNamedHandle("group_members")
        , GroupPinHandle: dmz.defs.createNamedHandle("group_pin")
        , VoteLinkHandle: dmz.defs.createNamedHandle("vote_link")
        , YesHandle: dmz.defs.createNamedHandle("yes_link")
        , NoHandle: dmz.defs.createNamedHandle("no_link")
        , QuestionLinkHandle: dmz.defs.createNamedHandle("question_link")
        , MediaHandle: dmz.defs.createNamedHandle("game_media")

        /* Time handles, and handles to be removed later */
        , UpdateStartTimeHandle: dmz.defs.createNamedHandle("update_start_time_handle")
        , UpdateEndTimeHandle: dmz.defs.createNamedHandle("update_end_time_handle")
        , CreatedAtServerTimeHandle: dmz.defs.createNamedHandle("created_at_server_time")
        , EndedAtServerTimeHandle: dmz.defs.createNamedHandle("ended_at_server_time")

        , GameStartTimeHandle: dmz.defs.createNamedHandle("game_start_time")
        , GameEndTimeHandle: dmz.defs.createNamedHandle("game_end_time")
        , InGameStartTimeHandle: dmz.defs.createNamedHandle("in_game_start_time")
        , ServerTimeHandle: dmz.defs.createNamedHandle("server_time")
        , CreatedAtGameTimeHandle: dmz.defs.createNamedHandle("created_at_game_time")

        // Group Office Image handles
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
        }

   , Functions =
        { getDisplayName: false
        , getAuthorName: false
        , getAuthorHandle: false
        , getUserGroupHandle: false
        , addUITextLimit: false
        , getVoteStatus: false
        }

   , Constants =
        { VOTE_APPROVAL_PENDING: 0
        , VOTE_DENIED: 1
        , VOTE_ACTIVE: 2
        , VOTE_YES: 3
        , VOTE_NO: 4
        , VOTE_EXPIRED: 5
        , STATE_STR:
             [ "Submitted"
             , "Denied"
             , "Active"
             , "Passed"
             , "Failed"
             , "Expired"
             ]
         }
   , getDisplayName
   , getAuthorHandle
   , getAuthorName
   , getUserGroupHandle
   , getVoteStatus
   , addUITextLimit
   ;

getVoteStatus = function (handle) {

//   var status = "E: " + handle
//     , Active = dmz.object.flag(handle, Handles.ActiveHandle)
//     , Submitted = dmz.object.flag(handle, Handles.VoteSubmittedHandle)
//     , Approved = dmz.object.flag(handle, Handles.VoteApprovedHandle)
//     , Result = dmz.object.flag(handle, Handles.VoteResultHandle)
//     , noHandleList = dmz.object.subLinks(handle, Handles.VoteNoHandle)
//     ;

//   if (Active) {

//      if (Submitted) { status = "SBMITD"; }
//      else {

//         if (Approved) { status = "ACTIVE"; }
//         else { status = "DENIED"; }
//      }
//   }
//   else {

//      if (Result) { status = "PASSED"; }
//      else if (!noHandleList) { status = "DENIED"; }
//      else { status = "FAILED"; }
//   }
   return "ERROR";
};

getDisplayName = function (handle) {

   var name = dmz.object.text (handle, Handles.DisplayNameHandle);
   if (!name || (name === undefined)) { name = dmz.object.text (handle, Handles.NameHandle); }
   return name;
};

getAuthorHandle = function (handle) {

   var parentLinks = dmz.object.superLinks (handle, Handles.CreatedByHandle)
     , parent = (parentLinks && parentLinks.length) ? parentLinks[0] : undefined
     ;

   return parent;
};

getAuthorName = function (handle) { return getDisplayName(getAuthorHandle(handle)); }

getUserGroupHandle = function (userHandle) {

   var userGroupHandle = 0
     , retval = 0
     , type = dmz.object.type(userHandle)
     ;
   if (type && type.isOfType(ObjectTypes.UserType)) {

      userGroupHandle = dmz.object.subLinks(userHandle, Handles.GroupMembersHandle);
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

   Object.keys(Constants).forEach(function (fncName) {

      dmz.util.defineConst(exports, fncName, Constants[fncName]);
   });

}());
