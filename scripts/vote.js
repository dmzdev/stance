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
   , data: require("dmz/runtime/data")
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
   , YES_BUTTON_STYLE = "* { background-color: rgb(30, 200, 30); border-style: outset; border-width: 2px; border-radius: 6px; border-color: black; }"
   , NO_BUTTON_STYLE = "* { background-color: rgb(200, 30, 30); border-style: outset; border-width: 2px; border-radius: 6px; border-color: black; }"
   , LOGIN_SKIPPED_BUTTON_STYLE = "* { background-color: rgb(130, 130, 130); }"
   , PENDING_STYLE = "* { background-color: rgb(240, 240, 240); }"
   , ACTIVE_STYLE = "* { background-color: rgb(240, 240, 70); }"
   , DENIED_STYLE = "* { background-color: rgb(70, 70, 70); color: white; }"
   , YES_STYLE = "* { background-color: rgb(70, 240, 70); }"
   , NO_STYLE = "* { background-color: rgb(240, 70, 70); }"
   , SEND_MAIL = true
   , EmailMod = false
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , VoteObjects = {}
   , Users = {}
   , Groups = {}
   , Advisors = {}
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
   , checkForStrategistAchievement
   , checkForOnTheBallot
   , checkForApprovedVotes
   , checkForVoteAchievement
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
   , updateTags
   , isVoteOver
   , userVoted
   , hasUserVoted
   , createDecision
   , numberOfNonAdminUsers
   , updateLastSeen
   , checkForNotifications
   , clearLayout
   , init
   ;

checkForStrategistAchievement = function (groupHandle) {

   if ((Groups[groupHandle].yesVotes.length >= 3) && (Groups[groupHandle].yesVotes.length < 6)) {

      Groups[groupHandle].users.forEach(function (userHandle) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.StrategistOneAchievement);
      });
   }
   else if ((Groups[groupHandle].yesVotes.length >= 6) && (Groups[groupHandle].yesVotes.length < 9)) {

      Groups[groupHandle].users.forEach(function (userHandle) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.StrategistTwoAchievement);
      });
   }
   else if (Groups[groupHandle].yesVotes.length >= 9) {

      Groups[groupHandle].users.forEach(function (userHandle) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.StrategistThreeAchievement);
      });
   }
};

checkForOnTheBallot = function (groupHandle) {

   var allAdvisorsHaveVotes = true;

   Object.keys(Advisors).forEach(function (key) {

      if ((Advisors[key].groupHandle === groupHandle) && !(Advisors[key].approvedVotes.length)) {

         allAdvisorsHaveVotes = false;
      }
   });
   if (allAdvisorsHaveVotes && Groups[groupHandle]) {

      Groups[groupHandle].users.forEach(function (userHandle) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.OnTheBallotAchievement);
      });
   }
};

checkForApprovedVotes = function (createdByHandle) {

   var approvedVotes = 0;

   if (Users[createdByHandle] && Users[createdByHandle].votesCreated) {

      Users[createdByHandle].votesCreated.forEach(function (voteHandle) {

         if (VoteObjects[voteHandle]) {

            if ((VoteObjects[voteHandle].state === dmz.stance.VOTE_ACTIVE) ||
               (VoteObjects[voteHandle].state === dmz.stance.VOTE_YES) ||
               (VoteObjects[voteHandle].state === dmz.stance.VOTE_NO)) {

               approvedVotes += 1;
            }
         }
      });
   }
   if ((approvedVotes >= 1) && (approvedVotes < 3)) {

      dmz.stance.unlockAchievement(createdByHandle, dmz.stance.RockTheVoteOneAchievement);
   }
   else if ((approvedVotes >= 3) && (approvedVotes < 5)) {

      dmz.stance.unlockAchievement(createdByHandle, dmz.stance.RockTheVoteTwoAchievement);
   }
   else if (approvedVotes >= 5) {

      dmz.stance.unlockAchievement(createdByHandle, dmz.stance.RockTheVoteThreeAchievement);
   }
};

