var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
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
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , const: require("const")
   }

   // UI Elements
   , editScenarioDialog = dmz.ui.loader.load("EditScenarioDialog.ui")
   , groupStudentList = editScenarioDialog.lookup("groupStudentList")
   , ungroupedStudentList = editScenarioDialog.lookup("ungroupedStudentList")
   , groupComboBox = editScenarioDialog.lookup("groupComboBox")
   , gameStateButton = editScenarioDialog.lookup("gameStateButton")
   , advisorComboBox = editScenarioDialog.lookup("advisorList")
   , lobbyistComboBox = editScenarioDialog.lookup("lobbyistList")
   , forumComboBox = editScenarioDialog.lookup("forumList")
   , forumAssocList = editScenarioDialog.lookup("forumAssocList")
   , forumGroupList = editScenarioDialog.lookup("forumGroupList")

   , createGroupDialog = dmz.ui.loader.load("CreateGroupDialog.ui")

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui")

   , groupListDialog = dmz.ui.loader.load("GroupListDialog.ui")
   , listLayout = groupListDialog.lookup("vLayout")

   , instructorDialog = dmz.ui.loader.load("InstructorWindowDialog")
   , scenarioList = instructorDialog.lookup("scenarioList")

   , editAdvisorDialog = dmz.ui.loader.load("EditAdvisorDialog.ui")
   , advisorGroupList = editAdvisorDialog.lookup("groupList")
   , pictureList = editAdvisorDialog.lookup("pictureList")
   , advisorBio = editAdvisorDialog.lookup("advisorBio")
   , pictureLabel = editAdvisorDialog.lookup("pictureLabel")

   , editLobbyistDialog = dmz.ui.loader.load("EditLobbyistDialog.ui")
   , lobbyistPictureLabel = editLobbyistDialog.lookup("pictureLabel")
   , lobbyistGroupList = editLobbyistDialog.lookup("groupList")
   , lobbyistBio = editLobbyistDialog.lookup("lobbyistBio")
   , lobbyistMessage = editLobbyistDialog.lookup("lobbyistMessage")
   , lobbyistPictureList = editLobbyistDialog.lookup("pictureList")

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

   ;

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

         groupHandle = dmz.object.create(dmz.const.GroupType);
         dmz.object.activate(groupHandle);
         dmz.object.text(groupHandle, dmz.const.NameHandle, name);
         dmz.object.link(dmz.const.GameGroupHandle, CurrentGameHandle, groupHandle);
         for (idx = 0; idx < studentList.length; idx += 1) {

            user = configToStudent(studentList[idx])
            if (user) {

               dmz.object.link(dmz.const.GroupMembersHandle, groupHandle, user);
            }
         }
      });
   }
};

createNewUser = function (userName, displayName) {

   var user
     ;

   if (userName && displayName) {

      user = dmz.object.create(dmz.const.UserType);
      dmz.object.text(user, dmz.const.NameHandle, userName);
      dmz.object.text(user, dmz.const.DisplayNameHandle, displayName);
      dmz.object.activate(user);
   }
   return user;
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType) {

      if (objType.isOfType(dmz.const.GameType)) {

         CurrentGameHandle = objHandle;
         setup();
      }
   }
});

dmz.object.link.observe(self, dmz.const.GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.const._getDisplayName(subHandle);
   groupList.push(subHandle);
   groupComboBox.addItem(name);
   advisorGroupList.addItem(name);
   lobbyistGroupList.addItem(name);

   forumGroupWidgets[subHandle] =
      { assoc: forumAssocList.addItem(name, subHandle)
      , unassoc: forumGroupList.addItem(name, subHandle)
      };
   forumGroupWidgets[subHandle].assoc.hidden(true);
});

dmz.object.unlink.observe(self, dmz.const.GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.const._getDisplayName(subHandle)
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

dmz.object.link.observe(self, dmz.const.GameForumsHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.const._getDisplayName(subHandle);

   forumComboBox.addItem(name);
   forumList.push(subHandle);
});

