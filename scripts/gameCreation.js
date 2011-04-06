var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , consts: require('dmz/ui/consts')
      , label: require("dmz/ui/label")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , messageBox: require('dmz/ui/messageBox')
      , widget: require("dmz/ui/widget")
      , inputDialog: require("dmz/ui/inputDialog")
      , groupBox: require("dmz/ui/groupBox")
      , graph: require("dmz/ui/graph")
      }
   , stance: require("stanceConst")
   , data: require("dmz/runtime/data")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , resources: require("dmz/runtime/resources")
   , module: require("dmz/runtime/module")
   , email: require("email")
   }
   , DateJs = require("datejs/time")

   // UI Elements
   , editScenarioWidget = dmz.ui.loader.load("EditScenarioForm.ui")
   , groupStudentList = editScenarioWidget.lookup("groupStudentList")
   , ungroupedStudentList = editScenarioWidget.lookup("ungroupedStudentList")
   , groupComboBox = editScenarioWidget.lookup("groupComboBox")
   , gameStateButton = editScenarioWidget.lookup("gameStateButton")
   , forumComboBox = editScenarioWidget.lookup("forumList")
   , forumAssocList = editScenarioWidget.lookup("forumAssocList")
   , forumGroupList = editScenarioWidget.lookup("forumGroupList")
   , advisorGroupComboBox = editScenarioWidget.lookup("advisorGroupComboBox")
   , groupAdvisorList = editScenarioWidget.lookup("groupAdvisorList")

   , DockName = "Edit Scenario"
   , dock = dmz.ui.mainWindow.createDock
         ( DockName
         , { area: dmz.ui.consts.RightToolBarArea
           , allowedAreas: [dmz.ui.consts.LeftToolBarArea, dmz.ui.consts.RightToolBarArea]
           , floating: true
           , visible: false
           }
        , editScenarioWidget
        )

   , serverStartDateEdit = editScenarioWidget.lookup("serverStartDateEdit")
   , serverEndDateEdit = editScenarioWidget.lookup("serverEndDateEdit")
   , serverDeltaLabel = editScenarioWidget.lookup("serverDeltaLabel")
   , gameStartDateEdit = editScenarioWidget.lookup("gameStartDateEdit")
   , gameEndDateEdit = editScenarioWidget.lookup("gameEndDateEdit")
   , gameDeltaLabel = editScenarioWidget.lookup("gameDeltaLabel")
   , timeFactorSpinBox = editScenarioWidget.lookup("timeFactorSpinBox")
   , timeInfoLabel = editScenarioWidget.lookup("timeInfoLabel")
   , timeInfoText = timeInfoLabel.text()

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui")

   , instructorDialog = dmz.ui.loader.load("InstructorWindowDialog")
   , scenarioList = instructorDialog.lookup("scenarioList")

   , editAdvisorDialog = dmz.ui.loader.load("EditAdvisorDialog.ui")
   , advisorBio = editAdvisorDialog.lookup("advisorBio")
   , pictureLabel = editAdvisorDialog.lookup("pictureLabel")
   , advisorSpecialty = editAdvisorDialog.lookup("specialtyEdit")
   , advisorName = editAdvisorDialog.lookup("nameEdit")

   , editLobbyistDialog = dmz.ui.loader.load("EditLobbyistDialog.ui")
   , lobbyistPictureLabel = editLobbyistDialog.lookup("pictureLabel")
   , lobbyistGroupList = editLobbyistDialog.lookup("groupList")
   , lobbyistBio = editLobbyistDialog.lookup("lobbyistBio")
   , lobbyistMessage = editLobbyistDialog.lookup("lobbyistMessage")
   , lobbyistPictureList = editLobbyistDialog.lookup("pictureList")
   , lobbyistTitle = editLobbyistDialog.lookup("lobbyistTitle")
   , lobbyistName = editLobbyistDialog.lookup("nameEdit")

   , CreateMediaInjectDialog = dmz.ui.loader.load("MediaInjectDialog.ui")
   , MediaTypeList = CreateMediaInjectDialog.lookup("mediaType")
   , MediaTitleText = CreateMediaInjectDialog.lookup("titleText")
   , MediaUrlText = CreateMediaInjectDialog.lookup("urlText")
   , MediaGroupFLayout = CreateMediaInjectDialog.lookup("groupLayout")

   , AddGroupDialog = dmz.ui.loader.load("AddGroupDialog.ui")
   , groupButtonBox = AddGroupDialog.lookup("buttonBox")
   , groupTemplatePic = AddGroupDialog.lookup("pictureLabel")
   , groupTemplateComboBox = AddGroupDialog.lookup("templateComboBox")
   , groupNameEdit = AddGroupDialog.lookup("nameEdit")

   // Variables
   , groupList = []
   , userList = {}
   , gameList = []
   , advisorPictureObjects = {}
   , lobbyistPictureObjects = []
   , advisorList = []
   , forumList = []
   , forumGroupWidgets = {}
   , advisorWidgets = {}
   , CurrentGameHandle = false
   , MediaTypes =
        { Video: { type: dmz.stance.VideoType, attr: dmz.stance.ActiveVideoHandle }
        , Memo: { type: dmz.stance.MemoType, attr: dmz.stance.ActiveMemoHandle }
        , Newspaper: { type: dmz.stance.NewspaperType, attr: dmz.stance.ActiveNewspaperHandle }
        }
   , inUpdate = false
   , TemplateList = []
   , TemplateBackgroundPixmaps = []
   , AdvisorCount = 5

   // Function decls
   , toTimeStamp = dmz.util.dateToTimeStamp
   , toDate = dmz.util.timeStampToDate
   , createNewUser
   , userToGroup
   , userFromGroup
   , setup
   , groupToForum
   , groupFromForum
   , updateTimePage
   , readGroupTemplates
   , setGroupTemplate
   ;

