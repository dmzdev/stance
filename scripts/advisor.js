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
   , voteHistoryWidgets = {}
   , questionHistoryWidgets = {}
   , MaxMessageLength = 144
   , MainModule = false
   , VoteQueued = false
   , AdvisorQueued = false
   , advisorAttr =
        [ dmz.stance.Advisor0Handle
        , dmz.stance.Advisor1Handle
        , dmz.stance.Advisor2Handle
        , dmz.stance.Advisor3Handle
        , dmz.stance.Advisor4Handle
        ]
   , EmailMod = false

   // Function decls
   , updateAdvisor
   , approveVote
   , answerQuestion
   , fillList
   , getVoteGroupHandle
   , getAdvisorGroupHandle
   , getVoteStatus
   , answeredQuestionCount
   ;

dmz.object.scalar.observe(self, dmz.stance.ID, function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].text(0, value); }
   else if (questionHistoryWidgets[objHandle]) { questionHistoryWidgets[objHandle].text(0, value); }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtGameTimeHandle,
function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(5, dmz.util.timeStampToDate(value));
   }
   else if (questionHistoryWidgets[objHandle]) {

      questionHistoryWidgets[objHandle].text(3, dmz.util.timeStampToDate(value));
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
              , hil = dmz.object.hil()
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

                  if (!dmz.object.flag(hil, dmz.stance.AdminHandle) &&
                     dmz.object.superLinks(handle, dmz.stance.AdvisorAnsweredQuestionHandle)) {

                     dmz.object.link(dmz.stance.ViewedQuestionHandle, hil, handle);
                  }
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

         EmailMod.sendEmail
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
      dmz.object.link(dmz.stance.ViewedQuestionHandle, dmz.object.hil(), questionHandle);
      QuestionAnswerArea.text("");
      QuestionTextArea.text("");
   });
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
        ;

      if (hil && hilGroup && groupAdvisors[hilGroup] && (idx < groupAdvisors[hilGroup].length)) {

         advisorHandle = groupAdvisors[hilGroup][idx];
         if (advisorHandle) {

            data = advisorData[advisorHandle];
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

               if (text.length) {

                  question = dmz.object.create(dmz.stance.QuestionType);
                  dmz.object.activate(question);
                  dmz.object.flag(question, dmz.stance.ActiveHandle, true);
                  dmz.object.link(dmz.stance.CreatedByHandle, question, hil);
                  dmz.object.timeStamp(question, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
                  dmz.object.text(question, dmz.stance.TextHandle, text);

                  list = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle);
                  id = list ? list.length : 1; // Signal error -- Linking question to advisor failed
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
                  dmz.object.flag(vote, dmz.stance.ActiveHandle, true);
                  dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle, true);
                  dmz.object.timeStamp(vote, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
                  dmz.object.text(vote, dmz.stance.TextHandle, text);
                  dmz.object.activate(vote);
                  dmz.object.link(dmz.stance.CreatedByHandle, vote, hil);
                  list = dmz.object.subLinks(hilGroup, dmz.stance.GroupMembersHandle);
                  if (list && list.length) {

                     list.forEach(function (userHandle) {

                        self.log.warn("Linking vote:", userHandle, dmz.object.flag(userHandle, dmz.stance.AdminHandle));
                        if (!dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

                           self.log.warn ("   Link:", dmz.object.link(dmz.stance.VoteUndecidedHandle, vote, userHandle));
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

   self.log.warn ("FillList:", uiList, "["+handleList+"]");
   if (uiList) {

      uiList.clear();
      if (handleList) {

         handleList.forEach(function (userHandle) {

            self.log.warn("   adding:", dmz.stance.getDisplayName(userHandle));
            uiList.addItem(dmz.stance.getDisplayName(userHandle));
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

dmz.object.link.observe(self, dmz.stance.ViewedQuestionHandle,
function (linkObjHandle, attrHandle, userHandle, questionHandle) {

   if ((userHandle === dmz.object.hil()) && questionHistoryWidgets[questionHandle]) {

      questionHistoryWidgets[questionHandle].text(1, "x");
   }
});

dmz.object.link.observe(self, dmz.stance.VoteUndecidedHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   self.log.error ("VoteUndecidedHandle:", voteHandle, userHandle);
   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle)
     ;

   if (dmz.object.linkHandle(dmz.stance.VoteYesHandle, voteHandle, userHandle) ||
      dmz.object.linkHandle(dmz.stance.VoteNoHandle, voteHandle, userHandle)) {

      dmz.object.unlink(
         dmz.object.linkHandle(
            dmz.stance.VoteUndecidedHandle,
            voteHandle,
            userHandle));
   }

   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
   }
});

dmz.object.link.observe(self, dmz.stance.VoteYesHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   self.log.error ("Link.Observe VoteYesHandle");
   var linkHandle = dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, voteHandle, userHandle)
     , undecHandleList
     , yesHandleList
     , noHandleList
     , game
     ;

   self.log.warn("No Undecided:", linkHandle);
   if (linkHandle) { self.log.warn ("Unlinking: ", dmz.object.unlink(linkHandle)); }

   undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle);
   yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle);
   noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle);
   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
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
     , yesHandleList
     , noHandleList
     , game
     ;

   self.log.warn("Yes Undecided:", linkHandle);
   if (linkHandle) { self.log.warn ("Unlinking: ", dmz.object.unlink(linkHandle)); }

   undecHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteUndecidedHandle);
   yesHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteYesHandle);
   noHandleList = dmz.object.subLinks(voteHandle, dmz.stance.VoteNoHandle);

   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
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
   self.log.warn ("GroupCompletedVotesHandle:", linkHandle);
   if (linkHandle) { dmz.object.unlink(linkHandle); }
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

   self.log.warn("VoteResultHandle:", groupHandle);
   if (groupHandle) {

//      dmz.object.unlink(dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, groupHandle, objHandle));
      dmz.object.link(dmz.stance.GroupCompletedVotesHandle, groupHandle, objHandle);
   }
});

dmz.object.flag.observe(self, dmz.stance.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , hilGroup = dmz.stance.getUserGroupHandle(hil)
     , advisor
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   advisor = dmz.object.superLinks(objHandle, dmz.stance.VoteAdvisorHandle);
   if (!dmz.object.flag(hil, dmz.stance.AdminHandle) && advisor && advisor[0] &&
      groupAdvisors[hilGroup] && (groupAdvisors[hilGroup].indexOf(advisor[0]) !== -1)) {

      if (MainModule) { MainModule.highlight("Vote"); }
      else { VoteQueued = true; }
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

//            dmz.object.unlink(
//               dmz.object.linkHandle(dmz.stance.AdvisorActiveQuestionHandle, advisorHandle[0], objHandle));
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
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (value) {

      if (dmz.object.flag(hil, dmz.stance.AdminHandle) && hilGroup &&
         dmz.object.linkHandle(dmz.stance.GroupActiveVoteHandle, hilGroup, objHandle)) {

         if (MainModule) { MainModule.highlight("Vote"); }
         else { VoteQueued = true; }
//         approveVote(objHandle);
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

         if (MainModule) { MainModule.highlight("Vote"); }
         else { VoteQueued = true; }
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

   if (userHandle === dmz.object.hil()) {

      VoteQueued = false;
      AdvisorQueued = false;
   }
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

      AdvisorQueued = false;
      VoteQueued = false;

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
      list = groupAdvisors[hilGroup];
      if (list) {

         for (idx = 0; idx < list.length; idx += 1) {

            var advisorHandle = list[idx]
              , active = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorActiveQuestionHandle)
              , completed = dmz.object.subLinks(advisorHandle, dmz.stance.AdvisorAnsweredQuestionHandle)
              , str
              , count = dmz.object.scalar(objHandle, advisorAttr[idx])
              ;

            if (active) {

               questionHandleList = questionHandleList.concat(active);
               if (dmz.object.flag(objHandle, dmz.stance.AdminHandle)) {

                  str = "Advisor" + idx;
                  MainModule.highlight(str);
               }
            }
            if (completed) {

               count = count ? count : 0;
               questionHandleList = questionHandleList.concat(completed);
               if (count < completed.length) {

                  str = "Advisor" + idx;
                  MainModule.highlight(str);
               }
            }
         }

         list.forEach(function (advisorHandle) {

         });
      }
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

         var str = ""
           , index
           , advisorHandle
           ;
         questionHandle = parseInt(questionHandle);
         dmz.object.flag(
            questionHandle,
            dmz.stance.VisibleHandle,
            (questionHandleList && questionHandleList.indexOf(questionHandle) !== -1));

         if (dmz.object.linkHandle(dmz.stance.ViewedQuestionHandle, objHandle, questionHandle)) {

            str = "x";
         }
         else { str = ""; }
         questionHistoryWidgets[questionHandle].text(1, str);
      });

      // Vote dialog
      vote = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
      if (vote && vote[0]) {

         vote = vote[0];
         undecHandleList = dmz.object.subLinks(vote, dmz.stance.VoteUndecidedHandle);
         dmz.object.flag(vote, dmz.stance.VisibleHandle, true);

         if (dmz.object.flag(vote, dmz.stance.ActiveHandle) &&
            (dmz.object.flag(objHandle, dmz.stance.AdminHandle) &&
               dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle)) ||
            (dmz.object.flag(vote, dmz.stance.VoteApprovedHandle) &&
               undecHandleList && (undecHandleList.indexOf(objHandle) !== -1))
            ) {

               if (MainModule) { MainModule.highlight("Vote"); }
               else { VoteQueued = true; }
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

         if (MainModule) { MainModule.highlight("Vote"); }
         else { VoteQueued = true; }
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

      questionHistoryWidgets[creationHandle].text(2, dmz.stance.getDisplayName(authorHandle));
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

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
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

         tree = widget.lookup("questionHistoryTree");
         if (tree && !questionHistoryWidgets[questionHandle]) {

            if (dmz.object.linkHandle(dmz.stance.ViewedQuestionHandle, hil, questionHandle)) {

               str = "x";
            }
            else { str = ""; }

            item = tree.add(
               [ dmz.object.scalar(questionHandle, dmz.stance.ID)
               , str
               , dmz.stance.getAuthorName(questionHandle)
               , dmz.util.timeStampToDate(dmz.object.timeStamp(questionHandle, dmz.stance.CreatedAtGameTimeHandle))
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
   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         count = dmz.object.scalar(hil, advisorAttr[index]);
         count = count ? count : 0;
         list = list ? list.length : 0;

         if ((count < list) && !dmz.object.flag(hil, dmz.stance.AdminHandle)) {

            str = "Advisor" + index;
            MainModule.highlight(str);
         }

         widget = advisorWidgets[index];
         tree = widget.lookup("questionHistoryTree");
         if (tree && !questionHistoryWidgets[questionHandle]) {

            if (dmz.object.linkHandle(dmz.stance.ViewedQuestionHandle, hil, questionHandle)) {

               str = "x";
            }
            else { str = ""; }
            item = tree.add(
               [ dmz.object.scalar(questionHandle, dmz.stance.ID)
               , str
               , dmz.stance.getAuthorName(questionHandle)
               , dmz.util.timeStampToDate(dmz.object.timeStamp(questionHandle, dmz.stance.CreatedAtGameTimeHandle))
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
               , dmz.util.timeStampToDate(dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtGameTimeHandle))
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

   var file
     , data
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

            file = dmz.resources.findFile(data.string(dmz.stance.AdvisorImageHandle, file));
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
     ;
   if (Mode === dmz.module.Activate) {

      MainModule = module;
      for (idx = 0; idx < advisorCount; idx += 1) { updateAdvisor(module, idx); }
      module.addPage ("Vote", false, function () {

         var vote
           , hil = dmz.object.hil()
           , hilGroup = dmz.stance.getUserGroupHandle(hil)
           , undecHandleList
           ;

         // Vote dialog
         vote = dmz.object.subLinks(hilGroup, dmz.stance.GroupActiveVoteHandle);
         if (vote && vote[0]) {

            vote = vote[0];
            undecHandleList = dmz.object.subLinks(vote, dmz.stance.VoteUndecidedHandle);
            dmz.object.flag(vote, dmz.stance.VisibleHandle, true);
            if (dmz.object.flag(vote, dmz.stance.ActiveHandle)) {

               if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

                  if (dmz.object.flag(vote, dmz.stance.VoteSubmittedHandle)) {

                     approveVote(vote);
                  }
               }
               else if ((dmz.object.flag(vote, dmz.stance.VoteApprovedHandle) === true) &&
                       undecHandleList && (undecHandleList.indexOf(hil) !== -1)) {

                  fillList(YesList, dmz.object.subLinks(vote, dmz.stance.VoteYesHandle));
                  fillList(NoList, dmz.object.subLinks(vote, dmz.stance.VoteNoHandle));
                  fillList(UndecList, undecHandleList);

                  VoteDialog.observe(self, "yesButton", "clicked", function () {

//                     dmz.object.unlink(
//                        dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, vote, hil));
                     dmz.object.link(dmz.stance.VoteYesHandle, vote, hil);

                     self.log.warn ("YesButton:", dmz.object.linkHandle(dmz.stance.VoteYesHandle, vote, hil));
                  });
                  VoteDialog.observe(self, "noButton", "clicked", function () {

//                     dmz.object.unlink(
//                        dmz.object.linkHandle(dmz.stance.VoteUndecidedHandle, vote, hil));
                     dmz.object.link(dmz.stance.VoteNoHandle, vote, hil);

                     self.log.warn ("NoButton:", dmz.object.linkHandle(dmz.stance.VoteNoHandle, vote, hil));
                  });

                  VoteCommentText.text(dmz.object.text(vote, dmz.stance.CommentHandle));
                  TaskText.text(dmz.object.text(vote, dmz.stance.TextHandle));
                  VoteDialog.open(self, function (value) {

                     if (!value) { MainModule.highlight("Vote"); }
                  });
               }
            }
         }
      });
      if (VoteQueued) { VoteQueued = false; module.highlight("Vote"); }
   }
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});
