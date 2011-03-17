var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , treeWidget: require("dmz/ui/treeWidget")
      , widget: require("dmz/ui/widget")
      }
   , const: require("const")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , time: require("dmz/runtime/time")
   }

   // UI Elements
   , ApproveVoteDialog = dmz.ui.loader.load("ApproveVoteDialog.ui")
   , VoteTextArea = ApproveVoteDialog.lookup("taskingText")
   , VoteOpinionArea = ApproveVoteDialog.lookup("opinionText")

   , VoteDialog = dmz.ui.loader.load("VoteDialog.ui")
   , YesList = VoteDialog.lookup("yesList")
   , NoList = VoteDialog.lookup("noList")
   , UndecList = VoteDialog.lookup("undecList")
   , TaskText = VoteDialog.lookup("taskingText")
   , VoteCommentText = VoteDialog.lookup("opinionText")

   // Variables
   , advisorWidgets = []
   , advisorData = {}
   , groupAdvisors = {}
   , advisorCount = 5
   , UserVoteListItems = {}
   , voteHistoryWidgets = {}

   // Function decls
   , updateAdvisor
   , approveVote
   , fillList
   , getUserGroupHandle
   , getVoteGroupHandle
   , getVoteStatusString
   ;

dmz.object.scalar.observe(self, dmz.const.ID, function (objHandle, attr, value) {

   if (voteHistoryWidgets[objHandle]) { voteHistoryWidgets[objHandle].text(0, value); }
});

dmz.object.timeStamp.observe(self, dmz.const.CreatedAtHandle, function (handle, attr, value) {

   if (voteHistoryWidgets[handle]) { voteHistoryWidgets[handle].text(5, value * 1000); }
});

getUserGroupHandle = function (userHandle) {

   var userGroupHandle = 0
     , retval = 0
     ;
   if (userHandle) {

      userGroupHandle = dmz.object.superLinks(userHandle, dmz.const.GroupMembersHandle);
      if (userGroupHandle && userGroupHandle[0]) { retval = userGroupHandle[0]; }
   }
   return retval;
};

getVoteGroupHandle = function (voteHandle) {

   var voteGroupHandle = 0
     , retval = 0
     ;

   if (voteHandle) {

      voteGroupHandle = dmz.object.superLinks(voteHandle, dmz.const.GroupActiveVoteHandle);
      if (voteGroupHandle && voteGroupHandle[0]) { retval = voteGroupHandle[0]; }
   }
   return retval;
};

getVoteStatusString = function (voteHandle) {

   var status = "E: " + voteHandle;
   if (dmz.object.flag(voteHandle, dmz.const.VoteResultHandle) === true) { status = "PASSED"; }
   else if (dmz.object.flag(voteHandle, dmz.const.VoteResultHandle) === false) { status = "FAILED"; }
   else {

      if (dmz.object.flag(voteHandle, dmz.const.VoteSubmitted) === true) { status = "SBMITD"; }
      else if (dmz.object.flag(voteHandle, dmz.const.VoteSubmitted) === false) {

         if (dmz.object.flag(voteHandle, dmz.const.VoteApproved) === true) { status = "ACTIVE"; }
         else if (dmz.object.flag(voteHandle, dmz.const.VoteApproved) === false) { status = "DENIED"; }
      }
   }
   return status;
}

(function () {

   var idx;
   for (idx = 0; idx < advisorCount; idx += 1) {

      advisorWidgets[idx] = dmz.ui.loader.load("AdvisorWindow.ui");
   }
}());

approveVote = function (voteHandle) {

   VoteTextArea.text(dmz.object.text(voteHandle, dmz.const.TextHandle));
   ApproveVoteDialog.open(self, function (result, dialog) {

      var text;
      dmz.object.flag(voteHandle, dmz.const.VoteApprovedHandle, result);
      dmz.object.flag(voteHandle, dmz.const.VoteSubmittedHandle, false);
      text = VoteOpinionArea.text();
      if (!text || !text.length) { text = "I have no opinion on this matter."; }
      dmz.object.text(voteHandle, dmz.const.VoteCommentHandle, text);
      VoteOpinionArea.text("");
      VoteTextArea.text("");
   });
}

