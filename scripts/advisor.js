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
   , const: require("const")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , time: require("dmz/runtime/time")
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
   , getUserGroupHandle
   , getVoteGroupHandle
   , getAdvisorGroupHandle
   , getVoteStatus
   ;

dmz.object.scalar.observe(self, dmz.const.ID, function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].text(0, value); }
   else if (questionHistoryWidgets[objHandle]) { questionHistoryWidgets[objHandle].text(0, value); }
});

dmz.object.timeStamp.observe(self, dmz.const.CreatedAtHandle, function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].text(5, value * 1000); }
   else if (questionHistoryWidgets[objHandle]) { questionHistoryWidgets[objHandle].text(2, value * 1000); }
});

getUserGroupHandle = function (userHandle) {

   var userGroupHandle = 0
     , retval = 0
     ;
   if (userHandle) {

      userGroupHandle = dmz.object.superLinks(userHandle, dmz.const.GroupMembersHandle);
      if (userGroupHandle && userGroupHandle[0]) { retval = userGroupHandle[0]; }
   }
   return retval;
};

getVoteGroupHandle = function (voteHandle) {

   var voteGroupHandle = 0
     , retval = 0
     ;

   if (voteHandle) {

      voteGroupHandle = dmz.object.superLinks(voteHandle, dmz.const.GroupActiveVoteHandle);
      if (voteGroupHandle && voteGroupHandle[0]) { retval = voteGroupHandle[0]; }
   }
   return retval;
};

getAdvisorGroupHandle = function (advisorHandle) {

   var advGroupHandle = 0
     , retval = 0
     ;

   if (advisorHandle) {

      advGroupHandle = dmz.object.superLinks(advisorHandle, dmz.const.AdvisorGroupHandle);
      if (advGroupHandle && advGroupHandle[0]) { retval = advGroupHandle[0]; }
   }
   return retval;
};

getVoteStatus = function (voteHandle) {

   var status = "E: " + voteHandle
     , Active = dmz.object.flag(voteHandle, dmz.const.ActiveHandle)
     , Submitted = dmz.object.flag(voteHandle, dmz.const.VoteSubmittedHandle)
     , Approved = dmz.object.flag(voteHandle, dmz.const.VoteApprovedHandle)
     , Result = dmz.object.flag(voteHandle, dmz.const.VoteResultHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
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
                  (type.isOfType(dmz.const.VoteType) ||
                     type.isOfType(dmz.const.QuestionType))) {

                  widget.lookup("selectedText").text(
                     dmz.object.text(handle, dmz.const.TextHandle));
                  widget.lookup("selectedOpinion").text(
                     dmz.object.text(handle, dmz.const.CommentHandle));
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

   VoteTextArea.text(dmz.object.text(voteHandle, dmz.const.TextHandle));
   ApproveVoteDialog.open(self, function (result, dialog) {

      var text;
      text = VoteOpinionArea.text();
      if (!text || !text.length) { text = "I have no opinion on this matter."; }
      dmz.object.text(voteHandle, dmz.const.CommentHandle, text);
      dmz.object.flag(voteHandle, dmz.const.VoteApprovedHandle, result);
      dmz.object.flag(voteHandle, dmz.const.VoteSubmittedHandle, false);
      if (!result) {

         dmz.object.flag(voteHandle, dmz.const.ActiveHandle, false);
         dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, false);
      }

      VoteOpinionArea.text("");
      VoteTextArea.text("");
   });
}

answerQuestion = function (questionHandle) {

   QuestionTextArea.text(dmz.object.text(questionHandle, dmz.const.TextHandle));

   AnswerQuestionDialog.open(self, function (result, dialog) {

      var text;
      text = QuestionAnswerArea.text();
      if (!text || !text.length) { text = "I have no opinion on this matter."; }
      dmz.object.text(questionHandle, dmz.const.CommentHandle, text);
      dmz.object.flag(questionHandle, dmz.const.ActiveHandle, false);
      QuestionAnswerArea.text("");
      QuestionTextArea.text("");
   });
};

