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
   , mask: require("dmz/types/mask")
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
   , pdfItemList = editScenarioWidget.lookup("pdfItemListWidget")
   , permissionTable = editScenarioWidget.lookup("permissionTableWidget")

   , startGameButton = editScenarioWidget.lookup("startGameButton")
   , endGameButton = editScenarioWidget.lookup("endGameButton")
   , showStudentsButton = editScenarioWidget.lookup("showStudentsButton")

   , TabWidget = editScenarioWidget.lookup("tabWidget")
   , SwitchGroupTab = { name: "Switch Group", widget: editScenarioWidget.lookup("SwitchGroupTab") }
   , MediaTab = { name: "Media Injects", widget: editScenarioWidget.lookup("MediaTab") }
   , AdvisorTab = { name: "Advisors", widget: editScenarioWidget.lookup("ModifyAdvisorTab") }
   , AlterGroupsTab = { name: "Groups", widget: editScenarioWidget.lookup("GroupTab") }
   , AlterUsersTab = { name: "Users", widget: editScenarioWidget.lookup("UserTab") }
   , ChangePermissionsTab = { name: "Permissions", widget: editScenarioWidget.lookup("PermissionTab") }

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
          , allowedAreas: [dmz.ui.consts.AllDockWidgetAreas]
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
   , lobbyistGroupListLabel = editLobbyistDialog.lookup("groupListLabel")
   , lobbyistPictureListLabel = editLobbyistDialog.lookup("pictureListLabel")
   , lobbyistActiveCheckbox = editLobbyistDialog.lookup("activeCheckBox")

   , CreateMediaInjectDialog = dmz.ui.loader.load("MediaInjectDialog.ui", editScenarioWidget)
   , MediaTitleText = CreateMediaInjectDialog.lookup("titleText")
   , MediaUrlText = CreateMediaInjectDialog.lookup("urlText")
   , MediaGroupFLayout = CreateMediaInjectDialog.lookup("groupLayout")
   , MediaOkButton = CreateMediaInjectDialog.lookup("okButton")
   , MediaURLWarning = CreateMediaInjectDialog.lookup("urlWarning")
   , ActiveCheckBox = CreateMediaInjectDialog.lookup("activeCheckBox")
   , ActiveLabel = CreateMediaInjectDialog.lookup("activeLabel")

   , AddGroupDialog = dmz.ui.loader.load("AddGroupDialog.ui", editScenarioWidget)
   , groupButtonBox = AddGroupDialog.lookup("buttonBox")
   , groupTemplatePic = AddGroupDialog.lookup("pictureLabel")
   , groupTemplateComboBox = AddGroupDialog.lookup("templateComboBox")
   , groupNameEdit = AddGroupDialog.lookup("nameEdit")
   , groupWikiLinkEdit = AddGroupDialog.lookup("wikiLinkEdit")
   , homeScreenLabel = AddGroupDialog.lookup("homeScreenLabel")

   , groupLayout = editScenarioWidget.lookup("groupLayout")

   // Variables
   , showStudentsMessage = dmz.message.create("showStudentsWindow")
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
           , urlEnd: "www.youtube.com"
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
        , PdfItem:
           { type: dmz.stance.PdfItemType
           , button: "addPdfItemButton"
           , urlEnd: ".pdf"
           , listItems: {}
           , list: pdfItemList
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
   , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
   , haveSetupPermissionTable = false
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false

   // Function decls
   , toTimeStamp = dmz.util.dateToTimeStamp
   , toDate = dmz.util.timeStampToDate
   , userToGroup
   , setup
   , readGroupTemplates
   , setGroupTemplate
   , modifyInjectItem
   , mediaInjectButtons
   , setType
   , setAdvisorList
   , setupPermissionTable
   , updatePermissionTable
   , gamePermissionObs
   ;

self.shutdown = function () { dmz.ui.mainWindow.removeDock(DockName); }

LoginSkippedMessage.subscribe(self, function (data) {

   LoginSkipped = true;
   editScenarioWidget.lookup("createTechButton").enabled(false);
   editScenarioWidget.lookup("createAdminButton").enabled(false);
   editScenarioWidget.lookup("createObserverButton").enabled(false);
   editScenarioWidget.lookup("createAdvisorButton").enabled(false);
   editScenarioWidget.lookup("createPlayerButton").enabled(false);
   Object.keys(MediaTypes).forEach(function (key) {

      editScenarioWidget.lookup(MediaTypes[key].button).enabled(false);
   });
   editScenarioWidget.lookup("addGroupButton").enabled(false);
   editScenarioWidget.lookup("editGroupButton").enabled(false);
   editScenarioWidget.lookup("addStudentButton").enabled(false);
});

editScenarioWidget.observe(self, "showStudentsButton", "clicked", function () {

   self.log.warn("showStudentsMessage:", showStudentsMessage);
   showStudentsMessage.send();
});

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
};

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
            case "Help": attr = dmz.stance.HelpImageHandle; break;
            case "Bookcase": attr = dmz.stance.BookcaseImageHandle; break;
            case "Rolodex": attr = dmz.stance.RolodexImageHandle; break;
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
};

