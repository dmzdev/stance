require("datejs/date");

var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , spinBox: require("dmz/ui/spinBox")
      , graph: require("dmz/ui/graph")
      , layout: require("dmz/ui/layout")
      , label: require("dmz/ui/label")
      , loader: require('dmz/ui/uiLoader')
      , textEdit: require("dmz/ui/textEdit")
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
   , time: require("dmz/runtime/time")
   }

   // UI
   , voteForm = dmz.ui.loader.load("VoteForm.ui")
   , scrollArea = voteForm.lookup("scrollArea")
   , formContent = scrollArea.widget()
   , contentLayout = dmz.ui.layout.createVBoxLayout()

   // Variables
   , SEND_MAIL = true
   , EmailMod = false
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , VoteObjects = {}
   , DecisionObjects = {}
   , PastVotes = []
   , ActiveVotes = []
   , ApprovalVotes = []
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
   , hil
   , userGroupHandle
   , isAdmin

   //Functions
   , toDate = dmz.util.timeStampToDate
   , indexOfVote
   , insertIntoVotes
   , removeFromVotes
   , openWindow
   , initiateVoteUI
   , setYesNoLabels
   , setActiveLabels
   , setApprovalPendingLabels
   , setDeniedLabels
   , updateVotes
   , updateStateUI
   , updateStartTime
   , updateEndTime
   , updateExpiredTime
   , updatePostedTime
   , updateState
   , isVoteOver
   , userVoted
   , hasUserVoted
   , createDecisionObject
   , numberOfNonAdminUsers
   , updateLastSeen
   , checkForNotifications
   , clearLayout
   , init
   ;

updateStateUI = function (voteHandle, pastState) {

   var voteItem
     , insertFunction
     , emailHandles
     , filteredEmailHandles
     ;

   insertFunction = function () {

      if (pastState !== undefined) {

         removeFromVotes(voteItem, pastState);
         insertIntoVotes(voteItem);
      }
   }

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui &&
      VoteObjects[voteHandle].groupHandle && (VoteObjects[voteHandle].groupHandle === userGroupHandle)) {

      voteItem = VoteObjects[voteHandle];
      if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) {

         setYesNoLabels(voteHandle);
         insertFunction();
         // send vote is over email
         if ((pastState === dmz.stance.VOTE_ACTIVE) && SEND_MAIL) {

            emailHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteEmailLinkHandle);
            filteredEmailHandles = emailHandles.filter(function (emailHandle) {

               return (dmz.object.scalar(emailHandle, dmz.stance.EmailPriorityHandle) === dmz.stance.PRIORITY_THIRD);
            });
            if ((filteredEmailHandles === undefined) || !filteredEmailHandles.length) {

               if (voteItem.state === dmz.stance.VOTE_YES) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_YES, DecisionObjects[voteItem.decisionHandle]);
               }
               else if (voteItem.state === dmz.stance.VOTE_NO) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_NO, DecisionObjects[voteItem.decisionHandle]);
               }
            }
         }
      }
      else if (voteItem.state === dmz.stance.VOTE_DENIED) {

         setDeniedLabels(voteHandle);
         insertFunction();
      }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         setApprovalPendingLabels(voteHandle);
         insertFunction();
      }
      else if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

         if (VoteObjects[voteHandle].decisionHandle) {

            setActiveLabels(voteHandle);
            insertFunction();
         }
         else {

            dmz.time.setTimer(self, 1, function () { updateStateUI(voteHandle, pastState); });
         }
      }
   }
};

updateStartTime = function (decisionHandle) {

   var voteItem
     , decisionItem
     ;

   if (DecisionObjects[decisionHandle] && DecisionObjects[decisionHandle].voteHandle &&
      VoteObjects[DecisionObjects[decisionHandle].voteHandle] &&
      VoteObjects[DecisionObjects[decisionHandle].voteHandle].ui) {

      voteItem = VoteObjects[DecisionObjects[decisionHandle].voteHandle];
      decisionItem = DecisionObjects[decisionHandle];
      voteItem.ui.startTimeLabel.text(
         "<b>Started: </b>" +
         (decisionItem.startTime ?
            toDate(decisionItem.startTime).toString(dmz.stance.TIME_FORMAT) :
            "Less than 5 min ago"));
   }
};

