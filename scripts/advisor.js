var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
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

   // Variables
   , advisorWidgets = []
   , advisorData = {}
   , groupAdvisors = {}
   , advisorCount = 5

   // Function decls
   , updateAdvisor
   , approveVote
   ;


(function () {

   var idx;
   for (idx = 0; idx < advisorCount; idx += 1) {

      advisorWidgets[idx] = dmz.ui.loader.load("AdvisorWindow.ui");
   }
}());

approveVote = function (voteHandle) {

   VoteTextArea.text(dmz.object.text(voteHandle, dmz.const.TextHandle));
   ApproveVoteDialog.open(self, function (result) {

      dmz.object.flag(voteHandle, dmz.const.VoteApprovedHandle, result);
      dmz.object.flag(voteHandle, dmz.const.VoteSubmittedHandle, false);
      VoteTextArea.text("");
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
                       , text = advisorWidgets[idx].lookup("taskingText")
                       , list
                       ;

                     text = text ? text.text() : "";
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

                           dmz.object.scalar(vote, dmz.const.VoteThresholdHandle, list.length / 2);
                           self.log.warn ("Threshold:", list.length / 2);
                           list.forEach(function (userHandle) {

                              dmz.object.link(dmz.const.VoteUndecidedHandle, vote, userHandle);
                           });
                        }
                        dmz.object.link(dmz.const.VoteGroupHandle, vote, hilGroup);
                        dmz.object.link(dmz.const.VoteAdvisorHandle, vote, advisorHandle);
                     }
                     text.text("");
                  });

                  btn = advisorWidgets[idx].lookup("submitTaskButton");
                  textEdit = advisorWidgets[idx].lookup("taskingText");

                  // If there isn't a vote active for the hil group
                  // Add sanity check to ensure online?
                  if (dmz.object.superLinks(hilGroup, dmz.const.VoteGroupHandle)) {

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

dmz.object.flag.observe(self, dmz.const.VoteApprovedHandle,
function (objHandle, attr, value, prev) {

   if (value) {
      // Instructor approved vote.

   }
   else {
      // Instructor denied vote.

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
     ;
   if (dmz.object.flag(objHandle, dmz.const.AdminFlagHandle)) {

      hilGroup = dmz.object.superLinks(objHandle, dmz.const.GroupMembersHandle);
      if (hilGroup && hilGroup[0]) {

         hilGroup = hilGroup[0];
         vote = dmz.object.superLinks(hilGroup, dmz.const.VoteGroupHandle);
         if (vote && vote[0]) {

            vote = vote[0];
            if (dmz.object.flag(vote, dmz.const.VoteSubmittedHandle)) { approveVote(vote); }
         }
      }
   }
});

dmz.object.link.observe(self, dmz.const.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   var vote
   if (dmz.object.flag(userHandle, dmz.const.AdminFlagHandle)) {

      vote = dmz.object.superLinks(hilGroup, dmz.const.VoteGroupHandle);
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
