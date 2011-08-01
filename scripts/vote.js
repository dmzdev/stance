require("datejs/date");

var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , spinBox: require("dmz/ui/spinBox")
      , consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
      , label: require("dmz/ui/label")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , phonon: require("dmz/ui/phonon")
      , treeWidget: require("dmz/ui/treeWidget")
      , textEdit: require("dmz/ui/textEdit")
      , webview: require("dmz/ui/webView")
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
   , scrollArea= voteForm.lookup("scrollArea")
   , content = scrollArea.widget()
   , myLayout = dmz.ui.layout.createVBoxLayout()

   // Variables
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
   , PastVotes = []
   , ApprovalVotes = []
   , ActiveVotes = []
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
   // Functions
   , toDate = dmz.util.timeStampToDate
   , pushVote
   , refreshView
   , isCompleteNewVote
   , voteLinkChanged
   , isObjectInMap
   , removeFromMaps
   , updateFields
   , linkHandleFilter
   , attrHandleFilter
   , voteObserveFunction
   , newObjectLinkFunction
   , userVoted
   , hasUserVoted
   , createDecisionObject
   , resetLayout
   , numberOfNonAdminUsers
   , init
   ;

pushVote = function (voteHandle) {

   var status = dmz.object.scalar(voteHandle, dmz.stance.VoteState)
     , postedByHandle
     , postedBy
     , question = dmz.object.text(voteHandle, dmz.stance.TextHandle)
     , groupHandle
     , tempHandles
     , tempVariable
     , advisorHandle
     , advisorAvatar
     , userAvatar
     , postItem = dmz.ui.loader.load("VoteViewPost.ui")
     , startTime
     , endTime
     , yesVotes
     , noVotes
     , undecidedVotes
     , advisorReason
     , yesButton
     , noButton
     , buttonLayout
     , decisionHandle
     , textLayout
     , timeBox
     , timeBoxLabel
     , decisionReason
     , decisionReasonLabel
     , postedTime
     ;

   // the return statement errors only appear once for each user, TODO find what callback
   // causes it
   tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
   if (!tempHandles) { self.log.error("pushVote: Error, no createdBy object"); return ;}
   postedByHandle = tempHandles[0];
   postedBy = dmz.object.text(postedByHandle, dmz.stance.DisplayNameHandle);
   userAvatar = dmz.object.text(postedByHandle, dmz.stance.PictureHandle);

   tempHandles = dmz.object.subLinks(postedByHandle, dmz.stance.GroupMembersHandle);
   if (!tempHandles) { self.log.error("pushVote: Error, vote creator has no group"); return; }
   groupHandle = tempHandles[0];

   tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.VoteLinkHandle);
   if (!tempHandles) { self.log.error("pushVote: Error, vote has no advisor"); return; }
   advisorHandle = tempHandles[0];

   advisorAvatar = dmz.object.text(advisorHandle, dmz.stance.PictureHandle);

   if (status === dmz.stance.VOTE_YES || status === dmz.stance.VOTE_NO) {

      if (status === dmz.stance.VOTE_YES) {

         postItem.setStyleSheet("* { background-color: rgb(90, 230, 90); border-width: 5px; }");
      }
      else if (status === dmz.stance.VOTE_NO) {

         postItem.setStyleSheet("* { background-color: rgb(230, 90, 90); border-width: 5px; }");
      }

      tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
      if (!tempHandles) { self.log.error("pushVote: Error, no decision object"); return;}
      decisionHandle = tempHandles[0];
      startTime = dmz.object.timeStamp(decisionHandle, dmz.stance.CreatedAtServerTimeHandle);
      endTime = dmz.object.timeStamp(decisionHandle, dmz.stance.EndedAtServerTimeHandle);
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
      yesVotes = tempHandles.length;
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
      noVotes = tempHandles.length;
      tempVariable = numberOfNonAdminUsers(groupHandle);
      undecidedVotes = tempVariable - yesVotes - noVotes;
      advisorReason = dmz.object.text(decisionHandle, dmz.stance.TextHandle);

      PastVotes.push (
            { handle:voteHandle
            , userAvatar: userAvatar
            , postedBy: postedBy
            , startTime: startTime
            , endTime: endTime
            , question: question
            , status: status
            , yesVotes: yesVotes
            , noVotes: noVotes
            , undecidedVotes: undecidedVotes
            , advisorAvatar: advisorAvatar
            , advisorReason: advisorReason
            , postItem: postItem
            , groupHandle: groupHandle
            });

      /*
      ApprovalVotes.forEach(function (vote) {

         self.log.error("\n");
         self.log.error(vote.handle);
         self.log.error(vote.userAvatar);
         self.log.error(vote.postedBy);
         self.log.error(vote.startTime);
         self.log.error(vote.endTime);
         self.log.error(vote.question);
         self.log.error(vote.status);
         self.log.error(vote.yesVotes);
         self.log.error(vote.noVotes);
         self.log.error(vote.undecidedVotes);
         self.log.error(vote.advisorAvatar);
         self.log.error(vote.advisorReason);
         self.log.error(vote.postItem);
         self.log.error(vote.groupHandle);
         self.log.error("\n");
      });
      */

   } else if (status === dmz.stance.VOTE_DENIED) {

      postItem.setStyleSheet("* { background-color: rgb(20, 20, 20); border-width: 5px; color: white; }");
      postedTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);

      tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
      if (!tempHandles) { self.log.error("pushVote: Error, no decision object"); return;}
      decisionHandle = tempHandles[0];

      advisorReason = dmz.object.text(decisionHandle, dmz.stance.TextHandle);

      PastVotes.push (
            { handle: voteHandle
            , userAvatar: userAvatar
            , postedBy: postedBy
            , postedTime: postedTime
            , question: question
            , status: status
            , advisorAvatar: advisorAvatar
            , advisorReason: advisorReason
            , postItem: postItem
            , groupHandle: groupHandle
            });

   } else if (status === dmz.stance.VOTE_APPROVAL_PENDING) {

      yesButton = dmz.ui.button.createPushButton("Approve");
      noButton = dmz.ui.button.createPushButton("Deny");
      buttonLayout = postItem.lookup("buttonLayout");
      textLayout = postItem.lookup("textLayout");
      timeBox = dmz.ui.spinBox.createSpinBox("timeBox");
      timeBoxLabel = dmz.ui.label.create("timeBoxLabel");
      decisionReason = dmz.ui.textEdit.create("decisionReason");
      decisionReasonLabel = dmz.ui.label.create("decisionReasonLabel");

      postItem.setStyleSheet("* { background-color: rgb(230, 230, 230); border-width: 5px; }");
      buttonLayout.insertWidget(0, yesButton);
      buttonLayout.insertWidget(1, noButton);
      buttonLayout.insertWidget(2, timeBoxLabel);
      buttonLayout.insertWidget(3, timeBox);
      textLayout.insertWidget(0, decisionReasonLabel);
      textLayout.insertWidget(1, decisionReason);

      yesButton.observe(self, "clicked", function () {

         createDecisionObject(true, voteHandle, timeBox.value(), decisionReason.text());
         refreshView();
      });
      noButton.observe(self,"clicked", function () {

         createDecisionObject(false, voteHandle, timeBox.value(), decisionReason.text());
         refreshView();
      });

      postedTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);

      ApprovalVotes.push (
            { handle: voteHandle
            , userAvatar: userAvatar
            , postedBy: postedBy
            , postedTime: postedTime
            , question: question
            , status: status
            , postItem: postItem
            , groupHandle: groupHandle
            });

   } else if (status === dmz.stance.VOTE_ACTIVE) {

      yesButton = dmz.ui.button.createPushButton("Approve");
      noButton = dmz.ui.button.createPushButton("Deny");
      buttonLayout = postItem.lookup("buttonLayout");

      tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
      if (!tempHandles) { self.log.error("pushVote: Error, no decision object"); return;}
      decisionHandle = tempHandles[0];
      advisorReason = dmz.object.text(decisionHandle, dmz.object.TextHandle);

      if (!hasUserVoted(dmz.object.hil(), decisionHandle)) {

         buttonLayout.insertWidget(0, yesButton);
         buttonLayout.insertWidget(1, noButton);
         yesButton.observe(self, "clicked", function () {

            userVoted(dmz.object.hil(), decisionHandle, true);
         });
         noButton.observe(self, "clicked", function () {

            userVoted(dmz.object.hil(), decisionHandle, false);
         });
      }

      postItem.setStyleSheet("* { background-color: rgb(200, 200, 40); border-width: 5px; }");

      startTime = dmz.object.timeStamp(decisionHandle, dmz.object.CreatedAtServerTimeHandle);
      endTime = dmz.object.timeStamp(decisionHandle, dmz.object.EndedAtServerTimeHandle);
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.object.YesHandle) || [];
      yesVotes = tempHandles.length;
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.object.NoHandle) || [];
      noVotes = tempHandles.length;
      tempVariable = numberOfNonAdminUsers(groupHandle);
      undecidedVotes = tempVariable - yesVotes - noVotes;

      ActiveVotes.push (
            { handle:voteHandle
            , userAvatar: userAvatar
            , postedBy: postedBy
            , startTime: startTime
            , endTime: endTime
            , question: question
            , status: status
            , yesVotes: yesVotes
            , noVotes: noVotes
            , undecidedVotes: undecidedVotes
            , advisorAvatar: advisorAvatar
            , advisorReason: advisorReason
            , postItem: postItem
            , groupHandle: groupHandle
            });
   }
};