updateEndTime = function (decisionHandle) {

   var voteItem
     , decisionItem
     ;

   if (DecisionObjects[decisionHandle] && DecisionObjects[decisionHandle].voteHandle &&
      VoteObjects[DecisionObjects[decisionHandle].voteHandle] &&
      VoteObjects[DecisionObjects[decisionHandle].voteHandle].ui) {

      voteItem = VoteObjects[DecisionObjects[decisionHandle].voteHandle];
      decisionItem = DecisionObjects[decisionHandle];
      voteItem.ui.endTimeLabel.text(
         "<b>Ended: </b>" +
         (decisionItem.endTime ?
            toDate(decisionItem.endTime).toString(dmz.stance.TIME_FORMAT) :
            "Less than 5 min ago"));
   }
};

updateExpiredTime = function (decisionHandle) {

   var voteItem
     , decisionItem
     ;

   if (DecisionObjects[decisionHandle] && DecisionObjects[decisionHandle].voteHandle &&
      VoteObjects[DecisionObjects[decisionHandle].voteHandle] &&
      VoteObjects[DecisionObjects[decisionHandle].voteHandle].ui) {

      voteItem = VoteObjects[DecisionObjects[decisionHandle].voteHandle];
      decisionItem = DecisionObjects[decisionHandle];
      voteItem.ui.endTimeLabel.text(
         "<b>Expires: </b>" +
         (decisionItem.expiredTime ?
            toDate(decisionItem.expiredTime).toString(dmz.stance.TIME_FORMAT) :
            "Calculating..."));
   }
};

updatePostedTime = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];
      voteItem.ui.startTimeLabel.text(
         "<b>Posted: </b>" +
         (voteItem.postedTime ?
            toDate(voteItem.postedTime).toString(dmz.stance.TIME_FORMAT) :
            "Less than 5 min ago"));
   }
};

updateVotes = function (voteHandle) {

   var voteItem
     , decisionItem
     , totalUsedVotes = 0
     , totalVotes = numberOfNonAdminUsers(userGroupHandle);
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].decisionHandle &&
      VoteObjects[voteHandle].ui && DecisionObjects[VoteObjects[voteHandle].decisionHandle]) {

      voteItem = VoteObjects[voteHandle];
      decisionItem = DecisionObjects[voteItem.decisionHandle];

      voteItem.ui.noVotesLabel.text("<b>No Votes: </b>" + (decisionItem.noVotes || 0));
      totalUsedVotes += (decisionItem.noVotes || 0);
      voteItem.ui.yesVotesLabel.text("<b>Yes Votes: </b>" + (decisionItem.yesVotes || 0));
      totalUsedVotes += (decisionItem.yesVotes || 0);
      voteItem.ui.undecidedVotesLabel.text("<b>Undecided Votes: </b>" + (totalVotes - totalUsedVotes));
   }
};

setDeniedLabels = function (voteHandle) {

   var voteItem
     , decisionItem
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui &&
      VoteObjects[voteHandle].decisionHandle &&
      DecisionObjects[VoteObjects[voteHandle].decisionHandle]) {

      voteItem = VoteObjects[voteHandle];
      decisionItem = DecisionObjects[voteItem.decisionHandle];

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_DENIED) {

            voteItem.ui.postItem.styleSheet("* { background-color: rgb(70, 70, 70); }");
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.ui.userPictureLabel.pixmap(pic);
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.ui.advisorPictureLabel.pixmap(pic);
      }
      if (voteItem.advisorName && decisionItem.advisorResponse) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ): </b>" +
            decisionItem.advisorResponse);
      }
      if (voteItem.postedTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Posted: </b>" +
            (voteItem.postedTime ?
               toDate(voteItem.postedTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      voteItem.ui.yesVotesLabel.text("");
      voteItem.ui.noVotesLabel.text("");
      voteItem.ui.undecidedVotesLabel.text("");
      voteItem.ui.endTimeLabel.text("");
      voteItem.ui.yesButton.hide();
      voteItem.ui.noButton.hide();
      voteItem.ui.timeBox.hide();
      voteItem.ui.timeBoxLabel.hide();
      voteItem.ui.decisionTextEdit.hide();
      voteItem.ui.decisionTextEditLabel.hide();
      voteItem.ui.textLayout.removeWidget(voteItem.ui.decisionTextEditLabel);
      voteItem.ui.textLayout.removeWidget(voteItem.ui.decisionTextEdit);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.yesButton);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.noButton);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.timeBox);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.timeBoxLabel);
   }
};

