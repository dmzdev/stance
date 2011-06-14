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
      , crypto: require("dmz/ui/crypto")
      }
   , stance: require("stanceConst")
   , data: require("dmz/runtime/data")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , resources: require("dmz/runtime/resources")
   , message: require("dmz/runtime/messaging")
   , module: require("dmz/runtime/module")
   }
   , DateJs = require("datejs/time")

   // UI Elements
   , editScenarioWidget = dmz.ui.loader.load("EditScenarioForm.ui")
   , groupStudentList = editScenarioWidget.lookup("groupStudentList")
   , ungroupedStudentList = editScenarioWidget.lookup("ungroupedStudentList")
   , groupComboBox = editScenarioWidget.lookup("groupComboBox")
   , gameStateButton = editScenarioWidget.lookup("gameStateButton")
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
   , avatarList = createStudentDialog.lookup("avatarList")
   , avatarLabel = createStudentDialog.lookup("avatarLabel")
   , studentUserNameEdit = createStudentDialog.lookup("userName")
   , studentDisplayNameEdit = createStudentDialog.lookup("displayName")

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
   , MediaTitleText = CreateMediaInjectDialog.lookup("titleText")
   , MediaUrlText = CreateMediaInjectDialog.lookup("urlText")
   , MediaGroupFLayout = CreateMediaInjectDialog.lookup("groupLayout")

   , AddGroupDialog = dmz.ui.loader.load("AddGroupDialog.ui")
   , groupButtonBox = AddGroupDialog.lookup("buttonBox")
   , groupTemplatePic = AddGroupDialog.lookup("pictureLabel")
   , groupTemplateComboBox = AddGroupDialog.lookup("templateComboBox")
   , groupNameEdit = AddGroupDialog.lookup("nameEdit")

   , groupLayout = editScenarioWidget.lookup("groupLayout")

   // Variables
   , GroupButtonList = {}
   , EmailMod = false
   , groupList = []
   , userList = {}
   , gameList = []
   , advisorPictureObjects = {}
   , lobbyistPictureObjects = []
   , advisorList = []
   , advisorWidgets = {}
   , CurrentGameHandle = false
   , MediaTypes =
        { Video: { type: dmz.stance.VideoType, attr: dmz.stance.ActiveVideoHandle, button: "addVideoInjectButton" }
        , Memo: { type: dmz.stance.MemoType, attr: dmz.stance.ActiveMemoHandle, button: "addMemoInjectButton" }
        , Newspaper: { type: dmz.stance.NewspaperType, attr: dmz.stance.ActiveNewspaperHandle, button: "addNewspaperInjectButton" }
        }
   , inUpdate = false
   , TemplateList = []
   , TemplateBackgroundPixmaps = []
   , AdvisorCount = 5
   , AvatarPixmapList = {}
   , ToggledMessage = dmz.message.create("ToggledGroupMessage")

   // Function decls
   , toTimeStamp = dmz.util.dateToTimeStamp
   , toDate = dmz.util.timeStampToDate
   , createNewUser
   , userToGroup
   , userFromGroup
   , editUser
   , setup
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
            case "Vote": attr = dmz.stance.VoteImageHandle; break;
            case "Calendar": attr = dmz.stance.CalendarImageHandle; break;
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

   var name = dmz.stance.getDisplayName(subHandle)
     , button = dmz.ui.button.createRadioButton(name)
     ;

   groupList.push(subHandle);
   groupComboBox.addItem(name);
   advisorGroupComboBox.addItem(name);
   lobbyistGroupList.addItem(name);
   GroupButtonList[subHandle] = button;
   button.observe(self, "toggled", function (selected) {

      var hil;
      if (selected) {

         hil = dmz.object.hil();
         dmz.object.unlinkSuperObjects(hil, dmz.stance.GroupMembersHandle);
         ToggledMessage.send();
         dmz.object.link(dmz.stance.GroupMembersHandle, subHandle, hil);
         dmz.object.flag(hil, dmz.object.HILAttribute, false);
         dmz.object.flag(hil, dmz.object.HILAttribute, true);
      }
   });
   groupLayout.insertWidget(0, button);
   MediaGroupFLayout.addRow(name, dmz.ui.button.createCheckBox());
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
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, studentHandle) {

   var links = dmz.object.superLinks(studentHandle, dmz.stance.GameUngroupedUsersHandle)
     , hil = dmz.object.hil
     ;
   if (links) {

      dmz.object.unlinkSuperObjects(studentHandle, dmz.stance.GameUngroupedUsersHandle);
   }

   if (!userList[studentHandle]) {

      userList[studentHandle] =
         groupStudentList.addItem(dmz.stance.getDisplayName(studentHandle), studentHandle);

      userList[studentHandle].hidden(groupList[0] && (groupHandle !== groupList[0]));
   }
});