updateAdvisor = function (module, idx) {

   module.addPage("Advisor" + idx, advisorWidgets[idx], function () {

      var handle
        , hil = dmz.object.hil()
        , hilGroup = getUserGroupHandle(hil)
        , advisorHandle
        , data
        , btn
        , textEdit
        , vote
        ;

      self.log.warn ("update", idx +":", hil, hilGroup);
      if (hil && hilGroup && groupAdvisors[hilGroup] && (idx < groupAdvisors[hilGroup].length)) {

         advisorHandle = groupAdvisors[hilGroup][idx];
         if (advisorHandle) {

            data = advisorData[advisorHandle];
            if (data.name) { advisorWidgets[idx].lookup("nameLabel").text(data.name); }
            if (data.bio) { advisorWidgets[idx].lookup("bioText").text(data.bio); }
            if (data.picture) { advisorWidgets[idx].lookup("pictureLabel").pixmap(data.picture); }

            // Need to disable this unless online?
            advisorWidgets[idx].observe(self, "submitTaskButton", "clicked", function () {

               var vote
                 , textWidget = advisorWidgets[idx].lookup("taskingText")
                 , list
                 , text
                 , opinText
                 , count = 0
                 , groupVotes
                 ;

               text = textWidget ? textWidget.text() : "";
               if (text.length) {

                  vote = dmz.object.create(dmz.const.VoteType);
                  dmz.object.activate(vote);
                  dmz.object.flag(vote, dmz.const.ActiveHandle, true);
                  dmz.object.flag(vote, dmz.const.VoteSubmittedHandle, true);
                  dmz.object.link(dmz.const.CreatedByHandle, vote, hil);
                  dmz.object.timeStamp(hil, dmz.const.CreatedAtHandle, dmz.time.getFrameTime());
                  dmz.object.text(vote, dmz.const.TextHandle, text);
                  list = dmz.object.subLinks(hilGroup, dmz.const.GroupMembersHandle);
                  self.log.warn (vote, "["+list+"]")
                  if (list && list.length) {

                     list.forEach(function (userHandle) {

                        if (!dmz.object.flag(userHandle, dmz.const.AdminFlagHandle)) {

                           self.log.warn("Linking:", vote, userHandle);
                           dmz.object.link(dmz.const.VoteUndecidedHandle, vote, userHandle);
                           count += 1;
                        }
                     });
                     dmz.object.scalar(vote, dmz.const.VoterTotalHandle, count);
                  }
                  dmz.object.link(dmz.const.GroupActiveVoteHandle, hilGroup, vote);
                  dmz.object.link(dmz.const.VoteAdvisorHandle, advisorHandle, vote);
                  groupVotes = dmz.object.subLinks(hilGroup, dmz.const.GroupCompletedVotesHandle);
                  groupVotes = groupVotes ? groupVotes.length : 0;
                  dmz.object.scalar(vote, dmz.const.ID, groupVotes + 1);
               }
               textWidget.text("");
            });

            btn = advisorWidgets[idx].lookup("submitTaskButton");
            textEdit = advisorWidgets[idx].lookup("taskingText");

            // If there isn't a vote active for the hil group
            // Add sanity check to ensure online?
            vote = dmz.object.subLinks(hilGroup, dmz.const.GroupActiveVoteHandle);
            if (vote && vote[0] && dmz.object.flag(vote[0], dmz.const.ActiveHandle)) {

               btn.text("Advisors Tasked");
               btn.enabled(false);
               textEdit.enabled(false);
               textEdit.text("");
            }
            else {

               btn.text("Submit Task");
               btn.enabled(true);
               textEdit.enabled(true);
            }
         }
      }
   });
};


fillList = function (uiList, handleList) {

   if (uiList) {

      uiList.clear();
      if (handleList) {

         handleList.forEach(function (userHandle) {

            UserVoteListItems[userHandle] = uiList.addItem(dmz.const._getDisplayName(userHandle));
         });
      }
   }
};

