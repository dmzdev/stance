var dmz =
   { defs: require("dmz/runtime/definitions")
   , data: require("dmz/runtime/data")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , util: require("dmz/types/util")
   , mask: require("dmz/types/mask")
   , message: require("dmz/runtime/messaging")
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
        , DataType: dmz.objectType.lookup("data")
        , HelpForumType: dmz.objectType.lookup("help-forum")
        , PdfItemType: dmz.objectType.lookup("pdf-item")
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
        , Permissions: dmz.defs.createNamedHandle("permissions")
        , GameObservers: dmz.defs.createNamedHandle("game_observers")
        , TagHandle: dmz.defs.createNamedHandle("tag")

        // Object-specific handles
        , VoteState: dmz.defs.createNamedHandle("vote_state")
        , EmailRecipientHandle: dmz.defs.createNamedHandle("email_recipient")
        , PinTotalHandle: dmz.defs.createNamedHandle("pin_total")
        , EmailPriorityHandle: dmz.defs.createNamedHandle("email_priority")
        , StudentPermissionsHandle: dmz.defs.createNamedHandle("student_permissions")
        , AdminPermissionsHandle: dmz.defs.createNamedHandle("admin_permissions")
        , AdvisorPermissionsHandle: dmz.defs.createNamedHandle("advisor_permissions")
        , ObserverPermissionsHandle: dmz.defs.createNamedHandle("observer_permissions")
        , TechPermissionsHandle: dmz.defs.createNamedHandle("tech_permissions")

        // Link Attr Handles
        , AdvisorGroupHandle: dmz.defs.createNamedHandle("advisor_group")
        , VoteGroupHandle: dmz.defs.createNamedHandle("vote_group")
        , ForumLink: dmz.defs.createNamedHandle("group_forum_link")
        , GameGroupHandle: dmz.defs.createNamedHandle("game_group")
        , GameUngroupedUsersHandle: dmz.defs.createNamedHandle("game_ungrouped_users")
        , GroupMembersHandle: dmz.defs.createNamedHandle("group_members")
        , GroupPinHandle: dmz.defs.createNamedHandle("group_pin")
        , VoteLinkHandle: dmz.defs.createNamedHandle("vote_link")
        , VoteEmailLinkHandle: dmz.defs.createNamedHandle("vote_email_link")
        , YesHandle: dmz.defs.createNamedHandle("yes_link")
        , NoHandle: dmz.defs.createNamedHandle("no_link")
        , QuestionLinkHandle: dmz.defs.createNamedHandle("question_link")
        , MediaHandle: dmz.defs.createNamedHandle("game_media")
        , DataLinkHandle: dmz.defs.createNamedHandle("data_link")
        , HelpLink: dmz.defs.createNamedHandle("help_link")

        /* Time handles, and handles to be removed later */
        , UpdateStartTimeHandle: dmz.defs.createNamedHandle("update_start_time_handle")
        , UpdateEndTimeHandle: dmz.defs.createNamedHandle("update_end_time_handle")
        , CreatedAtServerTimeHandle: dmz.defs.createNamedHandle("created_at_server_time")
        , EndedAtServerTimeHandle: dmz.defs.createNamedHandle("ended_at_server_time")
        , ExpiredTimeHandle: dmz.defs.createNamedHandle("expire_time_handle")
        , UpdateExpiredTimeHandle: dmz.defs.createNamedHandle("update_expire_time_handle")

        // Notification Time Handles
        , PinTimeHandle: dmz.defs.createNamedHandle("pin_time")
        , ForumTimeHandle: dmz.defs.createNamedHandle("forum_time")
        , VoteTimeHandle: dmz.defs.createNamedHandle("vote_time")
        , Advisor0TimeHandle: dmz.defs.createNamedHandle("advisor0_time")
        , Advisor1TimeHandle: dmz.defs.createNamedHandle("advisor1_time")
        , Advisor2TimeHandle: dmz.defs.createNamedHandle("advisor2_time")
        , Advisor3TimeHandle: dmz.defs.createNamedHandle("advisor3_time")
        , Advisor4TimeHandle: dmz.defs.createNamedHandle("advisor4_time")
        , HelpTimeHandle: dmz.defs.createNamedHandle("help_time")

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
        , HelpImageHandle: dmz.defs.createNamedHandle("help_image")
        }

   , Functions =
        { getDisplayName: false
        , getAuthorName: false
        , getAuthorHandle: false
        , getUserGroupHandle: false
        , addUITextLimit: false
        , getVoteStatus: false
        , userAttribute: false
        , getLastTimeStamp: false
        }

   , States =
        { SwitchGroupFlag: dmz.defs.lookupState("Switch_Group")
        , ChangeMapFlag: dmz.defs.lookupState("Change_Map")
        , CreateVoteFlag: dmz.defs.lookupState("Create_Vote")
        , CastVoteFlag: dmz.defs.lookupState("Cast_Vote")
        , AskAdvisor0Flag: dmz.defs.lookupState("Ask_Advisor0")
        , AskAdvisor1Flag: dmz.defs.lookupState("Ask_Advisor1")
        , AskAdvisor2Flag: dmz.defs.lookupState("Ask_Advisor2")
        , AskAdvisor3Flag: dmz.defs.lookupState("Ask_Advisor3")
        , AskAdvisor4Flag: dmz.defs.lookupState("Ask_Advisor4")
        , AnswerAdvisor0Flag: dmz.defs.lookupState("Answer_Advisor0")
        , AnswerAdvisor1Flag: dmz.defs.lookupState("Answer_Advisor1")
        , AnswerAdvisor2Flag: dmz.defs.lookupState("Answer_Advisor2")
        , AnswerAdvisor3Flag: dmz.defs.lookupState("Answer_Advisor3")
        , AnswerAdvisor4Flag: dmz.defs.lookupState("Answer_Advisor4")
        , ApproveAdvisor0Flag: dmz.defs.lookupState("Approve_Advisor0")
        , ApproveAdvisor1Flag: dmz.defs.lookupState("Approve_Advisor1")
        , ApproveAdvisor2Flag: dmz.defs.lookupState("Approve_Advisor2")
        , ApproveAdvisor3Flag: dmz.defs.lookupState("Approve_Advisor3")
        , ApproveAdvisor4Flag: dmz.defs.lookupState("Approve_Advisor4")
        , ForumPostFlag: dmz.defs.lookupState("New_Forum_Post")
        , AlterGroupsFlag: dmz.defs.lookupState("Alter_Groups")
        , AlterUsersFlag: dmz.defs.lookupState("Alter_Users")
        , AlterMediaFlag: dmz.defs.lookupState("Alter_Media")
        , AlterAdvisorsFlag: dmz.defs.lookupState("Alter_Advisors")
        , AnswerHelpFlag: dmz.defs.lookupState("Answer_Help")
        , StudentDataFlag: dmz.defs.lookupState("Student_Data")
        , DeletePostsFlag: dmz.defs.lookupState("Delete_Posts")
        , TagDataFlag: dmz.defs.lookupState("Tag_Data")
        , SeeTagFlag: dmz.defs.lookupState("See_Tags")
        , InjectPDFFlag: dmz.defs.lookupState("Inject_PDF")
        , ModifyCollabAreaFlag: dmz.defs.lookupState("Modify_Collab_Area")
        , ChangePermissionsFlag: dmz.defs.lookupState("Change_Permission_Sets")
        }

   , Permissions =
        { StudentPermissions:
             [ States.CreateVoteFlag
             , States.CastVoteFlag
             , States.AskAdvisor0Flag
             , States.AskAdvisor1Flag
             , States.AskAdvisor2Flag
             , States.AskAdvisor3Flag
             , States.AskAdvisor4Flag
             , States.ForumPostFlag
             , States.AnswerHelpFlag
             , States.ModifyCollabAreaFlag
             ]
        , AdminPermissions:
             [ States.SwitchGroupFlag
             , States.ChangeMapFlag
             , States.AskAdvisor0Flag
             , States.AskAdvisor1Flag
             , States.AskAdvisor2Flag
             , States.AskAdvisor3Flag
             , States.AskAdvisor4Flag
             , States.AnswerAdvisor0Flag
             , States.AnswerAdvisor1Flag
             , States.AnswerAdvisor2Flag
             , States.AnswerAdvisor3Flag
             , States.AnswerAdvisor4Flag
             , States.ApproveAdvisor0Flag
             , States.ApproveAdvisor1Flag
             , States.ApproveAdvisor2Flag
             , States.ApproveAdvisor3Flag
             , States.ApproveAdvisor4Flag
             , States.AlterAdvisorsFlag
             , States.ForumPostFlag
             , States.AlterMediaFlag
             , States.AnswerHelpFlag
             , States.StudentDataFlag
             , States.DeletePostsFlag
             , States.TagDataFlag
             , States.SeeTagFlag
             , States.InjectPDFFlag
             ]
        , AdvisorPermissions: // Needs to be customized for each advisor user created
             [
             ]
        , ObserverPermissions:
             [ States.SwitchGroupFlag
             , States.SeeTagFlag
             ]
        , TechPermissions: // Seriously, do we really need "permission" to do anything?
             [ States.SwitchGroupFlag
             , States.ChangeMapFlag
             , States.CreateVoteFlag
             //, States.CastVoteFlag
             , States.AskAdvisor0Flag
             , States.AskAdvisor1Flag
             , States.AskAdvisor2Flag
             , States.AskAdvisor3Flag
             , States.AskAdvisor4Flag
             , States.AnswerAdvisor0Flag
             , States.AnswerAdvisor1Flag
             , States.AnswerAdvisor2Flag
             , States.AnswerAdvisor3Flag
             , States.AnswerAdvisor4Flag
             , States.ApproveAdvisor0Flag
             , States.ApproveAdvisor1Flag
             , States.ApproveAdvisor2Flag
             , States.ApproveAdvisor3Flag
             , States.ApproveAdvisor4Flag
             , States.AlterAdvisorsFlag
             , States.ForumPostFlag
             , States.AlterMediaFlag
             , States.AlterGroupsFlag
             , States.AlterUsersFlag
             , States.AnswerHelpFlag
             , States.StudentDataFlag
             , States.DeletePostsFlag
             , States.ModifyCollabAreaFlag
             , States.TagDataFlag
             , States.SeeTagFlag
             , States.InjectPDFFlag
             , States.ChangePermissionsFlag
             ]
        }
   , Messages =
        { TAG_MESSAGE: dmz.message.create("TagMessage")
        }

   , Constants =
        { VOTE_APPROVAL_PENDING: 0
        , VOTE_DENIED: 1
        , VOTE_ACTIVE: 2
        , VOTE_YES: 3
        , VOTE_NO: 4
        , VOTE_EXPIRED: 5
        , VOTE_ERROR: 6
        , STATE_STR:
             [ "Approval Pending"
             , "Denied"
             , "Active"
             , "Passed"
             , "Failed"
             , "Expired"
             , "ERROR"
             ]
        , PRIORITY_FIRST: 1
        , PRIORITY_SECOND: 2
        , PRIORITY_THIRD: 3
        , TIME_FORMAT: "MMM-dd hh:mm tt"
        , RED_BUTTON: "* { background-color: red; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; }"
        , GREEN_BUTTON: "* { background-color: green; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; }"
        , YELLOW_BUTTON: "* { background-color: yellow; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; }"
        , STUDENT_PERMISSION: 0
        , ADMIN_PERMISSION: 1
        , ADVISOR_PERMISSION: 2
        , OBSERVER_PERMISSION: 3
        , TECH_PERMISSION: 4
        , PERMISSION_LEVELS: 5
        , PERMISSION_LABELS:
             [ "Student"
             , "Admin"
             , "Advisor"
             , "Observer"
             , "Tech"
             ]
        , PERMISSION_HANDLES:
             [ Handles.StudentPermissionsHandle
             , Handles.AdminPermissionsHandle
             , Handles.AdvisorPermissionsHandle
             , Handles.ObserverPermissionsHandle
             , Handles.TechPermissionsHandle
             ]
        , STATES: States
        }
   , getDisplayName
   , getAuthorHandle
   , getAuthorName
   , getUserGroupHandle
   , getVoteStatus
   , getTags
   , addUITextLimit
   , userAttribute
   , getLastTimeStamp
   , createPermissionSet
   , isAllowed
   , getSingleStates
   ;

