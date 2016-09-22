// Developer Configuration
var FPS = 60.0;
var timeFrameLength = 50;
var firstPostionsTime = {};
/***************************************************************************
* variable definitions
*
*/
var simuTime = 0.0;
//check the simulation time exceeded the end of the file of not
var timerOut = false ; 
// update rate in 1/n seconds. 5.0 seconds is a little bit slow,
// should be 20 or so later
var accelerationFactor = 1.0;
// a pointer to the timeout instance, just that we
// have a pointer that can cancel the timer if the user
// pushed "stop"
var timerInstance;
var startTime = 0 ;
var endTime = timeFrameLength ;
var isPlay = false;

/***************************************************************************     
    ** Functions
    *
    */
// DisPlaying info window
 $("#info-btn").click(function(){
    ipcRenderer.send('create-Info-win');
 });
 shortcut.add("i",function() {
    ipcRenderer.send('create-Info-win');
});
  $("#close").click(function(){
    ipcRenderer.send('create-Help-win');
    })
// called by re-controll.js when user pressed stop
$("#stop-btn").click(function(){
    $('#clock').css("color" , "#fff");
    $("#clock-large").html("00:00:00");
    $("#milliseconds").html(":0000");
    $("#acceleration").html("x 1");
    $( '#play-btn' ).css('background-color', '#404040' );
    $( '#pause-btn' ).css('background-color', '#404040' );
    $('li').children('i').removeClass("ni-status-activated");
    $('li').removeClass("ni-entry-activated");
    $('#foo').html("");     
    removeOutdatedCirclesAndLines(initialInfo['end-time'] * 2) ;
    clearTimeout(timerInstance);

    simuTime = 0.0;

    for (var j = 0; j < chekedNodes.length; j++) {
        var name = chekedNodes[j];
        d3.select('#'+name).remove(); 
    }
    redrawAxis(simuTime);
    svg.selectAll(".dash").remove(); 
 
    zoomFactor = 1.0;
    leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
    rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);
    dataEvents = {} ;
    startEventsTime = leftWindowTime ;
    endEventsTime = timeFrameLength ;
    firstPostionsTime = {};
    interfaceGap = calculateInterfaceGap(zoomFactor,width);
    chekedNodes = [];
  
    for (i in initialInfo.nodes){
        var name = 'Node' + initialInfo.nodes[i]['node-id'];
        var pos = initialInfo.nodes[i]['initial-coordinate'];
        markers[name].setIcon(blueIcon);
        markers[name].setLatLng(pos);
    }
    timerOut = false ; 
    FPS = 60.0;
    accelerationFactor = 1.0;
    lastUpdatePos = -1;
    dbCirclesLines = [];
    startTime = 0 ;
    endTime = timeFrameLength ;
    isPlay = false;
    mapDb = [];
    ipcRenderer.send('loading-data',initialInfo['generic-filename'],startTime,endTime,0);
    console.log(chekedNodes);


});

// called by re-controll.js when user pressed play 
$("#play-btn").click(function(){
    playBtn();
});
shortcut.add(" ",function() {
    playBtn(); 
});
function playBtn(){
    if (isPlay == false){
        isPlay = true ;
        $( '#play-btn' ).css('background-color', '#1a1a1a' );
        $( '#pause-btn' ).css('background-color', '#404040' );
        playLoop();
    }
    if ((isPlay == true) && (accelerationFactor != 1)){
        accelerationFactor = 1 ;
        document.getElementById("acceleration").innerHTML = 'x ' + accelerationFactor;
    }
}

// called by re-controll.js when user pressed pause
$("#pause-btn").click(function(){
    pauseBtn();
});
shortcut.add("p",function() {
    pauseBtn(); 
});
function pauseBtn(){
    if (isPlay == true){
        $( '#play-btn' ).css('background-color', '#404040' );
        $( '#pause-btn' ).css('background-color', '#1a1a1a' );
        isPlay = false ;
        clearTimeout(timerInstance);
    }
}

