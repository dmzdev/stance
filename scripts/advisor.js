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
   , MAX_QUESTION_STR_LEN = 144
   , MAX_QUESTION_REPLY_LEN = 500
   , MAX_TASK_STR_LEN = 144
   , MAX_TASK_REPLY_LEN = 500

   // Variables
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
   , extraInfoList = []
   , observerLists =
        { create: []
        , text: []
        , createdBy: []
        , createdAt: []
        , forumLink: []
        , parentLink: []
        }

   // Functions
   , createAdvisorWindow
   , getVoteDecision
   , getQuestionAnswer
   , getAvatarPixmap
   , getHILAdvisor
   , taskBlocked
   , setUserAvatar
   ;

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

         var decision = getVoteDecision(voteHandle)
           , voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState)
           ;

         if (!decision ||
            ((voteState === dmz.stance.VOTE_APPROVAL_PENDING) &&
               (voteState !== dmz.stance.VOTE_ACTIVE))) {

            result = "New tasks cannot be submitted while your group has an active task.";
         }
      });
   }

   if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

      result = "New votes cannot be created by admin users.";
   }
   if (LoginSkipped || !hil) { result = "New tasks cannot be created without logging in."; }
   return result;
};

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

createAdvisorWindow = function (windowStr) {

   var data = {};

   data.update = function () { self.log.error ("Could not update", windowStr); }
   data.onHome = function () { self.log.error ("Could not do onHome for", windowStr); }
   data.window = dmz.ui.widget.create();
   data.layout = dmz.ui.layout.createVBoxLayout();
   data.window.layout(data.layout);
   data.infoWindow = { widget: dmz.ui.loader.load("AdvisorWindow.ui") }
   data.infoWindow.name = data.infoWindow.widget.lookup("nameLabel");
   data.infoWindow.bio = data.infoWindow.widget.lookup("bioText");
   data.infoWindow.title = data.infoWindow.widget.lookup("specialtyLabel");
   data.infoWindow.picture = data.infoWindow.widget.lookup("pictureLabel");
   data.infoWindow.picture.pixmap(AvatarDefault);

   data.task = { widget: dmz.ui.loader.load("CommentAdd.ui") };
   data.task.avatar = data.task.widget.lookup("avatarLabel");
   data.task.text = data.task.widget.lookup("textEdit");
   data.task.submit = data.task.widget.lookup("submitButton");
   data.task.widget.lookup("cancelButton").hide();
   data.task.widget.lookup("labelLayout").addWidget(dmz.ui.label.create("Submit Task for Voting:"))
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
      , forumType: dmz.stance.AdvisorType
      , parentHandle: dmz.stance.QuestionLinkHandle
      , groupLinkHandle: dmz.stance.AdvisorGroupHandle
      , useForumData: true
      , timeHandle: dmz.stance.VoteTimeHandle
      , messageLength: MAX_QUESTION_STR_LEN
      , replyLength: MAX_QUESTION_REPLY_LEN
      , highlight: function () { MainModule.highlight(windowStr); }
      , canReplyTo: function (replyToHandle) {

           var type = dmz.object.type(replyToHandle);
           return dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle) && type &&
              type.isOfType(dmz.stance.QuestionType) && !getQuestionAnswer(replyToHandle);
        }
      , postBlocked: function (advisorHandle) {

           var questions = dmz.object.superLinks(advisorHandle, dmz.stance.QuestionHandle)
             , result
             ;

           if (questions) {

              questions.forEach(function (questionHandle) {

                 if (!getQuestionAnswer(questionHandle) &&
                    !dmz.object.flag(dmz.stance.getAuthorHandle(questionHandle), dmz.stance.AdminHandle)) {

                    result = "New questions cannot be submitted while another question is active with the current advisor.";
                 }
              });
           }
           if (LoginSkipped || !dmz.object.hil()) { result = "New questions cannot be created without logging in."; }
           return result;
        }
      });

   Object.keys(data.question.observers).forEach(function (key) {

      observerLists[key].push(data.question.observers[key]);
   });

   data.onHome = function () {

      if (data.question && data.question.onHome) { data.question.onHome(); }
   };

   data.update = function (advisorHandle) {

      data.advisor = advisorHandle;
      data.infoWindow.name.text(dmz.object.text(advisorHandle, dmz.stance.NameHandle));
      data.infoWindow.bio.text(dmz.object.text(advisorHandle, dmz.stance.BioHandle));
      data.infoWindow.title.text(dmz.object.text(advisorHandle, dmz.stance.TitleHandle));
      data.infoWindow.picture.pixmap(getAvatarPixmap(advisorHandle));

      if (data.question && data.question.update) { data.question.update(advisorHandle); }
      data.task.submit.observe(self, "clicked", function () {

         var handle
           , text = data.task.text.text()
           ;
         if (text.length) {

            handle = dmz.object.create(dmz.stance.VoteType);
            dmz.object.scalar(handle, dmz.stance.VoteState, dmz.stance.VOTE_APPROVAL_PENDING);
            dmz.object.text(handle, dmz.stance.TextHandle, text);
            dmz.object.timeStamp(handle, dmz.stance.CreatedAtServerTimeHandle, 0);
            dmz.object.flag(handle, dmz.stance.UpdateStartTimeHandle, true);
            dmz.object.link(dmz.stance.VoteLinkHandle, handle, advisorHandle);
            dmz.object.link(dmz.stance.CreatedByHandle, handle, dmz.object.hil());
            dmz.object.activate(handle);
         }
      });
      setUserAvatar(dmz.object.hil(), data.task.avatar);
   };

   dmz.time.setRepeatingTimer(self, 1, function () {

      var msg = taskBlocked(data.advisor);
      if (!msg && WasBlocked) {

         data.task.text.clear();
         data.task.text.enabled(true);
         data.task.submit.enabled(true);
         WasBlocked = false;
      }
      else if (msg) {

         data.task.text.text("<font color=\"red\">" + msg + "</font>");
         data.task.text.enabled(false);
         data.task.submit.enabled(false);
         WasBlocked = true;
      }
   });

   data.topLayout = dmz.ui.layout.createHBoxLayout();
   data.topLayout.insertWidget(0, data.infoWindow.widget);
   data.topLayout.insertWidget(1, data.task.widget);
   data.layout.addLayout(data.topLayout);
   if (data.question && data.question.widget) {

      data.layout.addWidget(dmz.ui.label.create("Query Advisor:"));
      data.layout.addWidget(data.question.widget);
   }
   return data;
};

