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
   }

   // UI Elements
   , ApproveVoteDialog = dmz.ui.loader.load("ApproveVoteDialog.ui", dmz.ui.mainWindow.centralWidget())
   , VoteTextArea = ApproveVoteDialog.lookup("taskingText")
   , VoteOpinionArea = ApproveVoteDialog.lookup("opinionText")
   , ApproveVoteAdvisorLabel = ApproveVoteDialog.lookup("advisorLabel")
   , ApproveVoteAdvisorTitle = ApproveVoteDialog.lookup("advisorTitle")

   , AnswerQuestionDialog = dmz.ui.loader.load("AnswerQuestionDialog.ui", dmz.ui.mainWindow.centralWidget())
   , QuestionTextArea = AnswerQuestionDialog.lookup("questionText")
   , QuestionAnswerArea = AnswerQuestionDialog.lookup("answerText")

   , VoteDialog = dmz.ui.loader.load("VoteDialog.ui", dmz.ui.mainWindow.centralWidget())
   , YesList = VoteDialog.lookup("yesList")
   , NoList = VoteDialog.lookup("noList")
   , UndecList = VoteDialog.lookup("undecList")
   , TaskText = VoteDialog.lookup("taskingText")
   , VoteCommentText = VoteDialog.lookup("opinionText")
   , VoteExpirationTime = VoteDialog.lookup("expirationTime")
   , YesButton = VoteDialog.lookup("yesButton")
   , NoButton = VoteDialog.lookup("noButton")
   , VoteAdvisorLabel = VoteDialog.lookup("advisorLabel")

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

   // Variables
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , advisorWidgets = []
   , advisorData = {}
   , groupAdvisors = {}
   , advisorCount = 5
   , voteHistoryWidgets = {}
   , questionHistoryWidgets = {}
   , MaxMessageLength = 144
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , advisorAttr =
        [ dmz.stance.Advisor0Handle
        , dmz.stance.Advisor1Handle
        , dmz.stance.Advisor2Handle
        , dmz.stance.Advisor3Handle
        , dmz.stance.Advisor4Handle
        ]
   , EmailMod = false
   , master = { questions: {}, votes: {}, advisors: {} }
   , TreeItemIndex =
        { vote: { id: 0, status: 1, yes: 2, no: 3, undec: 4, time: 5, end: 6}
        , question: { id: 0, read: 1, author: 2, time: 3 }
        , advisor: {}
        }
   , TimeFormatString = "MMM-dd-yyyy H:mm:ss"

   // Function decls
   , updateAdvisor
   , approveVote
   , answerQuestion
   , fillList
   , getVoteGroupHandle
   , getAdvisorGroupHandle
   , getVoteStatus
   , answeredQuestionCount
   , isVoteExpired
   , addVote
   , addQuestion
   , updateID
   , updateStatus
   , updateYesVotes
   , updateNoVotes
   , updateUndecVotes
   , updateTime
   , updateEnd
   , updateRead
   , updateAuthor
   , updateVisibility
   , resetTree
   , setTreeForAdvisor
   ;

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

setTreeForAdvisor = function (advisorHandle, voteTree, questionTree) {

   var item = master.advisors[advisorHandle]
     , idx = 0
     ;
   resetTree(voteTree);
   resetTree(questionTree);

   if (item) {

      if (voteTree) {

         item.votes.forEach(function (voteHandle) {

            var voteItem = master.votes[voteHandle] ? master.votes[voteHandle].item : false
              ;

            if (voteItem) {

               if (voteItem.treeWidget() !== voteTree) { voteTree.add(voteItem); }
               voteItem.hidden(false);
               voteTree.currentItem(voteItem);
            }
         });

         for (idx = 0; idx < voteTree.columnCount(); idx += 1) {

            voteTree.resizeColumnToContents(idx);
         }
      }

      if (questionTree) {

         item.questions.forEach(function (questionHandle) {

            var questionItem = master.questions[questionHandle] ? master.questions[questionHandle].item : false
              ;

            if (questionItem) {

               if (questionItem.treeWidget() !== questionTree) { questionTree.add(questionItem); }
               questionItem.hidden(false);
               questionTree.currentItem(questionItem);
            }
         });

         for (idx = 0; idx < questionTree.columnCount(); idx += 1) {

            questionTree.resizeColumnToContents(idx);
         }
      }
   }
};

resetTree = function (treeWidget) {

   var child
     , root = treeWidget ? treeWidget.root() : false
     , count
     , idx
     ;
   if (root) {

      count = root.childCount();
      for (idx = 0; count && (idx < count); idx += 1) {

         child = root.child(idx);
         if (child) { child.hidden(true); }
      }
   }
};

addVote = function (voteHandle) {

   var vote = master.votes[voteHandle];
   if (vote && !vote.item) {

      vote.item = dmz.ui.treeWidget.createItem(["ID", "Status", "Yes", "No", "Undec", "Time", "End"]);
      if (vote.item) {

         vote.item.data(0, voteHandle);
         vote.item.hidden(true);
         updateID(voteHandle);
         updateStatus(voteHandle);
         updateYesVotes(voteHandle);
         updateNoVotes(voteHandle);
         updateUndecVotes(voteHandle);
         updateTime(voteHandle);
         updateEnd(voteHandle);
         updateVisibility(voteHandle);

      }
   }
};

addQuestion = function (questionHandle) {

   var question = master.questions[questionHandle];
   if (question && !question.item) {

      question.item = dmz.ui.treeWidget.createItem(["ID", "", "Author", "Time"]);
      if (question.item) {

         question.item.data(0, questionHandle);
         question.item.hidden(true);
         updateID(questionHandle);
         updateRead(questionHandle);
         updateAuthor(questionHandle);
         updateTime(questionHandle);
         updateVisibility(questionHandle);
      }
   }
};

updateID = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].id, item.id); }
};

updateStatus = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].status, item.status); }
};

updateYesVotes = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].yes, item.yes); }
};

updateUndecVotes = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].undec, item.undec); }
};

updateNoVotes = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].no, item.no); }
};

updateTime = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) {

      item.item.text(TreeItemIndex[item.type].time, item.time);
   }
};

updateEnd = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) {

      item.item.text(TreeItemIndex[item.type].end, item.end);
   }
};

