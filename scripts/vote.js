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
   , openedOnce = false
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
      /* VoteObject =
            { handle: handle
            , createdBy: userName
            , startTime: time
            , endTime: time
            , duration: time
            , question: text
            , status: statusConst
            , advisorReason: text
            , decisionHandle: handle
            , postItem: postItem
            , yesButton: button
            , noButton: button
            }
      */
   , VoteObjects = []
   , DecisionObjects = []

   , AllVotes = []
   , PastVotes = []
   , ApprovalVotes = []
   , ActiveVotes = []
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))

   // Functions
   , insertItems
   , populateAllVotes
   , setItemLabels
   , isCompleteItem
   , populateSubLists
   , isVoteOver
   , resetLayout
   , userVoted
   , hasUserVoted
   , createDecisionObject
   , numberOfNonAdminUsers
   , updateLastSeen
   , highlightNew
   , init
   ;

resetLayout = function () {

   var widget;

   if (formContent && contentLayout) {

      widget = contentLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = contentLayout.takeAt(0);
      };
      contentLayout.addStretch(1);
   }
};

insertItems = function () {

   var itor = 0;

   updateLastSeen();
   populateAllVotes();
   populateSubLists();
   resetLayout();

   PastVotes.sort(function (obj1, obj2) {

      var startTime1
        , startTime2
        , result
        , returnVal
        ;
      if (obj1.state === dmz.stance.VOTE_DENIED) { startTime1 = obj1.postedTime; }
      else { startTime1 = obj1.startTime; }
      if (obj2.state === dmz.stance.VOTE_DENIED) { startTime2 = obj2.postedTime; }
      else { startTime2 = obj2.startTime; }

      result = startTime2 - startTime1;
      returnVal = result ? result : 0;
      if (startTime1 === 0) {

         returnVal = -1;
      }
      else if (startTime2 === 0) {

         returnVal = 1;
      }

      return returnVal;
   });

   ApprovalVotes.forEach(function (voteItem) {

      voteItem.postItem.show();
      contentLayout.insertWidget(itor, voteItem.postItem);
      itor += 1;
   });
   ActiveVotes.forEach(function (voteItem) {

      voteItem.postItem.show();
      contentLayout.insertWidget(itor, voteItem.postItem);
      itor += 1;
   });
   PastVotes.forEach(function (voteItem) {

      voteItem.postItem.show();
      contentLayout.insertWidget(itor, voteItem.postItem);
      itor += 1;
   });
};

populateAllVotes = function () {

   var userGroupHandle = dmz.stance.getUserGroupHandle(dmz.object.hil());

   VoteObjects.forEach(function (voteObject) {

      var voteItem = {}
        , decisionObject
        ;

      if (voteObject.userHandle &&
         (dmz.stance.getUserGroupHandle(voteObject.userHandle) === userGroupHandle)) {

         if (!voteItem.handle) { voteItem.handle = voteObject.handle; }
         if (!voteItem.userHandle) { voteItem.userHandle = voteObject.userHandle; }
         if (!voteItem.userPicture) {

            voteItem.userPicture = dmz.object.text(voteObject.userHandle, dmz.stance.PictureHandle);
         }
         if (!voteItem.postedBy) { voteItem.postedBy = dmz.stance.getDisplayName(voteObject.userHandle); }
         if (!voteItem.groupHandle) {

            voteItem.groupHandle = dmz.stance.getUserGroupHandle(voteObject.userHandle);
         }
         voteItem.state = voteObject.state;
         voteItem.question = voteObject.question;
         voteItem.postedTime = voteObject.postedTime;

         if (!voteItem.advisorHandle) {

            voteItem.advisorHandle = voteObject.advisorHandle;
            voteItem.advisorPicture = dmz.object.text(voteObject.advisorHandle, dmz.stance.PictureHandle);
         }
         if (voteObject.decisionHandle) {

            decisionObject = DecisionObjects[voteObject.decisionHandle];
            voteItem.decisionHandle = voteObject.decisionHandle;
            if (decisionObject) {

               voteItem.startTime = decisionObject.startTime;
               voteItem.endTime = decisionObject.endTime;

               if (!voteItem.advisorReason) {  voteItem.advisorReason = decisionObject.advisorReason; }
               voteItem.yesVotes = decisionObject.yesVotes || 0;
               voteItem.noVotes = decisionObject.noVotes || 0;
            }
         }

         if (isCompleteItem(voteItem) && !AllVotes[voteItem.handle]) {

            AllVotes[voteItem.handle] = voteItem;
         }
      }
   });
};

