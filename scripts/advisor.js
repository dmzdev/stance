require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
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
   , _NoContentWarning =
        dmz.ui.messageBox.create(
           { type: dmz.ui.messageBox.Warning
            , text: "You must log in to the server to interact with this!"
            , informativeText: "If you want to interact with this, please restart STANCE and log in."
            , standardButtons: [dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Ok
            }
            , dmz.ui.mainWindow.centralWidget()
            )
   , AdvisorWindows = []

   // Consts
   , ADVISOR_COUNT = 5
   , MAX_QUESTION_STR_LEN = 144
   , MAX_QUESTION_REPLY_LEN = 500
   , MAX_TASK_STR_LEN = 144
   , MAX_TASK_REPLY_LEN = 500
   , VOTE_APPROVAL_PENDING = 0
   , VOTE_DENIED = 1
   , VOTE_ACTIVE = 2
   , VOTE_YES = 3
   , VOTE_NO = 4
   , STATE_STR =
        [ "Submitted"
        , "Denied"
        , "Active"
        , "Passed"
        , "Failed"
        ]

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
   , getCreatedBy
   , getAvatarPixmap

   , getHILAdvisor

   , addPost
   , addComment

   , updateCreatedAt
   , updateCreatedBy
   , updateMessage
   , updateAvatar

   , setupForumView


   ;

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

createAdvisorWindow = function (windowStr) {

   var data = {};

   data.update = function () { self.log.error ("Could not update", windowStr); }
   data.onHome = function () { self.log.error ("Could not do onHome for", windowStr); }
   data.window = dmz.ui.widget.create();
   data.layout = dmz.ui.layout.createGridLayout();
   data.window.layout(data.layout);
   data.infoWindow = { widget: dmz.ui.loader.load("AdvisorWindow.ui") }
   data.infoWindow.name = data.infoWindow.widget.lookup("nameLabel");
   data.infoWindow.bio = data.infoWindow.widget.lookup("bioText");
   data.infoWindow.title = data.infoWindow.widget.lookup("specialtyLabel");
   data.infoWindow.picture = data.infoWindow.widget.lookup("pictureLabel");
   data.infoWindow.picture.pixmap(AvatarDefault);

   data.task = dmz.forumView.setupForumView(
      { self: self
      , postType: dmz.stance.VoteType
      , commentType: dmz.stance.DecisionType
      , forumType: dmz.stance.AdvisorType
      , parentHandle: dmz.stance.VoteLinkHandle
      , groupLinkHandle: dmz.stance.AdvisorGroupHandle
      , useForumData: true
      , messageLength: MAX_TASK_STR_LEN
      , replyLength: MAX_TASK_REPLY_LEN
      , highlight: function () { MainModule.highlight(windowStr); }
      , onNewPost: function (handle) { dmz.object.scalar(handle, dmz.stance.VoteState, VOTE_APPROVAL_PENDING); }
      , canReplyTo: function (replyToHandle) { return false; }
      , canPost: function () {

           var hil = dmz.object.hil()
             , advisors = dmz.object.subLinks(dmz.stance.getUserGroupHandle(hil), dmz.stance.AdvisorGroupHandle)
             , result
             , votes = []
             ;

           result = hil && !dmz.object.flag(hil, dmz.stance.AdminHandle);

           advisors.forEach(function (advisorHandle) {

              var links = dmz.object.superLinks(advisorHandle, dmz.stance.VoteLinkHandle) || [];
              votes = votes.concat(links);
           });
           if (votes && votes.length) {

              votes.forEach(function (voteHandle) {

                 var decision = getVoteDecision(voteHandle)
                   , voteState = dmz.object.scalar(decision, dmz.stance.VoteState)
                   , result = dmz.object.hil()
                   ;

                 if (!decision ||
                    ((voteState !== VOTE_YES) &&
                       (voteState !== VOTE_NO) &&
                       (voteState !== VOTE_DENIED))) {

                    result = false;
                 }
              });
           }
           return result && !LoginSkipped;
        }
      , extraInfo: function (handle) {

           var type = dmz.object.type(handle)
             , state = -1
             , result = ""
             , links
             , total = 0
             , expire
             ;

           if (type && type.isOfType(dmz.stance.DecisionType)) {

              state = dmz.object.scalar(handle, dmz.stance.VoteState);
              if ((state === VOTE_APPROVAL_PENDING) || (state === VOTE_DENIED)) {

                 result = STATE_STR[state];
              }
              else if ((state === VOTE_ACTIVE) || (state === VOTE_YES) || (state === VOTE_NO)) {

                 result = STATE_STR[state];
                 links = dmz.object.subLinks(handle, dmz.stance.YesHandle);
                 total += links ? links.length : 0;
                 result += " - Y: " + (links ? links.length : 0);

                 links = dmz.object.subLinks(handle, dmz.stance.NoHandle);
                 total += links ? links.length : 0;
                 result += " N: " + (links ? links.length : 0);

                 links = dmz.object.scalar(handle, dmz.stance.TotalHandle);
                 result += " U: " + (links ? (links - total) : "?");

                 expire = dmz.object.timeStamp(handle, dmz.stance.ExpireHandle);
                 if (expire) {

                    result += " - Ends: " +
                       dmz.util.timeStampToDate(expire).toString("MMM-dd-yyyy hh:mm:ss tt");
                 }
              }
           }
           return result;
        }
      });
   if (data.task.updateExtraInfo) { extraInfoList.push(data.task.updateExtraInfo); }

   data.question = dmz.forumView.setupForumView(
      { self: self
      , postType: dmz.stance.QuestionType
      , commentType: dmz.stance.AnswerType
      , forumType: dmz.stance.AdvisorType
      , parentHandle: dmz.stance.QuestionLinkHandle
      , groupLinkHandle: dmz.stance.AdvisorGroupHandle
      , useForumData: true
      , messageLength: MAX_QUESTION_STR_LEN
      , replyLength: MAX_QUESTION_REPLY_LEN
      , highlight: function () { MainModule.highlight(windowStr); }
      , canReplyTo: function (replyToHandle) {

           var type = dmz.object.type(replyToHandle);
           return dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle) && type &&
              type.isOfType(dmz.stance.QuestionType) && !getQuestionAnswer(replyToHandle);
        }
      , canPost: function (advisorHandle) {

           var questions = dmz.object.superLinks(advisorHandle, dmz.stance.QuestionHandle)
             , result = dmz.object.hil()
             ;

           if (questions) {

              questions.forEach(function (questionHandle) {

                 if (!getQuestionAnswer(questionHandle) &&
                    !dmz.object.flag(getCreatedBy(questionHandle), dmz.stance.AdminHandle)) {

                    result = false;
                 }
              });
           }
           return result && !LoginSkipped;
        }
      });

   Object.keys(data.task.observers).forEach(function (key) {

      observerLists[key].push(data.task.observers[key]);
   });

   Object.keys(data.question.observers).forEach(function (key) {

      observerLists[key].push(data.question.observers[key]);
   });

   data.onHome = function () {

      if (data.question && data.question.onHome) { data.question.onHome(); }
      if (data.task && data.task.onHome) { data.task.onHome(); }
   };

   data.update = function (advisorHandle) {

      self.log.warn ("Update:", dmz.stance.getDisplayName(advisorHandle));
      data.infoWindow.name.text(dmz.object.text(advisorHandle, dmz.stance.NameHandle));
      data.infoWindow.bio.text(dmz.object.text(advisorHandle, dmz.stance.BioHandle));
      data.infoWindow.title.text(dmz.object.text(advisorHandle, dmz.stance.TitleHandle));
      data.infoWindow.picture.pixmap(getAvatarPixmap(advisorHandle));

      if (data.question && data.question.update) { data.question.update(advisorHandle); }
      if (data.task && data.task.update) { data.task.update(advisorHandle); }
   };

   data.layout.addWidget(data.infoWindow.widget, 0, 0, 1, 2);
   if (data.task && data.task.widget) { data.layout.addWidget(data.task.widget, 1, 0); }
   if (data.question && data.question.widget) {

      data.layout.addWidget(data.question.widget, 1, 1);
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

getCreatedBy = function (handle) {

   var author = dmz.object.subLinks(handle, dmz.stance.CreatedByHandle);
   return (author && author.length) ? author[0] : false;
};

getAvatarPixmap = function (handle) {

   var resource = dmz.resources.findFile(dmz.object.text(handle, dmz.stance.PictureHandle))
     , pixmap = dmz.ui.graph.createPixmap(resource)
     ;

   return pixmap ? pixmap : AvatarDefault;
};

getHILAdvisor = function (index) {

   var groupHandle = dmz.stance.getUserGroupHandle(dmz.object.hil())
     , advisors = dmz.object.subLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
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