dmz.object.link.observe(self, dmz.stance.GameUngroupedUsersHandle,
function (linkObjHandle, attrHandle, gameHandle, userHandle) {

   var links = dmz.object.superLinks(userHandle, dmz.stance.GroupMembersHandle);
   if (links) {

      dmz.object.unlinkSuperObjects(userHandle, dmz.stance.GroupMembersHandle);
   }

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

         dmz.object.link(dmz.stance.GameUngroupedUsersHandle, CurrentGameHandle, objHandle);
         groupStudentList.removeItem(item);
         ungroupedStudentList.addItem(item);
      }
   }
};

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
});

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
      editScenarioWidget.lookup("setTimeButton").enabled(!value);
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
     , avatars
     ;

   AvatarPixmapList["Default"] = dmz.ui.graph.createPixmap(dmz.resources.findFile("AvatarDefault"));
   avatarList.addItem("Default");
   avatarLabel.pixmap(AvatarPixmapList["Default"]);
   avatars = self.config.get("avatar-list.avatar");
   avatars.forEach(function (avatarConfig) {

      var name = avatarConfig.string("name");
      if (name) {

         AvatarPixmapList[name] = dmz.ui.graph.createPixmap(dmz.resources.findFile(name));
         avatarList.addItem(name);
      }
   });

   avatarList.observe(self, "currentTextChanged", function (text) {

      if (avatarLabel) {

         avatarLabel.pixmap(AvatarPixmapList[text] ? AvatarPixmapList[text] : AvatarPixmapList["Default"]);
      }
   });

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
               EmailMod.sendEmail(userList, subject, body);
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

//                  var linkHandle =
//                     dmz.object.linkHandle(
//                        dmz.stance.ActiveLobbyistHandle,
//                        groupList[groupIndex],
//                        lobbyistHandle);

//                  if (linkHandle) {

//                     dmz.object.unlink(linkHandle);
//                     dmz.object.link(
//                        dmz.stance.PreviousLobbyistHandle,
//                        groupList[groupIndex],
//                        lobbyistHandle);
//                  }

                  var linkHandle =
                     dmz.object.linkHandle(
                        dmz.stance.PreviousLobbyistHandle,
                        groupList[groupIndex],
                        lobbyistHandle);

                  if (!linkHandle) {

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
            dmz.object.timeStamp(lobbyistHandle, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
            dmz.object.link(dmz.stance.ActiveLobbyistHandle, groupList[groupIndex], lobbyistHandle);

         }
      });
   });

//   updateTimePage ();
};

dmz.object.link.observe(self, dmz.stance.PreviousLobbyistHandle,
function (linkObj, attrHandle, groupHandle, lobbyistHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.ActiveLobbyistHandle, groupHandle, lobbyistHandle);
   if (linkHandle) { dmz.object.unlink(linkHandle); }
});

editScenarioWidget.observe(self, "addStudentButton", "clicked", function () {

   userToGroup(ungroupedStudentList.currentItem());
});

editScenarioWidget.observe(self, "removeStudentButton", "clicked", function () {

   userFromGroup(groupStudentList.currentItem());
});

editUser = function (item) {

   var objHandle
     , avatar
     ;

   if (item) {

      objHandle = item.data();
      studentDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      studentUserNameEdit.clear();
      avatar = dmz.object.text(objHandle, dmz.stance.PictureHandle);
      avatarList.currentText(AvatarPixmapList[avatar] ? avatar : "Default");
      createStudentDialog.open(self, function (value, dialog) {

         var text;
         if (value) {

            dmz.object.text(objHandle, dmz.stance.DisplayNameHandle, studentDisplayNameEdit.text());
            dmz.object.text(objHandle, dmz.stance.PictureHandle, avatarList.currentText());
            text = studentUserNameEdit.text();
            if (text) {

               dmz.object.text(
                  objHandle,
                  dmz.stance.NameHandle,
                  dmz.ui.crypto.hash(studentUserNameEdit.text(), dmz.ui.crypto.Sha1));
            }
         }
         studentDisplayNameEdit.clear();
         studentUserNameEdit.clear();
         avatarList.currentText("Default");
      });
   }
};