setApprovalPendingLabels = function (voteHandle) {

   var voteItem = VoteObjects[voteHandle]
     , pic
     ;

   if (voteItem && voteItem.ui) {

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

            voteItem.ui.postItem.styleSheet("* { background-color: rgb(240, 240, 240); }");
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.ui.userPictureLabel.pixmap(pic);
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.ui.advisorPictureLabel.pixmap(pic);
      }
      if (voteItem.advisorName) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ) </b>");
      }
      if (voteItem.postedTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Posted: </b>" +
            (voteItem.postedTime ?
               toDate(voteItem.postedTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      voteItem.ui.yesVotesLabel.text("");
      voteItem.ui.noVotesLabel.text("");
      voteItem.ui.undecidedVotesLabel.text("");
      voteItem.ui.endTimeLabel.text("");
      if (dmz.stance.isAllowed(hil, dmz.stance.AdvisorApproveSet[dmz.object.scalar(voteItem.advisorHandle, dmz.stance.ID)])) {

         voteItem.ui.buttonLayout.insertWidget(0, voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.insertWidget(1, voteItem.ui.noButton);
         voteItem.ui.buttonLayout.insertWidget(2, voteItem.ui.timeBoxLabel);
         voteItem.ui.buttonLayout.insertWidget(3, voteItem.ui.timeBox);
         voteItem.ui.textLayout.insertWidget(0, voteItem.ui.decisionTextEditLabel);
         voteItem.ui.textLayout.insertWidget(1, voteItem.ui.decisionTextEdit);
         if (LoginSkipped) {

            voteItem.ui.yesButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
            voteItem.ui.noButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
         }
         else {

            voteItem.ui.yesButton.styleSheet("* { background-color: rgb(70, 240, 70); }");
            voteItem.ui.noButton.styleSheet("* { background-color: rgb(240, 70, 70); }");
            voteItem.ui.yesButton.observe(self, "clicked", function () {

               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
               createDecisionObject(
                  true,
                  voteItem.handle,
                  voteItem.ui.timeBox.value(),
                  voteItem.ui.decisionTextEdit.text() || "Okay.");
               //send vote is approved/active email (2)
               if (SEND_MAIL) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_ACTIVE);
               }
            });
            voteItem.ui.noButton.observe(self, "clicked", function () {

               voteItem.ui.noButton.hide();
               voteItem.ui.yesButton.hide();
               createDecisionObject(
                  false, voteItem.handle,
                  voteItem.ui.timeBox.value(),
                  voteItem.ui.decisionTextEdit.text() || "No.");
               //send vote is denied email (3)
               if (SEND_MAIL) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_DENIED);
               }
            });
         }
      }
   }
};

setActiveLabels = function (voteHandle) {

   var voteItem
     , decisionItem
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui &&
      VoteObjects[voteHandle].decisionHandle &&
      DecisionObjects[VoteObjects[voteHandle].decisionHandle]) {

      voteItem = VoteObjects[voteHandle];
      decisionItem = DecisionObjects[voteItem.decisionHandle];

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

            voteItem.ui.postItem.styleSheet("* { background-color: rgb(240, 240, 70); }");
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.ui.userPictureLabel.pixmap(pic);
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.ui.advisorPictureLabel.pixmap(pic);
      }
      if (voteItem.advisorName && decisionItem.advisorResponse) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ): </b>" +
            decisionItem.advisorResponse);
      }
      if (decisionItem.startTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Started: </b>" +
            (decisionItem.startTime ?
               toDate(decisionItem.startTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      if (decisionItem.expiredTime !== undefined) {

         voteItem.ui.endTimeLabel.text(
            "<b>Expires: </b>" +
            (decisionItem.expiredTime ?
               toDate(decisionItem.expiredTime).toString(dmz.stance.TIME_FORMAT) :
               "Calculating..."));
      }
      updateVotes(voteHandle);
      if (dmz.stance.isAllowed(hil, dmz.stance.CastVoteFlag) && !hasUserVoted(hil, voteItem.decisionHandle)) {

         voteItem.ui.buttonLayout.insertWidget(0, voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.insertWidget(1, voteItem.ui.noButton);
         if (!LoginSkipped) {

            voteItem.ui.yesButton.styleSheet("* { background-color: rgb(70, 240, 70); }");
            voteItem.ui.noButton.styleSheet("* { background-color: rgb(240, 70, 70); }");
            voteItem.ui.yesButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.decisionHandle, true);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
            voteItem.ui.noButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.decisionHandle, false);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
         }
         else {

            voteItem.ui.yesButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
            voteItem.ui.noButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
         }
      }
      else {

         voteItem.ui.yesButton.hide();
         voteItem.ui.noButton.hide();
      }
      voteItem.ui.timeBox.hide();
      voteItem.ui.timeBoxLabel.hide();
      voteItem.ui.decisionTextEdit.hide();
      voteItem.ui.decisionTextEditLabel.hide();
      voteItem.ui.textLayout.removeWidget(voteItem.ui.decisionTextEditLabel);
      voteItem.ui.textLayout.removeWidget(voteItem.ui.decisionTextEdit);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.timeBox);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.timeBoxLabel);
   }
};