updateRead = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].read, item.read); }
};

updateAuthor = function (handle) {

   var item = master.questions[handle];
   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.text(TreeItemIndex[item.type].author, item.author); }
};

updateVisibility = function (handle) {

   var item = master.questions[handle]
     ;

   if (!item) { item = master.votes[handle]; }
   if (item && item.item) { item.item.hidden(false); }
};

dmz.object.create.observe(self, function (handle, type) {

   var obj = { handle: handle }

   if (type) {

      if (type.isOfType(dmz.stance.QuestionType)) {

         obj.type = "question";
         obj.read = ""
         master.questions[handle] = obj;
      }
      else if (type.isOfType(dmz.stance.VoteType)) {

         obj.type = "vote";
         obj.yes = 0;
         obj.no = 0;
         obj.undec = 0;
         master.votes[handle] = obj;
      }
      else if (type.isOfType(dmz.stance.AdvisorType)) {

         obj.questions = [];
         obj.votes = [];
         obj.type = "advisor";
         obj.index = -1;
         master.advisors[handle] = obj;
      }
   }
});

dmz.object.scalar.observe(self, dmz.stance.ID, function (objHandle, attr, value) {

   var item = master.questions[objHandle]
     ;

   if (!item) { item = master.votes[objHandle]; }
   if (item) { item.id = value; updateID(objHandle); }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtGameTimeHandle,
function (objHandle, attr, value) {

   var item = master.questions[objHandle]
     ;

   if (!item) { item = master.votes[objHandle]; }
   if (item) {

      item.time = dmz.util.timeStampToDate(value);
      item.time =
         item.time.toString(TimeFormatString) +
         (item.time.isDaylightSavingTime() ? " PDT" : " PST");
      updateTime(objHandle);
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.DurationHandle,
function (objHandle, attr, value) {

   var item = master.questions[objHandle]
     ;

   if (!item) { item = master.votes[objHandle]; }
   if (item) {

      item.end = dmz.util.timeStampToDate(value);
      item.end =
         item.end.toString(TimeFormatString) +
         (item.end.isDaylightSavingTime() ? " PDT" : " PST");
      updateEnd(objHandle);
   }
});

isVoteExpired = function (voteHandle) {

   var currTime = dmz.time.getFrameTime()
     , expireTime = dmz.object.timeStamp(voteHandle, dmz.stance.DurationHandle)
     , expired
     , yesHandleList
     , noHandleList
     , result
     ;

   expired =
      dmz.object.flag(voteHandle, dmz.stance.VoteApprovedHandle) &&
      expireTime && currTime && (expireTime < currTime);
   if (expired && dmz.object.flag(voteHandle, dmz.stance.ActiveHandle)) {

      yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle);
      noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle);
      yesHandleList = yesHandleList ? yesHandleList.length : 0;
      noHandleList = noHandleList ? noHandleList.length : 0;
      result = (yesHandleList > noHandleList) ? true : false;
      dmz.object.flag(voteHandle, dmz.stance.ActiveHandle, false);
      dmz.object.flag(voteHandle, dmz.stance.VoteResultHandle, result);
   }
   return expired;
}

getVoteGroupHandle = function (voteHandle) {

   var voteGroupHandle = 0
     , retval = 0
     ;

   if (voteHandle) {

      voteGroupHandle = dmz.object.superLinks(voteHandle, dmz.stance.GroupActiveVoteHandle);
      if (!voteGroupHandle || !voteGroupHandle[0]) {

         voteGroupHandle = dmz.object.superLinks(voteHandle, dmz.stance.GroupCompletedVotesHandle);
      }

      if (voteGroupHandle && voteGroupHandle[0]) { retval = voteGroupHandle[0]; }
   }
   return retval;
};

getAdvisorGroupHandle = function (advisorHandle) {

   var advGroupHandle = 0
     , retval = 0
     ;

   if (advisorHandle) {

      advGroupHandle = dmz.object.superLinks(advisorHandle, dmz.stance.AdvisorGroupHandle);
      if (advGroupHandle && advGroupHandle[0]) { retval = advGroupHandle[0]; }
   }
   return retval;
};

getVoteStatus = function (voteHandle) {

   var status = "E: " + voteHandle
     , Active = dmz.object.flag(voteHandle, dmz.stance.ActiveHandle)
     , Submitted = dmz.object.flag(voteHandle, dmz.stance.VoteSubmittedHandle)
     , Approved = dmz.object.flag(voteHandle, dmz.stance.VoteApprovedHandle)
     , Result = dmz.object.flag(voteHandle, dmz.stance.VoteResultHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle)
     ;

   if (Active) {

      if (Submitted) { status = "SBMITD"; }
      else {

         if (Approved) { status = "ACTIVE"; }
         else { status = "DENIED"; }
      }
   }
   else {

      if (Result) { status = "PASSED"; }
      else if (!noHandleList) { status = "DENIED"; }
      else { status = "FAILED"; }
   }
   return status;
};

(function () {

   var idx, historyItemChanged;
   for (idx = 0; idx < advisorCount; idx += 1) {

      advisorWidgets[idx] = dmz.ui.loader.load("AdvisorWindow.ui");

      (function (widget) {

         historyItemChanged = function (item) {

            var handle
              , type
              , hil = dmz.object.hil()
              , text
              , groupHandle = false
              , advisorHandle
              ;

            if (item) {

               handle = item.data(0);
               type = dmz.object.type(handle);
               if (type) {

                  if (type.isOfType(dmz.stance.VoteType)) { groupHandle = getVoteGroupHandle(handle); }
                  else if (type.isOfType(dmz.stance.QuestionType)) {

                     advisorHandle = dmz.object.superLinks(handle, dmz.stance.AdvisorActiveQuestionHandle);
                     if (!advisorHandle) {

                        advisorHandle = dmz.object.superLinks(handle, dmz.stance.AdvisorAnsweredQuestionHandle);
                     }
                     advisorHandle = (advisorHandle && advisorHandle.length) ? advisorHandle[0] : false;
                     groupHandle = getAdvisorGroupHandle(advisorHandle);
                  }

                  if (hil && groupHandle &&
                     (dmz.stance.getUserGroupHandle(hil) === groupHandle)) {

                     text = dmz.object.text(handle, dmz.stance.TextHandle);
                     widget.lookup("selectedText").text(text ? text : "");
                     text = dmz.object.text(handle, dmz.stance.CommentHandle);
                     widget.lookup("selectedOpinion").text(text ? text : "");

                     if (!dmz.object.flag(hil, dmz.stance.AdminHandle) &&
                        dmz.object.superLinks(handle, dmz.stance.AdvisorAnsweredQuestionHandle)) {

                        dmz.object.link(dmz.stance.ViewedQuestionHandle, hil, handle);
                     }
                  }
               }

            }
         }

         widget.observe(self, "voteHistoryTree", "currentItemChanged", historyItemChanged);
         widget.observe(self, "questionHistoryTree", "currentItemChanged", historyItemChanged);
         dmz.stance.addUITextLimit
            ( self
            , MaxMessageLength
            , widget.lookup("questionText")
            , widget.lookup("submitQuestionButton")
            , widget.lookup("qCurrentCharAmt")
            , widget.lookup("qTotalCharAmt")
            );

         dmz.stance.addUITextLimit
            ( self
            , MaxMessageLength
            , widget.lookup("taskingText")
            , widget.lookup("submitTaskButton")
            , widget.lookup("tCurrentCharAmt")
            , widget.lookup("tTotalCharAmt")
            );
      }(advisorWidgets[idx]));
   }
}());

approveVote = function (voteHandle) {

   var advisorHandle = dmz.object.superLinks(voteHandle, dmz.stance.VoteAdvisorHandle);
   advisorHandle = (advisorHandle && advisorHandle.length) ? advisorHandle[0] : -1;
   VoteTextArea.text(dmz.object.text(voteHandle, dmz.stance.TextHandle));
   ApproveVoteAdvisorLabel.text(dmz.stance.getDisplayName(advisorHandle));
   ApproveVoteAdvisorTitle.text(dmz.object.text(advisorHandle, dmz.stance.TitleHandle));
   if (LoginSkipped) { _NoContentWarning.open(self, function () {}); }
   else {

      ApproveVoteDialog.open(self, function (result, dialog) {

         var text
           , time
           , amt
           ;
         text = VoteOpinionArea.text();
         if (!text || !text.length) { text = "I have no opinion on this matter."; }
         dmz.object.text(voteHandle, dmz.stance.CommentHandle, text);
         dmz.object.flag(voteHandle, dmz.stance.VoteApprovedHandle, result);
         dmz.object.flag(voteHandle, dmz.stance.VoteSubmittedHandle, false);
         if (!result) {

            dmz.object.flag(voteHandle, dmz.stance.ActiveHandle, false);
            dmz.object.flag(voteHandle, dmz.stance.VoteResultHandle, false);
            dmz.object.timeStamp(voteHandle, dmz.stance.DurationHandle, dmz.time.getFrameTime());
         }
         else {

            time = dmz.util.timeStampToDate(dmz.time.getFrameTime());
            time.add(dialog.lookup("durationSpinBox").value()).hours();
            EmailMod.sendEmail
               ( dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
               , "STANCE: Your group must vote on a new task!"
               , "Student, \n" + "Your advisor has approved voting on the following task:\n" +
                    dmz.object.text(voteHandle, dmz.stance.TextHandle) +
                    "\nYour advisor's response to the task was:\n" +
                    dmz.object.text(voteHandle, dmz.stance.CommentHandle) +
                    "\nPlease go vote on this task as soon as possible! It expires at: " +
                    time
               );
            time = dmz.util.dateToTimeStamp(time);
            dmz.object.timeStamp(voteHandle, dmz.stance.DurationHandle, time);
         }

         VoteOpinionArea.text("");
         VoteTextArea.text("");
      });
   }
}

answerQuestion = function (questionHandle) {

   QuestionTextArea.text(dmz.object.text(questionHandle, dmz.stance.TextHandle));

   if (LoginSkipped) { _NoContentWarning.open(self, function () {}); }
   else {

      AnswerQuestionDialog.open(self, function (result, dialog) {

         var text;
         text = QuestionAnswerArea.text();
         if (!text || !text.length) { text = "I have no opinion on this matter."; }
         dmz.object.text(questionHandle, dmz.stance.CommentHandle, text);
         dmz.object.flag(questionHandle, dmz.stance.ActiveHandle, false);
         dmz.object.link(dmz.stance.ViewedQuestionHandle, dmz.object.hil(), questionHandle);
         QuestionAnswerArea.text("");
         QuestionTextArea.text("");
      });
   }
};

updateAdvisor = function (module, idx) {

   var advisorFunction
     , exitAdvisor
     ;

  exitAdvisor = function () {

     var hil = dmz.object.hil()
       , hilGroup = dmz.stance.getUserGroupHandle(hil)
       , count
       ;

     if (hilGroup) {

        count =
           dmz.object.subLinks(groupAdvisors[hilGroup][idx], dmz.stance.AdvisorAnsweredQuestionHandle);
        count = count ? count.length : 0;
        dmz.object.scalar(hil, advisorAttr[idx], count);
     }
  };

   advisorFunction = function () {

      var handle
        , hil = dmz.object.hil()
        , hilGroup = dmz.stance.getUserGroupHandle(hil)
        , advisorHandle
        , data
        , btn
        , textEdit
        , vote
        , question
        , count
        , voteHandle
        , voteTree
        , questionTree
        ;

      if (hil && hilGroup && groupAdvisors[hilGroup] && (idx < groupAdvisors[hilGroup].length)) {

         voteHandle = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
         if (voteHandle) { isVoteExpired(voteHandle[0]); }
         advisorHandle = groupAdvisors[hilGroup][idx];
         if (advisorHandle) {

            data = advisorData[advisorHandle];
            voteTree = advisorWidgets[idx].lookup("voteHistoryTree");
            questionTree = advisorWidgets[idx].lookup("questionHistoryTree");
            setTreeForAdvisor(advisorHandle, voteTree, questionTree);
            voteTree.resizeColumnToContents(TreeItemIndex.vote.time);
            voteTree.resizeColumnToContents(TreeItemIndex.vote.end);
            if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

               advisorWidgets[idx].lookup("selectedText").text("");
               advisorWidgets[idx].lookup("selectedOpinion").text("");
            }

            advisorWidgets[idx].lookup("bioText").text(data.bio ? data.bio: "No bio.");
            advisorWidgets[idx].lookup("nameLabel").text(data.name ? data.name : "No name");
            if (data.picture) { advisorWidgets[idx].lookup("pictureLabel").pixmap(data.picture); }
            else { advisorWidgets[idx].lookup("pictureLabel").clear(); }
            advisorWidgets[idx].lookup("specialtyLabel").text(data.specialty ? data.specialty : "N/A");

            advisorWidgets[idx].observe(self, "submitQuestionButton", "clicked", function () {

               var textWidget = advisorWidgets[idx].lookup("questionText")
                 , text = textWidget ? textWidget.text() : ""
                 , question
                 , list
                 , game
                 , id
                 ;

               if (!LoginSkipped) {

                  if (text.length) {

                     question = dmz.object.create(dmz.stance.QuestionType);
                     dmz.object.activate(question);
                     dmz.object.flag(question, dmz.stance.ActiveHandle, true);
                     dmz.object.link(dmz.stance.CreatedByHandle, question, hil);
                     dmz.object.timeStamp(question, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
                     dmz.object.text(question, dmz.stance.TextHandle, text);

                     list = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle);
                     id = list ? list.length : 1;
                     list = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorAnsweredQuestionHandle);
                     id += (list ? list.length : 0);
                     dmz.object.scalar(question, dmz.stance.ID, id);
                     dmz.object.link(dmz.stance.AdvisorActiveQuestionHandle, advisorHandle, question);

                     game = dmz.object.superLinks(hilGroup, dmz.stance.GameGroupHandle);
                     if (game && game[0]) {

                        EmailMod.sendEmail
                           ( dmz.object.subLinks(game[0], dmz.stance.AdminHandle)
                           , "STANCE: New question!"
                           , "Admin Notice: \n" +
                                 dmz.stance.getDisplayName(hilGroup) +
                                 " has a new question for " +
                                 dmz.stance.getDisplayName(advisorHandle)
                           );
                     }
                  }
                  textWidget.text("");
               }
               else { _NoContentWarning.open(self, function () {}); }
            });

            advisorWidgets[idx].observe(self, "submitTaskButton", "clicked", function () {

               var vote
                 , textWidget = advisorWidgets[idx].lookup("taskingText")
                 , list
                 , text
                 , opinText
                 , count = 0
                 , groupVotes
                 , game
                 ;

               if (!LoginSkipped) {

                  text = textWidget ? textWidget.text() : "";
                  if (text.length) {

                     vote = dmz.object.create(dmz.stance.VoteType);
                     dmz.object.activate(vote);
                     dmz.object.flag(vote, dmz.stance.ActiveHandle, true);
                     dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle, true);
                     dmz.object.timeStamp(vote, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
                     dmz.object.text(vote, dmz.stance.TextHandle, text);
                     dmz.object.link(dmz.stance.CreatedByHandle, vote, hil);
                     list = dmz.object.subLinks(hilGroup, dmz.stance.GroupMembersHandle);
                     if (list && list.length) {

                        list.forEach(function (userHandle) {

                           if (!dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

                              dmz.object.link(dmz.stance.VoteUndecidedHandle, vote, userHandle);
                              count += 1;
                           }
                        });
                        dmz.object.scalar(vote, dmz.stance.VoterTotalHandle, count);
                     }
                     dmz.object.link(dmz.stance.GroupActiveVoteHandle, hilGroup, vote);
                     dmz.object.link(dmz.stance.VoteAdvisorHandle, advisorHandle, vote);
                     groupVotes = dmz.object.subLinks(hilGroup, dmz.stance.GroupCompletedVotesHandle);
                     groupVotes = groupVotes ? groupVotes.length : 0;
                     dmz.object.scalar(vote, dmz.stance.ID, groupVotes + 1);

                     game = dmz.object.superLinks(hilGroup, dmz.stance.GameGroupHandle);
                     if (game && game[0]) {

                        EmailMod.sendEmail
                           ( dmz.object.subLinks(game[0], dmz.stance.AdminHandle)
                           , "STANCE: New task!"
                           , "Admin Notice: \n" +
                                 dmz.stance.getDisplayName(hilGroup) +
                                 " has submitted a new task for " +
                                 dmz.stance.getDisplayName(advisorHandle)
                           );
                     }
                  }
                  textWidget.text("");
               }
               else { _NoContentWarning.open(self, function () {}); }
            });

            btn = advisorWidgets[idx].lookup("submitTaskButton");
            textEdit = advisorWidgets[idx].lookup("taskingText");

            // If there isn't a vote active for the hil group
            // Add sanity check to ensure online?
            vote = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
            if (vote && vote[0] && dmz.object.flag(vote[0], dmz.stance.ActiveHandle)) {

               btn.text("Advisors Tasked");
               btn.enabled(false);
               textEdit.enabled(false);
               textEdit.text("");
            }
            else {

               btn.text("Submit Task");
               btn.enabled(true);
               textEdit.enabled(true);
            }

            btn = advisorWidgets[idx].lookup("submitQuestionButton");
            textEdit = advisorWidgets[idx].lookup("questionText");
            question = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle);
            if (question && question[0] &&
               dmz.object.flag(question[0], dmz.stance.ActiveHandle)) {

               btn.text("Advisor Queried");
               btn.enabled(false);
               textEdit.enabled(false);
               textEdit.text("");

               if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

                  answerQuestion(question[0]);
               }
            }
            else {

               btn.text("Submit Question");
               btn.enabled(true);
               textEdit.enabled(true);
            }
         }
      }
   };

   module.addPage("Advisor" + idx, advisorWidgets[idx], advisorFunction, exitAdvisor);
};