dmz.object.create.observe(self, function (objHandle, objType) {

   var item = { handle: objHandle, active: true, permission: -1 };
   if (objType) {

      if (objType.isOfType(dmz.stance.GameType)) {

         CurrentGameHandle = objHandle;
         setup();
      }
      else if (objType.isOfType(dmz.stance.VideoType)) { item.type = MediaTypes.Video; }
      else if (objType.isOfType(dmz.stance.MemoType)) { item.type = MediaTypes.Memo; }
      else if (objType.isOfType(dmz.stance.NewspaperType)) { item.type = MediaTypes.Newspaper; }
      else if (objType.isOfType(dmz.stance.LobbyistType)) { item.type = MediaTypes.Lobbyist; }
      else if (objType.isOfType(dmz.stance.PdfItemType)) { item.type = MediaTypes.PdfItem; }
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

   if (!userList[studentHandle] &&
      !dmz.stance.isAllowed(studentHandle, dmz.stance.SwitchGroupFlag) &&
      dmz.stance.isAllowed(studentHandle, dmz.stance.ForumPostFlag) &&
      dmz.object.flag(studentHandle, dmz.stance.ActiveHandle)) {

      userList[studentHandle] =
         groupStudentList.addItem(dmz.stance.getDisplayName(studentHandle), studentHandle);

      userList[studentHandle].hidden(groupList[0] && (groupHandle !== groupList[0]));
   }
});

dmz.object.link.observe(self, dmz.stance.GameUngroupedUsersHandle,
function (linkObjHandle, attrHandle, userHandle, gameHandle) {

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
      members = members.filter(function (handle) {

         return !dmz.stance.isAllowed(handle, dmz.stance.SwitchGroupFlag) &&
            dmz.stance.isAllowed(handle, dmz.stance.ForumPostFlag) &&
            dmz.object.flag(handle, dmz.stance.ActiveHandle);
      });
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

   if (item && count && !LoginSkipped) {

      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         dmz.object.link(dmz.stance.GroupMembersHandle, objHandle, groupList[currentIndex]);
         dmz.object.link(dmz.stance.OriginalGroupHandle, objHandle, groupList[currentIndex]);
         ungroupedStudentList.removeItem(item);
         groupStudentList.addItem(item);
      }
   }
};

dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value, oldValue) {

   var data = injectItems[handle] || userItems[handle];

   if (data) {

      data.active = value;
      if (data.item) { data.item.foreground(value ? ActiveBrush : DisabledBrush); }
   }
   else if (handle === CurrentGameHandle) {

      startGameButton.enabled(!value);
      endGameButton.enabled(value);
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

ungroupedStudentList.observe(self, "itemActivated", userToGroup);

editScenarioWidget.observe(self, "editGroupButton", "clicked", function () {

   var pic
     , groupHandle = groupList[groupComboBox.currentIndex()]
     ;

   if (groupTemplateComboBox.count()) {

      groupTemplateComboBox.hide();
      homeScreenLabel.hide()
      pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(dmz.object.text(groupHandle, dmz.stance.BackgroundImageHandle)));
      if (pic) { groupTemplatePic.pixmap(pic); }
   }
   else { self.log.error ("No group templates found."); }

   groupNameEdit.text(dmz.stance.getDisplayName(groupHandle));
   groupWikiLinkEdit.text(dmz.object.text(groupHandle, dmz.stance.GroupWikiLinkHandle) || "");
   AddGroupDialog.open(self, function (value) {

      dmz.object.text(groupHandle, dmz.stance.NameHandle, groupNameEdit.text());
      dmz.object.text(groupHandle, dmz.stance.GroupWikiLinkHandle, groupWikiLinkEdit.text());
   });
});

editScenarioWidget.observe(self, "addGroupButton", "clicked", function () {

   if (groupTemplateComboBox.count()) {

      groupTemplateComboBox.show();
      homeScreenLabel.show();
      groupTemplatePic.pixmap(TemplateBackgroundPixmaps[0]);
      groupTemplateComboBox.currentIndex(0);
   }
   else { self.log.error ("No group templates found."); }

   groupNameEdit.text("");
   groupWikiLinkEdit.text("");

   AddGroupDialog.open(self, function (value) {

      var group
        , idx
        , handle
        , name
        , wikiLink
        , str
        , advisorImages
        , file
        , admins
        , resource
        ;

      if (value) {

         group = dmz.object.create(dmz.stance.GroupType);
         name = groupNameEdit.text() || "N/A";
         wikiLink = groupWikiLinkEdit.text();
         dmz.object.text(group, dmz.stance.NameHandle, name);
         dmz.object.text(group, dmz.stance.GroupWikiLinkHandle, wikiLink);
         advisorImages = setGroupTemplate(group, groupTemplateComboBox.currentIndex());
         advisorImages = advisorImages ? advisorImages : [];
         dmz.object.activate(group);
         dmz.object.scalar(group, dmz.stance.ID, (dmz.object.superLinks(CurrentGameHandle, dmz.stance.GameGroupHandle) || []).length);
         dmz.object.link(dmz.stance.GameGroupHandle, group, CurrentGameHandle);

         admins = dmz.object.superLinks(CurrentGameHandle, dmz.stance.GameObservers) || [];
         admins.forEach(function (observerHandle) {

            var linkHandle = dmz.object.link(dmz.stance.DataLinkHandle, observerHandle, group)
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

               resource = dmz.resources.lookupConfig(advisorImages[idx]);
               if (resource) {

                  file = dmz.resources.findFile(resource.string("alt.name"));
                  if (file) { dmz.object.text(handle, dmz.stance.PictureHandle, resource.string("alt.name")); }
                  else {

                     file = dmz.resources.findFile(resource.string("name"));
                     if (file) {

                        dmz.object.text(handle, dmz.stance.PictureHandle, resource.string("name"));
                     }
                     else { self.log.error("Picture for advisor could not be located."); }
                  }
               }
            }
            dmz.object.activate(handle);
            dmz.object.link(dmz.stance.AdvisorGroupHandle, handle, group);
         }
         handle = dmz.object.create(dmz.stance.ForumType);
         dmz.object.text(handle, dmz.stance.NameHandle, name);
         dmz.object.activate(handle);
         dmz.object.link(dmz.stance.ForumLink, handle, group);
         handle = dmz.object.create(dmz.stance.HelpForumType);
         dmz.object.text(handle, dmz.stance.NameHandle, name);
         dmz.object.activate(handle);
         dmz.object.link(dmz.stance.HelpLink, handle, group);
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
   if (advisorHandle && !LoginSkipped) {

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
         dmz.object.timeStamp(user, dmz.stance.LastPingTimeHandle, 0);
         dmz.object.timeStamp(
            user,
            dmz.stance.LastLoginTimeHandle,
            dmz.object.timeStamp(dmz.object.hil(), dmz.stance.LastLoginTimeHandle));
         dmz.object.flag(user, dmz.stance.UpdateLastLoginTimeHandle, false);
         dmz.object.scalar(user, dmz.stance.Permissions, dmz.stance.STUDENT_PERMISSION);
         dmz.object.scalar(user, dmz.stance.ActiveHandle, 0);
         dmz.object.scalar(user, dmz.stance.ConsecutiveLoginsHandle, 0);
         dmz.object.flag(user, dmz.stance.ConsecutiveLoginsHandle, false);
         dmz.object.state(
            user,
            dmz.stance.Permissions,
            dmz.object.state(CurrentGameHandle, dmz.stance.StudentPermissionsHandle) || dmz.stance.StudentPermissions);
         dmz.object.activate(user);
         dmz.object.link(dmz.stance.GameUngroupedUsersHandle, user, CurrentGameHandle);
      }
      studentDisplayNameEdit.clear();
      studentEnabledCheckBox.setChecked(true);
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
});

editScenarioWidget.observe(self, "createAdminButton", "clicked", function () {

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
         dmz.object.timeStamp(user, dmz.stance.LastPingTimeHandle, 0);
         dmz.object.timeStamp(
            user,
            dmz.stance.LastLoginTimeHandle,
            dmz.object.timeStamp(dmz.object.hil(), dmz.stance.LastLoginTimeHandle));
         dmz.object.flag(user, dmz.stance.UpdateLastLoginTimeHandle, false);
         dmz.object.scalar(user, dmz.stance.Permissions, dmz.stance.ADMIN_PERMISSION);
         dmz.object.scalar(user, dmz.stance.ActiveHandle, 0);
         dmz.object.scalar(user, dmz.stance.ConsecutiveLoginsHandle, 0);
         dmz.object.flag(user, dmz.stance.ConsecutiveLoginsHandle, false);
         dmz.object.state(
            user,
            dmz.stance.Permissions,
            dmz.object.state(CurrentGameHandle, dmz.stance.AdminPermissionsHandle) || dmz.stance.AdminPermissions);
         dmz.object.activate(user);
      }
      studentDisplayNameEdit.clear();
      studentEnabledCheckBox.setChecked(true);
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
});

editScenarioWidget.observe(self, "createObserverButton", "clicked", function () {

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
         dmz.object.timeStamp(user, dmz.stance.LastPingTimeHandle, 0);
         dmz.object.timeStamp(
            user,
            dmz.stance.LastLoginTimeHandle,
            dmz.object.timeStamp(dmz.object.hil(), dmz.stance.LastLoginTimeHandle));
         dmz.object.flag(user, dmz.stance.UpdateLastLoginTimeHandle, false);
         dmz.object.scalar(user, dmz.stance.Permissions, dmz.stance.OBSERVER_PERMISSION);
         dmz.object.scalar(user, dmz.stance.ActiveHandle, 0);
         dmz.object.scalar(user, dmz.stance.ConsecutiveLoginsHandle, 0);
         dmz.object.flag(user, dmz.stance.ConsecutiveLoginsHandle, false);
         dmz.object.state(
            user,
            dmz.stance.Permissions,
            dmz.object.state(CurrentGameHandle, dmz.stance.ObserverPermissionsHandle) || dmz.stance.ObserverPermissions);
         dmz.object.activate(user);
      }
      studentDisplayNameEdit.clear();
      studentUserNameEdit.clear();
      studentEnabledCheckBox.setChecked(true);
      avatarList.enabled(true);
      avatarList.currentText("Default");
   });
});