setYesNoLabels = function (voteHandle) {

   var voteItem
     , decisionItem
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui &&
      VoteObjects[voteHandle].decisionHandle &&
      DecisionObjects[VoteObjects[voteHandle].decisionHandle]) {

      voteItem = VoteObjects[voteHandle];
      decisionItem = DecisionObjects[voteItem.decisionHandle];

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_NO) {

            voteItem.ui.postItem.styleSheet("* { background-color: rgb(240, 70, 70); }");
         }
         else if (voteItem.state === dmz.stance.VOTE_YES) {

            voteItem.ui.postItem.styleSheet("* { background-color: rgb(70, 240, 70); }");
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.ui.userPictureLabel.pixmap(pic);
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.ui.advisorPictureLabel.pixmap(pic);
      }
      if (voteItem.advisorName && decisionItem.advisorResponse) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ): </b>" +
            decisionItem.advisorResponse);
      }
      if (decisionItem.startTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Started: </b>" +
            (decisionItem.startTime ?
               toDate(decisionItem.startTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      if (decisionItem.endTime !== undefined) {

         voteItem.ui.endTimeLabel.text(
            "<b>Ended: </b>" +
            (decisionItem.endTime ?
               toDate(decisionItem.endTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      updateVotes(voteHandle);
      if (dmz.stance.isAllowed(hil, dmz.stance.CastVoteFlag) && !hasUserVoted(hil, voteItem.decisionHandle)) {

         voteItem.ui.buttonLayout.insertWidget(0, voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.insertWidget(1, voteItem.ui.noButton);
         if (!LoginSkipped) {

            voteItem.ui.yesButton.styleSheet("* { background-color: rgb(70, 240, 70); }");
            voteItem.ui.noButton.styleSheet("* { background-color: rgb(240, 70, 70); }");
            voteItem.ui.yesButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.decisionHandle, true);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
            voteItem.ui.noButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.decisionHandle, false);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
         }
         else {

            voteItem.ui.yesButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
            voteItem.ui.noButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
         }
      }
      else {

         voteItem.ui.yesButton.hide();
         voteItem.ui.noButton.hide();
         voteItem.ui.buttonLayout.removeWidget(voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.removeWidget(voteItem.ui.noButton);
      }
      voteItem.ui.timeBox.hide();
      voteItem.ui.timeBoxLabel.hide();
      voteItem.ui.decisionTextEdit.hide();
      voteItem.ui.decisionTextEditLabel.hide();
      voteItem.ui.textLayout.removeWidget(voteItem.ui.decisionTextEditLabel);
      voteItem.ui.textLayout.removeWidget(voteItem.ui.decisionTextEdit);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.timeBox);
      voteItem.ui.buttonLayout.removeWidget(voteItem.ui.timeBoxLabel);
   }
};

initiateVoteUI = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && !VoteObjects[voteHandle].ui &&
      (VoteObjects[voteHandle].state !== undefined)) {

      voteItem = VoteObjects[voteHandle];
      voteItem.ui = {};
      voteItem.ui.postItem = dmz.ui.loader.load("VoteViewPost.ui");
      voteItem.ui.userPictureLabel = voteItem.ui.postItem.lookup("userPictureLabel");
      voteItem.ui.postedByLabel = voteItem.ui.postItem.lookup("postedByLabel");
      voteItem.ui.startTimeLabel = voteItem.ui.postItem.lookup("startTimeLabel");
      voteItem.ui.endTimeLabel = voteItem.ui.postItem.lookup("endTimeLabel");
      voteItem.ui.questionLabel = voteItem.ui.postItem.lookup("questionLabel");
      voteItem.ui.stateLabel = voteItem.ui.postItem.lookup("stateLabel");
      voteItem.ui.yesVotesLabel = voteItem.ui.postItem.lookup("yesVotesLabel");
      voteItem.ui.noVotesLabel = voteItem.ui.postItem.lookup("noVotesLabel");
      voteItem.ui.undecidedVotesLabel = voteItem.ui.postItem.lookup("undecidedVotesLabel");
      voteItem.ui.advisorPictureLabel = voteItem.ui.postItem.lookup("advisorPictureLabel");
      voteItem.ui.advisorReasonLabel = voteItem.ui.postItem.lookup("advisorReasonLabel");
      voteItem.ui.yesButton = dmz.ui.button.createPushButton("Approve");
      voteItem.ui.noButton = dmz.ui.button.createPushButton("Deny");
      voteItem.ui.buttonLayout = voteItem.ui.postItem.lookup("buttonLayout");
      voteItem.ui.textLayout = voteItem.ui.postItem.lookup("textLayout");
      voteItem.ui.timeBox = dmz.ui.spinBox.createSpinBox("timeBox");
      voteItem.ui.timeBox.minimum(24);
      voteItem.ui.timeBox.maximum(72);
      voteItem.ui.timeBox.setSingleStep(24);
      voteItem.ui.timeBox.setSuffix("hrs");
      voteItem.ui.timeBoxLabel = dmz.ui.label.create("<b>Duration: </b>");
      voteItem.ui.timeBoxLabel.sizePolicy(8, 0);
      voteItem.ui.decisionTextEdit = dmz.ui.textEdit.create("");
      voteItem.ui.decisionTextEdit.sizePolicy(7, 0);
      voteItem.ui.decisionTextEdit.fixedHeight(90);
      voteItem.ui.decisionTextEditLabel = dmz.ui.label.create("<b>Decision Reason: </b>");

      if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) {

         setYesNoLabels(voteHandle);
      }
      else if (voteItem.state === dmz.stance.VOTE_ACTIVE) { setActiveLabels(voteHandle); }
      else if (voteItem.state === dmz.stance.VOTE_DENIED) { setDeniedLabels(voteHandle); }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         setApprovalPendingLabels(voteHandle);
      }
   }
};

