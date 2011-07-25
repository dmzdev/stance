function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "decision")) {

      var startUpdateFlag = false
        , endUpdateFlag = false
        ;
      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "update_start_time_handle") {

            startUpdateFlag = attr.flag.value;
         }
         if (attr.name === "update_end_time_handle") {

            endUpdateFlag = attr.flag.value;
         }
      });
      if (startUpdateFlag === false && endUpdateFlag === true) {

         emit(doc.object, null);
      }
   }
}
