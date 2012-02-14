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
        , ApprovedByHandle: dmz.defs.createNamedHandle("approved_by")
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
        , Achievements: dmz.defs.createNamedHandle("achievements")
        , PreviousAchievements: dmz.defs.createNamedHandle("previously_seen_achievements")

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
        , GroupWikiLinkHandle: dmz.defs.createNamedHandle("wiki_link")
        , ExpiredHandle: dmz.defs.createNamedHandle("expired")
        , DisruptionInTheForceHandle: dmz.defs.createNamedHandle("disruption_in_the_force")
        , ConsecutiveLoginsHandle: dmz.defs.createNamedHandle("consecutive_logins")

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
        , OriginalGroupHandle: dmz.defs.createNamedHandle("original_group")

        // Time handles
        , UpdatePostedTimeHandle: dmz.defs.createNamedHandle("update_posted_time_handle")
        , UpdateStartTimeHandle: dmz.defs.createNamedHandle("update_start_time_handle")
        , UpdateEndTimeHandle: dmz.defs.createNamedHandle("update_end_time_handle")
        , UpdateExpiredTimeHandle: dmz.defs.createNamedHandle("update_expire_time_handle")
        , PostedAtServerTimeHandle: dmz.defs.createNamedHandle("posted_at_server_time")
        , CreatedAtServerTimeHandle: dmz.defs.createNamedHandle("created_at_server_time")
        , EndedAtServerTimeHandle: dmz.defs.createNamedHandle("ended_at_server_time")
        , ExpiredTimeHandle: dmz.defs.createNamedHandle("expire_time_handle")
        , LastLoginTimeHandle: dmz.defs.createNamedHandle("last_login_time_handle")
        , UpdateLastLoginTimeHandle: dmz.defs.createNamedHandle("update_last_login_time_handle")
        , LastPingTimeHandle: dmz.defs.createNamedHandle("last_ping")

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
        , BookcaseImageHandle: dmz.defs.createNamedHandle("bookcase_image")
        , RolodexImageHandle: dmz.defs.createNamedHandle("rolodex_image")
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
        , getTags: false
        }
   , AchievementStates =
        { WelcomeBackOneAchievement: dmz.defs.lookupState("Welcome_Back_One")
        , WelcomeBackTwoAchievement: dmz.defs.lookupState("Welcome_Back_Two")
        , WelcomeBackThreeAchievement: dmz.defs.lookupState("Welcome_Back_Three")
        , RightToVoteOneAchievement: dmz.defs.lookupState("Right_To_Vote_One")
        , RightToVoteTwoAchievement: dmz.defs.lookupState("Right_To_Vote_Two")
        , RightToVoteThreeAchievement: dmz.defs.lookupState("Right_To_Vote_Three")
        , FrequentFlyerAchievement: dmz.defs.lookupState("Frequent_Flyer")
        , MediaFrenzyAchievement: dmz.defs.lookupState("Media_Frenzy")
        , RockTheVoteOneAchievement: dmz.defs.lookupState("Rock_The_Vote_One")
        , RockTheVoteTwoAchievement: dmz.defs.lookupState("Rock_The_Vote_Two")
        , RockTheVoteThreeAchievement: dmz.defs.lookupState("Rock_The_Vote_Three")
        , EffectiveCommunicatorOneAchievement: dmz.defs.lookupState("Effective_Communicator_One")
        , EffectiveCommunicatorTwoAchievement: dmz.defs.lookupState("Effective_Communicator_Two")
        , EffectiveCommunicatorThreeAchievement: dmz.defs.lookupState("Effective_Communicator_Three")
        , EffectiveInterrogatorOneAchievement: dmz.defs.lookupState("Effective_Interrogator_One")
        , EffectiveInterrogatorTwoAchievement: dmz.defs.lookupState("Effective_Interrogator_Two")
        , EffectiveInterrogatorThreeAchievement: dmz.defs.lookupState("Effective_Interrogator_Three")
        , SageAdviceOneAchievement: dmz.defs.lookupState("Sage_Advice_One")
        , SageAdviceTwoAchievement: dmz.defs.lookupState("Sage_Advice_Two")
        , SageAdviceThreeAchievement: dmz.defs.lookupState("Sage_Advice_Three")
        , OnTheBallotAchievement: dmz.defs.lookupState("On_The_Ballot")
        , StrategistOneAchievement: dmz.defs.lookupState("Strategist_One")
        , StrategistTwoAchievement: dmz.defs.lookupState("Strategist_Two")
        , StrategistThreeAchievement: dmz.defs.lookupState("Strategist_Three")
        , DisruptionInTheForceOneAchievement: dmz.defs.lookupState("Disruption_In_The_Force_One")
        , DisruptionInTheForceTwoAchievement: dmz.defs.lookupState("Disruption_In_The_Force_Two")
        , DisruptionInTheForceThreeAchievement: dmz.defs.lookupState("Disruption_In_The_Force_Three")
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
        , LimitedPingFlag: dmz.defs.lookupState("Limited_Ping")
        , UnlimitedPingFlag: dmz.defs.lookupState("Unlimited_Ping")
        , DisruptTheForceFlag: dmz.defs.lookupState("Disrupt_The_Force")
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
             , States.LimitedPingFlag
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
             , States.UnlimitedPingFlag
             , States.DisruptTheForceFlag
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
//             , States.CreateVoteFlag
//             , States.CastVoteFlag
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
             , States.UnlimitedPingFlag
             , States.DisruptTheForceFlag
             ]
        }
   , Messages =
        { TAG_MESSAGE: dmz.message.create("TagMessage")
        , AUTOMATIC_TAG_MESSAGE: dmz.message.create("AutomaticTagMessage")
        , ACHIEVEMENT_MESSAGE: dmz.message.create("AchievementMessage")
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
        , RED_BUTTON: "* { background-color: red; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; color: black; }"
        , GREEN_BUTTON: "* { background-color: green; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; color: black; }"
        , YELLOW_BUTTON: "* { background-color: yellow; border-style: outset; border-width: 2px; border-radius: 10px; border-color: black; padding: 5px; color: black; }"
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
        , NOTIFICATION_HANDLES:
             [ Handles.PinTimeHandle
             , Handles.ForumTimeHandle
             , Handles.VoteTimeHandle
             , Handles.Advisor0TimeHandle
             , Handles.Advisor1TimeHandle
             , Handles.Advisor2TimeHandle
             , Handles.Advisor3TimeHandle
             , Handles.Advisor4TimeHandle
             , Handles.HelpTimeHandle
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
   , unlockAchievement
   , hasAchievement
   , hasSeenAchievement
   , isAllowed
   , getAchievementStates
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

getAchievementStates = function () {

   var results = {};
   Object.keys(AchievementStates).forEach(function (name) {

      if (dmz.mask.isTypeOf(AchievementStates[name])) { results[name] = AchievementStates[name]; }
   });
   return results;
};

hasAchievement = function (handle, achievement) {

   var achievements = dmz.object.state(handle, Handles.Achievements)
     , result = false
     ;

   if (achievements && achievement && dmz.mask.isTypeOf(achievement)) {

      result = achievements.and(achievement).bool();
   }
   return result;
};

unlockAchievement = function (handle, achievement) {

   var achievements = dmz.object.state(handle, Handles.Achievements) || dmz.mask.create()
     , data
     , achievementName
     ;

   if (handle && achievement && achievements && dmz.mask.isTypeOf(achievement)) {

      achievements = achievements.or(achievement);
      dmz.object.state(handle, Handles.Achievements, achievements);
   }
};

hasSeenAchievement = function (handle, achievement) {

   var achievements = dmz.object.state(handle, Handles.PreviousAchievements)
     , result = false
     ;

   if (achievements && achievement && dmz.mask.isTypeOf(achievement)) {

      result = achievements.and(achievement).bool();
   }
   return result;
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
//     , isAdmin = dmz.object.flag(handle, Handles.AdminHandle)
     , isAdmin = Functions.isAllowed(handle, States.SwitchGroupFlag)
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
Functions.getAchievementStates = getAchievementStates;
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
Functions.unlockAchievement = unlockAchievement;
Functions.hasAchievement = hasAchievement;
Functions.hasSeenAchievement = hasSeenAchievement;

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

   Object.keys(AchievementStates).forEach(function (fncName) {

      dmz.util.defineConst(exports, fncName, AchievementStates[fncName]);
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
