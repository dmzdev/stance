function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "decision")) {

      var currentTime = Math.round(new Date().getTime() / 1000)
        , expireTime
        ;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "expire_time_handle") {

           expireTime = attr.timestamp.value;
         }
      });
      if (endTime !== 0 && currentTime > expireTime) {

         emit(doc.object, null);
      }
   }
}