setItemLabels = function (voteItem) {

   var pic
     , hil = dmz.object.hil()
     ;

   if (voteItem) {

      if (!voteItem.postItem) {

         voteItem.postItem = dmz.ui.loader.load("VoteViewPost.ui");
         voteItem.userPictureLabel = voteItem.postItem.lookup("userPictureLabel");
         voteItem.postedByLabel = voteItem.postItem.lookup("postedByLabel");
         voteItem.startTimeLabel = voteItem.postItem.lookup("startTimeLabel");
         voteItem.endTimeLabel = voteItem.postItem.lookup("endTimeLabel");
         voteItem.questionLabel = voteItem.postItem.lookup("questionLabel");
         voteItem.stateLabel = voteItem.postItem.lookup("stateLabel");
         voteItem.yesVotesLabel = voteItem.postItem.lookup("yesVotesLabel");
         voteItem.noVotesLabel = voteItem.postItem.lookup("noVotesLabel");
         voteItem.undecidedVotesLabel = voteItem.postItem.lookup("undecidedVotesLabel");
         voteItem.advisorPictureLabel = voteItem.postItem.lookup("advisorPictureLabel");
         voteItem.advisorReasonLabel = voteItem.postItem.lookup("advisorReasonLabel");
         voteItem.yesButton = dmz.ui.button.createPushButton("Approve");
         voteItem.noButton = dmz.ui.button.createPushButton("Deny");
         voteItem.buttonLayout = voteItem.postItem.lookup("buttonLayout");
         voteItem.textLayout = voteItem.postItem.lookup("textLayout");
         voteItem.timeBox = dmz.ui.spinBox.createSpinBox("timeBox");
         voteItem.timeBox.minimum(24);
         voteItem.timeBox.maximum(72);
         voteItem.timeBox.setSingleStep(24);
         voteItem.timeBox.setSuffix("hrs");
         voteItem.timeBoxLabel = dmz.ui.label.create("<b>Duration: </b>");
         voteItem.timeBoxLabel.sizePolicy(8, 0);
         voteItem.decisionReason = dmz.ui.textEdit.create("");
         voteItem.decisionReason.fixedSize(750, 100);
         voteItem.decisionReasonLabel = dmz.ui.label.create("<b>Decision Reason:</b>");
      }
      if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) {

         if (voteItem.state === dmz.stance.VOTE_NO) {

            voteItem.postItem.setStyleSheet("* { background-color: rgb(240, 70, 70); }")
         }
         else {

            voteItem.postItem.setStyleSheet("* { background-color: rgb(70, 240, 70); }")
         }
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.userPictureLabel.pixmap(pic);
         voteItem.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
         voteItem.startTimeLabel.text("<b>Start Time: </b>" + voteItem.startTime);
         voteItem.endTimeLabel.text("<b>End Time: </b>" + voteItem.endTime);
         voteItem.questionLabel.text("<b>Question: </b>" + voteItem.question);
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
         voteItem.noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
         voteItem.undecidedVotesLabel.text("<b>Undecided Votes: </b>" +
            (numberOfNonAdminUsers(voteItem.groupHandle) - (voteItem.yesVotes + voteItem.noVotes)));
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.advisorPictureLabel.pixmap(pic);
         voteItem.advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
      }
      else if (voteItem.state === dmz.stance.VOTE_DENIED) {

         voteItem.postItem.setStyleSheet("* { background-color: rgb(70, 70, 70); color: white; }")
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.userPictureLabel.pixmap(pic);
         voteItem.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
         voteItem.startTimeLabel.text("<b>Posted At: </b>" + voteItem.postedTime);
         voteItem.questionLabel.text("<b>Qustion: </b>" + voteItem.question);
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.advisorPictureLabel.pixmap(pic);
         voteItem.advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
         voteItem.endTimeLabel.text("");
         voteItem.yesVotesLabel.text("");
         voteItem.noVotesLabel.text("");
         voteItem.undecidedVotesLabel.text("");
      }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         voteItem.postItem.setStyleSheet("* { background-color: rgb(240, 240, 240); }")
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.userPictureLabel.pixmap(pic);
         voteItem.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
         voteItem.startTimeLabel.text("<b>Posted Time: </b>" + voteItem.postedTime);
         voteItem.questionLabel.text("<b>Question: </b>" + voteItem.question);
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.yesVotesLabel.text("");
         voteItem.noVotesLabel.text("");
         voteItem.undecidedVotesLabel.text("");
         voteItem.endTimeLabel.text("");
         voteItem.advisorReasonLabel.text("");

         if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

            voteItem.buttonLayout.insertWidget(0, voteItem.yesButton);
            voteItem.buttonLayout.insertWidget(1, voteItem.noButton);
            voteItem.buttonLayout.insertWidget(2, voteItem.timeBoxLabel);
            voteItem.buttonLayout.insertWidget(3, voteItem.timeBox);
            voteItem.textLayout.insertWidget(0, voteItem.decisionReasonLabel);
            voteItem.textLayout.insertWidget(1, voteItem.decisionReason);

            voteItem.yesButton.observe(self, "clicked", function () {

               createDecisionObject(true, voteItem.handle, voteItem.timeBox.value(), voteItem.decisionReason.text() || "Okay.");
            });
            voteItem.noButton.observe(self, "clicked", function () {

               createDecisionObject(false, voteItem.handle, voteItem.timeBox.value(), voteItem.decisionReason.text() || "No.");
            });
         }
      }
      else if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

         voteItem.postItem.setStyleSheet("* { background-color: rgb(240, 240, 70); }")
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.userPictureLabel.pixmap(pic);
         voteItem.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
         voteItem.startTimeLabel.text("<b>Start Time: </b>" + voteItem.startTime);
         voteItem.endTimeLabel.text("<b>End Time: </b>" + voteItem.endTime);
         voteItem.questionLabel.text("<b>Question: </b>" + voteItem.question);
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
         voteItem.noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
         voteItem.undecidedVotesLabel.text("<b>Undecided Votes: </b>" +
            (numberOfNonAdminUsers(voteItem.groupHandle) - (voteItem.yesVotes + voteItem.noVotes)));
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
         pic = pic.scaled(25, 25);
         voteItem.advisorPictureLabel.pixmap(pic);
         voteItem.advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);

         if (!hasUserVoted(hil, voteItem.decisionHandle) &&
            !dmz.object.flag(hil, dmz.stance.AdminHandle)) {

            voteItem.buttonLayout.insertWidget(0, voteItem.yesButton);
            voteItem.buttonLayout.insertWidget(1, voteItem.noButton);
            voteItem.yesButton.setStyleSheet("* { background-color: rgb(70, 240, 70); }");
            voteItem.noButton.setStyleSheet("* { background-color: rgb(240, 70, 70); }");

            voteItem.yesButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.decisionHandle, true);
            });
            voteItem.noButton.observe(self, "clicked", function () {

               userVoted(dmz.object.hil(), voteItem.decisionHandle, false);
            });
         }
      }
   }
};

