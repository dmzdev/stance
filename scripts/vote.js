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
   , DisplayedVotes = []
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
   , hil
   , userGrouphandle
   , isAdmin

   //Functions
   , openWindow
   , initiateVoteUI
   , setYesNoLabels
   , setActiveLabels
   , setApprovalPendingLabels
   , setDeniedLabels
   , updateVotes
   , updateState
   ;

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

updateState = function (voteHandle) {

};

updateVotes = function (voteHandle) {

};

setDeniedLabels = function (voteHandle) {

};

setApprovalPendingLabels = function (voteHandle) {

};

setActiveLabels = function (voteHandle) {

};

setYesNoLabels = function (voteHandle) {

   var voteItem
     , decisionItem
     , pic
     ;

   if (VoteObjects[voteHandle] && VoteObjects[voteHandle].ui &&
      VoteObjects[voteHandle].decisionHandle &&
      DecisionObjects[VoteObjects[voteHandle].dicisionHandle]) {

      voteItem = VoteObjects[voteHandle];
      decisionItem = DecisionObjects[VoteObjects[voteHandle].dicisionHandle];

      if (voteItem.state === VOTE_NO) {

         voteItem.postItem.styleSheet("* { background-color: rgb(240, 70, 70); }");
      }
      else if (voteItem.state === VOTE_YES) {

         voteItem.postItem.styleSheet("* { background-color: rgb(70, 240, 70); }");
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
      if (voteItem.state) {

         voteItem.ui.stateLabel.text(
            "<b>Vote status: </b>" +
            dmz.stance.STATE_STR[voteItem.state]);
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
   }
};

initiateVoteUI = function (voteHandle) {

   var voteItem;

   if (VoteObjects[voteHandle] && !VoteObjects[voteHandle].ui &&
      (VoteObjects.state !== undefined)) {

      voteItem = VoteObjects[voteHandle];
      voteItem.ui.postItem = dmz.ui.loader.load("VoteViewPost");
      voteItem.ui.userPictureLabel = voteItem.ui.postItem.lookup("userPictureLabel");
      voteItem.ui.postedByLabel = voteItem.ui.postItem.lookup("postedByLabel");
      voteItem.ui.startTimeLabel = voteItem.ui.postItem.lookup("startTimeLabel");
      voteItem.ui.endTimeLabel = voteItem.ui.postItem.lookup("endTimeLabel");
      voteItem.ui.questionLabel = voteItem.ui.postItem.lookup("questionLabel");
      voteItem.ui.stateLabel = voteItem.ui.postItem.lookuo("stateLabel");
      voteItem.ui.yesVotesLabel = voteItem.ui.postItem.lookup("yesVotesLabel");
      voteItem.ui.noVotesLabel = voteItem.ui.postItem.lookup("noVotesLabel");
      voteItem.ui.undecidedVotesLabel = voteItem.ui.postItem.lookup("undecidedVotesLabel");
      voteItem.ui.advisorPictureLabel = voteItem.ui.postItem.lookup("advisorPictureLabel");
      voteItem.ui.advisorReasonLabel = voteItem.ui.postItem.lookup("advisorReasonLabel");
      voteItem.ui.yesButton = dmz.ui.button.createPushButton("Approve");
      voteItem.ui.noButton = dmz.ui.button.createPushButton("Deny");
      voteItem.ui.buttonLayout = dmz.postItem.lookup("buttonLayout");
      voteItem.ui.textLayout = dmz.postItem.lookup("textLayout");
      voteItem.ui.timeBox = dmz.ui.spinBox.createSpinBox("timeBox");
      voteItem.ui.timeBox.minimum(24);
      voteItem.ui.timeBox.maximum(72);
      voteItem.ui.timeBox.setSingleStep(24);
      voteItem.ui.timeBox.setSuffix("hrs");
      voteItem.decisionReason = dmz.ui.textEdit.create("");
      voteItem.decisionReason.sizePolicy(7, 0);
      voteItem.decisionReason.fixedHeight(90);
      voteItem.decisionReasonLabel = dmz.ui.label.create("<b>Decision Reason: </b>");

      if ((voteItem.state === VOTE_NO) || (voteItem.state === VOTE_YES)) {

         setYesNoLabels(voteHandle);
      }
      else if (voteItem.state === VOTE_ACTIVE) { setActiveLabels(voteHandle); }
      else if (voteItem.state === VOTE_DENIED) { setDeniedLabels(voteHandle); }
      else if (voteItem.state === VOTE_APPROVAL_PENDING) {

         setApprovalPendingLabels(voteHandle);
      }
   }
};

openWindow = function () {

};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      userGrouphandle = dmz.stance.getUserGroupHandle(hil);
      isAdmin = dmz.object.flag(hil, dmz.stance.AdminHandle);
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.VoteType)) {

      VoteObjects[objHandle] = { handle: objHandle };
      self.log.error("1");
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      DecisionObjects[objHandle] = { handle: objHandle };
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      self.log.error("2");
      VoteObjects[objHandle].question = newVal;
   }
   else if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].advisorResponse = newVal;
   }
});

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      self.log.error("3");
      self.log.error(dmz.object.text(objHandle, dmz.stance.TextHandle));
      VoteObjects[objHandle].state = newVal;
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

      self.log.error("4");
      VoteObjects[objHandle].postedTime = newVal;
   }
   else if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].startTime = newVal;
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].endTime = newVal;
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.ExpiredTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].expireTime = newVal;
   }
});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      self.log.error("5");
      VoteObjects[supHandle].advisorHandle = subHandle;
      /*self.log.error(dmz.object.text(subHandle, dmz.stance.NameHandle));
      self.log.error(dmz.object.text(subHandle, dmz.stance.PictureHandle));
      self.log.error(dmz.object.text(subHandle, dmz.stance.BioHandle));
      self.log.error(dmz.object.text(subHandle, dmz.stance.TitleHandle));
      self.log.error(dmz.object.scalar(subHandle, dmz.stance.ID));*/
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

      self.log.error("6");
      VoteObjects[supHandle].createdByHandle = subHandle;
   }
});

dmz.object.link.observe(self, dmz.stance.VoteGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      self.log.error("7");
      VoteObjects[supHandle].groupHandle = subHandle;
   }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (DecisionObjects[subHandle]) {

      DecisionObjects[subHandle].noVotes = (DecisionObjects[subHandle].noVotes || 0) + 1;
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (DecisionObjects[subHandle]) {

      DecisionObjects[subHandle].yesVotes = (DecisionObjects[subHandle].yesVotes || 0) + 1;
   }
});