dmz.object.link.observe(self, dmz.const.VoteYesHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
     ;

   self.log.warn ("Vote Yes:", "["+undecHandleList+"]", "["+yesHandleList+"]", "["+noHandleList+"]", dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle));
   if (UserVoteListItems[userHandle] &&
      ((undecHandleList && (undecHandleList.indexOf(userHandle) !== -1)) ||
         (noHandleList && (noHandleList.indexOf(userHandle) !== -1)))) {

      YesList.addItem(UserVoteListItems[userHandle]);
   }
   self.log.warn ("Vote Yes 2:"
      , dmz.object.flag(voteHandle, dmz.const.ActiveHandle) && yesHandleList && (yesHandleList.length > (dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2))
      , dmz.object.flag(voteHandle, dmz.const.ActiveHandle)
      , yesHandleList.length
      , dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2
      , yesHandleList.length > (dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2)
      );
   if (dmz.object.flag(voteHandle, dmz.const.ActiveHandle) && yesHandleList &&
      (yesHandleList.length >
         (dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2))) {

      dmz.object.flag(voteHandle, dmz.const.ActiveHandle, false);
      dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, true);
   }
});

dmz.object.link.observe(self, dmz.const.VoteNoHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
     ;

//   self.log.warn ("Vote No:", "["+undecHandleList+"]", "["+yesHandleList+"]", "["+noHandleList+"]");
   if (UserVoteListItems[userHandle] &&
       ((undecHandleList && (undecHandleList.indexOf(userHandle) !== -1)) ||
          (yesHandleList && (yesHandleList.indexOf(userHandle) !== -1)))) {

      NoList.addItem(UserVoteListItems[userHandle]);
   }

   if (dmz.object.flag(voteHandle, dmz.const.ActiveHandle)) {

      self.log.warn ("Vote denied:"
         , !undecHandleList
         , (noHandleList &&
              (noHandleList.length >
                 dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle))));

      if (!undecHandleList ||
         (noHandleList &&
            (noHandleList.length >=
               (dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle) / 2)))) {

         dmz.object.flag(voteHandle, dmz.const.ActiveHandle, false);
         dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, false);
      }
   }
});

dmz.object.flag.observe(self, dmz.const.VoteResultHandle,
function (objHandle, attr, value, prev) {

   var groupHandle = getVoteGroupHandle(objHandle)
     , link
     ;

   self.log.warn ("VoteResult:", "["+groupHandle+"]");
   if (groupHandle) {

      self.log.warn("Vote Result LinkHandle: "
         , dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, groupHandle, objHandle)
         , objHandle
         , groupHandle
         );
      dmz.object.unlink(dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, groupHandle, objHandle));
      dmz.object.link(dmz.const.GroupCompletedVotesHandle, groupHandle, objHandle);
   }
});

dmz.object.flag.observe(self, dmz.const.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , linkHandle
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteUndecidedHandle);
     ;

//   self.log.warn ("vote approved:",
//      dmz.object.flag(objHandle, dmz.const.ActiveHandle),
//      undecHandleList,
//      undecHandleList ? (undecHandleList.indexOf(hil) !== -1) : "false");

   if (hil && !dmz.object.flag(hil, dmz.const.AdminFlagHandle)) {

//      self.log.warn ("Vote approved,", dmz.const._getDisplayName(hil), "is not an admin");
      if (dmz.object.flag(objHandle, dmz.const.ActiveHandle) &&
         undecHandleList && (undecHandleList.indexOf(hil) !== -1)) {

         if (value) {

            // Instructor approved vote.
            fillList(YesList, dmz.object.subLinks(objHandle, dmz.const.VoteYesHandle));
            fillList(NoList, dmz.object.subLinks(objHandle, dmz.const.VoteNoHandle));
            fillList(UndecList, undecHandleList);

            VoteDialog.observe(self, "yesButton", "clicked", function () {

//               self.log.warn("Yes LinkHandle: "
//                  , dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil)
//                  , objHandle
//                  , hil
//                  );
               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.const.VoteYesHandle, objHandle, hil);
            });
            VoteDialog.observe(self, "noButton", "clicked", function () {

//               self.log.warn("No LinkHandle: "
//               , dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil)
//               , objHandle
//               , hil
//               );
               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.const.VoteNoHandle, objHandle, hil);
            });

            VoteOpinionArea.text(dmz.object.text(objHandle, dmz.const.VoteCommentHandle));
            TaskText.text(dmz.object.text(objHandle, dmz.const.TextHandle));
            self.log.error("Vote approved open");
            VoteDialog.open(self, function (value) {});
         }
         else {

            // Instructor denied vote.
            linkHandle = dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil);
            self.log.warn ("Denied Vote link handle:", linkHandle);
            if (linkHandle) {

               dmz.ui.messageBox.create(
                  { type: dmz.ui.messageBox.Warning
                  , text: "The following vote was denied: " +
                       dmz.object.text(objHandle, dmz.const.TextHandle)
                  , informativeText: dmz.object.text(objHandle, dmz.const.VoteCommentHandle)
                  , standardButtons: [dmz.ui.messageBox.Ok]
                  , defaultButton: dmz.ui.messageBox.Ok
                  }
//                  , dmz.ui.mainWindow.centralWidget()
               ).open(self, function (value) {

                 dmz.object.unlink(linkHandle);
                 dmz.object.link(dmz.const.VoteNoHandle, objHandle, hil);
               });
            }
         }
      }
   }
});

