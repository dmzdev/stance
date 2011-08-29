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
   , newspaperList = editScenarioWidget.lookup("newspaperListWidget")
   , memoList = editScenarioWidget.lookup("memoListWidget")
   , videoList = editScenarioWidget.lookup("videoListWidget")
   , lobbyistList = editScenarioWidget.lookup("lobbyistListWidget")

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

   /*, serverStartDateEdit = editScenarioWidget.lookup("serverStartDateEdit")
   , serverEndDateEdit = editScenarioWidget.lookup("serverEndDateEdit")
   , serverDeltaLabel = editScenarioWidget.lookup("serverDeltaLabel")
   , gameStartDateEdit = editScenarioWidget.lookup("gameStartDateEdit")
   , gameEndDateEdit = editScenarioWidget.lookup("gameEndDateEdit")
   , gameDeltaLabel = editScenarioWidget.lookup("gameDeltaLabel")
   , timeFactorSpinBox = editScenarioWidget.lookup("timeFactorSpinBox")
   , timeInfoLabel = editScenarioWidget.lookup("timeInfoLabel")
   , timeInfoText = timeInfoLabel.text()
   */

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui", editScenarioWidget)
   , avatarList = createStudentDialog.lookup("avatarList")
   , avatarLabel = createStudentDialog.lookup("avatarLabel")
   , studentUserNameEdit = createStudentDialog.lookup("userName")
   , studentDisplayNameEdit = createStudentDialog.lookup("displayName", editScenarioWidget)

   , instructorDialog = dmz.ui.loader.load("InstructorWindowDialog", editScenarioWidget)
   , scenarioList = instructorDialog.lookup("scenarioList")

   , editAdvisorDialog = dmz.ui.loader.load("EditAdvisorDialog.ui", editScenarioWidget)
   , advisorBio = editAdvisorDialog.lookup("advisorBio")
   , pictureLabel = editAdvisorDialog.lookup("pictureLabel")
   , advisorSpecialty = editAdvisorDialog.lookup("specialtyEdit")
   , advisorName = editAdvisorDialog.lookup("nameEdit")

   , editLobbyistDialog = dmz.ui.loader.load("EditLobbyistDialog.ui", editScenarioWidget)
   , lobbyistPictureLabel = editLobbyistDialog.lookup("pictureLabel")
   , lobbyistGroupList = editLobbyistDialog.lookup("groupList")
   , lobbyistMessage = editLobbyistDialog.lookup("lobbyistMessage")
   , lobbyistPictureList = editLobbyistDialog.lookup("pictureList")
   , lobbyistTitle = editLobbyistDialog.lookup("lobbyistTitle")
   , lobbyistName = editLobbyistDialog.lookup("nameEdit")
   , lobbyistErrorLabel = editLobbyistDialog.lookup("errorLabel")
   , lobbyistOkButton = editLobbyistDialog.lookup("okButton")

   , CreateMediaInjectDialog = dmz.ui.loader.load("MediaInjectDialog.ui", editScenarioWidget)
   , MediaTitleText = CreateMediaInjectDialog.lookup("titleText")
   , MediaUrlText = CreateMediaInjectDialog.lookup("urlText")
   , MediaGroupFLayout = CreateMediaInjectDialog.lookup("groupLayout")
   , MediaOkButton = CreateMediaInjectDialog.lookup("okButton")
   , MediaURLWarning = CreateMediaInjectDialog.lookup("urlWarning")

   , AddGroupDialog = dmz.ui.loader.load("AddGroupDialog.ui", editScenarioWidget)
   , groupButtonBox = AddGroupDialog.lookup("buttonBox")
   , groupTemplatePic = AddGroupDialog.lookup("pictureLabel")
   , groupTemplateComboBox = AddGroupDialog.lookup("templateComboBox")
   , groupNameEdit = AddGroupDialog.lookup("nameEdit")

   , groupLayout = editScenarioWidget.lookup("groupLayout")

   // Variables
   , aarMessage = dmz.message.create(self.config.string("aarmessage.name"))
   , GroupButtonList = {}
   , EmailMod = false
   , groupList = []
   , userList = {}
   , advisorPictureObjects = {}
   , lobbyistPictureObjects = []
   , advisorList = []
   , advisorWidgets = {}
   , CurrentGameHandle = false
   /*, Lobbyist =
        { type: dmz.stance.LobbyistType
        , attr: dmz.stance.ActiveLobbyistHandle
        , button: "addLobbyistButton"
        , listItems: {}
        , list: lobbyistList
        }
   */
   , MediaTypes =
        { Video:
           { type: dmz.stance.VideoType
           , button: "addVideoInjectButton"
           , urlEnd: ""
           , listItems: {}
           , list: videoList
           }
        , Memo:
           { type: dmz.stance.MemoType
           , button: "addMemoInjectButton"
           , urlEnd: "?stance:view&id="
           , listItems: {}
           , list: memoList
           }
        , Newspaper:
           { type: dmz.stance.NewspaperType
           , button: "addNewspaperInjectButton"
           , urlEnd: "?stance:view&id="
           , listItems: {}
           , list: newspaperList
           }
        , Lobbyist:
           { type: dmz.stance.LobbyistType
           , button: "addLobbyistButton"
           , listItems: {}
           , list: lobbyistList
           }
        }
   , injectItems = {}
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
   , modifyInjectItem
   , updateInjectTitle
   , mediaInjectButtons
   , setType
   ;