self.shutdown = function () { dmz.ui.mainWindow.removeDock(DockName); }

createNewUser = function (userName, displayName) {

   var user
     ;

   if (userName && displayName) {

      user = dmz.object.create(dmz.stance.UserType);
      dmz.object.text(user, dmz.stance.NameHandle, userName);
      dmz.object.text(user, dmz.stance.DisplayNameHandle, displayName);
      dmz.object.activate(user);
   }
   return user;
};

readGroupTemplates = function () {

   var setList = self.config.get("group-picture-set.set")
     ;

   setList.forEach(function (set) {

      var imageList = set.get("image")
        , setName = set.string("name")
        , data = {}
        , pixmap
        ;

      imageList.forEach(function (image) {

         var name = image.string("name")
           , resource = image.string("resource")
           ;

         if (name && resource) {

            if (name === "Advisor") {

               if (!data[name]) { data[name] = []; }
               data[name].push(resource);
            }
            else { data[name] = resource; }
         }
      });

      data.background = set.string("background");
      TemplateList.push(data);
      groupTemplateComboBox.addItem(setName);
      if (data.background) {

         pixmap = dmz.resources.findFile(data.background);
         if (pixmap) {

            pixmap = dmz.ui.graph.createPixmap(pixmap);
            TemplateBackgroundPixmaps.push(pixmap);
         }
      }
   });
}

setGroupTemplate = function (groupHandle, templateIndex) {

   var data
     , advisorImages = []
     , idx
     ;

   if (templateIndex < TemplateList.length) {

      data = TemplateList[templateIndex];
      if (data) {

         Object.keys(data).forEach(function (key) {

            var attr = false;
            switch (key) {
            case "Advisor": advisorImages = data[key]; break;
            case "background": attr = dmz.stance.BackgroundImageHandle; break;
            case "Exit": attr = dmz.stance.ExitImageHandle; break;
            case "Forum": attr = dmz.stance.ComputerImageHandle; break;
            case "Map": attr = dmz.stance.MapImageHandle; break;
            case "Video": attr = dmz.stance.TVImageHandle; break;
            case "Newspaper": attr = dmz.stance.NewspaperImageHandle; break;
            case "Memo": attr = dmz.stance.InboxImageHandle; break;
            case "Lobbyist": attr = dmz.stance.PhoneImageHandle; break;
            case "Resource": attr = dmz.stance.ResourceImageHandle; break;
            default: self.log.warn ("Key ("+key+") has no associated handle."); break;
            }

            if (attr) { dmz.object.text(groupHandle, attr, data[key]); }
         });

         if (advisorImages.length) {

            data = dmz.data.create();
            for (idx = 0; idx < advisorImages.length; idx += 1) {

               data.string(dmz.stance.AdvisorImageHandle, idx, advisorImages[idx]);
            }


            dmz.object.data(groupHandle, dmz.stance.AdvisorImageHandle, data);
            dmz.object.scalar(groupHandle, dmz.stance.AdvisorImageCountHandle, idx);
         }
      }
   }
}

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType) {

      if (objType.isOfType(dmz.stance.GameType)) {

         CurrentGameHandle = objHandle;
         setup();
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.stance.getDisplayName(subHandle);
   groupList.push(subHandle);
   groupComboBox.addItem(name);
   advisorGroupComboBox.addItem(name);
   lobbyistGroupList.addItem(name);
   MediaGroupFLayout.addRow(name, dmz.ui.button.createCheckBox());

   forumGroupWidgets[subHandle] =
      { assoc: forumAssocList.addItem(name, subHandle)
      , unassoc: forumGroupList.addItem(name, subHandle)
      };
   forumGroupWidgets[subHandle].assoc.hidden(true);
});

