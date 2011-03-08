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
      }

   , Handles =
      { ActiveHandle: dmz.defs.createNamedHandle("Active")
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
      , LobbyistGroupHandle: dmz.defs.createNamedHandle("lobbyist_group")
      , LobbyistMessageHandle: dmz.defs.createNamedHandle("lobbyist_message")
      , NameHandle: dmz.defs.createNamedHandle("name")
      , ParentHandle: dmz.defs.createNamedHandle("parent")
      , PictureDirectoryNameHandle: dmz.defs.createNamedHandle("pic_dir_name")
      , PictureFileNameHandle: dmz.defs.createNamedHandle("pic_file_name")
      , PostVisitedHandle: dmz.defs.createNamedHandle("post_visited")
      , TextHandle: dmz.defs.createNamedHandle("text")
      , TitleHandle: dmz.defs.createNamedHandle("title")
      , UserEmailHandle: dmz.defs.createNamedHandle("user_email")
      , UserGroupHandle: dmz.defs.createNamedHandle("user_group")
      , VisibleHandle: dmz.defs.createNamedHandle("visible")
      }

   , Functions =
      { _getDisplayName: false
      , _getAuthorName: false
      , _getAuthorHandle: false
      }

   ;


Functions._getDisplayName = function (handle) {

   var name = dmz.object.text (handle, Handles.DisplayNameHandle);
   if (!name || (name === undefined)) { name = dmz.object.text (handle, Handles.NameHandle); }
   return name;
}


Functions._getAuthorName = function (handle) {

   return _getDisplayName(_getAuthorHandle(handle));
}


Functions._getAuthorHandle = function (handle) {

   var parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle)
     , parent
     ;

   parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle);
   if (parentLinks) { parent = parentLinks[0]; }

   return parent;
}


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
