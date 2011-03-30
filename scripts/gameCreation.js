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
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , resources: require("dmz/runtime/resources")
   , module: require("dmz/runtime/module")
   }

   // UI Elements
   , editScenarioWidget = dmz.ui.loader.load("EditScenarioForm.ui")
   , groupStudentList = editScenarioWidget.lookup("groupStudentList")
   , ungroupedStudentList = editScenarioWidget.lookup("ungroupedStudentList")
   , groupComboBox = editScenarioWidget.lookup("groupComboBox")
   , gameStateButton = editScenarioWidget.lookup("gameStateButton")
   , advisorComboBox = editScenarioWidget.lookup("advisorList")
   , lobbyistComboBox = editScenarioWidget.lookup("lobbyistList")
   , forumComboBox = editScenarioWidget.lookup("forumList")
   , forumAssocList = editScenarioWidget.lookup("forumAssocList")
   , forumGroupList = editScenarioWidget.lookup("forumGroupList")

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

   , timeMod
   , startDate = editScenarioWidget.lookup("startDate")
   , currentDate = editScenarioWidget.lookup("currentDate")
   , nextDate = editScenarioWidget.lookup("nextDate")
   , gameDateTime = editScenarioWidget.lookup("gameTime")
   , serverDateTime = editScenarioWidget.lookup("serverTime")

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui")

   , instructorDialog = dmz.ui.loader.load("InstructorWindowDialog")
   , scenarioList = instructorDialog.lookup("scenarioList")

   , editAdvisorDialog = dmz.ui.loader.load("EditAdvisorDialog.ui")
   , advisorGroupList = editAdvisorDialog.lookup("groupList")
   , pictureList = editAdvisorDialog.lookup("pictureList")
   , advisorBio = editAdvisorDialog.lookup("advisorBio")
   , pictureLabel = editAdvisorDialog.lookup("pictureLabel")
   , advisorSpecialty = editAdvisorDialog.lookup("specialtyEdit")

   , editLobbyistDialog = dmz.ui.loader.load("EditLobbyistDialog.ui")
   , lobbyistPictureLabel = editLobbyistDialog.lookup("pictureLabel")
   , lobbyistGroupList = editLobbyistDialog.lookup("groupList")
   , lobbyistBio = editLobbyistDialog.lookup("lobbyistBio")
   , lobbyistMessage = editLobbyistDialog.lookup("lobbyistMessage")
   , lobbyistPictureList = editLobbyistDialog.lookup("pictureList")

   , CreateMediaInjectDialog = dmz.ui.loader.load("MediaInjectDialog.ui")
   , MediaTypeList = CreateMediaInjectDialog.lookup("mediaType")
   , MediaTitleText = CreateMediaInjectDialog.lookup("titleText")
   , MediaUrlText = CreateMediaInjectDialog.lookup("urlText")
   , MediaGroupFLayout = CreateMediaInjectDialog.lookup("groupLayout")

   // Variables
   , groupList = []
   , userList = {}
   , gameList = []
   , advisorPictureObjects = []
   , lobbyistPictureObjects = []
   , advisorList = []
   , lobbyistList = []
   , forumList = []
   , forumGroupWidgets = {}
   , CurrentGameHandle = false
   , MediaTypes =
        { Video: { type: dmz.stance.VideoType, attr: dmz.stance.ActiveVideoHandle }
        , Memo: { type: dmz.stance.MemoType, attr: dmz.stance.ActiveMemoHandle }
        , Newspaper: { type: dmz.stance.NewspaperType, attr: dmz.stance.ActiveNewspaperHandle }
        }

   // Function decls
   , createNewGame
   , createNewUser
   , readUserConfig
   , createGroup
   , removeCurrentGroup
   , arrayContains
   , userToGroup
   , userFromGroup
   , configToStudent
   , setup
   , groupToForum
   , groupFromForum
   , updateTimePage
   ;

self.shutdown = function () { dmz.ui.mainWindow.removeDock(DockName); }

configToStudent = function (student) {

   var userName
     , displayName
     ;

   userName = student.string("userName", "UNAME FAIL");
   displayName = student.string("displayName", "DNAME FAIL");
   return createNewUser(userName, displayName);
};

readUserConfig = function () {

   var studentList = self.config.get("student-list.student")
     , groupConfigList = self.config.get("group-list.group")
     ;

   if (studentList) { studentList.forEach(configToStudent); }

   if (groupConfigList) {

      groupConfigList.forEach(function (group) {

         var studentList = group.get("student-list.student")
           , name = group.string("name", "No Name Group")
           , groupHandle
           , idx
           , user
           ;

         groupHandle = dmz.object.create(dmz.stance.GroupType);
         dmz.object.text(groupHandle, dmz.stance.NameHandle, name);
         dmz.object.link(dmz.stance.GameGroupHandle, CurrentGameHandle, groupHandle);
         for (idx = 0; idx < studentList.length; idx += 1) {

            user = configToStudent(studentList[idx])
            if (user) {

               dmz.object.link(dmz.stance.GroupMembersHandle, groupHandle, user);
            }
         }
         dmz.object.activate(groupHandle);
      });
   }
};

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
   advisorGroupList.addItem(name);
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
   index = advisorGroupList.findText(name);
   if (index !== -1) { advisorGroupList.removeIndex(index); }
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
function (linkObjHandle, attrHandle, gameHandle, advisorHandle) {

   if (advisorList.indexOf(advisorHandle) === -1) {

      advisorComboBox.addItem(dmz.stance.getDisplayName(advisorHandle));
      advisorList.push(advisorHandle);
   }
});

