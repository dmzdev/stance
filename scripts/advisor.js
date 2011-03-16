var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , widget: require("dmz/ui/widget")
      }
   , const: require("const")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   }

   // UI Elements
   , ApproveVoteDialog = dmz.ui.loader.load("ApproveVoteDialog.ui")
   , VoteTextArea = ApproveVoteDialog.lookup("taskingText")

   , VoteDialog = dmz.ui.loader.load("VoteDialog.ui")
   , YesList = VoteDialog.lookup("yesList")
   , NoList = VoteDialog.lookup("noList")
   , UndecList = VoteDialog.lookup("undecList")
   , TaskText = VoteDialog.lookup("taskingText")

   // Variables
   , advisorWidgets = []
   , advisorData = {}
   , groupAdvisors = {}
   , advisorCount = 5
   , UserVoteListItems = {}

   // Function decls
   , updateAdvisor
   , approveVote
   , fillList
   ;


(function () {

   var idx;
   for (idx = 0; idx < advisorCount; idx += 1) {

      advisorWidgets[idx] = dmz.ui.loader.load("AdvisorWindow.ui");
   }
}());

approveVote = function (voteHandle) {

   VoteTextArea.text(dmz.object.text(voteHandle, dmz.const.TextHandle));
   ApproveVoteDialog.open(self, function (result, dialog) {

      dmz.object.flag(voteHandle, dmz.const.VoteApprovedHandle, result);
      dmz.object.flag(voteHandle, dmz.const.VoteSubmittedHandle, false);
      VoteTextArea.text("");

      self.log.warn ("vote approved:", result);
      if (!result) {

         self.log.warn ("Opening dialog");
         dmz.ui.inputDialog.create(
            { title: "Vote Denial"
            , label: "Reason for Vote Denial:"
            , text: "I feel like it."
            }
//            , dmz.ui.mainWindow.centralWidget()
         ).open(self, function (value, reason) {

            if (value) {

               if (!reason || (reason.length === 0)) { reason = "I feel like it."; }
               dmz.object.text(voteHandle, dmz.const.VoteDeniedTextHandle, reason);
            }
         });
      }
   });
}

