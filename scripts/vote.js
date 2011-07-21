var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , phonon: require("dmz/ui/phonon")
      , treeWidget: require("dmz/ui/treeWidget")
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
            }
      */
   , PastVotes = []
   , ApprovalVote
   , ActiveVote
   // Functions
   , initVoteForm
   , getTopVote
   , getPreviousVotes
   , approveVote
   , denyVote
   , voteYes
   , voteNo
   ;

approveVote = function () {

}

denyVote = function () {

}

voteYes = function () {

}

voteNo = function () {

}

getTopVote = function (hil) {

   var groupHandle = dmz.stance.getUserGroupHandle(hil)
     , groupAdvisorHandles = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
     ;

   ApprovalVote = false;
   ActiveVote = false;
   if (groupAdvisorHandles) {

      groupAdvisorHandles.forEach(function (advisorHandle) {

         var advisorVoteHandles = dmz.object.superLinks(advisorHandle, dmz.stance.VoteLinkHandle);
         if (advisorVoteHandles) {

            advisorVoteHandles.forEach(function (voteHandle) {

               var voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState)
                 , handle = voteHandle
                 , createdBy //
                 , startTime
                 , endTime
                 , duration
                 , question
                 , result
                 , status
                 , advisorReason
                 , decisionHandle
                 , tempHandles
                 ;

               tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
               if (tempHandles) {

                  tempHandles.forEach(function (handle) {

                     createdBy = dmz.object.text(handle, dmz.stance.DisplayNameHandle);
                  });
               }
               question = dmz.object.text(voteHandle, dmz.stance.TextHandle);
               status = voteState;

               switch (voteState) {

                  case (dmz.stance.VOTE_APPROVAL_PENDING):

                     startTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);
                     ApprovalVote =
                          { handle: handle
                          , createdBy: createdBy
                          , question: question
                          , status: status
                          , startTime: startTime
                          }
                     break;
                  case (dmz.stance.VOTE_ACTIVE):

                     tempHandles = dmz.object.suprLinks(voteHandle, dmz.stance.VoteLinkHandle);
                     tempHandles.forEach(function (handle) {

                        decisionHandle = handle;
                        startTime = dmz.object.timeStamp(handle, dmz.stance.CreatedAtServerTimeHandle);
                        endTime = dmz.object.timeStamp(handle, dmz.stance.EndAtServerTimeHandle);
                        duration = endTime - startTime;
                        advisorReason = dmz.object.text(handle, dmz.stance.TextHandle);
                     });
                     ActiveVote =
                         { handle: handle
                         , createdBy: createdBy
                         , question: question
                         , status: status
                         , startTime: startTime
                         , endTime: endTime
                         , duration: duration
                         , advisorReason: advisorReason
                         , decisionHandle: decisionHandle
                         }
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

   PastVotes = []
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
                 , tempHandles
                 ;

               // Get the vote creators user name
               tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
               if (tempHandles) {

                  tempHandles.forEach(function (handle) {

                     createdBy = dmz.object.text(handle, dmz.stance.DisplayNameHandle);
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
                  });
               }
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
                    });
            }
         });
      }
   }
};

initVoteForm = function () {

   var adminFlag
     , hil = dmz.object.hil()
     ;

   adminFlag = dmz.object.flag(hil, dmz.stance.AdminHandle);
   if (adminFlag) {

      if (adminFlag === true) {

         // admin user
      }
   }
   else {

      // normal user
   }
   getPreviousVotes(hil);
   getTopVote(hil);
   self.log.error(PastVotes);
   self.log.error(ApprovalVote);
   self.log.error(ActiveVote);
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