checkForVoteAchievement = function (userHandle) {

   var totalVotes = 0;
   if (Users[userHandle]) {

      totalVotes = Users[userHandle].yesVotes.length + Users[userHandle].noVotes.length;
      if ((totalVotes < 6) && (totalVotes >= 3)) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.RightToVoteOneAchievement);
      }
      else if ((totalVotes < 9) && (totalVotes >= 6)) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.RightToVoteTwoAchievement);
      }
      else if (totalVotes >= 9) {

         dmz.stance.unlockAchievement(userHandle, dmz.stance.RightToVoteThreeAchievement);
      }
   }
};

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

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_YES, voteItem.handle);
               }
               else if (voteItem.state === dmz.stance.VOTE_NO) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_NO, voteItem.handle);
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

         setActiveLabels(voteHandle);
         insertFunction();
      }
   }
};

updateStartTime = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];
      voteItem.ui.startTimeLabel.text(
         "<b>Started: </b>" +
         (voteItem.startTime ?
            toDate(voteItem.startTime).toString(dmz.stance.TIME_FORMAT) :
            "Less than 5 min ago"));
   }
};

updateEndTime = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];
      voteItem.ui.endTimeLabel.text(
         "<b>Ended: </b>" +
         (voteItem.endTime ?
            toDate(voteItem.endTime).toString(dmz.stance.TIME_FORMAT) :
            "Less than 5 min ago"));
   }
};

updateExpiredTime = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];
      voteItem.ui.endTimeLabel.text(
         "<b>Expires: </b>" +
         (voteItem.expiredTime ?
            toDate(voteItem.expiredTime).toString(dmz.stance.TIME_FORMAT) :
            "Calculating..."));
   }
};

updatePostedTime = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui &&
      (!VoteObjects[voteHandle].startTime || (VoteObjects[voteHandle].startTime === 0))) {

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
     , totalUsedVotes = 0
     , totalVotes = numberOfNonAdminUsers(userGroupHandle);
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];

      voteItem.ui.noVotesLabel.text("<b>No Votes: </b>" + (voteItem.noVotes || 0));
      totalUsedVotes += (voteItem.noVotes || 0);
      voteItem.ui.yesVotesLabel.text("<b>Yes Votes: </b>" + (voteItem.yesVotes || 0));
      totalUsedVotes += (voteItem.yesVotes || 0);
      if ((totalVotes - totalUsedVotes) >= 0) {

         voteItem.ui.undecidedVotesLabel.text("<b>Undecided Votes: </b>" + (totalVotes - totalUsedVotes));
      }
      else { voteItem.ui.undecidedVotesLabel.text("<b>Undecided Votes: </b>0"); }
   }
};

updateTags = function (voteHandle) {

   var pic;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      if (VoteObjects[voteHandle].tags && dmz.stance.isAllowed(hil, dmz.stance.SeeTagFlag) &&
         VoteObjects[voteHandle].tags.length) {

         VoteObjects[voteHandle].ui.tagsLayout.insertWidget(0, VoteObjects[voteHandle].ui.tagLabel);
         VoteObjects[voteHandle].ui.tagLabel.show();
         VoteObjects[voteHandle].ui.tagLabel.text("<b>Tags: </b>" + VoteObjects[voteHandle].tags.toString());
      }
      else {

         VoteObjects[voteHandle].ui.tagLabel.text("");
         VoteObjects[voteHandle].ui.tagLabel.hide();
         VoteObjects[voteHandle].ui.tagsLayout.removeWidget(VoteObjects[voteHandle].ui.tagLabel);
      }
      if (dmz.stance.isAllowed(hil, dmz.stance.TagDataFlag) && !LoginSkipped) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile("tagButton"));
         if (pic) { VoteObjects[voteHandle].ui.tagButton.setIcon(pic); }
         VoteObjects[voteHandle].ui.tagsLayout.addWidget(VoteObjects[voteHandle].ui.tagButton);
         VoteObjects[voteHandle].ui.tagButton.show();
         VoteObjects[voteHandle].ui.tagButton.observe(self, "clicked", function () {

            dmz.stance.TAG_MESSAGE.send(dmz.data.wrapHandle(voteHandle));
         });
      }
      else {

         VoteObjects[voteHandle].ui.tagButton.hide();
         VoteObjects[voteHandle].ui.tagsLayout.removeWidget(VoteObjects[voteHandle].ui.tagButton);
      }
      if (dmz.stance.isAllowed(hil, dmz.stance.DisruptTheForceFlag) && !VoteObjects[voteHandle].dtf) {

         VoteObjects[voteHandle].ui.dtfButton.show();
      }
      else { VoteObjects[voteHandle].ui.dtfButton.hide(); }
   }
};

