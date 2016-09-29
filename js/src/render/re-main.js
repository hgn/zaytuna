/***************************************************************************
* variable definitions
*
*/
const fs = require('fs');

const ipcRenderer = require('electron').ipcRenderer;
var path = '' ;
var mapDb = [];
var chekedNodes = [] ;
var tabNodes = [] ;
var initialInfo = {};
/***************************************************************************
* communication channels with the main process
*
*/
ipcRenderer.on('description-finished', function(event,arg1) {
  initialInfo = arg1;
  handleTraceFileInformation(arg1);
    $("#info-btn").css("pointer-events", "auto");
    console.log('description-finished');
    ipcRenderer.send('unzip-file',initialInfo['generic-filename'],startTime,endTime);

});

ipcRenderer.on('chunk-ready', function(event,arg1,arg2,arg3) {
    console.log(arg1);
  console.log(arg3);
  console.log(arg2);
  $("a").removeClass("disabled");
   $("#trace_name").html(initialInfo['name']);
   $("#trace_name").css("color", "#a6e22e");

if (arg3 == 0){
     mapDb = mapDb.slice(lastUpdatePos, mapDb.length);
     lastUpdatePos= 0;
     mapDb = $.merge(mapDb,arg1);
}else if (arg3 == 1){
  mapDb = arg1 ;
  lastUpdatePos = 0 ;
  updateCoordinates(arg2);
}else{
  mapDb =$.merge(arg1,mapDb);
  lastUpdatePos= 0;
  updateCoordinates(arg2);
  if (mapDb.length > 3000){
    mapDb = mapDb.slice(0,3000);
  }
}
// console.log(mapDb);
endTime = parseFloat(mapDb[mapDb.length - 1].time) ;
// console.log(endTime);
});

ipcRenderer.on('events-data-loaded', function(event, arg1 , arg2) {
  var name = 'Node' + arg1[0].Node ;
  console.log(name);
    if (arg2 == 0){
          console.log(arg1);
            dataEvents[name] = dataEvents[name].concat(arg1);
    } else if (arg2 == -1) {
            dataEvents[name] = arg1.concat(dataEvents[name]);
    } else if (arg2 == 1){

            dataEvents[name] = arg1 ;
    }
    redrawAxis(simuTime);
    redrawBars(rightWindowTime,leftWindowTime);



});

/***************************************************************************
* Functions
*
*/

/*Reading the file dragged line by line*/
var holder = document.getElementById('map');
holder.ondragover = function () {
    return false;
};

holder.ondragleave = holder.ondragend = function () {
    return false;
};

holder.ondrop = function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
      $("#trace_name").html("Trace file loading...");
    if (path != ''){
      cleanAllVars();
      path = file.path ;
      ipcRenderer.send('open-description-file', path);
    }else {
      path = file.path ;
      ipcRenderer.send('open-description-file', path);
    }
};


