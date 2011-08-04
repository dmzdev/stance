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
   , resetLayout
   , userVoted
   , hasUserVoted
   , createDecisionObject
   , numberOfNonAdminUsers
   , debug
   , init
   ;

debug = function () {

   AllVotes.forEach(function (item) {

      self.log.error(item);
   });
   VoteObjects.forEach(function (item) {

      self.log.error(item);
   });
   DecisionObjects.forEach(function (item) {

      self.log.error(item);
   });
};

resetLayout = function () {

   var widget;

   if (formContent && contentLayout) {

      widget = contentLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = contentLayout.takeAt(0);
      };
   }
   contentLayout.addStretch(1);
};

insertItems = function () {

   var itor = 0;

   populateAllVotes();
   populateSubLists();
   resetLayout();
   ApprovalVotes.forEach(function (voteItem) {

      contentLayout.insertWidget(itor, voteItem.postItem);
      itor += 1;
   });
   ActiveVotes.forEach(function (voteItem) {

      contentLayout.insertWidget(itor, voteItem.postItem);
      itor += 1;
   });
   PastVotes.forEach(function (voteItem) {

      contentLayout.insertWidget(itor, voteItem.postItem);
      itor += 1;
   });
};

populateAllVotes = function () {

   AllVotes = [];

   VoteObjects.forEach(function (voteObject) {

      var voteItem = {}
        , decisionObject
        ;

      if ((voteObject.userHandle)
         && dmz.stance.getUserGroupHandle(voteObject.userHandle) === dmz.stance.getUserGroupHandle(dmz.object.hil())) {

         if (!voteItem.userPicture) {

            voteItem.userPicture = dmz.object.text(voteObject.userHandle, dmz.stance.PictureHandle);
         }
         if (!voteItem.postedBy) {

            voteItem.postedBy = dmz.stance.getDisplayName(voteObject.userHandle);
         }
         if (!voteItem.groupHandle) {

            voteItem.groupHandle = dmz.stance.getUserGroupHandle(voteObject.userHandle);
         }

         if (voteObject.state) {

            voteItem.state = voteObject.state;
         }
         if (voteObject.question) {

            voteItem.question = voteObject.question;
         }
         if (voteObject.postedTime) {

            voteItem.postedTime = voteObject.postedTime;
         }
         if (voteObject.advisorHandle) {

            if (!voteItem.advisorPicture) {

               voteItem.advisorPicture = dmz.object.text(voteObject.advisorHandle, dmz.stance.PictureHandle);
            }
         }
         if (voteObject.decisionHandle) {

            decisionObject = DecisionObjects[voteObject.decisionHandle];
            if (decisionObject.startTime) {

               voteItem.startTime = decisionObject.startTime;
            }
            if (decisionObject.endTime) {

               voteItem.endTime = decisionObject.endTime;
            }
            if (decisionObject.advisorReason) {

               voteItem.advisorReason = decisionObject.advisorReason;
            }
            if (decisionObject.yesVotes !== undefined) {

               voteItem.yesVotes = decisionObject.yesVotes;
            }
            if (decisionObject.noVotes !== undefined) {

               voteItem.noVotes = decisionObject.noVotes;
            }
         }

         if (isCompleteItem(voteItem)) {

            AllVotes.push(voteItem);
         }
      }
   });
};