editScenarioWidget.observe(self, "createTechButton", "clicked", function () {

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
         dmz.object.timeStamp(user, dmz.stance.LastPingTimeHandle, 0);
         dmz.object.timeStamp(
            user,
            dmz.stance.LastLoginTimeHandle,
            dmz.object.timeStamp(dmz.object.hil(), dmz.stance.LastLoginTimeHandle));
         dmz.object.flag(user, dmz.stance.UpdateLastLoginTimeHandle, false);
         dmz.object.scalar(user, dmz.stance.Permissions, dmz.stance.TECH_PERMISSION);
         dmz.object.scalar(user, dmz.stance.ActiveHandle, 0);
         dmz.object.scalar(user, dmz.stance.ConsecutiveLoginsHandle, 0);
         dmz.object.flag(user, dmz.stance.ConsecutiveLoginsHandle, false);
         dmz.object.state(
            user,
            dmz.stance.Permissions,
            dmz.object.state(CurrentGameHandle, dmz.stance.TechPermissionsHandle) || dmz.stance.TechPermissions);
         dmz.object.activate(user);
      }
      studentDisplayNameEdit.clear();
      studentEnabledCheckBox.setChecked(true);
      studentUserNameEdit.clear();
      avatarList.currentText("Default");
   });
});

editScenarioWidget.observe(self, "createAdvisorButton", "clicked", function () {

   setAdvisorList(0);
   advisorEnabledCheckBox.setChecked(true);
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
         dmz.object.timeStamp(user, dmz.stance.LastPingTimeHandle, 0);
         dmz.object.timeStamp(
            user,
            dmz.stance.LastLoginTimeHandle,
            dmz.object.timeStamp(dmz.object.hil(), dmz.stance.LastLoginTimeHandle));
         dmz.object.flag(user, dmz.stance.UpdateLastLoginTimeHandle, false);
         dmz.object.scalar(user, dmz.stance.Permissions, dmz.stance.ADVISOR_PERMISSION);
         dmz.object.scalar(user, dmz.stance.ActiveHandle, 0);
         dmz.object.scalar(user, dmz.stance.ConsecutiveLoginsHandle, 0);
         dmz.object.flag(user, dmz.stance.ConsecutiveLoginsHandle, false);
         state = dmz.object.state(CurrentGameHandle, dmz.stance.AdvisorPermissionsHandle) || dmz.stance.AdvisorPermissions;
         advisorCB.forEach(function (widget, index) {

            if (widget.isChecked()) { state = state.or(dmz.stance.AdvisorSets[index]); }
         });
         dmz.object.state(user, dmz.stance.Permissions, state);
         dmz.object.activate(user);
         dmz.object.link(dmz.stance.GroupMembersHandle, user, groupList[advisorGroupList.currentIndex()]);
      }
      advisorDisplayNameEdit.clear();
      advisorEnabledCheckBox.setChecked(true);
      advisorEmailEdit.clear();
   });
});