dmz.object.unlink.observe(self, dmz.const.GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.const._getDisplayName(subHandle)
     , index
     ;

   index = forumComboBox.findText(name);
   if (index !== -1) {

      forumComboBox.removeIndex(index);
      forumList.splice(index, 1);
   }
});

dmz.object.link.observe(self, dmz.const.ForumLink,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   if (forumGroupWidgets[superHandle]) {

      forumGroupWidgets[superHandle].unassoc.hidden(true);
      forumGroupWidgets[superHandle].assoc.hidden(false);
   }
});

dmz.object.unlink.observe(self, dmz.const.ForumLink,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   if (forumGroupWidgets[superHandle]) {

      forumGroupWidgets[superHandle].unassoc.hidden(false);
      forumGroupWidgets[superHandle].assoc.hidden(true);
   }
});

dmz.object.link.observe(self, dmz.const.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, studentHandle) {

   if (!userList[studentHandle]) {

      userList[studentHandle] =
         groupStudentList.addItem(dmz.const._getDisplayName(studentHandle), studentHandle);

      userList[studentHandle].hidden(groupList[0] && (groupHandle !== groupList[0]));
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

      members = dmz.object.subLinks(groupHandle, dmz.const.GroupMembersHandle);
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
            dmz.object.linkHandle(dmz.const.GameUngroupedUsersHandle, CurrentGameHandle, objHandle));
         dmz.object.link(dmz.const.GroupMembersHandle, groupList[currentIndex], objHandle);
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
            dmz.object.linkHandle(dmz.const.GroupMembersHandle, groupList[currentIndex], objHandle));
         dmz.object.link(dmz.const.GameUngroupedUsersHandle, CurrentGameHandle, objHandle);
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

   self.log.warn (count, item);
   if (item && count) {

      groupHandle = item.data();
      currentIndex = forumComboBox.currentIndex();
      if (currentIndex < forumList.length) { forumHandle = forumList[currentIndex]; }
      else { forumHandle = false; }

      self.log.warn (forumList.length, currentIndex, groupHandle, forumHandle);
      if (groupHandle && forumHandle) {

         dmz.object.link(dmz.const.ForumLink, groupHandle, forumHandle);
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
            dmz.object.linkHandle(dmz.const.ForumLink, groupHandle, forumHandle));

      }
   }
};

editScenarioDialog.observe(self, "addForumGroupButton", "clicked", function () {

   groupToForum(forumGroupList.currentItem());
});

editScenarioDialog.observe(self, "removeForumGroupButton", "clicked", function () {

   groupFromForum(forumAssocList.currentItem());
});

forumComboBox.observe(self, "currentIndexChanged", function (index) {

   var listHandle = forumList[index]
     , forumGroups
     ;

   if (listHandle) {

      forumGroups = dmz.object.superLinks(listHandle, dmz.const.ForumLink);
      self.log.warn (listHandle, ":", forumGroups);
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

editScenarioDialog.observe(self, "createForumButton", "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create Forum"
      , label: "Forum Name:"
      , text: ""
      }
      , editScenarioDialog
      ).open(self, function (value, name) {

         var handle;
         if (value && (name.length > 0)) {

            handle = dmz.object.create(dmz.const.ForumType);
            dmz.object.activate(handle);
            dmz.object.text(handle, dmz.const.NameHandle, name);
            dmz.object.link(dmz.const.GameForumsHandle, CurrentGameHandle, handle);
         }
      });
});