dmz.object.link.observe(self, dmz.stance.GameUngroupedAdvisorsHandle,
function (linkObjHandle, attrHandle, gameHandle, advisorHandle) {

   if (advisorList.indexOf(advisorHandle) === -1) {

      advisorComboBox.addItem(dmz.stance.getDisplayName(advisorHandle));
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
            dmz.object.text(handle, dmz.stance.NameHandle, name);
            dmz.object.link(dmz.stance.GameForumsHandle, CurrentGameHandle, handle);
            dmz.object.activate(handle);
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

   gameStateButton.text(
      dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle) ?
      "End Game" :
      "Start Game");

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

            if (value) {

               active = !active;
               dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle, active);
               gameStateButton.text(active ? "End Game" : "Start Game");
            }
         });
   });

   pictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < advisorPictureObjects.length) {

         pictureLabel.pixmap(advisorPictureObjects[index]);
      }
   });

   pictures = self.config.get("advisor-pictures.picture");
   if (pictures) {

      pictures.forEach(function (pic) {

         var name = pic.string("name")
           , file = dmz.resources.findFile(name)
           ;

         file = dmz.ui.graph.createPixmap(file);
         advisorPictureObjects.push(file);
         pictureList.addItem(name);
      });

      if (pictureList.count()) { pictureList.currentIndex(0); }
   }

   editScenarioWidget.observe(self, "editAdvisorButton", "clicked", function () {

      var groupIndex
        , groupHandle
        , pictureIndex
        , advisorHandle
        , links
        , index = advisorComboBox.currentIndex()
        , text
        ;

      if (index < advisorList.length) {

         advisorHandle = advisorList[index];

         links = dmz.object.superLinks(advisorHandle, dmz.stance.AdvisorGroupHandle);
         if (links && links[0]) {

            groupIndex = advisorGroupList.findText(dmz.stance.getDisplayName(links[0]));
         }

         pictureIndex = pictureList.findText(dmz.object.text(advisorHandle, dmz.stance.PictureHandle));

         pictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
         advisorGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
         text = dmz.object.text(advisorHandle, dmz.stance.BioHandle);
         if (!text) { text = ""; }
         advisorBio.text(text);
         text = dmz.object.text(advisorHandle, dmz.stance.CommentHandle);
         if (!text) { text = ""; }
         advisorSpecialty.text(text);

         editAdvisorDialog.open(self, function (result) {

            if (result) {

               dmz.object.unlinkSuperObjects(advisorHandle, dmz.stance.AdvisorGroupHandle);
               dmz.object.unlinkSuperObjects(advisorHandle, dmz.stance.GameUngroupedAdvisorsHandle);
               dmz.object.link(
                  dmz.stance.AdvisorGroupHandle,
                  groupList[advisorGroupList.currentIndex()],
                  advisorHandle);

               text = pictureList.currentText();
               dmz.object.text(advisorHandle, dmz.stance.PictureHandle, text);
               dmz.object.text(advisorHandle, dmz.stance.BioHandle, advisorBio.text());
               dmz.object.text(advisorHandle, dmz.stance.CommentHandle, advisorSpecialty.text());
            }
         });
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

   editScenarioWidget.observe(self, "editLobbyistButton", "clicked", function () {

      var groupIndex
        , groupHandle
        , pictureIndex
        , lobbyistHandle
        , links
        , index = lobbyistComboBox.currentIndex()
        , text
        ;

      if (index < lobbyistList.length) {

         lobbyistHandle = lobbyistList[index];
         links = dmz.object.superLinks(lobbyistHandle, dmz.stance.LobbyistGroupHandle);
         if (links && links[0]) {

            groupIndex = lobbyistGroupList.findText(dmz.stance.getDisplayName(links[0]));
         }

         pictureIndex =
            lobbyistPictureList.findText(dmz.object.text(lobbyistHandle, dmz.stance.PictureHandle));

         lobbyistPictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
         lobbyistGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
         text = dmz.object.text(lobbyistHandle, dmz.stance.BioHandle);
         if (!text) { text = ""; }
         lobbyistBio.text(text);

         text = dmz.object.text(lobbyistHandle, dmz.stance.LobbyistMessageHandle);
         if (!text) { text = ""; }
         lobbyistMessage.text(text);

         editLobbyistDialog.open(self, function (result) {

            if (result) {

               dmz.object.unlinkSuperObjects(lobbyistHandle, dmz.stance.LobbyistGroupHandle);
               dmz.object.link(
                  dmz.stance.LobbyistGroupHandle,
                  groupList[lobbyistGroupList.currentIndex()],
                  lobbyistHandle);

               text = lobbyistPictureList.currentText();
               dmz.object.text(lobbyistHandle, dmz.stance.PictureHandle, text);
               dmz.object.text(lobbyistHandle, dmz.stance.BioHandle, lobbyistBio.text());
               dmz.object.text(lobbyistHandle, dmz.stance.LobbyistMessageHandle, lobbyistMessage.text());
            }
         });
      }
   });

   lobbyistPictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < lobbyistPictureObjects.length) {

         lobbyistPictureLabel.pixmap(lobbyistPictureObjects[index]);
      }
   });
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

   dmz.ui.inputDialog.create(
      { title: "Create New Group"
      , label: "Group Name:"
      , text: ""
      }
      , editScenarioWidget
   ).open(self, function (value, groupName) {

      var group;
      if (value) {

         group = dmz.object.create(dmz.stance.GroupType);
         dmz.object.text(group, dmz.stance.NameHandle, groupName);
         dmz.object.link(dmz.stance.GameGroupHandle, CurrentGameHandle, group);
         dmz.object.activate(group);
      }
   });
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

