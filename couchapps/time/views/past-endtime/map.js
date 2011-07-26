function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "decision")) {

      var currentTime = Math.round(new Date().getTime() / 1000)
        , endTime
        ;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "ended_at_server_time") {

           endTime = attr.timestamp.value;
         }
      });
      if (endTime !== 0 && currentTime > endTime) {

         emit(doc.object, null);
      }
   }
}
