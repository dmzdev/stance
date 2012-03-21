require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , label: require("dmz/ui/label")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , treeWidget: require("dmz/ui/treeWidget")
      , widget: require("dmz/ui/widget")
      }
   , stance: require("stanceConst")
   , data: require("dmz/runtime/data")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , message: require("dmz/runtime/messaging")
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , forumView: require("static-forum-view")
   }

   // UI Elements
   , AdvisorWindows = []

   // Consts
   , ADVISOR_COUNT = 5
   , MAX_QUESTION_STR_LEN = 140
   , MAX_ADMIN_POST_STR_LEN = 400
   , MAX_QUESTION_REPLY_LEN = 500
   , MAX_TASK_STR_LEN = 140

   , SAGE_ADVICE_COUNT_1 = 1 // Number of advisors posted to for achievement
   , SAGE_ADVICE_COUNT_2 = 3
   , SAGE_ADVICE_COUNT_3 = 5

   , EFF_INTERR_COUNT_1 = 4 // Number of tagged questions
   , EFF_INTERR_COUNT_2 = 6
   , EFF_INTERR_COUNT_3 = 8

   // Variables
   , MainModule
   , master =
        { items: {}
        , votes: {}
        , decisions: {}
        , questions: {}
        , answers: {}
        , advisors: {}
        }
   , postCache = []
   , commentCache = []
   , postList = {}
   , commentList = {}
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
   , WasBlocked = false
   , EmailMod = false
   , observerLists =
        { create: []
        , text: []
        , createdBy: []
        , createdAt: []
        , forumLink: []
        , parentLink: []
        , onActive: []
        , tag: []
        , permissions: []
        }
   , AdvisorTimeHandles =
        [ dmz.stance.Advisor0TimeHandle
        , dmz.stance.Advisor1TimeHandle
        , dmz.stance.Advisor2TimeHandle
        , dmz.stance.Advisor3TimeHandle
        , dmz.stance.Advisor4TimeHandle
        ]
    , userForumPostTable = {}
    , userQuestionTagTable = {}

   // Functions
   , createAdvisorWindow
   , getVoteDecision
   , getQuestionAnswer
   , getAvatarPixmap
   , getHILAdvisor
   , taskBlocked
   , setUserAvatar
   , advisorAnswerPermission
   , advisorAskPermission
   ;

advisorAnswerPermission = function (author, advisorHandle) {

   return dmz.stance.isAllowed(author, dmz.stance.AdvisorAnswerSet[dmz.object.scalar(advisorHandle, dmz.stance.ID)]);
}

advisorAskPermission = function (hil, advisorHandle) {

   return dmz.stance.isAllowed(hil, dmz.stance.AdvisorAskSet[dmz.object.scalar(advisorHandle, dmz.stance.ID)]);
}

setUserAvatar = function (userHandle, labelWidget) {

   var avatar = AvatarDefault
     , resource
     ;

   if (labelWidget) {

      if (userHandle) {

         resource = dmz.object.text(userHandle, dmz.stance.PictureHandle);
         resource = dmz.resources.findFile(resource);
         if (resource) { avatar = dmz.ui.graph.createPixmap(resource); }
         if (avatar) { avatar = avatar.scaled(50, 50); }
      }
      labelWidget.pixmap(avatar);
   }
};

taskBlocked = function () {

   var hil = dmz.object.hil()
     , advisors
     , result
     , votes = []
     ;

   advisors = dmz.object.superLinks(dmz.stance.getUserGroupHandle(hil), dmz.stance.AdvisorGroupHandle) || [];
   advisors.forEach(function (advisorHandle) {

      var links = dmz.object.superLinks(advisorHandle, dmz.stance.VoteLinkHandle) || [];
      votes = votes.concat(links);
   });
   if (votes && votes.length) {

      votes.forEach(function (voteHandle) {

         var voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState);

         if ((voteState === dmz.stance.VOTE_APPROVAL_PENDING) ||
            (voteState === dmz.stance.VOTE_ACTIVE)) {

            result = "New tasks cannot be submitted while your group has an active task.";
         }
      });
   }

   if (!dmz.stance.isAllowed(hil, dmz.stance.CreateVoteFlag)) {

      result = "New votes may only be created by students.";
   }
   if (LoginSkipped || !hil) { result = "New tasks cannot be created without logging in."; }
   return result;
};

