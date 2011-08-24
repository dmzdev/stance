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
   , isWindowOpen = false
   , VoteObjects = {}
   , DecisionObjects = {}
   , AllVotes = {}
   , PastVotes = []
   , ApprovalVotes = []
   , ActiveVotes = []
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))

   // Functions
   , toDate = dmz.util.timeStampToDate
   , insertItems
   , showItems
   , refreshItemLabels
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
   , openWindow
   , closeWindow
   , init
   ;

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

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

openWindow = function () {

   isWindowOpen = true;
   updateLastSeen();
   insertItems();
   resetLayout();
   showItems();
};

closeWindow = function () {

   isWindowOpen = false;
   updateLastSeen();
};

insertItems = function () {

   var itor = 0;

   populateAllVotes();
   populateSubLists();
   PastVotes.sort(function (obj1, obj2) {

      var startTime1
        , startTime2
        , result
        , returnVal
        ;

      if (obj1.state === dmz.stance.VOTE_DENIED) { startTime1 = obj1.postedTime || 0; }
      else { startTime1 = obj1.startTime; }
      if (obj2.state === dmz.stance.VOTE_DENIED) { startTime2 = obj2.postedTime || 0; }
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
};

showItems = function () {

   var itor = 0
     , groupHandle = dmz.stance.getUserGroupHandle(dmz.object.hil());
     ;

   Object.keys(AllVotes).forEach(function (key) { setItemLabels(AllVotes[key], false); });
   ApprovalVotes.forEach(function (voteItem) {

      if (voteItem.postItem) {

         contentLayout.insertWidget(itor, voteItem.postItem);
         voteItem.postItem.show();
         itor += 1;
      }
   });
   ActiveVotes.forEach(function (voteItem) {

      if (voteItem.postItem) {

         contentLayout.insertWidget(itor, voteItem.postItem);
         voteItem.postItem.show();
         itor += 1;
      }
   });
   PastVotes.forEach(function (voteItem) {

      if (voteItem.postItem) {

         contentLayout.insertWidget(itor, voteItem.postItem);
         voteItem.postItem.show();
         itor += 1;
      }
   });
};

refreshItemLabels = function () {

   if (isWindowOpen) {

      populateAllVotes();
      populateSubLists();
      Object.keys(AllVotes).forEach(function (key) { setItemLabels(AllVotes[key], true); });
   }
};

populateAllVotes = function () {

   Object.keys(VoteObjects).forEach(function (key) {

      var voteItem
        , decisionObject
        , voteObject = VoteObjects[key]
        ;

      if (voteObject.handle) {

         if (AllVotes[voteObject.handle]) { voteItem = AllVotes[voteObject.handle]; }
         else {

            voteItem = { handle: voteObject.handle };
            AllVotes[voteObject.handle] = voteItem;
         }
         if (voteObject.state !== undefined) { voteItem.state = voteObject.state; }
         if (voteObject.question) { voteItem.question = voteObject.question; }
         if (voteObject.postedTime) { voteItem.postedTime = voteObject.postedTime; }

         if (voteObject.advisorHandle) {

            voteItem.advisorHandle = voteObject.advisorHandle;
            if (!voteItem.advisorPicture) {

               voteItem.advisorPicture = dmz.object.text(voteObject.advisorHandle, dmz.stance.PictureHandle);
            }
            if (!voteItem.advisorName) {

               voteItem.advisorName = dmz.object.text(voteObject.advisorHandle, dmz.stance.NameHandle);
            }
            if (!voteItem.advisorTitle) {

               voteItem.advisorTitle = dmz.object.text(voteObject.advisorHandle, dmz.stance.TitleHandle);
            }
         }
         if (voteObject.userHandle) {

             voteItem.userHandle = voteObject.userHandle;

            if (!voteItem.userPicture) {

               voteItem.userPicture = dmz.object.text(voteObject.userHandle, dmz.stance.PictureHandle);
            }
            if (!voteItem.postedBy) {

               voteItem.postedBy = dmz.stance.getDisplayName(voteObject.userHandle);
            }
            if (!voteItem.groupHandle) {

               voteItem.groupHandle = dmz.stance.getUserGroupHandle(voteObject.userHandle);
            }
         }
         if (voteObject.decisionHandle) {

            decisionObject = DecisionObjects[voteObject.decisionHandle];
            voteItem.decisionHandle = voteObject.decisionHandle;
            if (decisionObject) {

               if (decisionObject.startTime !== undefined) {

                  voteItem.startTime = decisionObject.startTime;
               }
               if (decisionObject.endTime !== undefined) {

                  voteItem.endTime = decisionObject.endTime;
               }
               if (decisionObject.expiredTime !== undefined) {

                  voteItem.expiredTime = decisionObject.expiredTime;
               }
               if (decisionObject.advisorReason) { voteItem.advisorReason = decisionObject.advisorReason; }
               voteItem.yesVotes = decisionObject.yesVotes || 0;
               voteItem.noVotes = decisionObject.noVotes || 0;
            }
         }
      }
   });
};

setItemLabels = function (voteItem, refresh) {

   var pic
     , hil = dmz.object.hil()
     , groupHandle = dmz.stance.getUserGroupHandle(hil);
     ;

   if (voteItem && voteItem.groupHandle && (voteItem.groupHandle === groupHandle)) {

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
         voteItem.decisionReason.sizePolicy(7, 0);
         voteItem.decisionReason.fixedHeigth(90);
         voteItem.decisionReasonLabel = dmz.ui.label.create("<b>Decision Reason:</b>");
      }
      if (voteItem.userPicture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userPicture));
         voteItem.userPictureLabel.pixmap(pic);
      }
      if (voteItem.postedBy) { voteItem.postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy); }
      if (voteItem.question) { voteItem.questionLabel.text("<b>Question: </b>" + voteItem.question); }
      if ((voteItem.state === dmz.stance.VOTE_NO) || (voteItem.state === dmz.stance.VOTE_YES)) {

         if (voteItem.state === dmz.stance.VOTE_NO) {

            voteItem.postItem.styleSheet("* { background-color: rgb(240, 70, 70); }");
         }
         else {

            voteItem.postItem.styleSheet("* { background-color: rgb(70, 240, 70); }");
         }
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.startTimeLabel.text(
            "<b>Started: </b>" +
            (voteItem.startTime ?
               toDate(voteItem.startTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
         voteItem.endTimeLabel.text(
            "<b>Ended: </b>" +
            (voteItem.endTime ?
               toDate(voteItem.endTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
         if (voteItem.yesVotes !== undefined) {

            voteItem.yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
         }
         if (voteItem.noVotes !== undefined) {

            voteItem.noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
         }
         if ((voteItem.noVotes !== undefined) && (voteItem.yesVotes !== undefined)) {

            voteItem.undecidedVotesLabel.text("<b>Undecided Votes: </b>" +
               (numberOfNonAdminUsers(voteItem.groupHandle) - (voteItem.yesVotes + voteItem.noVotes)));
         }
         if (voteItem.advisorPicture) {

            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
            pic = pic.scaled(25, 25);
            voteItem.advisorPictureLabel.pixmap(pic);
         }
         if (voteItem.advisorReason && voteItem.advisorName && voteItem.advisorTitle) {

            voteItem.advisorReasonLabel.text(
               "<b>" +
               voteItem.advisorName +
               " (" +
               voteItem.advisorTitle +
               "): </b>" +
               voteItem.advisorReason);
         }
      }
      else if (voteItem.state === dmz.stance.VOTE_DENIED) {

         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.postItem.styleSheet("* { background-color: rgb(70, 70, 70); color: white; }")
         voteItem.startTimeLabel.text(
            "<b>Posted: </b>" +
            (voteItem.postedTime ?
               toDate(voteItem.postedTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
         if (voteItem.advisorPicture) {

            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
            pic = pic.scaled(25, 25);
            voteItem.advisorPictureLabel.pixmap(pic);
         }
         if (voteItem.advisorReason && voteItem.advisorName && voteItem.advisorTitle) {

            voteItem.advisorReasonLabel.text(
               "<b>" +
               voteItem.advisorName +
               " (" +
               voteItem.advisorTitle +
               "): </b>" +
               voteItem.advisorReason);
         }
         voteItem.endTimeLabel.text("");
         voteItem.yesVotesLabel.text("");
         voteItem.noVotesLabel.text("");
         voteItem.undecidedVotesLabel.text("");
      }
      else if (voteItem.state === dmz.stance.VOTE_APPROVAL_PENDING) {

         voteItem.postItem.styleSheet("* { background-color: rgb(240, 240, 240); }")
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.startTimeLabel.text(
            "<b>Posted: </b>" +
            (voteItem.postedTime ?
               toDate(voteItem.postedTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));

         if (voteItem.advisorPicture) {

            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
            pic = pic.scaled(25, 25);
            voteItem.advisorPictureLabel.pixmap(pic);
         }
         if (voteItem.advisorName && voteItem.advisorTitle) {

            voteItem.advisorReasonLabel.text(
               "<b>" +
               voteItem.advisorName +
               " (" +
               voteItem.advisorTitle +
               ") </b>");
         }
         voteItem.yesVotesLabel.text("");
         voteItem.noVotesLabel.text("");
         voteItem.undecidedVotesLabel.text("");
         voteItem.endTimeLabel.text("");

         if (dmz.object.flag(hil, dmz.stance.AdminHandle) && !refresh) {

            voteItem.buttonLayout.insertWidget(0, voteItem.yesButton);
            voteItem.buttonLayout.insertWidget(1, voteItem.noButton);
            voteItem.buttonLayout.insertWidget(2, voteItem.timeBoxLabel);
            voteItem.buttonLayout.insertWidget(3, voteItem.timeBox);
            voteItem.textLayout.insertWidget(0, voteItem.decisionReasonLabel);
            voteItem.textLayout.insertWidget(1, voteItem.decisionReason);

            if (!LoginSkipped) {

               voteItem.yesButton.styleSheet("* { background-color: rgb(70, 240, 70); }");
               voteItem.noButton.styleSheet("* { background-color: rgb(240, 70, 70); }");
               voteItem.yesButton.observe(self, "clicked", function () {

                  createDecisionObject(true, voteItem.handle, voteItem.timeBox.value(), voteItem.decisionReason.text() || "Okay.");
                  //send vote is approved/active email (2)
                  if (SEND_MAIL) {

                     EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_ACTIVE);
                  }
               });
               voteItem.noButton.observe(self, "clicked", function () {

                  createDecisionObject(false, voteItem.handle, voteItem.timeBox.value(), voteItem.decisionReason.text() || "No.");
                  //send vote is denied email (3)
                  if (SEND_MAIL) {

                     EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_DENIED);
                  }
               });
            }
            else {

               voteItem.yesButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
               voteItem.noButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
            }
         }
      }
      else if (voteItem.state === dmz.stance.VOTE_ACTIVE) {

         voteItem.postItem.styleSheet("* { background-color: rgb(240, 240, 70); }")
         voteItem.stateLabel.text("<b>Vote Status: </b>" + dmz.stance.STATE_STR[voteItem.state]);
         voteItem.startTimeLabel.text(
            "<b>Approved: </b>" +
            (voteItem.startTime ?
               toDate(voteItem.startTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
         voteItem.endTimeLabel.text(
            "<b>Expires: </b>" +
            (voteItem.expiredTime ?
               toDate(voteItem.expiredTime).toString(dmz.stance.TIME_FORMAT) :
               "Less than 5 min ago"));
         if (voteItem.yesVotes !== undefined) {

            voteItem.yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
         }
         if (voteItem.noVotes !== undefined) {

            voteItem.noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
         }
         if ((voteItem.noVotes !== undefined) && (voteItem.yesVotes !== undefined)) {

            voteItem.undecidedVotesLabel.text(
               "<b>Undecided Votes: </b>" +
               (numberOfNonAdminUsers(voteItem.groupHandle) - (voteItem.yesVotes + voteItem.noVotes)));
         }
         if (voteItem.advisorPicture) {

            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorPicture));
            pic = pic.scaled(25, 25);
            voteItem.advisorPictureLabel.pixmap(pic);
         }
         if (voteItem.advisorReason && voteItem.advisorName && voteItem.advisorTitle) {

            voteItem.advisorReasonLabel.text(
               "<b>" +
               voteItem.advisorName +
               " (" +
               voteItem.advisorTitle +
               "): </b>" +
               voteItem.advisorReason);
         }
         if (!hasUserVoted(hil, voteItem.decisionHandle) &&
            !dmz.object.flag(hil, dmz.stance.AdminHandle) && !refresh) {

            voteItem.buttonLayout.insertWidget(0, voteItem.yesButton);
            voteItem.buttonLayout.insertWidget(1, voteItem.noButton);
            if (!LoginSkipped) {

               voteItem.yesButton.styleSheet("* { background-color: rgb(70, 240, 70); }");
               voteItem.noButton.styleSheet("* { background-color: rgb(240, 70, 70); }");
               voteItem.yesButton.observe(self, "clicked", function () {

                  userVoted(dmz.object.hil(), voteItem.decisionHandle, true);
                  voteItem.yesButton.hide();
                  voteItem.noButton.hide();
               });
               voteItem.noButton.observe(self, "clicked", function () {

                  userVoted(dmz.object.hil(), voteItem.decisionHandle, false);
                  voteItem.yesButton.hide();
                  voteItem.noButton.hide();
               });
            }
            else {

               voteItem.yesButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
               voteItem.noButton.styleSheet("* { background-color: rgb(130, 130, 130); }");
            }
         }
      }
   }
};

populateSubLists = function () {

   var hil = dmz.object.hil()
     , groupHandle = dmz.stance.getUserGroupHandle(hil)
     ;

   PastVotes = [];
   ActiveVotes = [];
   ApprovalVotes = [];
   Object.keys(AllVotes).forEach(function (key) {

      var voteItem = AllVotes[key];

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

isVoteOver = function (objHandle) {

   var decisionData
     , yesVotes
     , noVotes
     , totalUsers = numberOfNonAdminUsers(dmz.stance.getUserGroupHandle(dmz.object.hil()))
     , voteHandle
     , decisionHandle
     , tempHandles
     , voteState
     , voteItem = {}
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
   if (decisionHandle && totalUsers) {

      yesVotes = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
      noVotes = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
      yesVotes = yesVotes.length;
      noVotes = noVotes.length;
      voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState);

      if (voteHandle && (voteState !== dmz.stance.VOTE_NO) &&
         (voteState !== dmz.stance.VOTE_YES) &&
         (voteState !== dmz.stance.VOTE_EXPIRED)) {

         if (yesVotes && (yesVotes > (totalUsers / 2))) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
         }
         else if (noVotes && (noVotes >= (totalUsers / 2))) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
         }
      }
      else if (voteHandle && (voteState === dmz.stance.VOTE_EXPIRED) && !LoginSkipped) {

         if (noVotes >= yesVotes) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, false);
            dmz.object.timeStamp(
               decisionHandle,
               dmz.stance.EndedAtServerTimeHandle,
               dmz.object.timeStamp(decisionHandle, dmz.stance.ExpiredTimeHandle));
            // send vote failed email (3)
            if (SEND_MAIL) {

               tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
               if (tempHandles) {

                  tempHandles = dmz.object.subLinks(tempHandles[0], dmz.stance.GroupMembersHandle);
                  if (tempHandles) { voteItem.groupHandle = tempHandles[0]; }
               }
               voteItem.question = dmz.object.text(voteHandle, dmz.stance.TextHandle);
               voteItem.yesVotes = (dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || []).length;
               // the -1 is there to account for the fact that the mail function assumes that it is being
               // called before the function the adds 1 to the vote.
               voteItem.noVotes = (dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || []).length - 1;
               voteItem.advisorReason = dmz.object.text(decisionHandle, dmz.stance.TextHandle);
               voteItem.handle = voteHandle;
               if (voteItem.groupHandle && voteItem.question && (voteItem.yesVotes !== undefined) &&
                  (voteItem.noVotes !== undefined) && voteItem.advisorReason && voteItem.handle) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_NO);
               }
            }
         }
         else if (yesVotes > noVotes) {

            dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
            dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, false);
            dmz.object.timeStamp(
               decisionHandle,
               dmz.stance.EndedAtServerTimeHandle,
               dmz.object.timeStamp(decisionHandle, dmz.stance.ExpiredTimeHandle));
            // send vote is successful email (3)
            if (SEND_MAIL) {

               tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
               if (tempHandles) {

                  tempHandles = dmz.object.subLinks(tempHandles[0], dmz.stance.GroupMembersHandle);
                  if (tempHandles) { voteItem.groupHandle = tempHandles[0]; }
               }
               voteItem.question = dmz.object.text(voteHandle, dmz.stance.TextHandle);
               // the -1 is there to account for the fact that the mail function assumes that it is being
               // called before the function the adds 1 to the vote.
               voteItem.yesVotes = (dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || []).length - 1;
               voteItem.noVotes = (dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || []).length;
               voteItem.advisorReason = dmz.object.text(decisionHandle, dmz.stance.TextHandle);
               voteItem.handle = voteHandle;
               if (voteItem.groupHandle && voteItem.question && (voteItem.yesVotes !== undefined) &&
                  (voteItem.noVotes !== undefined) && voteItem.advisorReason && voteItem.handle) {

                  EmailMod.sendVoteEmail(voteItem, dmz.stance.VOTE_YES);
               }
            }
         }
      }
   }
};

/* VoteState is the only callback that refreshes the whole UI, while the isVoteOver
   function does have the ability to modify specific labels */
dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      if (newVal === dmz.stance.VOTE_EXPIRED) {

         /* callback couldn't handle recieving and changing a vote state
            at the same time, this is a tempporary workaround */
         dmz.time.setTimer(self, function () {

            isVoteOver(objHandle);
         });
      }
      else {

         var emailHandles
           , filteredHandles
           ;

         if ((prevVal === dmz.stance.VOTE_ACTIVE) && AllVotes[objHandle] && SEND_MAIL) {

            dmz.time.setTimer(self, function () {

               emailHandles = dmz.object.superLinks(objHandle, dmz.stance.VoteEmailLinkHandle) || [];
               filteredHandles = emailHandles.filter(function (emailHandle) {

                  return (dmz.object.scalar(emailHandle, dmz.stance.EmailPriorityHandle) === dmz.stance.PRIORITY_THIRD);
               });
               if ((filteredHandles === undefined) || !filteredHandles.length) {

                  populateAllVotes();
                  if (newVal === dmz.stance.VOTE_YES) {

                     AllVotes[objHandle].yesVotes -= 1;
                     EmailMod.sendVoteEmail(AllVotes[objHandle], dmz.stance.VOTE_YES);
                     AllVotes[objHandle].yesVotes += 1;
                  }
                  else if (newVal === dmz.stance.VOTE_NO) {

                     AllVotes[objHandle].noVotes -= 1;
                     EmailMod.sendVoteEmail(AllVotes[objHandle], dmz.stance.VOTE_NO);
                     AllVotes[objHandle].noVotes += 1;
                  }
               }
            });
         }
         VoteObjects[objHandle].state = newVal;
      }
   }
   if (AllVotes[objHandle]) { delete AllVotes[objHandle]; }
   populateAllVotes();
   if (isWindowOpen && AllVotes[objHandle] && AllVotes[objHandle].groupHandle &&
      (AllVotes[objHandle].groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

      openWindow();
   }
   // Prevents 100% live updates, but also prevents double notifications.
   /*if (dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle) ||
      (newVal !== dmz.stance.VOTE_APPROVAL_PENDING)) {

      MainModule.highlight("Vote");
   }*/
});

