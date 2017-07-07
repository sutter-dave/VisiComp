/** This is a window frame component. IT is used the table window and the dialog.
 *
 * It can be minimized an maximized and dragged and resized with the mouse.  
 * 
 * options:
 * minimizable - allow content to be minimized. defaylt value: false
 * maximizable - allow content to be maximized. defaylt value: false
 * closable - display a close button. defalt value: false
 * resizable- allow resizing window with mouse. default vlue: false
 * movable - allow moving window with mouse. default value : false
 *
 * @class 
 */
apogeeapp.ui.WindowFrame = function(options) {
	
    //set the options
    if(!options) {
        options = {};
    }
    
    //base init
    apogee.EventManager.init.call(this);
	
    //variables
    this.parentContainer = null;
    this.parentElement = null;
    this.options = options;

    this.windowState = (options.initialState !== undefined) ? options.initialState : apogeeapp.ui.WINDOW_STATE_NORMAL; //minimize, normal, maximize
    
	//set default size values
	this.posInfo = {};
	this.posInfo.x = 0;
	this.posInfo.y = 0;
    this.sizeInfo = {};
	this.sizeInfo.width = apogeeapp.ui.WindowFrame.DEFAULT_WINDOW_WIDTH;
	this.sizeInfo.height = apogeeapp.ui.WindowFrame.DEFAULT_WINDOW_HEIGHT;
	
    this.isShowing = false;
	
    this.frame = null;
    this.titleCell = null;
    this.bodyCell = null;
    
    this.content = null;
    
    this.windowDragActive = false;
    this.moveOffsetX = null;
    this.moveOffsetX = null;
    //handlers we place on the parent during a move
    this.moveOnMouseMove = null;
    this.moveOnMouseLeave = null;
    this.moveOnMouseUp = null;
	
	this.resizeEastActive = false;
	this.resizeWestActive = false;
	this.resizeNorthActive = false;
	this.resizeSouthActive = false;
	this.resizeOffsetWidth = null;
	this.resizeOffsetHeight = null;
    //hanlders we place on the parent during a resize
	this.resizeOnMouseUp = null;
	this.resizeOnMouseMove = null;
	this.resizeOnMouseLeave = null;
	
	//these should be set to soemthing more meeaningful, like the minimum sensible width of the title bar
	this.minWidth = 0;
	this.minHeight = 0;
	
    //initialize
    this.initUI();
	
    //add the handler to move the active window to the front
    var instance = this;
	var frontHandler = function(e) {
        instance.parentContainer.bringToFront(instance);
    };
    var element = this.getElement();
	element.addEventListener("mousedown",frontHandler);
}

//add components to this class
apogee.base.mixin(apogeeapp.ui.WindowFrame,apogee.EventManager);

apogeeapp.ui.WindowFrame.RESIZE_LOCATION_SIZE = 10;

//constants for resizing
apogeeapp.ui.WindowFrame.RESIZE_TOLERANCE = 5;
apogeeapp.ui.WindowFrame.RESIZE_EAST = 1;
apogeeapp.ui.WindowFrame.RESIZE_WEST = 2;
apogeeapp.ui.WindowFrame.RESIZE_SOUTH = 4;
apogeeapp.ui.WindowFrame.RESIZE_NORTH = 8;
apogeeapp.ui.WindowFrame.RESIZE_NE = apogeeapp.ui.WindowFrame.RESIZE_NORTH + apogeeapp.ui.WindowFrame.RESIZE_EAST;
apogeeapp.ui.WindowFrame.RESIZE_NW = apogeeapp.ui.WindowFrame.RESIZE_NORTH + apogeeapp.ui.WindowFrame.RESIZE_WEST;
apogeeapp.ui.WindowFrame.RESIZE_SE = apogeeapp.ui.WindowFrame.RESIZE_SOUTH + apogeeapp.ui.WindowFrame.RESIZE_EAST;
apogeeapp.ui.WindowFrame.RESIZE_SW = apogeeapp.ui.WindowFrame.RESIZE_SOUTH + apogeeapp.ui.WindowFrame.RESIZE_WEST;

/** size must be speicifed for the window. If not these values are used. */
apogeeapp.ui.WindowFrame.DEFAULT_WINDOW_HEIGHT = 300;
apogeeapp.ui.WindowFrame.DEFAULT_WINDOW_WIDTH = 300;

