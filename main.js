'use strict';

/***************************************************************************
* variable definitions
*
*/
const temp = require('temp');
const path = require('path');
const tar = require('tar-fs') ;
const fs = require('fs');
const unzip = require('unzip');
const electron = require('electron');
const ipcMain = require('electron').ipcMain;
var tempPath ='';
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let infoWindow;
let helpWindow;
let AboutWindow;
// Automatically track and cleanup files at exit
//temp.track();


/***************************************************************************
* communication channels with the render process
*
*/
ipcMain.on('open-description-file', function(event, arg) {
    openDescriptionFile(arg, event);    
});
ipcMain.on('unzip-file', function(event,arg1,arg2,arg3) {
    unzipFile(event,arg1,arg2,arg3);    
});
ipcMain.on('unzip-node-file', function(event,arg1,arg2,arg3,arg4) {
    unzipNodeFile(event,arg1,arg2,arg3,arg4);    
});
ipcMain.on('loading-data', function(event,arg1,arg2,arg3,arg4) {
    loadingData(event,arg1, arg2, arg3,arg4);  
});
ipcMain.on('loading-events-data', function(event, arg1, arg2, arg3,arg4,arg5) {
    for (var j = 0; j < arg1.length; j++) {
        var name = arg1[j];
        var fileName = 'node-' + name.substr(4, name.length - 1 ) +'.data' ;
        loadingEventsData(event,fileName, arg2 , arg3, arg4,arg5);    
    }
});
ipcMain.on('create-Info-win', function() {
    createInfoWin();    
});
ipcMain.on('create-About-win', function() {
    createAboutWin();    
});
ipcMain.on('create-Help-win', function() {
    createHelpWin();    
});

/***************************************************************************
* main
*
*/
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