setDeniedLabels = function (voteHandle) {

   var voteItem
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_DENIED) {

            voteItem.ui.postItem.styleSheet(DENIED_STYLE);
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         if (pic) { voteItem.ui.userPictureLabel.pixmap(pic); }
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Requested By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         if (pic) { pic = pic.scaled(25, 25); }
         if (pic) { voteItem.ui.advisorPictureLabel.pixmap(pic); }
      }
      if (voteItem.advisorName && voteItem.advisorResponse) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ): </b>" +
            voteItem.advisorResponse);
      }
      if (voteItem.postedTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Posted: </b>" +
            (voteItem.postedTime ?
               toDate(voteItem.postedTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      updateTags(voteItem.handle);
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

            voteItem.ui.postItem.styleSheet(PENDING_STYLE);
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         if (pic) { voteItem.ui.userPictureLabel.pixmap(pic); }
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Requested By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         if (pic) { pic = pic.scaled(25, 25); }
         if (pic) { voteItem.ui.advisorPictureLabel.pixmap(pic); }
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
      updateTags(voteItem.handle);
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

            voteItem.ui.yesButton.styleSheet(LOGIN_SKIPPED_BUTTON_STYLE);
            voteItem.ui.noButton.styleSheet(LOGIN_SKIPPED_BUTTON_STYLE);
         }
         else {

            voteItem.ui.yesButton.styleSheet(YES_BUTTON_STYLE);
            voteItem.ui.noButton.styleSheet(NO_BUTTON_STYLE);
            voteItem.ui.yesButton.observe(self, "clicked", function () {

               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
               createDecision(
                  true,
                  voteItem.handle,
                  voteItem.ui.timeBox.value(),
                  voteItem.ui.decisionTextEdit.text() || "Okay.");
               //send vote is approved/active email (2)
               if (SEND_MAIL) { EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_ACTIVE); }
            });
            voteItem.ui.noButton.observe(self, "clicked", function () {

               voteItem.ui.noButton.hide();
               voteItem.ui.yesButton.hide();
               createDecision(
                  false,
                  voteItem.handle,
                  voteItem.ui.timeBox.value(),
                  voteItem.ui.decisionTextEdit.text() || "No.");
               //send vote is denied email (3)
               if (SEND_MAIL) { EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_DENIED); }
            });
         }
      }
   }
};

