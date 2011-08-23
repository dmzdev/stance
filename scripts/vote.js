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
   , ApprovalVotes = []
   , ActiveVotes = []
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))

   //Functions
   ;

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.VoteType)) {

      VoteObjects[objHandle] = { handle: objHandle };
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      DecisionObjects[objHandle] = { handle: objHandle };
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
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (VoteObjects[objHandle]) {

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

      VoteObjects[supHandle].advisorHandle = subHandle;
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

      VoteObjects[supHandle].createdByHandle = subHandle;
   }
});

