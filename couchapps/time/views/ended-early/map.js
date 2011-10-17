function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "vote")) {

      var startUpdateFlag = false
        , endUpdateFlag = false
        , expireUpdateFlag = false
        ;
      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "update_start_time_handle") {

            startUpdateFlag = attr.flag.value;
         }
         if (attr.name === "update_end_time_handle") {

            endUpdateFlag = attr.flag.value;
         }
         if (attr.name === "update_expire_time_handle") {

            expireUpdateFlag = attr.flag.value;
         }
      });
      if (startUpdateFlag === false && endUpdateFlag === true && expireUpdateFlag === false) {

         emit(doc.object, null);
      }
   }
}