fillList = function (uiList, handleList) {

   if (uiList) {

      uiList.clear();
      if (handleList) {

         handleList.forEach(function (userHandle) {

            uiList.addItem(dmz.stance.getDisplayName(userHandle));
         });
      }
   }
};

// When text is updated, iterate through advisor widgets to see if that widget is
// being displayed and update the text if so.

//dmz.object.text.observe(self, dmz.stance.TextHandle, function (handle, attr, value) {

//   var type = dmz.object.type(handle)
//     , treeName
//     , index
//     ;

//   if (type.isOfType(dmz.stance.VoteType)) {

//      treeName = "voteHistoryTree";
//      index = 1;
//   }
//   else if (type.isOfType(dmz.stance.QuestionType)) {

//      treeName = "questionHistoryTree";
//      index = 0;
//   }

//   if (treeName && treeName.length) {

//      advisorWidgets.forEach(function (widget) {

//         var curr = widget.lookup(treeName)
//           , data
//           ;

//         if (curr) {

//            curr = curr.currentItem();
//            if (curr) { data = curr.data(0); }
//            if ((handle === data) &&
//               (widget.lookup("tabWidget").currentIndex() === index)) {

//               widget.lookup("selectedText").text(value);
//            }
//         }
//      });
//   }
//});

//dmz.object.text.observe(self, dmz.stance.CommentHandle, function (handle, attr, value) {