setActiveLabels = function (voteHandle) {

   var voteItem
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

            voteItem.ui.postItem.styleSheet(ACTIVE_STYLE);
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         if (pic) { voteItem.ui.userPictureLabel.pixmap(pic); }
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Requested By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         if (pic) { pic = pic.scaled(25, 25); }
         if (pic) { voteItem.ui.advisorPictureLabel.pixmap(pic); }
      }
      if (voteItem.advisorName && voteItem.advisorResponse) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ): </b>" +
            voteItem.advisorResponse);
      }
      if (voteItem.startTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Started: </b>" +
            (voteItem.startTime ?
               toDate(voteItem.startTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      if (voteItem.expiredTime !== undefined) {

         voteItem.ui.endTimeLabel.text(
            "<b>Expires: </b>" +
            (voteItem.expiredTime ?
               toDate(voteItem.expiredTime).toString(dmz.stance.TIME_FORMAT) :
               "Calculating..."));
      }
      updateVotes(voteHandle);
      if (dmz.stance.isAllowed(hil, dmz.stance.CastVoteFlag) && !hasUserVoted(hil, voteItem.handle)) {

         voteItem.ui.buttonLayout.insertWidget(0, voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.insertWidget(1, voteItem.ui.noButton);
         if (!LoginSkipped) {

            voteItem.ui.yesButton.styleSheet(YES_BUTTON_STYLE);
            voteItem.ui.noButton.styleSheet(NO_BUTTON_STYLE);
            voteItem.ui.yesButton.observe(self, "clicked", function () {

               userVoted(hil, voteItem.handle, true);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
            voteItem.ui.noButton.observe(self, "clicked", function () {

               userVoted(hil, voteItem.handle, false);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
         }
         else {

            voteItem.ui.yesButton.styleSheet(YES_BUTTON_STYLE);
            voteItem.ui.noButton.styleSheet(NO_BUTTON_STYLE);
         }
      }
      else {

         voteItem.ui.yesButton.hide();
         voteItem.ui.noButton.hide();
      }
      updateTags(voteItem.handle);
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
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui) {

      voteItem = VoteObjects[voteHandle];

      if (voteItem.state !== undefined) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
         if (voteItem.state === dmz.stance.VOTE_NO) {

            voteItem.ui.postItem.styleSheet(NO_STYLE);
         }
         else if (voteItem.state === dmz.stance.VOTE_YES) {

            voteItem.ui.postItem.styleSheet(YES_STYLE);
         }
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         if (pic) { voteItem.ui.userPictureLabel.pixmap(pic); }
      }
      if (voteItem.postedBy) {

         voteItem.ui.postedByLabel.text("<b>Requested By: </b>" + voteItem.postedBy);
      }
      if (voteItem.question) {

         voteItem.ui.questionLabel.text("<b>Question: </b>" + voteItem.question);
      }
      if (voteItem.advisorPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         if (pic) { pic = pic.scaled(25, 25); }
         if (pic) { voteItem.ui.advisorPictureLabel.pixmap(pic); }
      }
      if (voteItem.advisorName && voteItem.advisorResponse) {

         voteItem.ui.advisorReasonLabel.text(
            "<b>" +
            voteItem.advisorName +
            " (" +
            (voteItem.advisorTitle || "") +
            " ): </b>" +
            voteItem.advisorResponse);
      }
      if (voteItem.startTime !== undefined) {

         voteItem.ui.startTimeLabel.text(
            "<b>Started: </b>" +
            (voteItem.startTime ?
               toDate(voteItem.startTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      if (voteItem.endTime !== undefined) {

         voteItem.ui.endTimeLabel.text(
            "<b>Ended: </b>" +
            (voteItem.endTime ?
               toDate(voteItem.endTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
      }
      updateVotes(voteHandle);
      if (dmz.stance.isAllowed(hil, dmz.stance.CastVoteFlag) && !hasUserVoted(hil, voteItem.handle) &&
         !voteItem.expired) {

         voteItem.ui.buttonLayout.insertWidget(0, voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.insertWidget(1, voteItem.ui.noButton);
         if (!LoginSkipped) {

            voteItem.ui.yesButton.styleSheet(YES_BUTTON_STYLE);
            voteItem.ui.noButton.styleSheet(NO_BUTTON_STYLE);
            voteItem.ui.yesButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.handle, true);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
            voteItem.ui.noButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.handle, false);
               voteItem.ui.yesButton.hide();
               voteItem.ui.noButton.hide();
            });
         }
         else {

            voteItem.ui.yesButton.styleSheet(YES_BUTTON_STYLE);
            voteItem.ui.noButton.styleSheet(NO_BUTTON_STYLE);
         }
      }
      else {

         voteItem.ui.yesButton.hide();
         voteItem.ui.noButton.hide();
         voteItem.ui.buttonLayout.removeWidget(voteItem.ui.yesButton);
         voteItem.ui.buttonLayout.removeWidget(voteItem.ui.noButton);
      }
      updateTags(voteItem.handle);
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
      voteItem.ui.tagsLayout = voteItem.ui.postItem.lookup("tagsLayout");
      voteItem.ui.tagLabel = voteItem.ui.postItem.lookup("tagLabel");
      voteItem.ui.tagButton = voteItem.ui.postItem.lookup("tagButton");
      voteItem.ui.tagButton.styleSheet(dmz.stance.YELLOW_BUTTON);
      voteItem.ui.dtfButton = voteItem.ui.postItem.lookup("dtfButton");
      voteItem.ui.dtfButton.styleSheet(dmz.stance.YELLOW_BUTTON);
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
      voteItem.ui.dtfButton.observe(self, "clicked", function () {

         var numberOfDtfVotes = Groups[userGroupHandle].dtfVotes.length + 1;
         if (Groups[userGroupHandle] && Groups[userGroupHandle].dtfVotes) {

            voteItem.ui.dtfButton.hide();
            if (numberOfDtfVotes >= 1) {

               Groups[userGroupHandle].users.forEach(function (userHandle) {

                  dmz.stance.unlockAchievement(userHandle, dmz.stance.DisturbanceInTheForceOneAchievement);
               });
            }
            if (numberOfDtfVotes >= 2) {

               Groups[userGroupHandle].users.forEach(function (userHandle) {

                  dmz.stance.unlockAchievement(userHandle, dmz.stance.DisturbanceInTheForceTwoAchievement);
               });
            }
            if (numberOfDtfVotes >= 4) {

               Groups[userGroupHandle].users.forEach(function (userHandle) {

                  dmz.stance.unlockAchievement(userHandle, dmz.stance.DisturbanceInTheForceThreeAchievement);
               });
            }
            dmz.object.flag(voteItem.handle, dmz.stance.DisturbanceInTheForceHandle, true);
         }
      });
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

      if (voteArray[itor].handle === voteItem.handle) { result = itor; }
   }
   return result;
};

removeFromVotes = function (voteItem, pastState) {

   var voteItemIndex
     , voteArray
     ;

   if (voteItem.ui) {

      if (pastState === dmz.stance.VOTE_APPROVAL_PENDING) { voteArray = ApprovalVotes; }
      else if (pastState === dmz.stance.VOTE_ACTIVE) { voteArray = ActiveVotes; }
      else if ((pastState === dmz.stance.VOTE_YES) || (pastState === dmz.stance.VOTE_NO) ||
         (pastState === dmz.stance.VOTE_DENIED)) {

         voteArray = PastVotes;
      }
      if (pastState !== dmz.stance.VOTE_EXPIRED) {

         voteItemIndex = indexOfVote(voteItem, pastState);
         if (voteItemIndex !== -1) {

            voteArray.splice(voteItemIndex, 1);
            voteItem.ui.postItem.hide();
            contentLayout.removeWidget(voteItem.ui.postItem);
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

         if (voteItem.startTime) { newStartTime = voteItem.startTime; }
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

         if (voteItem.startTime) { newStartTime = voteItem.startTime; }
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

               insertedStartTime = voteArray[itor].startTime;
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
         if (index === -1) { insertIntoVotes(VoteObjects[key]); }
      }
   });
   updateLastSeen();
};

userVoted = function (userHandle, voteHandle, vote) {

   dmz.object.link(vote ? dmz.stance.YesHandle : dmz.stance.NoHandle, userHandle, voteHandle);
};

hasUserVoted = function (userHandle, voteHandle) {

   return dmz.object.linkHandle(dmz.stance.YesHandle, userHandle, voteHandle) ||
      dmz.object.linkHandle(dmz.stance.NoHandle, userHandle, voteHandle);
};

numberOfNonAdminUsers = function (groupHandle) {

   var userHandles = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle) || [];

   userHandles = userHandles.filter(function (userHandle) {

      return (dmz.stance.isAllowed(userHandle, dmz.stance.CastVoteFlag) && dmz.object.flag(userHandle, dmz.stance.ActiveHandle));
   });

   return userHandles.length;
};

createDecision = function (decisionValue, voteHandle, duration, reason) {

   dmz.object.text(voteHandle, dmz.stance.CommentHandle, reason);
   dmz.object.link(dmz.stance.ApprovedByHandle, voteHandle, dmz.object.hil());

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].createdByHandle, decisionValue) {

      dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle, 0);
      dmz.object.flag(voteHandle, dmz.stance.UpdateStartTimeHandle, true);
      dmz.object.timeStamp(voteHandle, dmz.stance.ExpiredTimeHandle, 0);
      dmz.object.flag(voteHandle, dmz.stance.UpdateExpiredTimeHandle, true);
      dmz.object.timeStamp(voteHandle, dmz.stance.EndedAtServerTimeHandle, 0);
      dmz.object.flag(voteHandle, dmz.stance.UpdateEndTimeHandle, false);
      duration *= 3600; //convert to unix seconds
      //duration *= 1;
      dmz.object.timeStamp(voteHandle, dmz.stance.DurationHandle, duration);
      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_ACTIVE);
      if (Advisors[VoteObjects[voteHandle].advisorHandle]) {

         Advisors[VoteObjects[voteHandle].advisorHandle].approvedVotes.push(voteHandle);
      }
      checkForApprovedVotes(VoteObjects[voteHandle].createdByHandle);
      checkForOnTheBallot(VoteObjects[voteHandle].groupHandle);
   }
   else {

      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_DENIED);
   }
};

isVoteOver = function (voteHandle) {

   var decisionData
     , yesVotes
     , noVotes
     , totalUsers = numberOfNonAdminUsers(userGroupHandle)
     , tempHandles
     , voteState
     , voteItem
     ;

   if ((totalUsers !== undefined) && voteHandle && VoteObjects[voteHandle] &&
      (userGroupHandle === VoteObjects[voteHandle].groupHandle)) {

      voteItem = VoteObjects[voteHandle];
      yesVotes = voteItem.yesVotes || 0;
      noVotes = voteItem.noVotes || 0;
      voteState = voteItem.state;

      if ((voteState !== dmz.stance.VOTE_NO) && (voteState !== dmz.stance.VOTE_YES) &&
         (voteState !== dmz.stance.VOTE_EXPIRED)) {

         if (yesVotes > (totalUsers / 2)) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
            dmz.object.flag(voteHandle, dmz.stance.UpdateEndTimeHandle, true);
         }
         if (noVotes >= (totalUsers / 2)) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
            dmz.object.flag(voteHandle, dmz.stance.UpdateEndTimeHandle, true);
         }
      }
      else if (voteHandle && (voteState === dmz.stance.VOTE_EXPIRED) && !LoginSkipped) {

         var newState;

         if (noVotes >= yesVotes) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
            dmz.object.flag(voteHandle, dmz.stance.UpdateEndTimeHandle, false);
            dmz.object.timeStamp(
               voteHandle,
               dmz.stance.EndedAtServerTimeHandle,
               dmz.object.timeStamp(voteHandle, dmz.stance.ExpiredTimeHandle));
            newState = dmz.stance.VOTE_NO;
         }
         else if (yesVotes > noVotes) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
            dmz.object.flag(voteHandle, dmz.stance.UpdateEndTimeHandle, false);
            dmz.object.timeStamp(
               voteHandle,
               dmz.stance.EndedAtServerTimeHandle,
               dmz.object.timeStamp(voteHandle, dmz.stance.ExpiredTimeHandle));
            newState = dmz.stance.VOTE_YES;
         }
         if (SEND_MAIL && newState && voteItem.groupHandle) {

            EmailMod.sendVoteEmail(VoteObjects[voteHandle], newState);
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
            voteItem.endTime && (voteItem.endTime > latestTime)) {

            latestTime = voteItem.endTime;
         }
         else if (((voteItem.state === dmz.stance.VOTE_DENIED) || (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING)) &&
            voteItem.postedTime && (voteItem.postedTime > latestTime)) {

            latestTime = voteItem.postedTime;
         }
         else if ((voteItem.state === dmz.stance.VOTE_ACTIVE) && voteItem.startTime &&
            (voteItem.startTime > latestTime)) {

            latestTime = voteItem.startTime;
         }
      }
      if (latestTime) { dmz.stance.userAttribute(hil, dmz.stance.VoteTimeHandle, latestTime); }
   });
};