(function () {

   States.AdvisorSets =
      [ States.AskAdvisor0Flag.or(States.AnswerAdvisor0Flag).or(States.ApproveAdvisor0Flag)
      , States.AskAdvisor1Flag.or(States.AnswerAdvisor1Flag).or(States.ApproveAdvisor1Flag)
      , States.AskAdvisor2Flag.or(States.AnswerAdvisor2Flag).or(States.ApproveAdvisor2Flag)
      , States.AskAdvisor3Flag.or(States.AnswerAdvisor3Flag).or(States.ApproveAdvisor3Flag)
      , States.AskAdvisor4Flag.or(States.AnswerAdvisor4Flag).or(States.ApproveAdvisor4Flag)
      ];
   Constants.AdvisorFlags =
      States.AdvisorSets[0].or(States.AdvisorSets[1]).or(States.AdvisorSets[2]).or(States.AdvisorSets[3]).or(States.AdvisorSets[4]);

   States.AdvisorAskSet =
      [ States.AskAdvisor0Flag
      , States.AskAdvisor1Flag
      , States.AskAdvisor2Flag
      , States.AskAdvisor3Flag
      , States.AskAdvisor4Flag
      ];

   States.AdvisorAnswerSet =
      [ States.AnswerAdvisor0Flag
      , States.AnswerAdvisor1Flag
      , States.AnswerAdvisor2Flag
      , States.AnswerAdvisor3Flag
      , States.AnswerAdvisor4Flag
      ];

   States.AdvisorApproveSet =
      [ States.ApproveAdvisor0Flag
      , States.ApproveAdvisor1Flag
      , States.ApproveAdvisor2Flag
      , States.ApproveAdvisor3Flag
      , States.ApproveAdvisor4Flag
      ];
}());