indexOfVote = function (voteItem, pastState) {

   var itor
     , result = -1
     , voteArray
     ;

   if (pastState === dmz.stance.VOTE_APPROVAL_PENDING) { voteArray = ApprovalVotes; }
   else if (pastState === dmz.stance.VOTE_ACTIVE) { voteArray = ActiveVotes; }
   else if ((pastState === dmz.stance.VOTE_NO) || (pastState === dmz.stance.VOTE_YES) ||
      (pastState === dmz.stance.VOTE_DENIED)) {

      voteArray = PastVotes;
   }
   for (itor = 0; itor < voteArray.length; itor += 1) {

      if (voteArray[itor].handle === voteItem.handle) {

         result = itor;
      }
   }
   return result;
};

removeFromVotes = function (voteItem, pastState) {

   var voteItemIndex
     , voteArray
     ;

   if (voteItem.ui) {

      if (pastState === dmz.stance.VOTE_APPROVAL_PENDING) {

         voteArray = ApprovalVotes;
      }
      else if (pastState === dmz.stance.VOTE_ACTIVE) {

         voteArray = ActiveVotes;
      }
      else if ((pastState === dmz.stance.VOTE_YES) || (pastState === dmz.stance.VOTE_NO) ||
         (pastState === dmz.stance.VOTE_DENIED)) {

         voteArray = PastVotes;
      }
      if (pastState !== dmz.stance.VOTE_EXPIRED) {

         voteItemIndex = indexOfVote(voteItem, pastState);
         if (voteItemIndex !== -1) {

            voteArray.splice(voteItemIndex, 1);
            contentLayout.removeWidget(voteItem.postItem);
         }
      }
   }
};