editScenarioDialog.observe(self, "deleteForumButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this forum?"
      , informativeText: "Clicking <b>Ok</b> will cause all forum data to be permanently erased!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioDialog
   ).open(self, function (value) {

      var handle
        , index
        ;
      if (value) {

         index = forumComboBox.currentIndex();
         handle = forumList[index];
         if (handle) { dmz.object.destroy(handle); }
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



//      groupList = [];
//      userList = {};
//      advisorPictureObjects = [];
//      lobbyistPictureObjects = [];
//      advisorList = [];
//      lobbyistList = [];
//      groupComboBox.clear();
//      ungroupedStudentList.clear();
//      groupStudentList.clear();
//      advisorComboBox.clear();
//      lobbyistGroupList.clear();

      // Iterate over groups linked to game and create them in UI
   groups = dmz.object.subLinks(CurrentGameHandle, dmz.const.GameGroupHandle);
   if (groups) {

      groups.forEach(function (group) {
         // For each group, iterate over linked students

         var students = dmz.object.subLinks(group, dmz.const.GroupMembersHandle)
           , advisors = dmz.object.subLinks(group, dmz.const.AdvisorGroupHandle)
           , lobbyists = dmz.object.subLinks(group, dmz.const.LobbyistGroupHandle)
           , groupName = dmz.const._getDisplayName(group)
           ;

         if (students) {

            students.forEach(function (student) {

               userList[student] = groupStudentList.addItem(
                  dmz.const._getDisplayName(student), student);
            });
         }
         if (advisors) {

            advisors.forEach(function (advisor) {

               advisorComboBox.addItem(dmz.const._getDisplayName(advisor));
               advisorList.push(advisor);
            });
         }
         if (lobbyists) {

            lobbyists.forEach(function (lobbyist) {

               lobbyistComboBox.addItem(dmz.const._getDisplayName(lobbyist));
               lobbyistList.push(lobbyist);
            });
         }
      });

      members = dmz.object.subLinks(groupList[0], dmz.const.GroupMembersHandle);
      count = groupStudentList.count();
      for (idx = 0; idx < count; idx += 1) {

         item = groupStudentList.item(idx);
         item.hidden(!members || (members.indexOf(item.data()) === -1));
      }
   }

   ungrouped = dmz.object.subLinks(CurrentGameHandle, dmz.const.GameUngroupedUsersHandle);
   self.log.warn ("ungrouped:", ungrouped);
   if (ungrouped) {

      ungrouped.forEach(function (student) {

         userList[student] = ungroupedStudentList.addItem(
            dmz.const._getDisplayName(student), student);
      });
   }

   ungrouped = dmz.object.subLinks(CurrentGameHandle, dmz.const.GameUngroupedAdvisorsHandle);
   if (ungrouped) {

      ungrouped.forEach(function (advisor) {

         advisorComboBox.addItem(dmz.const._getDisplayName(advisor))
         advisorList.push(advisor);
      });
   }

   ungrouped = dmz.object.subLinks(CurrentGameHandle, dmz.const.GameUngroupedLobbyistsHandle);
   if (ungrouped) {

      ungrouped.forEach(function (lobbyist) {

         lobbyistComboBox.addItem(dmz.const._getDisplayName(lobbyist));
         lobbyistList.push(advisor);
      });
   }

   gameStateButton.text(
      dmz.object.flag(CurrentGameHandle, dmz.const.ActiveHandle) ?
      "End Game" :
      "Start Game");

   gameStateButton.observe(self, "clicked", function () {

      var active = dmz.object.flag(CurrentGameHandle, dmz.const.ActiveHandle)
        ;

      dmz.ui.messageBox.create(
         { type: dmz.ui.messageBox.Warning
         , text: "Are you sure that you'd like to " + (active ? "end " : "start ") + "the game?"
         , informativeText: "If you click <b>Ok</b>, all users will be sent an email notification."
         , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
         , defaultButton: dmz.ui.messageBox.Cancel
         }
         , editScenarioDialog
         ).open(self, function (value) {

            if (value) {

               active = !active;
               dmz.object.flag(CurrentGameHandle, dmz.const.ActiveHandle, active);
               gameStateButton.text(active ? "End Game" : "Start Game");
            }
         });
   });

   pictures = self.config.get("advisor-picture-list.picture");
   directory = self.config.string("advisor-picture-list.path");
   item = self.config.string("advisor-picture-list.default");
   advisorPictureObjects[0] = dmz.ui.graph.createPixmap(directory + item);
   pictureLabel.pixmap(advisorPictureObjects[0]);
   pictures.forEach(function (file) {

      advisorPictureObjects.push(dmz.ui.graph.createPixmap(directory + file.string("file")));
      pictureList.addItem(file.string("name"));
   });

   pictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < advisorPictureObjects.length) {

         pictureLabel.pixmap(advisorPictureObjects[index]);
      }
   });

   editScenarioDialog.observe(self, "editAdvisorButton", "clicked", function () {

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

         links = dmz.object.superLinks(advisorHandle, dmz.const.AdvisorGroupHandle);
         if (links && links[0]) {

            groupIndex = advisorGroupList.findText(dmz.const._getDisplayName(links[0]));
         }

         pictureIndex = pictureList.findText(dmz.object.text(advisorHandle, dmz.const.PictureFileNameHandle));

         pictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
         advisorGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
         text = dmz.object.text(advisorHandle, dmz.const.BioHandle);
         if (!text) { text = " "; }
         advisorBio.text(text);

         editAdvisorDialog.open(self, function (result) {

            if (result) {

               dmz.object.unlinkSuperObjects(advisorHandle, dmz.const.AdvisorGroupHandle);
               dmz.object.link(
                  advisorHandle,
                  dmz.const.AdvisorGroupHandle,
                  groupList[advisorGroupList.currentIndex()]);

               dmz.object.text(advisorHandle, dmz.const.PictureDirectoryNameHandle, directory);
               dmz.object.text(advisorHandle, dmz.const.PictureFileNameHandle, pictureList.currentText());
               dmz.object.text(advisorHandle, dmz.const.BioHandle, advisorBio.text());
            }
         });
      }
   });

   pictures = self.config.get("lobbyist-picture-list.picture");
   directory = self.config.string("lobbyist-picture-list.path");
   item = self.config.string("lobbyist-picture-list.default");
   lobbyistPictureObjects[0] = dmz.ui.graph.createPixmap(directory + item);
   lobbyistPictureLabel.pixmap(lobbyistPictureObjects[0]);
   pictures.forEach(function (file) {

      lobbyistPictureObjects.push(dmz.ui.graph.createPixmap(directory + file.string("file")));
      lobbyistPictureList.addItem(file.string("name"));
   });

   editScenarioDialog.observe(self, "editLobbyistButton", "clicked", function () {

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

         links = dmz.object.superLinks(lobbyistHandle, dmz.const.LobbyistGroupHandle);
         if (links && links[0]) {

            groupIndex = lobbyistGroupList.findText(dmz.const._getDisplayName(links[0]));
         }

         pictureIndex =
            lobbyistPictureList.findText(dmz.object.text(lobbyistHandle, dmz.const.PictureFileNameHandle));

         lobbyistPictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
         lobbyistGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
         text = dmz.object.text(lobbyistHandle, dmz.const.BioHandle);
         if (!text) { text = " "; }
         lobbyistBio.text(text);

         text = dmz.object.text(lobbyistHandle, dmz.const.LobbyistMessageHandle);
         if (!text) { text = " "; }
         lobbyistMessage.text(text);

         editLobbyistDialog.open(self, function (result) {

            if (result) {

               dmz.object.unlinkSuperObjects(lobbyistHandle, dmz.const.LobbyistGroupHandle);
               dmz.object.link(
                  lobbyistHandle,
                  dmz.const.LobbyistGroupHandle,
                  groupList[lobbyistGroupList.currentIndex()]);

               dmz.object.text(lobbyistHandle, dmz.const.PictureFileNameHandle, lobbyistPictureList.currentText());
               dmz.object.text(lobbyistHandle, dmz.const.PictureDirectoryNameHandle, directory)
               dmz.object.text(lobbyistHandle, dmz.const.BioHandle, lobbyistBio.text());
               dmz.object.text(lobbyistHandle, dmz.const.LobbyistMessageHandle, lobbyistMessage.text());
            }
         });
      }
   });

   lobbyistPictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < lobbyistPictureObjects.length) {

         lobbyistPictureLabel.pixmap(lobbyistPictureObjects[index]);
      }
   });

   editScenarioDialog.open(self, function (result, dialog) {});
};

