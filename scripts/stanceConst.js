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
      , UserType: dmz.objectType.lookup("user")
      , VideoType: dmz.objectType.lookup("media-video")
      , VoteType: dmz.objectType.lookup("vote")
      }

   , Handles =
      { ActiveHandle: dmz.defs.createNamedHandle("Active")
      , AdminHandle: dmz.defs.createNamedHandle("admin_user")
      , AdvisorGroupHandle: dmz.defs.createNamedHandle("advisor_group")
      , AdvisorActiveQuestionHandle: dmz.defs.createNamedHandle("advisor_active_question")
      , AdvisorAnsweredQuestionHandle: dmz.defs.createNamedHandle("advisor_answered_question")
      , BioHandle: dmz.defs.createNamedHandle("bio")
      , CommentHandle: dmz.defs.createNamedHandle("comment")
      , CreatedByHandle: dmz.defs.createNamedHandle("created_by")
      , CreatedAtServerTimeHandle: dmz.defs.createNamedHandle("created_at_server_time")
      , CreatedAtGameTimeHandle: dmz.defs.createNamedHandle("created_at_game_time")
      , DisplayNameHandle: dmz.defs.createNamedHandle("display_name")
      , DurationHandle: dmz.defs.createNamedHandle("duration")
      , ForumLink: dmz.defs.createNamedHandle("group_forum_link")
      , GameGroupHandle: dmz.defs.createNamedHandle("game_group")
      , GameForumsHandle: dmz.defs.createNamedHandle("game_forums")
      , GameMediaHandle: dmz.defs.createNamedHandle("game_media")
      , GameStartTimeHandle: dmz.defs.createNamedHandle("game_start_time")
      , GameUngroupedUsersHandle: dmz.defs.createNamedHandle("game_ungrouped_users")
      , GroupMembersHandle: dmz.defs.createNamedHandle("group_members")
      , GroupPermissionsHandle: dmz.defs.createNamedHandle("group_permissions")
      , GroupActiveVoteHandle: dmz.defs.createNamedHandle("group_active_vote")
      , GroupCompletedVotesHandle: dmz.defs.createNamedHandle("group_completed_votes")
      , ID: dmz.defs.createNamedHandle("id")
      , InGameStartTimeHandle: dmz.defs.createNamedHandle("in_game_start_time")
      , ActiveLobbyistHandle: dmz.defs.createNamedHandle("active_lobbyist")
      //, PreviousLobbyistHandle: dmz.defs.createNamedHandle("prev_lobbyist")
      , ActiveMemoHandle: dmz.defs.createNamedHandle("active_memo")
      , ViewedMemoHandle: dmz.defs.createNamedHandle("viewed_memo")
      , ActiveVideoHandle: dmz.defs.createNamedHandle("active_video")
      , ViewedVideoHandle: dmz.defs.createNamedHandle("viewed_video")
      , ActiveNewspaperHandle: dmz.defs.createNamedHandle("active_newspaper")
      , ViewedNewspaperHandle: dmz.defs.createNamedHandle("viewed_newspaper")
      , NameHandle: dmz.defs.createNamedHandle("name")
      , ParentHandle: dmz.defs.createNamedHandle("parent")
      , PictureDirectoryNameHandle: dmz.defs.createNamedHandle("pic_dir_name")
      , PictureFileNameHandle: dmz.defs.createNamedHandle("pic_file_name")
      , PictureHandle: dmz.defs.createNamedHandle("picture")
      , PostVisitedHandle: dmz.defs.createNamedHandle("post_visited")
      , EmailRecipientHandle: dmz.defs.createNamedHandle("email_recipient")
      , SentHandle: dmz.defs.createNamedHandle("sent")
      , ServerTimeHandle: dmz.defs.createNamedHandle("server_time")
      , TextHandle: dmz.defs.createNamedHandle("text")
      , TitleHandle: dmz.defs.createNamedHandle("title")
      , VisibleHandle: dmz.defs.createNamedHandle("visible")
      , VoteResultHandle: dmz.defs.createNamedHandle("vote_result")
      , VoteUndecidedHandle: dmz.defs.createNamedHandle("vote_undecided")
      , VoteYesHandle: dmz.defs.createNamedHandle("vote_yes")
      , VoteNoHandle: dmz.defs.createNamedHandle("vote_no")
      , VoteAdvisorHandle: dmz.defs.createNamedHandle("vote_advisor")
      , VoteSubmittedHandle: dmz.defs.createNamedHandle("vote_submitted")
      , VoteApprovedHandle: dmz.defs.createNamedHandle("vote_approved")
      , VoterTotalHandle: dmz.defs.createNamedHandle("voter_total")
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
      , ViewedQuestionHandle: dmz.defs.createNamedHandle("viewed_question")
      , Advisor0Handle: dmz.defs.createNamedHandle("advisor_0_data")
      , Advisor1Handle: dmz.defs.createNamedHandle("advisor_1_data")
      , Advisor2Handle: dmz.defs.createNamedHandle("advisor_2_data")
      , Advisor3Handle: dmz.defs.createNamedHandle("advisor_3_data")
      , Advisor4Handle: dmz.defs.createNamedHandle("advisor_4_data")
      , PinCountHandle: dmz.defs.createNamedHandle("pin_count")
      , ForumTimeHandle: dmz.defs.createNamedHandle("forum_time")
      , LastOnlineHandle: dmz.defs.createNamedHandle("last_online")
      , ViewedLobbyistHandle: dmz.defs.createNamedHandle("viewed_lobbyist")
      , DisabledHandle: dmz.defs.createNamedHandle("disabled")
      , GroupPinHandle: dmz.defs.createNamedHandle("groupPinHandle")
      , PinActiveHandle: dmz.defs.createNamedHandle("Pin_Active")
      , PinIDHandle: dmz.defs.createNamedHandle("pinID")
      , PinPositionHandle: dmz.defs.createNamedHandle("pinPosition")
      , PinTitleHandle: dmz.defs.createNamedHandle("pinTitle")
      , PinDescHandle: dmz.defs.createNamedHandle("pinDescription")
      , PinFileHandle: dmz.defs.createNamedHandle("pinFile")
      , PinObjectHandle: dmz.defs.createNamedHandle("pinObjectHandle")
      , PinGroupCountHandle: dmz.defs.createNamedHandle("pinGroupCountHandle")
      }

   , Functions =
      { getDisplayName: false
      , getAuthorName: false
      , getAuthorHandle: false
      , getUserGroupHandle: false
      , addUITextLimit: false
      }

   , getDisplayName
   , getAuthorHandle
   , getAuthorName
   , getUserGroupHandle
   , addUITextLimit
   ;


getDisplayName = function (handle) {

   var name = dmz.object.text (handle, Handles.DisplayNameHandle);
   if (!name || (name === undefined)) { name = dmz.object.text (handle, Handles.NameHandle); }
   return name;
}

getAuthorHandle = function (handle) {

   var parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle)
     , parent
     ;

   parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle);
   if (parentLinks) { parent = parentLinks[0]; }

   return parent;
}

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