/* handle the initial information after parsing a file for the first time */
function handleTraceFileInformation(initialInfo) {
    console.log("handleTraceFileInformation");

    // retrieve global informations about the trace file
    var nodesInfo = initialInfo.nodes;
    var x = 0 ;
    var draw_it = false;
    for ( x in nodesInfo){
      tabNodes[x] = 'Node' + nodesInfo[x]['node-id'] ;
      if ((typeof nodesInfo[x]['type'] !== 'undefined') && (typeof initialInfo['assets']['control-images'][0]['name']!== 'undefined' )) {
        if (nodesInfo[x]['type'] == initialInfo['assets']['control-images'][0]['name']  ){
          var NAME = initialInfo['assets']['control-images'][0]['name'];
          var TYPE = initialInfo['assets']['control-images'][0]['type'];
          var DATA = initialInfo['assets']['control-images'][0]['data'];
          var app1 = "<li class='ni-entry' value='"+ tabNodes[x] ;
          var app2 = "'><i class='ni-entry-status'></i><div class='ni-entry-img'><img src='data:image/" + TYPE + ";base64," ;
          var app3 = DATA + "' alt="+ NAME + "/></div><div class='ni-entry-main-info'>" + tabNodes[x];
          var app4 = "</div><div class='ni-entry-detail-info'><div class='ni-entry-detail-info-entry'>TX:";


          var barname_tx = 'dynamicbartx' +  nodesInfo[x]['node-id'];
          var barname_rx = 'dynamicbarrx' +  nodesInfo[x]['node-id'];
          var TX = "&nbsp;<span class='" + barname_tx + "'></span>";
          var app5 = "</div><div class='ni-entry-detail-info-entry'>RX:";

          var RX = "&nbsp;<span class='" + barname_rx + "'></span>"
          var app6 = "</div></div><div class='ni-entry-cmd-section'><div class='fa fa-info-circle'></div><div class='fa fa-crosshairs'></div></div></li>";
          draw_it = true;
        }
      }else{
              var barname_tx = 'dynamicbartx' +  nodesInfo[x]['node-id'];
              var barname_rx = 'dynamicbarrx' +  nodesInfo[x]['node-id'];

          var app1 = "<li class='ni-entry' value='"+ tabNodes[x];
          var app2 = "'><i class='ni-entry-status'></i><div class='ni-entry-img'><img src='images/src/25.jpg' /></div>";
          var app3 = "<div class='ni-entry-main-info'>" + tabNodes[x];
          var app4 = "</div><div class='ni-entry-detail-info'><div class='ni-entry-detail-info-entry'>TX:";
          var TX = "&nbsp;<span class='" + barname_tx + "'></span>";
          var app5 ="</div><div class='ni-entry-detail-info-entry'>RX:";
          var RX = "&nbsp;<span class='" + barname_rx + "'></span>"
          var app6 = "</div></div><div class='ni-entry-cmd-section'><div class='fa fa-info-circle'></div><div class='fa fa-crosshairs'></div></div></li>";
          draw_it = true;
      }

      if (draw_it) {
              var barname_tx = 'dynamicbartx' +  nodesInfo[x]['node-id'];
              var barname_rx = 'dynamicbarrx' +  nodesInfo[x]['node-id'];

              var str = app1.concat(app2,app3,app4,TX,app5,RX,app6);
              $("#list").append(str);

              $("." + barname_tx).sparkline(nodesInfo[x]['packet-no']['tx'], {type: 'bar', barColor: '#BDBDBD'} );
              $("." + barname_rx).sparkline(nodesInfo[x]['packet-no']['rx'], {type: 'bar', barColor: '#E0E0E0'} );
      }

    }
    showTime(initialInfo['start-time'],'startclock',null);
    showTime(initialInfo['end-time'],'stopclock',null);

    //set the map with the initial positions of the nodes
    setInitialNodePositions(initialInfo.nodes);

    //color and store the checked nodes in chekedNodes
    $("li").click(function () {

         var name = $(this).attr('value');
         console.log(name);
        console.log(name.substr(4, name.length - 1 ));
         var check = $(this).children('i').attr('class');
         console.log(check);
         if ((check == 'ni-entry-status') && (chekedNodes.length < 5)) {
            $(this).children('i').addClass("ni-status-activated");
            $(this).addClass("ni-entry-activated");
            markers[name].setIcon(redIcon);
            chekedNodes.push(name);
            dataEvents[name] = [];
            interfaceGap = calculateInterfaceGap(zoomFactor,width);
            ipcRenderer.send('unzip-node-file','node-' + name.substr(4, name.length - 1 ) +'.data',startEventsTime,endEventsTime,interfaceGap);

        var y = 35 + (chekedNodes.length - 1)* 75 ;
        svg.attr("height", y + 75);
        var vakken = svg.append("g")
          .attr('id',name)
          .attr("class", "bar")
          .attr("height", 75)
          .attr("width", '100%')
          .attr("transform", "translate("+ 0 +"," + y + ")");
        var bar = vakken.append("rect")
          .attr("height", 75)
          .attr("width", '100%')
          .style("stroke", '#000000')
          .style("stroke-width", 0.5)
          .style("fill", '#5a5d5f');
        var subbar = vakken.append('g')
          .attr("class", "subbar");
        var nodeName = vakken.append('rect')
          .attr("height", 75)
          .attr("width", margin.left)
          .style("fill", "#272626");
        var nodetext = vakken.append('text')
        .attr("font-size", 10)
        .attr("rotate", -90)
        .attr("dx", "1em")
        .attr("dy", "-0.6em")
        .attr("letter-spacing", "0.5em")
        .attr("transform", "rotate(90)")
        .style("fill", "#fff")
        .text(name );

         } else if (check != 'ni-entry-status'){
            $(this).children('i').removeClass("ni-status-activated");
            $(this).removeClass("ni-entry-activated");
            markers[name].setIcon(blueIcon);
            var n = chekedNodes.indexOf(name);
            chekedNodes.splice(n,1);
             $("#"+name).remove();
             delete dataEvents[name] ;
          for (var i = n; i < chekedNodes.length; i++) {
              var y = 35 + i* 75 ;
              $("#"+chekedNodes[i]).attr("transform", "translate("+ 0 +"," + y + ")");
            }
          svg.attr("height", 35 + chekedNodes.length * 75 );
         }
          svg.selectAll(".dash").remove();
          drawDashLines(75*chekedNodes.length );
         console.log(chekedNodes);
    });


};

/*Resizing*/
$('#MapNode').css("height", screen.height * 0.65);
$('#events').css("height", screen.height * 0.25);
$('#node').css("height",$('#MapNode').height() - $('#control').height() - $('#info').height());
//Vertical :Resizing the nodes and map sections
var max = ($(window).width());
$('#split-barv').mousedown(function (e) {
    e.preventDefault();
    $(document).mousemove(function (e) {
        e.preventDefault();
        var x = e.pageX - $('#map-container').offset().left;
        var max = ($(window).width());
        if ( x < max - 15 && e.pageX < ($(window).width()) && x > 0 ) {
          $('#nodes').css("width",max - x);
        }
    })
});