// called by re-controll.js when user pressed backward
$("#backward-btn").click(function(){
    accelerationFactor /= 10 ;
    document.getElementById("acceleration").innerHTML = 'x ' + accelerationFactor;
    if (accelerationFactor < 1){       
        $('#acceleration').css("color" , "#fff");
        formatSeconds = d3.timeFormat("%H:%M:%S.%L");
    }
    redrawAxis(simuTime);
    console.log(accelerationFactor);
});
shortcut.add("Down",function() {
    accelerationFactor /= 10 ;
    document.getElementById("acceleration").innerHTML = 'x ' + accelerationFactor;
    if (accelerationFactor < 1){
        
        $('#acceleration').css("color" , "#fff"); 
       formatSeconds = d3.timeFormat("%H:%M:%S.%L");

    }
    redrawAxis(simuTime);
    console.log(accelerationFactor); 
});	

// called by re-controll.js when user pressed forward
$("#forward-btn").click(function(){
    accelerationFactor *= 10 ;
    document.getElementById("acceleration").innerHTML = 'x ' + accelerationFactor;
    if (accelerationFactor >= 1){
      formatSeconds = d3.timeFormat("%H:%M:%S");
        $('#acceleration').css("color" , "#DE1616");

    }
    redrawAxis(simuTime);
    console.log(accelerationFactor);
});
shortcut.add("Up",function() {
    accelerationFactor *= 10 ;
    document.getElementById("acceleration").innerHTML = 'x ' + accelerationFactor;
    if (accelerationFactor >= 1){
      formatSeconds = d3.timeFormat("%H:%M:%S");
        $('#acceleration').css("color" , "#DE1616");

    }
    redrawAxis(simuTime);
    console.log(accelerationFactor);
}); 	

// called by re-controll.js when user pressed fast backward
$("#fast-backward-btn").click(function(){
    fastBackward();
});	
shortcut.add("Left",function() {
    fastBackward(); 
});
function fastBackward(){
    simuTime -= 10 * accelerationFactor ;
    if (simuTime < parseFloat(initialInfo['start-time'])){
        simuTime = parseFloat(initialInfo['start-time']);
    }
    console.log(simuTime);
    console.log(mapDb[0].time);
    showTime(simuTime,'clock-large','milliseconds');
    removeOutdatedCirclesAndLines(initialInfo['end-time']) ;
    if (mapDb[0].time < simuTime){
        for (i = lastUpdatePos; i > 0; i--){
            if ( mapDb[i].time < simuTime ) {
              lastUpdatePos = i ; 
              break;
            }
        } 
        console.log(lastUpdatePos);
    }else{
        ipcRenderer.send('loading-data',initialInfo['generic-filename'],simuTime,parseFloat(mapDb[0].time),- 1);
    } 
    //event part 
    for( var k=0 ; k < chekedNodes.length ; k++ ){
        var nodeName = chekedNodes[k];
        firstPostionsTime[nodeName]=dataEvents[nodeName][0]['time'];
    }
    var arr = Object.keys( firstPostionsTime ).map(function ( key ) { return firstPostionsTime[key]; });
    var firstEventTime = Math.min.apply(null, arr) ;
    redrawAxis(simuTime);
    leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
    rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);
    if ( leftWindowTime < firstEventTime ){
        interfaceGap = calculateInterfaceGap(zoomFactor,width);
        ipcRenderer.send('loading-events-data', chekedNodes ,leftWindowTime,firstEventTime,interfaceGap,-1);
    } 
}

