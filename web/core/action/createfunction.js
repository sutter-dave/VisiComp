/** This namespace contains functions to process an create a function. */
visicomp.core.createfunction = {};

/** CREATE FUNCTION HANDLER
 * This handler should be called to request a function be created.
 * 
 * Event object format:  //future add other options
 * { 
 *	name: [string]
 *	package: [package]
 * }
 */
visicomp.core.createfunction.CREATE_FUNCTION_HANDLER = "createFunction";

/** FUNCTION CREATED EVENT
 * This listener event is fired when after a function is created, to be used to respond
 * to a new function such as to update the UI.
 * 
 * Event object Format:
 * [function]
 */
visicomp.core.createfunction.FUNCTION_CREATED_EVENT = "functionCreated";


/** This is the listener for the create function event. */
visicomp.core.createfunction.onCreateFunction = function(event) {
    //create functionObject
    var declarationName = event.name;
    var package = event.package;
    
    var nameLength = declarationName.indexOf("(");
    var name = declarationName.substr(0,nameLength);
    var argParens = declarationName.substr(nameLength);
    
    var functionObject = new visicomp.core.FunctionTable(name,argParens);
    package.addChild(functionObject);
	
    //initialize data
    functionObject.setData("");
	
    //dispatch event
    var eventManager = package.getWorkspace().getEventManager();
    eventManager.dispatchEvent(visicomp.core.createfunction.FUNCTION_CREATED_EVENT,functionObject);
	
    //return success
    return {
        "success":true
    };
}

/** This method subscribes to the udpate function handler event */
visicomp.core.createfunction.initHandler = function(eventManager) {
    eventManager.addHandler(visicomp.core.createfunction.CREATE_FUNCTION_HANDLER, 
            visicomp.core.createfunction.onCreateFunction);
}