resetLayout = function () {

   var widget;
   if (content) {

      widget = myLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = myLayout.takeAt(0);
      };
   }
   myLayout.addStretch(1);


   /*if (content) {

      ApprovalVotes.forEach(function (voteItem) {

         voteItem.postItem.hide();
         myLayout.removeWidget(voteItem.postItem);
      });
      ActiveVotes.forEach(function (voteItem) {

         voteItem.postItem.hide();
         myLayout.removeWidget(voteItem.postItem);
      });
      PastVotes.forEach(function (voteItem) {

         voteItem.postItem.hide();
         myLayout.removeWidget(voteItem.postItem);
      });
   }
   */
};

refreshView = function () {

   var hil = dmz.object.hil()
     , adminFlag = dmz.object.flag(hil, dmz.stance.AdminHandle)
     , avatarLabel
     , postedByLabel
     , startTimeLabel
     , endTimeLabel
     , statusLabel
     , yesVotesLabel
     , noVotesLabel
     , undecidedVotesLabel
     , advisorAvatarLabel
     , advisorReasonLabel
     , decisionReasonText
     , yesButton
     , noButton
     , durationSpinBox
     , postItem
     , setLabels
     , setGlobalLabels
     , questionLabel
     , itor = 0
     , status
     ;

   resetLayout();
   setLabels = function (postItem, voteItem) {

      avatarLabel = postItem.lookup("avatarLabel");
      postedByLabel = postItem.lookup("postedBy");
      startTimeLabel = postItem.lookup("startTime");
      endTimeLabel = postItem.lookup("endTime");
      questionLabel = postItem.lookup("question");
      statusLabel = postItem.lookup("status");
      yesVotesLabel = postItem.lookup("yesVotes");
      noVotesLabel = postItem.lookup("noVotes");
      undecidedVotesLabel = postItem.lookup("undecidedVotes");
      advisorAvatarLabel = postItem.lookup("advisorAvatarLabel");
      advisorReasonLabel = postItem.lookup("reason");

      postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
      questionLabel.text("<b>Question: </b>" + voteItem.question);
      statusLabel.text("<b>Status: </b>" + voteItem.status);
   };

   if (adminFlag) {

      ApprovalVotes.forEach(function (voteItem) {

         postItem = voteItem.postItem;
         setLabels (postItem, voteItem);

         myLayout.addWidget(postItem);
         itor += 1;
      });
   }
   ActiveVotes.forEach(function (voteItem) {

      postItem = voteItem.postItem;
      setLabels (postItem, voteItem);

      startTimeLabel.text("<b>Start Time:</b>" + voteItem.startTime);
      endTimeLabel.text("<b>End Time: </b>" + voteItem.endTime);
      yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
      noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
      undecidedVotesLabel.text("<b>Undecided Votes: </b>" + voteItem.undecidedVotes);
      advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisolReason);

      myLayout.addWidget(postItem);
      itor += 1;
   });
   PastVotes.forEach(function (voteItem) {

      postItem = voteItem.postItem;
      setLabels (postItem, voteItem);

      status = voteItem.status;
      if (status === dmz.stance.VOTE_YES || status === dmz.stance.VOTE_NO) {

         startTimeLabel.text("<b>Start Time: </b>" + voteItem.startTime);
         endTimeLabel.text("<b>End Time: </b>" + voteItem.endTime);
         yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
         noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
         undecidedVotesLabel.text("<b>Undecided Votes: </b>" + voteItem.undecidedVotes);
         advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
      }
      else if (status === dmz.stance.VOTE_DENIED) {

         startTimeLabel.text("<b>Posted At: </b>" + voteItem.postedTime);
         advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
      }

      myLayout.addWidget(postItem);
      itor += 1;
   });
};