insertIntoVotes = function (voteItem) {

   var itor
     , slot
     , inserted = false
     , insertedStartTime
     , newStartTime
     , voteArray
     , offset = 0;
     ;

   if (voteItem.ui) {

      if (voteItem.state === dmz.stance.VOTE_DENIED) {

         newStartTime = voteItem.postedTime || 0;
         voteArray = PastVotes;
         offset = ApprovalVotes.length + ActiveVotes.length;
      }
      else if ((voteItem.state === dmz.stance.VOTE_YES) ||
         (voteItem.state === dmz.stance.VOTE_NO)) {

         if (voteItem.decisionHandle && DecisionObjects[voteItem.decisionHandle] &&
            DecisionObjects[voteItem.decisionHandle].startTime) {

            newStartTime = DecisionObjects[voteItem.decisionHandle].startTime;
         }
         else { newStartTime = 0; }
         voteArray = PastVotes;
         offset = ApprovalVotes.length + ActiveVotes.length;
      }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         newStartTime = voteItem.postedTime || 0;
         voteArray = ApprovalVotes;
         offset = ActiveVotes.length;
      }
      else if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

         if (voteItem.decisionHandle && DecisionObjects[voteItem.decisionHandle] &&
            DecisionObjects[voteItem.decisionHandle].startTime) {

            newStartTime = DecisionObjects[voteItem.decisionHandle].startTime;
         }
         else { newStartTime = 0; }
         voteArray = ActiveVotes;
         offset = 0;
      }
      if ((newStartTime === 0) || (voteArray.length === 0)) {

         inserted = true;
         if (voteArray.length === 0) { voteArray.push(voteItem); }
         else { voteArray.splice(0, 0, voteItem); }
         contentLayout.insertWidget(0 + offset, voteItem.ui.postItem);
         voteItem.ui.postItem.show();
      }
      for (itor = 0; itor < voteArray.length; itor += 1) {

         if (!inserted) {

            if (voteArray[itor].state === dmz.stance.VOTE_DENIED) {

               insertedStartTime = voteArray[itor].postedTime;
            }
            else if ((voteArray[itor].state === dmz.stance.VOTE_YES) ||
               (voteArray[itor].state === dmz.stance.VOTE_NO)) {

               insertedStartTime = DecisionObjects[voteArray[itor].decisionHandle].startTime;
            }

            if (newStartTime >= insertedStartTime) {

               inserted = true;
               if (voteArray.length === 0 ) { voteArray.push(voteItem); }
               else { voteArray.splice(itor, 0, voteItem); }
               contentLayout.insertWidget(itor + offset, voteItem.ui.postItem);
               voteItem.ui.postItem.show();
            }
         }
      }
      if (!inserted) {

         inserted = true;
         voteArray.push(voteItem);
         contentLayout.insertWidget(voteArray.length - 1 + offset, voteItem.ui.postItem);
         voteItem.ui.postItem.show();
      }
   }
};

clearLayout = function () {

   var widget;

   if (formContent && contentLayout) {

      widget = contentLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = contentLayout.takeAt(0);
      }
      contentLayout.addStretch(1);
   }
};

openWindow = function () {

   var index = 0;

   Object.keys(VoteObjects).forEach(function (key) {

      if (VoteObjects[key].groupHandle === userGroupHandle) {

         initiateVoteUI(VoteObjects[key].handle);
         index = indexOfVote(VoteObjects[key], VoteObjects[key].state);
         if (index === -1) {

            insertIntoVotes(VoteObjects[key]);
         }
      }
   });
   updateLastSeen();
};

userVoted = function (userHandle, decisionHandle, vote) {

   dmz.object.link(vote ? dmz.stance.YesHandle : dmz.stance.NoHandle, userHandle, decisionHandle);
};

hasUserVoted = function (userHandle, decisionHandle) {

   return dmz.object.linkHandle(dmz.stance.YesHandle, userHandle, decisionHandle) ||
      dmz.object.linkHandle(dmz.stance.NoHandle, userHandle, decisionHandle);
};

numberOfNonAdminUsers = function (groupHandle) {

   var userHandles = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle) || [];

   userHandles = userHandles.filter(function (userHandle) {

      return (dmz.stance.isAllowed(userHandle, dmz.stance.CastVoteFlag) && dmz.object.flag(userHandle, dmz.stance.ActiveHandle));
   });

   return userHandles.length;
};

createDecisionObject = function (decisionValue, voteHandle, duration, reason) {

   var decision = dmz.object.create(dmz.stance.DecisionType);

   dmz.object.link(dmz.stance.VoteLinkHandle, decision, voteHandle);
   dmz.object.text(decision, dmz.stance.TextHandle, reason);
   dmz.object.link(dmz.stance.CreatedByHandle, decision, dmz.object.hil());

   if (decisionValue) {

      dmz.object.timeStamp(decision, dmz.stance.CreatedAtServerTimeHandle, 0);
      dmz.object.flag(decision, dmz.stance.UpdateStartTimeHandle, true);
      dmz.object.timeStamp(decision, dmz.stance.ExpiredTimeHandle, 0);
      dmz.object.flag(decision, dmz.stance.UpdateExpiredTimeHandle, true);
      dmz.object.timeStamp(decision, dmz.stance.EndedAtServerTimeHandle, 0);
      dmz.object.flag(decision, dmz.stance.UpdateEndTimeHandle, false);
      duration *= 3600; //convert to unix seconds
      //duration *= 60;
      dmz.object.timeStamp(decision, dmz.stance.DurationHandle, duration);
      dmz.object.activate(decision);
      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_ACTIVE);
   }
   else {

      dmz.object.activate(decision);
      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_DENIED);
   }
};