getTags = function (data) {

   var total
     , list = []
     , idx
     ;

   if (dmz.data.isTypeOf(data)) {

      total = data.number(Handles.TotalHandle, 0) || 0;
      for (idx = 0; idx < total; idx += 1) { list.push(data.string(Handles.TagHandle, idx)); }
   }

   return list;
};

getSingleStates = function () {

   var results = {};
   Object.keys(States).forEach(function (name) {

      if (dmz.mask.isTypeOf(States[name])) { results[name] = States[name]; }
   });
   return results;
};

isAllowed = function (handle, state) {

   var permissions = dmz.object.state(handle, Handles.Permissions)
     , result = false
     ;
   if (permissions && state && dmz.mask.isTypeOf(state)) {

      result = permissions.and(state).bool();
   }
   return result;
};

createPermissionSet = function (flagList) {

   var result = dmz.mask.create();
   flagList.forEach(function (state) { result = result.or(state); });
   return result;
};

getLastTimeStamp = function (handleList) {

   var last = 0;
   if (handleList && handleList.length) {

      handleList.forEach(function (handle) {

         var time = dmz.object.timeStamp(handle, Handles.CreatedAtServerTimeHandle);
         if (time && (time > last)) { last = time; }
      });
   }
   return last;
};

getVoteStatus = function (handle) {

   var type = dmz.object.type(handle)
     , state
     ;

   if (type.isOfType(ObjectTypes.VoteType)) { state = dmz.object.scalar(handle, Handles.VoteState); }
   else { state = Constants.VOTE_ERROR; }
   return Constants.STATE_STR[state];
};