dmz.object.unlink.observe(self, dmz.stance.GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.stance.getDisplayName(subHandle)
     , index
     ;

   index = groupList.indexOf(subHandle);
   if (index !== -1) { groupList.splice(index, 1); }

   index = groupComboBox.findText(name);
   if (index !== -1) { groupComboBox.removeIndex(index); }
   index = advisorGroupComboBox.findText(name);
   if (index !== -1) { advisorGroupComboBox.removeIndex(index); }
   index = lobbyistGroupList.findText(name);
   if (index !== -1) { lobbyistGroupList.removeIndex(index); }

   index = forumGroupWidgets[subHandle];
   if (index && index.assoc && index.unassoc) {

      forumAssocList.removeItem(index.assoc);
      forumGroupList.removeItem(index.unassoc);
      delete forumGroupWidgets[subHandle];
   }
});

dmz.object.link.observe(self, dmz.stance.GameForumsHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.stance.getDisplayName(subHandle);

   forumComboBox.addItem(name);
   forumList.push(subHandle);
});

dmz.object.unlink.observe(self, dmz.stance.GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.stance.getDisplayName(subHandle)
     , index
     ;

   index = forumComboBox.findText(name);
   if (index !== -1) {

      forumComboBox.removeIndex(index);
      forumList.splice(index, 1);
   }
});

dmz.object.link.observe(self, dmz.stance.ForumLink,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   if (forumGroupWidgets[superHandle]) {

      forumGroupWidgets[superHandle].unassoc.hidden(true);
      forumGroupWidgets[superHandle].assoc.hidden(false);
   }
});

dmz.object.unlink.observe(self, dmz.stance.ForumLink,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   if (forumGroupWidgets[superHandle]) {

      forumGroupWidgets[superHandle].unassoc.hidden(false);
      forumGroupWidgets[superHandle].assoc.hidden(true);
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, studentHandle) {

   if (!userList[studentHandle]) {

      userList[studentHandle] =
         groupStudentList.addItem(dmz.stance.getDisplayName(studentHandle), studentHandle);

      userList[studentHandle].hidden(groupList[0] && (groupHandle !== groupList[0]));
   }
});

