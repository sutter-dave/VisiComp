/** This class manages the user interface for a workspace object. */
apogeeapp.app.WorkspaceUI = function() {

    this.workspace = null;
	
    //properties
	this.app = null;
    this.tabFrame = null;
    this.tree = null;
    this.treeEntry = null;
    this.componentMap = {};
    this.libraryManager = new apogeeapp.app.LibraryUI();
   
    this.jsLinkArray = [];
    this.cssLinkArray = [];
}

apogeeapp.app.WorkspaceUI.MAIN_WORKSPACE_NAME = "main workspace";

apogeeapp.app.WorkspaceUI.ICON_RES_PATH = "/genericIcon.png";

//====================================
// Workspace Management
//====================================

/** This sets the application. It must be done before the workspace is set. */
apogeeapp.app.WorkspaceUI.prototype.setApp = function(app,tabFrame,treePane) {
    this.app = app;
    this.tabFrame = tabFrame;
    this.tree = new apogeeapp.ui.treecontrol.TreeControl();
    apogeeapp.ui.removeAllChildren(treePane);
    treePane.appendChild(this.tree.getElement());
    
    this.treeEntry = null;
}

/** This gets the application instance. */
apogeeapp.app.WorkspaceUI.prototype.getApp = function() {
    return this.app;
}

 /** This method sets the workspace. The argument componentsJson should be included
  * if the workspace is not empty, such as when opening a existing workspace. It
  * contains the data for the component associated with each workspace member. For 
  * a new empty workspace the componentsJson should be omitted. */
apogeeapp.app.WorkspaceUI.prototype.setWorkspace = function(workspace, componentsJson) {   
    this.workspace = workspace; 
    
    //set up the root folder
    var rootFolder = this.workspace.getRoot();
    if(!componentsJson) {
        componentsJson = apogeeapp.app.FolderComponent.EMPTY_FOLDER_COMPONENT_JSON;
    }
    var rootFolderComponent = this.loadComponentFromJson(rootFolder,componentsJson);

    //set up the tree
    this.treeEntry = this.createTreeEntry();
    this.tree.setRootEntry(this.treeEntry);
    this.treeEntry.addChild("library",this.libraryManager.getTreeEntry());
    this.treeEntry.addChild("rootFolder",rootFolderComponent.getTreeEntry());
    
    //add listeners
    this.workspace.addListener(apogee.updatemember.MEMBER_UPDATED_EVENT, member => this.memberUpdated(member));
    this.workspace.addListener(apogee.deletemember.MEMBER_DELETED_EVENT, member => this.childDeleted(member));
    this.workspace.addListener(apogee.updateworkspace.WORKSPACE_UPDATED_EVENT, () => this.workspaceUpdated());
}

/** This method gets the workspace object. */
apogeeapp.app.WorkspaceUI.prototype.getWorkspace = function() {
    return this.workspace;
}

apogeeapp.app.WorkspaceUI.prototype.getTabFrame = function() {
    return this.tabFrame;
}


/** This method gets the workspace object. */
apogeeapp.app.WorkspaceUI.prototype.close = function() {
    //delete all the components - to make sure the are cleaned up
    for(var key in this.componentMap) {
        var componentInfo = this.componentMap[key];
        if((componentInfo)&&(componentInfo.component)&&(!componentInfo.componentMember)) {
            componentInfo.component.onDelete();
        }
    }
    
    //TREE_ENTRY - remove tree entry
    this.tree.clearRootEntry();
    
    //remove links
    this.setLinks([],[]);
}


//====================================
// Component Management
//====================================

/** This method gets the component associated with a member object. */
apogeeapp.app.WorkspaceUI.prototype.getComponent = function(member) {
	var componentInfo = this.componentMap[member.getId()];
	if(componentInfo) {
		return componentInfo.component;
	}
	else {
		return null;
	}
}

/** This method gets the component associated with a member object. */
apogeeapp.app.WorkspaceUI.prototype.getComponentById = function(memberId) {
	var componentInfo = this.componentMap[memberId];
	if(componentInfo) {
		return componentInfo.component;
	}
	else {
		return null;
	}
}

/** This returns the map of folder objects. */
apogeeapp.app.WorkspaceUI.prototype.getFolders = function() {
    var folders = {}
    for(var key in this.componentMap) {
		var componentInfo = this.componentMap[key];
        var member = componentInfo.member;
        if(member.isParent) { 
            folders[member.getFullName()] = member;
        }
    }
    return folders;
}

/** This method registers a member data object and its associated component object.
 * If the member is not the main member assoicated with component but instead an included
 * member, the main componentMember should be passed in also. Otherwise it should be left 
 * undefined. */
apogeeapp.app.WorkspaceUI.prototype.registerMember = function(member,component,mainComponentMember) {
    
    //make sure this is for us
    if(member.getWorkspace() !== this.workspace) {
        throw apogee.base.createError("Component registered in wrong workspace: " + member.getFullName());
    }
    
    //store the ui object
	var memberId = member.getId();
	
	if(this.componentMap[memberId]) {
		//already exists! (we need to catch this earlier if we want it to not be fatal. But we should catch it here too.)
        throw apogee.base.createError("There is already a member with the given ID.",true);
	}
	
    var componentInfo = {};
    componentInfo.member = member;
	componentInfo.component = component;
    if(mainComponentMember) componentInfo.componentMember = mainComponentMember;
	
    this.componentMap[memberId] = componentInfo;
    
}
	