//   var type = dmz.object.type(handle)
//     , treeName
//     , index
//     ;

//   if (type.isOfType(dmz.stance.VoteType)) {

//      treeName = "voteHistoryTree";
//      index = 1;
//   }
//   else if (type.isOfType(dmz.stance.QuestionType)) {

//      treeName = "questionHistoryTree";
//      index = 0;
//   }

//   if (treeName && treeName.length) {

//      advisorWidgets.forEach(function (widget) {

//         var curr = widget.lookup(treeName)
//           , data
//           ;

//         if (curr) {

//            curr = curr.currentItem();
//            if (curr) { data = curr.data(0); }
//            if ((handle === data) &&
//               (widget.lookup("tabWidget").currentIndex() === index)) {

//               widget.lookup("selectedOpinion").text(value);
//            }
//         }
//      });
//   }
//});

dmz.object.link.observe(self, dmz.stance.ViewedQuestionHandle,
function (linkObjHandle, attrHandle, userHandle, questionHandle) {

   var item = master.questions[questionHandle];
   if (item) { item.read = "x"; updateRead(questionHandle); }
});

dmz.object.link.observe(self, dmz.stance.VoteUndecidedHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var item = master.votes[voteHandle]
     , undecHandleList
     ;

   if (dmz.object.linkHandle(dmz.stance.VoteYesHandle, voteHandle, userHandle) ||
      dmz.object.linkHandle(dmz.stance.VoteNoHandle, voteHandle, userHandle)) {

      dmz.object.unlink(
         dmz.object.linkHandle(
            dmz.stance.VoteUndecidedHandle,
            voteHandle,
            userHandle));
   }

   undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle);
   if (item) { item.undec = undecHandleList.length; }
   updateUndecVotes(voteHandle);
});