updateAdvisor = function (module, idx) {

   module.addPage("Advisor" + idx, advisorWidgets[idx], function () {

      var handle
        , hil = dmz.object.hil()
        , hilGroup = getUserGroupHandle(hil)
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
            if (data.name) { advisorWidgets[idx].lookup("nameLabel").text(data.name); }
            if (data.bio) { advisorWidgets[idx].lookup("bioText").text(data.bio); }
            if (data.picture) { advisorWidgets[idx].lookup("pictureLabel").pixmap(data.picture); }

            // Need to disable this unless online?
            advisorWidgets[idx].observe(self, "submitQuestionButton", "clicked", function () {

               var textWidget = advisorWidgets[idx].lookup("questionText")
                 , text = textWidget ? textWidget.text() : ""
                 , question
                 , list
                 ;

               if (text.length) {

                  question = dmz.object.create(dmz.const.QuestionType);
                  dmz.object.activate(question);
                  dmz.object.flag(question, dmz.const.ActiveHandle, true);
                  dmz.object.link(dmz.const.CreatedByHandle, question, hil);
                  dmz.object.timeStamp(question, dmz.const.CreatedAtHandle, dmz.time.getFrameTime());
                  dmz.object.text(question, dmz.const.TextHandle, text);
                  dmz.object.link(dmz.const.AdvisorActiveQuestionHandle, advisorHandle, question);
                  list = dmz.object.subLinks(advisorHandle, dmz.const.AdvisorActiveQuestionHandle);
                  list = list ? list.length : -1; // Signal error -- Linking question to advisor failed
                  dmz.object.scalar(question, dmz.const.ID, list);
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
                 ;

               text = textWidget ? textWidget.text() : "";
               if (text.length) {

                  vote = dmz.object.create(dmz.const.VoteType);
                  dmz.object.activate(vote);
                  dmz.object.flag(vote, dmz.const.ActiveHandle, true);
                  dmz.object.flag(vote, dmz.const.VoteSubmittedHandle, true);
                  dmz.object.link(dmz.const.CreatedByHandle, vote, hil);
                  dmz.object.timeStamp(vote, dmz.const.CreatedAtHandle, dmz.time.getFrameTime());
                  dmz.object.text(vote, dmz.const.TextHandle, text);
                  list = dmz.object.subLinks(hilGroup, dmz.const.GroupMembersHandle);
                  if (list && list.length) {

                     list.forEach(function (userHandle) {

                        if (!dmz.object.flag(userHandle, dmz.const.AdminFlagHandle)) {

                           dmz.object.link(dmz.const.VoteUndecidedHandle, vote, userHandle);
                           count += 1;
                        }
                     });
                     dmz.object.scalar(vote, dmz.const.VoterTotalHandle, count);
                  }
                  dmz.object.link(dmz.const.GroupActiveVoteHandle, hilGroup, vote);
                  dmz.object.link(dmz.const.VoteAdvisorHandle, advisorHandle, vote);
                  groupVotes = dmz.object.subLinks(hilGroup, dmz.const.GroupCompletedVotesHandle);
                  groupVotes = groupVotes ? groupVotes.length : 0;
                  dmz.object.scalar(vote, dmz.const.ID, groupVotes + 1);
               }
               textWidget.text("");
            });

            btn = advisorWidgets[idx].lookup("submitTaskButton");
            textEdit = advisorWidgets[idx].lookup("taskingText");

            // If there isn't a vote active for the hil group
            // Add sanity check to ensure online?
            vote = dmz.object.subLinks(hilGroup, dmz.const.GroupActiveVoteHandle);
            if (vote && vote[0] && dmz.object.flag(vote[0], dmz.const.ActiveHandle)) {

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
            question = dmz.object.subLinks(advisorHandle, dmz.const.AdvisorActiveQuestionHandle);
            if (question && question[0] &&
               dmz.object.flag(question[0], dmz.const.ActiveHandle)) {

               btn.text("Advisor Queried");
               btn.enabled(false);
               textEdit.enabled(false);
               textEdit.text("");

               if (dmz.object.flag(hil, dmz.const.AdminFlagHandle)) {

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

            UserVoteListItems[userHandle] = uiList.addItem(dmz.const._getDisplayName(userHandle));
         });
      }
   }
};

dmz.object.text.observe(self, dmz.const.TextHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , treeName
     , index
     ;

   if (type.isOfType(dmz.const.VoteType)) {

      treeName = "voteHistoryTree";
      index = 1;
   }
   else if (type.isOfType(dmz.const.QuestionType)) {

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

dmz.object.text.observe(self, dmz.const.CommentHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , treeName
     , index
     ;

   if (type.isOfType(dmz.const.VoteType)) {

      treeName = "voteHistoryTree";
      index = 1;
   }
   else if (type.isOfType(dmz.const.QuestionType)) {

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


dmz.object.link.observe(self, dmz.const.VoteUndecidedHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
     ;

   if (voteHistoryWidgets[voteHandle]) {

      voteHistoryWidgets[voteHandle].text(2, yesHandleList ? yesHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(3, noHandleList ? noHandleList.length : 0);
      voteHistoryWidgets[voteHandle].text(4, undecHandleList ? undecHandleList.length : 0);
   }
});

dmz.object.link.observe(self, dmz.const.VoteYesHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
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

   if (dmz.object.flag(voteHandle, dmz.const.ActiveHandle) && yesHandleList &&
      (yesHandleList.length >
         (dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2))) {

      dmz.object.flag(voteHandle, dmz.const.ActiveHandle, false);
      dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, true);
   }
});

dmz.object.link.observe(self, dmz.const.VoteNoHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
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

   if (dmz.object.flag(voteHandle, dmz.const.ActiveHandle)) {

      if (!undecHandleList ||
         (noHandleList &&
            (noHandleList.length >=
               (dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2)))) {

         dmz.object.flag(voteHandle, dmz.const.ActiveHandle, false);
         dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, false);
      }
   }
});

dmz.object.flag.observe(self, dmz.const.VoteResultHandle,
function (objHandle, attr, value, prev) {

   var groupHandle = getVoteGroupHandle(objHandle)
     , link
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (groupHandle) {

      dmz.object.unlink(dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, groupHandle, objHandle));
      dmz.object.link(dmz.const.GroupCompletedVotesHandle, groupHandle, objHandle);
   }
});

dmz.object.flag.observe(self, dmz.const.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , linkHandle
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteUndecidedHandle);
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (hil && !dmz.object.flag(hil, dmz.const.AdminFlagHandle)) {

      if (dmz.object.flag(objHandle, dmz.const.ActiveHandle) &&
         undecHandleList && (undecHandleList.indexOf(hil) !== -1)) {

         if (value) {

            // Instructor approved vote.
            fillList(YesList, dmz.object.subLinks(objHandle, dmz.const.VoteYesHandle));
            fillList(NoList, dmz.object.subLinks(objHandle, dmz.const.VoteNoHandle));
            fillList(UndecList, undecHandleList);

            VoteDialog.observe(self, "yesButton", "clicked", function () {

               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.const.VoteYesHandle, objHandle, hil);
            });
            VoteDialog.observe(self, "noButton", "clicked", function () {

               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.const.VoteNoHandle, objHandle, hil);
            });

            VoteOpinionArea.text(dmz.object.text(objHandle, dmz.const.CommentHandle));
            TaskText.text(dmz.object.text(objHandle, dmz.const.TextHandle));
            VoteDialog.open(self, function (value) {});
         }
      }
   }
});