setItemLabels = function (voteItem) {

   var postItem
     , pic
     ;

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
   }

   if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) {

      if (voteItem.state === dmz.stance.VOTE_NO) {
         voteItem.postItem.setStyleSheet("* { background-color: rgb(240, 70, 70); }")
      }
      else {
         voteItem.postItem.setStyleSheet("* { background-color: rgb(70, 240, 70); }")
      }
      // do user avatar
      pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
      voteItem.userPictureLabel.pixmap(pic);
      voteItem.postedByLabel.text(voteItem.postedBy);
      voteItem.startTimeLabel.text(voteItem.startTime);
      voteItem.endTimeLabel.text(voteItem.endTime);
      voteItem.questionLabel.text(voteItem.question);
      voteItem.stateLabel.text(dmz.stance.STATE_STR[voteItem.state]);
      voteItem.yesVotesLabel.text(voteItem.yesVotes);
      voteItem.noVotesLabel.text(voteItem.noVotes);
      // do undecided votes
      // do advisor avatar
      voteItem.advisorReasonLabel.text(voteItem.advisorReason);
   }
   else if (voteItem.state === dmz.stance.VOTE_DENIED) {

      voteItem.postItem.setStyleSheet("* { background-color: rgb(70, 70, 70); color: white; }")
      //do user avatar
      voteItem.postedByLabel.text(voteItem.postedBy);
      voteItem.startTimeLabel.text(voteItem.postedTime);
      voteItem.questionLabel.text(voteItem.question);
      voteItem.stateLabel.text(dmz.stance.STATE_STR[voteItem.state]);
      // do advisor picture
      voteItem.advisorReasonLabel.text(voteItem.advisorReason);
   }
   else if (voteItem.state === VOTE_APPROVAL_PENDING) {

      voteItem.postItem.setStyleSheet("* { background-color: rgb(240, 240, 240); }")
      // do user avatar
      voteItem.postedByLabel.text(voteItem.postedBy);
      voteItem.startTimeLabel.text(voteItem.postedTime);
      voteItem.questionLabel.text(voteItem.question);
      voteItem.state.text(dmz.stance.STATE_STR[voteItem.state]);
   }
   else if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

      voteItem.postItem.setStyleSheet("* { background-color: rgb(240, 240, 70); }")
      // do user avatar
      voteItem.postedByLabel.text(voteItem.postedBy);
      voteItem.startTimeLabel.text(voteItem.startTime);
      voteItem.endTimeLabel.text(voteItem.endTime);
      voteItem.question.text(voteItem.question);
      voteItem.status.text(dmz.stance.STATE_STR[voteItem.state]);
      voteItem.yesVotes.text(voteItem.yesVotes);
      voteItem.noVotes.text(voteItem.noVotes);
      // do undecided votes
      // do advisor avatar
      voteItem.advisorReason.text(voteItem.advisorReason);
   }
};

