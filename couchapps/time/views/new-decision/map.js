function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "decision")) {

      var updateStartFlag = false
        , updateEndFlag = false
        , updateExpireFlag = false
        ;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "update_start_time_handle") {

            updateStartFlag = attr.flag.value;
         }
         if (attr.name === "update_end_time_handle") {

            updateEndFlag = attr.flag.value;
         }
         if (attr.name === "update_expire_time_handle") {

            updateExpireFlag = attr.flag.value;
         }
      });
      if (updateStartFlag && updateExpireFlag && !updateEndFlag) {

         emit(doc.object, null);
      }
   }
}
