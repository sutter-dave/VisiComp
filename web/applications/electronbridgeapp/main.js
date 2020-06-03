const {app, BrowserWindow, protocol} = require('electron')
const path = require('path')
const url = require('url')

//====================================
//This source code is imported from the following link, to enable importing es modules from the local file system
// https://gist.github.com/smotaal/f1e6dbb5c0420bfd585874bd29f11c43

// Base path used to resolve modules
const base = app.getAppPath();

// Protocol will be "app://./…"
const scheme = 'app';

{ /* Protocol */
    // Registering must be done before app::ready fires
    // (Optional) Technically not a standard scheme but works as needed
    //protocol.registerStandardSchemes([scheme], { secure: true });
  
    // Create protocol
    require('./create-protocol')(scheme, base);
}
//=======================================

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800, 
        height: 600,
        webPreferences: {
            nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js")
        }
    })
    win.setMenu(null)
    
    // Open the DevTools.
   win.webContents.openDevTools() 

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'apogee.html'),
        protocol: 'file:',
        slashes: true
    }))  
  
    win.on('close',(e) => {
        const {dialog} = require('electron');
 
        var isDirtyPromise = win.webContents.executeJavaScript("getWorkspaceIsDirty()");
        isDirtyPromise.then( (isDirty) => {
            if(isDirty) {
				console.log("about to show dialog");
                var resultPromise = dialog.showMessageBox({
                    message: "There is unsaved data. Are you sure you want to exit?",
                    buttons: ["Exit","Stay"]
                });
                resultPromise.then( result => {
                    if(result.response == 0) win.destroy();
                })
            }
            else {
                win.destroy();
            }
        }).catch( (msg) => {
            //just detroy
            console.log("Error in close check. Exiting");
            win.destroy();
        })
        
        //we won't close here - we will use promise result above
        e.preventDefault();
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