LoginSkippedMessage.subscribe(self, function (data) {

   LoginSkipped = true;
   AdvisorWindows.forEach(function (data) { data.question.updateLoggedIn(LoginSkipped); });
});

createAdvisorWindow = function (windowStr, idx) {

   var data = {};

   data.update = function () { self.log.error ("Could not update", windowStr); }
   data.onHome = function () { self.log.error ("Could not do onHome for", windowStr); }
   data.windowStr = windowStr;
   data.advisorIndex = idx;
   data.window = dmz.ui.widget.create();
   data.layout = dmz.ui.layout.createVBoxLayout();
   data.window.layout(data.layout);
   data.infoWindow = { widget: dmz.ui.loader.load("AdvisorWindow.ui") }
   data.infoWindow.name = data.infoWindow.widget.lookup("nameLabel");
   data.infoWindow.bio = data.infoWindow.widget.lookup("bioText");
   data.infoWindow.title = data.infoWindow.widget.lookup("specialtyLabel");
   data.infoWindow.picture = data.infoWindow.widget.lookup("pictureLabel");
   data.infoWindow.picture.pixmap(AvatarDefault.scaled(94, 125));

   data.task = { widget: dmz.ui.loader.load("CommentAdd.ui") };
   data.task.avatar = data.task.widget.lookup("avatarLabel");
   data.task.text = data.task.widget.lookup("textEdit");
   data.task.submit = data.task.widget.lookup("submitButton");
   data.task.widget.lookup("cancelButton").hide();
   data.task.widget.lookup("gridLayout").addWidget(dmz.ui.label.create("Request Action:"), 0, 1, 1, 3);
   data.task.widget.styleSheet("QFrame { background-color: rgb(230, 110, 110); }");
   data.task.text.styleSheet(
      "QTextEdit:disabled { background-color: rgb(170, 170, 170); } " +
      "QTextEdit { background-color: rgb(255, 255, 255); } ");
   dmz.stance.addUITextLimit
      ( self
      , MAX_TASK_STR_LEN
      , data.task.text
      , data.task.submit
      , data.task.widget.lookup("currentCharAmt")
      , data.task.widget.lookup("totalCharAmt")
      );

   data.question = dmz.forumView.setupForumView(
      { self: self
      , postType: dmz.stance.QuestionType
      , commentType: dmz.stance.AnswerType
      , timeHandle: AdvisorTimeHandles[idx]
      , forumType: dmz.stance.AdvisorType
      , parentHandle: dmz.stance.QuestionLinkHandle
      , groupLinkHandle: dmz.stance.AdvisorGroupHandle
      , useForumData: advisorAnswerPermission
      , messageLength: MAX_QUESTION_STR_LEN
      , adminMessageLength: MAX_ADMIN_POST_STR_LEN
      , replyLength: MAX_QUESTION_REPLY_LEN
      , forumLabelText: "Query Advisor:"
      , highlight: function (handle) {

           var str;

           if (!handle) { MainModule.highlight(windowStr); }
           else {

              str = "Advisor" + dmz.object.scalar(handle, dmz.stance.ID);
              MainModule.highlight(str);
           }
        }
      , canReplyTo: function (replyToHandle, advisorHandle) {

           var type = dmz.object.type(replyToHandle);
           return advisorAnswerPermission(dmz.object.hil(), advisorHandle) && type &&
              type.isOfType(dmz.stance.QuestionType) && !getQuestionAnswer(replyToHandle);
        }
      , postBlocked: function (advisorHandle) {

           var questions = dmz.object.superLinks(advisorHandle, dmz.stance.QuestionLinkHandle) || []
             , hil = dmz.object.hil()
             , result = false
             ;

           if (LoginSkipped || !hil) { result = "New questions cannot be created without logging in."; }
           else if (!advisorAskPermission(hil, advisorHandle)) {

              result = "You do not have permission to post here.";
           }
           else if (!advisorAnswerPermission(hil, advisorHandle)) {

              questions.forEach(function (questionHandle) {

                 if (!getQuestionAnswer(questionHandle) &&
                    !advisorAnswerPermission(dmz.stance.getAuthorHandle(questionHandle), advisorHandle) &&
                    dmz.object.flag(questionHandle, dmz.stance.ActiveHandle)) {

                    result = "New questions cannot be submitted while another question is active with the current advisor.";
                 }
              });
           }

           return result;
        }
      });

   Object.keys(data.question.observers).forEach(function (key) {

      observerLists[key].push(data.question.observers[key]);
   });

   data.onHome = function () {

      if (data.question && data.question.onHome) {

         var userHandle = dmz.object.hil()
           , userPermissions
           ;

         data.question.onHome();
         if (userHandle) {

            userPermissions = dmz.object.scalar(userHandle, dmz.stance.Permissions);
            if ((userPermissions === dmz.stance.TECH_PERMISSION) ||
               (userPermissions === dmz.stance.ADMIN_PERMISSION)) {

               AdvisorWindows.forEach(function (data) {

                  var advisorHandle = getHILAdvisor(data.advisorIndex)
                    , questions = dmz.object.superLinks(advisorHandle, dmz.stance.QuestionLinkHandle) || []
                    , authorHandle
                    , authorPermissions
                    , answerHandle
                    ;

                  questions.forEach(function (questionHandle) {

                     authorHandle = dmz.stance.getAuthorHandle(questionHandle) || userHandle;
                     answerHandle = getQuestionAnswer(questionHandle);
                     authorPermissions = dmz.object.scalar(authorHandle, dmz.stance.Permissions);
                     if ((userHandle !== authorHandle) && !answerHandle &&
                        (authorPermissions !== dmz.stance.TECH_PERMISSION) &&
                        (authorPermissions !== dmz.stance.ADMIN_PERMISSION) &&
                        (authorPermissions !== dmz.stance.ADVISOR_PERMISSION)) {

                        MainModule.highlight(data.windowStr);
                     }
                  });
               });
            }
         }
      }
   };

   data.update = function (advisorHandle, width, height) {

      var text;
      data.advisor = advisorHandle;
      data.infoWindow.name.text(dmz.object.text(advisorHandle, dmz.stance.NameHandle));
      data.infoWindow.bio.text(dmz.object.text(advisorHandle, dmz.stance.BioHandle));
      data.infoWindow.title.text(dmz.object.text(advisorHandle, dmz.stance.TitleHandle));
      data.infoWindow.picture.pixmap(getAvatarPixmap(advisorHandle).scaled(94, 125));

      if (data.question && data.question.update) { data.question.update(advisorHandle, LoginSkipped); }
      data.task.submit.observe(self, "clicked", function () {

         var handle
           , text = data.task.text.text()
           , hil = dmz.object.hil()
           , groupHandle = dmz.stance.getUserGroupHandle(hil)
           , groupName
           , voteNumber
           , voteItem = {}
           , tempHandles
           , dataObject
           ;

         if (text.length) {

            handle = dmz.object.create(dmz.stance.VoteType);
            dmz.object.scalar(handle, dmz.stance.VoteState, dmz.stance.VOTE_APPROVAL_PENDING);
            dmz.object.text(handle, dmz.stance.TextHandle, text);
            dmz.object.timeStamp(handle, dmz.stance.PostedAtServerTimeHandle, 0);
            dmz.object.flag(handle, dmz.stance.UpdatePostedTimeHandle, true);
            dmz.object.flag(handle, dmz.stance.ExpiredHandle, false);
            dmz.object.flag(handle, dmz.stance.DisturbanceInTheForceHandle, false);
            dmz.object.link(dmz.stance.VoteLinkHandle, handle, advisorHandle);
            dmz.object.link(dmz.stance.CreatedByHandle, handle, hil);
            dmz.object.link(dmz.stance.VoteGroupHandle, handle, dmz.stance.getUserGroupHandle(hil));
            dmz.object.activate(handle);
            // generate automatic tag
            if (groupHandle) {

               groupName = dmz.stance.getDisplayName(groupHandle)
               voteNumber = dmz.object.superLinks(groupHandle, dmz.stance.VoteGroupHandle) || [];
               voteNumber = voteNumber.length;
               dataObject = dmz.data.create();
               dataObject.handle(dmz.stance.ObjectHandle, 0, handle);
               dataObject.string(dmz.stance.TagHandle, 0, (groupName + " vote " + voteNumber));
               dmz.stance.AUTOMATIC_TAG_MESSAGE.send(dataObject)
            }
            // send approval email (1)
            voteItem.handle = handle;
            tempHandles = dmz.object.subLinks(hil, dmz.stance.GroupMembersHandle);
            if (tempHandles) { voteItem.groupHandle = tempHandles[0]; }
            voteItem.question = text;
            EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_APPROVAL_PENDING);
         }
      });
      setUserAvatar(dmz.object.hil(), data.task.avatar);
   };

   data.topLayout = dmz.ui.layout.createHBoxLayout();
   data.topLayout.insertWidget(0, data.infoWindow.widget);
   data.topLayout.insertWidget(1, data.task.widget);
   data.layout.addLayout(data.topLayout);
   if (data.question && data.question.widget) {

      var postTextEditWidget = data.question.widget.lookup("postTextEdit")
        , postFrameWidget = data.question.widget.lookup("postFrame")
        ;

      postFrameWidget.styleSheet("QFrame { background-color: rgb(231, 203, 118); }");
      postTextEditWidget.styleSheet(
         "QTextEdit:disabled { background-color: rgb(170, 170, 170); } " +
         "QTextEdit { background-color: rgb(255, 255, 255); } ");
      //data.queryLabel = dmz.ui.label.create("Query Advisor:")
      //data.layout.addWidget(data.queryLabel);
      data.layout.addWidget(data.question.widget);
   }
   data.layout.margins(1);
   data.layout.property("spacing", 1);
   return data;
};