dmz.object.link.observe(self, dmz.stance.VoteYesHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, voteHandle, userHandle)
     , undecHandleList
     , yesHandleList
     , game
     , item = master.votes[voteHandle]
     ;

   if (linkHandle) {

      dmz.object.unlink(linkHandle);
      undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle);
      if (item) { item.undec = undecHandleList ? undecHandleList.length : 0; }
      updateUndecVotes(voteHandle);
   }

   yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle);
   if (item) { item.yes = yesHandleList.length;}
   updateYesVotes(voteHandle);

   if (dmz.object.flag(voteHandle, dmz.stance.ActiveHandle) && yesHandleList &&
      (yesHandleList.length >
         (dmz.object.scalar(voteHandle, dmz.stance.VoterTotalHandle) / 2))) {

      dmz.object.flag(voteHandle, dmz.stance.ActiveHandle, false);
      dmz.object.flag(voteHandle, dmz.stance.VoteResultHandle, true);
      game =
         dmz.object.superLinks(
            dmz.stance.getUserGroupHandle(userHandle),
            dmz.stance.GameGroupHandle);
      if (game && game[0]) {

         EmailMod.sendEmail
            ( dmz.object.subLinks(game[0], dmz.stance.AdminHandle)
            , "STANCE: Task voting completed!"
            , "Admin Notice: \n" +
                 dmz.stance.getDisplayName(dmz.stance.getUserGroupHandle(userHandle)) +
                 " has voted Yes on the following issue:" +
                 dmz.object.text(voteHandle, dmz.stance.TextHandle)
            );
      }
   }
});

dmz.object.link.observe(self, dmz.stance.VoteNoHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, voteHandle, userHandle)
     , undecHandleList
     , noHandleList
     , game
     , item = master.votes[voteHandle]
     ;

   if (linkHandle) { dmz.object.unlink(linkHandle); }
   undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle);
   noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle);
   if (item) {

      item.undec = undecHandleList ? undecHandleList.length : 0;
      item.no = noHandleList ? noHandleList.length : 0;
   }
   updateUndecVotes(voteHandle);
   updateNoVotes(voteHandle);

   if (dmz.object.flag(voteHandle, dmz.stance.ActiveHandle)) {

      if (!undecHandleList ||
         (noHandleList &&
            (noHandleList.length >=
               (dmz.object.scalar(voteHandle, dmz.stance.VoterTotalHandle) / 2)))) {

         dmz.object.flag(voteHandle, dmz.stance.ActiveHandle, false);
         dmz.object.flag(voteHandle, dmz.stance.VoteResultHandle, false);
         game =
            dmz.object.superLinks(
               dmz.stance.getUserGroupHandle(userHandle),
               dmz.stance.GameGroupHandle);
         if (game && game[0]) {

            EmailMod.sendEmail
               ( dmz.object.subLinks(game[0], dmz.stance.AdminHandle)
               , "STANCE: Task voting completed!"
               , "Admin Notice: \n" +
                     dmz.stance.getDisplayName(dmz.stance.getUserGroupHandle(userHandle)) +
                     " has voted No on the following issue:" +
                     dmz.object.text(voteHandle, dmz.stance.TextHandle)
               );
         }
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GroupCompletedVotesHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, groupHandle, voteHandle);
   if (linkHandle) { dmz.object.unlink(linkHandle); }
});


dmz.object.flag.observe(self, dmz.stance.VoteResultHandle,
function (objHandle, attr, value, prev) {

   var groupHandle = getVoteGroupHandle(objHandle)
     , link
     , game
     , item = master.votes[objHandle]
     ;

   if (item) { item.status = getVoteStatus(objHandle); updateStatus(objHandle); }

   if (groupHandle) {

      dmz.object.link(dmz.stance.GroupCompletedVotesHandle, groupHandle, objHandle);
   }
});

