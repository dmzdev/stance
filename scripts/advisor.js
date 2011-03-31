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
   , email: require("email")
   , stance: require("stanceConst")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   }

   // UI Elements
   , ApproveVoteDialog = dmz.ui.loader.load("ApproveVoteDialog.ui")
   , VoteTextArea = ApproveVoteDialog.lookup("taskingText")
   , VoteOpinionArea = ApproveVoteDialog.lookup("opinionText")

   , AnswerQuestionDialog = dmz.ui.loader.load("AnswerQuestionDialog.ui")
   , QuestionTextArea = AnswerQuestionDialog.lookup("questionText")
   , QuestionAnswerArea = AnswerQuestionDialog.lookup("answerText")

   , VoteDialog = dmz.ui.loader.load("VoteDialog.ui")
   , YesList = VoteDialog.lookup("yesList")
   , NoList = VoteDialog.lookup("noList")
   , UndecList = VoteDialog.lookup("undecList")
   , TaskText = VoteDialog.lookup("taskingText")
   , VoteCommentText = VoteDialog.lookup("opinionText")

   // Variables
   , advisorWidgets = []
   , advisorData = {}
   , groupAdvisors = {}
   , advisorCount = 5
   , UserVoteListItems = {}
   , voteHistoryWidgets = {}
   , questionHistoryWidgets = {}
   , MaxMessageLength = 144

   // Function decls
   , updateAdvisor
   , approveVote
   , answerQuestion
   , fillList
   , getVoteGroupHandle
   , getAdvisorGroupHandle
   , getVoteStatus
   ;

dmz.object.scalar.observe(self, dmz.stance.ID, function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].text(0, value); }
   else if (questionHistoryWidgets[objHandle]) { questionHistoryWidgets[objHandle].text(0, value); }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtHandle, function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(5, dmz.util.timeStampToDate(value));
   }
   else if (questionHistoryWidgets[objHandle]) {

      questionHistoryWidgets[objHandle].text(2, dmz.util.timeStampToDate(value));
   }
});

getVoteGroupHandle = function (voteHandle) {

   var voteGroupHandle = 0
     , retval = 0
     ;

   if (voteHandle) {

      voteGroupHandle = dmz.object.superLinks(voteHandle, dmz.stance.GroupActiveVoteHandle);
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
              ;

            if (item) {

               handle = item.data(0);
               type = dmz.object.type(handle);
               if (type &&
                  (type.isOfType(dmz.stance.VoteType) ||
                     type.isOfType(dmz.stance.QuestionType))) {

                  widget.lookup("selectedText").text(
                     dmz.object.text(handle, dmz.stance.TextHandle));
                  widget.lookup("selectedOpinion").text(
                     dmz.object.text(handle, dmz.stance.CommentHandle));
               }
            }
         }
         widget.observe(self, "voteHistoryTree", "currentItemChanged", historyItemChanged);
         widget.observe(self, "questionHistoryTree", "currentItemChanged", historyItemChanged);

         widget.lookup("questionCharRemAmt").text(MaxMessageLength);
         widget.observe(self, "questionText", "textChanged", function (textWidget) {

            var length = textWidget.text().length
              , diff = MaxMessageLength - length
              , color = "black"
              , button = widget.lookup("submitQuestionButton")
              ;

            button.enabled((button.text() === "Submit Question") && (length < MaxMessageLength));
            if (length > MaxMessageLength) { color = "red"; }
            else if (length > (MaxMessageLength / 2)) { color = "blue"; }
            else if (length > (MaxMessageLength / 4)) { color = "green"; }
            widget.lookup("questionCharRemAmt").text("<font color="+color+">"+diff+"</font>");
         });

         widget.lookup("taskCharRemAmt").text(MaxMessageLength);
         widget.observe(self, "taskingText", "textChanged", function (textWidget) {

            var length = textWidget.text().length
              , diff = MaxMessageLength - length
              , color = "black"
              , button = widget.lookup("submitTaskButton")
              ;

            button.enabled((button.text() === "Submit Task") && (length < MaxMessageLength));
            if (length > MaxMessageLength) { color = "red"; }
            else if (length > (MaxMessageLength / 2)) { color = "blue"; }
            else if (length > (MaxMessageLength / 4)) { color = "green"; }
            widget.lookup("taskCharRemAmt").text("<font color="+color+">"+diff+"</font>");
         });
      }(advisorWidgets[idx]));
   }
}());