editScenarioDialog.observe(self, "addStudentButton", "clicked", function () {

   userToGroup(ungroupedStudentList.currentItem());
});

editScenarioDialog.observe(self, "removeStudentButton", "clicked", function () {

   userFromGroup(groupStudentList.currentItem());
});

groupStudentList.observe(self, "itemActivated", userFromGroup);
ungroupedStudentList.observe(self, "itemActivated", userToGroup);

editScenarioDialog.observe(self, "addGroupButton", "clicked", function () {

   createGroupDialog.open(self, function (value, dialog) {

      var groupName = dialog.lookup("groupName").text()
        , permissionType = dialog.lookup("permissionType")
        , group
        ;

      if (value) {

         group = dmz.object.create(dmz.const.GroupType);
         dmz.object.activate(group);
         dmz.object.text(group, dmz.const.NameHandle, groupName);
         dmz.object.link(dmz.const.GameGroupHandle, CurrentGameHandle, group);
      }
   });
});

editScenarioDialog.observe(self, "createPlayerButton", "clicked", function () {

   createStudentDialog.open(self, function (value, dialog) {

      var displayName = dialog.lookup("displayName")
        , userName = dialog.lookup("userName")
        , student
        ;

      if (value && displayName && userName) {

         student = createNewUser(displayName.text(), userName.text());
         if (student) {

            dmz.object.link(dmz.const.GameUngroupedUsersHandle, CurrentGameHandle, student);
            userList[student] = ungroupedStudentList.addItem(
               dmz.const._getDisplayName(student), student);

         }
      }
      displayName.clear();
      userName.clear();
   });
});