dmz.object.flag.observe(self, dmz.const.ActiveHandle,
function (objHandle, attr, value, prev) {

   var type = dmz.object.type(objHandle)
     , hil = dmz.object.hil()
     , hilGroup = getUserGroupHandle(hil)
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteNoHandle)
     , total
     ;

   if (hil && type && type.isOfType(dmz.const.VoteType) &&
      (dmz.object.flag(objHandle, dmz.const.VoteApprovedHandle) ||
         dmz.object.flag(objHandle, dmz.const.VoteSubmittedHandle))) {

      self.log.warn
         ( "Active:"
         , hilGroup
         , dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, hilGroup, objHandle)
         , dmz.object.linkHandle(dmz.const.GroupCompletedVotesHandle, hilGroup, objHandle)
         );

      if (hilGroup &&
         (dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, hilGroup, objHandle) ||
            dmz.object.linkHandle(dmz.const.GroupCompletedVotesHandle, hilGroup, objHandle))) {

         advisorWidgets.forEach(function (widget) {

            var btn = widget.lookup("submitTaskButton")
              , textEdit = widget.lookup("taskingText")
              ;
            btn.text(value ? "Advisors Tasked" : "Submit Task");
            btn.enabled(!value);
            textEdit.enabled(!value);
            textEdit.text("");
         });
      }
   }
});

dmz.object.flag.observe(self, dmz.const.VoteSubmitted,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , hilGroup = getUserGroupHandle(hil)
     ;

   if (value) {

      if (dmz.object.flag(hil, dmz.const.AdminFlagHandle) && hilGroup &&
         dmz.object.linkHandle(dmz.const.GroupActiveVoteHandle, hilGroup, objHandle)) {

         approveVote(objHandle);
      }
   }
});

dmz.object.link.observe(self, dmz.const.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   if (groupHandle && (groupHandle === getUserGroupHandle(dmz.object.hil()))) {

      advisorWidgets.forEach(function (widget) {

         var btn = widget.lookup("submitTaskButton")
           , textEdit = widget.lookup("taskingText")
           ;
         btn.text("Advisors Tasked");
         btn.enabled(false);
         textEdit.enabled(false);
         textEdit.text("");
      });
   }
});