dmz.object.flag.observe(self, dmz.stance.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , hilGroup = dmz.stance.getUserGroupHandle(hil)
     , advisor
     , item = master.votes[objHandle]
     ;

   if (item) { item.status = getVoteStatus(objHandle); updateStatus(objHandle); }

   advisor = dmz.object.superLinks(objHandle, dmz.stance.VoteAdvisorHandle);
   if (value && !dmz.object.flag(hil, dmz.stance.AdminHandle) && advisor && advisor[0] &&
      groupAdvisors[hilGroup] && (groupAdvisors[hilGroup].indexOf(advisor[0]) !== -1)) {

      MainModule.highlight("Vote");
   }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attr, value, prev) {

   var type = dmz.object.type(objHandle)
     , hil = dmz.object.hil()
     , hilGroup = dmz.stance.getUserGroupHandle(hil)
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.stance.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(objHandle, dmz.stance.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(objHandle, dmz.stance.VoteNoHandle)
     , advisorHandle
     , total
     , widget
     , index
     , str
     , admin
     , item = master.votes[objHandle]
     ;

   if (item) { item.status = getVoteStatus(objHandle); updateStatus(objHandle); }

   if (type && type.isOfType(dmz.stance.VoteType)) {

      if (hil &&
         (dmz.object.flag(objHandle, dmz.stance.VoteApprovedHandle) ||
            dmz.object.flag(objHandle, dmz.stance.VoteSubmittedHandle))) {

         if (hilGroup &&
            (dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, hilGroup, objHandle) ||
               dmz.object.linkHandle(dmz.stance.GroupCompletedVotesHandle, hilGroup, objHandle))) {

            advisorWidgets.forEach(function (widget) {

               var btn = widget.lookup("submitTaskButton")
                 , textEdit = widget.lookup("taskingText")
                 ;
               btn.text(value ? "Advisors Tasked" : "Submit Task");
               btn.enabled(!value);
               textEdit.enabled(!value);
               textEdit.text("");
            });
         }
      }
   }
   else if (type && type.isOfType(dmz.stance.QuestionType)) {

      advisorHandle = dmz.object.superLinks(objHandle, dmz.stance.AdvisorActiveQuestionHandle);
      if (advisorHandle && advisorHandle[0]) {

         if (!value && prev) {

            dmz.object.link(dmz.stance.AdvisorAnsweredQuestionHandle, advisorHandle[0], objHandle);
         }
      }
   }
});

dmz.object.unlink.observe(self, dmz.stance.AdvisorActiveQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var widget
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , btn
     , textEdit
     , index
     , str
     ;

   if (groupHandle &&
      (groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil())) &&
      groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         btn = widget.lookup("submitQuestionButton");
         textEdit = widget.lookup("questionText");
         if (btn && textEdit) {

            btn.text("Submit Question");
            btn.enabled(true);
            textEdit.enabled(true);
            textEdit.text("");
         }
      }
   }
});

dmz.object.flag.observe(self, dmz.stance.VoteSubmittedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , hilGroup = dmz.stance.getUserGroupHandle(hil)
     , item = master.votes[objHandle]
     ;

   if (item) { item.status = getVoteStatus(objHandle); updateStatus(objHandle); }

   if (value) {

      if (dmz.object.flag(hil, dmz.stance.AdminHandle) && hilGroup &&
         dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, hilGroup, objHandle)) {

         MainModule.highlight("Vote");
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   var hil = dmz.object.hil()
     , vote
     ;
   if (groupHandle && (groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

      vote = dmz.object.subLinks(groupHandle, dmz.stance.GroupActiveVoteHandle);
      if (dmz.object.flag(hil, dmz.stance.AdminHandle) && vote && vote[0] &&
         dmz.object.flag(vote[0], dmz.stance.VoteSubmittedHandle)) {

         MainModule.highlight("Vote");
      }
      advisorWidgets.forEach(function (widget) {

         var btn = widget.lookup("submitTaskButton")
           , textEdit = widget.lookup("taskingText")
           ;
         btn.text("Advisors Tasked");
         btn.enabled(false);
         textEdit.enabled(false);
         textEdit.text("");
      });
   }
});

dmz.object.unlink.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, userHandle) {

   if ((userHandle === dmz.object.hil()) && MainModule.list) { MainModule.list = {}; }
});

dmz.object.unlink.observe(self, dmz.stance.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   var index
     , advisorHandle
     , str
     ;


   if (groupHandle && (groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

      advisorHandle = dmz.object.superLinks(voteHandle, dmz.stance.VoteAdvisorHandle)
      advisorHandle = advisorHandle ? advisorHandle[0] : false;
      if (advisorHandle) { index = groupAdvisors[groupHandle].indexOf(advisorHandle); }
      advisorWidgets.forEach(function (widget) {

         var btn = widget.lookup("submitTaskButton")
           , textEdit = widget.lookup("taskingText")
           ;
         btn.text("Submit Task");
         btn.enabled(true);
         textEdit.enabled(true);
         textEdit.text("");
      });
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var hilGroup = dmz.stance.getUserGroupHandle(objHandle)
     , vote
     , undecHandleList
     , linkHandle
     , list
     , question
     , questionHandleList = []
     , idx
     ;

   if (value && hilGroup) {

      if (MainModule.list) { MainModule.list = {}; }

//      // Question tree visibility
      list = groupAdvisors[hilGroup];
      if (list) {

         for (idx = 0; idx < list.length; idx += 1) {

            var advisorHandle = list[idx]
              , active = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle)
              , completed = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorAnsweredQuestionHandle)
              , str
              , count = dmz.object.scalar(objHandle, advisorAttr[idx])
              , isAdmin = dmz.object.flag(objHandle, dmz.stance.AdminHandle)
              ;

            if (active && isAdmin) {

               str = "Advisor" + idx;
               MainModule.highlight(str);
            }
            if (completed && !isAdmin) {

               count = count ? count : 0;
               if (count < completed.length) {

                  str = "Advisor" + idx;
                  MainModule.highlight(str);
               }
            }
         }

      }

      // Vote dialog
      vote = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
      if (vote && vote[0]) {

         vote = vote[0];
         undecHandleList = dmz.object.subLinks(vote, dmz.stance.VoteUndecidedHandle);
         dmz.object.flag(vote, dmz.stance.VisibleHandle, true);

         if (!isVoteExpired(vote) && dmz.object.flag(vote, dmz.stance.ActiveHandle) &&
            (dmz.object.flag(objHandle, dmz.stance.AdminHandle) &&
               dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle)) ||
            (dmz.object.flag(vote, dmz.stance.VoteApprovedHandle) &&
               undecHandleList && (undecHandleList.indexOf(objHandle) !== -1))
            ) {

               MainModule.highlight("Vote");
            }
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   var vote
     , idx
     , advisors
     , question
     ;
   if ((userHandle === dmz.object.hil()) &&
         dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

      vote = dmz.object.subLinks(groupHandle, dmz.stance.GroupActiveVoteHandle);
      if (vote && vote[0] && dmz.object.flag(vote[0], dmz.stance.VoteSubmittedHandle)) {

         MainModule.highlight("Vote");
      }
   }
});