getDisplayName = function (handle) {

   var name = dmz.object.text (handle, Handles.DisplayNameHandle);
   if (!name || (name === undefined)) { name = dmz.object.text (handle, Handles.NameHandle); }
   return name;
};

getAuthorHandle = function (handle) {

   var parentLinks = dmz.object.subLinks (handle, Handles.CreatedByHandle) || [];
   return parentLinks[0];
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

userAttribute = function (handle, attribute, value) {

   var type = dmz.object.type(handle)
     , isAdmin = dmz.object.flag(handle, Handles.AdminHandle)
     , dataHandle
     , retval
     ;
   if (type && type.isOfType(ObjectTypes.UserType)) {

      if (isAdmin) {

         dataHandle =
            dmz.object.linkAttributeObject(
               dmz.object.linkHandle(Handles.DataLinkHandle, handle, getUserGroupHandle(handle)));
      }
      else { dataHandle = handle; }

      if (arguments.length === 3) { dmz.object.timeStamp(dataHandle, attribute, value); }
      retval = dmz.object.timeStamp(dataHandle, attribute);
   }
   return retval || 0;
};

Functions.getTags = getTags;
Functions.getSingleStates = getSingleStates;
Functions.getDisplayName = getDisplayName;
Functions.getAuthorHandle = getAuthorHandle;
Functions.getAuthorName = getAuthorName;
Functions.getUserGroupHandle = getUserGroupHandle;
Functions.addUITextLimit = addUITextLimit;
Functions.getVoteStatus = getVoteStatus;
Functions.userAttribute = userAttribute;
Functions.getLastTimeStamp = getLastTimeStamp;
Functions.isAllowed = isAllowed;

(function () {

   dmz.object.allowDefaultAttribute(false);
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

   Object.keys(States).forEach(function (fncName) {

      dmz.util.defineConst(exports, fncName, States[fncName]);
   });

   Object.keys(Messages).forEach(function (fncName) {

      dmz.util.defineConst(exports, fncName, Messages[fncName]);
   });

   Object.keys(Permissions).forEach(function (fncName) {

      dmz.util.defineConst(exports, fncName, createPermissionSet(Permissions[fncName]));
   });
}());
