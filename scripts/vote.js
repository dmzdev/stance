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
   , previousHil = 0
   , AvatarDefault = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"))
   // Functions
   , toDate = dmz.util.timeStampToDate
   , pushVote
   , refreshView
   , isCompleteNewVote
   , voteLinkChanged
   , isObjectInMap
   , attrCallback
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
   , updateLastSeen
   , highlightNew
   , init
   ;

pushVote = function (voteHandle) {

   var status = dmz.object.scalar(voteHandle, dmz.stance.VoteState)
     , postedByHandle
     , postedBy
     , question = dmz.object.text(voteHandle, dmz.stance.TextHandle)
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

   if (isCompleteNewVote(voteHandle)) {

   tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
   postedByHandle = tempHandles[0];
   postedBy = dmz.object.text(postedByHandle, dmz.stance.DisplayNameHandle);
   userAvatar = dmz.object.text(postedByHandle, dmz.stance.PictureHandle);

   tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.VoteLinkHandle);
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
      decisionHandle = tempHandles[0];
      startTime = dmz.object.timeStamp(decisionHandle, dmz.stance.CreatedAtServerTimeHandle);
      endTime = dmz.object.timeStamp(decisionHandle, dmz.stance.EndedAtServerTimeHandle);
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
      yesVotes = tempHandles.length;
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
      noVotes = tempHandles.length;
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
            , advisorAvatar: advisorAvatar
            , advisorReason: advisorReason
            , postItem: postItem
            });

   }
   else if (status === dmz.stance.VOTE_DENIED) {

      postItem.setStyleSheet("* { background-color: rgb(20, 20, 20); border-width: 5px; color: white; }");
      postedTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);

      tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
      decisionHandle = tempHandles[0];

      advisorReason = dmz.object.text(decisionHandle, dmz.stance.TextHandle);

      PastVotes.push (
            { handle: voteHandle
            , userAvatar: userAvatar
            , postedBy: postedBy
            , startTime: postedTime
            , question: question
            , status: status
            , advisorAvatar: advisorAvatar
            , advisorReason: advisorReason
            , postItem: postItem
            });

   }
   else if (status === dmz.stance.VOTE_APPROVAL_PENDING) {

      yesButton = dmz.ui.button.createPushButton("Approve");
      yesButton.setStyleSheet("* { background-color: rgb(70, 230, 70); }")
      noButton = dmz.ui.button.createPushButton("Deny");
      noButton.setStyleSheet("* { background-color: rgb(230, 70, 70); }")
      buttonLayout = postItem.lookup("buttonLayout");
      textLayout = postItem.lookup("textLayout");
      timeBox = dmz.ui.spinBox.createSpinBox("timeBox");
      timeBox.minimum(24);
      timeBox.maximum(72);
      timeBox.setSingleStep(24);
      timeBox.setSuffix("hrs");
      timeBoxLabel = dmz.ui.label.create("<b>Duration: </b>");
      decisionReason = dmz.ui.textEdit.create("");
      decisionReason.fixedSize(750, 100);
      decisionReasonLabel = dmz.ui.label.create("<b>Decision Reason: </b>");
      timeBoxLabel.sizePolicy(8, 0);

      postItem.setStyleSheet("* { background-color: rgb(230, 230, 230); border-width: 5px; }");
      buttonLayout.insertWidget(0, yesButton);
      buttonLayout.insertWidget(1, noButton);
      buttonLayout.insertWidget(2, timeBoxLabel);
      buttonLayout.insertWidget(3, timeBox);
      textLayout.insertWidget(0, decisionReasonLabel);
      textLayout.insertWidget(1, decisionReason);

      yesButton.observe(self, "clicked", function () {

         createDecisionObject(true, voteHandle, timeBox.value(), decisionReason.text() || "Okay.");
         refreshView();
      });
      noButton.observe(self, "clicked", function () {

         createDecisionObject(false, voteHandle, timeBox.value(), decisionReason.text() || "No.");
         refreshView();
      });

      postedTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);

      ApprovalVotes.push (
            { handle: voteHandle
            , userAvatar: userAvatar
            , postedBy: postedBy
            , startTime: postedTime
            , question: question
            , status: status
            , postItem: postItem
            });
   }
   else if (status === dmz.stance.VOTE_ACTIVE) {

      yesButton = dmz.ui.button.createPushButton("Approve");
      yesButton.setStyleSheet("* { background-color: rgb(70, 230, 70); }")
      noButton = dmz.ui.button.createPushButton("Deny");
      noButton.setStyleSheet("* { background-color: rgb(230, 70, 70); }")
      buttonLayout = postItem.lookup("buttonLayout");

      tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
      decisionHandle = tempHandles[0];
      advisorReason = dmz.object.text(decisionHandle, dmz.stance.TextHandle);

      if (!hasUserVoted(dmz.object.hil(), decisionHandle)
          && !dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle)) {

         buttonLayout.insertWidget(0, yesButton);
         buttonLayout.insertWidget(1, noButton);
         yesButton.observe(self, "clicked", function () {

            userVoted(dmz.object.hil(), decisionHandle, true);
            refreshView();
         });
         noButton.observe(self, "clicked", function () {

            userVoted(dmz.object.hil(), decisionHandle, false);
            refreshView();
         });
      }

      postItem.setStyleSheet("* { background-color: rgb(200, 200, 40); border-width: 5px; }");

      startTime = dmz.object.timeStamp(decisionHandle, dmz.stance.CreatedAtServerTimeHandle);
      endTime = dmz.object.timeStamp(decisionHandle, dmz.stance.EndedAtServerTimeHandle);
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
      yesVotes = tempHandles.length;
      tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
      noVotes = tempHandles.length;

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
            , advisorAvatar: advisorAvatar
            , advisorReason: advisorReason
            , postItem: postItem
            });
   }
   }
};