voteLinkChanged = function (objHandle) {

   var decisionHandle
     , tempHandles
     , tempValue
     , yesVotes
     , noVotes
     , totalUsers
     ;

   tempHandles = dmz.object.superLinks(objHandle, dmz.stance.VoteLinkHandle) || [];
   decisionHandle = tempHandles[0];
   yesVotes = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
   yesVotes = yesVotes.length;
   noVotes = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
   noVotes = noVotes.length;
   tempHandles = dmz.object.subLinks(objHandle, dmz.stance.CreatedByHandle) || [];
   tempValue = tempHandles[0];
   tempHandles = dmz.object.subLinks(tempValue, dmz.stance.GroupMembersHandle) || [];
   tempValue = tempHandles[0];
   totalUsers = numberOfNonAdminUsers(tempValue);

   self.log.error("No Votes: " + noVotes + " Yes Votes: " + yesVotes + "Total Users: " + totalUsers);

   if (noVotes >= (totalUsers / 2)) {

      self.log.error("No Vote Limit Reached");
      dmz.object.scalar(objHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
   }
   else if (yesVotes > (totalUsers / 2)) {

      self.log.error("Yes Vote Limit Reached");
      dmz.object.scalar(objHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
   }
   else {

      self.log.error("Vote Inconclusive");
      updateFields(objHandle);
   }
};

isCompleteNewVote = function (objHandle) {

   if (dmz.object.type(objHandle).isOfType(dmz.stance.VoteType)) {

      if (dmz.object.text(objHandle, dmz.stance.TextHandle)
         && dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle) !== undefined
         && dmz.object.flag(objHandle, dmz.stance.UpdateStartTimeHandle) !== undefined
         && dmz.object.subLinks(objHandle, dmz.stance.CreatedByHandle)) {

         return true;
      }
   }
   return false;
};

removeFromMaps = function (objHandle) {

   var voteItem
     , itor = 0
     ;

   PastVotes.forEach(function (vote) {

      if (vote.handle === objHandle) {

         voteItem = vote;
         PastVotes.splice(itor, 1);
         pushVote(objHandle);
         refreshView();
         return;
      }
      itor += 1;
   });

   itor = 0;
   ActiveVotes.forEach(function (vote) {

      if (vote.handle === objHandle) {

         voteItem = vote;
         ActiveVotes.splice(itor, 1);
         pushVote(objHandle);
         refreshView();
         return;
      }
      itor += 1;
   });

   itor = 0;
   ApprovalVotes.forEach(function (vote) {

      if (vote.handle === objHandle) {

         voteItem = vote;
         ApprovalVotes.splice(itor, 1);
         pushVote(objHandle);
         refreshView();
         return;
      }
      itor += 1;
   });
};

updateFields = function (objHandle) {

   var state = dmz.object.scalar(objHandle, dmz.stance.VoteState)
     , voteItem
     , tempHandles
     , tempValue
     ;

   PastVotes.forEach(function (vote) {

      if (vote.handle === objHandle) { voteItem = vote; }
   });
   ActiveVotes.forEach(function (vote) {

      if (vote.handle === objHandle) { voteItem = vote; }
   });

   ApprovalVotes.forEach(function (vote) {

      if (vote.handle === objHandle) { voteItem = vote; }
   });

   if (voteItem) {

      self.log.error("Updating fields of: " + voteItem);
      if (state === dmz.stance.VOTE_YES || dmz.stance.VOTE_NO || dmz.stance.VOTE_ACTIVE) {

         voteItem.startTime = dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle);
         voteItem.endTime = dmz.object.timeStamp(objHandle, dmz.stance.EndedAtServerTimeHandle);
         voteItem.status = state;
         tempHandles = dmz.object.superLinks(objHandle, dmz.stance.YesHandle) || [];
         voteItem.yesVotes = tempHandles.length;
         tempHandles = dmz.object.superLinks(objHandle, dmz.stance.NoHandle) || [];
         voteItem.noVotes = tempHandles.length;
         tempValue = numberOfNonAdminUsers(voteItem.groupHandle);
         voteItem.undecidedVotes = tempValue - voteItem.yesVotes - voteItem.noVotes;
      }
      else if (state === dmz.stance.VOTE_APPROVAL_PENDING || state === dmz.stance.VOTE_DENIED) {

         voteItem.postedTime = dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle);
         voteItem.status = state;
      }
      refreshView();
   }
};