isCompleteItem = function (voteItem) {

   var completeFlag = false;

   self.log.error(voteItem.userPicture , voteItem.postedBy , voteItem.question
      , voteItem.state)
   if (voteItem.userPicture && voteItem.postedBy && voteItem.question
      && voteItem.state !== undefined) {

      if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)
         || (voteItem.state === dmz.stance.VOTE_ACTIVE)) {

         self.log.error((voteItem.startTime) , (voteItem.endTime) , (voteItem.yesVotes !== undefined)
            , (voteItem.noVotes !== undefined) , (voteItem.advisorReason) , (voteItem.advisorPicture));
         if ((voteItem.startTime) && (voteItem.endTime) && (voteItem.yesVotes !== undefined)
            && (voteItem.noVotes !== undefined) && (voteItem.advisorReason) && (voteItem.advisorPicture)) {

            self.log.error("HERRO!");
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

      if ((voteItem.state === dmz.stance.VOTE_YES) || (voteItem.state === dmz.stance.VOTE_NO)
         || (voteItem.state === dmz.stance.VOTE_DENIED)) {

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

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].state = newVal;
   }
   else {

      VoteObjects[objHandle] = {};
      VoteObjects[objHandle].state = newVal;
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var objType = dmz.object.type(objHandle)
     , voteHandle
     ;

   if (objType.isOfType(dmz.stance.VoteType)) {

      if (VoteObjects[objHandle]) {

         VoteObjects[objHandle].question = newVal;
      }
      else {

         VoteObjects[objHandle] = {};
         VoteObjects[objHandle].question = newVal;
      }
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      if (DecisionObjects[objHandle]) {

         DecisionObjects[objHandle].advisorReason = newVal;
      }
      else {

         DecisionObjects[objHandle] = {};
         DecisionObjects[objHandle].advisorReason = newVal;
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var objType = dmz.object.type(objHandle);

   if (objType.isOfType(dmz.stance.VoteType)) {

      if (VoteObjects[objHandle]) {

         VoteObjects[objHandle].postedTime = newVal;
      }
      else {

         VoteObjects[objHandle] = {};
         VoteObjects[objHandle].postedTime = newVal;
      }
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      if (DecisionObjects[objHandle]) {

         DecisionObjects[objHandle].startTime = newVal;
      }
      else {

         DecisionObjects[objHandle] = {};
         DecisionObjects[objHandle].startTime = newVal;
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var objType = dmz.object.type(objHandle);

   if (objType.isOfType(dmz.stance.DecisionType)) {

      if (DecisionObjects[objHandle]) {

         DecisionObjects[objHandle].endTime = newVal;
      }
      else {

         DecisionObjects[objHandle] = {};
         DecisionObjects[objHandle].endTime = newVal;
      }
   }
});

dmz.object.flag.observe(self, dmz.stance.UpdateEndTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

});

dmz.object.flag.observe(self, dmz.stance.UpdateStartTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (dmz.object.type(supHandle).isOfType(dmz.stance.VoteType)) {

      if (VoteObjects[supHandle]) {

         VoteObjects[supHandle].advisorHandle = subHandle;
      }
      else {

         VoteObjects[supHandle] = {};
         VoteObjects[supHandle].advisorHandle = subHandle;
      }
   }
   else if (dmz.object.type(supHandle).isOfType(dmz.stance.DecisionType)) {

      if (DecisionObjects[supHandle]) {

         DecisionObjects[supHandle].voteHandle = subHandle;
      }
      else {

         DecisionObjects[supHandle] = {};
         DecisionObjects[supHandle].voteHandle = subHandle;
      }
      if (VoteObjects[subHandle]) {

         VoteObjects[subHandle].decisionHandle = supHandle;
      }
      else {

         VoteObjects[subHandle] = {};
         VoteObjects[subHandle].decisionHandle = supHandle;
      }
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (dmz.object.type(supHandle).isOfType(dmz.stance.VoteType)) {

      if (VoteObjects[supHandle]) {

         VoteObjects[supHandle].userHandle = subHandle;
      }
      else {

         VoteObjects[supHandle] = {};
         VoteObjects[supHandle].userHandle = subHandle;
      }
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var voteHandles
     , voteHandle
     ;

   if (dmz.object.type(subHandle).isOfType(dmz.stance.DecisionType)) {

      if (!DecisionObjects[subHandle]) {

         DecisionObjects[subHandle] = {};
      }
      else {

         if (DecisionObjects[subHandle].yesVotes) {

            DecisionObjects[subHandle].yesVotes += 1;
         }
         else {

            DecisionObjects[subHandle].yesVotes = 1;
         }
      }
   }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var voteHandles
     , voteHandle
     ;

   if (dmz.object.type(subHandle).isOfType(dmz.stance.DecisionType)) {

      if (!DecisionObjects[subHandle]) {

         DecisionObjects[subHandle] = {};
      }
      else {

         if (DecisionObjects[subHandle].noVotes) {

            DecisionObjects[subHandle].noVotes += 1;
         }
         else {

            DecisionObjects[subHandle].noVotes = 1;
         }
      }
   }
});

userVoted = function (userHandle, decisionHandle, vote) {

   dmz.object.link(vote ? dmz.stance.YesHandle : dmz.stance.NoHandle, userHandle, decisionHandle);

};

hasUserVoted = function (userHandle, decisionHandle) {

   var tempHandles = dmz.object.subLinks(userHandle, dmz.stance.YesHandle) || []
     , userVotedFlag = false
     ;

   if (tempHandles.indexOf(decisionHandle)) { userVotedFlag = true; }

   tempHandles = dmz.object.subLinks(userHandle, dmz.stance.NoHandle) || [];
   if (tempHandles.indexOf(decisionHandle)) { userVotedFlag = true; }

   return userVotedFlag;
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

   userHandles.filter(function (userHandle) {

      return !dmz.object.flag(userHandle, dmz.stance.AdminHandle);
   });

   return userHandles.length;
};

/*updateLastSeen = function () {

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

   dmz.object.timeStamp(dmz.object.hil(), dmz.stance.VoteTimeHandle, latestTime);
};

highlightNew = function () {

   var latestSeen = dmz.object.timeStamp(dmz.object.hil(), dmz.stance.VoteTimeHandle);

   if (!latestSeen) {

      dmz.object.timeStamp(dmz.object.hil(), dmz.stance.VoteTimeHandle, 0);
   }

   PastVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestSeen) { MainModule.highlight("Vote"); }
   });
   ActiveVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestSeen) { MainModule.highlight("Vote"); }
   });
   ApprovalVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestSeen) { MainModule.highlight("Vote"); }
   });
};
*/

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