StudentListWidget.observe(self, "itemActivated", function (item) {

   var objHandle
     , avatar
     , enabled
     , isEnabled
     ;

   if (item && !LoginSkipped) {

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
         studentEnabledCheckBox.setChecked(true);
         studentUserNameEdit.clear();
         avatarList.currentText("Default");
      });
   }
});

AdminListWidget.observe(self, "itemActivated", function (item) {

   var objHandle
     , avatar
     , enabled
     , isEnabled
     ;

   if (item && !LoginSkipped) {

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
         studentEnabledCheckBox.setChecked(true);
         studentUserNameEdit.clear();
         avatarList.currentText("Default");
      });
   }
});

ObserverListWidget.observe(self, "itemActivated", function (item) {

   var objHandle
     , enabled
     , isEnabled
     ;

   if (item && !LoginSkipped) {

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
         studentEnabledCheckBox.setChecked(true);
         avatarList.enabled(true);
         avatarList.currentText("Default");
      });
   }
});

TechListWidget.observe(self, "itemActivated", function (item) {

   var objHandle
     , avatar
     , enabled
     , isEnabled
     ;

   if (item && !LoginSkipped) {

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
         studentEnabledCheckBox.setChecked(true);
         avatarList.currentText("Default");
      });
   }
});

AdvisorListWidget.observe(self, "itemActivated", function (item) {

   var objHandle
     , group
     , enabled
     , isEnabled
     ;

   if (item && !LoginSkipped) {

      var userPermissions;

      objHandle = item.data();
      advisorDisplayNameEdit.text(dmz.object.text(objHandle, dmz.stance.DisplayNameHandle));
      advisorEmailEdit.clear();
      advisorGroupList.currentIndex(groupList.indexOf(dmz.stance.getUserGroupHandle(objHandle)));
      advisorGroupList.enabled(false);
      enabled = dmz.object.flag(objHandle, dmz.stance.ActiveHandle);
      advisorEnabledCheckBox.setChecked(enabled);
      userPermissions = dmz.object.state(objHandle, dmz.stance.Permissions);
      setAdvisorList(0);
      advisorCB.forEach(function (key, index) {

         if (userPermissions.and(dmz.stance.AdvisorSets[index]).bool()) {

            key.setChecked(true);
            key.enabled(false);
         }
         else {

            key.setChecked(false);
            key.enabled(true);
         }
      });
      createAdvisorDialog.open(self, function (value, dialog) {

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
            state = dmz.object.state(CurrentGameHandle, dmz.stance.AdvisorPermissionsHandle) || dmz.stance.AdvisorPermissions;
            advisorCB.forEach(function (widget, index) {

               if (widget.isChecked()) { state = state.or(dmz.stance.AdvisorSets[index]); }
            });
            dmz.object.state(objHandle, dmz.stance.Permissions, state);
         }
         advisorDisplayNameEdit.clear();
         advisorEmailEdit.clear();
         advisorEnabledCheckBox.setChecked(true);
         advisorGroupList.enabled(true);
         advisorCB.forEach(function (key) {

            key.enabled(true);
            key.setChecked(false);
         });
      });
   }
});