dmz.object.flag.observe(self, dmz.const.ActiveHandle,
function (objHandle, attr, value, prev) {

   var type = dmz.object.type(objHandle)
     , hil = dmz.object.hil()
     , hilGroup = getUserGroupHandle(hil)
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteNoHandle)
     , advisorHandle
     , total
     , widget
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (type && type.isOfType(dmz.const.VoteType)) {

      if (hil &&
         (dmz.object.flag(objHandle, dmz.const.VoteApprovedHandle) ||
            dmz.object.flag(objHandle, dmz.const.VoteSubmittedHandle))) {

         if (hilGroup &&
            (dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, hilGroup, objHandle) ||
               dmz.object.linkHandle(dmz.const.GroupCompletedVotesHandle, hilGroup, objHandle))) {

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
   else if (type && type.isOfType(dmz.const.QuestionType)) {

      advisorHandle = dmz.object.superLinks(objHandle, dmz.const.AdvisorActiveQuestionHandle);
      if (advisorHandle && advisorHandle[0]) {

         if (!value && prev) {

            dmz.object.unlink(
               dmz.object.linkHandle(dmz.const.AdvisorActiveQuestionHandle, advisorHandle[0], objHandle));
            dmz.object.link(dmz.const.AdvisorAnsweredQuestionHandle, advisorHandle[0], objHandle);
         }
      }
   }
});

dmz.object.unlink.observe(self, dmz.const.AdvisorActiveQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var widget
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , btn
     , textEdit
     , index
     ;

   if (groupHandle &&
      (groupHandle === getUserGroupHandle(dmz.object.hil())) &&
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

dmz.object.flag.observe(self, dmz.const.VoteSubmittedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , hilGroup = getUserGroupHandle(hil)
     ;

   if (voteHistoryWidgets[objHandle]) {

      voteHistoryWidgets[objHandle].text(1, getVoteStatus(objHandle));
   }

   if (value) {

      if (dmz.object.flag(hil, dmz.const.AdminFlagHandle) && hilGroup &&
         dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, hilGroup, objHandle)) {

         approveVote(objHandle);
      }
   }
});

dmz.object.link.observe(self, dmz.const.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   if (groupHandle && (groupHandle === getUserGroupHandle(dmz.object.hil()))) {

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

dmz.object.unlink.observe(self, dmz.const.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   if (groupHandle && (groupHandle === getUserGroupHandle(dmz.object.hil()))) {

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

   var hilGroup = getUserGroupHandle(objHandle)
     , vote
     , undecHandleList
     , linkHandle
     , list
     , question
     , questionHandleList = []
     ;

   if (value && hilGroup) {

      // Vote tree visibility
      list = dmz.object.subLinks(hilGroup, dmz.const.GroupCompletedVotesHandle);
      Object.keys(voteHistoryWidgets).forEach(function (voteHandle) {

         voteHandle = parseInt(voteHandle);
         dmz.object.flag(
            voteHandle,
            dmz.const.VisibleHandle,
            (list && list.indexOf(voteHandle) !== -1));
      });

      // Question tree visibility
      list = dmz.object.subLinks(hilGroup, dmz.const.AdvisorGroupHandle);
      if (list) {

         list.forEach(function (advisorHandle) {

            var active = dmz.object.subLinks(advisorHandle, dmz.const.AdvisorActiveQuestionHandle)
              , completed = dmz.object.subLinks(advisorHandle, dmz.const.AdvisorAnsweredQuestionHandle)
              ;

            if (active) { questionHandleList = questionHandleList.concat(active); }
            if (completed) { questionHandleList = questionHandleList.concat(completed); }
         });
      }

      Object.keys(questionHistoryWidgets).forEach(function (questionHandle) {

         questionHandle = parseInt(questionHandle);
         dmz.object.flag(
            questionHandle,
            dmz.const.VisibleHandle,
            (questionHandleList && questionHandleList.indexOf(questionHandle) !== -1));
      });

      // Vote dialog
      vote = dmz.object.subLinks(hilGroup, dmz.const.GroupActiveVoteHandle);
      if (vote && vote[0]) {

         vote = vote[0];
         undecHandleList = dmz.object.subLinks(vote, dmz.const.VoteUndecidedHandle);

         dmz.object.flag(vote, dmz.const.VisibleHandle, true);

         if (dmz.object.flag(vote, dmz.const.ActiveHandle)) {

            if (dmz.object.flag(objHandle, dmz.const.AdminFlagHandle)) {

               if (dmz.object.flag(vote, dmz.const.VoteSubmittedHandle)) { approveVote(vote); }
            }
            else if ((dmz.object.flag(vote, dmz.const.VoteApprovedHandle) === true) &&
                    undecHandleList && (undecHandleList.indexOf(objHandle) !== -1)) {

               fillList(YesList, dmz.object.subLinks(vote, dmz.const.VoteYesHandle));
               fillList(NoList, dmz.object.subLinks(vote, dmz.const.VoteNoHandle));
               fillList(UndecList, undecHandleList);

               VoteDialog.observe(self, "yesButton", "clicked", function () {

                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.const.VoteYesHandle, vote, objHandle);
               });
               VoteDialog.observe(self, "noButton", "clicked", function () {

                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.const.VoteNoHandle, vote, objHandle);
               });

               VoteCommentText.text(dmz.object.text(vote, dmz.const.CommentHandle));
               TaskText.text(dmz.object.text(vote, dmz.const.TextHandle));
               VoteDialog.open(self, function (value) {});
            }
         }
      }
   }
});

dmz.object.link.observe(self, dmz.const.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   var vote;
   if (dmz.object.flag(userHandle, dmz.const.AdminFlagHandle)) {

      vote = dmz.object.subLinks(groupHandle, dmz.const.GroupActiveVoteHandle);
      if (vote && vote[0] && dmz.object.flag(vote[0], dmz.const.VoteSubmittedHandle)) {

         approveVote(vote[0]);
      }
   }
});