self.shutdown = function () { dmz.ui.mainWindow.removeDock(DockName); }

editScenarioWidget.observe(self, "aarButton", "clicked", function () {

   self.log.warn ("aarMessage:", aarMessage);
   aarMessage.send();
});

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
   return advisorImages;
}

dmz.object.create.observe(self, function (objHandle, objType) {

   var item = { handle: objHandle, title: "N/A", active: true };
   if (objType) {

      if (objType.isOfType(dmz.stance.GameType)) {

         CurrentGameHandle = objHandle;
         setup();
      }
      else if (objType.isOfType(dmz.stance.VideoType)) { item.type = MediaTypes.Video; }
      else if (objType.isOfType(dmz.stance.MemoType)) { item.type = MediaTypes.Memo; }
      else if (objType.isOfType(dmz.stance.NewspaperType)) { item.type = MediaTypes.Newspaper; }
      else if (objType.isOfType(dmz.stance.LobbyistType)) { item.type = MediaTypes.Lobbyist; }

      if (item.type) {

         item.type.listItems[objHandle] = item;
         item.item = item.type.list.addItem(item.title, item.handle);
         injectItems[item.handle] = item;
      }
   }
});

dmz.object.link.observe(self, dmz.stance.GameGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, gameHandle) {

   var name = dmz.stance.getDisplayName(groupHandle)
     , button = dmz.ui.button.createRadioButton(name)
     ;

   groupList.push(groupHandle);
   groupComboBox.addItem(name);
   advisorGroupComboBox.addItem(name);
   lobbyistGroupList.addItem(name);
   GroupButtonList[groupHandle] = button;
   button.observe(self, "toggled", function (selected) {

      var hil;
      if (selected) {

         hil = dmz.object.hil();
         dmz.object.unlinkSubObjects(hil, dmz.stance.GroupMembersHandle);
         ToggledMessage.send();
         dmz.object.link(dmz.stance.GroupMembersHandle, hil, groupHandle);
         dmz.object.flag(hil, dmz.object.HILAttribute, false);
         dmz.object.flag(hil, dmz.object.HILAttribute, true);
      }
   });
   groupLayout.insertWidget(0, button);
   MediaGroupFLayout.addRow(name, dmz.ui.button.createCheckBox());
});

dmz.object.unlink.observe(self, dmz.stance.GameGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, gameHandle) {

   var name = dmz.stance.getDisplayName(groupHandle)
     , index
     ;

   index = groupList.indexOf(groupHandle);
   if (index !== -1) { groupList.splice(index, 1); }

   index = groupComboBox.findText(name);
   if (index !== -1) { groupComboBox.removeIndex(index); }
   index = advisorGroupComboBox.findText(name);
   if (index !== -1) { advisorGroupComboBox.removeIndex(index); }
   index = lobbyistGroupList.findText(name);
   if (index !== -1) { lobbyistGroupList.removeIndex(index); }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, studentHandle, groupHandle) {

   var links = dmz.object.subLinks(studentHandle, dmz.stance.GameUngroupedUsersHandle);
   if (links) {

      dmz.object.unlinkSubObjects(studentHandle, dmz.stance.GameUngroupedUsersHandle);
   }

   if (!userList[studentHandle]) {

      userList[studentHandle] =
         groupStudentList.addItem(dmz.stance.getDisplayName(studentHandle), studentHandle);

      userList[studentHandle].hidden(groupList[0] && (groupHandle !== groupList[0]));
   }
});

