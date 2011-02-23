   // OpenLayers Map Globals
   var MapDystopia, select, appselect;
   var kmldir = 'dystopia/pages/mapfiles/';
   var featureSelected;
   var custcontrol, dragFeature;
   var custlayer;
   var applayer;
   var appcontrol;
   var customfeatures = new Array();

   // My Markers Globals
   var mtitle;
   var micon;
   var mdesc;
   var mvisibility;
   var lyrid;
   var mymarkeruid;
   var mymarkertodelete = false;

   // Simple strip slashes function
   function stripslashes(str) {
      str=str.replace(/\\'/g,'\'');
      str=str.replace(/\\"/g,'"');
      str=str.replace(/\\0/g,'\0');
      str=str.replace(/\\\\/g,'\\');
      return str;
   }

   // CREATE MAP --------------------------------------------------
   function init() {
      OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
      var lat = 0.175;
      var lon = 0.275;
      var zoom = 9;

      /*var lat = 0.5625;
      var lon = 0.275;
      var zoom = 9;*/

      MapDystopia = new OpenLayers.Map('Map', {
         controls: [
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.ScaleLine(),
            new OpenLayers.Control.MousePosition(),
            new OpenLayers.Control.KeyboardDefaults(),
            new OpenLayers.Control.LayerSwitcher({'ascending':false}),
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.LoadingPanel()
         ],
       maxExtent: new OpenLayers.Bounds(-180,-90,180,90),
         maxResolution: 0.0006866455078125,
         numZoomLevels: 8

      /*maxExtent: new OpenLayers.Bounds(-180,-90,180,90),
      maxResolution: 0.00274658203125,
      numZoomLevels: 8*/

      });

      var baselayer = new OpenLayers.Layer.WMS(
         "Dystopia",
         ["/a/tilecache.py/",
          "/b/tilecache.py/",
          "/c/tilecache.py/",
          "/d/tilecache.py/"],
         {layers: 'dystopia', format: 'image/png'}
      );

      var topolayer = new OpenLayers.Layer.WMS(
         "Contours",
         ["/a/tilecache.py/",
          "/b/tilecache.py/",
          "/c/tilecache.py/",
          "/d/tilecache.py/"],
         {layers: 'contours', format: 'image/png'}
      );

      // Base layer
      MapDystopia.addLayers([baselayer, topolayer]);
      var lonLat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), MapDystopia.getProjectionObject());
      MapDystopia.setCenter (lonLat, zoom);
      aLayerCustom();
      appLayer();
   }


   // ========================== SHOW/HIDE LAYER FUNCTIONS =============================
   // Static layers
   function layerSet(lyr, onOff) {
      // Show/Hide layers
      layer = MapDystopia.getLayersByName(lyr);
      layer[0].setVisibility(onOff);
      // Destroys popup of the selected feature (if any) when hiding the layer
      if(onOff == false){
         if(featureSelected != undefined){
            if(featureSelected.popup){
               featureSelected.popup.destroy();
               delete featureSelected.popup;
            }
         }
      }
   }
   // Contours and other base layers
   function basechanger(lyr){
      layer = MapDystopia.getLayersByName(lyr)[0];
      layer.setVisibility(true);
      MapDystopia.setBaseLayer(layer);
      if(lyr == 'Contours')
         document.getElementById("baselayerswitcher").innerHTML = '<a href="javascript:basechanger(\'Dystopia\')">Map</a>';
      else
         document.getElementById("baselayerswitcher").innerHTML = '<a href="javascript:basechanger(\'Contours\')">Terrain</a>';
   }
   // Custom mymarker layers
   function displayMymarkers(lyr, checked){
      layer = MapDystopia.getLayersByName(lyr)[0];
      if(checked){
         layer.setVisibility(true);
      }else{
         layer.setVisibility(false);
      }
   }

   // ==================== ADD LAYER FUNCTIONS =============================
   // Static KML Layer
   function aLayerKML(lyr, onoff){
      if(MapDystopia.getLayersByName(lyr) == ''){
         var klayer = new OpenLayers.Layer.Vector(lyr, {
            visibility: false,
            projection: MapDystopia.displayProjection,
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
               url: kmldir + lyr + ".kml",
               format: new OpenLayers.Format.KML({
                  extractStyles: true,
                  extractAttributes: true
               })
            })
         });
         MapDystopia.addLayer(klayer);
         var layers = MapDystopia.getLayersByClass('OpenLayers.Layer.Vector');
         select = new OpenLayers.Control.SelectFeature(layers);
         MapDystopia.addControl(select);
         select.activate();
         klayer.events.register("featureselected", this, onFeatureSelect);
         klayer.events.register("featureunselected", this, onFeatureUnselect);
         layerSet(lyr, onoff);
      }else{
         layerSet(lyr, onoff);
      }
   }

   // Custom layer for the placing of MyMarkers
   function aLayerCustom(){
      var style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
      style_mark.graphicWidth = 32;
      style_mark.graphicHeight = 32;
      style_mark.graphicXOffset = -(style_mark.graphicWidth/2);
      style_mark.graphicYOffset = -(style_mark.graphicHeight/2);
      style_mark.fillOpacity = 1;
      style_mark.graphicOpacity = 1;
      style_mark.externalGraphic = "dystopia/pages/MapIcons/GenericMarker.png";

      // Layer for the Add Marker function
      custlayer = new OpenLayers.Layer.Vector("Custom", {style: style_mark});
      MapDystopia.addLayer(custlayer);
      custcontrol = {
            point: new OpenLayers.Control.DrawFeature(custlayer, OpenLayers.Handler.Point, {'featureAdded': custAdded}),
            drag: new OpenLayers.Control.DragFeature(custlayer, {'onComplete': custPopup, 'onStart': custKillpopup})
        };
      for(key in custcontrol)
         MapDystopia.addControl(custcontrol[key]);
   }

   // Search layer (includes popup), whole layer deleted when popup is closed (removeSearch)
   function aLayerSearch(lat, lng, title, content){
      // Add layer for searches and corresponding popup
      // delete any existing searches (popup and marker)
      if(MapDystopia.popups.length)
         MapDystopia.popups[0].destroy();
      if(MapDystopia.getLayersByName('SEARCH')[0])
         MapDystopia.getLayersByName('SEARCH')[0].destroy();

      //style info for search marker
      var style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
      style_mark.graphicWidth = 32;
      style_mark.graphicHeight = 32;
      style_mark.graphicXOffset = -(style_mark.graphicWidth/2);  // this is the default value
      style_mark.graphicYOffset = -(style_mark.graphicHeight);
      style_mark.fillOpacity = 1;
      style_mark.graphicOpacity = 1;
      style_mark.externalGraphic = "dystopia/pages/MapIcons/GenericMarker.png";

      //add marker on a new layer called search and place on MapDystopia at lat/lng
      var olayer = new OpenLayers.Layer.Vector("SEARCH");
      var point = new OpenLayers.Geometry.Point(lat, lng); //latlng goes here
      var feature = new OpenLayers.Feature.Vector(point,null,style_mark);
      feature.attributes.name = title;
      feature.attributes.description = content;

      olayer.addFeatures(feature);
      MapDystopia.addLayer(olayer);
      MapDystopia.zoomTo(5);
      MapDystopia.panTo(new OpenLayers.LonLat(lat, lng));

      popup = new OpenLayers.Popup.FramedCloud(
         "SEARCH",
         feature.geometry.getBounds().getCenterLonLat(),
         new OpenLayers.Size(100,100),
         "<div class='olPopupTitle'>" + title + "</div><div class='olPopupDescription'>" + content + "</div>",
         null,
         true,
         removeSearch
      );
        MapDystopia.addPopup(popup);
   }
















   // DMZ Application =================================================================================

   var pointID
     , pointList
     , currentPopUp = false

   // Function Decls
     , appLayer
     , appAddPoint
     , appShowPopup
     , appKillPopup
     , appRemovePoint
     , appMoveComplete
     ;

   appLayer = function () {
      var style_mark
        , dragFeature
        ;

      if (window.dmz) {

         pointID = 0;
         pointList = {};
         window.dmz.addPin.connect (appAddPoint);
         window.dmz.removePin.connect (appRemovePoint);

         style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
         style_mark.graphicWidth = 32;
         style_mark.graphicHeight = 32;
         style_mark.graphicXOffset = -(style_mark.graphicWidth / 2);
         style_mark.graphicYOffset = -(style_mark.graphicHeight / 2);
         style_mark.fillOpacity = 1;
         style_mark.graphicOpacity = 1;
         style_mark.externalGraphic = "dystopia/pages/MapIcons/GenericMarker.png";

         applayer = new OpenLayers.Layer.Vector("AppLayer", {style: style_mark});
         MapDystopia.addLayer(applayer);
         // Layer for the Add Marker function
         dragFeature = new OpenLayers.Control.DragFeature
            ( applayer
            ,
               { onComplete: appMoveComplete
               , upFeature:
                  function (pixel) {

                     var feature = dragFeature.feature;
                     feature.popup = new OpenLayers.Popup.FramedCloud
                        ( "SEARCH"
                        , feature.geometry.getBounds().getCenterLonLat()
                        , new OpenLayers.Size(100,100)
                        , "<div class='olPopupTitle'>" + feature.attributes.name + "</div><div class='olPopupDescription'>" + feature.attributes.description + "</div>"
                        , null
                        , true
                        , function () { MapDystopia.removePopup(this); }
                        );

                     if (currentPopUp) {

                        MapDystopia.removePopup (currentPopUp);
                        currentPopUp.destroy();
                        delete currentPopUp;
                     }

                     if (feature.attributes) {

                        window.dmz.pinSelected (feature.attributes.id);
                     }

                     currentPopUp = feature.popup;
                     MapDystopia.addPopup(feature.popup);
                  }
               }
            );
         MapDystopia.addControl(dragFeature);
         dragFeature.activate();
      }

   }

   appMoveComplete = function (evt, pixel) {

      var lonlat;

      if (!evt.feature && window.dmz) { // Drag event

         lonlat = MapDystopia.getLonLatFromViewPortPx(pixel);
         window.dmz.pinWasMoved (evt.attributes.id, lonlat.lon, lonlat.lat);
      }
   }

   // App layer add marker
   appAddPoint = function (x, y, title, content, file, objectHandle) {

      var lonlat
        , feature
        , style
        , layer
        ;

      if (window.dmz) {

         layer = MapDystopia.getLayersByName('AppLayer')[0];
         style = layer.style;
         style.externalGraphic = "dystopia/pages/MapIcons/" + file;
         if (objectHandle) { lonlat = new OpenLayers.LonLat(x, y); }
         else {

            lonlat = MapDystopia.getLonLatFromViewPortPx(new OpenLayers.Pixel(x, y));
         }
         feature = new OpenLayers.Feature.Vector
            ( new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat) // Should this be lon/lat?
            ,
               { name: title
               , description: content
               , id: pointID
               , file: file
               , style: style
               }
            );
         layer.addFeatures(feature);

         window.dmz.pinWasAdded
            ( feature.attributes.id
            , lonlat.lon
            , lonlat.lat
            , title
            , content
            , file
            , objectHandle
            );

         pointList[pointID] = feature;
         pointID += 1;
      }
   }

   appRemovePoint = function (id) {

      var feature;

      if (window.dmz) {

         feature = pointList[id];
         if (feature) {

            MapDystopia.getLayersByName("AppLayer")[0].removeFeatures(feature);
            delete pointList[id];
            window.dmz.pinWasRemoved (id);
         }
      }
   }






   // ======================== Handle Events ==============================
   // Static layers popup (called in aLayerKML)
   function onPopupClose(evt) {
      // When a feature is closed
        select.unselectAll();
    }
      function onFeatureSelect(event) {
      // When a feature is clicked on
        featureSelected = event.feature;
        var content = "";

      if(featureSelected.attributes.name)
         content += "<div class='olPopupTitle'>" + featureSelected.attributes.name + "</div>";
      if(featureSelected.attributes.description)
         content += "<div class='olPopupDescription'>" + featureSelected.attributes.description + "</div>";
        if (content.search("<script") != -1) {
            content = "Content contained Javascript! Escaped content below.<br />" + content.replace(/</g, "&lt;");
        }
      // If a line or a poly popup on line where clicked
      if(String(featureSelected.geometry).match('LINESTRING') == 'LINESTRING' ||
         String(featureSelected.geometry.components).match('LINESTRING') == 'LINESTRING' ||
         String(featureSelected.geometry).match('POLYGON') == 'POLYGON'){
         loc = MapDystopia.getLonLatFromPixel(MapDystopia.controls[3].lastXy);
      }else{
         loc = featureSelected.geometry.getBounds().getCenterLonLat();
      }

        var popupSelected = new OpenLayers.Popup.FramedCloud(featureSelected.attributes.name, loc, new OpenLayers.Size(100,100), content, null, true, onPopupClose);
      featureSelected.popup = popupSelected;
        MapDystopia.addPopup(popupSelected);
    }
   function onFeatureUnselect(event) {
      // When a feature is clicked off of
      var feature = event.feature;
      if (feature.popup) {
         MapDystopia.removePopup(feature.popup);
         feature.popup.destroy();
         delete feature.popup;
      }
   }

   // Kills search layer (and of course all features/popups associated with it)
   function removeSearch(){
      getlayer = MapDystopia.getLayersByName('SEARCH')[0];
      getlayer.destroy();
      this.destroy();
   }

   // ===================== MYMARKERS =========================
   function addcustom(layerid, uid){
      lyrid = layerid;
      mymarkeruid = uid;
      // mac FF doesn't support custom cur
      //document.body.style.cursor = 'url(dystopia/pages/MapIcons/GenericMarker.cur) 16 16, auto';
      //document.body.style.cursor = 'url(dystopia/pages/MapIcons/GenericMarker.cur), url(dystopia/pages/MapIcons/GenericMarker.png), url(MapIcons/cursor.cur), default';
      document.body.style.cursor = 'crosshair';
      for(key in custcontrol)
         custcontrol[key].activate();
      custDeactivate();
   }
   function custAdded(event){
      document.body.style.cursor = 'auto';
      custcontrol['point'].deactivate();
      custPopup(MapDystopia.getLayersByName('Custom')[0].features[0]);
      mtitle = ''; micon = ''; mdesc = ''; mvisibility = '';
      restoref();
   }
   function setIcon(icon){
      layer = MapDystopia.getLayersByName('Custom')[0];
      layer.features[0].style.externalGraphic = icon;
      layer.redraw();
   }
   function storef(){
      mtitle = document.getElementById('mtitle').value;
      micon = document.getElementById('micon').value;
      mdesc = document.getElementById('mdesc').value;
      //mvisibility = document.getElementById('mvisibility').value;
   }
   function restoref(){
      if(mtitle != undefined && mtitle != '')
         document.getElementById('mtitle').value = mtitle;
      else
         document.getElementById('mtitle').value = '';
      if(mtitle != undefined && mtitle != '')
         document.getElementById('mdesc').value = mdesc;
      else
         document.getElementById('mdesc').value = '';
      document.getElementById('micon').value = micon;
   }
   function custPopup(evt){
      popup = new OpenLayers.Popup.FramedCloud(
         "Custom",
         evt.geometry.getBounds().getCenterLonLat(),
         new OpenLayers.Size(0,0),
         "<div class='olPopupTitle'>Add New Marker</div>" +
         "<div class='olPopupDescription'>" +
         "<table cellspacing='0' cellpadding='2' width='100%'><tr><td class='olPopupFormLabels'>Marker Name</td><td class='olPopupFormLabels'>Marker Icon</td></tr>" +
         "<td><input type='text' name='mtitle' id='mtitle' style='width: 150px;' onchange='storef();'></td><td>" +
         "<select name='micon' id='micon' onchange='setIcon(this.value); storef();' style='width: 80px;'>" +
            "<option value='dystopia/pages/MapIcons/AddSecurity.png'>Add Security</option>" +
            "<option value='dystopia/pages/MapIcons/Bomb.png'>Bomb / Attack</option>" +
            "<option value='dystopia/pages/MapIcons/Event.png'>Event</option>" +
            "<option value='dystopia/pages/MapIcons/GenericMarker.png' selected=''>Generic</option>" +
            "<option value='dystopia/pages/MapIcons/MeetingPlace.png'>Meeting Place</option>" +
            "<option value='dystopia/pages/MapIcons/Target.png'>Target</option></select></td></tr>" +
         "<tr><td colspan='2' align='left' class='olPopupFormLabels'>Description</td></tr>" +
         "<tr><td colspan='2'><textarea id='mdesc' name='mdesc' style='width: 100%' onchange='storef();'></textarea></td></tr>" +
         "<tr><td><input type='button' name='save' id='save' value='Add Marker' onClick='saveMarker(" + evt.geometry.x + ", " + evt.geometry.y + ");'></td></tr></table>",
         null,
         true,
         custDeactivate,
         {'fixedRelativePosition': true}
      );
      evt.popup = popup;
      MapDystopia.getLayersByName('Custom')[0].features[0].popup = popup;
        MapDystopia.addPopup(popup);
      restoref();
   }
   function custDeactivate(){
      layer = MapDystopia.getLayersByName('Custom')[0];
      if(layer.features[0] != undefined){
         layer.features[0].popup.destroy();
         layer.features[0].destroy();
      }
   }
   function custKillpopup(evt){
      evt.popup.destroy();
   }

   function saveMarker(lat, lon){
      var conn = new Ext.data.Connection();
      conn.request({
         url: 'http://' + window.location.hostname + '/?dystopia:mymarkers&addmarker=1',
         method: 'POST',
         params: {
             'lid': lyrid,
             'uid': mymarkeruid,
            'name': document.getElementById('mtitle').value,
            'icon': document.getElementById('micon').value,
            'desc': document.getElementById('mdesc').value,
             'lat': lat,
             'lon': lon
         },
         success: function() {
            tree = Ext.getCmp('mymarkers');
            node = tree.getNodeById('mymarklyr' + lyrid);
            node.ui.toggleCheck(true);
            Ext.status.msg('Added Marker', 'Successfully added marker');
         },
         failure: function() {
            Ext.Msg.alert('failure', 'Failed to add marker to layer, please try again later.');
         }
      });
      custDeactivate();
   }

   function loadCustomArray(featurearray){
      var layername = featurearray[0][5];
      if(MapDystopia.getLayersByName(layername)[0] == undefined){
         MapDystopia.addLayer(new OpenLayers.Layer.Vector(layername));
         var olayer = MapDystopia.getLayersByName(layername)[0];
         var all_layers = MapDystopia.getLayersByClass('OpenLayers.Layer.Vector');
         select = new OpenLayers.Control.SelectFeature(all_layers);
         MapDystopia.addControl(select);
         select.activate();
         olayer.events.register("featureselected", this, onCustomSelect);
         olayer.events.register("featureunselected", this, onCustomUnselect);
      }else{
         var olayer = MapDystopia.getLayersByName(layername)[0];
      }

      var cfeat = new Array();
      for(k in featurearray){
         if(featurearray[k][0] != undefined){
            var point = new OpenLayers.Geometry.Point(featurearray[k][3], featurearray[k][4]); //latlng goes here
            var feature = new OpenLayers.Feature.Vector(point,null, {
               externalGraphic: featurearray[k][2],
               graphicWidth: 32,
               graphicHeight: 32,
               graphicXOffset: -16,
               graphicYOffset: -16,
               fillOpacity: 1,
               graphicOpacity: 1
            });
            feature.attributes.title = featurearray[k][0];
            feature.attributes.desc = featurearray[k][1];
            feature.attributes.markerid = featurearray[k][6];
            feature.attributes.uid = featurearray[k][7];
            feature.attributes.fname = featurearray[k][8];
            feature.attributes.lname = featurearray[k][9];
            feature.attributes.email = featurearray[k][10];
            feature.attributes.icon = featurearray[k][2];
            cfeat[k] = feature;
         }
      }
      olayer.addFeatures(cfeat);
      displayMymarkers(layername, true);
   }

   function unloadCustomArray(layer){
      todestroy = MapDystopia.getLayersByName(layer)[0];
      for(k in todestroy.features){
         if(todestroy.features[k].cpopup != undefined){
            MapDystopia.removePopup(todestroy.features[k].cpopup);
            todestroy.features[k].cpopup.destroy();
            delete todestroy.features[k].cpopup;
         }
      }
      todestroy.destroyFeatures(todestroy.features);
      displayMymarkers(layer, false);
   }

   function deleteMyMarker(uid, markerid, feature){
      // Deletes a MyMarker
      Ext.MessageBox.confirm('Confirm', 'Remove this marker?<br>(Permanently deletes marker)',
         function(btn){
            if(btn == 'yes'){
               // If confirmed, make the request
               var conn = new Ext.data.Connection();
               conn.request({
                  url: 'http://' + window.location.hostname + '/?dystopia:mymarkers&delmarker=1',
                  method: 'POST',
                  params: {
                      'uid': uid,
                      'mid': markerid
                  },
                  success: function(responseObject) {
                     //Remove the feature
                     MapDystopia.removePopup(mymarkertodelete.cpopup);
                     mymarkertodelete.cpopup.destroy();
                     delete mymarkertodelete.cpopup;
                     mymarkertodelete.destroy();
                     mymarkertodelete = false;
                     Ext.status.msg('Deleted Marker', 'Successfully deleted marker');
                  },
                  failure: function() {
                     Ext.Msg.alert('failure', 'Failed to delete marker from the layer, please try again later.');
                  }
               });
            }
         }
      );
   }

   // Functions for popping up a popup for MyMarkers
   function onCustomSelect(evt){
      feature = evt.feature;

      // Show delete button for marker if person logged in is owner of marker (userid defined in map.html)
      if(feature.attributes.uid == userid){
         mymarkertodelete = feature;
         ownsmarker = '<div style="text-align: right; margin: 8px 8px 8px 8px;">'+
         '<input name="deleteMyMarker" type="button" value="Delete Marker" onClick="deleteMyMarker(' + userid + ', ' + feature.attributes.markerid + ');" />'+
         '</div>';
         owner = 'Created By: Me';
      }else{
         ownsmarker = '';
         owner = 'Created By: ';
      }

      popup = new OpenLayers.Popup.FramedCloud(
         "CUSTOM",
         feature.geometry.getBounds().getCenterLonLat(),
         new OpenLayers.Size(100,100),
         '<div class="olOwner" style="text-align:left; margin-bottom: 3px;">Created by:<br /><a href="mailto:' + feature.attributes.email + '">' + feature.attributes.fname + ' ' + feature.attributes.lname + '</a></div>'+
         '<div class="olPopupTitle">' + stripslashes(feature.attributes.title) + '</div>'+
         '<div class="olPopupDescription">' + stripslashes(feature.attributes.desc) + '</div>'+
         ownsmarker,
         null,
         true,
         onCustomClose
      );
      feature.cpopup = popup;
      MapDystopia.addPopup(popup);
   }

   function onCustomUnselect(evt){
      feature = evt.feature;
      if(feature){
         MapDystopia.removePopup(feature.cpopup);
         feature.cpopup.destroy();
         delete feature.cpopup;
      }
   }

   function onCustomClose(evt){
      select.unselectAll();
   }
