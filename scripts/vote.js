var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , defs: require("dmz/runtime/definitions")
       , message: require("dmz/runtime/messaging")
       , ui:
          { consts: require('dmz/ui/consts')
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , messageBox: require("dmz/ui/messageBox")
          }
       }

  // UI elements
   , voteForm = dmz.ui.loader.load("VoteForm.ui")
   , voteYesButton = voteForm.lookup("yesButton")
   , voteNoButton = voteForm.lookup("noButton")
   , voteYesList = voteForm.lookup("yesList")
   , voteNoList = voteForm.lookup("noList")
   , voteUndecidedList = voteForm.lookup("undecList")
   , voteAuthorLabel = voteForm.lookup("authorLabel")
   , voteText = voteForm.lookup("textEdit")

   , voteCreateForm = dmz.ui.loader.load("VoteCreateForm.ui")
   , voteCreateText = voteCreateForm.lookup("textEdit")
   , voteCreateCharRem = voteCreateForm.lookup("charRemAmt")
   , voteCreateSubmitButton = voteCreateForm.lookup("submitButton")

   // Handles
   , VoteTextHandle = dmz.defs.createNamedHandle("Vote_Text")
   , VoteYesHandle = dmz.defs.createNamedHandle("Vote_Yes")
   , VoteNoHandle = dmz.defs.createNamedHandle("Vote_No")
   , VoteUndecidedHandle = dmz.defs.createNamedHandle("Vote_Undecided")
   , VoteActiveHandle = dmz.defs.createNamedHandle("Vote_Active")
   , VoteAdvisorHandle = dmz.defs.createNamedHandle("Vote_Advisor")
   , VoteStartHandle = dmz.defs.createNamedHandle("Vote_Start")
   , VoteEndHandle = dmz.defs.createNamedHandle("Vote_End")
   , VoteFinishedHandle = dmz.defs.createNamedHandle("Vote_Finished")
   , VoteApprovedHandle = dmz.defs.createNamedHandle("Vote_Approved")

   , VoteHandle = dmz.defs.createNamedHandle("Vote")
   , VoteCreatedHandle = dmz.defs.createNamedHandle("Vote_Created")

   , UserGameNameHandle = dmz.defs.createNamedHandle("User_Game_Name")

   // Object Types
   , VoteType = dmz.objectType.lookup("vote")
   , UserType = dmz.objectType.lookup("user")

   // Variables
   , hil = dmz.object.hil() // User object type
   , CurrentAuthor = "Tester" // Convert to call to dmz.object later
   , CurrentAdvisor
   , maxVoteTextLength = 400
   , CurrentGroup
   , VoteTimeLength = 24 // hours

   // Messages
   , newVoteMessage = dmz.message.create("NewVoteMessage")
   , displayVoteMessage = dmz.message.create("DisplayVoteMessage")

   // Test Function declarations

   ;

newVoteMessage.subscribe(self, function (advisorHandle) {

//   if (hil) {
   if (true) {

      CurrentAdvisor = advisorHandle;
      voteCreateText.clear();
      voteCreateForm.show();
   }
});

voteCreateText.observe(self, "textChanged", function (ui) {

   var text = ui.text()
     , length = 0
     , diff = 0
     , color = "black"
     ;

   if (text) { length = text.length; diff = maxVoteTextLength - length; }

   if (length > maxVoteTextLength) { color = "red"; }
   else if (length > (maxVoteTextLength / 2)) { color = "blue"; }
   else if (length > (maxVoteTextLength / 4)) { color = "green"; }
   voteCreateCharRem.text("<font color="+color+">"+diff+"</font>");
});

voteCreateSubmitButton.observe(self, "clicked", function () {

   var vote
     , time
     ;
   if (hil && CurrentAdvisor && (voteCreateText.text().length < maxVoteTextLength)) {

      vote = dmz.object.create(VoteType)
      dmz.object.text(vote, VoteTextHandle, voteCreateText.text());
      time = (new Date()).getTime();
      dmz.object.timestamp(vote, VoteStartHandle, time);
      time += (VoteTimeLength /*h*/ * 60 /*min/h*/ * 60 /*s/min*/ * 1000 /*ms/s*/);
      dmz.object.timestamp(vote, VoteEndHandle, time);
      dmz.object.link(VoteHandle, CurrentGroup, vote);
      dmz.object.link(VoteCreatedHandle, hil, vote);

      // Need to add check to see if advisor already has a vote before creating a new vote
      // Pop an "Active Vote" error message box if already an active vote
//      dmz.object.link(VoteAdvisorHandle, CurrentAdvisor, vote);
      dmz.object.activate(vote);
      voteCreateForm.hide();
   }
});

dmz.object.flag.observe(self, function (objHandle, attrHandle, flag, prev) {

   if (attrHandle === VoteApprovedHandle) {

      if (flag && !prev) { displayVoteMessage.send(objHandle); }
//      if (flag && !prev) {
   }
});
//      dmz.object.link(VoteHandle, hil, vote);

displayVoteMessage.subscribe(self, function (objHandle) {

   var text
     , yesVoters
     , noVoters
     , undecidedVoters
     , startTime
     , endTime
     , author
     , active
     ;

   if (dmz.object.type(objHandle).isOfType(VoteType)) {

      author = dmz.object.superLinks(objHandle, VoteCreatedHandle)[0];
      text = dmz.object.text(objHandle, VoteTextHandle);
      yesVoters = dmz.object.subLinks(objHandle, VoteYesHandle);
      noVoters = dmz.object.subLinks(objHandle, VoteNoHandle);
      undecidedVoters = dmz.object.subLinks(objHandle, VoteUndecidedHandle);
      startTime = dmz.object.timestamp(objHandle, VoteStartHandle);
      endTime = dmz.object.timestamp(objHandle, VoteEndHandle);
      active = dmz.object.flag(objHandle, VoteActiveHandle);

      if (active && ((new Date()).getTime() < endTime)) {

         voteAuthorLabel.text(author);
         voteText.text(text);
         yesVoters.forEach(function (playerHandle) {

            var type = dmz.object.type(playerHandle);
            if (type && type.isOfType(UserType)) {

               voteYesList.addItem(dmz.object.text(playerHandle, UserGameNameHandle));
            }
         });

         noVoters.forEach(function (playerHandle) {

            var type = dmz.object.type(playerHandle);
            if (type && type.isOfType(UserType)) {

               voteNoList.addItem(dmz.object.text(playerHandle, UserGameNameHandle));
            }
         });

         undecidedVoters.forEach(function (playerHandle) {

            var type = dmz.object.type(playerHandle);
            if (type && type.isOfType(UserType) && (playerHandle !== hil)) {

               voteUndecidedList.addItem(dmz.object.text(playerHandle, UserGameNameHandle));
            }
         });
         voteForm.show();

         voteYesButton.observe(self, "clicked", function () {

            dmz.object.unlinkSubObjects(hil, VoteUndecidedHandle);
            dmz.object.link(VoteYesHandle, hil, objHandle);
            voteForm.hide();
         });

         voteNoButton.observe(self, "clicked", function () {

            dmz.object.unlinkSubObjects(hil, VoteUndecidedHandle);
            dmz.object.link(VoteNoHandle, hil, objHandle);
            voteForm.hide();
         });
      }
      else if (active) { // Time has expired

         dmz.object.flag(objHandle, VoteActiveHandle, false);
         dmz.object.timestamp(objHandle, VoteFinishedHandle, (new Date()).getTime());
         dmz.object.unlinkSuperObjects(objHandle, VoteAdvisorHandle);
      }
   }
});