getVoteDecision = function (voteHandle) {

   var result = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
   return (result && result.length) ? result[0] : false;
};

getQuestionAnswer = function (questionHandle) {

   var type = dmz.object.type(questionHandle)
     , result = dmz.object.superLinks(questionHandle, dmz.stance.QuestionLinkHandle)
     ;
   return (type && type.isOfType(dmz.stance.QuestionType) && result && result.length) ?
      result[0] : false;
};

getAvatarPixmap = function (handle) {

   var resource = dmz.resources.findFile(dmz.object.text(handle, dmz.stance.PictureHandle))
     , pixmap = dmz.ui.graph.createPixmap(resource)
     ;

   return pixmap ? pixmap : AvatarDefault;
};

getHILAdvisor = function (index) {

   var groupHandle = dmz.stance.getUserGroupHandle(dmz.object.hil())
     , advisors = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
     ;

   if (advisors) {

      advisors = advisors.filter(function (element) {

         return master.advisors[element].ID === index;
      });
   }
   return (advisors && advisors.length) ? advisors[0] : false;
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

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

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

   observerLists.parentLink.forEach(function (fnc) { fnc(linkObjHandle, attrHandle, superHandle, subHandle); });
});

dmz.object.scalar.observe(self, dmz.stance.ID, function (handle, attr, value) {

   if (master.advisors[handle]) { master.advisors[handle].ID = value; }
});

dmz.object.scalar.observe(self, dmz.stance.VoteState, function (handle, attr, value) {

   if (master.decisions[handle]) {

      extraInfoList.forEach(function (fnc) { fnc(handle); });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.ExpireHandle, function (handle, attr, value) {

   if (master.decisions[handle]) {

      extraInfoList.forEach(function (fnc) { fnc(handle); });
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkObjHandle, attrHandle, decisionHandle, userHandle) {

   if (master.decisions[decisionHandle]) {

      extraInfoList.forEach(function (fnc) { fnc(decisionHandle); });
   }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkObjHandle, attrHandle, decisionHandle, userHandle) {

   if (master.decisions[decisionHandle]) {

      extraInfoList.forEach(function (fnc) { fnc(decisionHandle); });
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx;
   if (Mode === dmz.module.Activate) {

      for (idx = 0; idx < ADVISOR_COUNT; idx += 1) {

         (function (index) {

            var data
              , str
              ;
            str = "Advisor" + idx;
            data = createAdvisorWindow(str);
            AdvisorWindows.push(data);
            module.addPage
               ( str
               , data.window
               , function () { data.update(getHILAdvisor(index)); }
               , function () { data.onHome(); }
               );
         }(idx));
      };
   }
});