checkForNotifications = function () {

   var lastUserTime = dmz.stance.userAttribute(hil, dmz.stance.VoteTimeHandle)
     , voteItem
     , lastVoteTime = 0
     ;

   if (lastUserTime === undefined) { lastUserTime = 0; }
   Object.keys(VoteObjects).forEach(function (key) {

      voteItem = VoteObjects[key];
      if (voteItem.groupHandle && (voteItem.groupHandle === userGroupHandle) &&
         (voteItem.state !== undefined) && (lastUserTime !== undefined)) {

         if (((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) &&
            voteItem.endTime && (voteItem.endTime > lastVoteTime)) {

            lastVoteTime = voteItem.endTime;
         }
         else if (((voteItem.state === dmz.stance.VOTE_DENIED) || (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING)) &&
            voteItem.postedTime && (voteItem.postedTime > lastVoteTime)) {

            lastVoteTime = voteItem.postedTime;
         }
         else if ((voteItem.state === dmz.stance.VOTE_ACTIVE) && voteItem.startTime &&
            (voteItem.startTime > lastVoteTime)) {

            lastVoteTime = voteItem.startTime;
         }
      }
      if (lastVoteTime > lastUserTime) { MainModule.highlight("Vote"); }
   });
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      dmz.time.setTimer(self, function () {

         hil = objHandle;
         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         Object.keys(VoteObjects).forEach(function (key) {

            isVoteOver(VoteObjects[key].handle);
         });
         if (dmz.stance.isAllowed(hil, dmz.stance.SwitchGroupFlag)) {

            clearLayout();
            PastVotes = [];
            ApprovalVotes = [];
            ActiveVotes = [];
            Object.keys(VoteObjects).forEach(function (key) {

               if (VoteObjects[key].ui) { delete VoteObjects[key].ui; }
            });
         }
         checkForNotifications();
      });
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.VoteType)) {

      VoteObjects[objHandle] = { handle: objHandle, dtf: false };
   }
   if (objType.isOfType(dmz.stance.UserType)) {

      Users[objHandle] =
         { handle: objHandle
         , yesVotes: []
         , noVotes: []
         , votesCreated: []
         };
   }
   if (objType.isOfType(dmz.stance.AdvisorType)) {

      Advisors[objHandle] =
         { handle: objHandle
         , approvedVotes: []
         }
   }
   if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] =
         { handle: objHandle
         , users: []
         , yesVotes: []
         , noVotes: []
         , dtfVotes: []
         }
   }
});