dmz.object.link.observe(self, dmz.stance.GameUngroupedUsersHandle,
function (linkObjHandle, attrHandle, gameHandle, userHandle) {

   if (!userList[userHandle]) {

      userList[userHandle] = ungroupedStudentList.addItem(
         dmz.stance.getDisplayName(userHandle), userHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   var item
     , links
     ;
   if (advisorList.indexOf(advisorHandle) === -1) {

      item =
         groupAdvisorList.addItem(dmz.stance.getDisplayName(advisorHandle), advisorHandle);
      item.hidden(groupHandle !== groupList[advisorGroupComboBox.currentIndex()]);
      advisorWidgets[advisorHandle] = item;
      advisorList.push(advisorHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.LobbyistGroupHandle,
function (linkObjHandle, attrHandle, gameHandle, lobbyistHandle) {

   if (lobbyistList.indexOf(lobbyistHandle) === -1) {

      lobbyistComboBox.addItem(dmz.stance.getDisplayName(lobbyistHandle));
      lobbyistList.push(lobbyistHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.GameUngroupedLobbyistsHandle,
function (linkObjHandle, attrHandle, gameHandle, lobbyistHandle) {

   if (lobbyistList.indexOf(lobbyistHandle) === -1) {

      lobbyistComboBox.addItem(dmz.stance.getDisplayName(lobbyistHandle));
      lobbyistList.push(lobbyistHandle);
   }
});

groupComboBox.observe(self, "currentIndexChanged", function (index) {

   var groupHandle = groupList[index]
     , members
     , item
     , idx
     , count
     ;

   if (groupHandle) {

      members = dmz.object.subLinks(groupHandle, dmz.stance.GroupMembersHandle);
      count = groupStudentList.count();
      for (idx = 0; idx < count; idx += 1) {

         item = groupStudentList.item(idx);
         item.hidden(!members || (members.indexOf(item.data()) === -1));
      }
   }
});

userToGroup = function (item) {

   var objHandle
     , currentIndex
     , count = groupComboBox.count()
     , linkHandle
     ;

   if (item && count) {

      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         dmz.object.unlink(
            dmz.object.linkHandle(dmz.stance.GameUngroupedUsersHandle, CurrentGameHandle, objHandle));
         dmz.object.link(dmz.stance.GroupMembersHandle, groupList[currentIndex], objHandle);
         ungroupedStudentList.removeItem(item);
         groupStudentList.addItem(item);
      }
   }
};

userFromGroup = function (item) {

   var objHandle
     , currentIndex
     , count = groupComboBox.count()
     , linkHandle
     ;

   if (item && count) {

      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         dmz.object.unlink(
            dmz.object.linkHandle(dmz.stance.GroupMembersHandle, groupList[currentIndex], objHandle));
         dmz.object.link(dmz.stance.GameUngroupedUsersHandle, CurrentGameHandle, objHandle);
         groupStudentList.removeItem(item);
         ungroupedStudentList.addItem(item);
      }
   }
};

groupToForum = function (item) {

   var groupHandle
     , forumHandle
     , currentIndex
     , count = forumComboBox.count()
     , linkHandle
     ;

   if (item && count) {

      groupHandle = item.data();
      currentIndex = forumComboBox.currentIndex();
      if (currentIndex < forumList.length) { forumHandle = forumList[currentIndex]; }
      else { forumHandle = false; }

      if (groupHandle && forumHandle) {

         dmz.object.link(dmz.stance.ForumLink, groupHandle, forumHandle);
      }
   }
};


groupFromForum = function (item) {

   var groupHandle
     , forumHandle
     , currentIndex
     , count = forumComboBox.count()
     , linkHandle
     ;

   if (item && count) {

      groupHandle = item.data();
      currentIndex = forumComboBox.currentIndex();
      if (currentIndex < forumList.length) { forumHandle = forumList[currentIndex]; }
      else { forumHandle = false; }

      if (groupHandle && forumHandle) {

         dmz.object.unlink(
            dmz.object.linkHandle(dmz.stance.ForumLink, groupHandle, forumHandle));

      }
   }
};

editScenarioWidget.observe(self, "addForumGroupButton", "clicked", function () {

   groupToForum(forumGroupList.currentItem());
});

editScenarioWidget.observe(self, "removeForumGroupButton", "clicked", function () {

   groupFromForum(forumAssocList.currentItem());
});

forumComboBox.observe(self, "currentIndexChanged", function (index) {

   var listHandle = forumList[index]
     , forumGroups
     ;

   if (listHandle) {

      forumGroups = dmz.object.superLinks(listHandle, dmz.stance.ForumLink);
      Object.keys(forumGroupWidgets).forEach(function (groupHandle) {

         var hide;
         groupHandle = parseInt(groupHandle);
         hide = forumGroups && (forumGroups.indexOf(groupHandle) !== -1);
         forumGroupWidgets[groupHandle].unassoc.hidden(hide);
         forumGroupWidgets[groupHandle].assoc.hidden(!hide);
      });
   }

});

forumAssocList.observe(self, "itemActivated", groupFromForum);
forumGroupList.observe(self, "itemActivated", groupToForum);

editScenarioWidget.observe(self, "createForumButton", "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create Forum"
      , label: "Forum Name:"
      , text: ""
      }
      , editScenarioWidget
      ).open(self, function (value, name) {

         var handle;
         if (value && (name.length > 0)) {

				handle = dmz.object.create(dmz.stance.ForumType);
			dmz.object.activate(handle);
				dmz.object.text(handle, dmz.stance.NameHandle, name);
				dmz.object.link(dmz.stance.GameForumsHandle, CurrentGameHandle, handle);
			}
		});
});

editScenarioWidget.observe(self, "deleteForumButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this forum?"
      , informativeText: "Clicking <b>Ok</b> will cause all forum data to be permanently erased!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioWidget
   ).open(self, function (value) {

      var handle
        , index
        ;
      if (value) {

         index = forumComboBox.currentIndex();
         handle = forumList[index];
         if (handle) { dmz.object.destroy(handle); }
         forumComboBox.remove(index);
      }
   });
});

dmz.object.flag.observe(self, dmz.stance.AdminHandle, function (handle, attr, value) {

   var adminList = dmz.object.subLinks(CurrentGameHandle, dmz.stance.AdminHandle);
   if (value) {

      if (!adminList || (adminList.indexOf(handle) === -1)) {

         dmz.object.link(dmz.stance.AdminHandle, CurrentGameHandle, handle);
      }
   }
   else if (adminList && (adminList.indexOf(handle) !== -1)) {

      dmz.object.unlink(
         dmz.object.linkHandle(dmz.stance.AdminHandle, CurrentGameHandle, handle));
   }
})

dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value) {

   var userList = []
     , subject
     , body
     , groups
     ;

   if (handle === CurrentGameHandle) {

      gameStateButton.text(value ? "End Game" : "Start Game");

      serverStartDateEdit.enabled (!value);
      serverEndDateEdit.enabled(!value);
      gameStartDateEdit.enabled(!value);
      timeFactorSpinBox.enabled(!value);
   }
});