/***************************************************************************
* Functions
*
*/
function createWindow () {
    // Create the browser window.

    mainWindow = new BrowserWindow({ show:false , darkTheme: true});

    // register callback on the new window
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        //remove temporary files here
        rmDir(tempPath);

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        if (infoWindow != null) {
          infoWindow.destroy();  
        }
        if (AboutWindow != null) {
          AboutWindow.destroy();  
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // maximize the window
    mainWindow.maximize();

    // finally, show the new window
    mainWindow.show();
   
}


/*Showing and hiding the Info window*/
function createInfoWin(){
    infoWindow = new BrowserWindow({ width: 500, height: 500 ,autoHideMenuBar: true, show : true});
    infoWindow.on('closed', function() {
        infoWindow = null;
    });
    infoWindow.loadURL('file://' + __dirname + '/info.html');
}
/*Showing and hiding the About window*/
function createAboutWin(){
    AboutWindow = new BrowserWindow({ width: 500, height: 500 ,autoHideMenuBar: true, show : true});
    AboutWindow.on('closed', function() {
        AboutWindow = null;
    });
    AboutWindow.loadURL('file://' + __dirname + '/about.html');
}
/*Showing and hiding the help window*/
function createHelpWin(){
      if (helpWindow != null) {
        helpWindow.destroy();
          helpWindow = null ; 
        }else{
              helpWindow = new BrowserWindow({ frame: false , width: 500, height: 500 ,autoHideMenuBar: true, show : true});
    helpWindow.on('closed', function() {
        helpWindow = null;
    });
    helpWindow.loadURL('file://' + __dirname + '/shortcuts.html');  
        }

}


/*Reading the file dragged line by line*/
function openDescriptionFile(filePath, event) {

temp.mkdir('Zaytuna_Files', function(err, dirPath) {
    tempPath = dirPath ;
    var initialInfo = {};    
    var dataStart = 0;
    var descriptionPath = path.join(tempPath, 'description.json');
    var stream = fs.createReadStream(filePath);
    stream.pipe(tar.extract(tempPath));
    stream.on('end',function() {
        fs.readFile(descriptionPath, function(err, fileData) {         
             if( err ) throw err;
             initialInfo = JSON.parse(fileData);
             return event.sender.send('description-finished', initialInfo);        
        });
    });
});
}

function unzipFile(event,fileName,startTime, endTime) {
    var dataZipPath = path.join(tempPath, fileName + '.zip');
    var stream = fs.createReadStream(dataZipPath) ;
    stream.pipe(unzip.Extract({ path: tempPath }));
    stream.on('end', function() {
        setTimeout(function() { loadingData(event,fileName,startTime,endTime,0)  }, 5);
               
    });
}

//loading map data function
function loadingData(event,fileName, startTime, endTime,timeDirection) {
    var dataPath = path.join(tempPath,fileName);
    var mapDb = [];
    var lastCoordinates = [[],[]];
    var dataStart = 0;
    var lineReader = require('readline').createInterface({
           input: require('fs').createReadStream(dataPath , { encoding: 'utf8' })
    });

    lineReader.on('line', function (line) {
        dataStart = line.indexOf("{");
        var result = line.substr(0, dataStart - 1).split(' ');
        if ((timeDirection != 0) && (result[2] == "PROBE_NODE_COORDINATE")) {               
            var name = 'Node' + result[1];
            var data = JSON.parse( line.substr(dataStart) );
            var pos = [data.lat,data.lon] ;
            var nodeNum = lastCoordinates[0].indexOf(name);
            if ( nodeNum == -1 ) {
               lastCoordinates[0].push(name);
               lastCoordinates[1].push(pos);  
            }
        }
        if (result[0] >= startTime) {
            var mapDbObject = {};
            mapDbObject['time'] = result[0];
            mapDbObject['node'] = 'Node' + result[1];
            mapDbObject['module'] = result[2];
            mapDbObject['data'] = JSON.parse( line.substr(dataStart) );     
            mapDb.push(mapDbObject);
        }                                
        if (result[0] > endTime) {
            lineReader.close();  
        }                            
    });

    lineReader.on('close', function () {
        if (mapDb.length > 0)
            return event.sender.send('chunk-ready',mapDb,lastCoordinates,timeDirection) ;  
    });
}
//Unzipping a node file and sending the first block of data
function unzipNodeFile(event,fileName,startEventsTime,endEventsTime,interfaceGap) {
    var dataZipPath = path.join(tempPath, fileName + '.zip');
    var stream = fs.createReadStream(dataZipPath) ;
    stream.pipe(unzip.Extract({ path: tempPath }));
    stream.on('end', function() {
      setTimeout(function() {  loadingEventsData(event,fileName,startEventsTime,endEventsTime,interfaceGap,0)  },10);      
    });
}
//loading events data function
function loadingEventsData(event,fileName,startEventsTime,endEventsTime,interfaceGap,timeDirection) {
    var dataPath = path.join(tempPath,fileName);
    var dataEvents = [];
    var lastLayersTimesPos = {'layer0' : [0,0],'layer1' :[0,0],'layer2' :[0,0],'layer3' :[0,0],'layer4' :[0,0]};
    var lineReader = require('readline').createInterface({
           input: require('fs').createReadStream(dataPath , { encoding: 'utf8' })
    });

    lineReader.on('line', function (line) {
        var dataStart = line.indexOf('"Node"');
        var result = line.substr(0, dataStart - 1).split(' ');

        if (result[0] >= startEventsTime) {
            var data = JSON.parse( '{ "time" : ' + result[0] + ',' + line.substr(dataStart) );
            var layer = 'layer' + data['layer'] ;
            var pos = lastLayersTimesPos[layer][1] ;
            if (data['duration'] < interfaceGap * 1000000000){
                data['duration'] = interfaceGap * 1000000000 ; 
            } 
            if (( result[0] < lastLayersTimesPos[layer][0] ) && (pos != 0)){
                dataEvents[pos]['duration'] = (data['time'] + data['duration'] / 1000000000 - dataEvents[pos]['time']) * 1000000000 ;
                dataEvents[pos]['color'] = '#E82546' ;
                lastLayersTimesPos[layer][0] =  dataEvents[pos]['time'] + dataEvents[pos]['duration'] / 1000000000 ;
                lastLayersTimesPos[layer][1] =  pos ; 
            }else {
                lastLayersTimesPos[layer][0] =  data['time'] + data['duration'] / 1000000000  ;
                lastLayersTimesPos[layer][1] =  dataEvents.length ; 
                dataEvents.push(data);
            }
        }                                
        if (result[0] > endEventsTime) {
            lineReader.close();  
        }                            
    });

    lineReader.on('close', function () {
    return event.sender.send('events-data-loaded',dataEvents,timeDirection) ;   
    });
}

function rmDir(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            } else {
                rmDir(filePath);
            }
        }
    }
    //TODO: fixme:
    //delete temp directory here, problems with non-empty-directory
    //setTimeout(function() {fs.rmdirSync(dirPath)}, 100);
};