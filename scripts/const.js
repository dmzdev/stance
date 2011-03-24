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
      , ForumType: dmz.objectType.lookup("forum")
      , GameType: dmz.objectType.lookup("game")
      , GroupType: dmz.objectType.lookup("group")
      , LobbyistType: dmz.objectType.lookup("lobbyist")
      , PinType: dmz.objectType.lookup("map_push_pin")
      , PostType: dmz.objectType.lookup("post")
      , QuestionType: dmz.objectType.lookup("question")
      , UserType: dmz.objectType.lookup("user")
      , VoteType: dmz.objectType.lookup("vote")
      }

   , Handles =
      { ActiveHandle: dmz.defs.createNamedHandle("Active")
      , ActivatedAt: dmz.defs.createNamedHandle("actived_at")
      , AdminFlagHandle: dmz.defs.createNamedHandle("admin_user")
      , AdvisorGroupHandle: dmz.defs.createNamedHandle("advisor_group")
      , AdvisorActiveQuestionHandle: dmz.defs.createNamedHandle("advisor_active_question")
      , AdvisorAnsweredQuestionHandle: dmz.defs.createNamedHandle("advisor_answered_question")
      , BioHandle: dmz.defs.createNamedHandle("bio")
      , CommentHandle: dmz.defs.createNamedHandle("comment")
      , CreatedByHandle: dmz.defs.createNamedHandle("created_by")
      , CreatedAtHandle: dmz.defs.createNamedHandle("created_at")
      , DisplayNameHandle: dmz.defs.createNamedHandle("display_name")
      , ForumLink: dmz.defs.createNamedHandle("group_forum_link")
      , GameGroupHandle: dmz.defs.createNamedHandle("game_group")
      , GameForumsHandle: dmz.defs.createNamedHandle("game_forums")
      , GameTimeHandle: dmz.defs.createNamedHandle("game_time")
      , GameTimeFactorHandle: dmz.defs.createNamedHandle("game_time_factor")
      , GameStartTimeHandle: dmz.defs.createNamedHandle("game_start_time")
      , GameUngroupedUsersHandle: dmz.defs.createNamedHandle("game_ungrouped_users")
      , GameUngroupedAdvisorsHandle: dmz.defs.createNamedHandle("game_ungrouped_advisors")
      , GameUngroupedLobbyistsHandle: dmz.defs.createNamedHandle("game_ungrouped_lobbyists")
      , GroupMembersHandle: dmz.defs.createNamedHandle("group_members")
      , GroupPermissionsHandle: dmz.defs.createNamedHandle("group_permissions")
      , GroupActiveVoteHandle: dmz.defs.createNamedHandle("group_active_vote")
      , GroupCompletedVotesHandle: dmz.defs.createNamedHandle("group_completed_votes")
      , ID: dmz.defs.createNamedHandle("id")
      , LobbyistGroupHandle: dmz.defs.createNamedHandle("lobbyist_group")
      , LobbyistMessageHandle: dmz.defs.createNamedHandle("lobbyist_message")
      , NameHandle: dmz.defs.createNamedHandle("name")
      , ParentHandle: dmz.defs.createNamedHandle("parent")
      , PictureDirectoryNameHandle: dmz.defs.createNamedHandle("pic_dir_name")
      , PictureFileNameHandle: dmz.defs.createNamedHandle("pic_file_name")
      , PictureHandle: dmz.defs.createNamedHandle("picture")
      , PostVisitedHandle: dmz.defs.createNamedHandle("post_visited")
      , ServerTimeHandle: dmz.defs.createNamedHandle("server_time")
      , TextHandle: dmz.defs.createNamedHandle("text")
      , TitleHandle: dmz.defs.createNamedHandle("title")
      , UserNameHandle: dmz.defs.createNamedHandle("user_name")
      , UserGroupHandle: dmz.defs.createNamedHandle("user_group")
      , VisibleHandle: dmz.defs.createNamedHandle("visible")
      , VoteResultHandle: dmz.defs.createNamedHandle("vote_result")
      , VoteUndecidedHandle: dmz.defs.createNamedHandle("vote_undecided")
      , VoteYesHandle: dmz.defs.createNamedHandle("vote_yes")
      , VoteNoHandle: dmz.defs.createNamedHandle("vote_no")
      , VoteAdvisorHandle: dmz.defs.createNamedHandle("vote_advisor")
      , VoteSubmittedHandle: dmz.defs.createNamedHandle("vote_submitted")
      , VoteApprovedHandle: dmz.defs.createNamedHandle("vote_approved")
      , VoterTotalHandle: dmz.defs.createNamedHandle("voter_total")
      }

   , Functions =
      { getDisplayName: false
      , getAuthorName: false
      , getAuthorHandle: false
      , getUserGroupHandle: false
      }

   , getDisplayName
   , getAuthorHandle
   , getAuthorName
   , getUserGroupHandle
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

Functions.getDisplayName = getDisplayName;
Functions.getAuthorHandle = getAuthorHandle;
Functions.getAuthorName = getAuthorName;
Functions.getUserGroupHandle = getUserGroupHandle;

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