//Horizontal: Resizing the events and the map sections
$('#split-barh').mousedown(function (e) {
    e.preventDefault();
    $(document).mousemove(function (e) {
        e.preventDefault();
        var y = e.pageY - $('#MapNode').offset().top;
        $('#events').css("height", $(window).height()- $('#MapNode').height());
        var max = ($(window).height()) - 5;
        var min = $('#control').height() + $('#info').height() ;
        if (y < max  && e.pageY < ($(window).height()) && y > min) {
        $('#events').css("height", $(window).height()- $('#MapNode').height());
          $('#MapNode').css("height", y);
          $('#map-container').css("height", y);
          $('#map').css("height", y);
          $('#node').css("height", y- $('#control').height() - $('#info').height());
          $('#events').css("height", $(window).height()-y);
        }
    })
});
//shortcut to get the map on max size
shortcut.add("m",function() {
    var maxh = ($(window).height()) - 5;
    var maxw = ($(window).width()) - 5;
    $('#node').css("height", maxh- $('#control').height() - $('#info').height());
    $('#MapNode').css("height", maxh);
    $('#map-container').css("height", maxh);
    $('#map').css("height", maxh);
    $('#nodes').css("width",15);
    $('#events').css("height", $(window).height()-maxh);
});
//shortcut to get the events on max size
shortcut.add("e",function() {
    var maxh = ($(window).height()) - $('#control').height() - $('#info').height()
    var minh =  $('#control').height() + $('#info').height()
    $('#MapNode').css("height", minh);
    $('#map-container').css("height", minh);
    $('#map').css("height", minh);
    $('#node').css("height",1);
    $('#events').css("height", maxh);
});

// called to renitialise the application for a new file
function cleanAllVars(){
  //Clear the map
  var i = 0 ;
  for (i in tabNodes){ map.removeLayer(markers[tabNodes[i]]);}
  for (i in dbCirclesLines){  map.removeLayer(dbCirclesLines[i][0]); }

  //Clear the control and node sections
  $("#list").html("");
  $("#startclock").html('');
  $("#stopclock").html('' );
  $('#clock').css("color" , "#fff");
  $("#clock-large").html("00:00:00");
  $("#milliseconds").html(":0000");
  $("#acceleration").html("x 1");
  $( '#play-btn' ).css('background-color', '#404040' );
  $( '#pause-btn' ).css('background-color', '#404040' );
  $("#trace_name").css("color", "#ABA9A9");
  $('#foo').html("");
  $("a").addClass("disabled");
  clearTimeout(timerInstance);
  for (var j = 0; j < chekedNodes.length; j++) {
        var name = chekedNodes[j];
        d3.select('#'+name).remove();
  }
  svg.selectAll(".dash").remove();
 //renitialise all the global variables
  tabNodes = [];
  mapDb = [];
  chekedNodes = [] ;
  initialInfo = {};
  simuTime = 0.0;
  timerOut = false ;
  FPS = 60.0;
  accelerationFactor = 1.0;
  lastUpdatePos = -1;
  dbCirclesLines = [];
  bounding = [];
  markers = {};
  isPlay = false;
  mapDb = [];
  startTime = 0 ;
  endTime = timeFrameLength ;
  zoomFactor = 1.0;
  leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
  rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);
  dataEvents = {} ;
  startEventsTime = leftWindowTime ;
  endEventsTime = timeFrameLength ;
  firstPostionsTime = {};
  interfaceGap = 0.1 ;
  redrawAxis(simuTime);

}



/*Creating a Menu*/
const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

var menu = new Menu();
menu.append(new MenuItem({ label: 'MenuItem1', click: function() { console.log('item 1 clicked'); } }));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }));

window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  menu.popup(remote.getCurrentWindow());
}, false);
var template = [
 {
    label: 'File',
    submenu: [
      {
        label: 'Open new trace file',
        accelerator: 'CmdOrCtrl+N',
        click: function() {
          var p = dialog.showOpenDialog() ;
          if (p[0]){
          $("#trace_name").html("Trace file loading...");
          if (path != ''){
            cleanAllVars();
            path = p[0] ;
            ipcRenderer.send('open-description-file', path);
          }else {
            path = p[0] ;
            ipcRenderer.send('open-description-file', path);}
          }
        }
      },
       {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
    ]
  },
 {
    label: 'Help',
    submenu: [
      {
        label: 'Shortcuts',
        accelerator: 'CmdOrCtrl+H',
        click: function() {
          ipcRenderer.send('create-Help-win');
        }
      },
      {
        label: 'About',
        accelerator: 'CmdOrCtrl+I',
        click: function() {
          ipcRenderer.send('create-About-win');
        }
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      },
    ]
  },

];

var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

$(document).mouseup(function (e) {
    $(document).unbind('mousemove');
});

$(function() {
        $('.sparklines').sparkline();
});