isObjectInMap = function (objHandle, attrHandle) {

   var fullNewObject = false
     , inMap = false
     , objectType = dmz.object.type(objHandle)
     ;

   if (objectType.isOfType(dmz.stance.VoteType) || objectType.isOfType(dmz.stance.DecisionType)) {

      PastVotes.forEach(function (voteItem) {

         if (voteItem.handle === objHandle) { inMap = true; }
      });
      ActiveVotes.forEach(function (voteItem) {

         if (voteItem.handle === objHandle) { inMap = true; }
      });
      ApprovalVotes.forEach(function (voteItem) {

         if (voteItem.handle === objHandle) { inMap = true; }
      });

      self.log.error("Is Object In Map?: " + inMap);

      if (attrHandle === dmz.stance.VoteState && inMap) {

         // Removes and adds the object, hence refreshing its properties in the Map
         self.log.error("Vote State Changed");
         removeFromMaps(objHandle);
      }
      else if (inMap) {

         if (attrHandle === dmz.stance.YesHandle || attrHandle === dmz.stance.NoHandle) {

            self.log.error("User Has Voted");
            voteLinkChanged(objHandle);
         }
         else {

            updateFields(objHandle);
         }
      }
      else if (isCompleteNewVote(objHandle)) {

         pushVote(objHandle);
         refreshView();
      }
   }
};