isVoteOver = function (objHandle) {

   var decisionData
     , yesVotes
     , noVotes
     , totalUsers = numberOfNonAdminUsers(userGroupHandle)
     , voteHandle
     , decisionHandle
     , tempHandles
     , voteState
     ;

   if (VoteObjects[objHandle] && VoteObjects[objHandle].decisionHandle) {

      decisionData = DecisionObjects[VoteObjects[objHandle].decisionHandle];
      decisionHandle = decisionData.handle;
      voteHandle = objHandle;
   }
   else if (DecisionObjects[objHandle] && DecisionObjects[objHandle].voteHandle) {

      decisionData = DecisionObjects[objHandle]
      voteHandle = decisionData.voteHandle;
      decisionHandle = objHandle;
   }
   if (decisionHandle && totalUsers && voteHandle) {

      yesVotes = decisionData.yesVotes || 0;
      noVotes = decisionData.noVotes || 0;
      voteState = VoteObjects[voteHandle].state;

      if ((voteState !== dmz.stance.VOTE_NO) && (voteState !== dmz.stance.VOTE_YES) &&
         (voteState !== dmz.stance.VOTE_EXPIRED)) {

         if (yesVotes > (totalUsers / 2)) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
         }
         if (noVotes >= (totalUsers / 2)) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
         }
      }
      else if (voteHandle && (voteState === dmz.stance.VOTE_EXPIRED) && !LoginSkipped) {

         var newState;

         if (noVotes >= yesVotes) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, false);
            dmz.object.timeStamp(
               decisionHandle,
               dmz.stance.EndedAtServerTimeHandle,
               dmz.object.timeStamp(decisionHandle, dmz.stance.ExpiredTimeHandle));
            newState = dmz.stance.VOTE_NO;
         }
         else if (yesVotes > noVotes) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, false);
            dmz.object.timeStamp(
               decisionHandle,
               dmz.stance.EndedAtServerTimeHandle,
               dmz.object.timeStamp(decisionHandle, dmz.stance.ExpiredTimeHandle));
            newState = dmz.stance.VOTE_YES;
         }
         if (SEND_MAIL && newState) {

            if (VoteObjects[voteHandle] && VoteObjects[voteHandle].groupHandle &&
               DecisionObjects[decisionHandle].advisorResponse) {

               EmailMod.sendVoteEmail(VoteObjects[voteHandle], newState, DecisionObjects[decisionHandle]);
            }
         }
      }
   }
};