approveVote = function (voteHandle) {

   VoteTextArea.text(dmz.object.text(voteHandle, dmz.stance.TextHandle));
   ApproveVoteDialog.open(self, function (result, dialog) {

      var text;
      text = VoteOpinionArea.text();
      if (!text || !text.length) { text = "I have no opinion on this matter."; }
      dmz.object.text(voteHandle, dmz.stance.CommentHandle, text);
      dmz.object.flag(voteHandle, dmz.stance.VoteApprovedHandle, result);
      dmz.object.flag(voteHandle, dmz.stance.VoteSubmittedHandle, false);
      if (!result) {

         dmz.object.flag(voteHandle, dmz.stance.ActiveHandle, false);
         dmz.object.flag(voteHandle, dmz.stance.VoteResultHandle, false);
      }
      else {

         dmz.email.sendEmail
            ( dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
            , "STANCE: Your group must vote on a new task!"
            , "Student, \n" + "Your advisor has approved voting on the following task:\n" +
                 dmz.object.text(voteHandle, dmz.stance.TextHandle) +
                 "\nYour advisor's response to the task was:\n" +
                 dmz.object.text(voteHandle, dmz.stance.CommentHandle) +
                 "\nPlease go vote on this task as soon as possible!"
            );
      }

      VoteOpinionArea.text("");
      VoteTextArea.text("");
   });
}

answerQuestion = function (questionHandle) {

   QuestionTextArea.text(dmz.object.text(questionHandle, dmz.stance.TextHandle));

   AnswerQuestionDialog.open(self, function (result, dialog) {

      var text;
      text = QuestionAnswerArea.text();
      if (!text || !text.length) { text = "I have no opinion on this matter."; }
      dmz.object.text(questionHandle, dmz.stance.CommentHandle, text);
      dmz.object.flag(questionHandle, dmz.stance.ActiveHandle, false);
      QuestionAnswerArea.text("");
      QuestionTextArea.text("");
   });
};

updateAdvisor = function (module, idx) {

   module.addPage("Advisor" + idx, advisorWidgets[idx], function () {

      var handle
        , hil = dmz.object.hil()
        , hilGroup = dmz.stance.getUserGroupHandle(hil)
        , advisorHandle
        , data
        , btn
        , textEdit
        , vote
        , question
        ;

      if (hil && hilGroup && groupAdvisors[hilGroup] && (idx < groupAdvisors[hilGroup].length)) {

         advisorHandle = groupAdvisors[hilGroup][idx];
         if (advisorHandle) {

            data = advisorData[advisorHandle];
            if (data.bio) { advisorWidgets[idx].lookup("bioText").text(data.bio); }
            if (data.name) { advisorWidgets[idx].lookup("nameLabel").text(data.name); }
            if (data.picture) { advisorWidgets[idx].lookup("pictureLabel").pixmap(data.picture); }
            if (data.specialty) { advisorWidgets[idx].lookup("specialtyLabel").text(data.specialty); }

            // Need to disable this unless online?
            advisorWidgets[idx].observe(self, "submitQuestionButton", "clicked", function () {

               var textWidget = advisorWidgets[idx].lookup("questionText")
                 , text = textWidget ? textWidget.text() : ""
                 , question
                 , list
                 , game
                 ;

               if (text.length) {

                  question = dmz.object.create(dmz.stance.QuestionType);
                  dmz.object.activate(question);
                  dmz.object.flag(question, dmz.stance.ActiveHandle, true);
                  dmz.object.link(dmz.stance.CreatedByHandle, question, hil);
                  dmz.object.timeStamp(question, dmz.stance.CreatedAtHandle, dmz.time.getFrameTime());
                  dmz.object.text(question, dmz.stance.TextHandle, text);
                  dmz.object.link(dmz.stance.AdvisorActiveQuestionHandle, advisorHandle, question);
                  list = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle);
                  list = list ? list.length : -1; // Signal error -- Linking question to advisor failed
                  dmz.object.scalar(question, dmz.stance.ID, list);

                  game = dmz.object.superLinks(hilGroup, dmz.stance.GameGroupHandle);
                  if (game && game[0]) {

                     dmz.email.sendEmail
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

               text = textWidget ? textWidget.text() : "";
               if (text.length) {

                  vote = dmz.object.create(dmz.stance.VoteType);
                  dmz.object.activate(vote);
                  dmz.object.flag(vote, dmz.stance.ActiveHandle, true);
                  dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle, true);
                  dmz.object.link(dmz.stance.CreatedByHandle, vote, hil);
                  dmz.object.timeStamp(vote, dmz.stance.CreatedAtHandle, dmz.time.getFrameTime());
                  dmz.object.text(vote, dmz.stance.TextHandle, text);
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

                     dmz.email.sendEmail
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
   });
};


fillList = function (uiList, handleList) {

   if (uiList) {

      uiList.clear();
      if (handleList) {

         handleList.forEach(function (userHandle) {

            UserVoteListItems[userHandle] = uiList.addItem(dmz.stance.getDisplayName(userHandle));
         });
      }
   }
};

dmz.object.text.observe(self, dmz.stance.TextHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , treeName
     , index
     ;

   if (type.isOfType(dmz.stance.VoteType)) {

      treeName = "voteHistoryTree";
      index = 1;
   }
   else if (type.isOfType(dmz.stance.QuestionType)) {

      treeName = "questionHistoryTree";
      index = 0;
   }

   if (treeName && treeName.length) {

      advisorWidgets.forEach(function (widget) {

         var curr = widget.lookup(treeName)
           , data
           ;

         if (curr) {

            curr = curr.currentItem();
            if (curr) { data = curr.data(0); }
            if ((handle === data) &&
               (widget.lookup("tabWidget").currentIndex() === index)) {

               widget.lookup("selectedText").text(value);
            }
         }
      });
   }
});

dmz.object.text.observe(self, dmz.stance.CommentHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , treeName
     , index
     ;

   if (type.isOfType(dmz.stance.VoteType)) {

      treeName = "voteHistoryTree";
      index = 1;
   }
   else if (type.isOfType(dmz.stance.QuestionType)) {

      treeName = "questionHistoryTree";
      index = 0;
   }

   if (treeName && treeName.length) {

      advisorWidgets.forEach(function (widget) {

         var curr = widget.lookup(treeName)
           , data
           ;

         if (curr) {

            curr = curr.currentItem();
            if (curr) { data = curr.data(0); }
            if ((handle === data) &&
               (widget.lookup("tabWidget").currentIndex() === index)) {

               widget.lookup("selectedOpinion").text(value);
            }
         }
      });
   }
});


dmz.object.link.observe(self, dmz.stance.VoteUndecidedHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle)
     ;

   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
   }
});