linkHandleFilter = function (linkHandle, attrHandle, supHandle, subHandle) {

   var voteHandle
     , tempHandles
     ;
   if (attrHandle === dmz.stance.YesHandle || attrHandle === dmz.stance.NoHandle) {

      //subHandle is a decision object
      tempHandles = dmz.object.subLinks(subHandle, dmz.stance.VoteLinkHandle);
      if (tempHandles) {

         voteHandle = tempHandles[0];
         isObjectInMap(voteHandle, attrHandle);
      }
   }
   // if createdByHandle, get VoteObject Handle
   if (attrHandle === dmz.stance.CreatedByHandle) {

      //supHandle is vote object
      isObjectInMap(supHandle, attrHandle);
   }
   // if VoteLinkHandlle, get VoteObject Handle
   if (attrHandle === dmz.stance.VoteLinkHandle) {

      //subHandle is vote object
      if (dmz.object.type(subHandle).isOfType(dmz.stance.VoteType)) {

         isObjectInMap(subHandle, attrHandle);
      }
   }
};

attrHandleFilter = function (objHandle, attrHandle, prevVal, newVal) {

   isObjectInMap(objHandle, attrHandle);
};

dmz.object.text.observe(self, dmz.stance.TextHandle, attrHandleFilter);

dmz.object.scalar.observe(self, dmz.stance.VoteState, attrHandleFilter);

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle, attrHandleFilter);

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle, attrHandleFilter);

dmz.object.flag.observe(self, dmz.stance.UpdateEndTimeHandle, attrHandleFilter);

dmz.object.flag.observe(self, dmz.stance.UpdateStartTimeHandle, attrHandleFilter);

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle, linkHandleFilter);

dmz.object.link.observe(self, dmz.stance.CreatedByHandle, linkHandleFilter);

dmz.object.link.observe(self, dmz.stance.YesHandle, linkHandleFilter);

dmz.object.link.observe(self, dmz.stance.NoHandle, linkHandleFilter);

userVoted = function (userHandle, decisionHandle, vote) {

   dmz.object.link(vote ? dmz.stance.YesHandle : dmz.stance.NoHandle, userHandle, decisionHandle);
};

hasUserVoted = function (userHandle, decisionHandle) {

   var tempHandles = dmz.object.subLinks(userHandle, dmz.stance.YesHandle) || [];

   tempHandles.forEach(function(handle) {

      if (handle === decisionHandle) { return true; }
   });
   tempHandles = dmz.object.subLinks(userHandle, dmz.stance.NoHandle) || [];
   tempHandles.forEach(function(handle) {

      if (handle === decisionHandle) { return true; }
   });
   return false;
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

   var userHandles = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle) || []
     , users = userHandles.length
     ;

   userHandles.forEach(function (userHandle) {

      if (dmz.object.flag(userHandle, dmz.stance.AdminHandle)) { users -= 1; }
   });

   return users;
}

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Vote", voteForm);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   content.layout(myLayout);
   myLayout.addStretch(1);
};

init();