isCompleteItem = function (voteItem) {

   var completeFlag = false;

   if (voteItem.userPicture && voteItem.postedBy && voteItem.question &&
      (voteItem.state !== undefined)) {

      if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES) ||
         (voteItem.state === dmz.stance.VOTE_ACTIVE)) {

         if (voteItem.startTime && voteItem.endTime && (voteItem.yesVotes !== undefined) &&
            (voteItem.noVotes !== undefined) && voteItem.advisorReason && voteItem.advisorPicture) {

            completeFlag = true;
         }
      }
      else if (voteItem.state === dmz.stance.VOTE_DENIED) {

         if (voteItem.postedTime && voteItem.advisorReason && voteItem.advisorPicture) {

            completeFlag = true;
         }
      }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         if (voteItem.postedTime) {

            completeFlag = true;
         }
      }
   }
   return completeFlag;
};

populateSubLists = function () {

   var hil = dmz.object.hil()
     , groupHandle = dmz.stance.getUserGroupHandle(hil)
     ;

   PastVotes = [];
   ActiveVotes = [];
   ApprovalVotes = [];
   AllVotes.forEach(function (voteItem) {

      setItemLabels(voteItem);

      if ((voteItem.state === dmz.stance.VOTE_YES) || (voteItem.state === dmz.stance.VOTE_NO) ||
         (voteItem.state === dmz.stance.VOTE_DENIED)) {

         PastVotes.push(voteItem);
      }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         ApprovalVotes.push(voteItem);
      }
      else if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

         ActiveVotes.push(voteItem);
      }
   });
};