setAdvisorList = function (index) {

   var groupHandle = groupList[index]
     , advisors = dmz.object.superLinks(groupHandle, dmz.stance.AdvisorGroupHandle) || []
     ;

   advisorCB.forEach(function (cb) { cb.setChecked(false); });
   advisors.forEach(function (advisorHandle) {

      advisorCB[dmz.object.scalar(advisorHandle, dmz.stance.ID)].text(dmz.stance.getDisplayName(advisorHandle));
   });
};

advisorGroupList.observe(self, "currentIndexChanged", setAdvisorList);

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

            if (!dmz.stance.isAllowed(student, dmz.stance.SwitchGroupFlag) &&
               dmz.object.flag(student, dmz.stance.ActiveHandle)) {

               vLayout.addWidget(dmz.ui.label.create(dmz.stance.getDisplayName(student)));
            }
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
     , count = MediaGroupFLayout.rowCount()
     , type
     , itor
     , pic
     , urlEnd
     ;

   if (item) {

      type = dmz.object.type(handle);
      Object.keys(MediaTypes).forEach(function (key) {

         if (MediaTypes[key].type.isOfType(type)) {

            urlEnd = MediaTypes[key].urlEnd;
         }
      });
      if (type.isOfType(dmz.stance.MemoType) ||
         type.isOfType(dmz.stance.NewspaperType) ||
         type.isOfType(dmz.stance.VideoType) ||
         type.isOfType(dmz.stance.PdfItemType)) {

         for (itor = 0; itor < count; itor += 1) {

            if (dmz.object.linkHandle(dmz.stance.MediaHandle, handle, groupList[itor])) {

               MediaGroupFLayout.at(itor, 1).setChecked(true);
            }
            MediaGroupFLayout.at(itor, 1).enabled(false);
         }
         MediaTitleText.text(dmz.object.text(handle, dmz.stance.TitleHandle));
         MediaUrlText.text(dmz.object.text(handle, dmz.stance.TextHandle));
         MediaURLWarning.text("");
         ActiveCheckBox.show();
         ActiveLabel.show();
         ActiveCheckBox.setChecked(dmz.object.flag(handle, dmz.stance.ActiveHandle));
         ActiveCheckBox.show();

         MediaOkButton.observe(self, "clicked", function () {

            if (MediaUrlText.text().lastIndexOf(urlEnd) === -1) {

               MediaURLWarning.text("<font color=\"red\"> Invalid " + type + " URL.</font>");
            }
            else if (!MediaTitleText.text()) {

               MediaURLWarning.text("<font color=\"red\"> Invalid Title.</font>");
            }
            else { CreateMediaInjectDialog.accept(); }
         });

         CreateMediaInjectDialog.open(self, function (value) {

            if (value) {

               if (ActiveCheckBox.isChecked()) {

                  dmz.object.flag(handle, dmz.stance.ActiveHandle, true);
               }
               else { dmz.object.flag(handle, dmz.stance.ActiveHandle, false); }
               dmz.object.text(handle, dmz.stance.TitleHandle, MediaTitleText.text());
               dmz.object.text(handle, dmz.stance.TextHandle, MediaUrlText.text());
            }
            for (itor = 0; itor < count; itor += 1) {

               MediaGroupFLayout.at(itor, 1).setChecked(false);
               MediaGroupFLayout.at(itor, 1).enabled(true);
            }
            ActiveCheckBox.hide();
            ActiveLabel.hide();
            MediaURLWarning.text("");
            MediaUrlText.text("");
            MediaTitleText.text("");
         });
      }
      else if (type.isOfType(dmz.stance.LobbyistType)) {

         lobbyistPictureList.hide();
         lobbyistGroupList.hide();
         lobbyistPictureListLabel.hide();
         lobbyistGroupListLabel.hide();
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(dmz.object.text(handle, dmz.stance.PictureHandle)));
         if (pic) { lobbyistPictureLabel.pixmap(pic); }
         lobbyistMessage.text(dmz.object.text(handle, dmz.stance.TextHandle));
         lobbyistTitle.text(dmz.object.text(handle, dmz.stance.TitleHandle));
         lobbyistName.text(dmz.object.text(handle, dmz.stance.NameHandle));
         lobbyistActiveCheckbox.setChecked(dmz.object.flag(handle, dmz.stance.ActiveHandle));
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

               dmz.object.text(handle, dmz.stance.NameHandle, (lobbyistName.text() || "N/A"));
               dmz.object.text(handle, dmz.stance.TitleHandle, lobbyistTitle.text());
               dmz.object.text(handle, dmz.stance.TextHandle, lobbyistMessage.text());
               dmz.object.flag(handle, dmz.stance.ActiveHandle, lobbyistActiveCheckbox.isChecked());
            }
         });
      }
   }
};