setup = function () {

   var groups
     , ungrouped
     , members
     , idx
     , item
     , count
     , pictures
     , directory
     , advisors
     , lobbyists
     , forums
     ;

   gameStateButton.observe(self, "clicked", function () {

      var active = dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle)
        ;

      dmz.ui.messageBox.create(
         { type: dmz.ui.messageBox.Warning
         , text: "Are you sure that you'd like to " + (active ? "end " : "start ") + "the game?"
         , informativeText: "If you click <b>Ok</b>, all users will be sent an email notification."
         , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
         , defaultButton: dmz.ui.messageBox.Cancel
         }
         , editScenarioWidget
         ).open(self, function (value) {

            var groups
              , userList = []
              , subject
              , body
              ;
            if (value === dmz.ui.messageBox.Ok) {

               active = !active;
               dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle, active);
               groups = dmz.object.subLinks(CurrentGameHandle, dmz.stance.GameGroupHandle);
               if (groups) {

                  groups.forEach(function (groupHandle) {

                     var users = dmz.object.subLinks(groupHandle, dmz.stance.GroupMembersHandle);
                     if (users) {

                        users.forEach(function (userHandle) {

                           if (!dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

                              userList.push(userHandle);
                           }
                        });
                     }
                  });
               }

               subject = "STANCE Game " + (!active ? "Completed!" : "Initiated!")
               body = "Students, \n Your STANCE game ";
               if (!active) { body += "is now over! \nThank you for participating!"; }
               else {

                  body +=
                     "has just begun! Please log on at your earliest convenience and " +
                     "examine the initial scenario description."
               }
               dmz.email.sendEmail(userList, subject, body);
            }
         });
   });

   lobbyistPictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < lobbyistPictureObjects.length) {

         lobbyistPictureLabel.pixmap(lobbyistPictureObjects[index]);
      }
   });

   pictures = self.config.get("lobbyist-pictures.picture");
   if (pictures) {

      pictures.forEach(function (pic) {

         var name = pic.string("name")
           , file = dmz.resources.findFile(name)
           ;

         file = dmz.ui.graph.createPixmap(file);
         lobbyistPictureObjects.push(file);
         lobbyistPictureList.addItem(name);
      });
   }

   editScenarioWidget.observe(self, "addLobbyistButton", "clicked", function () {

      lobbyistPictureList.currentIndex(0);
      lobbyistGroupList.currentIndex(0);
      lobbyistBio.text("");
      lobbyistMessage.text("");
      lobbyistTitle.text("");
      lobbyistName.text("");
      editLobbyistDialog.open(self, function (result) {

         var groupIndex = lobbyistGroupList.currentIndex()
           , links
           , text
           , lobbyistHandle
           ;

         if (result) {

            links = dmz.object.subLinks(groupList[groupIndex], dmz.stance.ActiveLobbyistHandle);
            if (links) {

               links.forEach(function (lobbyistHandle) {

                  var linkHandle =
                     dmz.object.linkHandle(
                        dmz.stance.ActiveLobbyistHandle,
                        groupList[groupIndex],
                        lobbyistHandle);

                  if (linkHandle) {

                     dmz.object.unlink(linkHandle);
                     dmz.object.link(
                        dmz.stance.PreviousLobbyistHandle,
                        groupList[groupIndex],
                        lobbyistHandle);
                  }
               });
            }

            lobbyistHandle = dmz.object.create(dmz.stance.LobbyistType);
            dmz.object.activate(lobbyistHandle);
            text = lobbyistPictureList.currentText();
            dmz.object.text(lobbyistHandle, dmz.stance.PictureHandle, text);
            dmz.object.text(lobbyistHandle, dmz.stance.BioHandle, lobbyistBio.text());
            dmz.object.text(lobbyistHandle, dmz.stance.NameHandle, lobbyistName.text());
            dmz.object.text(lobbyistHandle, dmz.stance.TitleHandle, lobbyistTitle.text());
            dmz.object.text(lobbyistHandle, dmz.stance.TextHandle, lobbyistMessage.text());
            dmz.object.link(dmz.stance.ActiveLobbyistHandle, groupList[groupIndex], lobbyistHandle);

         }
      });
   });

   updateTimePage ();
};