updateAdvisor = function (module, idx) {

   module.addPage("Advisor" + idx, advisorWidgets[idx], function () {

      var handle
        , hil = dmz.object.hil()
        , hilGroup
        , advisorHandle
        , list
        , data
        , btn
        , textEdit
        , vote
        ;

      if (hil) {

         handle = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle);
         if (handle && handle[0]) {

            hilGroup = handle[0];
            list = groupAdvisors[hilGroup];
            if (list && list.length && (idx < list.length)) {

               advisorHandle = list[idx];
               if (handle) {

                  data = advisorData[advisorHandle];
                  if (data.name) { advisorWidgets[idx].lookup("nameLabel").text(data.name); }
                  if (data.bio) { advisorWidgets[idx].lookup("bioText").text(data.bio); }
                  if (data.picture) {

                     advisorWidgets[idx].lookup("pictureLabel").pixmap(data.picture);
                  }

                  // Need to disable this unless online?
                  advisorWidgets[idx].observe(self, "submitTaskButton", "clicked", function () {

                     var vote
                       , textWidget = advisorWidgets[idx].lookup("taskingText")
                       , list
                       , text
                       , count = 0
                       ;

                     text = textWidget ? textWidget.text() : "";
                     self.log.warn ("text:", text);
                     if (text.length) {

                        vote = dmz.object.create(dmz.const.VoteType);
                        dmz.object.activate(vote);
                        dmz.object.flag(vote, dmz.const.VoteSubmittedHandle, true);
                        dmz.object.flag(vote, dmz.const.ActiveHandle, true);
                        dmz.object.link(dmz.const.CreatedByHandle, vote, hil);
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
                        dmz.object.link(dmz.const.VoteGroupHandle, vote, hilGroup);
                        dmz.object.link(dmz.const.VoteAdvisorHandle, vote, advisorHandle);
                     }
                     textWidget.text("");
                  });

                  btn = advisorWidgets[idx].lookup("submitTaskButton");
                  textEdit = advisorWidgets[idx].lookup("taskingText");

                  // If there isn't a vote active for the hil group
                  // Add sanity check to ensure online?
                  vote = dmz.object.superLinks(hilGroup, dmz.const.VoteGroupHandle);
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

   self.log.warn ("Vote Yes:", "["+undecHandleList+"]", "["+yesHandleList+"]", "["+noHandleList+"]");
   dmz.object.unlinkSuperObjects(userHandle, dmz.const.VoteNoHandle);
   if (UserVoteListItems[userHandle] &&
      ((undecHandleList && (undecHandleList.indexOf(userHandle) !== -1)) ||
         (noHandleList && (noHandleList.indexOf(userHandle) !== -1)))) {

      YesList.addItem(UserVoteListItems[userHandle]);
   }
   if (dmz.object.flag(voteHandle, dmz.const.Active) && yesHandleList &&
      (yesHandleList.length >
         dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle))) {

      dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, true);
      dmz.object.flag(voteHandle, dmz.const.Active, false);
   }
});

dmz.object.link.observe(self, dmz.const.VoteNoHandle,
function (linkObjHandle, attrHandle, voteHandle, userHandle) {

   var undecHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(voteHandle, dmz.const.VoteNoHandle)
     ;

   self.log.warn ("Vote No:", "["+undecHandleList+"]", "["+yesHandleList+"]", "["+noHandleList+"]");
   dmz.object.unlinkSuperObjects(userHandle, dmz.const.VoteYesHandle);
   if (UserVoteListItems[userHandle] &&
       ((undecHandleList && (undecHandleList.indexOf(userHandle) !== -1)) ||
          (yesHandleList && (yesHandleList.indexOf(userHandle) !== -1)))) {

      NoList.addItem(UserVoteListItems[userHandle]);
   }

   if (dmz.object.flag(voteHandle, dmz.const.Active)) {

      self.log.warn ("Vote denied:"
         , !undecHandleList
         , (noHandleList &&
              (noHandleList.length >
                 dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle))));

      if (!undecHandleList ||
         (noHandleList &&
            (noHandleList.length >
               dmz.object.scalar(voteHandle, dmz.const.VoterTotalHandle)))) {

         dmz.object.flag(voteHandle, dmz.const.VoteResultHandle, false);
         dmz.object.flag(voteHandle, dmz.const.Active, false);
      }
   }
});

dmz.object.flag.observe(self, dmz.const.VoteResultHandle,
function (objHandle, attr, value, prev) {

   var groupHandle = dmz.object.subLinks(objHandle, dmz.const.VoteGroupHandle)
     , link
     ;

   if (groupHandle && groupHandle[0]) {

      self.log.warn("Vote Result LinkHandle: "
         , dmz.object.linkHandle(dmz.const.VoteGroupHandle, objHandle, groupHandle)
         , objHandle
         , groupHandle
         );
      dmz.object.unlink(
         dmz.object.linkHandle(dmz.const.VoteGroupHandle, objHandle, groupHandle));
      dmz.object.link(dmz.const.GroupCompletedVotesHandle, groupHandle, objHandle);
   }

});

dmz.object.flag.observe(self, dmz.const.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , linkHandle
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteUndecidedHandle);
     ;

   self.log.warn ("vote approved:",
      dmz.object.flag(objHandle, dmz.const.ActiveHandle),
      undecHandleList,
      undecHandleList ? (undecHandleList.indexOf(hil) !== -1) : "false");

   if (hil && !dmz.object.flag(hil, dmz.const.AdminFlagHandle)) {

      self.log.warn ("Vote approved,", dmz.const._getDisplayName(hil), "is not an admin");
      if (dmz.object.flag(objHandle, dmz.const.ActiveHandle) &&
         undecHandleList && (undecHandleList.indexOf(hil) !== -1)) {

         if (value) {

            // Instructor approved vote.
            fillList(YesList, dmz.object.subLinks(objHandle, dmz.const.VoteYesHandle));
            fillList(NoList, dmz.object.subLinks(objHandle, dmz.const.VoteNoHandle));
            fillList(UndecList, undecHandleList);

            VoteDialog.observe(self, "yesButton", "clicked", function () {

               self.log.warn("Yes LinkHandle: "
                  , dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil)
                  , objHandle
                  , hil
                  );
               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.const.VoteYesHandle, objHandle, hil);
            });
            VoteDialog.observe(self, "noButton", "clicked", function () {

               self.log.warn("No LinkHandle: "
               , dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil)
               , objHandle
               , hil
               );
               dmz.object.unlink(
                  dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, objHandle, hil));
               dmz.object.link(dmz.const.VoteNoHandle, objHandle, hil);
            });

            TaskText.text(dmz.object.text(objHandle, dmz.const.TextHandle));
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
                  , informativeText: "It was denied for the following reason: " +
                       dmz.object.text(objHandle, dmz.const.VoteDeniedTextHandle)
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
     , hilGroup = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle)
     , undecHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteUndecidedHandle)
     , yesHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteYesHandle)
     , noHandleList = dmz.object.subLinks(objHandle, dmz.const.VoteNoHandle)
     , total
     ;

   if (hil && type && type.isOfType(dmz.const.VoteType)) {

      if (hilGroup && hilGroup[0] &&
         dmz.object.linkHandle(dmz.const.VoteGroupHandle, objHandle, hilGroup[0])) {

         if (value) {

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
      if (value) {

         total = dmz.object.scalar(objHandle, dmz.const.VoterTotalHandle);
         if (yesHandleList && (yesHandleList.length > total)) {

            dmz.object.flag(objHandle, dmz.const.VoteResultHandle, true);
            dmz.object.flag(objHandle, dmz.const.Active, false);
         }
         else if (!undecHandleList ||
                 (noHandleList &&
                    (noHandleList.length >
                       dmz.object.scalar(objHandle, dmz.const.VoterTotalHandle)))) {

            dmz.object.flag(objHandle, dmz.const.VoteResultHandle, false);
            dmz.object.flag(objHandle, dmz.const.Active, false);
         }
      }
   }
});