getVoteDecision = function (voteHandle) {

   var result = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle) || [];
   return result[0];
};

getQuestionAnswer = function (questionHandle) {

   var result = dmz.object.superLinks(questionHandle, dmz.stance.QuestionLinkHandle) || [];
   result = result.filter(function (questionHandle) {

      return dmz.object.flag(questionHandle, dmz.stance.ActiveHandle);
   });
   return result[0];
};

getAvatarPixmap = function (handle) {

   var resource = dmz.resources.findFile(dmz.object.text(handle, dmz.stance.PictureHandle));
   return dmz.ui.graph.createPixmap(resource) || AvatarDefault;
};

getHILAdvisor = function (index) {

   var groupHandle = dmz.stance.getUserGroupHandle(dmz.object.hil())
     , advisors = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle) || []
     ;

   advisors = advisors.filter(function (element) { return master.advisors[element].ID === index; });
   return advisors[0];
};

dmz.object.create.observe(self, function (handle, type) {

   var obj = { handle: handle };
   observerLists.create.forEach(function (fnc) { fnc(handle, type); });
   if (type) {

      if (type.isOfType(dmz.stance.VoteType)) { master.votes[handle] = obj; }
      else if (type.isOfType(dmz.stance.QuestionType)) { master.questions[handle] = obj; }
      else if (type.isOfType(dmz.stance.DecisionType)) { master.decisions[handle] = obj; }
      else if (type.isOfType(dmz.stance.AnswerType)) { master.answers[handle] = obj; }
      else if (type.isOfType(dmz.stance.AdvisorType)) { master.advisors[handle] = obj; }
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle, function (handle, attr, value) {

   observerLists.text.forEach(function (fnc) { fnc(handle, attr, value); });
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value, prev) {

   observerLists.onActive.forEach(function (fnc) { fnc(handle, attr, value, prev); });
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var advisorHandle
     , achievement
     , length
     ;
   if (master.questions[superHandle]) {

      advisorHandle = (dmz.object.subLinks(superHandle, dmz.stance.QuestionLinkHandle) || [])[0];
      if (advisorHandle) {

         if (!userForumPostTable[subHandle]) { userForumPostTable[subHandle] = {}; }
         userForumPostTable[subHandle][advisorHandle] = 1;

         length = Object.keys(userForumPostTable[subHandle]).length;
         if (length >= SAGE_ADVICE_COUNT_3) { achievement = dmz.stance.SageAdviceThreeAchievement; }
         else if (length >= SAGE_ADVICE_COUNT_2) { achievement = dmz.stance.SageAdviceTwoAchievement; }
         else if (length >= SAGE_ADVICE_COUNT_1) { achievement = dmz.stance.SageAdviceOneAchievement; }
         if (achievement && !dmz.stance.hasAchievement(subHandle, achievement)) {

            dmz.stance.unlockAchievement(subHandle, achievement);
         }
      }
   }

   observerLists.createdBy.forEach(function (fnc) { fnc(linkObjHandle, attrHandle, superHandle, subHandle); });
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle, function (handle, attr, value) {

   observerLists.createdAt.forEach(function (fnc) { fnc(handle, attr, value); });
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   observerLists.forumLink.forEach(function (fnc) { fnc(linkObjHandle, attrHandle, superHandle, subHandle); });
});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   observerLists.parentLink.forEach(function (fnc) { fnc(linkObjHandle, attrHandle, superHandle, subHandle); });
});

dmz.object.link.observe(self, dmz.stance.QuestionLinkHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var authorHandle
     , achievement = false
     , length = 0
     ;
   if (master.questions[superHandle]) {

      authorHandle = dmz.stance.getAuthorHandle(superHandle);
      if (authorHandle) {

         if (!userForumPostTable[authorHandle]) { userForumPostTable[authorHandle] = {}; }
         userForumPostTable[authorHandle][subHandle] = 1;

         length = Object.keys(userForumPostTable[authorHandle]).length;
         if (length >= SAGE_ADVICE_COUNT_3) { achievement = dmz.stance.SageAdviceThreeAchievement; }
         else if (length >= SAGE_ADVICE_COUNT_2) { achievement = dmz.stance.SageAdviceTwoAchievement; }
         else if (length >= SAGE_ADVICE_COUNT_1) { achievement = dmz.stance.SageAdviceOneAchievement; }

         if (achievement && !dmz.stance.hasAchievement(authorHandle, achievement)) {

            dmz.stance.unlockAchievement(authorHandle, achievement);
         }
      }
   }

   observerLists.parentLink.forEach(function (fnc) { fnc(linkObjHandle, attrHandle, superHandle, subHandle); });
});

