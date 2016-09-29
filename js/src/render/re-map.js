    /***************************************************************************
     ** Variables
     *
     */
    var lastUpdatePos = -1;
     //Delete outdated circles
    var dbCirclesLines = [];
    /*
     * The map with markers
     */
    var map;
    var bounding = [];
    /*
     * The markers on the map
     */
    var markers = {};
     /*
     * Create Icons
     */
    //Icon for checked nodes
    var redIcon = L.icon({
        iconUrl: './images/lib/leaflet-img/marker-iconRed.png',
        iconSize:     [25, 41], // size of the icon
        iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
        popupAnchor:  [2, -33] // point from which the popup should open relative to the iconAnchor
    });
    //Icon for uncheked nodes
    var blueIcon = L.icon({
        iconUrl: './images/lib/leaflet-img/marker-icon.png',
        iconSize:     [25, 41], // size of the icon
        iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
        popupAnchor:  [2, -33] // point from which the popup should open relative to the iconAnchor
    });
    /***************************************************************************
     ** Functions
     *
     */

    function initMap(height) {

        console.log('Initialize map');
        var url = 'http://' + window.location.host;
        $("#map").height(height);
        console.log(url + '/tiles');

        // create a map in the "map" div, set the view to a given place and zoom
        map = L.map('map', {drawControl: true}).setView([48.1, 11.5], 10);

        L.tileLayer('./images/lib/tiles/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

    };

    function resizeMap(height) {
        $("#map").height(height);
    }

    function clearMap(){
        for(i in map._layers){
            if(map._layers[i]._path != undefined)
            {
                try{
                    map.removeLayer(map._layers[i]);
                }
                catch(e){
                    console.log("problem with " + e + map._layers[i]);
                }
            }
        }
    }

    function setInitialNodePositions(positions) {
        clearMap();

        for (var i = 0; i < positions.length; i++) {
          var name = 'Node' + positions[i]['node-id'];

          /* Draw the markers */
          if (!markers[name]) {
              var pos = [positions[i]['initial-coordinate'].lat, positions[i]['initial-coordinate'].lon] ;
              markers[name] = L.marker(pos).addTo(map);
              bounding.push(pos);
              if (i == 0) {
                markers[name].bindPopup('Node0');
              } else {
                markers[name].bindPopup(name);
              }
              markers[name].on('mouseover', function (e) {
                  this.openPopup();
              });
              markers[name].on('mouseout', function (e) {
                this.closePopup();
              });

          } else {
            markers[name].setLatLng([positions[i]['initial-coordinate'].lat,positions[i]['initial-coordinate'].lon]);
          }
        }

        map.fitBounds(bounding);
    };

    //redraw the map

function redrawMap(simuTime) {
  // here the leaflet map is actually updated.
  // this function is implemented in re-map.js and updates
  // for all radios the position, based on the simuTime argument

  //might be woth a check here
    if ( !mapDb ) {
        throw "map database not initialized";
    }

    var coordinatesToUpdate = [[],[]];
    var transmissionsToUpdate = [[],[]];
    var receptionsToUpdate = [[],[]];

    var UpdateCoordinates = false;
    var UpdateTransmissions = false;
    var UpdateReceptions = false;

    //now iterate over the DB starting at the last updated position
    //and take the newest event, if any available
    for (i = lastUpdatePos + 1; i < mapDb.length; i++) {
        //if the current list entry is in the future
        //stop the search
        if ( mapDb[i].time > simuTime ) {
            break;
        }

        switch (mapDb[i].module) {
            case "PROBE_NODE_COORDINATE":
            addCoordinate( mapDb[i], coordinatesToUpdate, i );
            UpdateCoordinates = true;
            break;

            case "PROBE_TRANSMISSION":
            addTransmission( mapDb[i], transmissionsToUpdate, i );
            UpdateTransmissions = true;
            break;

            case "PROBE_RECEPTION":
            addReception( mapDb[i], receptionsToUpdate, i );
            UpdateReceptions = true;
            break;

            default:
            break;
        }
    }

    removeOutdatedCirclesAndLines(simuTime);

    //update if necessary
    if (UpdateCoordinates) {
        updateCoordinates( coordinatesToUpdate );
    }

    if (UpdateTransmissions) {
        updateTransmissions( transmissionsToUpdate, simuTime );
    }

    if (UpdateReceptions) {
        updateReceptions( receptionsToUpdate , simuTime );
    }
}
//add COORDINATE to the list of coordinatesToUpdate
//if there is already a coordinate in the coordinatesToUpdate for
//a certain node, the coordinate is replaced by the new one
function addCoordinate( coordinateObject, coordinatesToUpdate, curPos ) {
   var name = coordinateObject.node ;
   var pos = [coordinateObject.data.lat, coordinateObject.data.lon] ;
   var nodeNum = coordinatesToUpdate[0].indexOf(name);
   if ( nodeNum == -1 ) {
      coordinatesToUpdate[0].push(name);
      coordinatesToUpdate[1].push(pos);
   } else {
        coordinatesToUpdate[1][nodeNum] = pos ;
   }
   lastUpdatePos = curPos;
}

//add TRANSMISSION to the list of transmissionsToUpdate
//if there is already a transmission in the transmissionsToUpdate for
//a certain link or node, the transmission is replaced by the new one
function addTransmission( transmissionObject, transmissionsToUpdate, curPos ) {
    var name = transmissionObject.node ;
    var trans = transmissionObject.data ;
    var nodeNum = transmissionsToUpdate[0].indexOf(name);
    if ( nodeNum == -1 ) {
      transmissionsToUpdate[0].push(name);
      transmissionsToUpdate[1].push(trans);
   } else {
        transmissionsToUpdate[1][nodeNum] = trans ;
   }
    lastUpdatePos = curPos;
}

//add RECEPTION to the list of receptionsToUpdate
//if there is already a reception in the receptionsToUpdate for
//a certain node and subtype, the reception is replaced by the new one
function addReception( receptionObject, receptionsToUpdate, curPos ) {
    var name = receptionObject.node ;
    var recep = receptionObject.data ;
    var nodeNum = receptionsToUpdate[0].indexOf(name);
    if ( nodeNum == -1 ) {
      receptionsToUpdate[0].push(name);
      receptionsToUpdate[1].push(recep);
   } else {
        receptionsToUpdate[1][nodeNum] = recep ;
   }
    lastUpdatePos = curPos;
}


//update the positions for all entries in coordinatesToUpdate
//NOTE: there should be only 1 entry max per node!!!
function updateCoordinates( coordinatesToUpdate ) {
  console.log(coordinatesToUpdate);
  for (i in coordinatesToUpdate[0]){
      var name = coordinatesToUpdate[0][i] ;
      var pos = coordinatesToUpdate[1][i] ;
      // console.log(name,pos);
      markers[name].setLatLng(pos);
      bounding.push(pos);
      markers[name].bindPopup(name);
      markers[name].on('mouseover', function (e) {
          this.openPopup();
      });
      markers[name].on('mouseout', function (e) {
          this.closePopup();
      });
  }
  // map.fitBounds(bounding);
}


//update all transmissions in transmissionsToUpdate
//NOTE: there should be only one transmission per link or node!!!
function updateTransmissions( transmissionsToUpdate, simuTime ) {
  var displayTime = 500;
  for (i in transmissionsToUpdate[0]){
      var name = transmissionsToUpdate[0][i] ;
      var trans = transmissionsToUpdate[1][i] ;
      var category = trans.category ;
      var currentPos = markers[name].getLatLng();
      var subtype = trans.subtype;
      var type = trans.type ;
        if (typeof initialInfo['traffic-classes'][subtype] == 'undefined'){
         var color = "#118C2A" ;
          console.log("no color defined for", subtype);
        }else{
          var color = initialInfo['traffic-classes'][subtype].color ;
        }
      if (type == "node"){
        console.log("node circle large");
        var cir = L.circleMarker(currentPos, {radius: 15, color: color , stroke : false , fillOpacity:0.3}) ;
      }else{
        var cir = L.circleMarker(currentPos, {radius: 15, color: color , stroke : false, fillOpacity:0.3}) ;
      }
      console.log(name);
      cir.addTo(map) ;
      dbCirclesLines.push([cir, simuTime + displayTime / 1000]);
  }
}


//update all receptions in receptionsToUpdate
//NOTE: there should be only one reception per node and subtype!!!
function updateReceptions( receptionsToUpdate , simuTime) {
  var displayTime = 500;
  for (i in receptionsToUpdate[0]){
      var receiverName = receptionsToUpdate[0][i] ;
      var recep = receptionsToUpdate[1][i] ;
      var subtype = recep.subtype;
      var type = recep.type ;
      var category = recep.category ;
      var receiver = markers[receiverName].getLatLng();

        if (typeof initialInfo['traffic-classes'][subtype] == 'undefined'){
         var color = "#CC0631" ;
         console.log("no color defined for", subtype);
        }else{
          var color = initialInfo['traffic-classes'][subtype].color ;
        }

      if (type == "node"){
      var recepLayer = L.circleMarker(receiver, {radius: 40, color: color  , stroke : false, fillOpacity:0.3}) ;
      }else{
        var color = initialInfo['traffic-classes'][subtype].color ;
        var senderName = 'Node' + recep.source ;
        var sender = markers[senderName].getLatLng() ;
        var recepLayer = new L.Polyline([receiver,sender], {color: color ,
                                           weight: 3,
                                           opacity: 0.5,
                                           smoothFactor: 1
                                           });
      }
      recepLayer.addTo(map);
      dbCirclesLines.push([recepLayer, simuTime + displayTime / 1000]) ;
  }
}


//Called by redrawMap to remove the outdated circles and lines drawn in the map
function removeOutdatedCirclesAndLines(simuTime) {
  var outdated = [];
  var elements = dbCirclesLines.length;
  for (var i = 0; i < elements; i++) {
    if (dbCirclesLines[i][1] < simuTime) {
      map.removeLayer(dbCirclesLines[i][0]);
      outdated.push(i);
    }
  }

  for (var i; i < outdated.length; i++) {
    dbCirclesLines.splice(i, 1);
  }
}

   /***************************************************************************
     ** Main
     *
     */
    initMap($("#map-container").height());

    $(window).resize(function() {
        var windowHeight = $("#map-container").height(),
        contentHeight = windowHeight;
        resizeMap(contentHeight);
    });
