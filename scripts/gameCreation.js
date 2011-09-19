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
   , advisorGroupComboBox = editScenarioWidget.lookup("advisorGroupComboBox")
   , groupAdvisorList = editScenarioWidget.lookup("groupAdvisorList")
   , newspaperList = editScenarioWidget.lookup("newspaperListWidget")
   , memoList = editScenarioWidget.lookup("memoListWidget")
   , videoList = editScenarioWidget.lookup("videoListWidget")
   , lobbyistList = editScenarioWidget.lookup("lobbyistListWidget")

   , TabWidget = editScenarioWidget.lookup("tabWidget")
   , SwitchGroupTab = { index: 0, name: "Switch Group", widget: editScenarioWidget.lookup("SwitchGroupTab") }
   , MediaTab = { index: 1, name: "Media Injects", widget: editScenarioWidget.lookup("MediaTab") }
   , AdvisorTab = { index: 2, name: "Advisors", widget: editScenarioWidget.lookup("ModifyAdvisorTab") }
   , AlterGroupsTab = { index: 3, name: "Groups", widget: editScenarioWidget.lookup("GroupTab") }
   , AlterUsersTab = { index: 4, name: "Users", widget: editScenarioWidget.lookup("UserTab") }
   , Tabs = [SwitchGroupTab, MediaTab, AdvisorTab, AlterGroupsTab, AlterUsersTab]

   , TechListWidget = editScenarioWidget.lookup("techList")
   , AdminListWidget = editScenarioWidget.lookup("adminList")
   , ObserverListWidget = editScenarioWidget.lookup("observerList")
   , AdvisorListWidget = editScenarioWidget.lookup("advisorList")
   , StudentListWidget = editScenarioWidget.lookup("studentList")
   , userListWidgets = [TechListWidget, AdminListWidget, ObserverListWidget, AdvisorListWidget, StudentListWidget]

   , ActiveBrush = dmz.ui.graph.createBrush({ r: 0, b: 0, g: 0 })
   , DisabledBrush = dmz.ui.graph.createBrush({ r: 1, b: 0, g: 0 })

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

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui", editScenarioWidget)
   , avatarList = createStudentDialog.lookup("avatarList")
   , avatarLabel = createStudentDialog.lookup("avatarLabel")
   , studentUserNameEdit = createStudentDialog.lookup("userName")
   , studentDisplayNameEdit = createStudentDialog.lookup("displayName")
   , studentEnabledCheckBox = createStudentDialog.lookup("enabledCheckBox")

   , createAdvisorDialog = dmz.ui.loader.load("CreateAdvisorDialog.ui", editScenarioWidget)
   , advisorEmailEdit = createAdvisorDialog.lookup("emailText")
   , advisorDisplayNameEdit = createAdvisorDialog.lookup("displayNameText")
   , advisorGroupList = createAdvisorDialog.lookup("groupComboBox")
   , advisorEnabledCheckBox = createAdvisorDialog.lookup("enabledCheckBox")
   , advisorLayout = createAdvisorDialog.lookup("verticalLayout")
   , advisorCB =
        [ createAdvisorDialog.lookup("advisor0")
        , createAdvisorDialog.lookup("advisor1")
        , createAdvisorDialog.lookup("advisor2")
        , createAdvisorDialog.lookup("advisor3")
        , createAdvisorDialog.lookup("advisor4")
        ]


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
   , userItems = {}

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
   , mediaInjectButtons
   , setType
   , createStudent
   , createAdmin
   , createTech
   , createObserver
   , createAdvisor
   , editStudent
   , editAdmin
   , editTech
   , editObserver
   , editAdvisor
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

   var item = { handle: objHandle, active: true };
   if (objType) {

      if (objType.isOfType(dmz.stance.GameType)) {

         CurrentGameHandle = objHandle;
         setup();
      }
      else if (objType.isOfType(dmz.stance.VideoType)) { item.type = MediaTypes.Video; }
      else if (objType.isOfType(dmz.stance.MemoType)) { item.type = MediaTypes.Memo; }
      else if (objType.isOfType(dmz.stance.NewspaperType)) { item.type = MediaTypes.Newspaper; }
      else if (objType.isOfType(dmz.stance.LobbyistType)) { item.type = MediaTypes.Lobbyist; }
      else if (objType.isOfType(dmz.stance.UserType)) { userItems[objHandle] = item; }

      if (item.type) {

         item.type.listItems[objHandle] = item;
         item.item = item.type.list.addItem("N/A", item.handle);
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
   advisorGroupList.addItem(name);
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

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, studentHandle, groupHandle) {

   var links = dmz.object.subLinks(studentHandle, dmz.stance.GameUngroupedUsersHandle);
   if (links) {

      dmz.object.unlinkSubObjects(studentHandle, dmz.stance.GameUngroupedUsersHandle);
   }

   if (!userList[studentHandle] && !dmz.object.flag(studentHandle, dmz.stance.AdminHandle)) {

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

      members = dmz.object.superLinks(groupHandle, dmz.stance.GroupMembersHandle) || [];
      members = members.filter(function (handle) { return !dmz.object.flag(handle, dmz.stance.AdminHandle); });
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

   var state;
   if (value) {

      self.log.error ("Admin Handle:", dmz.stance.getDisplayName(handle), handle);
      state = dmz.object.state(handle, dmz.stance.Permissions);
      if (!state || !state.and(dmz.stance.AlterAdvisorsFlag).bool()) {

         dmz.object.state(handle, dmz.stance.Permissions, dmz.stance.TechPermissions);
      }
   }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value) {

   var data = injectItems[handle] || userItems[handle];
   self.log.warn ("Item: ["+Object.keys(data)+"]", data ? data.item : "--nodata", handle);
   if (data) {

      data.active = value;
      if (data.item) { data.item.foreground(value ? ActiveBrush : DisabledBrush); }
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
     , enabled
     , isEnabled
     ;

   if (item) {

      objHandle = item.data();
      studentDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      studentUserNameEdit.clear();
      avatar = dmz.object.text(objHandle, dmz.stance.PictureHandle);
      avatarList.currentText(AvatarPixmapList[avatar] ? avatar : "Default");
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      studentEnabledCheckBox.setChecked(enabled);
      createStudentDialog.open(self, function (value, dialog) {

         var text
           , post
           , forumHandle
           ;
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
            isEnabled = studentEnabledCheckBox.isChecked();
            if (isEnabled != enabled) {

               dmz.object.flag(objHandle, dmz.stance.ActiveHandle, isEnabled);
               forumHandle =
                  (dmz.object.superLinks(dmz.stance.getUserGroupHandle(objHandle), dmz.stance.ForumLink) || [])[0];

               if (forumHandle) {

                  post = dmz.object.create(dmz.stance.PostType);
                  dmz.object.text(
                     post,
                     dmz.stance.TextHandle,
                     "AUTOMATIC NOTIFICATION: The account of user \"" +
                        studentDisplayNameEdit.text() + "\" has been " +
                        (isEnabled ? "activated." : "temporarily disabled."));
                  dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, 0);
                  dmz.object.flag(post, dmz.stance.UpdateStartTimeHandle, true);
                  dmz.object.link(dmz.stance.ParentHandle, post, forumHandle);
                  dmz.object.link(dmz.stance.CreatedByHandle, post, dmz.object.hil());
                  dmz.object.activate(post);
               }
               else { self.log.error ("Couldn't find forum handle:", objHandle); }
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
            dmz.object.activate(handle);
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

createStudent = function () {

   createStudentDialog.open(self, function (value, dialog) {

      var user
        , name
        , isEnabled
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
         dmz.object.flag(user, dmz.stance.ActiveHandle, studentEnabledCheckBox.isChecked());
         dmz.object.state(user, dmz.stance.Permissions, dmz.stance.StudentPermissions);
         dmz.object.activate(user);
         dmz.object.link(dmz.stance.GameUngroupedUsersHandle, user, CurrentGameHandle);
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
};

createAdmin = function () {

   createStudentDialog.open(self, function (value, dialog) {

      var user
        , name
        , isEnabled
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
         dmz.object.flag(user, dmz.stance.ActiveHandle, studentEnabledCheckBox.isChecked());
         dmz.object.state(user, dmz.stance.Permissions, dmz.stance.AdminPermissions);
         dmz.object.activate(user);
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
};

createObserver = function () {

   avatarList.enabled(false);
   createStudentDialog.open(self, function (value, dialog) {

      var user
        , name
        , isEnabled
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
         dmz.object.flag(user, dmz.stance.ActiveHandle, studentEnabledCheckBox.isChecked());
         dmz.object.state(user, dmz.stance.Permissions, dmz.stance.ObserverPermissions);
         dmz.object.activate(user);
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      avatarList.enabled(true);
      avatarList.currentText("Default");
   });
};

createTech = function () {

   createStudentDialog.open(self, function (value, dialog) {

      var user
        , name
        , isEnabled
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
         dmz.object.flag(user, dmz.stance.ActiveHandle, studentEnabledCheckBox.isChecked());
         dmz.object.state(user, dmz.stance.Permissions, dmz.stance.TechPermissions);
         dmz.object.activate(user);
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
};

createAdvisor = function () {

   createAdvisorDialog.open(self, function (value, dialog) {

      var user
        , name
        , text
        , state
        ;
      if (value) {

         user = dmz.object.create(dmz.stance.UserType);
         text = advisorEmailEdit.text() || "";
         dmz.object.text(
            user,
            dmz.stance.NameHandle,
            dmz.ui.crypto.hash(text.toLowerCase(), dmz.ui.crypto.Sha1));
         dmz.object.text(user, dmz.stance.DisplayNameHandle, advisorDisplayNameEdit.text());
         dmz.object.flag(user, dmz.stance.ActiveHandle, advisorEnabledCheckBox.isChecked());
         state = dmz.stance.AdvisorPermissions;
         advisorCB.forEach(function (widget, index) {

            if (widget.isChecked()) { state = state.or(dmz.stance.AdvisorSets[index]); }
         });

         dmz.object.state(user, dmz.stance.Permissions, state);
         dmz.object.activate(user);
         dmz.object.link(dmz.stance.GroupMembersHandle, user, groupList[advisorGroupList.currentIndex()]);
      }
      advisorDisplayNameEdit.clear();
      advisorEmailEdit.clear();
   });
};

editScenarioWidget.observe(self, "createPlayerButton", "clicked", editStudent);
editScenarioWidget.observe(self, "createAdminButton", "clicked", editAdmin);
editScenarioWidget.observe(self, "createObserverButton", "clicked", editObserver);
editScenarioWidget.observe(self, "createTechButton", "clicked", editTech);
editScenarioWidget.observe(self, "createAdvisorButton", "clicked", editAdvisor);

editStudent = function (item) {

   var objHandle
     , avatar
     , enabled
     , isEnabled
     ;

   if (item) {

      objHandle = item.data();
      studentDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      studentUserNameEdit.clear();
      avatar = dmz.object.text(objHandle, dmz.stance.PictureHandle);
      avatarList.currentText(AvatarPixmapList[avatar] ? avatar : "Default");
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      studentEnabledCheckBox.setChecked(enabled);
      createStudentDialog.open(self, function (value, dialog) {

         var text
           , post
           , forumHandle
           ;
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
            isEnabled = studentEnabledCheckBox.isChecked();
            if (isEnabled != enabled) {

               dmz.object.flag(objHandle, dmz.stance.ActiveHandle, isEnabled);
               forumHandle =
                  (dmz.object.superLinks(dmz.stance.getUserGroupHandle(objHandle), dmz.stance.ForumLink) || [])[0];

               if (forumHandle) {

                  post = dmz.object.create(dmz.stance.PostType);
                  dmz.object.text(
                     post,
                     dmz.stance.TextHandle,
                     "AUTOMATIC NOTIFICATION: The account of user \"" +
                        studentDisplayNameEdit.text() + "\" has been " +
                        (isEnabled ? "activated." : "temporarily disabled."));
                  dmz.object.timeStamp(post, dmz.stance.CreatedAtServerTimeHandle, 0);
                  dmz.object.flag(post, dmz.stance.UpdateStartTimeHandle, true);
                  dmz.object.link(dmz.stance.ParentHandle, post, forumHandle);
                  dmz.object.link(dmz.stance.CreatedByHandle, post, dmz.object.hil());
                  dmz.object.activate(post);
               }
               else { self.log.error ("Couldn't find forum handle:", objHandle); }
            }
         }
         studentDisplayNameEdit.clear();
         studentUserNameEdit.clear();
         avatarList.currentText("Default");
      });
   }
};

editAdmin = function (item) {

   var objHandle
     , avatar
     , enabled
     , isEnabled
     ;

   if (item) {

      objHandle = item.data();
      studentDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      studentUserNameEdit.clear();
      avatar = dmz.object.text(objHandle, dmz.stance.PictureHandle);
      avatarList.currentText(AvatarPixmapList[avatar] ? avatar : "Default");
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      studentEnabledCheckBox.setChecked(enabled);
      createStudentDialog.open(self, function (value, dialog) {

         var text
           , post
           , forumHandle
           ;
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
            isEnabled = studentEnabledCheckBox.isChecked();
            if (isEnabled != enabled) {

               dmz.object.flag(objHandle, dmz.stance.ActiveHandle, isEnabled);
            }
         }
         studentDisplayNameEdit.clear();
         studentUserNameEdit.clear();
         avatarList.currentText("Default");
      });
   }
};

editObserver = function (item) {

   var objHandle
     , enabled
     , isEnabled
     ;

   if (item) {

      avatarList.enabled(false);
      objHandle = item.data();
      studentDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      studentUserNameEdit.clear();
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      studentEnabledCheckBox.setChecked(enabled);
      createStudentDialog.open(self, function (value, dialog) {

         var text
           , post
           , forumHandle
           ;
         if (value) {

            dmz.object.text(objHandle, dmz.stance.DisplayNameHandle, studentDisplayNameEdit.text());
            text = studentUserNameEdit.text();
            if (text) {

               dmz.object.text(
                  objHandle,
                  dmz.stance.NameHandle,
                  dmz.ui.crypto.hash(studentUserNameEdit.text(), dmz.ui.crypto.Sha1));
            }
            isEnabled = studentEnabledCheckBox.isChecked();
            if (isEnabled != enabled) {

               dmz.object.flag(objHandle, dmz.stance.ActiveHandle, isEnabled);
            }
         }
         studentDisplayNameEdit.clear();
         studentUserNameEdit.clear();
         avatarList.enabled(true);
         avatarList.currentText("Default");
      });
   }
};

editTech = function (item) {

   var objHandle
     , avatar
     , enabled
     , isEnabled
     ;

   if (item) {

      objHandle = item.data();
      studentDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      studentUserNameEdit.clear();
      avatar = dmz.object.text(objHandle, dmz.stance.PictureHandle);
      avatarList.currentText(AvatarPixmapList[avatar] ? avatar : "Default");
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      studentEnabledCheckBox.setChecked(enabled);
      createStudentDialog.open(self, function (value, dialog) {

         var text
           , post
           , forumHandle
           ;
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
            isEnabled = studentEnabledCheckBox.isChecked();
            if (isEnabled != enabled) {

               dmz.object.flag(objHandle, dmz.stance.ActiveHandle, isEnabled);
            }
         }
         studentDisplayNameEdit.clear();
         studentUserNameEdit.clear();
         avatarList.currentText("Default");
      });
   }
};

editAdvisor = function (item) {

   var objHandle
     , group
     , enabled
     , isEnabled
     ;

   if (item) {

      objHandle = item.data();
      advisorDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      advisorEmailEdit.clear();
      advisorGroupList.currentIndex(groupList.indexOf(dmz.stance.getUserGroupHandle(objHandle)));
      advisorGroupList.enabled(false);
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      advisorEnabledCheckBox.setChecked(enabled);
      createStudentDialog.open(self, function (value, dialog) {

         var name
           , text
           , state
           ;
         if (value) {

            text = advisorEmailEdit.text() || "";
            dmz.object.text(
               objHandle,
               dmz.stance.NameHandle,
               dmz.ui.crypto.hash(text.toLowerCase(), dmz.ui.crypto.Sha1));
            dmz.object.text(objHandle, dmz.stance.DisplayNameHandle, advisorDisplayNameEdit.text());
            dmz.object.flag(objHandle, dmz.stance.ActiveHandle, advisorEnabledCheckBox.isChecked());
            state = dmz.stance.AdvisorPermissions;
            advisorCB.forEach(function (widget, index) {

               if (widget.isChecked()) { state = state.or(dmz.stance.AdvisorSets[index]); }
            });
            dmz.object.state(objHandle, dmz.stance.Permissions, state);
         }
         advisorDisplayNameEdit.clear();
         advisorEmailEdit.clear();
         advisorGroupList.enabled(true);
      });
   }
};

TechListWidget.observe(self, "itemActivated", editTech);
AdminListWidget.observe(self, "itemActivated", editAdvisor);
ObserverListWidget.observe(self, "itemActivated", editObserver);
AdvisorListWidget.observe(self, "itemActivated", editAdvisor);
StudentListWidget.observe(self, "itemActivated", editStudent);

advisorGroupList.observe(self, "currentIndexChanged", function (index) {

   var groupHandle = groupList[index]
     , advisors = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle) || []
     ;

   advisorCB.forEach(function (cb) { cb.setChecked(false); });
   advisors.forEach(function (advisorHandle) {

      advisorCB[dmz.object.scalar(advisorHandle, dmz.stance.ID)].text(dmz.stance.DisplayName(advisorHandle));
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

      groupBox = dmz.ui.groupBox.create("Ungrouped Students");
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

dmz.object.text.observe(self, dmz.stance.TitleHandle, function (objHandle, attr, value) {

   if (injectItems[objHandle] && injectItems[objHandle].item) { injectItems[objHandle].item.text(value); }
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

   var count
     , idx
     , max
     ;
   if (value) {

      if (dmz.stance.isAllowed(objHandle, dmz.stance.SwitchGroupFlag)) {

         max = 1;
         if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterMediaFlag)) {

            max = 2;
            if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterAdvisorsFlag)) {

               max = 3;
               if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterGroupsFlag)) {

                  max = 4;
                  if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterUsersFlag)) { max = 5; }
               }
            }
         }

         count = TabWidget.count();
         self.log.warn (dmz.stance.getDisplayName(objHandle) + "-> max:", max, "count:", count);
         while (count > max) {

            count -= 1;
            TabWidget.remove(Tabs[count].widget);
            Tabs[count].widget.hide();
         }

         TabWidget.show();
         dock.enabled(true);
         dock.show();

      }
      else {

         TabWidget.hide();
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

dmz.object.state.observe(self, dmz.stance.Permissions, function (handle, attrHandle, value) {

   var list;
   if (userItems[handle]) {

      if (value.and(dmz.stance.AlterUsersFlag).bool()) { list = TechListWidget; }
      else if (value.and(dmz.stance.AlterMediaFlag).bool()) {

         list = AdminListWidget;
         if (!dmz.object.linkHandle(dmz.stance.AdminHandle, CurrentGameHandle, handle)) {

            dmz.object.link(dmz.stance.AdminHandle, CurrentGameHandle, handle);
         }
      }
      else if (value.and(dmz.stance.CastVoteFlag).bool()) { list = StudentListWidget; }
      else if (value.and(dmz.stance.SwitchGroupFlag).bool()) { list = ObserverListWidget; }
      else if (value.and(dmz.stance.StudentDataFlag).bool()) { list = AdvisorListWidget; }

      if (list) {

         if (!userItems[handle].item) {

            userItems[handle].item = list.addItem(dmz.stance.getDisplayName(handle), handle);
            userItems[handle].item.foreground(userItems[handle].active ? ActiveBrush : DisabledBrush);
            self.log.warn ("Inserting", handle, userItems[handle].active);
         }
         else { list.addItem(userItems[handle].item); }
      }
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