apogeeapp.ui.WindowFrame.WINDOW_MINIMIZED = "minimized";
apogeeapp.ui.WindowFrame.WINDOW_RESTOREDED = "restored";
apogeeapp.ui.WindowFrame.WINDOW_MAXIMIZED = "maximized";

//====================================
// Public Methods
//====================================

//---------------------------
// WINDOW CONTAINER
//---------------------------

/** This method shows the window. */
apogeeapp.ui.WindowFrame.prototype.getTitle = function() {
    return this.title;
}

/** This method shows the window. */
apogeeapp.ui.WindowFrame.prototype.setTitle = function(title) {
    this.title = title;
    this.titleBarTitleElement.innerHTML = title;
}

/** This method shows the window. */
apogeeapp.ui.WindowFrame.prototype.createMenu = function(iconUrl) {
    if(!iconUrl) iconUrl = apogeeapp.ui.getResourcePath(apogeeapp.ui.MENU_IMAGE);
    this.menu = apogeeapp.ui.Menu.createMenuFromImage(iconUrl);
    var firstLeftElementChild = this.titleBarLeftElements.firstChild;
    if(firstLeftElementChild) {
        this.titleBarLeftElements.insertBefore(this.menu.getElement(),firstLeftElementChild);
    }
    else {
        this.titleBarLeftElements.appendChild(this.menu.getElement());
    }
    return this.menu;
}

/** This method shows the window. */
apogeeapp.ui.WindowFrame.prototype.getMenu = function() {
    return this.menu;
}

/** This sets the content for the window */
apogeeapp.ui.WindowFrame.prototype.setContent = function(contentElement) {
    apogeeapp.ui.removeAllChildren(this.bodyCell);
    this.bodyCell.appendChild(contentElement);
    this.content = contentElement;
}

apogeeapp.ui.WindowFrame.prototype.addTitleToolElement = function(element) {
    this.titleBarToolElement.appendChild(element);
}

apogeeapp.ui.WindowFrame.prototype.removeTitleToolElement = function(element) {
    this.titleBarToolElement.removeChild(element);
}




//---------------------------
// WINDOW CHILD
//---------------------------

/** This method returns the parent container for the window.*/
apogeeapp.ui.WindowFrame.prototype.getParent = function() {
    return this.parentContainer;
}

/** This method shows the window. */
apogeeapp.ui.WindowFrame.prototype.setParent = function(newParentContainer) {
    this.parentContainer = newParentContainer;
    this.parentElement = newParentContainer.getOuterElement();
    this.show();
}

/** This method shows the window. */
apogeeapp.ui.WindowFrame.prototype.show = function() {
    if(this.isShowing) return;
    if(!this.parentContainer) return;
    
    //add window to the parent
    this.parentContainer.addWindow(this);

    this.isShowing = true;

    //we will redo this since the size of elements used in calculation may have been wrong
    if(this.sizeInfo.height !== undefined) {
        this.updateCoordinates();
    }

}

/** This method closes the window. If the argument forceClose is not
 * set to true the "request_close" handler is called to check if
 * it is ok to close the window. */
apogeeapp.ui.WindowFrame.prototype.close = function(forceClose) {
    if(!this.parentContainer) return;
    
    if(this.isShowing) {
        if(!forceClose) {
            //make a close request
            var requestResponse = this.callHandler(apogeeapp.ui.REQUEST_CLOSE,this);
            if(requestResponse == apogeeapp.ui.DENY_CLOSE) {
                //do not close the window
                return;
            }
        }
        
        this.parentContainer.removeWindow(this);
        this.isShowing = false;
        
        this.dispatchEvent(apogeeapp.ui.CLOSE_EVENT,this);
    }
}

/** This method returns true if the window is showing. */
apogeeapp.ui.WindowFrame.prototype.getIsShowing = function() {
    return this.isShowing;
}

/** This method returns true if the window is showing. */
apogeeapp.ui.WindowFrame.prototype.getContentIsShowing = function() {
    return (this.isShowing)&&(this.windowState != apogeeapp.ui.WINDOW_STATE_MINIMIZED);
}