dmz.object.link.observe(self, dmz.stance.GameUngroupedUsersHandle,
function (linkObjHandle, attrHandle, userHandle, gameHandle) {

   var links = dmz.object.subLinks(userHandle, dmz.stance.GroupMembersHandle);
   if (links) {

      dmz.object.unlinkSubObjects(userHandle, dmz.stance.GroupMembersHandle);
   }

   if (!userList[userHandle]) {

      userList[userHandle] = ungroupedStudentList.addItem(
         dmz.stance.getDisplayName(userHandle), userHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, advisorHandle, groupHandle) {

   var item;
   if (advisorList.indexOf(advisorHandle) === -1) {

      item =
         groupAdvisorList.addItem(dmz.stance.getDisplayName(advisorHandle), advisorHandle);
      item.hidden(groupHandle !== groupList[advisorGroupComboBox.currentIndex()]);
      advisorWidgets[advisorHandle] = item;
      advisorList.push(advisorHandle);
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

      members = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle);
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
     ;

   if (item && count) {

      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         dmz.object.link(dmz.stance.GroupMembersHandle, objHandle, groupList[currentIndex]);
         ungroupedStudentList.removeItem(item);
         groupStudentList.addItem(item);
      }
   }
};

userFromGroup = function (item) {

   var objHandle
     , currentIndex
     , count = groupComboBox.count()
     ;

   if (item && count) {

      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         dmz.object.link(dmz.stance.GameUngroupedUsersHandle, objHandle, CurrentGameHandle);
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

   if (handle === CurrentGameHandle) { gameStateButton.text(value ? "End Game" : "Start Game"); }
   else if (injectItems[handle]) {

      injectItems[handle].active = value;
      updateInjectTitle(handle);
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
               groups = dmz.object.superLinks(CurrentGameHandle, dmz.stance.GameGroupHandle);
               if (groups) {

                  groups.forEach(function (groupHandle) {

                     var users = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle);
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
               if (!active) {

                  body += "is now over! \nThank you for participating!";
                  dmz.object.timeStamp(CurrentGameHandle, dmz.stance.GameEndTimeHandle, 0);
                  dmz.object.flag(CurrentGameHandle, dmz.stance.UpdateEndTimeHandle, true);
               }
               else {

                  body +=
                     "has just begun! Please log on at your earliest convenience and " +
                     "examine the initial scenario description."
                  dmz.object.timeStamp(CurrentGameHandle, dmz.stance.GameStartTimeHandle, 0);
                  dmz.object.flag(CurrentGameHandle, dmz.stance.UpdateStartTimeHandle, true);
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
};

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
        , advisorImages
        , file
        , admins
        ;

      if (value) {

         group = dmz.object.create(dmz.stance.GroupType);
         name = groupNameEdit.text();
         dmz.object.text(group, dmz.stance.NameHandle, name);
         advisorImages = setGroupTemplate(group, groupTemplateComboBox.currentIndex());
         advisorImages = advisorImages ? advisorImages : [];
         dmz.object.activate(group);
         dmz.object.link(dmz.stance.GameGroupHandle, group, CurrentGameHandle);

         admins = dmz.object.subLinks(CurrentGameHandle, dmz.stance.AdminHandle) || [];
         admins.forEach(function (adminHandle) {

            var linkHandle = dmz.object.link(dmz.stance.DataLinkHandle, adminHandle, group)
              , data = dmz.object.create(dmz.stance.DataType)
              ;

            dmz.object.activate(data);
            dmz.object.linkAttributeObject(linkHandle, data);
         });

         for (idx = 0; idx < AdvisorCount; idx += 1) {

            str = name + ": No Name - Adv" + idx;
            handle = dmz.object.create(dmz.stance.AdvisorType);
            dmz.object.text(handle, dmz.stance.NameHandle, str);
            dmz.object.scalar(handle, dmz.stance.ID, idx);
            if (idx < advisorImages.length) {

               file = dmz.resources.lookupConfig(advisorImages[idx]);
               if (file) { file = dmz.resources.findFile(file.string("alt.name")); }
               if (!file) { file = dmz.resources.findFile(resource); }
               if (file) { dmz.object.text(handle, dmz.stance.PictureHandle, advisorImages[idx]); }
            }
            dmz.object.activate(handle);
            dmz.object.link(dmz.stance.AdvisorGroupHandle, handle, group);
         }
         handle = dmz.object.create(dmz.stance.ForumType);
         dmz.object.text(handle, dmz.stance.NameHandle, name);
         dmz.object.activate(handle);
         dmz.object.link(dmz.stance.ForumLink, handle, group);
      }
   });

});

advisorGroupComboBox.observe(self, "currentIndexChanged", function (index) {

   var groupHandle = groupList[index]
     , links = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle)
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
                  dmz.object.text(advisorHandle, dmz.stance.PictureHandle))));
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
        , isAdmin
        , text
        ;
      if (value) {

         user = dmz.object.create(dmz.stance.UserType);
         text = studentUserNameEdit.text() || "";
         dmz.object.text(
            user,
            dmz.stance.NameHandle,
            dmz.ui.crypto.hash(text.toLowerCase(), dmz.ui.crypto.Sha1));
         dmz.object.text(user, dmz.stance.DisplayNameHandle, studentDisplayNameEdit.text());
         dmz.object.text(user, dmz.stance.PictureHandle, avatarList.currentText());
         isAdmin = dialog.lookup("adminCheckBox").isChecked();
         if (isAdmin) { dmz.object.flag(user, dmz.stance.AdminHandle, true); }

         dmz.object.activate(user);
         if (user && !isAdmin) {

            dmz.object.link(dmz.stance.GameUngroupedUsersHandle, user, CurrentGameHandle);
         }
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
});