editScenarioWidget.observe(self, "addStudentButton", "clicked", function () {

   userToGroup(ungroupedStudentList.currentItem());
});

editScenarioWidget.observe(self, "removeStudentButton", "clicked", function () {

   userFromGroup(groupStudentList.currentItem());
});

groupStudentList.observe(self, "itemActivated", userFromGroup);
ungroupedStudentList.observe(self, "itemActivated", userToGroup);

editScenarioWidget.observe(self, "addGroupButton", "clicked", function () {

   if (groupTemplateComboBox.count()) {

      groupTemplatePic.pixmap(TemplateBackgroundPixmaps[0]);
      groupTemplateComboBox.currentIndex(0);
   }
   else { self.log.error ("No group templates found."); }

   groupNameEdit.text("");

   AddGroupDialog.open(self, function (value) {

      var group
        , idx
        , advisorHandle
        , name
        , str
        ;

      if (value) {

         group = dmz.object.create(dmz.stance.GroupType);
         name = groupNameEdit.text();
         dmz.object.text(group, dmz.stance.NameHandle, name);
         setGroupTemplate(group, groupTemplateComboBox.currentIndex());
         dmz.object.activate(group);
         dmz.object.link(dmz.stance.GameGroupHandle, CurrentGameHandle, group);

         for (idx = 0; idx < AdvisorCount; idx += 1) {

            str = name + ": Advisor" + idx;
            advisorHandle = dmz.object.create(dmz.stance.AdvisorType);
            dmz.object.text(advisorHandle, dmz.stance.NameHandle, str);
            dmz.object.scalar(advisorHandle, dmz.stance.AdvisorImageHandle, idx);
            dmz.object.activate(advisorHandle);
            dmz.object.link(dmz.stance.AdvisorGroupHandle, group, advisorHandle);
         }

      }
   });
});

advisorGroupComboBox.observe(self, "currentIndexChanged", function (index) {

   var groupHandle = groupList[index]
     , links = dmz.object.subLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
     ;

   if (links) {

      Object.keys(advisorWidgets).forEach(function (advisorHandle) {

         advisorHandle = parseInt(advisorHandle);
         advisorWidgets[advisorHandle].hidden(links.indexOf(advisorHandle) === -1);
      });
   }
});

groupAdvisorList.observe(self, "itemActivated", function (item) {

   var advisorHandle = item.data()
     , text
     , groupHandle
     , data
     ;

   pictureLabel.clear();
   if (advisorHandle) {

      groupHandle = groupList[advisorGroupComboBox.currentIndex()];
      data = dmz.object.data(groupHandle, dmz.stance.AdvisorImageHandle);
      if (data) {

         pictureLabel.pixmap(
            dmz.ui.graph.createPixmap(
               dmz.resources.findFile(
                  data.string(
                     dmz.stance.AdvisorImageHandle,
                     dmz.object.scalar(advisorHandle, dmz.stance.AdvisorImageHandle)))));
      }
      else { pictureLabel.clear(); }

      text = dmz.object.text(advisorHandle, dmz.stance.BioHandle);
      advisorBio.text(text ? text : "");
      text = dmz.object.text(advisorHandle, dmz.stance.TitleHandle);
      advisorSpecialty.text(text ? text : "");
      text = dmz.stance.getDisplayName(advisorHandle);
      advisorName.text(text ? text : "");

      editAdvisorDialog.open(self, function (result) {

         if (result) {

            text = advisorName.text();
            item.text(text);
            dmz.object.text(advisorHandle, dmz.stance.NameHandle, text);
            dmz.object.text(advisorHandle, dmz.stance.BioHandle, advisorBio.text());
            dmz.object.text(advisorHandle, dmz.stance.TitleHandle, advisorSpecialty.text());
         }
      });
   }
});

editScenarioWidget.observe(self, "createPlayerButton", "clicked", function () {

   createStudentDialog.open(self, function (value, dialog) {

      var displayName = dialog.lookup("displayName")
        , userName = dialog.lookup("userName")
        , student
        ;

      if (value && displayName && userName) {

         student = createNewUser(userName.text(), displayName.text());
         if (student) {

            dmz.object.link(dmz.stance.GameUngroupedUsersHandle, CurrentGameHandle, student);
         }
      }
      displayName.clear();
      userName.clear();
   });
});

