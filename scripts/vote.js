var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , spinBox: require("dmz/ui/spinBox")
      , consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
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

   //, postItem = dmz.ui.loader.load("PostItem.ui")
   //, avatarLabel = postItem.lookup("avatarLabel")
   //, postItem2 = dmz.ui.loader.load("PostItem.ui")

   // Functions

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
   , resetLayout
   , initVoteForm
   , getTopVote
   , getPreviousVotes
   , displayPastVotes
   , createDecisionObject
   , userVoted
   , voteExpired
   , voteObserveFunction
   , init
   ;

voteExpired = function (voteHandle) {

   var decisionHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle)
     , decisionHandle
     , yesVotes
     , noVotes
     ;

   decisionHandle.forEach(function (handle) {

      decisionHandle = handle;
   });

   yesVotes = dmz.object.superLinks(decisionHandle, dmz.stance.YesHandle);
   noVote = dmz.object.superLinks(decisionHandle, dmz.stance.NoHandle);

   if (noVotes.length >= yesVotes.length) {

      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
   }
   else{

      dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
   }
};

voteObserveFunction = function(linkHandle, attrHandle, superHandle, subHandle) {

   var userGroupHandle = dmz.stance.getUserGroupHandle(superHandle)
     , numberInGroup = dmz.object.superLinks(userGroupHandle, dmz.stance.GroupMembersHandle)
     , noVotes = dmz.object.superLinks(subHandle, dmz.stance.NoHandle)
     , yesVotes = dmz.object.superLinks(subHandle, dmz.stance.YesHandle)
     , tempHandles
     , voteHandle
     , itor = 0
     , adminFlag
     ;

   if (numberInGroup) {

      numberInGroup.forEach(function (userHandle) {

         adminFlag = dmz.object.flag(userHandle, dmz.stance.AdminHandle);
         if (adminFlag === true) {

            itor += 1;
         }
      });
      numberInGroup = numberInGroup.length - itor;
      if (noVotes) {

         if (noVotes.length >= numberInGroup / 2) {

            tempHandles = dmz.object.subLinks(subHandle, dmz.stance.VoteLinkHandle);
            if (tempHandles) {
               tempHandles.forEach(function (voteHandle) {

                  dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_NO);
               });
               dmz.object.flag(subHandle, dmz.stance.UpdateEndTimeHandle, true);
            }
         }
      }
      if (yesVotes) {

         if (yesVotes.length > numberInGroup / 2) {

            tempHandles = dmz.object.subLinks(subHandle, dmz.stance.VoteLinkHandle);
            if (tempHandles) {

               tempHandles.forEach(function (voteHandle) {

                  dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_YES);
               });
               dmz.object.flag(subHandle, dmz.stance.UpdateEndTimeHandle, true);
            }
         }
      }
   }
}

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, superHandle, subHandle) {

   voteObserveFunction(linkHandle, attrHandle, superHandle, subHandle);
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, superHandle, subHandle){

   voteObserveFunction(linkHandle, attrHandle, superHandle, subHandle);
});

userVoted = function (userHandle, decisionHandle, vote) {

   switch (vote) {

      case (true):

         dmz.object.link(dmz.stance.YesHandle, userHandle, decisionHandle);
         break;
      case (false):

         dmz.object.link(dmz.stance.NoHandle, userHandle, decisionHandle);
         break;
   }
};

createDecisionObject = function (decisionValue, voteHandle, duration, reason) {

   var decision = dmz.object.create(dmz.stance.DecisionType);
   dmz.object.activate(decision);

   dmz.object.link(dmz.stance.VoteLinkHandle, decision, voteHandle);
   dmz.object.timeStamp(decision, dmz.stance.CreatedAtServerTimeHandle, 0);
   dmz.object.flag(decision, dmz.stance.UpdateStartTimeHandle, true);
   dmz.object.text(decision, dmz.stance.TextHandle, reason);

   switch (decisionValue) {

      case (true):

         dmz.object.timeStamp(decision, dmz.stance.EndedAtServerTimeHandle, 0);
         dmz.object.flag(decision, dmz.stance.UpdateEndTimeHandle, true);
         duration *= 3600; //convert to unix seconds
         dmz.object.timeStamp(decision, dmz.stance.DurationHandle, duration);
         dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_ACTIVE);
         break;
      case (false):

         dmz.object.scalar(voteHandle, dmz.stance.VoteState, dmz.stance.VOTE_DENIED);
         break;
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
};