/** This method sets the position of the window frame in the parent. */
apogeeapp.ui.WindowFrame.prototype.setPosition = function(x,y) {
	//don't let window be placed at a negative coord. We can lose it.
	if(x < 0) x = 0;
	if(y < 0) y = 0;
	this.posInfo.x = x;
	this.posInfo.y = y;
	
    this.updateCoordinates();
}

/** This method sets the size of the window frame, including the title bar. */
apogeeapp.ui.WindowFrame.prototype.setSize = function(width,height) {
    this.sizeInfo.width = width;
	this.sizeInfo.height = height;
    
    this.updateCoordinates();
}

/** This method gets the location and size info for the window. */
apogeeapp.ui.WindowFrame.prototype.getPosInfo = function() {
    return this.posInfo;
}

/** This method gets the location and size info for the window. */
apogeeapp.ui.WindowFrame.prototype.setPosInfo = function(posInfo) {
    this.posInfo = posInfo;
    this.updateCoordinates();
}

/** This method gets the location and size info for the window. */
apogeeapp.ui.WindowFrame.prototype.getSizeInfo = function() {
    return this.sizeInfo;
}

/** This method gets the location and size info for the window. */
apogeeapp.ui.WindowFrame.prototype.setSizeInfo = function(sizeInfo) {
    this.sizeInfo = sizeInfo;
    this.updateCoordinates();
}

/** This method sets the location and size info for the window at the same time. */
apogeeapp.ui.WindowFrame.prototype.setCoordinateInfo= function(posInfo,sizeInfo) {
    this.posInfo = posInfo;
    this.sizeInfo = sizeInfo;
    this.updateCoordinates();
}


/** This method sets the size of the window, including the title bar and other decorations. */
apogeeapp.ui.WindowFrame.prototype.setZIndex = function(zIndex) {
    this.frame.style.zIndex = String(zIndex);
}


//---------------------------
// GUI ELEMENT
//---------------------------

/** This method returns the main dom element for the window frame. */
apogeeapp.ui.WindowFrame.prototype.getElement = function() {
    return this.frame;
}



//----------------------------------------------------------------
//object specific

/** This method sets the size of the window to fit the content. It should only be 
 * called after the window has been shown. If this is used a scrolling frame should not be
 * used a the content. */
apogeeapp.ui.WindowFrame.prototype.fitToContent = function() {
	//figure out how big to make the frame to fit the content
    var viewWidth = this.bodyCell.offsetWidth;
    var viewHeight = this.bodyCell.offsetHeight;
    var contentWidth = this.content.offsetWidth;
    var contentHeight = this.content.offsetHeight;
	
	var targetWidth = this.sizeInfo.width + contentWidth - viewWidth + apogeeapp.ui.WindowFrame.FIT_WIDTH_BUFFER;
	var targetHeight = this.sizeInfo.height + contentHeight - viewHeight + apogeeapp.ui.WindowFrame.FIT_HEIGHT_BUFFER;
	
    this.setSize(targetWidth,targetHeight);
}

/** @private */
apogeeapp.ui.WindowFrame.FIT_HEIGHT_BUFFER = 20;
/** @private */
apogeeapp.ui.WindowFrame.FIT_WIDTH_BUFFER = 20;


/** This method centers the window in its parent. it should only be called
 *after the window is shown. */
apogeeapp.ui.WindowFrame.prototype.centerInParent = function() {
    var coords = this.parentContainer.getCenterOnPagePosition(this);
    this.setPosition(coords[0],coords[1]);
}


/** This method gets the location and size info for the window. */
apogeeapp.ui.WindowFrame.prototype.getWindowState = function() {
    return this.windowState;
}

/** This method sets the location and size info for the window. */
apogeeapp.ui.WindowFrame.prototype.setWindowState = function(windowState) {
    switch(windowState) {
        case apogeeapp.ui.WINDOW_STATE_NORMAL:
            this.restoreContent();
            break;
            
        case apogeeapp.ui.WINDOW_STATE_MINIMIZED:
            this.minimizeContent();
            break;
            
        case apogeeapp.ui.WINDOW_STATE_MAXIMIZED:
            this.maximizeContent();
            break;
            
        default:
            alert("Unknown window state: " + windowState);
            break;
    }
}

//====================================
// Motion/Reseize Event Handlers and functions
//====================================

