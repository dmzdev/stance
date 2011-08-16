function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "decision")) {

      var updateStartTime = false
        , updateEndTime = false
        , updateExpireTime = false
        ;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "update_start_time_handle") {

           updateStartTime = attr.flag.value;
         }
         if (attr.name === "update_end_time_handle") {

            updateEndTime = attr.flag.value;
         }
         if (attr.name === "update_expire_time_handle") {

            updateExpireTime = attr.flag.value;
         }
      });
      if (!updateStartTime && !updateEndTime && !updateExpireTime) {

         emit(doc.object, null);
      }
   }
}