// Media inject buttons
mediaInjectButtons = function () {

   var generateMediaInjectFunction = function (type, urlEnd) {

      return function () {

         if (type.isOfType(dmz.stance.NewspaperType) ||
            type.isOfType(dmz.stance.MemoType) ||
            type.isOfType(dmz.stance.VideoType) ||
            type.isOfType(dmz.stance.PdfItemType)) {

            var groupItor
              , groupCount = MediaGroupFLayout.rowCount()
              ;

            ActiveCheckBox.setChecked(true);
            ActiveCheckBox.show();
            ActiveLabel.show();
            MediaTitleText.text("");
            MediaUrlText.text("");
            for (groupItor = 0; groupItor < groupCount; groupItor += 1) {

               if (type.isOfType(dmz.stance.NewspaperType)) {

                  MediaGroupFLayout.at(groupItor, 1).setChecked(true);
               }
            }
            MediaOkButton.observe(self, "clicked", function () {

               var text = MediaUrlText.text()
                 , somethingChecked = false
                 , itor
                 , count = MediaGroupFLayout.rowCount()
                 ;

               for (itor = 0; itor < count; itor += 1) {

                  if (MediaGroupFLayout.at(itor, 1).isChecked()) { somethingChecked = true; }
               }
               if (text.lastIndexOf(urlEnd) === -1) {

                  MediaURLWarning.text("<font color=\"red\"> Invalid " + type + " URL.</font>");
               }
               else if (!MediaTitleText.text()) {

                  MediaURLWarning.text("<font color=\"red\"> Invalid Title.</font>");
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
                 , links
                 ;

               if (value && type) {

                  media = dmz.object.create(type);
                  dmz.object.text(media, dmz.stance.TitleHandle, MediaTitleText.text());
                  dmz.object.text(media, dmz.stance.TextHandle, MediaUrlText.text());
                  dmz.object.timeStamp(media, dmz.stance.CreatedAtServerTimeHandle, 0);
                  dmz.object.flag(media, dmz.stance.UpdateStartTimeHandle, true);
                  links = dmz.object.superLinks(CurrentGameHandle, dmz.stance.MediaHandle);
                  dmz.object.scalar(media, dmz.stance.ID, links ? links.length : 0);
                  dmz.object.flag(media, dmz.stance.ActiveHandle, ActiveCheckBox.isChecked());
                  dmz.object.link(dmz.stance.MediaHandle, media, CurrentGameHandle);
                  dmz.object.link(dmz.stance.CreatedByHandle, media, dmz.object.hil());
                  for (itor = 0; itor < count; itor += 1) {

                     if (MediaGroupFLayout.at(itor, 1).isChecked()) {

                        dmz.object.link(dmz.stance.MediaHandle, media, groupList[itor]);
                     }
                  }
                  dmz.object.activate(media);
               }
               for (itor = 0; itor < count; itor += 1) {

                  MediaGroupFLayout.at(itor, 1).setChecked(false);
                  MediaGroupFLayout.at(itor, 1).enabled(true);
               }
               ActiveCheckBox.hide();
               ActiveLabel.hide();
               MediaURLWarning.text("");
               MediaUrlText.text("");
               MediaTitleText.text("");
            });
         }
         else if (type.isOfType(dmz.stance.LobbyistType)) {

            lobbyistPictureList.show();
            lobbyistGroupList.show();
            lobbyistPictureListLabel.show();
            lobbyistGroupListLabel.show();
            lobbyistPictureList.currentIndex(0);
            lobbyistGroupList.currentIndex(0);
            lobbyistMessage.text("");
            lobbyistTitle.text("");
            lobbyistName.text("");
            lobbyistActiveCheckbox.setChecked(true);
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
                  dmz.object.flag(lobbyistHandle, dmz.stance.ActiveHandle, lobbyistActiveCheckbox.isChecked());
                  dmz.object.activate(lobbyistHandle);

                  dmz.object.link(dmz.stance.MediaHandle, lobbyistHandle, groupList[groupIndex]);
                  dmz.object.link(dmz.stance.MediaHandle, lobbyistHandle, CurrentGameHandle);
                  dmz.object.link(dmz.stance.CreatedByHandle, lobbyistHandle, dmz.object.hil());
               }
            });
         }
      };
   };

   Object.keys(MediaTypes).forEach(function (type) {

      if (!LoginSkipped) {
         editScenarioWidget.observe(
            self,
            MediaTypes[type].button,
            "clicked",
         generateMediaInjectFunction(MediaTypes[type].type, MediaTypes[type].urlEnd));

         MediaTypes[type].list.observe(self, "itemActivated", modifyInjectItem);
      }
   });
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var active;
   if (value) {

      startGameButton.enabled(false);
      endGameButton.enabled(false);
      showStudentsButton.enabled(false);
      if (dmz.stance.isAllowed(objHandle, dmz.stance.SwitchGroupFlag)) {

         TabWidget.clear();
         TabWidget.add(SwitchGroupTab.widget, SwitchGroupTab.name);
         if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterMediaFlag)) {

            TabWidget.add(MediaTab.widget, MediaTab.name);
         }
         else { MediaTab.widget.hide(); }
         if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterAdvisorsFlag)) {

            TabWidget.add(AdvisorTab.widget, AdvisorTab.name);
         }
         else { AdvisorTab.widget.hide(); }
         if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterGroupsFlag)) {

            active = dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle);
            startGameButton.enabled(!active);
            endGameButton.enabled(active);
            TabWidget.add(AlterGroupsTab.widget, AlterGroupsTab.name);
         }
         if (dmz.stance.isAllowed(objHandle, dmz.stance.StudentDataFlag)) {

            showStudentsButton.enabled(true);
         }
         if (dmz.stance.isAllowed(objHandle, dmz.stance.AlterUsersFlag)) {

            TabWidget.add(AlterUsersTab.widget, AlterUsersTab.name);
         }
         else { AlterUsersTab.widget.hide(); }
         if (dmz.stance.isAllowed(objHandle, dmz.stance.ChangePermissionsFlag)) {

            if (!haveSetupPermissionTable) { setupPermissionTable(); }
            TabWidget.add(ChangePermissionsTab.widget, ChangePermissionsTab.name);
         }
         else { ChangePermissionsTab.widget.hide(); }

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