editScenarioDialog.observe(self, "deleteGameButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this game?"
      , informativeText: "Clicking <b>Ok</b> will cause all game data to be permanently erased!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioDialog
   ).open(self, function (value) {

      if (value) {

         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Critical
            , text: "This action will result in the permanent loss of all game data!"
            , informativeText: "Clicking <b>Ok</b> will cause all game data to be permanently erased!"
            , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Cancel
            }
            , editScenarioDialog
         ).open(self, function (value) {

            if (value) { dmz.object.destroy(CurrentGameHandle); }
         });
      }
   });
});

editScenarioDialog.observe(self, "removeGroupButton", "clicked", function () {

   var index = groupComboBox.currentIndex()
     , groupHandle = groupList[index]
     , groupMembers
     , count
     , idx
     , item
     ;

   self.log.warn (groupList);
   self.log.warn (index);

   groupMembers = dmz.object.subLinks(groupHandle, dmz.const.GroupMembersHandle);
   self.log.warn (groupMembers);

   groupMembers.forEach(function (user) {

      var item = userList[user];
      if (item) { userFromGroup(item); }
   });

   groupList.splice (index, 1);
   groupComboBox.removeIndex(index);
   dmz.object.destroy(groupHandle);
});

editScenarioDialog.observe(self, "allGroupButton", "clicked", function () {

   var groups
     , studentList
     , vLayout
     , groupBox
     ;

   groups = dmz.object.subLinks(CurrentGameHandle, dmz.const.GameGroupHandle);
   groups.forEach(function (groupHandle) {

      groupBox = dmz.ui.groupBox.create(dmz.const._getDisplayName(groupHandle));
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList = dmz.object.subLinks(groupHandle, dmz.const.GroupMembersHandle);
      if (studentList) {

         studentList.forEach(function (student) {

            vLayout.addWidget(dmz.ui.label.create(dmz.const._getDisplayName(student)));
         });
      }
      groupBox.layout(vLayout);
      listLayout.addWidget(groupBox);
   });

   studentList = dmz.object.subLinks(CurrentGameHandle, dmz.const.GameUngroupedUsersHandle);
   if (studentList) {

      groupBox = dmz.ui.groupBox.create("Ungrouped Students")
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList.forEach(function (student) {

         vLayout.addWidget(dmz.ui.label.create(dmz.const._getDisplayName(student)));
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

editScenarioDialog.observe(self, "addLobbyistButton", "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create New Lobbyist"
      , label: "Lobbyist Name:"
      , text: ""
      }
      , addLobbyistButton
      ).open(self, function (value, name) {

         var handle;
         if (value && (name.length > 0)) {

            handle = dmz.object.create(dmz.const.LobbyistType);
            dmz.object.text(handle, dmz.const.NameHandle, name);
            dmz.object.activate(handle);
            dmz.object.link(dmz.const.GameUngroupedLobbyistsHandle, CurrentGameHandle, handle);
            lobbyistComboBox.addItem(name);
            lobbyistList.push(handle);
         }
      });
});

editScenarioDialog.observe(self, "editLobbyistButton", "clicked", function () {

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

      links = dmz.object.superLinks(lobbyistHandle, dmz.const.LobbyistGroupHandle);
      if (links && links[0]) {

         groupIndex = lobbyistGroupList.findText(dmz.const._getDisplayName(links[0]));
      }

      pictureIndex =
         lobbyistPictureList.findText(dmz.object.text(lobbyistHandle, dmz.const.PictureFileNameHandle));

      lobbyistPictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
      lobbyistGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
      text = dmz.object.text(lobbyistHandle, dmz.const.BioHandle);
      if (!text) { text = " "; }
      lobbyistBio.text(text);

      text = dmz.object.text(lobbyistHandle, dmz.const.LobbyistMessageHandle);
      if (!text) { text = " "; }
      lobbyistMessage.text(text);

      editLobbyistDialog.open(self, function (result) {

         if (result) {

            dmz.object.unlinkSuperObjects(lobbyistHandle, dmz.const.LobbyistGroupHandle);
            dmz.object.link(
               lobbyistHandle,
               dmz.const.LobbyistGroupHandle,
               groupList[lobbyistGroupList.currentIndex()]);

            dmz.object.text(lobbyistHandle, dmz.const.PictureFileNameHandle, lobbyistPictureList.currentText());
            dmz.object.text(lobbyistHandle, dmz.const.PictureDirectoryNameHandle, directory)
            dmz.object.text(lobbyistHandle, dmz.const.BioHandle, lobbyistBio.text());
            dmz.object.text(lobbyistHandle, dmz.const.LobbyistMessageHandle, lobbyistMessage.text());
         }
      });
   }
});

editScenarioDialog.observe(self, "removeLobbyistButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this lobbyist?"
      , informativeText: "Clicking <b>Ok</b> will cause all data for this lobbyist to be permanently deleted!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , removeLobbyistButton
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

editScenarioDialog.observe(self, "addAdvisorButton", "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create New Advisor"
      , label: "Advisor Name:"
      , text: ""
      }
      , addAdvisorButton
      ).open(self, function (value, name) {

         var handle;

         if (value && (name.length > 0)) {

            handle = dmz.object.create(dmz.const.AdvisorType);
            dmz.object.activate(handle);
            dmz.object.text(handle, dmz.const.NameHandle, name);
            dmz.object.link(dmz.const.GameUngroupedAdvisorsHandle, CurrentGameHandle, handle);
            advisorComboBox.addItem(name);
            advisorList.push(handle);
         }
      });
});

editScenarioDialog.observe(self, "removeAdvisorButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this advisor?"
      , informativeText: "Clicking <b>Ok</b> will cause all data for this advisor to be permanently deleted!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , removeAdvisorButton
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

editScenarioDialog.observe(self, "removePlayerButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioDialog
   ).open(self, function (value) {});
});

editScenarioDialog.observe(self, "importStudentListButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioDialog
   ).open(self, function (value) {});
});

editScenarioDialog.observe(self, "generateReportButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioDialog
   ).open(self, function (value) {});
});

editScenarioDialog.observe(self, "gameStatsButton", "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Info
      , text: "This feature has not yet been implemented."
      , standardButtons: [dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Ok
      }
      , editScenarioDialog
   ).open(self, function (value) {});
});