dmz.object.scalar.observe(self, dmz.stance.ID, function (handle, attr, value) {

   if (master.advisors[handle]) { master.advisors[handle].ID = value; }
});

dmz.object.data.observe(self, dmz.stance.TagHandle, function (handle, attr, value) {

   var authorHandle
     , achievement = false
     , length = 0
     ;
   observerLists.tag.forEach(function (fnc) { fnc(handle, attr, value); });
   if (master.questions[handle]) {

      authorHandle = dmz.stance.getAuthorHandle(handle);
      if (authorHandle) {

         if (userQuestionTagTable[authorHandle]) { userQuestionTagTable[authorHandle].push(handle); }
         else { userQuestionTagTable[authorHandle] = [handle]; }

         length = userQuestionTagTable[authorHandle].length;
         if (length >= EFF_INTERR_COUNT_3) { achievement = dmz.stance.EffectiveInterrogatorThreeAchievement; }
         else if (length >= EFF_INTERR_COUNT_2) { achievement = dmz.stance.EffectiveInterrogatorTwoAchievement; }
         else if (length >= EFF_INTERR_COUNT_1) { achievement = dmz.stance.EffectiveInterrogatorOneAchievement; }

         if (achievement && !dmz.stance.hasAchievement(authorHandle, achievement)) {

            dmz.stance.unlockAchievement(authorHandle, achievement);
         }
      }
   }
});