dmz.object.unlink.observe(self, dmz.const.GroupActiveVoteHandle,
function (linkObjHandle, attrHandle, groupHandle, voteHandle) {

   if (groupHandle && (groupHandle === getUserGroupHandle(dmz.object.hil()))) {

      advisorWidgets.forEach(function (widget) {

         var btn = widget.lookup("submitTaskButton")
           , textEdit = widget.lookup("taskingText")
           ;
         btn.text("Submit Task");
         btn.enabled(true);
         textEdit.enabled(true);
         textEdit.text("");
      });
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var hilGroup = getUserGroupHandle(objHandle)
     , vote
     , undecHandleList
     , linkHandle
     ;

   if (value && hilGroup) {

      vote = dmz.object.subLinks(hilGroup, dmz.const.GroupActiveVoteHandle);
      if (vote && vote[0]) {

         vote = vote[0];
         undecHandleList = dmz.object.subLinks(vote, dmz.const.VoteUndecidedHandle);

         if (dmz.object.flag(vote, dmz.const.ActiveHandle)) {

            if (dmz.object.flag(objHandle, dmz.const.AdminFlagHandle)) {

               if (dmz.object.flag(vote, dmz.const.VoteSubmittedHandle)) { approveVote(vote); }
            }
            else if (dmz.object.flag(vote, dmz.const.VoteApprovedHandle) === false) {

               self.log.warn ("Vote not approved. Submitted:", dmz.object.flag(vote, dmz.const.VoteSubmittedHandle));
               if (dmz.object.flag(vote, dmz.const.VoteSubmittedHandle) === false) {

                  linkHandle = dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle);
                  self.log.warn ("Denied Vote link handle:", linkHandle);
                  if (linkHandle) {

                     dmz.ui.messageBox.create(
                        { type: dmz.ui.messageBox.Warning
                        , text: "The following vote was denied: " +
                             dmz.object.text(vote, dmz.const.TextHandle)
                        , informativeText: dmz.object.text(vote, dmz.const.VoteCommentHandle)
                        , standardButtons: [dmz.ui.messageBox.Ok]
                        , defaultButton: dmz.ui.messageBox.Ok
                        }
                     ).open(self, function (value) {

                       dmz.object.unlink(linkHandle);
                       if (!dmz.object.subLinks(vote, dmz.const.VoteUndecidedHandle)) {

                          dmz.object.flag(vote, dmz.const.VoteResultHandle, false);
                       }
                     });
                  }
               }
            }
            else if ((dmz.object.flag(vote, dmz.const.VoteApprovedHandle) === true) &&
                    undecHandleList && (undecHandleList.indexOf(objHandle) !== -1)) {

               fillList(YesList, dmz.object.subLinks(vote, dmz.const.VoteYesHandle));
               fillList(NoList, dmz.object.subLinks(vote, dmz.const.VoteNoHandle));
               fillList(UndecList, undecHandleList);

               VoteDialog.observe(self, "yesButton", "clicked", function () {

                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.const.VoteYesHandle, vote, objHandle);
               });
               VoteDialog.observe(self, "noButton", "clicked", function () {

                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.const.VoteNoHandle, vote, objHandle);
               });

               VoteCommentText.text(dmz.object.text(vote, dmz.const.VoteCommentHandle));
               TaskText.text(dmz.object.text(vote, dmz.const.TextHandle));
               VoteDialog.open(self, function (value) {});
            }
         }
         else {

            self.log.error ("Vote is in active slot but is not active!");
         }
      }
   }
});

dmz.object.link.observe(self, dmz.const.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   var vote;
   if (dmz.object.flag(userHandle, dmz.const.AdminFlagHandle)) {

      vote = dmz.object.subLinks(groupHandle, dmz.const.GroupActiveVoteHandle);
      if (vote && vote[0] && dmz.object.flag(vote[0], dmz.const.VoteSubmittedHandle)) {

         approveVote(vote[0]);
      }
   }
});

dmz.object.text.observe(self, dmz.const.NameHandle, function (handle, attr, value) {

   var index
     , hilGroup = getUserGroupHandle(dmz.object.hil())
     ;

   self.log.info ("NameHandle:", handle, value);
   if (advisorData[handle]) { advisorData[handle].name = value; self.log.warn ("NameHandle:", handle, value); }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("nameLabel").text(value);
      }
   }
});