dmz.object.link.observe(self, dmz.stance.VoteYesHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle)
     , game
     ;

   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
   }

   if (UserVoteListItems[userHandle] &&
      ((undecHandleList && (undecHandleList.indexOf(userHandle) !== -1)) ||
         (noHandleList && (noHandleList.indexOf(userHandle) !== -1)))) {

      YesList.addItem(UserVoteListItems[userHandle]);
   }

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

         dmz.email.sendEmail
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

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle)
     , game
     ;

   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
   }

   if (UserVoteListItems[userHandle] &&
       ((undecHandleList && (undecHandleList.indexOf(userHandle) !== -1)) ||
          (yesHandleList && (yesHandleList.indexOf(userHandle) !== -1)))) {

      NoList.addItem(UserVoteListItems[userHandle]);
   }

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

            dmz.email.sendEmail
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

dmz.object.flag.observe(self, dmz.stance.VoteResultHandle,
function (objHandle, attr, value, prev) {

   var groupHandle = getVoteGroupHandle(objHandle)
     , link
     , game
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (groupHandle) {

      dmz.object.unlink(dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, groupHandle, objHandle));
      dmz.object.link(dmz.stance.GroupCompletedVotesHandle, groupHandle, objHandle);
   }
});

dmz.object.flag.observe(self, dmz.stance.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , linkHandle
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.stance.VoteUndecidedHandle);
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (hil && !dmz.object.flag(hil, dmz.stance.AdminHandle)) {

      if (dmz.object.flag(objHandle, dmz.stance.ActiveHandle) &&
         undecHandleList && (undecHandleList.indexOf(hil) !== -1)) {

         if (value) {

            // Instructor approved vote.
            fillList(YesList, dmz.object.subLinks(objHandle, dmz.stance.VoteYesHandle));
            fillList(NoList, dmz.object.subLinks(objHandle, dmz.stance.VoteNoHandle));
            fillList(UndecList, undecHandleList);

            VoteDialog.observe(self, "yesButton", "clicked", function () {

               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.stance.VoteYesHandle, objHandle, hil);
            });
            VoteDialog.observe(self, "noButton", "clicked", function () {

               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.stance.VoteNoHandle, objHandle, hil);
            });

            VoteOpinionArea.text(dmz.object.text(objHandle, dmz.stance.CommentHandle));
            TaskText.text(dmz.object.text(objHandle, dmz.stance.TextHandle));
            VoteDialog.open(self, function (value) {});
         }
      }
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
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

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

            dmz.object.unlink(
               dmz.object.linkHandle(dmz.stance.AdvisorActiveQuestionHandle, advisorHandle[0], objHandle));
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
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (value) {

      if (dmz.object.flag(hil, dmz.stance.AdminHandle) && hilGroup &&
         dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, hilGroup, objHandle)) {

         approveVote(objHandle);
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   if (groupHandle && (groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

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

dmz.object.unlink.observe(self, dmz.stance.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   if (groupHandle && (groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

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
     ;

   if (value && hilGroup) {

      // Vote tree visibility
      list = dmz.object.subLinks(hilGroup, dmz.stance.GroupCompletedVotesHandle);
      Object.keys(voteHistoryWidgets).forEach(function (voteHandle) {

         voteHandle = parseInt(voteHandle);
         dmz.object.flag(
            voteHandle,
            dmz.stance.VisibleHandle,
            (list && list.indexOf(voteHandle) !== -1));
      });

      // Question tree visibility
      list = dmz.object.subLinks(hilGroup, dmz.stance.AdvisorGroupHandle);
      if (list) {

         list.forEach(function (advisorHandle) {

            var active = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle)
              , completed = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorAnsweredQuestionHandle)
              ;

            if (active) { questionHandleList = questionHandleList.concat(active); }
            if (completed) { questionHandleList = questionHandleList.concat(completed); }
         });
      }

      Object.keys(questionHistoryWidgets).forEach(function (questionHandle) {

         questionHandle = parseInt(questionHandle);
         dmz.object.flag(
            questionHandle,
            dmz.stance.VisibleHandle,
            (questionHandleList && questionHandleList.indexOf(questionHandle) !== -1));
      });

      // Vote dialog
      vote = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
      if (vote && vote[0]) {

         vote = vote[0];
         undecHandleList = dmz.object.subLinks(vote, dmz.stance.VoteUndecidedHandle);

         dmz.object.flag(vote, dmz.stance.VisibleHandle, true);

         if (dmz.object.flag(vote, dmz.stance.ActiveHandle)) {

            if (dmz.object.flag(objHandle, dmz.stance.AdminHandle)) {

               if (dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle)) { approveVote(vote); }
            }
            else if ((dmz.object.flag(vote, dmz.stance.VoteApprovedHandle) === true) &&
                    undecHandleList && (undecHandleList.indexOf(objHandle) !== -1)) {

               fillList(YesList, dmz.object.subLinks(vote, dmz.stance.VoteYesHandle));
               fillList(NoList, dmz.object.subLinks(vote, dmz.stance.VoteNoHandle));
               fillList(UndecList, undecHandleList);

               VoteDialog.observe(self, "yesButton", "clicked", function () {

                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.stance.VoteYesHandle, vote, objHandle);
               });
               VoteDialog.observe(self, "noButton", "clicked", function () {

                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.stance.VoteNoHandle, vote, objHandle);
               });

               VoteCommentText.text(dmz.object.text(vote, dmz.stance.CommentHandle));
               TaskText.text(dmz.object.text(vote, dmz.stance.TextHandle));
               VoteDialog.open(self, function (value) {});
            }
         }
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   var vote;
   if (dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

      vote = dmz.object.subLinks(groupHandle, dmz.stance.GroupActiveVoteHandle);
      if (vote && vote[0] && dmz.object.flag(vote[0], dmz.stance.VoteSubmittedHandle)) {

         approveVote(vote[0]);
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

   if (questionHistoryWidgets[creationHandle]) {

      questionHistoryWidgets[creationHandle].text(1, dmz.stance.getDisplayName(authorHandle));
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
     , isActive = (dmz.stance.getUserGroupHandle(dmz.object.hil()) === groupHandle)
     , index
     ;

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         if (isActive) {

            btn = widget.lookup("submitQuestionButton");
            textEdit = widget.lookup("questionText");
            if (btn && textEdit) {

               btn.text("Advisor Queried");
               btn.enabled(false);
               textEdit.enabled(false);
               textEdit.text("");
            }
         }

         tree = widget.lookup("questionHistoryTree");
         if (tree && !questionHistoryWidgets[questionHandle]) {

            item = tree.add(
               [ dmz.object.scalar(questionHandle, dmz.stance.ID)
               , dmz.stance.getAuthorName(questionHandle)
               , dmz.util.timeStampToDate(dmz.object.timeStamp(questionHandle, dmz.stance.CreatedAtHandle))
               ]
               , questionHandle
               , 0
               );

            item.hidden(!dmz.object.flag(questionHandle, dmz.stance.VisibleHandle));
            questionHistoryWidgets[questionHandle] = item;
         }
      }
      dmz.object.flag(questionHandle, dmz.stance.VisibleHandle, isActive);
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorAnsweredQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var tree
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , item
     , widget
     , btn
     , textEdit
     , isActive = (dmz.stance.getUserGroupHandle(dmz.object.hil()) === groupHandle)
     , index
     ;

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         tree = widget.lookup("questionHistoryTree");
         if (tree && !questionHistoryWidgets[questionHandle]) {

            item = tree.add(
               [ dmz.object.scalar(questionHandle, dmz.stance.ID)
               , dmz.stance.getAuthorName(questionHandle)
               , dmz.util.timeStampToDate(dmz.object.timeStamp(questionHandle, dmz.stance.CreatedAtHandle) * 1000)
               ]
               , questionHandle
               , 0
               );

            item.hidden(!dmz.object.flag(questionHandle, dmz.stance.VisibleHandle));
            questionHistoryWidgets[questionHandle] = item;
         }
         dmz.object.flag(questionHandle, dmz.stance.VisibleHandle, isActive);
      }
   }
});

dmz.object.link.observe(self, dmz.stance.VoteAdvisorHandle,
function (linkObjHandle, attrHandle, advisorHandle, voteHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle)
     , item
     , tree
     , widget
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , index
     ;

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         tree = widget.lookup("voteHistoryTree");
         if (tree && !voteHistoryWidgets[voteHandle]) {

            item = tree.add(
               [ dmz.object.scalar(voteHandle, dmz.stance.ID)
               , getVoteStatus(voteHandle)
               , yesHandleList ? yesHandleList.length : 0
               , noHandleList ? noHandleList.length : 0
               , undecHandleList ? undecHandleList.length : 0
               , dmz.util.timeStampToDate(dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtHandle))
               ]
               , voteHandle
               , 0
               );

            item.hidden(!dmz.object.flag(voteHandle, dmz.stance.VisibleHandle));
            if (advisorData[advisorHandle]) {

               advisorData[advisorHandle].voteWidgets.push(item);
            }
            voteHistoryWidgets[voteHandle] = item;
         }
         dmz.object.flag(
            voteHandle,
            dmz.stance.VisibleHandle,
            (dmz.stance.getUserGroupHandle(dmz.object.hil()) === groupHandle));
      }
   }
});