groupStudentList.observe(self, "itemActivated", editUser);
ungroupedStudentList.observe(self, "itemActivated", editUser);

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
        , handle
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
            handle = dmz.object.create(dmz.stance.AdvisorType);
            dmz.object.text(handle, dmz.stance.NameHandle, str);
            dmz.object.scalar(handle, dmz.stance.AdvisorImageHandle, idx);
            dmz.object.activate(handle);
            dmz.object.link(dmz.stance.AdvisorGroupHandle, group, handle);
         }

         handle = dmz.object.create(dmz.stance.ForumType);
         dmz.object.text(handle, dmz.stance.NameHandle, name);
         dmz.object.activate(handle);
         dmz.object.link(dmz.stance.ForumLink, group, handle);
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

      var user
        , name
        ;
      if (value) {

         user = dmz.object.create(dmz.stance.UserType);
         dmz.object.text(
            user,
            dmz.stance.NameHandle,
            dmz.ui.crypto.hash(studentUserNameEdit.text(), dmz.ui.crypto.Sha1));
         dmz.object.text(user, dmz.stance.DisplayNameHandle, studentDisplayNameEdit.text());
         dmz.object.text(user, dmz.stance.PictureHandle, avatarList.currentText());
         dmz.object.activate(user);
         if (user) {

            dmz.object.link(dmz.stance.GameUngroupedUsersHandle, CurrentGameHandle, user);
         }
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
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

// Media inject buttons
(function () {

   var generateMediaInjectFunction = function (type, attr) {

      return function () {

         CreateMediaInjectDialog.open(self, function (value, dialog) {

            var idx
              , count = MediaGroupFLayout.rowCount()
              , media = false
              , groupMembers
              , links
              , userList = []
              ;

            if (value && type) {

               for (idx = 0; idx < count; idx += 1) {

                  if (MediaGroupFLayout.at(idx, 1).isChecked()) {

                     groupMembers = dmz.object.subLinks(groupList[idx], dmz.stance.GroupMembersHandle);
                     if (groupMembers) {

                        groupMembers.forEach(function (userHandle) { userList.push(userHandle); });
                     }
                  }
               }

               if (userList.length) {

                  media = dmz.object.create(type);
                  dmz.object.text(media, dmz.stance.TitleHandle, MediaTitleText.text());
                  dmz.object.text(media, dmz.stance.TextHandle, MediaUrlText.text());
                  dmz.object.timeStamp(media, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
                  links = dmz.object.subLinks(CurrentGameHandle, dmz.stance.GameMediaHandle);
                  dmz.object.scalar(media, dmz.stance.ID, links ? links.length : 0);
                  dmz.object.activate(media);
                  dmz.object.link(dmz.stance.GameMediaHandle, CurrentGameHandle, media);
                  for (idx = 0; idx < count; idx += 1) {

                     if (MediaGroupFLayout.at(idx, 1).isChecked()) {

                        dmz.object.link(dmz.stance.GameMediaHandle, groupList[idx], media);
                     }
                  }
                  userList.forEach(function (userHandle) {

                     dmz.object.link(attr, userHandle, media);
                  });
               }
            }

            MediaTitleText.text("");
            MediaUrlText.text("");
            for (idx = 0; idx < count; idx += 1) {

               MediaGroupFLayout.at(idx, 1).setChecked(false);
            }
         });
      };
   };

   Object.keys(MediaTypes).forEach(function (type) {

      editScenarioWidget.observe(
         self,
         MediaTypes[type].button,
         "clicked",
         generateMediaInjectFunction(MediaTypes[type].type, MediaTypes[type].attr));
   });
}());

//editScenarioWidget.observe(self, "addInjectButton", "clicked", function () {

//   CreateMediaInjectDialog.open(self, function (value, dialog) {

//      var idx
//        , count = MediaGroupFLayout.rowCount()
//        , media = false
//        , type = MediaTypeList.currentText()
//        , groupMembers
//        , links
//        , linkAttr = false
//        , userList = []
//        ;

//      if (value && MediaTypes[type]) {

//         for (idx = 0; idx < count; idx += 1) {

//            if (MediaGroupFLayout.at(idx, 1).isChecked()) {

//               groupMembers = dmz.object.subLinks(groupList[idx], dmz.stance.GroupMembersHandle);
//               if (groupMembers) {

//                  groupMembers.forEach(function (userHandle) {

//                     if (!dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

//                        userList.push(userHandle);
//                     }
//                  });
//               }
//            }
//         }

//         if (userList.length) {

//            media = dmz.object.create(MediaTypes[type].type);
//            dmz.object.text(media, dmz.stance.TitleHandle, MediaTitleText.text());
//            dmz.object.text(media, dmz.stance.TextHandle, MediaUrlText.text());
//            links = dmz.object.subLinks(CurrentGameHandle, dmz.stance.GameMediaHandle);
//            dmz.object.scalar(media, dmz.stance.ID, links ? links.length : 0);
//            dmz.object.activate(media);
//            dmz.object.link(dmz.stance.GameMediaHandle, CurrentGameHandle, media);
//            linkAttr = MediaTypes[type].attr;
//            userList.forEach(function (userHandle) {

//               dmz.object.link(MediaTypes[type].attr, userHandle, media);
//            });
//         }
//      }

//      MediaTitleText.text("");
//      MediaUrlText.text("");
//      for (idx = 0; idx < count; idx += 1) {

//         MediaGroupFLayout.at(idx, 1).setChecked(false);
//      }
//   });
//});

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

editScenarioWidget.observe(self, "setTimeButton", "clicked", updateTimePage);

serverStartDateEdit.observe(self, "dateTimeChanged", function (value) {

   serverEndDateEdit.minimum(value);
});

//serverEndDateEdit.observe(self, "dateTimeChanged", updateTimePage);
//gameStartDateEdit.observe(self, "dateTimeChanged", updateTimePage);
//timeFactorSpinBox.observe(self, "valueChanged", updateTimePage);

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var button;
   if (value) {

      if (dmz.object.flag(objHandle, dmz.stance.AdminHandle)) {

         editScenarioWidget.lookup("tabWidget").show();
         dock.enabled(true);
//         button = GroupButtonList[dmz.stance.getUserGroupHandle(objHandle)];
//         if (button && !button.isChecked()) { button.click(true); }
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

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});