editScenarioWidget.observe(self, "deleteGameButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this game?"
      , informativeText: "Clicking <b>Ok</b> will cause all game data to be permanently erased!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioWidget
   ).open(self, function (value) {

      if (value) {

         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Critical
            , text: "This action will result in the permanent loss of all game data!"
            , informativeText: "Clicking <b>Ok</b> will cause all game data to be permanently erased!"
            , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Cancel
            }
            , editScenarioWidget
         ).open(self, function (value) {

            if (value) { dmz.object.destroy(CurrentGameHandle); }
         });
      }
   });
});

editScenarioWidget.observe(self, "removeGroupButton", "clicked", function () {

   var index = groupComboBox.currentIndex()
     , groupHandle = groupList[index]
     , groupMembers
     , count
     , idx
     , item
     ;

   groupMembers = dmz.object.subLinks(groupHandle, dmz.stance.GroupMembersHandle);
   if (groupMembers) {

      groupMembers.forEach(function (user) {

         var item = userList[user];
         if (item) { userFromGroup(item); }
      });
   }

   groupList.splice (index, 1);
   groupComboBox.removeIndex(index);
   advisorGroupComboBox.removeIndex(index);
   lobbyistGroupList.removeIndex(index);
   MediaGroupFLayout.takeAt(index);

   groupMembers = dmz.object.subLinks(groupHandle, dmz.stance.AdvisorGroupHandle);
   if (groupMembers) {

      groupMembers.forEach(function (advisorHandle) { dmz.object.destroy(advisorHandle); });
   }

   dmz.object.destroy(groupHandle);
});

editScenarioWidget.observe(self, "allGroupButton", "clicked", function () {

   var groupListDialog = dmz.ui.loader.load("GroupListDialog.ui")
     , listLayout = groupListDialog.lookup("vLayout")
     , groups
     , studentList
     , vLayout
     , groupBox
     ;

   groups = dmz.object.subLinks(CurrentGameHandle, dmz.stance.GameGroupHandle);
   groups.forEach(function (groupHandle) {

      groupBox = dmz.ui.groupBox.create(dmz.stance.getDisplayName(groupHandle));
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList = dmz.object.subLinks(groupHandle, dmz.stance.GroupMembersHandle);
      if (studentList) {

         studentList.forEach(function (student) {

            vLayout.addWidget(dmz.ui.label.create(dmz.stance.getDisplayName(student)));
         });
      }
      groupBox.layout(vLayout);
      listLayout.addWidget(groupBox);
   });

   studentList = dmz.object.subLinks(CurrentGameHandle, dmz.stance.GameUngroupedUsersHandle);
   if (studentList) {

      groupBox = dmz.ui.groupBox.create("Ungrouped Students")
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList.forEach(function (student) {

         vLayout.addWidget(dmz.ui.label.create(dmz.stance.getDisplayName(student)));
      });
      groupBox.layout(vLayout);
      listLayout.addWidget(groupBox);
   }

   groupListDialog.open(self, function (result) {

      var widget;

      while (listLayout.count()) {

         widget = listLayout.at(0);
         listLayout.removeWidget(widget);
         widget.close();
      }
   });
});

editScenarioWidget.observe(self, "addInjectButton", "clicked", function () {

   CreateMediaInjectDialog.open(self, function (value, dialog) {

      var idx
        , count = MediaGroupFLayout.rowCount()
        , media = false
        , type = MediaTypeList.currentText()
        , groupHandle
        , groupMembers
        , links
        , linkAttr = false
        ;

      if (value && MediaTypes[type]) {

         for (idx = 0; idx < count; idx += 1) {

            if (MediaGroupFLayout.at(idx, 1).isChecked()) {

               if (!media) {

                  media = dmz.object.create(MediaTypes[type].type);
                  linkAttr = MediaTypes[type].attr;
                  dmz.object.activate(media);
                  links = dmz.object.subLinks(CurrentGameHandle, dmz.stance.GameMediaHandle);
                  dmz.object.scalar(media, dmz.stance.ID, links ? links.length : 0);
                  dmz.object.link(dmz.stance.GameMediaHandle, CurrentGameHandle, media);
               }
               dmz.object.text(media, dmz.stance.TitleHandle, MediaTitleText.text());
               dmz.object.text(media, dmz.stance.TextHandle, MediaUrlText.text());

               groupHandle = groupList[idx];
               groupMembers = dmz.object.subLinks(groupHandle, dmz.stance.GroupMembersHandle);
               if (groupMembers && linkAttr) {

                  groupMembers.forEach(function (userHandle) {

                     if (!dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

                        dmz.object.link(linkAttr, userHandle, media);
                     }
                  });
               }
            }
         }
      }

      MediaTitleText.text("");
      MediaUrlText.text("");
      for (idx = 0; idx < count; idx += 1) {

         MediaGroupFLayout.at(idx, 1).setChecked(false);
      }
   });
});