/** Mouse down handler for moving the window. */
apogeeapp.ui.WindowFrame.prototype.moveMouseDown = function(e) {
    //do not do move in maximized state
    if(this.windowState === apogeeapp.ui.WINDOW_STATE_MAXIMIZED) return;
    
    if(this.parentElement) {
        this.windowDragActive = true;
        this.moveOffsetX = e.clientX - this.frame.offsetLeft;
        this.moveOffsetY = e.clientY - this.frame.offsetTop;
		
        //add move events to the parent, since the mouse can leave this element during a move
        this.parentElement.addEventListener("mousemove",this.moveOnMouseMove);
        this.parentElement.addEventListener("mouseleave",this.moveOnMouseLeave);
        this.parentElement.addEventListener("mouseup",this.moveOnMouseUp);
        
        //move start event would go here
    }
}

/** Mouse m,ove handler for moving the window. */
apogeeapp.ui.WindowFrame.prototype.moveMouseMoveImpl = function(e) {
    if(!this.windowDragActive) return;
	var newX = e.clientX - this.moveOffsetX;
	if(newX < 0) newX = 0;
	var newY = e.clientY - this.moveOffsetY;
	if(newY < 0) newY = 0;
    this.posInfo.x = newX;
    this.posInfo.y = newY;
    this.updateCoordinates();
}

/** Mouse up handler for moving the window. */
apogeeapp.ui.WindowFrame.prototype.moveMouseUpImpl = function(e) {
    this.endMove();
}

/** Mouse leave handler for moving the window. */
apogeeapp.ui.WindowFrame.prototype.moveMouseLeaveImpl = function(e) {
    this.endMove();
}

/** Mouse down handler for resizing the window. */
apogeeapp.ui.WindowFrame.prototype.resizeMouseDownImpl = function(e,resizeFlags) {
    //do not do resize in maximized state
    if(this.windowState === apogeeapp.ui.WINDOW_STATE_MAXIMIZED) return;

	if(resizeFlags) {
		if(resizeFlags & apogeeapp.ui.WindowFrame.RESIZE_EAST) {
			this.resizeEastActive = true;
			this.resizeOffsetWidth = e.clientX - this.frame.clientWidth;
		}
		else if(resizeFlags & apogeeapp.ui.WindowFrame.RESIZE_WEST) {
			this.resizeWestActive = true;
			this.resizeOffsetWidth = e.clientX + this.frame.clientWidth;
			this.moveOffsetX = e.clientX - this.frame.offsetLeft;
		}
		if(resizeFlags & apogeeapp.ui.WindowFrame.RESIZE_SOUTH) {
			this.resizeSouthActive = true;
			this.resizeOffsetHeight = e.clientY - this.frame.clientHeight;
		}
		else if(resizeFlags & apogeeapp.ui.WindowFrame.RESIZE_NORTH) {
			this.resizeNorthActive = true;
			this.resizeOffsetHeight = e.clientY + this.frame.clientHeight;
			this.moveOffsetY = e.clientY - this.frame.offsetTop;
		}

        //add resize events to the parent, since the mouse can leave this element during a move
		this.parentElement.addEventListener("mouseup",this.resizeOnMouseUp);
		this.parentElement.addEventListener("mousemove",this.resizeOnMouseMove);
        this.parentElement.addEventListener("mouseleave",this.resizeOnMouseLeave);
	}
}

/** Mouse move handler for resizing the window. */
apogeeapp.ui.WindowFrame.prototype.resizeMouseMoveImpl = function(e) {
    var newHeight;
    var newWidth;
    var newX;
    var newY;
    var changeMade = false;
    
	if(this.resizeEastActive) {
		newWidth = e.clientX - this.resizeOffsetWidth;
		if(newWidth < this.minWidth) return;
        this.sizeInfo.width = newWidth;
        changeMade = true;
	}
	else if(this.resizeWestActive) {
		newWidth = this.resizeOffsetWidth - e.clientX;
		if(newWidth < this.minWidth) return;
		newX = e.clientX - this.moveOffsetX;
		if(newX < 0) newX = 0;
        this.sizeInfo.width = newWidth;
        this.posInfo.x = newX;
        changeMade = true;
	}
	if(this.resizeSouthActive) {
		newHeight = e.clientY - this.resizeOffsetHeight;
		if(newHeight < this.minHeight) return;
		this.sizeInfo.height = newHeight;
        changeMade = true;
	}
	else if(this.resizeNorthActive) {
		newHeight = this.resizeOffsetHeight - e.clientY;
		if(newHeight < this.minHeight) return;
		newY = e.clientY - this.moveOffsetY;
		if(newY < 0) newY = 0;
		this.sizeInfo.height = newHeight;
		this.posInfo.y = newY;
        changeMade = true;
	}
        
    if(changeMade) {
        //update coordinates
        this.updateCoordinates();
    }
}