startGameButton.observe(self, "clicked", function () {

   var list = [];
   dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle, true);
   Object.keys(userItems).forEach(function (key) {

      list.push(userItems[key].handle);
   });
   EmailMod.sendEmail(
      list,
      "Your STANCE game has begun!",
      "Your STANCE game has just begun. Please log on at your earliest convenience and "+
         "examine the initial scenario description.");
   self.log.warn("Start Game");
});

endGameButton.observe(self, "clicked", function () {

   var list = [];

   dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle, false);
   Object.keys(userItems).forEach(function (key) {

      list.push(userItems[key].handle);
//      dmz.object.state(userItems[key].handle, dmz.stance.Permissions, dmz.stance.SwitchGroupFlag);
      if (dmz.object.scalar(userItems[key].handle, dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION) {

         dmz.object.scalar(userItems[key].handle, dmz.stance.Permissions, dmz.stance.OBSERVER_PERMISSION);
      }
   });
   EmailMod.sendEmail(
      list,
      "Your STANCE game has ended!",
      "Your STANCE game is now over! Please stay tuned for additional instructions " +
         "on how to prepare for the AAR.\nThank you for participating!");

});

dmz.object.state.observe(self, dmz.stance.Permissions, function (handle, attrHandle, value, prev) {

   var list
     , active
     , state
     , dataHandle
     , groups
     ;

   if (userItems[handle]) {

      userItems[handle].state = value;
      if (userItems[handle].permission !== -1) {

         state = dmz.object.state(CurrentGameHandle, dmz.stance.PERMISSION_HANDLES[userItems[handle].permission]);
         if (state && !value.equal(state)) {

            dmz.time.setTimer(self, function () {

               dmz.object.state(handle, dmz.stance.Permissions, state);
            });
         }
      }
      if (value.and(dmz.stance.SwitchGroupFlag).bool() &&
         !dmz.object.linkHandle(dmz.stance.GameObservers, handle, CurrentGameHandle)) {

         dmz.time.setTimer(self, 0.5, function () {

            if (!dmz.object.linkHandle(dmz.stance.GameObservers, handle, CurrentGameHandle)) {

               groups = dmz.object.superLinks(CurrentGameHandle, dmz.stance.GameGroupHandle) || [];
               groups.forEach(function (groupHandle) {

                  var linkHandle = dmz.object.linkHandle(dmz.stance.DataLinkHandle, handle, groupHandle)
                    , data = dmz.object.linkAttributeObject(linkHandle)
                    ;

                  if (!data) {

                     data = dmz.object.create(dmz.stance.DataType);
                     dmz.object.activate(data);
                     if (!linkHandle) {

                        linkHandle = dmz.object.link(dmz.stance.DataLinkHandle, handle, groupHandle);
                     }
                     dmz.object.linkAttributeObject(linkHandle, data);
                  }
                  dmz.stance.NOTIFICATION_HANDLES.forEach(function (timeHandle) {

                     dmz.object.timeStamp(data, timeHandle, dmz.object.timeStamp(handle, timeHandle));
                  });
               });
               dmz.object.link(dmz.stance.GameObservers, handle, CurrentGameHandle);
            }

         });
      }
      else if (!value.and(dmz.stance.SwitchGroupFlag).bool() && prev &&
         prev.and(dmz.stance.SwitchGroupFlag).bool() &&
         dmz.object.linkHandle(dmz.stance.GameObservers, handle, CurrentGameHandle)) {

         dataHandle =
            dmz.object.linkAttributeObject(
               dmz.object.linkHandle(dmz.stance.DataLinkHandle, handle, dmz.stance.getUserGroupHandle(handle)));

         dmz.stance.NOTIFICATION_HANDLES.forEach(function (timeHandle) {

            dmz.object.timeStamp(handle, timeHandle, dmz.object.timeStamp(dataHandle, timeHandle));
         });
      }
      if (handle === dmz.object.hil()) {

         if (value.and(dmz.stance.AlterGroupsFlag).bool()) {

            active = dmz.object.flag(CurrentGameHandle, dmz.stance.ActiveHandle);
            startGameButton.enabled(!active);
            endGameButton.enabled(active);
         }
         else {

            startGameButton.enabled(false);
            endGameButton.enabled(false);
         }
         if (value.and(dmz.stance.StudentDataFlag).bool()) { showStudentsButton.enabled(true); }
         else { showStudentsButton.enabled(false); }
      }

      if (value.and(dmz.stance.AlterUsersFlag).bool()) { list = TechListWidget; }
      else if (value.and(dmz.stance.AlterMediaFlag).bool()) {

         list = AdminListWidget;
         if (!dmz.object.linkHandle(dmz.stance.AdminHandle, CurrentGameHandle, handle)) {

            dmz.object.link(dmz.stance.AdminHandle, CurrentGameHandle, handle);
         }
      }
      else if (value.and(dmz.stance.CastVoteFlag).bool()) { list = StudentListWidget; }
      else if (value.and(dmz.stance.SwitchGroupFlag).bool()) { list = ObserverListWidget; }
      else if (value.and(dmz.stance.AdvisorSets).bool()) { list = AdvisorListWidget; }
      if (list) {

         if (!userItems[handle].item) {

            userItems[handle].item = list.addItem(dmz.stance.getDisplayName(handle), handle);
            userItems[handle].item.foreground(userItems[handle].active ? ActiveBrush : DisabledBrush);
         }
         else { list.addItem(userItems[handle].item); }
      }
   }
});