dmz.object.state.observe(self, dmz.stance.Permissions, function (handle, attr, value, prev) {

   observerLists.permissions.forEach(function (fnc) { fnc(handle, attr, value, prev); });
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, userHandle, groupHandle) {

   if (userHandle === dmz.object.hil()) {

      AdvisorWindows.forEach(function (data) {

         var advisorHandle = getHILAdvisor(data.advisorIndex)
           , userTime = dmz.stance.userAttribute(userHandle, AdvisorTimeHandles[data.advisorIndex]) || 0
           , questions = dmz.object.superLinks(advisorHandle, dmz.stance.QuestionLinkHandle) || []
           , doHighlight = false
           , userPermissions = dmz.object.scalar(userHandle, dmz.stance.Permissions);
           ;

         data.question.setTimestamp(userTime);
         questions.forEach(function (questionHandle) {

            var time
              , answerHandle
              , authorHandle
              , authorPermissions
              ;

            if (!doHighlight) {

               authorHandle = dmz.stance.getAuthorHandle(questionHandle) || userHandle;
               answerHandle = getQuestionAnswer(questionHandle);
               authorPermissions = dmz.object.scalar(authorHandle, dmz.stance.Permissions);
               if (userHandle !== authorHandle) {

                  time = dmz.object.timeStamp(questionHandle, dmz.stance.CreatedAtServerTimeHandle) || 0;
                  if (time > userTime) { doHighlight = true; }

                  if (((userPermissions === dmz.stance.TECH_PERMISSION) ||
                     (userPermissions === dmz.stance.ADMIN_PERMISSION)) &&
                     !answerHandle && questionHandle &&
                     (authorPermissions !== dmz.stance.TECH_PERMISSION) &&
                     (authorPermissions !== dmz.stance.ADMIN_PERMISSION) &&
                     (authorPermissions !== dmz.stance.ADVISOR_PERMISSION)) {

                        doHighlight = true;
                  }
               }
               else {

                  authorHandle = dmz.stance.getAuthorHandle(answerHandle);
                  if (userHandle !== authorHandle) {

                     time =
                        dmz.object.timeStamp(
                           getQuestionAnswer(questionHandle),
                           dmz.stance.CreatedAtServerTimeHandle) || 0;
                     if (time > userTime) { doHighlight = true; }
                  }
               }
            }
         });
         if (doHighlight) { MainModule.highlight(data.windowStr); }
      });
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var type = dmz.object.type(objHandle);
   if (value && type && type.isOfType(dmz.stance.UserType)) {

      AdvisorWindows.forEach(function (data) {

         var advisorHandle = getHILAdvisor(data.advisorIndex)
           , userTime = dmz.stance.userAttribute(objHandle, AdvisorTimeHandles[data.advisorIndex]) || 0
           , questions = dmz.object.superLinks(advisorHandle, dmz.stance.QuestionLinkHandle) || []
           , doHighlight = false
           , userPermissions = dmz.object.scalar(objHandle, dmz.stance.Permissions);
           ;

         data.question.setTimestamp(userTime);
         questions.forEach(function (questionHandle) {

            var time
              , answerHandle
              , authorHandle
              , authorPermissions
              ;

            if (!doHighlight) {

               authorHandle = dmz.stance.getAuthorHandle(questionHandle) || objHandle;
               authorPermissions = dmz.object.scalar(authorHandle, dmz.stance.Permissions);
               answerHandle = getQuestionAnswer(questionHandle);
               if (objHandle !== authorHandle) {

                  time = dmz.object.timeStamp(questionHandle, dmz.stance.CreatedAtServerTimeHandle) || 0;
                  if (time > userTime) { doHighlight = true; }

                  if (((userPermissions === dmz.stance.TECH_PERMISSION) ||
                     (userPermissions === dmz.stance.ADMIN_PERMISSION)) &&
                     !answerHandle && questionHandle &&
                     (authorPermissions !== dmz.stance.TECH_PERMISSION) &&
                     (authorPermissions !== dmz.stance.ADMIN_PERMISSION) &&
                     (authorPermissions !== dmz.stance.ADVISOR_PERMISSION)) {

                        doHighlight = true;
                  }
               }
               else {

                  answerHandle = getQuestionAnswer(questionHandle);
                  authorHandle = dmz.stance.getAuthorHandle(answerHandle);
                  if (objHandle !== authorHandle) {

                     time =
                        dmz.object.timeStamp(
                           getQuestionAnswer(questionHandle),
                           dmz.stance.CreatedAtServerTimeHandle) || 0;
                     if (time > userTime) { doHighlight = true; }
                  }
               }
            }
         });
         if (doHighlight) { MainModule.highlight(data.windowStr); }
      });
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx;
   if (Mode === dmz.module.Activate) {

      MainModule = module;
      for (idx = 0; idx < ADVISOR_COUNT; idx += 1) {

         (function (index) {

            var str = "Advisor" + idx
              , data = createAdvisorWindow(str, idx)
              ;
            AdvisorWindows.push(data);
            module.addPage
               ( str
               , data.window
               , function (width, height) { data.update(getHILAdvisor(index), LoginSkipped); }
               , function () { data.onHome(); }
               );
         }(idx));
      }

      dmz.time.setRepeatingTimer(self, 1, function () {

         var msg = taskBlocked();
         AdvisorWindows.forEach(function (data) {

            if (!msg && data.task.wasBlocked) {

               data.task.text.clear();
               data.task.text.enabled(true);
               data.task.submit.enabled(true);
               data.task.wasBlocked = false;
            }
            else if (msg) {

               data.task.text.text("<font color=\"red\">" + msg + "</font>");
               data.task.text.enabled(false);
               data.task.submit.enabled(false);
               data.task.wasBlocked = true;
            }
         });
      });
   }
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});