dmz.object.text.observe(self, dmz.stance.TitleHandle, function (handle, attr, value) {

   var index
     , hilGroup = dmz.stance.getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) { advisorData[handle].specialty = value; }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("specialtyLabel").text(value);
      }
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle, function (handle, attr, value) {

   var index
     , hilGroup = dmz.stance.getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) { advisorData[handle].name = value; }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("nameLabel").text(value);
      }
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkObjHandle, attrHandle, creationHandle, authorHandle) {

   var item = master.questions[creationHandle];
//   if (!item) { item = master.votes[creationHandle]; }
   if (item) {

      item.author = dmz.stance.getDisplayName(authorHandle);
      updateAuthor(creationHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorActiveQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var tree
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , item
     , widget
     , btn
     , textEdit
     , hil = dmz.object.hil()
     , isActive = (dmz.stance.getUserGroupHandle(hil) === groupHandle)
     , index
     , str
     ;

   if (master.advisors[advisorHandle].questions.indexOf(questionHandle) === -1) {

      addQuestion(questionHandle);
      master.advisors[advisorHandle].questions.push(questionHandle);
   }

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         item = master.questions[questionHandle].item;
         tree = widget.lookup("questionHistoryTree");
         if (tree && item && (item.treeWidget() !== tree)) {

            tree.add(item);
            item.hidden(false);
            tree.currentItem(item);
         }
         if (isActive) {

            if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

               str = "Advisor" + index;
               MainModule.highlight(str);
            }

            btn = widget.lookup("submitQuestionButton");
            textEdit = widget.lookup("questionText");
            if (btn && textEdit) {

               btn.text("Advisor Queried");
               btn.enabled(false);
               textEdit.enabled(false);
               textEdit.text("");
            }
         }
      }
      dmz.object.flag(questionHandle, dmz.stance.VisibleHandle, isActive);
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorAnsweredQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var tree
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , hil = dmz.object.hil()
     , isActive = (dmz.stance.getUserGroupHandle(hil) === groupHandle)
     , list = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorAnsweredQuestionHandle)
     , count
     , item
     , widget
     , btn
     , textEdit
     , str
     , index
     , linkHandle = dmz.object.linkHandle(dmz.stance.AdvisorActiveQuestionHandle, advisorHandle, questionHandle)
     ;

   if (linkHandle) { dmz.object.unlink(linkHandle); }
   if (master.advisors[advisorHandle].questions.indexOf(questionHandle) === -1) {

      addQuestion(questionHandle);
      master.advisors[advisorHandle].questions.push(questionHandle);
   }
   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         item = master.questions[questionHandle].item;
         tree = widget.lookup("questionHistoryTree");
         if (tree && item && (item.treeWidget() !== tree)) {

            tree.add(item);
            item.hidden(false);
            tree.currentItem(item);
         }
         count = dmz.object.scalar(hil, advisorAttr[index]);
         count = count ? count : 0;
         list = list ? list.length : 0;

         if (isActive && (count < list) && !dmz.object.flag(hil, dmz.stance.AdminHandle)) {

            str = "Advisor" + index;
            MainModule.highlight(str);
         }

         dmz.object.flag(questionHandle, dmz.stance.VisibleHandle, isActive);
      }
   }
});

dmz.object.link.observe(self, dmz.stance.VoteAdvisorHandle,
function (linkObjHandle, attrHandle, advisorHandle, voteHandle) {

   var tree
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , hil = dmz.object.hil()
     , index
     , widget
     , item
     , isActive = (dmz.stance.getUserGroupHandle(hil) === groupHandle)
     ;

   if (master.advisors[advisorHandle].votes.indexOf(voteHandle) === -1) {

      addVote(voteHandle);
      master.advisors[advisorHandle].votes.push(voteHandle);
   }
   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         item = master.votes[voteHandle].item;
         tree = widget.lookup("voteHistoryTree");
         if (tree && item && (item.treeWidget() !== tree)) {

            tree.add(item);
            item.hidden(false);
            tree.currentItem(item);
         }

         dmz.object.flag(voteHandle, dmz.stance.VisibleHandle, isActive);
      }
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   var file
     , data
     , resource
     ;
   if (!groupAdvisors[groupHandle]) { groupAdvisors[groupHandle] = []; }
   if (groupAdvisors[groupHandle].length <= advisorCount) {

      groupAdvisors[groupHandle].push(advisorHandle);
      if (!advisorData[advisorHandle]) {

         advisorData[advisorHandle] =
            { bio: dmz.object.text(advisorHandle, dmz.stance.BioHandle)
            , name: dmz.stance.getDisplayName(advisorHandle)
            , specialty: dmz.object.text(advisorHandle, dmz.stance.TitleHandle)
            , picture: false
            , voteWidgets: []
            };

         data = dmz.object.data(groupHandle, dmz.stance.AdvisorImageHandle);
         file = dmz.object.scalar(advisorHandle, dmz.stance.AdvisorImageHandle);
         if (data) {

            resource = data.string(dmz.stance.AdvisorImageHandle, file);
            file = dmz.resources.lookupConfig(resource);
            if (file) { file = dmz.resources.findFile(file.string("alt.name")); }
            if (!file) { file = dmz.resources.findFile(resource); }
            if (file) { advisorData[advisorHandle].picture = dmz.ui.graph.createPixmap(file); }
         }
      }
   }
});