dmz.object.text.observe(self, dmz.const.NameHandle, function (handle, attr, value) {

   var index
     , hilGroup = getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) { advisorData[handle].name = value; }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("nameLabel").text(value);
      }
   }
});

dmz.object.link.observe(self, dmz.const.CreatedByHandle,
function (linkObjHandle, attrHandle, creationHandle, authorHandle) {

   if (questionHistoryWidgets[creationHandle]) {

      questionHistoryWidgets[creationHandle].text(1, dmz.const._getDisplayName(authorHandle));
   }
});

dmz.object.link.observe(self, dmz.const.AdvisorActiveQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var tree
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , item
     , widget
     , btn
     , textEdit
     , isActive = (getUserGroupHandle(dmz.object.hil()) === groupHandle)
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
               [ dmz.object.scalar(questionHandle, dmz.const.ID)
               , dmz.const._getAuthorName(questionHandle)
               , new Date (dmz.object.timeStamp(questionHandle, dmz.const.CreatedAtHandle) * 1000)
               ]
               , questionHandle
               , 0
               );

            item.hidden(!dmz.object.flag(questionHandle, dmz.const.VisibleHandle));
            questionHistoryWidgets[questionHandle] = item;
         }
      }
      dmz.object.flag(questionHandle, dmz.const.VisibleHandle, isActive);
   }
});