editScenarioWidget.observe(self, "removePlayerButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioWidget
   ).open(self, function (value) {});
});

editScenarioWidget.observe(self, "importStudentListButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioWidget
   ).open(self, function (value) {});
});

editScenarioWidget.observe(self, "generateReportButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioWidget
   ).open(self, function (value) {});
});

editScenarioWidget.observe(self, "gameStatsButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioWidget
   ).open(self, function (value) {});
});

dmz.object.data.observe(self, dmz.stance.GameStartTimeHandle, function (handle, attr, value) {

   var server = {}
     , game = {}
     ;

   if (handle === CurrentGameHandle && !inUpdate) {

      inUpdate = true;
      server.start = toDate(value.number("server", 0));
      server.end = toDate(value.number("server", 1));
      serverStartDateEdit.dateTime(server.start);
      serverEndDateEdit.dateTime(server.end);

      game.start = toDate(value.number("game", 0));
      gameStartDateEdit.dateTime(game.start);

      inUpdate = false;

      timeFactorSpinBox.value(value.number("factor", 0));
   }
});

updateTimePage = function () {

   var server = {}
     , game = {}
     , data
     , info = timeInfoText
     , GameStartTime = dmz.stance.GameStartTimeHandle
     ;

   if (!inUpdate) {

      server.start = serverStartDateEdit.dateTime();
      server.end = serverEndDateEdit.dateTime();
      server.delta = toTimeStamp(server.end) - toTimeStamp(server.start);
      server.span = new DateJs.TimeSpan(server.end - server.start);
      server.period = new DateJs.TimePeriod(server.start, server.end);
      serverDeltaLabel.text(server.span.getDays());

      game.start = gameStartDateEdit.dateTime();
      game.end = game.start.clone();
      game.end.addMilliseconds(server.span.getTotalMilliseconds() * timeFactorSpinBox.value());
      game.span = new DateJs.TimeSpan(game.end - game.start);
      game.period = new DateJs.TimePeriod(game.start, game.end);
      gameDeltaLabel.text(game.span.getDays());
      gameEndDateEdit.dateTime(game.end);

      info = info.replace("{{serverDelta}}", server.span.getDays());
      info = info.replace("{{gameDelta}}", game.span.getDays());

      timeInfoLabel.text(info);

      if (CurrentGameHandle) {

         data = dmz.data.create();
         data.number("server", 0, toTimeStamp(server.start));
         data.number("server", 1, toTimeStamp(server.end));
         data.number("game", 0, toTimeStamp(game.start));
         data.number("game", 1, toTimeStamp(game.end));
         data.number("factor", 0, timeFactorSpinBox.value());

         inUpdate = true;
         dmz.object.data(CurrentGameHandle, GameStartTime, data);
         inUpdate = false;
      }
   }
};

serverStartDateEdit.observe(self, "dateTimeChanged", function (value) {

   serverEndDateEdit.minimum(value);
});

serverEndDateEdit.observe(self, "dateTimeChanged", updateTimePage);
gameStartDateEdit.observe(self, "dateTimeChanged", updateTimePage);
timeFactorSpinBox.observe(self, "valueChanged", updateTimePage);

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      if (dmz.object.flag(objHandle, dmz.stance.AdminHandle)) {

         editScenarioWidget.lookup("tabWidget").show();
         dock.enabled(true);
      }
      else {

         editScenarioWidget.lookup("tabWidget").hide();
         dock.hide();
         dock.enabled(false);
      }
   }
});

groupTemplateComboBox.observe(self, "currentIndexChanged", function (index) {

   if (index < TemplateBackgroundPixmaps.length) {

      groupTemplatePic.pixmap(TemplateBackgroundPixmaps[index]);
   }
});

(function () {

   readGroupTemplates();
   editScenarioWidget.lookup("tabWidget").hide();
   dock.hide();
   dock.enabled(false);
}());