resetLayout = function () {

   var widget;

   if (content && myLayout) {

      widget = myLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = myLayout.takeAt(0);
      };
   }
   myLayout.addStretch(1);
};

refreshView = function () {

   var hil = dmz.object.hil()
     , adminFlag = dmz.object.flag(hil, dmz.stance.AdminHandle)
     , groupHandle = dmz.stance.getUserGroupHandle(hil)
     , nonAdminUsers
     , avatarPic
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
     , decisionReasonLabel
     , itor = 0
     , status
     ;

   resetLayout();
   if (groupHandle) {

      nonAdminUsers = numberOfNonAdminUsers(groupHandle);


      PastVotes.sort(function (obj1, obj2) {

         var result = obj2.startTime - obj1.startTime
           , returnVal = result ? result : 0;
           ;

         if (obj1.startTime === 0) {

            returnVal = -1;
         }
         else if (obj2.startTime === 0) {

            returnVal = 1;
         }

         return returnVal;
      });

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

         avatarPic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.userAvatar));
         avatarLabel.pixmap(avatarPic);
         postedByLabel.text("<b>Posted By: </b>" + voteItem.postedBy);
         questionLabel.text("<b>Question: </b>" + voteItem.question);
         statusLabel.text("<b>Status: </b>" + dmz.stance.STATE_STR[voteItem.status]);
      };

      if (adminFlag) {

         ApprovalVotes.forEach(function (voteItem) {

            postItem = voteItem.postItem;
            setLabels (postItem, voteItem);
            advisorAvatarLabel.text("");
            advisorReasonLabel.text("");
            yesVotesLabel.text("");
            noVotesLabel.text("");
            undecidedVotesLabel.text("");
            if (voteItem.startTime === 0) {

               startTimeLabel.text("<b>Posted At: </b>Less than 5 min ago")
            }
            else {

               startTimeLabel.text
                  ("<b>Posted At: </b>" + toDate(voteItem.startTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            }
            endTimeLabel.text("");

            myLayout.insertWidget(itor, postItem);
            postItem.show();
            itor += 1;
         });
      }
      ActiveVotes.forEach(function (voteItem) {

         postItem = voteItem.postItem;
         setLabels (postItem, voteItem);

         if (voteItem.startTime === 0) {

            startTimeLabel.text("<b>Start Time: </b>Less than 5 min ago")
         }
         else {

            startTimeLabel.text
               ("<b>Start Time: </b>" + toDate(voteItem.startTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
         }
         if (voteItem.endTime === 0) {

            endTimeLabel.text("<b>End Time: </b>calculating...")
         }
         else {

            endTimeLabel.text
               ("<b>End Time:</b>" + toDate(voteItem.endTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
         }
         yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
         noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
         undecidedVotesLabel.text
            ("<b>Undecided Votes: </b>" + (nonAdminUsers - voteItem.yesVotes - voteItem.noVotes));
         advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
         avatarPic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorAvatar));
         avatarPic = avatarPic.scaled(25, 25);
         advisorAvatarLabel.pixmap(avatarPic);

         myLayout.insertWidget(itor, postItem);
         postItem.show();
         itor += 1;
      });
      PastVotes.forEach(function (voteItem) {

         postItem = voteItem.postItem;
         setLabels (postItem, voteItem);

         status = voteItem.status;
         if (status === dmz.stance.VOTE_YES || status === dmz.stance.VOTE_NO) {

            startTimeLabel.text
               ("<b>Start Time: </b>" + toDate(voteItem.startTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            endTimeLabel.text
               ("<b>End Time: </b>" + toDate(voteItem.endTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
            noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
            undecidedVotesLabel.text("<b>Undecided Votes: </b>" +
                                     (nonAdminUsers - voteItem.yesVotes - voteItem.noVotes));
            advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
            avatarPic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorAvatar));
            avatarPic = avatarPic.scaled(25, 25);
            advisorAvatarLabel.pixmap(avatarPic);
         }
         else if (status === dmz.stance.VOTE_DENIED) {

            startTimeLabel.text("<b>Posted At: </b>" +
                                toDate(voteItem.startTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            advisorReasonLabel.text("<b>Advisor Reason: </b>" + voteItem.advisorReason);
            avatarPic = dmz.ui.graph.createPixmap(dmz.resources.findFile(voteItem.advisorAvatar));
            avatarPic = avatarPic.scaled(25, 25);
            advisorAvatarLabel.pixmap(avatarPic);
            endTimeLabel.text("");
            yesVotesLabel.text("");
            noVotesLabel.text("");
            undecidedVotesLabel.text("");
         }

         myLayout.insertWidget(itor, postItem);
         postItem.show();
         itor += 1;
      });
   }
};

voteLinkChanged = function (decisionHandle) {

   var voteHandle
     , tempHandles
     , tempValue
     , yesVotes
     , noVotes
     , totalUsers
     ;

   tempHandles = dmz.object.subLinks(decisionHandle, dmz.stance.VoteLinkHandle) || [];
   voteHandle = tempHandles[0];
   yesVotes = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
   yesVotes = yesVotes.length;
   noVotes = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
   noVotes = noVotes.length;
   tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle) || [];
   tempValue = tempHandles[0];
   tempHandles = dmz.object.subLinks(tempValue, dmz.stance.GroupMembersHandle) || [];
   tempValue = tempHandles[0];
   totalUsers = numberOfNonAdminUsers(tempValue);

   if (noVotes >= (totalUsers / 2)) {

      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
      dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
   }
   else if (yesVotes > (totalUsers / 2)) {

      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
      dmz.object.flag(decisionHandle, dmz.stance.UpdateEndTimeHandle, true);
   }
   else if (dmz.object.scalar(voteHandle, dmz.stance.VoteState) === dmz.stance.VOTE_EXPIRED) {

      dmz.object.scalar
         ( voteHandle, dmz.stance.VoteState,
           (noVotes > yesVotes) ? dmz.stance.VOTE_NO : dmz.stance.VOTE_YES
         );
   }
   else {

      updateFields(voteHandle);
   }
};

isCompleteNewVote = function (objHandle) {

   var state
     , completeObject = false;

   if (dmz.object.type(objHandle).isOfType(dmz.stance.VoteType)) {

      if (dmz.object.text(objHandle, dmz.stance.TextHandle)
          && dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle) !== undefined
          && dmz.object.flag(objHandle, dmz.stance.UpdateStartTimeHandle) !== undefined
          && dmz.object.subLinks(objHandle, dmz.stance.CreatedByHandle)) {

         state = dmz.object.scalar(objHandle, dmz.stance.VoteState);
         if (state === dmz.stance.VOTE_APPROVAL_PENDING) { completeObject = true; }
         else {

            if (state && dmz.object.superLinks(objHandle, dmz.stance.VoteLinkHandle)) {

               completeObject = true;
            }
         }
      }
   }
   return completeObject;
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
      }
      itor += 1;
   });
};

updateFields = function (objHandle) {

   var state = dmz.object.scalar(objHandle, dmz.stance.VoteState)
     , voteItem
     , postItem
     , tempHandles
     , tempValue
     , decisionHandle
     , hil = dmz.object.hil()
     , adminFlag = dmz.object.flag(hil, dmz.stance.AdminHandle)
     , groupHandle = dmz.stance.getUserGroupHandle(hil)
     , nonAdminUsers = numberOfNonAdminUsers(groupHandle)
     , startTimeLabel
     , endTimeLabel
     , yesVotesLabel
     , noVotesLabel
     , undecidedVotesLabel
     , statusLabel
     ;

   if (groupHandle) {

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

         if (state === dmz.stance.VOTE_YES || state === dmz.stance.VOTE_NO
             || state === dmz.stance.VOTE_ACTIVE) {

            tempHandles = dmz.object.superLinks(objHandle, dmz.stance.VoteLinkHandle);
            decisionHandle = tempHandles[0];
            voteItem.startTime = dmz.object.timeStamp(decisionHandle, dmz.stance.CreatedAtServerTimeHandle);
            voteItem.endTime = dmz.object.timeStamp(decisionHandle, dmz.stance.EndedAtServerTimeHandle);
            voteItem.status = state;
            tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle) || [];
            voteItem.yesVotes = tempHandles.length;
            tempHandles = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle) || [];
            voteItem.noVotes = tempHandles.length;

            postItem = voteItem.postItem;
            startTimeLabel = postItem.lookup("startTime");
            endTimeLabel = postItem.lookup("endTime");
            yesVotesLabel = postItem.lookup("yesVotes");
            noVotesLabel = postItem.lookup("noVotes");
            undecidedVotesLabel = postItem.lookup("undecidedVotes");

            if (voteItem.startTime === 0) {

               startTimeLabel.text("<b>Start Time: </b>Less than 5 min ago")
            }
            else {

               startTimeLabel.text
                  ("<b>Start Time: </b>" + toDate(voteItem.startTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            }
            if (voteItem.endTime === 0) {

               endTimeLabel.text("<b>End Time: </b>calculating...")
            }
            else {

               endTimeLabel.text
                  ("<b>End Time:</b>" + toDate(voteItem.endTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            }
            yesVotesLabel.text("<b>Yes Votes: </b>" + voteItem.yesVotes);
            noVotesLabel.text("<b>No Votes: </b>" + voteItem.noVotes);
            undecidedVotesLabel.text
               ("<b>Undecided Votes: </b>" + (nonAdminUsers - voteItem.yesVotes - voteItem.noVotes));
         }
         else if (state === dmz.stance.VOTE_APPROVAL_PENDING || state === dmz.stance.VOTE_DENIED) {

            voteItem.startTime = dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle);
            voteItem.status = state;
            postItem = voteItem.postItem;
            startTimeLabel = postItem.lookup("startTime");

            if (voteItem.startTime === 0) {

               startTimeLabel.text("<b>Posted At: </b>Less than 5 min ago")
            }
            else {

               startTimeLabel.text
                  ("<b>Posted At: </b>" + toDate(voteItem.startTime).toString("MMM-dd-yyyy hh:mm:ss tt"));
            }
         }
      }
   }
};

isObjectInMap = function (objHandle) {

   var inMap = false;

   PastVotes.forEach(function (voteItem) {

      if (voteItem.handle === objHandle) { inMap = true; };
   });
   ApprovalVotes.forEach(function (voteItem) {

      if (voteItem.handle === objHandle) { inMap = true; };
   });
   ActiveVotes.forEach(function (voteItem) {

      if (voteItem.handle === objHandle) { inMap = true; };
   });

   return inMap;
};

attrCallback = function (objHandle, attrHandle, newVal, prevVal) {

   if (!isObjectInMap(objHandle)) {

      if (isCompleteNewVote(objHandle)) {

         pushVote(objHandle);
         refreshView();
      }
   }
   else {

      updateFields();
   }
};

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandleFilter, newVal, prevVal) {

   if (!isObjectInMap(objHandle)) {

      if (isCompleteNewVote(objHandle)) {

         pushVote(objHandle);
         refreshView();
      }
   }
   else {

      if (newVal === dmz.stance.VOTE_EXPIRED) {

         voteLinkChanged(objHandle);
      }

      removeFromMaps(objHandle);
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var hil
     , groupHandle
     , tempHandles
     , advisorHandles
     , voteHandles
     ;

   if (value) {

      if (objHandle != previousHil) {

         PastVotes = [];
         ApprovalVotes = [];
         ActiveVotes = [];
         previousHil = objHandle;
         groupHandle = dmz.stance.getUserGroupHandle(hil);
         advisorHandles = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle) || [];
         advisorHandles.forEach(function (advisorHandle) {

            voteHandles = dmz.object.superLinks(advisorHandle, dmz.stance.VoteLinkHandle) || [];
            voteHandles.forEach(function (voteHandle) {

               attrCallback(voteHandle);
            });
         });
      }
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle, attrCallback);

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle, attrCallback);

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle, attrCallback);