dmz.object.link.observe(self, dmz.const.AdvisorAnsweredQuestionHandle,
function (linkObjHandle, attrHandle, advisorHandle, questionHandle) {

   var tree
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     , item
     , widget
     , btn
     , textEdit
     , isActive = (getUserGroupHandle(dmz.object.hil()) === groupHandle)
     , index
     ;

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      index = groupAdvisors[groupHandle].indexOf(advisorHandle);
      if (index !== -1) {

         widget = advisorWidgets[index];
         tree = widget.lookup("questionHistoryTree");
         if (tree && !questionHistoryWidgets[questionHandle]) {

            item = tree.add(
               [ dmz.object.scalar(questionHandle, dmz.const.ID)
               , dmz.const._getAuthorName(questionHandle)
               , new Date (dmz.object.timeStamp(questionHandle, dmz.const.CreatedAtHandle) * 1000)
               ]
               , questionHandle
               , 0
               );

            item.hidden(!dmz.object.flag(questionHandle, dmz.const.VisibleHandle));
            questionHistoryWidgets[questionHandle] = item;
         }
         dmz.object.flag(questionHandle, dmz.const.VisibleHandle, isActive);
      }
   }
});

dmz.object.link.observe(self, dmz.const.VoteAdvisorHandle,
function (linkObjHandle, attrHandle, advisorHandle, voteHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
     , item
     , tree
     , widget
     , groupHandle = getAdvisorGroupHandle(advisorHandle)
     ;

   if (groupHandle && groupAdvisors[groupHandle] && groupAdvisors[groupHandle].length) {

      widget = advisorWidgets[groupAdvisors[groupHandle].length - 1];
      if (widget) {

         tree = widget.lookup("voteHistoryTree");
         if (tree && !voteHistoryWidgets[voteHandle]) {

            item = tree.add(
               [ dmz.object.scalar(voteHandle, dmz.const.ID)
               , getVoteStatus(voteHandle)
               , yesHandleList ? yesHandleList.length : 0
               , noHandleList ? noHandleList.length : 0
               , undecHandleList ? undecHandleList.length : 0
               , new Date (dmz.object.timeStamp(voteHandle, dmz.const.CreatedAtHandle) * 1000)
               ]
               , voteHandle
               , 0
               );

            item.hidden(!dmz.object.flag(voteHandle, dmz.const.VisibleHandle));
            if (advisorData[advisorHandle]) {

               advisorData[advisorHandle].voteWidgets.push(item);
            }
            voteHistoryWidgets[voteHandle] = item;
         }
         dmz.object.flag(
            voteHandle,
            dmz.const.VisibleHandle,
            (getUserGroupHandle(dmz.object.hil()) === groupHandle));
      }
   }
});