editScenarioWidget.observe(self, "addLobbyistButton", "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create New Lobbyist"
      , label: "Lobbyist Name:"
      , text: ""
      }
      , editScenarioWidget
      ).open(self, function (value, name) {

         var handle;
         if (value && (name.length > 0)) {

            handle = dmz.object.create(dmz.stance.LobbyistType);
            dmz.object.text(handle, dmz.stance.NameHandle, name);
            dmz.object.link(dmz.stance.GameUngroupedLobbyistsHandle, CurrentGameHandle, handle);
            dmz.object.activate(handle);
         }
      });
});

editScenarioWidget.observe(self, "removeLobbyistButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this lobbyist?"
      , informativeText: "Clicking <b>Ok</b> will cause all data for this lobbyist to be permanently deleted!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioWidget
   ).open(self, function (value) {

      var index = lobbyistComboBox.currentIndex()
        , handle
        ;

      if (value && (index < lobbyistList.length)) {

         handle = lobbyistList[index];
         lobbyistList.splice(index, 1);
         lobbyistComboBox.removeIndex(index);
         dmz.object.destroy(handle);
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

                     if (!dmz.object.flag(userHandle, dmz.stance.AdminFlagHandle)) {

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

editScenarioWidget.observe(self, "addAdvisorButton", "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create New Advisor"
      , label: "Advisor Name:"
      , text: ""
      }
      , editScenarioWidget
      ).open(self, function (value, name) {

         var handle;

         if (value && (name.length > 0)) {

            handle = dmz.object.create(dmz.stance.AdvisorType);
            dmz.object.text(handle, dmz.stance.NameHandle, name);
            dmz.object.link(dmz.stance.GameUngroupedAdvisorsHandle, CurrentGameHandle, handle);
            dmz.object.activate(handle);
         }
      });
});

editScenarioWidget.observe(self, "removeAdvisorButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this advisor?"
      , informativeText: "Clicking <b>Ok</b> will cause all data for this advisor to be permanently deleted!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioWidget
   ).open(self, function (value) {

      var index = advisorComboBox.currentIndex()
        , handle
        ;

      if (value && (index < advisorList.length)) {

         handle = advisorList[index];
         advisorList.splice(index, 1);
         advisorComboBox.removeIndex(index);
         dmz.object.destroy(handle);
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

editScenarioWidget.observe(self, "tabWidget", "currentChanged", function (current, widget) {

   if (current === 3) {

      updateTimePage();
      self.log.warn("time page: " + current);
   }
});

updateTimePage = function () {

   var frameTime = dmz.util.timeStampToDate(dmz.time.getFrameTime());

   startDate.dateTime(frameTime);
}

dmz.object.timeStamp.observe(self, dmz.stance.ServerTimeHandle,
function (handle, attr, value) {

   if (handle === CurrentGameHandle) {

      serverTime = value;

      serverDateTime.dateTime(dmz.util.timeStampToDate(serverTime));
   }
});

dmz.time.setRepeatingTimer (self, 2.0, function (Delta) {

   if (timeMod) {

      serverDateTime.dateTime(dmz.util.timeStampToDate(timeMod.serverTime()));
      gameDateTime.dateTime(dmz.util.timeStampToDate(timeMod.gameTime()));
   }
});

dmz.module.subscribe(self, "game-time", function (Mode, module) {

   if (Mode === dmz.module.Activate) { timeMod = module; }
   else if (Mode === dmz.module.Deactivate) { timeMod = undefined; }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      if (dmz.object.flag(objHandle, dmz.stance.AdminFlagHandle)) {

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

(function () {

   editScenarioWidget.lookup("tabWidget").hide();
   dock.hide();
   dock.enabled(false);
}());