dmz.object.text.observe(self, dmz.stance.BioHandle, function (handle, attr, value) {

   var index
     , hilGroup = dmz.stance.getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) { advisorData[handle].bio = value; }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("bioText").text(value);
      }
   }
});

dmz.object.text.observe(self, dmz.stance.AdvisorImageHandle,
function (handle, attr, value) {

   var pic
     , data
     , groupHandle
     ;
   if (advisorData[handle]) {

      groupHandle = getAdvisorGroupHandle(handle);
      data = dmz.object.data(groupHandle, dmz.stance.AdvisorImageHandle);
      file = dmz.object.scalar(handle, dmz.stance.AdvisorImageHandle);
      if (data) {

         file = dmz.resources.findFile(data.string(dmz.stance.AdvisorImageHandle, file));
         if (file) { advisorData[handle].picture = dmz.ui.graph.createPixmap(file); }
      }
   }
});

dmz.object.data.observe(self, dmz.stance.AdvisorImageHandle,
function (handle, attr, data) {

   var advisors = dmz.object.subLinks(handle, dmz.stance.AdvisorGroupHandle)
     ;
   if (advisors) {

      advisors.forEach(function (advisorHandle) {

         var file = dmz.object.scalar(advisorHandle, dmz.stance.AdvisorImageHandle);
         file = dmz.resources.findFile(data.string(dmz.stance.AdvisorImageHandle, file));
         if (file) { advisorData[advisorHandle].picture = dmz.ui.graph.createPixmap(file); }
      });
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx
     , str
     , list
     ;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      for (idx = 0; idx < advisorCount; idx += 1) { updateAdvisor(module, idx); }
      module.addPage ("Vote", false, function () {

         var vote
           , hil = dmz.object.hil()
           , hilGroup = dmz.stance.getUserGroupHandle(hil)
           , undecHandleList
           , doHighlight = true
           , advisorHandle
           ;

         // Vote dialog
         vote = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
         self.log.warn ("Vote:", vote);
         if (vote && vote[0]) {

            vote = vote[0];
            self.log.warn ("Vote:", vote, isVoteExpired(vote));
            if (isVoteExpired(vote)) {

               dmz.ui.messageBox.create(
                  { type: dmz.ui.messageBox.Info
                  , text: "This vote's time limit has already passed."
                  , standardButtons: [dmz.ui.messageBox.Ok]
                  , defaultButton: dmz.ui.messageBox.Ok
                  }
               ).open(self, function (value) {});
            }
            else {

               self.log.warn ("Active:", dmz.object.flag(vote, dmz.stance.ActiveHandle));
               undecHandleList = dmz.object.subLinks(vote, dmz.stance.VoteUndecidedHandle);
               dmz.object.flag(vote, dmz.stance.VisibleHandle, true);
               if (dmz.object.flag(vote, dmz.stance.ActiveHandle)) {

                  if (dmz.object.flag(hil, dmz.stance.AdminHandle) && dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle)) {

//                     if (dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle)) {

                        approveVote(vote);
//                     }
                  }
                  else if ((dmz.object.flag(vote, dmz.stance.VoteApprovedHandle) === true)/* &&
                          undecHandleList && (undecHandleList.indexOf(hil) !== -1)*/) {

                     fillList(YesList, dmz.object.subLinks(vote, dmz.stance.VoteYesHandle));
                     fillList(NoList, dmz.object.subLinks(vote, dmz.stance.VoteNoHandle));
                     fillList(UndecList, undecHandleList);

                     if (undecHandleList && (undecHandleList.indexOf(hil) === -1)) {

                        doHighlight = false;
                        YesButton.enabled(false);
                        NoButton.enabled(false);
                     }
                     else {

                        YesButton.enabled(true);
                        NoButton.enabled(true);
                     }

                     VoteDialog.observe(self, "yesButton", "clicked", function () {

                        if (LoginSkipped) { _NoContentWarning.open(self, function () {}); }
                        else if (isVoteExpired(vote)) {

                           dmz.ui.messageBox.create(
                              { type: dmz.ui.messageBox.Info
                              , text: "This vote's time limit has already passed."
                              , standardButtons: [dmz.ui.messageBox.Ok]
                              , defaultButton: dmz.ui.messageBox.Ok
                              }
                           ).open(self, function (value) {});
                        }
                        else { dmz.object.link(dmz.stance.VoteYesHandle, vote, hil); }

                     });
                     VoteDialog.observe(self, "noButton", "clicked", function () {

                        if (LoginSkipped) { _NoContentWarning.open(self, function () {}); }
                        else if (isVoteExpired(vote)) {

                           dmz.ui.messageBox.create(
                              { type: dmz.ui.messageBox.Info
                              , text: "This vote's time limit has already passed."
                              , standardButtons: [dmz.ui.messageBox.Ok]
                              , defaultButton: dmz.ui.messageBox.Ok
                              }
                           ).open(self, function (value) {});
                        }
                        else { dmz.object.link(dmz.stance.VoteNoHandle, vote, hil); }
                     });

                     VoteCommentText.text(dmz.object.text(vote, dmz.stance.CommentHandle));
                     TaskText.text(dmz.object.text(vote, dmz.stance.TextHandle));
                     advisorHandle = dmz.object.superLinks(vote, dmz.stance.VoteAdvisorHandle);
                     VoteAdvisorLabel.text(
                        dmz.stance.getDisplayName(
                           advisorHandle && advisorHandle.length ? advisorHandle[0] : 0));
                     str = dmz.util.timeStampToDate(dmz.object.timeStamp(vote, dmz.stance.DurationHandle));
                     if (str && str instanceof Date) {

                        str =
                           str.toString(TimeFormatString) +
                           (str.isDaylightSavingTime ? " PDT" : " PST");

                        VoteExpirationTime.text(str);
                     }
                     VoteDialog.open(self, function (value) {

                        if (!value && doHighlight) { MainModule.highlight("Vote"); }
                        doHighlight = true;
                     });
                  }
               }
            }

         }
      });
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});