/** Mouse up handler for resizing the window. */
apogeeapp.ui.WindowFrame.prototype.resizeMouseUpImpl = function(e) {
    this.endResize();
}

/** Mouse up handler for resizing the window. */
apogeeapp.ui.WindowFrame.prototype.resizeMouseLeaveImpl = function(e) {
    this.endResize();
}


/** This method ends a move action. 
 * @private */
apogeeapp.ui.WindowFrame.prototype.endMove = function(e) {
    this.windowDragActive = false;
    this.parentElement.removeEventListener("mousemove",this.moveOnMouseMove);
    this.parentElement.removeEventListener("mouseup",this.moveOnMouseUp);
    this.parentElement.removeEventListener("mouseleave",this.moveOnMouseLeave);
}

/** this method ends a resize action.
 * @private */
apogeeapp.ui.WindowFrame.prototype.endResize = function() {
	this.resizeEastActive = false;
	this.resizeWestActive = false;
	this.resizeSouthActive = false;
	this.resizeNorthActive = false;
	this.parentElement.removeEventListener("mouseup",this.resizeOnMouseUp);
	this.parentElement.removeEventListener("mousemove",this.resizeOnMouseMove);
    this.parentElement.removeEventListener("mouseleave",this.resizeOnMouseLeave);
}

//====================================
//  Min/max Methods
//====================================

/** This is the minimize function for the window.*/
apogeeapp.ui.WindowFrame.prototype.minimizeContent = function() {
    
    //set body as hidden
    this.bodyCell.style.display = "none";
    
    var wasMinimized = (this.windowState === apogeeapp.ui.WINDOW_STATE_MINIMIZED);
    var wasMaximized = (this.windowState === apogeeapp.ui.WINDOW_STATE_MAXIMIZED);
 
    //set the window state
    this.windowState = apogeeapp.ui.WINDOW_STATE_MINIMIZED;
    this.updateCoordinates();
    this.setMinMaxButtons();
    
    //dispatch resize event
    if(!wasMinimized) this.dispatchEvent(apogeeapp.ui.WindowFrame.WINDOW_MINIMIZED,this);
}

/** This is the restore function for the window.*/
apogeeapp.ui.WindowFrame.prototype.restoreContent = function() {
    
    //set body as not hidden
    this.bodyCell.style.display = "";
    
    var wasMinimized = (this.windowState === apogeeapp.ui.WINDOW_STATE_MINIMIZED);
    var wasMaximized = (this.windowState === apogeeapp.ui.WINDOW_STATE_MAXIMIZED);
    
    //set the window state
    this.windowState = apogeeapp.ui.WINDOW_STATE_NORMAL;
    this.updateCoordinates();
    this.setMinMaxButtons();
    
    if(wasMinimized) this.dispatchEvent(apogeeapp.ui.WindowFrame.WINDOW_RESTOREDED,this);
}

/** This is the minimize function for the window.*/
apogeeapp.ui.WindowFrame.prototype.maximizeContent = function() {
    
    //set body as not hidden
    this.bodyCell.style.display = "";
    
    var wasMinimized = (this.windowState === apogeeapp.ui.WINDOW_STATE_MINIMIZED);
    
    //set the window state
    this.windowState = apogeeapp.ui.WINDOW_STATE_MAXIMIZED;
    this.updateCoordinates();
    this.setMinMaxButtons();
    
    if(wasMinimized) this.dispatchEvent(apogeeapp.ui.WindowFrame.WINDOW_MAXIMIZED,this);
}