editScenarioWidget.observe(self, "allGroupButton", "clicked", function () {

   var groupListDialog = dmz.ui.loader.load("GroupListDialog.ui", editScenarioWidget)
     , listLayout = groupListDialog.lookup("vLayout")
     , groups
     , studentList
     , vLayout
     , groupBox
     ;

   groups = dmz.object.superLinks(CurrentGameHandle, dmz.stance.GameGroupHandle);
   groups.forEach(function (groupHandle) {

      groupBox = dmz.ui.groupBox.create(dmz.stance.getDisplayName(groupHandle));
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle);
      if (studentList) {

         studentList.forEach(function (student) {

            vLayout.addWidget(dmz.ui.label.create(dmz.stance.getDisplayName(student)));
         });
      }
      groupBox.layout(vLayout);
      listLayout.addWidget(groupBox);
   });

   studentList = dmz.object.superLinks(CurrentGameHandle, dmz.stance.GameUngroupedUsersHandle);
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

updateInjectTitle = function (handle) {

   var item = handle ? injectItems[handle] : false
     , str
     ;

   if (item) {

      str = item.title + (item.active ? "" : "*");
      item.item.text(str);
   }
};

dmz.object.text.observe(self, dmz.stance.TitleHandle, function (objHandle, attr, value) {

   if (injectItems[objHandle]) {

      injectItems[objHandle].title = value;
      updateInjectTitle (objHandle);
   }
});

modifyInjectItem = function (widgetItem) {

   var handle = widgetItem ? widgetItem.data() : false
     , item = handle ? injectItems[handle] : false
     ;

   if (item) {

      dmz.object.flag(handle, dmz.stance.ActiveHandle, !item.active);
   }
};


// Media inject buttons
mediaInjectButtons = function () {

   var generateMediaInjectFunction = function (type, urlEnd) {

      return function () {

         if (type.isOfType(dmz.stance.NewspaperType) ||
            type.isOfType(dmz.stance.MemoType) ||
            type.isOfType(dmz.stance.VideoType)) {

            MediaOkButton.observe(self, "clicked", function () {

               var text = MediaUrlText.text()
                 , somethingChecked = false
                 , itor
                 , count = MediaGroupFLayout.rowCount()
                 ;

               for (itor = 0; itor < count; itor += 1) {

                  if (MediaGroupFLayout.at(itor, 1).isChecked()) {

                     somethingChecked = true;
                  }
               }
               if (text.lastIndexOf(urlEnd) === -1) {

                  MediaURLWarning.text("<font color=\"red\"> Invalid " + type + " URL.</font>");
               }
               else if (!somethingChecked) {

                  MediaURLWarning.text("<font color=\"red\"> Select at least one group.</font>");
               }
               else { CreateMediaInjectDialog.accept(); }
            });

            CreateMediaInjectDialog.open(self, function (value, dialog) {

               var itor
                 , count = MediaGroupFLayout.rowCount()
                 , media = false
                 , groupMembers
                 , links
                 , game
                 , userList = dmz.object.subLinks(CurrentGameHandle, dmz.stance.AdminHandle);

                 ;

               if (value && type) {

                  media = dmz.object.create(type);
                  dmz.object.text(media, dmz.stance.TitleHandle, MediaTitleText.text());
                  dmz.object.text(media, dmz.stance.TextHandle, MediaUrlText.text());
                  dmz.object.timeStamp(media, dmz.stance.CreatedAtServerTimeHandle, 0);
                  dmz.object.flag(media, dmz.stance.UpdateStartTimeHandle, true);
                  links = dmz.object.superLinks(CurrentGameHandle, dmz.stance.MediaHandle);
                  dmz.object.scalar(media, dmz.stance.ID, links ? links.length : 0);
                  dmz.object.flag(media, dmz.stance.ActiveHandle, true);
                  dmz.object.link(dmz.stance.MediaHandle, media, CurrentGameHandle);
                  for (itor = 0; itor < count; itor += 1) {

                     if (MediaGroupFLayout.at(itor, 1).isChecked()) {

                        dmz.object.link(dmz.stance.MediaHandle, media, groupList[itor]);
                     }
                  }
                  dmz.object.activate(media);

                  MediaTitleText.text("");
                  MediaUrlText.text("");
                  MediaURLWarning.text("");
                  for (itor = 0; itor < count; itor += 1) {

                     MediaGroupFLayout.at(itor, 1).setChecked(false);
                  }
               }
            });
         }

         if (type.isOfType(dmz.stance.LobbyistType)) {

            lobbyistPictureList.currentIndex(0);
            lobbyistGroupList.currentIndex(0);
            lobbyistMessage.text("");
            lobbyistTitle.text("");
            lobbyistName.text("");
            lobbyistOkButton.observe(self, "clicked", function () {

               var title = lobbyistTitle.text()
                 , message = lobbyistMessage.text()
                 ;

               if (!message && !title) {

                  lobbyistErrorLabel.text
                     ("<center><font color=\"red\">Please enter a title and message.</font></center>");
               }
               else if (!message) {

                  lobbyistErrorLabel.text("<center><font color=\"red\">Please enter a message.</font></center>");
               }
               else if (!title) {

                  lobbyistErrorLabel.text("<center><font color=\"red\">Please enter a title.</font></center>");
               }
               else { editLobbyistDialog.accept(); }
            });
            editLobbyistDialog.open(self, function (result) {

               var groupIndex = lobbyistGroupList.currentIndex()
                 , links
                 , text
                 , lobbyistHandle
                 ;

               if (result) {

                  lobbyistHandle = dmz.object.create(dmz.stance.LobbyistType);
                  text = lobbyistPictureList.currentText();
                  dmz.object.text(lobbyistHandle, dmz.stance.PictureHandle, text);
                  dmz.object.text(lobbyistHandle, dmz.stance.NameHandle, (lobbyistName.text() || "N/A"));
                  dmz.object.text(lobbyistHandle, dmz.stance.TitleHandle, lobbyistTitle.text());
                  dmz.object.text(lobbyistHandle, dmz.stance.TextHandle, lobbyistMessage.text());
                  dmz.object.timeStamp(lobbyistHandle, dmz.stance.CreatedAtServerTimeHandle, 0);
                  dmz.object.flag(lobbyistHandle, dmz.stance.UpdateStartTimeHandle, true);
                  links = dmz.object.superLinks(CurrentGameHandle, dmz.stance.MediaHandle);
                  dmz.object.scalar(lobbyistHandle, dmz.stance.ID, links ? links.length : 0);
                  dmz.object.flag(lobbyistHandle, dmz.stance.ActiveHandle, true);
                  dmz.object.activate(lobbyistHandle);

                  dmz.object.link(dmz.stance.MediaHandle, lobbyistHandle, groupList[groupIndex]);
                  dmz.object.link(dmz.stance.MediaHandle, lobbyistHandle, CurrentGameHandle);
               }
            });
         }
      };
   };

   Object.keys(MediaTypes).forEach(function (type) {

      editScenarioWidget.observe(
         self,
         MediaTypes[type].button,
         "clicked",
         generateMediaInjectFunction(MediaTypes[type].type, MediaTypes[type].urlEnd));

      MediaTypes[type].list.observe(self, "itemActivated", modifyInjectItem);
   });
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var button;
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

   mediaInjectButtons();
   readGroupTemplates();
   editScenarioWidget.lookup("tabWidget").hide();
   dock.hide();
   dock.enabled(false);
}());

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});
