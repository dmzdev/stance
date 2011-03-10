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


   // Variables
   , advisorWidgets = []
   , advisorData = {}
   , groupAdvisors = {}
   , advisorCount = 5

   // Function decls
   ;

(function () {

   var idx;
   for (idx = 0; idx < advisorCount; idx += 1) {

      advisorWidgets[idx] = dmz.ui.loader.load("AdvisorWindow.ui");
   }
}());

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
         advisorData[advisorHandle] = {};
         advisorData[advisorHandle].bio =
            dmz.object.text(advisorHandle, dmz.const.BioHandle);
         advisorData[advisorHandle].name = dmz.const._getDisplayName(advisorHandle);
         advisorData[advisorHandle].picture = false;

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

      for (idx = 0; idx < advisorCount; idx += 1) {

         (function (idx) {

            module.addPage("Advisor" + idx, advisorWidgets[idx], function () {

               var handle
                 , hil
                 , list
                 , data
                 ;

               hil = dmz.object.hil();
               if (hil) {

                  handle = dmz.object.superLinks(hil, dmz.const.GroupMembersHandle);
                  if (handle && handle[0]) {

                     list = groupAdvisors[handle[0]];
                     if (list && list.length && (idx < list.length)) {

                        handle = list[idx];
                        if (handle) {

                           data = advisorData[handle];
                           if (data.name) { advisorWidgets[idx].lookup("nameLabel").text(data.name); }
                           if (data.bio) { advisorWidgets[idx].lookup("bioText").text(data.bio); }
                           if (data.picture) {

                              advisorWidgets[idx].lookup("pictureLabel").pixmap(data.picture);
                           }
                        }
                     }
                  }
               }
            });
         }(idx));
      }
   }
});