/** @private */
apogeeapp.ui.WindowFrame.prototype.updateCoordinates = function() {
	
    if(this.windowState === apogeeapp.ui.WINDOW_STATE_MAXIMIZED) {
        //apply the maximized coordinates size
        this.frame.style.left = "0px";
		this.frame.style.top = "0px";
		this.frame.style.height = "100%";
		this.frame.style.width = "100%";
    }
    else if(this.windowState === apogeeapp.ui.WINDOW_STATE_NORMAL) {
        //apply the normal size to the window
		this.frame.style.left = this.posInfo.x + "px";
        this.frame.style.top = this.posInfo.y + "px";
		if(this.sizeInfo.height !== undefined) {
			this.frame.style.height = this.sizeInfo.height + "px";
		}
		else {
			this.frame.style.height = apogeeapp.ui.WindowFrame.DEFAULT_WINDOW_HEIGHT + "px";
		}
		if(this.sizeInfo.width !== undefined) {
			this.frame.style.width = this.sizeInfo.width + "px";
		}
		else {
			this.frame.style.width = apogeeapp.ui.WindowFrame.DEFAULT_WINDOW_WIDTH + "px";
		}
    }
    else if(this.windowState === apogeeapp.ui.WINDOW_STATE_MINIMIZED) {
        //apply the minimized size to the window
		this.frame.style.left = this.posInfo.x + "px";
        this.frame.style.top = this.posInfo.y + "px";
		
		this.frame.style.height = "0px";
		this.frame.style.width = "0px";
    }
}

//====================================
// Initialization Methods
//====================================

/** @private */
apogeeapp.ui.WindowFrame.prototype.initUI = function() {
    
    var table;
    var row;
    var cell;
    
    table = document.createElement("table");
    table.className = "visiui_win_main";
    this.frame = table; 
    
    //top border
    row = document.createElement("tr");
    table.appendChild(row);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_topLeft";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_WEST | apogeeapp.ui.WindowFrame.RESIZE_NORTH);
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_top";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_NORTH);  
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_topRight";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_EAST | apogeeapp.ui.WindowFrame.RESIZE_NORTH);  
    row.appendChild(cell);
    
    //title bar
    row = document.createElement("tr");
    table.appendChild(row);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_left";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_WEST); 
    cell.rowSpan = 2;
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass";
    this.titleBarCell = cell;
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_right";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_EAST); 
    cell.rowSpan = 2;
    row.appendChild(cell);
    
    //body
    row = document.createElement("tr");
    row.className = "visiui_win_bodyRow";
    table.appendChild(row);
    cell = document.createElement("td");
    cell.className = "visiui_win_bodyCell";
    this.bodyCell = cell;
    row.appendChild(cell);
    
    //bottom border
    row = document.createElement("tr");
    table.appendChild(row);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_bottomLeft";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_WEST | apogeeapp.ui.WindowFrame.RESIZE_SOUTH); 
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_bottom";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_SOUTH);  
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.className = "visiui_win_windowColorClass visiui_win_bottomRight";
    this.addResizeHandlers(cell,apogeeapp.ui.WindowFrame.RESIZE_EAST | apogeeapp.ui.WindowFrame.RESIZE_SOUTH);
    row.appendChild(cell);
 
    //create the title bar
    this.createTitleBar();
}

/** @private */
apogeeapp.ui.WindowFrame.prototype.addResizeHandlers = function(cell,flags) {
    //add handlers if the window is resizable
    if(this.options.resizable) {
        var instance = this;
        cell.onmousedown = function(event) {
            instance.resizeMouseDownImpl(event,flags);
        }
        
        //these are not cel specific. they are used on all cells and on the parent container
        //during a move.
        if(!this.resizeOnMouseMove) {
            this.resizeOnMouseMove = function(event) {
                instance.resizeMouseMoveImpl(event);
            };
            this.resizeOnMouseUp = function(event) {
                instance.resizeMouseUpImpl(event);
            };
            this.resizeOnMouseLeave = function(event) {
                instance.resizeMouseLeaveImpl(event);
            };
        }
    }
}

