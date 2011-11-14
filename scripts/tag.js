require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      }
   , stance: require("stanceConst")
   , defs: require("dmz/runtime/definitions")
   , data: require("dmz/runtime/data")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , message: require("dmz/runtime/messaging")
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   }

   // UI Elements
   , WindowName = "EditScenarioForm"
   , parent = dmz.ui.mainWindow.window().lookup(WindowName)
   , tagWindow = dmz.ui.loader.load("TagDialog.ui", parent)
   , tagText = tagWindow.lookup("newTagText")
   , currentList = tagWindow.lookup("currentList")
   , masterList = tagWindow.lookup("masterList")

   , ActiveBrush = dmz.ui.graph.createBrush({ r: 0, b: 0, g: 0 })
   , DisabledBrush = dmz.ui.graph.createBrush({ r: 1, b: 0, g: 0 })

   // Variables
   , tagList = {}
   , currentTagList = {}
   , dialogMode = false
   ;

tagWindow.observe(self, "addButton", "clicked", function () {

   var text = tagText.text();
   tagText.clear();
   if (text && text.length && !tagList[text]) {

      tagList[text] = masterList.addItem(text);
      tagList[text].hidden(true);
      currentTagList[text] = currentList.addItem(text);
   }
});

masterList.observe(self, "itemActivated", function (item) {

   item.hidden(true);
   currentTagList[item.text()].hidden(false);
});

currentList.observe(self, "itemActivated", function (item) {

   item.hidden(true);
   tagList[item.text()].hidden(false);
});

dmz.message.subscribe(self, dmz.stance.AUTOMATIC_TAG_MESSAGE, function (data) {

   var voteHandle = data.handle(dmz.stance.ObjectHandle, 0)
     , tagString = data.string(dmz.stance.TagHandle, 0)
     , voteData = dmz.data.create();
     ;

   voteData.string(dmz.stance.TagHandle, 0, tagString);
   voteData.number(dmz.stance.TotalHandle, 0, 1);
   dmz.object.data(voteHandle, dmz.stance.TagHandle, voteData);
});

dmz.message.subscribe(self, "TagMessage", function (data) {

   var handle = dmz.data.unwrapHandle(data)
     , list = dmz.stance.getTags(dmz.object.data(handle, dmz.stance.TagHandle))
     ;

   Object.keys(tagList).forEach(function (tag) {

      var current = (list.indexOf(tag) === -1);
      tagList[tag].hidden(!current);
      currentTagList[tag].hidden(current);
   });

   tagWindow.open(self, function (result) {

      self.log.warn ("Result:", result);
      if (result) {

         var data = dmz.data.create();
         list = Object.keys(currentTagList).filter(function (tag) { return !currentTagList[tag].hidden(); });
         list.forEach(function (tag, index) { data.string(dmz.stance.TagHandle, index, tag); });
         data.number(dmz.stance.TotalHandle, 0, list.length);
         dmz.object.data(handle, dmz.stance.TagHandle, data);
      }
   });
});

dmz.object.data.observe(self, dmz.stance.TagHandle, function (handle, attr, data) {

   dmz.stance.getTags(data).forEach(function (tag) {

      if (!tagList[tag]) {

         tagList[tag] = masterList.addItem(tag);
         currentTagList[tag] = currentList.addItem(tag);
         currentTagList[tag].hidden(true);
      }
   });
});