updateLastSeen = function () {

   var latestTime = 0
     , voteItem
     ;

   Object.keys(VoteObjects).forEach(function (key) {

      voteItem = VoteObjects[key];
      if (voteItem.groupHandle && (voteItem.groupHandle === userGroupHandle) &&
         (voteItem.state !== undefined)) {

         if (((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) &&
            voteItem.decisionHandle && DecisionObjects[voteItem.decisionHandle] &&
            DecisionObjects[voteItem.decisionHandle].endTime &&
            (DecisionObjects[voteItem.decisionHandle].endTime > latestTime)) {

            latestTime = DecisionObjects[voteItem.decisionHandle].endTime;
         }
         else if (((voteItem.state === dmz.stance.VOTE_DENIED) || (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING)) &&
            voteItem.postedTime && (voteItem.postedTime > latestTime)) {

            latestTime = voteItem.postedTime;
         }
         else if ((voteItem.state === dmz.stance.VOTE_ACTIVE) && voteItem.decisionHandle &&
            DecisionObjects[voteItem.decisionHandle] && DecisionObjects[voteItem.decisionHandle].startTime &&
            (DecisionObjects[voteItem.decisionHandle].startTime > latestTime)) {

            latestTime = DecisionObjects[voteItem.decisionHandle].startTime;
         }
      }
      if (latestTime) {

         dmz.stance.userAttribute(hil, dmz.stance.VoteTimeHandle, latestTime);
      }
   });
};

checkForNotifications = function () {

   var lastUserTime = dmz.stance.userAttribute(hil, dmz.stance.VoteTimeHandle) || 0
     , voteItem
     , lastVoteTime = 0
     ;

   Object.keys(VoteObjects).forEach(function (key) {

      voteItem = VoteObjects[key];
      if (voteItem.groupHandle && (voteItem.groupHandle === userGroupHandle) &&
         (voteItem.state !== undefined) && (lastUserTime !== undefined)) {

         if (((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) &&
            voteItem.decisionHandle && DecisionObjects[voteItem.decisionHandle] &&
            DecisionObjects[voteItem.decisionHandle].endTime &&
            (DecisionObjects[voteItem.decisionHandle].endTime > lastVoteTime)) {

            lastVoteTime = DecisionObjects[voteItem.decisionHandle].endTime;
         }
         else if (((voteItem.state === dmz.stance.VOTE_DENIED) || (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING)) &&
            voteItem.postedTime && (voteItem.postedTime > lastVoteTime)) {

            lastVoteTime = voteItem.postedTime;
         }
         else if ((voteItem.state === dmz.stance.VOTE_ACTIVE) && voteItem.decisionHandle &&
            DecisionObjects[voteItem.decisionHandle] && DecisionObjects[voteItem.decisionHandle].startTime &&
            (DecisionObjects[voteItem.decisionHandle].startTime > lastVoteTime)) {

            lastVoteTime = DecisionObjects[voteItem.decisionHandle].startTime;
         }
      }
      if (lastVoteTime > lastUserTime) {

         MainModule.highlight("Vote");
      }
   });
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      dmz.time.setTimer(self, function () {

         hil = objHandle;
         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         isAdmin = dmz.object.flag(hil, dmz.stance.AdminHandle);
         Object.keys(VoteObjects).forEach(function (key) {

            isVoteOver(VoteObjects[key].handle);
         });
         if (isAdmin) {

            Object.keys(VoteObjects).forEach(function (key) {

               clearLayout();
               PastVotes = [];
               ApprovalVotes = [];
               ActiveVotes = [];
               if (VoteObjects[key].ui) {

                  delete VoteObjects[key].ui;
               }
            });
         }
         checkForNotifications();
      });
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.VoteType)) {

      VoteObjects[objHandle] = { handle: objHandle };
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      DecisionObjects[objHandle] =
         { handle: objHandle };
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].question = newVal;
   }
   else if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].advisorResponse = newVal;
   }
});

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].state = newVal;
      dmz.time.setTimer(self, 1, function () {

         if (newVal === dmz.stance.VOTE_EXPIRED) {

            isVoteOver(objHandle);
         }
         updateStateUI(objHandle, prevVal);
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].postedTime = newVal;
      dmz.time.setTimer(self, function () {

         updatePostedTime(objHandle);
         checkForNotifications();
      });
   }
   else if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].startTime = newVal;
      dmz.time.setTimer(self, function () {

         updateStartTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].endTime = newVal;
      dmz.time.setTimer(self, function () {

         updateEndTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.ExpiredTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].expiredTime = newVal;
      dmz.time.setTimer(self, function () {

         updateExpiredTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      VoteObjects[supHandle].advisorHandle = subHandle;
      dmz.time.setTimer(self, function () {

         VoteObjects[supHandle].advisorPicture = dmz.object.text(subHandle, dmz.stance.PictureHandle);
         VoteObjects[supHandle].advisorName = dmz.object.text(subHandle, dmz.stance.NameHandle);
         VoteObjects[supHandle].advisorTitle = dmz.object.text(subHandle, dmz.stance.TitleHandle);
      });
   }
   else if (DecisionObjects[supHandle]) {

      DecisionObjects[supHandle].voteHandle = subHandle;
      if (VoteObjects[subHandle]) {

         VoteObjects[subHandle].decisionHandle = supHandle;
      }
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      dmz.time.setTimer(self, function () {

         VoteObjects[supHandle].createdByHandle = subHandle;
         VoteObjects[supHandle].userPicture = dmz.object.text(subHandle, dmz.stance.PictureHandle);
         VoteObjects[supHandle].postedBy = dmz.stance.getDisplayName(subHandle);
      });
   }
});

dmz.object.link.observe(self, dmz.stance.VoteGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      VoteObjects[supHandle].groupHandle = subHandle;
      if (!VoteObjects[supHandle].ui && subHandle === userGroupHandle) {

         dmz.time.setTimer(self, function () {

            initiateVoteUI(supHandle);
            insertIntoVotes(VoteObjects[supHandle]);
         });
      }
   }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (DecisionObjects[subHandle]) {

      DecisionObjects[subHandle].noVotes = (DecisionObjects[subHandle].noVotes || 0) + 1;
      dmz.time.setTimer(self, function () {

         updateVotes(DecisionObjects[subHandle].voteHandle);
         isVoteOver(subHandle);
      });
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (DecisionObjects[subHandle]) {

      DecisionObjects[subHandle].yesVotes = (DecisionObjects[subHandle].yesVotes || 0) + 1;
      dmz.time.setTimer(self, function () {

         updateVotes(DecisionObjects[subHandle].voteHandle);
         isVoteOver(subHandle);
      });
   }
});

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Vote", voteForm, openWindow, updateLastSeen);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();