dmz.object.flag.observe(self, dmz.stance.UpdateEndTimeHandle, attrCallback);

dmz.object.flag.observe(self, dmz.stance.UpdateStartTimeHandle, attrCallback);

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (!isObjectInMap(subHandle)) {

      if (isCompleteNewVote(subHandle)) {

         pushVote(subHandle);
         refreshView();
      }
   }
   else {

      removeFromMaps(subHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (!isObjectInMap(supHandle)) {

      if (isCompleteNewVote(supHandle)) {

         pushVote(supHandle);
         refreshView();
      }
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   voteLinkChanged(subHandle);
   refreshView();
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   voteLinkChanged(subHandle);
   refreshView();
});

userVoted = function (userHandle, decisionHandle, vote) {

   dmz.object.link(vote ? dmz.stance.YesHandle : dmz.stance.NoHandle, userHandle, decisionHandle);
};

hasUserVoted = function (userHandle, decisionHandle) {

   var tempHandles = dmz.object.subLinks(userHandle, dmz.stance.YesHandle) || []
     , userVoted = false;

   if (tempHandles.indexOf(decisionHandle)) { userVoted = true; }

   tempHandles = dmz.object.subLinks(userHandle, dmz.stance.NoHandle) || [];
   if (tempHandles.indexOf(decisionHandle)) { userVoted = true; }

   return userVoted;
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

   self.log.error ("Need to adjust Latest vote timestamp update to userAttribute call");
   dmz.object.timeStamp(dmz.object.hil(), dmz.stance.VoteTimeHandle, latestTime);
};

highlightNew = function () {

   var latestSeen = dmz.object.timeStamp(dmz.object.hil(), dmz.stance.VoteTimeHandle);
   self.log.error ("Need to adjust Latest seen call to userAttribute call");
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

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Vote", voteForm, updateLastSeen);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   content.layout(myLayout);
   myLayout.addStretch(1);
};

init();