// called by re-controll.js when user pressed fast forward
$("#fast-forward-btn").click(function(){
    simuTime += 10 * accelerationFactor ;
    showTime(simuTime,'clock-large','milliseconds');
    removeOutdatedCirclesAndLines(initialInfo['end-time']) ;
    console.log(simuTime);
    console.log(parseFloat(mapDb[mapDb.length - 1].time));
    if (simuTime > parseFloat(mapDb[mapDb.length - 1].time)){
        ipcRenderer.send('loading-data',initialInfo['generic-filename'],simuTime,simuTime + timeFrameLength ,1);
    }
   redrawEvents(simuTime);
});	
shortcut.add("Right",function() {

    simuTime += 10 * accelerationFactor ;
    showTime(simuTime,'clock-large','milliseconds');
    removeOutdatedCirclesAndLines(initialInfo['end-time']) ;
    console.log(simuTime);
    console.log(parseFloat(mapDb[mapDb.length - 1].time));
    if (simuTime > parseFloat(mapDb[mapDb.length - 1].time)){
        ipcRenderer.send('loading-data',initialInfo['generic-filename'],simuTime,simuTime + timeFrameLength ,1);
    }
    redrawEvents(simuTime);

});
// called by re-controll.js when user pressed zoom in
$("#zoomin-btn").click(function(){
    zoomFactor = zoomFactor / 2;
    interfaceGap = calculateInterfaceGap(zoomFactor,width);
    if (zoomFactor <= 1){
      formatSeconds = d3.timeFormat("%H:%M:%S.%L");
    }
    leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
    rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);
    redrawAxis(simuTime);
    endEventsTime = rightWindowTime + 40;
    ipcRenderer.send('loading-events-data', chekedNodes ,leftWindowTime,endEventsTime,interfaceGap,1);
}); 
// called by re-controll.js when user pressed zoom out
$("#zoomout-btn").click(function(){
    zoomFactor = zoomFactor * 2;
    interfaceGap = calculateInterfaceGap(zoomFactor,width);
    if (zoomFactor > 1){
      formatSeconds = d3.timeFormat("%H:%M:%S");
    }
    leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
    rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);
    redrawAxis(simuTime);
    endEventsTime = rightWindowTime + 40;
    ipcRenderer.send('loading-events-data', chekedNodes ,leftWindowTime,endEventsTime,interfaceGap,1);

}); 

function redraw(simuTime,svg) {
	// simple forward call to actual workers
	redrawMap(simuTime);
    redrawEvents(simuTime);
}

// called by re-controll.js when user pressed play
function playLoop() {
    var fpsRec = 1.0 / FPS;
    showTime(simuTime,'clock-large','milliseconds');
    redraw(simuTime);

    //updating map data
    if (endTime - simuTime <= 20){
        startTime = endTime ;
        endTime = endTime + timeFrameLength ;
       ipcRenderer.send('loading-data',initialInfo['generic-filename'],startTime,endTime,0); 
    }
  
    simuTime += (fpsRec * accelerationFactor);
 
    if (timerOut == false){
	  timerInstance = setTimeout(playLoop, fpsRec * 1000);
    }
    if(simuTime > initialInfo['end-time']){
        timerOut = true ;
        $('#clock').css("color" , "#DE1616");
        showTime(initialInfo['end-time'],'clock-large','milliseconds');
    }
}


//Draw the clock 
function showTime(simuTime,clockid,millisecondsId) {
    var second_number = Math.floor(simuTime);
    var currHour = Math.floor(second_number/3600);
    var currMinute = Math.floor((second_number%3600)/60);
    var currSecond = second_number - (currHour*3600) - (currMinute*60);
    currHour = checkTime(currHour);
    currMinute = checkTime(currMinute);
    currSecond = checkTime(currSecond);
    document.getElementById(clockid).innerHTML=currHour + ":" + currMinute + ":" + currSecond;
    if (millisecondsId != null){
        var currMill = simuTime - second_number ; 
        currMill = checkMillis(currMill);
        document.getElementById(millisecondsId).innerHTML=':' + currMill;
    }
}

function checkTime(i) {
    if (i < 10) {
         i = "0" + i;
    }
    return i;
}

function checkMillis(i){
    var str = i + '';
    if (str.length < 6){
        str = str + '0000'
    } 
    var res = str.slice(2,6);     
    return res;
}