dmz.object.flag.observe(self, dmz.const.VisibleHandle,
function (objHandle, attr, value, prev) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].hidden(!value); }
   else if (questionHistoryWidgets[objHandle]) {

      questionHistoryWidgets[objHandle].hidden(!value);
   }
});

dmz.object.link.observe(self, dmz.const.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   var file
     , directory
     , votes
     ;
   if (!groupAdvisors[groupHandle]) { groupAdvisors[groupHandle] = []; }
   if (groupAdvisors[groupHandle].length <= advisorCount) {

      groupAdvisors[groupHandle].push(advisorHandle);
      if (!advisorData[advisorHandle]) {

         advisorData[advisorHandle] =
            { bio: dmz.object.text(advisorHandle, dmz.const.BioHandle)
            , name: dmz.const._getDisplayName(advisorHandle)
            , picture: false
            , taskFunction: false
            , voteWidgets: []
            };

         file = dmz.object.text(advisorHandle, dmz.const.PictureFileNameHandle);
         directory = dmz.object.text(advisorHandle, dmz.const.PictureDirectoryNameHandle);
         if (file && file.length && directory && directory.length) {

            file = dmz.ui.graph.createPixmap(directory + file);
            if (file) { advisorData[advisorHandle].picture = file; }
         }
      }
   }
});

dmz.object.text.observe(self, dmz.const.BioHandle, function (handle, attr, value) {

   var index
     , hilGroup = getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) { advisorData[handle].bio = value; }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("bioText").text(value);
      }
   }
});

dmz.object.text.observe(self, dmz.const.PictureDirectoryNameHandle,
function (handle, attr, value) {

   var index
     , file
     , hilGroup
     ;

   if (advisorData[handle]) {

      file = dmz.object.text(handle, dmz.const.PictureFileNameHandle)
      if (file && file.length) {

         file = dmz.ui.graph.createPixmap(value + file);
         if (file) {

            advisorData[handle].picture = file;
            hilGroup = getUserGroupHandle(dmz.object.hil());
            if (hilGroup && groupAdvisors[hilGroup]) {

               index = groupAdvisors[hilGroup].indexOf(handle);
               if ((index !== -1) && (index < advisorCount)) {

                  advisorWidgets[index].lookup("pictureLabel").pixmap(file);
               }
            }
         }
      }
   }
});

dmz.object.text.observe(self, dmz.const.PictureFileNameHandle,
function (handle, attr, value) {

   var index
     , file
     , hilGroup = getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) {

      file = dmz.object.text(handle, dmz.const.PictureDirectoryNameHandle)
      if (file && file.length) {

         file = dmz.ui.graph.createPixmap(file + value);
         if (file) {

            advisorData[handle].picture = file;
            if (hilGroup && groupAdvisors[hilGroup]) {

               index = groupAdvisors[hilGroup].indexOf(handle);
               if ((index !== -1) && (index < advisorCount)) {

                  advisorWidgets[index].lookup("pictureLabel").pixmap(file);
               }
            }
         }
      }
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx;
   if (Mode === dmz.module.Activate) {

      for (idx = 0; idx < advisorCount; idx += 1) { updateAdvisor(module, idx); }
   }
});