dmz.object.flag.observe(self, dmz.const.VoteSubmitted,
function (objHandle, attr, value, prev) {

   var hil = dmz.object.hil()
     , hilGroup
     , vote
     ;

   if (value) {

      if (dmz.object.flag(hil, dmz.const.AdminFlagHandle)) {

         hilGroup = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle);
         if (hilGroup && hilGroup[0] &&
            dmz.object.linkHandle(dmz.const.VoteGroupHandle, objHandle, hilGroup[0])) {

            approveVote(vote[0]);
         }
      }
   }
});

dmz.object.link.observe(self, dmz.const.VoteGroupHandle,
function (linkObjHandle, attrHandle, voteHandle, groupHandle) {

   var hilGroup = dmz.object.superLinks(dmz.object.hil(), dmz.const.GroupMembersHandle)
     ;

   if (hilGroup && hilGroup[0]) {

      hilGroup = hilGroup[0];
      if (groupHandle === hilGroup) {

         advisorWidgets.forEach(function (widget) {

            widget.lookup("submitTaskButton").enabled(false);
         });
      }
   }
});

dmz.object.unlink.observe(self, dmz.const.VoteGroupHandle,
function (linkObjHandle, attrHandle, voteHandle, groupHandle) {

   var hilGroup = dmz.object.superLinks(dmz.object.hil(), dmz.const.GroupMembersHandle)
     ;

   if (hilGroup && hilGroup[0]) {

      hilGroup = hilGroup[0];
      if (groupHandle === hilGroup) {

         advisorWidgets.forEach(function (widget) {

            widget.lookup("submitTaskButton").enabled(true);
         });
      }
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var hilGroup
     , vote
     , undecHandleList
     ;

   if (value) {

      hilGroup = dmz.object.superLinks(objHandle, dmz.const.GroupMembersHandle);
      if (hilGroup && hilGroup[0]) {

         hilGroup = hilGroup[0];
         vote = dmz.object.superLinks(hilGroup, dmz.const.VoteGroupHandle);
         if (vote && vote[0]) {

            vote = vote[0];
            undecHandleList = dmz.object.subLinks(vote, dmz.const.VoteUndecidedHandle);
            self.log.warn ("vote approved:"
               , objHandle
               , dmz.object.flag(objHandle, dmz.const.ActiveHandle)
               , undecHandleList
               , undecHandleList ? (undecHandleList.indexOf(objHandle) !== -1) : "false");

            if (dmz.object.flag(objHandle, dmz.const.AdminFlagHandle)) {

               self.log.warn ("New HIL:", dmz.const._getDisplayName(objHandle), "is an admin");
               if (dmz.object.flag(vote, dmz.const.VoteSubmittedHandle)) {

                  approveVote(vote);
               }
            }
            else if (dmz.object.flag(vote, dmz.const.ActiveHandle) &&
                    dmz.object.flag(vote, dmz.const.VoteApprovedHandle) &&
                    undecHandleList && (undecHandleList.indexOf(objHandle) !== -1)) {

               self.log.warn ("New HIL:", dmz.const._getDisplayName(objHandle), "is not an admin");
               fillList(YesList, dmz.object.subLinks(vote, dmz.const.VoteYesHandle));
               fillList(NoList, dmz.object.subLinks(vote, dmz.const.VoteNoHandle));
               fillList(UndecList, undecHandleList);

               VoteDialog.observe(self, "yesButton", "clicked", function () {

                  self.log.warn("Yes LinkHandle: "
                     , dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle)
                     , vote
                     , objHandle
                     );
                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.const.VoteYesHandle, vote, objHandle);
               });
               VoteDialog.observe(self, "noButton", "clicked", function () {

                  self.log.warn("No LinkHandle: "
                     , dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle)
                     , vote
                     , objHandle
                     );
                  dmz.object.unlink(
                     dmz.object.linkHandle(dmz.const.VoteUndecidedHandle, vote, objHandle));
                  dmz.object.link(dmz.const.VoteNoHandle, vote, objHandle);
               });

               TaskText.text(dmz.object.text(vote, dmz.const.TextHandle));
               VoteDialog.open(self, function (value) {});
            }
         }
      }
   }
});