/** This method responds to a member updated. */
apogeeapp.app.WorkspaceUI.prototype.memberUpdated = function(member) {
    //store the ui object
	var key = member.getId();
    
	var componentInfo = this.componentMap[key];
	if((componentInfo)&&(componentInfo.component)) {
        componentInfo.component.memberUpdated();
    }
}

/** This method responds to a "new" menu event. */
apogeeapp.app.WorkspaceUI.prototype.childDeleted = function(member) {
	
	//store the ui object
	var memberId = member.getId();
	
	var componentInfo = this.componentMap[memberId];
	delete this.componentMap[memberId];

	if((componentInfo)&&(componentInfo.component)) {
        //do any needed cleanup
        componentInfo.component.onDelete();
	}
}

/** This method extends the member udpated function from the base.
 * @protected */    
apogeeapp.app.WorkspaceUI.prototype.workspaceUpdated = function() {
    
    //update name
    this.treeEntry.setLabel(this.workspace.getName());

    
    //get the banner info
//    var workspace = this.getWorkspace();
//    if(workspace.hasError()) {
//        var errorMsg = "";
//        var actionErrors = workspace.getErrors();
//        for(var i = 0; i < actionErrors.length; i++) {
//            errorMsg += actionErrors[i].msg + "\n";
//        }
//        
//        this.bannerState = apogeeapp.app.WindowHeaderManager.BANNER_TYPE_ERROR;
//        this.bannerMessage = errorMsg;
//    }
//    else {   
//        this.bannerState = apogeeapp.app.WindowHeaderManager.BANNER_TYPE_NONE;
//        this.bannerMessage = null;
//    }
    
    
//    this.treeDisplay.setBannerState(this.bannerState,this.bannerMessage);
}

//====================================
// open and save methods
//====================================

/** This saves the workspace. It the optionalSavedRootFolder is passed in,
 * it will save a workspace with that as the root folder. */
apogeeapp.app.WorkspaceUI.prototype.toJson = function(optionalSavedRootFolder) {
    var json = {};
    json.fileType = "apogee js web workspace";
    
    json.version = "0.3";
    
    json.jsLinks = this.jsLinkArray;
    json.cssLinks = this.cssLinkArray;
    
    json.workspace = this.workspace.toJson(optionalSavedRootFolder);
    
    var rootFolder;
    if(optionalSavedRootFolder) {
        rootFolder = optionalSavedRootFolder;
    }
    else {
        rootFolder = this.workspace.getRoot();
    }
    
    var rootFolderComponent = this.getComponent(rootFolder);
    json.components = rootFolderComponent.toJson();
    
    if(this.tabFrame) {
        var activeTabId = this.tabFrame.getActiveTab();
        if(activeTabId) {
            json.activeTabMember = this.getMemberNameFromId(activeTabId);
        }
    }
    
    return json;
}

/** This is used in saving the active tab 
 * @private */
apogeeapp.app.WorkspaceUI.prototype.getMemberNameFromId = function(activeTabId) {
    var component = this.getComponentById(activeTabId);
    if(component) {
        var member = component.getMember();
        if(member) {
            return member.getFullName();
        }
    }
    return undefined;
}

apogeeapp.app.WorkspaceUI.prototype.getFolderComponentContentJson = function(folder) {
    var json = {};
    var tableMap = folder.getChildMap();
	for(var key in tableMap) {
		var child = tableMap[key];
        
		//get the object map for the workspace
		var childComponent = this.getComponent(child);
		
		//get the component for this child
		var name = child.getName();
		json[name] = childComponent.toJson();
	}
    return json;
}

apogeeapp.app.WorkspaceUI.prototype.loadComponentFromJson = function(member,json) {
    var componentType = json.type;
    var generator = this.app.getComponentGenerator(componentType);
	if(generator) {
        return apogeeapp.app.Component.createComponentFromMember(generator,this,member,json);
    }
    else {
        throw apogee.base.createError("Component type not found: " + componentType);
    }
}

apogeeapp.app.WorkspaceUI.prototype.loadFolderComponentContentFromJson = function(folder,json) {
	for(var key in json) {
		var childJson = json[key];
		var childMember = folder.lookupChild(key);	
		this.loadComponentFromJson(childMember,childJson);
	}
}


//====================================
// properties and display
//====================================

apogeeapp.app.WorkspaceUI.prototype.createTreeEntry = function() {
    //menu item callback
    var labelText = this.workspace.getName(); //add the name
    var iconUrl = this.getIconUrl();
    var menuItemCallback = () => this.getMenuItems();
    var isRoot = true;
    return new apogeeapp.ui.treecontrol.TreeEntry(labelText, iconUrl, null, menuItemCallback,isRoot);
}

/** This method returns the icon url for the component. */
apogeeapp.app.WorkspaceUI.prototype.getIconUrl = function() {
    return apogeeapp.ui.getResourcePath(apogeeapp.app.WorkspaceUI.ICON_RES_PATH);
}

apogeeapp.app.WorkspaceUI.prototype.getMenuItems = function() {
    //menu items
    var menuItemList = [];

    //add the standard entries
    var itemInfo = {};
    itemInfo.title = "Edit Properties";
    itemInfo.callback = apogeeapp.app.updateworkspace.getUpdateWorkspaceCallback(this);
    menuItemList.push(itemInfo);
    
    return menuItemList;
}

//========================================
// Links
//========================================

apogeeapp.app.WorkspaceUI.prototype.setLinks = function(jsLinkArray,cssLinkArray) {
    return this.libraryManager.openLinks(jsLinkArray,cssLinkArray);
}
    