/* This is basically the admin notification function, it accounts for the
   admin being able to switch groups
*/
dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var lastUserTime
     , lastVoteTime = 0
     , adminFlag = dmz.object.flag(objHandle, dmz.stance.AdminHandle)
     , groupHandle = dmz.stance.getUserGroupHandle(objHandle)
     ;

   if (value) {

      Object.keys(AllVotes).forEach(function (key) {

         var voteItem = AllVotes[key];
         isVoteOver(voteItem.handle);
      });
   }
   if (value && adminFlag) {

      lastUserTime = dmz.stance.userAttribute(objHandle, dmz.stance.VoteTimeHandle);

      AllVotes = {};
      populateAllVotes();
      populateSubLists();
      PastVotes.forEach(function (voteItem) {

         if (voteItem.state === dmz.stance.VOTE_DENIED) {

            if ((voteItem.postedTime > lastVoteTime) && (groupHandle === voteItem.groupHandle)) {

               lastVoteTime = voteItem.postedTime;
            }
         }
         else {

            if ((voteItem.endTime > lastVoteTime) && (groupHandle === voteItem.groupHandle)) {

               lastVoteTime = voteItem.endTime;
            }
         }
      });
      ActiveVotes.forEach(function (voteItem) {

         if ((voteItem.startTime > lastVoteTime) && (groupHandle === voteItem.groupHandle)) {

            lastVoteTime = voteItem.startTime;
         }
      });
      ApprovalVotes.forEach(function (voteItem) {

         if ((voteItem.postedTime > lastVoteTime) && (groupHandle === voteItem.groupHandle)) {

            lastVoteTime = voteItem.postedTime;
         }
      });
      if (lastVoteTime > lastUserTime) {

         MainModule.highlight("Vote");
      }
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].question = newVal;
      refreshItemLabels();
   }
   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].advisorReason = newVal;
      refreshItemLabels();
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var voteItem
     , hil
     ;

   if (VoteObjects[objHandle]) {

      VoteObjects[objHandle].postedTime = newVal;
      refreshItemLabels();
      if (AllVotes[objHandle] && AllVotes[objHandle].groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil())) {

         if (newVal > dmz.stance.userAttribute(dmz.object.hil(), dmz.stance.VoteTimeHandle)) {

            MainModule.highlight("Vote");
         }
      }
   }
   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].startTime = newVal;
      refreshItemLabels();

      if (DecisionObjects[objHandle].voteHandle && AllVotes[DecisionObjects[objHandle].voteHandle]) {

         voteItem = AllVotes[DecisionObjects[objHandle].voteHandle];
         hil = dmz.object.hil();
         if ((voteItem.groupHandle === dmz.stance.getUserGroupHandle(hil)) &&
            (newVal > dmz.stance.userAttribute(hil, dmz.stance.VoteTimeHandle))) {

            MainModule.highlight("Vote");
         }
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   var voteItem
     , hil
     ;

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].endTime = newVal;
      refreshItemLabels();
      if (DecisionObjects[objHandle].voteHandle && AllVotes[DecisionObjects[objHandle].voteHandle]) {

         voteItem = AllVotes[DecisionObjects[objHandle].voteHandle];
         hil = dmz.object.hil();
         if ((voteItem.groupHandle === dmz.stance.getUserGroupHandle(hil)) &&
            (newVal > dmz.stance.userAttribute(hil, dmz.stance.VoteTimeHandle))) {

            MainModule.highlight("Vote");
         }
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.ExpiredTimeHandle,
function (objHandle, attrHandle, newVal, prevVal) {

   if (DecisionObjects[objHandle]) {

      DecisionObjects[objHandle].expiredTime = newVal;
      refreshItemLabels();
   }
});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      VoteObjects[supHandle].advisorHandle = subHandle;
      refreshItemLabels();
   }
   if (DecisionObjects[supHandle]) {

      DecisionObjects[supHandle].voteHandle = subHandle;
      if (VoteObjects[subHandle]) {

         VoteObjects[subHandle].decisionHandle = supHandle;
      }
      refreshItemLabels();
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (VoteObjects[supHandle]) {

      VoteObjects[supHandle].userHandle = subHandle;
      populateAllVotes();
      if (isWindowOpen && AllVotes[supHandle] && AllVotes[supHandle].groupHandle &&
         (AllVotes[supHandle].groupHandle === dmz.stance.getUserGroupHandle(dmz.object.hil()))) {

         openWindow();
      }
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (DecisionObjects[subHandle]) {

      DecisionObjects[subHandle].yesVotes = (DecisionObjects[subHandle].yesVotes || 0) + 1;
      isVoteOver(subHandle);
      refreshItemLabels();
   }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (DecisionObjects[subHandle]) {

      DecisionObjects[subHandle].noVotes = (DecisionObjects[subHandle].noVotes || 0) + 1;
      isVoteOver(subHandle);
      refreshItemLabels();
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.VoteType)) {

      VoteObjects[objHandle] = { handle: objHandle };
   }
   else if (objType.isOfType(dmz.stance.DecisionType)) {

      DecisionObjects[objHandle] = { handle: objHandle };
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
      //duration *= 60; //convert to minutes (for testing)
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

      if (voteItem.state === dmz.stance.VOTE_DENIED) {

         if (voteItem.postedTime > latestTime) { latestTime = voteItem.postedTime; }
      }
      else {

         if (voteItem.endTime > latestTime) { latestTime = voteItem.endTime; }
      }
   });
   ActiveVotes.forEach(function (voteItem) {

      if (voteItem.startTime > latestTime) { latestTime = voteItem.startTime; }
   });
   ApprovalVotes.forEach(function (voteItem) {

      if (voteItem.postedTime > latestTime) { latestTime = voteItem.postedTime; }
   });

   if (latestTime) {

      dmz.stance.userAttribute(dmz.object.hil(), dmz.stance.VoteTimeHandle, latestTime);
   }
};

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Vote", voteForm, openWindow, closeWindow);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();