dmz.object.link.observe(self, dmz.const.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   var vote;
   if (dmz.object.flag(userHandle, dmz.const.AdminFlagHandle)) {

      vote = dmz.object.superLinks(groupHandle, dmz.const.VoteGroupHandle);
      if (vote && vote[0]) {

         vote = vote[0];
         if (dmz.object.flag(vote, dmz.const.VoteSubmittedHandle)) { approveVote(vote); }
      }
   }
});

dmz.object.text.observe(self, dmz.const.NameHandle, function (handle, attr, value) {

   var index
     , hil = dmz.object.hil()
     , hilGroup
     ;

   if (advisorData[handle]) { advisorData[handle].name = value; }
   if (hil) {

      hilGroup = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle);
      if (hilGroup && hilGroup[0]) {

         hilGroup = hilGroup[0];
         index = groupAdvisors[hilGroup] ? groupAdvisors[hilGroup].indexOf(handle) : -1;
         if ((index !== -1) && (index < advisorCount)) {

            advisorWidgets[index].lookup("nameLabel").text(value);
         }
      }
   }
});

dmz.object.link.observe(self, dmz.const.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   var file
     , directory
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
            };

         file = dmz.object.text(advisorHandle, dmz.const.PictureFileNameHandle);
         directory = dmz.object.text(advisorHandle, dmz.const.PictureDirectoryNameHandle);
         if (file && file.length && directory && directory.length) {

            file = dmz.ui.graph.createPixmap(directory + file);
            if (file) { advisorData[advisorHandle].picture = file; }
         }
      }
   }
});

dmz.object.text.observe(self, dmz.const.BioHandle, function (handle, attr, value) {

   var index
     , hil = dmz.object.hil()
     , hilGroup
     ;

   if (advisorData[handle]) { advisorData[handle].bio = value; }
   if (hil) {

      hilGroup = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle);
      if (hilGroup && hilGroup[0]) {

         hilGroup = hilGroup[0];
         index = groupAdvisors[hilGroup] ? groupAdvisors[hilGroup].indexOf(handle) : -1;
         if ((index !== -1) && (index < advisorCount)) {

            advisorWidgets[index].lookup("bioText").text(value);
         }
      }
   }
});

dmz.object.text.observe(self, dmz.const.PictureDirectoryNameHandle,
function (handle, attr, value) {

   var index
     , file
     , hil = dmz.object.hil()
     , hilGroup
     ;

   if (advisorData[handle]) {

      file = dmz.object.text(handle, dmz.const.PictureFileNameHandle)
      if (file && file.length) {

         file = dmz.ui.graph.createPixmap(value + file);
         if (file) {

            advisorData[handle].picture = file;
            if (hil) {

               hilGroup = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle);
               if (hilGroup && hilGroup[0]) {

                  hilGroup = hilGroup[0];
                  index =
                     groupAdvisors[hilGroup] ? groupAdvisors[hilGroup].indexOf(handle) : -1;
                  if ((index !== -1) && (index < advisorCount)) {

                     advisorWidgets[index].lookup("pictureLabel").pixmap(file);
                  }
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
     , hilGroup
     ;

   if (advisorData[handle]) {

      file = dmz.object.text(handle, dmz.const.PictureDirectoryNameHandle)
      if (file && file.length) {

         file = dmz.ui.graph.createPixmap(file + value);
         if (file) {

            advisorData[handle].picture = file;
            hilGroup = dmz.object.superLinks(dmz.object.hil(), dmz.const.GroupMembersHandle);
            hilGroup = hilGroup.length ? hilGroup[0] : hilGroup;
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