dmz.object.flag.observe(self, dmz.stance.ExpiredHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].expired = newVal;
   }
});

dmz.object.flag.observe(self, dmz.stance.DisturbanceInTheForceHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].dtf = newVal;
      dmz.time.setTimer(self, function () {

         if (VoteObjects[objHandle].groupHandle && Groups[VoteObjects[objHandle].groupHandle] &&
            newVal) {

            Groups[VoteObjects[objHandle].groupHandle].dtfVotes.push(objHandle);
         }
      });
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].question = newVal;
   }
});

dmz.object.text.observe(self, dmz.stance.CommentHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].advisorResponse = newVal;
   }
});

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].state = newVal;
      dmz.time.setTimer(self, function () {

         if (newVal === dmz.stance.VOTE_EXPIRED) { isVoteOver(objHandle); }
         else if (newVal === dmz.stance.VOTE_YES &&
            VoteObjects[objHandle].groupHandle &&
            Groups[VoteObjects[objHandle].groupHandle]) {

            Groups[VoteObjects[objHandle].groupHandle].yesVotes.push(objHandle);
         }
         else if (newVal === dmz.stance.VOTE_NO &&
            VoteObjects[objHandle].groupHandle &&
            Groups[VoteObjects[objHandle].groupHandle]) {

            Groups[VoteObjects[objHandle].groupHandle].noVotes.push(objHandle);
         }
         updateStateUI(objHandle, prevVal);
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.PostedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].postedTime = newVal;
      dmz.time.setTimer(self, function () {

         updatePostedTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].startTime = newVal;
      dmz.time.setTimer(self, function () {

         updateStartTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].endTime = newVal;
      dmz.time.setTimer(self, function () {

         updateEndTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.ExpiredTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].expiredTime = newVal;
      dmz.time.setTimer(self, function () {

         updateExpiredTime(objHandle);
         checkForNotifications();
      });
   }
});

dmz.object.data.observe(self, dmz.stance.TagHandle,
function (objHandle, attrHandle, data) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].tags = dmz.stance.getTags(data);
      dmz.time.setTimer(self, function () { updateTags(objHandle); });
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
         if (Advisors[subHandle] && (VoteObjects[supHandle].state === dmz.stance.VOTE_ACTIVE) ||
            (VoteObjects[supHandle].state === dmz.stance.VOTE_YES) ||
            (VoteObjects[supHandle].state === dmz.stance.VOTE_NO)) {

            Advisors[subHandle].approvedVotes.push(supHandle);
         }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.OriginalGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Users[supHandle]) {

      Users[supHandle].groupHandle = subHandle;
      dmz.time.setTimer(self, function () {

         if (Groups[subHandle]) { Groups[subHandle].users.push(supHandle); }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      dmz.time.setTimer(self, function () {

         VoteObjects[supHandle].createdByHandle = subHandle;
         VoteObjects[supHandle].userPicture = dmz.object.text(subHandle, dmz.stance.PictureHandle);
         VoteObjects[supHandle].postedBy = dmz.stance.getDisplayName(subHandle);
         if (Users[subHandle]) { Users[subHandle].votesCreated.push(supHandle); }
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

   if (VoteObjects[subHandle]) {

      VoteObjects[subHandle].noVotes = (VoteObjects[subHandle].noVotes || 0) + 1;
      dmz.time.setTimer(self, function () {

         if (Users[supHandle]) { Users[supHandle].noVotes.push(subHandle); }
         checkForVoteAchievement(supHandle);
         updateVotes(subHandle);
         isVoteOver(subHandle);
      });
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[subHandle]) {

      VoteObjects[subHandle].yesVotes = (VoteObjects[subHandle].yesVotes || 0) + 1;
      dmz.time.setTimer(self, function () {

         if (Users[supHandle]) { Users[supHandle].yesVotes.push(subHandle); }
         checkForVoteAchievement(supHandle);
         checkForStrategistAchievement(VoteObjects[subHandle].groupHandle);
         updateVotes(subHandle);
         isVoteOver(subHandle);
      });
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Advisors[supHandle]) { Advisors[supHandle].groupHandle = subHandle };
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