getTopVote = function (hil) {

   var groupHandle = dmz.stance.getUserGroupHandle(hil)
     , groupAdvisorHandles = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
     ;

   ApprovalVotes = [];
   ActiveVotes = [];
   if (groupAdvisorHandles) {

      groupAdvisorHandles.forEach(function (advisorHandle) {

         var advisorVoteHandles = dmz.object.superLinks(advisorHandle, dmz.stance.VoteLinkHandle);
         if (advisorVoteHandles) {

            advisorVoteHandles.forEach(function (voteHandle) {

               var voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState)
                 , handle = voteHandle
                 , createdBy
                 , startTime
                 , endTime
                 , duration
                 , question
                 , result
                 , status
                 , advisorReason
                 , decisionHandle
                 , postItem = dmz.ui.loader.load("VoteViewPost.ui")
                 , buttonLayout = postItem.lookup("buttonLayout")
                 , textLayout = postItem.lookup("textLayout")
                 , postedByLabel = postItem.lookup("postedBy")
                 , startTimeLabel = postItem.lookup("startTime")
                 , endTimeLabel = postItem.lookup("endTime")
                 , avatarLabel = postItem.lookup("avatarLabel")
                 , questionLabel = postItem.lookup("question")
                 , statusLabel = postItem.lookup("status")
                 , yesVotesLabel = postItem.lookup("yesVotes")
                 , noVotesLabel = postItem.lookup("noVotes")
                 , reasonLabel = postItem.lookup("reason")
                 , yesButton = dmz.ui.button.createPushButton("Approve")
                 , noButton = dmz.ui.button.createPushButton("Deny")
                 , timeBox = dmz.ui.spinBox.createSpinBox("timeBox")
                 , decisionReason = dmz.ui.textEdit.create("decisionReason")
                 , userPicture
                 , tempHandles
                 , userLinks
                 , reason
                 , previouslyVoted = false
                 ;

               yesButton.setStyleSheet("* { background-color: rgb(90, 230, 90); border-width: 5px; }");
               noButton.setStyleSheet("* { background-color: rgb(230, 90, 90); border-width: 5px; }");
               buttonLayout.insertWidget(0, yesButton);
               buttonLayout.insertWidget(1, noButton);
               decisionReason.text("Decision Reason: ");

               tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
               if (tempHandles) {

                  tempHandles.forEach(function (handle) {

                     createdBy = dmz.object.text(handle, dmz.stance.DisplayNameHandle);
                     userPicture = dmz.object.text(handle, dmz.stance.PictureHandle);
                  });
               }
               status = voteState;

               question = dmz.object.text(voteHandle, dmz.stance.TextHandle);
               postedByLabel.text("Posted By: " + createdBy);
               questionLabel.text("Poll Question: " + question);
               statusLabel.text("Current Status: " + dmz.stance.STATE_STR[status]);
               avatarLabel.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile(userPicture)));

               switch (voteState) {

                  case (dmz.stance.VOTE_APPROVAL_PENDING):

                     startTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);
                     postItem.setStyleSheet("* { background-color: rgb(230, 230, 230); border-width: 5px; }");
                     startTimeLabel.text("Posted At: " + startTime);

                     timeBox.maximum(24);
                     timeBox.minimum(1);
                     timeBox.text("Duration:");
                     buttonLayout.insertWidget(2, timeBox);
                     textLayout.insertWidget(0, decisionReason);
                     startTimeLabel.text("");
                     endTimeLabel.text("");
                     reasonLabel.text("");
                     yesVotesLabel.text("");
                     noVotesLabel.text("");

                     yesButton.observe(self, "clicked", function () {

                        duration = timeBox.value();
                        reason = decisionReason.text();
                        createDecisionObject(true, handle, duration, reason);
                        yesButton.hide();
                        noButton.hide();
                        timeBox.hide();
                        decisionReason.hide();
                        initVoteForm();
                     });
                     noButton.observe(self, "clicked", function () {

                        reason = decisionReason.text();
                        createDecisionObject(false, handle, 0, reason);
                        yesButton.hide();
                        noButton.hide();
                        timeBox.hide();
                        decisionReason.hide();
                        initVoteForm();
                     });

                     ApprovalVotes.push(
                          { handle: handle
                          , createdBy: createdBy
                          , question: question
                          , status: status
                          , startTime: startTime
                          , postItem: postItem
                          });
                     break;
                  case (dmz.stance.VOTE_ACTIVE):

                     tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
                     tempHandles.forEach(function (handle) {

                        /* see if user has voted before */
                        userLinks = dmz.object.superLinks(handle, dmz.stance.NoHandle);
                        if (userLinks) {
                           userLinks.forEach(function (userHandle) {

                              if (userHandle === hil) { previouslyVoted = true; }
                           });
                        }
                        userLinks = dmz.object.superLinks(handle, dmz.stance.YesHandle);
                        if (userLinks) {
                           userLinks.forEach(function (userHandle) {

                              if (userHandle === hil) { previouslyVoted = true; }
                           });
                        }
                        if (previouslyVoted) {

                           yesButton.hide();
                           noButton.hide();
                        }

                        /* Set various values */
                        decisionHandle = handle;
                        startTime = dmz.object.timeStamp(handle, dmz.stance.CreatedAtServerTimeHandle);
                        endTime = dmz.object.timeStamp(handle, dmz.stance.EndedAtServerTimeHandle);
                        duration = endTime - startTime;
                        advisorReason = dmz.object.text(handle, dmz.stance.TextHandle);
                     });

                     postItem.setStyleSheet("* { background-color: rgb(210, 210, 30); border-width: 5px; }");
                     startTimeLabel.text("Posted At: " + startTime);
                     endTimeLabel.text("Ending At: " + endTime);
                     reasonLabel.text("Advisor Reply: " + advisorReason);
                     yesVotesLabel.text("");
                     noVotesLabel.text("");

                     yesButton.observe(self, "clicked", function () {

                        userVoted(hil, decisionHandle, true);
                        yesButton.hide();
                        noButton.hide();
                        initVoteForm();
                     });
                     noButton.observe(self, "clicked", function () {

                        userVoted(hil, decisionHandle, false);
                        yesButton.hide();
                        noButton.hide();
                        initVoteForm();
                     });

                     ActiveVotes.push(
                         { handle: handle
                         , createdBy: createdBy
                         , question: question
                         , status: status
                         , startTime: startTime
                         , endTime: endTime
                         , duration: duration
                         , advisorReason: advisorReason
                         , decisionHandle: decisionHandle
                         , postItem: postItem
                         });
                     break;
               }
            });
         }
      });
   }
};

