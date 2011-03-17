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
      , PostType: dmz.objectType.lookup("post")
      , ForumType: dmz.objectType.lookup("forum")
      , GroupType: dmz.objectType.lookup("group")
      , UserType: dmz.objectType.lookup("user")
      , GameType: dmz.objectType.lookup("game")
      , LobbyistType: dmz.objectType.lookup("lobbyist")
      , PinType: dmz.objectType.lookup("map_push_pin")
      , VoteType: dmz.objectType.lookup("vote")
      }

   , Handles =
      { ActiveHandle: dmz.defs.createNamedHandle("Active")
      , AdminFlagHandle: dmz.defs.createNamedHandle("admin_user")
      , AdvisorGroupHandle: dmz.defs.createNamedHandle("advisor_group")
      , BioHandle: dmz.defs.createNamedHandle("bio")
      , CreatedByHandle: dmz.defs.createNamedHandle("created_by")
      , CreatedAtHandle: dmz.defs.createNamedHandle("created_at")
      , DisplayNameHandle: dmz.defs.createNamedHandle("display_name")
      , ForumLink: dmz.defs.createNamedHandle("group_forum_link")
      , GameGroupHandle: dmz.defs.createNamedHandle("game_group")
      , GameForumsHandle: dmz.defs.createNamedHandle("game_forums")
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
      , PostVisitedHandle: dmz.defs.createNamedHandle("post_visited")
      , TextHandle: dmz.defs.createNamedHandle("text")
      , TitleHandle: dmz.defs.createNamedHandle("title")
      , UserGroupHandle: dmz.defs.createNamedHandle("user_group")
      , VisibleHandle: dmz.defs.createNamedHandle("visible")
      , VoteResultHandle: dmz.defs.createNamedHandle("vote_result")
      , VoteUndecidedHandle: dmz.defs.createNamedHandle("vote_undecided")
      , VoteYesHandle: dmz.defs.createNamedHandle("vote_yes")
      , VoteNoHandle: dmz.defs.createNamedHandle("vote_no")
      , VoteAdvisorHandle: dmz.defs.createNamedHandle("vote_advisor")
      , VoteSubmittedHandle: dmz.defs.createNamedHandle("vote_submitted")
      , VoteApprovedHandle: dmz.defs.createNamedHandle("vote_approved")
      , VoteCommentHandle: dmz.defs.createNamedHandle("vote_comment")
      , VoterTotalHandle: dmz.defs.createNamedHandle("voter_total")
      }

   , Functions =
      { _getDisplayName: false
      , _getAuthorName: false
      , _getAuthorHandle: false
      }

   , getDisplayName
   , getAuthorHandle
   , getAuthorName
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

Functions._getDisplayName = getDisplayName;
Functions._getAuthorHandle = getAuthorHandle;
Functions._getAuthorName = getAuthorName;

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