dmz.object.link.observe(self, dmz.const.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   var file
     , directory
     , votes
     ;
   if (!groupAdvisors[groupHandle]) { groupAdvisors[groupHandle] = []; }
   if (groupAdvisors[groupHandle].length <= advisorCount) {

      groupAdvisors[groupHandle].push(advisorHandle);
      if (!advisorData[advisorHandle]) {

         advisorData[advisorHandle] =
            { bio: dmz.object.text(advisorHandle, dmz.const.BioHandle)
            , name: dmz.const._getDisplayName(advisorHandle)
            , picture: false
            , taskFunction: false
            , voteWidgets: []
            };

         file = dmz.object.text(advisorHandle, dmz.const.PictureFileNameHandle);
         directory = dmz.object.text(advisorHandle, dmz.const.PictureDirectoryNameHandle);
         if (file && file.length && directory && directory.length) {

            file = dmz.ui.graph.createPixmap(directory + file);
            if (file) { advisorData[advisorHandle].picture = file; }
         }

         votes = dmz.object.subLinks(advisorHandle, dmz.const.VoteAdvisorHandle);
         if (votes) {

            votes.forEach(function (voteHandle) {

               var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
                 , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
                 , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
                 , item
                 ;

               item = advisorWidgets[groupAdvisors[groupHandle].length - 1].add(
                  [ dmz.object.scalar(voteHandle, dmz.const.ID)
                  , getVoteStatusString(voteHandle)
                  , yesHandleList ? yesHandleList.length : 0
                  , noHandleList ? noHandleList.length : 0
                  , undecHandleList ? undecHandleList.length : 0
                  , new Date (dmz.object.timeStamp(voteHandle, dmz.const.CreatedAtHandle) * 1000)
                  ]
                  , voteHandle
                  , 0
                  );

               if (item) {

                  advisorData[advisorHandle].voteWidgets.push(item);
                  voteHistoryWidgets[voteHandle] = item;
               }
               else { self.log.error ("Error creating widget from:", voteHandle); }

            });
         }

         self.log.info
            ( "AdvisorData["+advisorHandle+"]:"
            , "name = " + advisorData[advisorHandle].name
            , "bio = " + advisorData[advisorHandle].bio
            , "picture = " + advisorData[advisorHandle].picture
            );
      }
   }
});

dmz.object.text.observe(self, dmz.const.BioHandle, function (handle, attr, value) {

   var index
     , hilGroup = getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) { advisorData[handle].bio = value; }
   if (hilGroup && groupAdvisors[hilGroup]) {

      index = groupAdvisors[hilGroup].indexOf(handle);
      if ((index !== -1) && (index < advisorCount)) {

         advisorWidgets[index].lookup("bioText").text(value);
      }
   }
});

dmz.object.text.observe(self, dmz.const.PictureDirectoryNameHandle,
function (handle, attr, value) {

   var index
     , file
     , hilGroup
     ;

   if (advisorData[handle]) {

      file = dmz.object.text(handle, dmz.const.PictureFileNameHandle)
      if (file && file.length) {

         file = dmz.ui.graph.createPixmap(value + file);
         if (file) {

            advisorData[handle].picture = file;
            hilGroup = getUserGroupHandle(dmz.object.hil());
            if (hilGroup && groupAdvisors[hilGroup]) {

               index = groupAdvisors[hilGroup].indexOf(handle);
               if ((index !== -1) && (index < advisorCount)) {

                  advisorWidgets[index].lookup("pictureLabel").pixmap(file);
               }
            }
         }
      }
   }
});

dmz.object.text.observe(self, dmz.const.PictureFileNameHandle,
function (handle, attr, value) {

   var index
     , file
     , hilGroup = getUserGroupHandle(dmz.object.hil())
     ;

   if (advisorData[handle]) {

      file = dmz.object.text(handle, dmz.const.PictureDirectoryNameHandle)
      if (file && file.length) {

         file = dmz.ui.graph.createPixmap(file + value);
         if (file) {

            advisorData[handle].picture = file;
            if (hilGroup && groupAdvisors[hilGroup]) {

               index = groupAdvisors[hilGroup].indexOf(handle);
               if ((index !== -1) && (index < advisorCount)) {

                  advisorWidgets[index].lookup("pictureLabel").pixmap(file);
               }
            }
         }
      }
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx;
   if (Mode === dmz.module.Activate) {

      for (idx = 0; idx < advisorCount; idx += 1) { updateAdvisor(module, idx); }
   }
});