getPreviousVotes = function (hil) {

   var groupHandle = dmz.stance.getUserGroupHandle(hil)
     , groupAdvisorHandles = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
     , groupVoteHandles = []
     ;

   PastVotes = [];
   if (groupAdvisorHandles) {

      groupAdvisorHandles.forEach(function (advisorHandle) {

         var advisorVoteHandles = dmz.object.superLinks(advisorHandle, dmz.stance.VoteLinkHandle);
         if (advisorVoteHandles) {

            advisorVoteHandles.forEach(function (voteHandle) {

               groupVoteHandles.push(voteHandle);
            });
         }
      });

      if (groupVoteHandles.length) {

         groupVoteHandles.forEach(function (voteHandle) {

            var voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState);
            if (voteState !== dmz.stance.VOTE_APPROVAL_PENDING &&
                voteState !== dmz.stance.VOTE_ACTIVE) {

               var handle = voteHandle
                 , createdBy
                 , startTime
                 , endTime
                 , duration
                 , question
                 , result
                 , status
                 , advisorReason
                 , decisionHandle
                 , yesVotes
                 , noVotes
                 , postItem = dmz.ui.loader.load("VoteViewPost.ui")
                 , postedByLabel = postItem.lookup("postedBy")
                 , startTimeLabel = postItem.lookup("startTime")
                 , endTimeLabel = postItem.lookup("endTime")
                 , questionLabel = postItem.lookup("question")
                 , statusLabel = postItem.lookup("status")
                 , yesVotesLabel = postItem.lookup("yesVotes")
                 , noVotesLabel = postItem.lookup("noVotes")
                 , reasonLabel = postItem.lookup("reason")
                 , avatarLabel = postItem.lookup("avatarLabel")
                 , userPicture
                 , tempHandles
                 ;

               // Get the vote creators user name
               tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
               if (tempHandles) {

                  tempHandles.forEach(function (handle) {

                     createdBy = dmz.object.text(handle, dmz.stance.DisplayNameHandle);
                     userPicture = dmz.object.text(handle, dmz.stance.PictureHandle);
                  });
               }
               // Get the question, status of the vote
               question = dmz.object.text(voteHandle, dmz.stance.TextHandle);
               status = voteState;
               // Get the advisorReason from the Decision object
               tempHandles = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
               if (tempHandles) {

                  tempHandles.forEach(function (handle) {

                     decisionHandle = handle;
                     // Get the start time, end time, reason and duration of the vote
                     startTime = dmz.object.timeStamp(handle, dmz.stance.CreatedAtServerTimeHandle);
                     endTime = dmz.object.timeStamp(handle, dmz.stance.EndedAtServerTimeHandle);
                     duration = endTime - startTime; //might not work, check later
                     advisorReason = dmz.object.text(handle, dmz.stance.TextHandle);
                     yesVotes = dmz.object.superLinks(handle, dmz.stance.YesHandle);
                     noVotes = dmz.object.superLinks(handle, dmz.stance.NoHandle);

                     yesVotes = (yesVotes) ? yesVotes.length : 0;
                     noVotes = (noVotes) ? noVotes.length : 0;
                  });
               }
               // create the post item
               if (postItem) {
                  switch (status) {

                     case (dmz.stance.VOTE_YES):

                        postItem.setStyleSheet("* { background-color: rgb(90, 230, 90); border-width: 5px; }");
                        break;
                     case (dmz.stance.VOTE_NO):

                        postItem.setStyleSheet("* { background-color: rgb(230, 90, 90); border-width: 5px; }");
                        break;
                     case (dmz.stance.VOTE_DENIED):

                        postItem.setStyleSheet("* { background-color: rgb(180, 40, 40); border-width: 5px; }");
                        break;
                  }
               }
               avatarLabel.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile(userPicture)));
               postedByLabel.text("Posted By: " + createdBy);
               startTimeLabel.text("Posted At: " + startTime);
               endTimeLabel.text("Ended At: " + endTime);
               questionLabel.text("Poll Question: " + question);
               statusLabel.text("Current Status: " + dmz.stance.STATE_STR[status]);
               reasonLabel.text("Advisor Reply: " + advisorReason);
               yesVotesLabel.text("Yes Votes: " + yesVotes);
               noVotesLabel.text("No Votes: "+ noVotes);

               PastVotes.push(
                    { handle: handle
                    , createdBy: createdBy
                    , startTime: startTime
                    , endTime: endTime
                    , duration: duration
                    , question: question
                    , status: status
                    , advisorReason: advisorReason
                    , decisionHandle: decisionHandle
                    , postItem: postItem
                    });
            }
         });
      }
   }
};

displayPastVotes = function (hil) {

   var itor = 0
     , adminFlag = dmz.object.flag(hil, dmz.stance.AdminHandle)
     ;

   resetLayout();

   if (adminFlag) {

      ApprovalVotes.forEach(function (item) {

         myLayout.insertWidget(itor, item.postItem);
         itor += 1;
      });
   }
   else {

      ActiveVotes.forEach(function (item) {

         myLayout.insertWidget(itor, item.postItem);
         itor += 1;
      });
   }

   PastVotes.forEach(function (pastItem) {

      myLayout.insertWidget(itor, pastItem.postItem);
      itor += 1;
   });

};

initVoteForm = function () {

   var hil = dmz.object.hil();

   getPreviousVotes(hil);
   getTopVote(hil);
   displayPastVotes(hil);
};

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list
     ;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage
         ( "Vote"
         , voteForm
         , function () {

              initVoteForm();
           }
         );
   }
});

init = function () {

   myLayout = dmz.ui.layout.createVBoxLayout();
   content.layout(myLayout);
   myLayout.addStretch(1);
};

init();
