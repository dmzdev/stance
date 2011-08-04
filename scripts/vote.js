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
   , AllVotes = []
   , PastVotes = []
   , ApprovalVotes = []
   , ActiveVotes = []
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
   , currentHil = 0
   // Functions
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

      self.log.error(item.question);
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

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (AllVotes[objHandle]) {

      AllVotes[objHandle].state = newVal;
   }
   else {

      AllVotes[objHandle] = {};
      AllVotes[objHandle].state = newVal;
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

      if (AllVotes[objHandle]) {

         AllVotes[objHandle].question = newVal;
      }
      else {

         AllVotes[objHandle] = {};
         AllVotes[objHandle].question = newVal;
      }
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      voteHandle = dmz.object.subLinks(objHandle, dmz.stance.VoteLinkHandle);
      if (AllVotes[voteHandle]) {

         AllVotes[voteHandle].decisionHandle = objHandle;
         AllVotes[voteHandle].advisorReason = newVal;
      }
      else {

         AllVotes[voteHandle] = {};
         AllVotes[voteHandle].decisionHandle = objHandle;
         AllVotes[voteHandle].advisorReason = newVal;
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var objType = dmz.object.type(objHandle)
     , voteHandle
     ;

   if (objType.isOfType(dmz.stance.VoteType)) {

      if (AllVotes[objHandle]) {

         AllVotes[objHandle].postedTime = newVal;
      }
      else {

         AllVotes[objHandle] = {};
         AllVotes[objHandle].postedTime = newVal;
      }
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      voteHandle = dmz.object.subLinks(objHandle, dmz.stance.VoteLinkHandle);
      if (AllVotes[voteHandle]) {

         AllVotes[voteHandle].decisionHandle = objHandle;
         AllVotes[voteHandle].startTime = newVal;
      }
      else {

         AllVotes[voteHandle] = {};
         AllVotes[voteHandle].decisionHandle = objHandle;
         AllVotes[voteHandle].startTime = newVal;
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var objType = dmz.object.type(objHandle)
     , voteHandle
     ;

   if (objType.isOfType(dmz.stance.DecisionType)) {

      voteHandle = dmz.object.subLinks(objHandle, dmz.stance.VoteLinkHandle);
      if (AllVotes[voteHandle]) {

         AllVotes[voteHandle].decisionHandle = objHandle;
         AllVotes[voteHandle].endTime = newVal;
      }
      else {

         AllVotes[voteHandle] = {};
         AllVotes[voteHandle].decisionHandle = objHandle;
         AllVotes[voteHandle].endTime = newVal;
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
function (linkHandle, attrHandle, supHandle, subhandle) {

});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subhandle) {

});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subhandle) {

});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subhandle) {

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
      module.addPage("Vote", voteForm, debug);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();