/** @private */
apogeeapp.ui.WindowFrame.prototype.createTitleBar = function() {
    
    this.titleBarElement = apogeeapp.ui.createElementWithClass("div","visiui_win_titleBarClass",this.titleBarCell);

    //add elements
    this.titleBarLeftElements = apogeeapp.ui.createElementWithClass("div","visiui_win_left_style",this.titleBarElement);
    this.titleBarMenuElement = apogeeapp.ui.createElementWithClass("div","visiui_win_menu_style",this.titleBarLeftElements);
    this.titleBarTitleElement = apogeeapp.ui.createElementWithClass("div","visiui_win_title",this.titleBarLeftElements);
    
    this.titleBarRightElements = apogeeapp.ui.createElementWithClass("div","visiui_win_right_style",this.titleBarElement);
    this.titleBarToolElement = apogeeapp.ui.createElementWithClass("div","visiui_win_tool_style",this.titleBarRightElements);

    //for handlers below
    var instance = this;
    
    //add window commands ( we will hide the bottons that are not needed)
    //minimize button
    if(this.options.minimizable) {
        this.minimizeButton = apogeeapp.ui.createElementWithClass("img","visiui_win_cmd_button",this.titleBarRightElements);
        this.minimizeButton.src = apogeeapp.ui.getResourcePath(apogeeapp.ui.MINIMIZE_CMD_IMAGE);
        this.minimizeButton.onclick = function() {
            instance.minimizeContent();
        }
    }
	
    //restore button - only if we cn minimize or maximize
    if(this.options.minimizable || this.options.maximizable) {	
        this.restoreButton = apogeeapp.ui.createElementWithClass("img","visiui_win_cmd_button",this.titleBarRightElements);
        this.restoreButton.src = apogeeapp.ui.getResourcePath(apogeeapp.ui.RESTORE_CMD_IMAGE);
        this.restoreButton.onclick = function() {
            instance.restoreContent();
        }
    }
    
    //maximize button and logic
    if(this.options.maximizable) {
        this.maximizeButton = apogeeapp.ui.createElementWithClass("img","visiui_win_cmd_button",this.titleBarRightElements);
        this.maximizeButton.src = apogeeapp.ui.getResourcePath(apogeeapp.ui.MAXIMIZE_CMD_IMAGE);
        this.maximizeButton.onclick = function() {
            instance.maximizeContent();
        }
    }
    
    //layout the window buttons
    this.windowState = apogeeapp.ui.WINDOW_STATE_NORMAL;
    this.setMinMaxButtons();
    
    //close button
    if(this.options.closable) {
        this.closeButton = apogeeapp.ui.createElementWithClass("img","visiui_win_cmd_button",this.titleBarRightElements);
        this.closeButton.src = apogeeapp.ui.getResourcePath(apogeeapp.ui.CLOSE_CMD_IMAGE);
        this.closeButton.onclick = function() {
            instance.close();
        }
    }
	
	//add am empty title
	this.setTitle("");
    
    //mouse move and resize
    if(this.options.movable) {
        //add mouse handlers for moving the window 
        this.titleBarElement.onmousedown = function(event) {
            instance.moveMouseDown(event);
        }

        //mouse window drag events we will place on the parent container - since the mouse drag 
        //may leave the window frame during the move
        this.moveOnMouseMove = function(event) {
            instance.moveMouseMoveImpl(event);
        };
        this.moveOnMouseUp = function(event) {
            instance.moveMouseUpImpl(event);
        }
        this.moveOnMouseLeave = function(event) {
            instance.moveMouseLeaveImpl(event);
        }
    }
    
//    //listen for cmd events from title bar
//    this.addListener("minimize_request",function() {
//        instance.minimizeContent();
//    });
//    this.addListener("maximize_request",function() {
//        instance.maximizeContent();
//    });
//    this.addListener("restore_request",function() {
//        instance.restoreContent();
//    });
}


/** This method shows the min/max/restore buttons properly 
 * @private */
apogeeapp.ui.WindowFrame.prototype.setMinMaxButtons = function() {
    if(this.minimizeButton) {
        if(this.windowState == apogeeapp.ui.WINDOW_STATE_MINIMIZED) {
            this.minimizeButton.style.display = "none";
        }
        else {
            this.minimizeButton.style.display = "";
        }
    }
    if(this.restoreButton) {
        if(this.windowState == apogeeapp.ui.WINDOW_STATE_NORMAL) {
            this.restoreButton.style.display = "none";
        }
        else {
            this.restoreButton.style.display = "";
        }
    }
    if(this.maximizeButton) {
        if(this.windowState == apogeeapp.ui.WINDOW_STATE_MAXIMIZED) {
            this.maximizeButton.style.display = "none";
        }
        else {
            this.maximizeButton.style.display = "";
        }
    }
}