dmz.object.flag.observe(self, dmz.stance.VisibleHandle,
function (objHandle, attr, value, prev) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].hidden(!value); }
   else if (questionHistoryWidgets[objHandle]) {

      questionHistoryWidgets[objHandle].hidden(!value);
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   var file;
   if (!groupAdvisors[groupHandle]) { groupAdvisors[groupHandle] = []; }
   if (groupAdvisors[groupHandle].length <= advisorCount) {

      groupAdvisors[groupHandle].push(advisorHandle);
      if (!advisorData[advisorHandle]) {

         advisorData[advisorHandle] =
            { bio: dmz.object.text(advisorHandle, dmz.stance.BioHandle)
            , name: dmz.stance.getDisplayName(advisorHandle)
            , specialty: dmz.object.text(advisorHandle, dmz.stance.TitleHandle)
            , picture: false
            , taskFunction: false
            , voteWidgets: []
            };

         file =
            dmz.ui.graph.createPixmap(
               dmz.resources.findFile(dmz.object.text(advisorHandle, dmz.stance.PictureHandle)));
         if (file) { advisorData[advisorHandle].picture = file; }
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

dmz.object.text.observe(self, dmz.stance.PictureHandle,
function (handle, attr, value) {

   var pic;
   if (advisorData[handle]) {

      advisorData[handle].picture =
         dmz.ui.graph.createPixmap(dmz.resources.findFile(value));
   }
})

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx;
   if (Mode === dmz.module.Activate) {

      for (idx = 0; idx < advisorCount; idx += 1) { updateAdvisor(module, idx); }
   }
});
