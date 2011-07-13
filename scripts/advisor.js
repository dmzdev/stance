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
   , MAX_TASK_STR_LEN = 144
   , VOTE_APPROVAL_PENDING = 0
   , VOTE_DENIED = 1
   , VOTE_ACTIVE = 2
   , VOTE_YES = 3
   , VOTE_NO = 4
   , STATE_STR =
        [ "Submitted"
        , "Denied"
        , "Active"
        , "Approved"
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

   var data = {}
     , canReplyFnc
     , canPostFnc
     ;

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

   canReplyFnc = function (replyToHandle) {

      return dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle) &&
         dmz.object.type(replyToHandle).isTypeOf(dmz.stance.VoteType) &&
         !getVoteDecision(replyToHandle) && !LoginSkipped;
   };

   canPostFnc = function (advisorHandle) {

      var votes = dmz.object.superLinks(advisorHandle, dmz.stance.VoteHandle)
        , result = dmz.object.hil() ? true : false;
        ;

      if (votes) {

         votes.forEach(function (voteHandle) {

            var decision = getVoteDecision(voteHandle)
              , voteState = dmz.object.counter(decision, dmz.stance.VoteState)
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
   };

   data.task = dmz.forumView.setupForumView(
      { self: self
      , postType: dmz.stance.VoteType
      , commentType: dmz.stance.DecisionType
      , forumType: dmz.stance.AdvisorType
      , parentHandle: dmz.stance.VoteLinkHandle
      , groupLinkHandle: dmz.stance.AdvisorGroupHandle
      , highlight: function () { MainModule.highlight(windowStr); }
      , canReplyTo: canReplyFnc
      , canPost: canPostFnc
      , messageLength: MAX_TASK_STR_LEN
      });

   canReplyFnc = function (replyToHandle) {

      return dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle) && !getQuestionAnswer(replyToHandle);
   };

   canPostFnc = function (advisorHandle) {

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
      return result;
   };

   data.question = dmz.forumView.setupForumView(
      { self: self
      , postType: dmz.stance.QuestionType
      , commentType: dmz.stance.AnswerType
      , forumType: dmz.stance.AdvisorType
      , parentHandle: dmz.stance.QuestionLinkHandle
      , groupLinkHandle: dmz.stance.AdvisorGroupHandle
      , highlight: function () { MainModule.highlight(windowStr); }
      , canReplyTo: canReplyFnc
      , canPost: canPostFnc
      , messageLength: MAX_QUESTION_STR_LEN
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

   var result = dmz.object.superLinks(questionHandle, dmz.stance.QuestionLinkHandle);
   return (result && result.length) ? result[0] : false;
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

   self.log.warn("Get HIL Advisor:", index, groupHandle, advisors);
   return (advisors && advisors.length) ? advisors[0] : false;
};

dmz.object.create.observe(self, function (handle, type) {

   var obj = { handle: handle };

   if (type) {

      if (type.isOfType(dmz.stance.VoteType)) { master.votes[handle] = obj; }
      else if (type.isOfType(dmz.stance.QuestionType)) { master.questions[handle] = obj; }
      else if (type.isOfType(dmz.stance.DecisionType)) { master.decisions[handle] = obj; }
      else if (type.isOfType(dmz.stance.AnswerType)) { master.answers[handle] = obj; }
      else if (type.isOfType(dmz.stance.AdvisorType)) { master.advisors[handle] = obj; }
   }
});

dmz.object.scalar.observe(self, dmz.stance.ID, function (handle, attr, value) {

   if (master.advisors[handle]) { master.advisors[handle].ID = value; }
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
            module.addPage
               ( str
               , data.window
               , function () { self.log.warn("Update", index); data.update(getHILAdvisor(index)); }
               , function () { data.onHome(); }
               );
         }(idx));
      };
   }
});