dmz.object.scalar.observe(self, dmz.stance.Permissions, function (handle, attrHandle, value) {

   var state;
   if (userItems[handle]) {

      userItems[handle].permission = value;
      state = dmz.object.state(CurrentGameHandle, dmz.stance.PERMISSION_HANDLES[value]) || dmz.mask.create();
      if ((value === dmz.stance.ADVISOR_PERMISSION) && userItems[handle].state) {

         state = state.unset(dmz.stance.AdvisorFlags).or(userItems[handle].state.and(dmz.stance.AdvisorFlags));
         if (!state.equal(userItems[handle].state)) {

            dmz.object.state(handle, dmz.stance.Permissions, state);
         }
      }
      else if (state || userItems[handle].state) {

         dmz.object.state(handle, dmz.stance.Permissions, state);
      }
      else {

         self.log.error ("No viable state for Permission value:", value, "on object:", handle);
      }
   }
});

gamePermissionObs = function (gameHandle, attrHandle, state) {

   var index = dmz.stance.PERMISSION_HANDLES.indexOf(attrHandle)
     , advisorState
     ;

   updatePermissionTable(index, state);
   // update all users with that permission level
   Object.keys(userItems).forEach(function (key) {

      var advisorState;
      if ((userItems[key].permission === index) && userItems[key].state) {

         if (userItems[key].permission === dmz.stance.ADVISOR_PERMISSION) {

            advisorState = state.unset(dmz.stance.AdvisorFlags).or(userItems[key].state.and(dmz.stance.AdvisorFlags));
            if (!advisorState.equal(state)) {

               dmz.object.state(userItems[key].handle, dmz.stance.Permissions, advisorState);
            }
         }
         else if (!userItems[key].state.equal(state)) {

            dmz.object.state(userItems[key].handle, dmz.stance.Permissions, state);
         }
      }
   });
};

dmz.object.state.observe(self, dmz.stance.StudentPermissionsHandle, gamePermissionObs);
dmz.object.state.observe(self, dmz.stance.AdminPermissionsHandle, gamePermissionObs);
dmz.object.state.observe(self, dmz.stance.AdvisorPermissionsHandle, gamePermissionObs);
dmz.object.state.observe(self, dmz.stance.ObserverPermissionsHandle, gamePermissionObs);
dmz.object.state.observe(self, dmz.stance.TechPermissionsHandle, gamePermissionObs);

updatePermissionTable = function (col, state) {

   var flags = dmz.stance.getSingleStates();
   Object.keys(flags).forEach(function (flagName, row) {

      var widget = permissionTable.cellWidget(row, col);
      if (widget) { widget.setChecked(state.and(flags[flagName]).bool()); }
   });
};

setupPermissionTable = function () {

   var flags = dmz.stance.getSingleStates()
     , flagNames = Object.keys(flags)
     , idx
     ;
   permissionTable.columnCount(dmz.stance.PERMISSION_LEVELS);
   permissionTable.setHorizontalLabels(dmz.stance.PERMISSION_LABELS);
   permissionTable.rowCount(flagNames.length);
   permissionTable.setVerticalLabels(flagNames);

   flagNames.forEach(function (flagName, row) {

      var item
        , col
        , button
        ;

      for (col = 0; col < dmz.stance.PERMISSION_LEVELS; col += 1) {

         button = dmz.ui.button.createCheckBox();
         (function (column) {

            button.observe(self, "clicked", function (checked) {

               var currentState = dmz.object.state(CurrentGameHandle, dmz.stance.PERMISSION_HANDLES[column]);
               dmz.object.state(
                  CurrentGameHandle,
                  dmz.stance.PERMISSION_HANDLES[column],
                  checked ? currentState.or(flags[flagName]) : currentState.unset(flags[flagName]));
            });
         }(col));

         if (((flagName === "ChangePermissionsFlag") &&
               (col === dmz.stance.TECH_PERMISSION)) ||
            ((col === dmz.stance.ADVISOR_PERMISSION) &&
               flags[flagName].and(dmz.stance.AdvisorFlags).bool())) {

            button.enabled(false);
         }

         permissionTable.cellWidget(row, col, button);
      }
   });
   permissionTable.resizeColumnsToContents();
   haveSetupPermissionTable = true;
};

(function () {

   setupPermissionTable();
   mediaInjectButtons();
   readGroupTemplates();
   editScenarioWidget.lookup("tabWidget").hide();
   dock.hide();
   dock.enabled(false);
}());

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});