isVoteOver = function (decisionHandle) {

   var decisionData = DecisionObjects[decisionHandle]
     , yesVotes
     , noVotes
     , totalUsers = numberOfNonAdminUsers(dmz.stance.getUserGroupHandle(dmz.object.hil()))
     , voteHandle
     ;

   if (decisionData) {

      yesVotes = decisionData.yesVotes || 0;
      noVotes = decisionData.noVotes || 0;
      voteHandle = decisionData.voteHandle;

      if (voteHandle) {

         if (yesVotes > (totalUsers / 2)) {

				dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
				dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
			}
			else if (noVotes >= (totalUsers / 2)) {

				dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
				dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
			}
		}
	}
};

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].state = newVal;
   }
   if (AllVotes[objHandle]) { AllVotes.splice(objHandle, 1); }
   insertItems();
   if (dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle) ||
      (newVal !== dmz.stance.VOTE_APPROVAL_PENDING)) {

      MainModule.highlight("Vote");
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var lastUserTime = dmz.stance.userAttribute(objHandle, dmz.stance.VoteTimeHandle)
     , lastVoteTime = 0
     , adminHandle = dmz.object.flag(objHandle, dmz.stance.AdminHandle);
     ;

   PastVotes.forEach(function (voteItem) {

      if (voteItem.state) {

         if (voteItem.state !== dmz.stance.VOTE_DENIED) {

            if ((voteItem.endTime !== undefined) && (voteItem.endTime > lastUserTime)) {

               MainModule.highlight("Vote");
            }
         }
         else {

            if (voteItem.startTime > lastUserTime) { MainModule.highlight("Vote"); }
         }
      }
   });

   if ((adminHandle) && ApprovalVotes.length) { MainModule.highlight("Vote"); }

   ActiveVotes.forEach(function (voteItem) {

      if ((voteItem.startTime !== undefined) && (voteItem.startTime > lastUserTime)) {

         MainModule.highlight("Vote");
      }
   });
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].question = newVal;
   }
   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].advisorReason = newVal;
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].postedTime = newVal;
      insertItems();
      if (newVal > dmz.stance.userAttribute(dmz.object.hil(), dmz.stance.VoteTimeHandle)) {

         MainModule.highlight("Vote");
      }
   }
   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].startTime = newVal;
      insertItems();
      if (newVal > dmz.stance.userAttribute(dmz.object.hil(), dmz.stance.VoteTimeHandle)) {

         MainModule.highlight("Vote");
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].endTime = newVal;
      insertItems();
   }
});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      VoteObjects[supHandle].advisorHandle = subHandle;
   }
   if (DecisionObjects[supHandle]) {

      DecisionObjects[supHandle].voteHandle = subHandle;
      if (VoteObjects[subHandle]) {

         VoteObjects[subHandle].decisionHandle = supHandle;
      }
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      VoteObjects[supHandle].userHandle = subHandle;
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var voteHandles
     , voteHandle
     ;

   if (!DecisionObjects[subHandle]) {

      DecisionObjects[subHandle] = {yesVotes: 1};
      isVoteOver(subHandle);
      insertItems();
   }
   else {

      DecisionObjects[subHandle].yesVotes = (DecisionObjects[subHandle].yesVotes || 0) + 1;
      isVoteOver(subHandle);
      insertItems();
   }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var voteHandles
     , voteHandle
     ;

   if (!DecisionObjects[subHandle]) {

      DecisionObjects[subHandle] = { noVotes: 1 };
      isVoteOver(subHandle);
      insertItems();
   }
   else {

      DecisionObjects[subHandle].yesVotes = (DecisionObjects[subHandle].noVotes || 0) + 1;
      isVoteOver(subHandle);
      insertItems();
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.VoteType)) {

      VoteObjects[objHandle] = { handle: objHandle};
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      DecisionObjects[objHandle] = { handle: objHandle};
   }
});

userVoted = function (userHandle, decisionHandle, vote) {

   dmz.object.link(vote ? dmz.stance.YesHandle : dmz.stance.NoHandle, userHandle, decisionHandle);
};

hasUserVoted = function (userHandle, decisionHandle) {

   return dmz.object.linkHandle(dmz.stance.YesHandle, userHandle, decisionHandle) ||
      dmz.object.linkHandle(dmz.stance.NoHandle, userHandle, decisionHandle);
};

createDecisionObject = function (decisionValue, voteHandle, duration, reason) {

   var decision = dmz.object.create(dmz.stance.DecisionType);

   dmz.object.activate(decision);
   dmz.object.link(dmz.stance.VoteLinkHandle, decision, voteHandle);
   dmz.object.timeStamp(decision, dmz.stance.CreatedAtServerTimeHandle, 0);
   dmz.object.flag(decision, dmz.stance.UpdateStartTimeHandle, true);
   dmz.object.text(decision, dmz.stance.TextHandle, reason);
   dmz.object.link(dmz.stance.CreatedByHandle, decision, dmz.object.hil());

   if (decisionValue) {

      dmz.object.timeStamp(decision, dmz.stance.EndedAtServerTimeHandle, 0);
      dmz.object.flag(decision, dmz.stance.UpdateEndTimeHandle, true);
      duration *= 3600; //convert to unix seconds
      dmz.object.timeStamp(decision, dmz.stance.DurationHandle, duration);
      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_ACTIVE);
   }
   else {

      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_DENIED);
   }
};

numberOfNonAdminUsers = function (groupHandle) {

   var userHandles = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle) || [];

   userHandles = userHandles.filter(function (userHandle) {

      return !dmz.object.flag(userHandle, dmz.stance.AdminHandle);
   });

   return userHandles.length;
};

updateLastSeen = function () {

   var latestTime = 0;

   PastVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestTime) { latestTime = voteItem.startTime; }
   });
   ActiveVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestTime) { latestTime = voteItem.startTime; }
   });
   ApprovalVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestTime) { latestTime = voteItem.startTime; }
   });

   dmz.stance.userAttribute(dmz.object.hil(), dmz.stance.VoteTimeHandle, latestTime);
};

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Vote", voteForm, insertItems);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();
