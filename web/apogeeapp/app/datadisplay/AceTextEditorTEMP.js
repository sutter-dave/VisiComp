/**
 * THIS IS THE TEXT AREA EDITOR RENAMED ACE. I NEED TO USE THIS FOR DEVELOPMENT 
 * INSTEAD OF ACE CSEIN I HAVE SOME CSS ISUSUES THERE.
 */
apogeeapp.app.AceTextEditor = class extends  apogeeapp.app.DataDisplay {
    
    constructor(displayContainer,callbacks) {
        super(displayContainer,callbacks,apogeeapp.app.DataDisplay.SCROLLING);

        var textArea = apogeeapp.ui.createElement("TEXTAREA",null,{
            "position":"absolute",
            "top":"0px",
            "left":"0px",
            "bottom":"0px",
            "right":"0px",
//            "overflow":"auto"
//            "position":"relative",
//            "overflow":"auto"
        });
        this.textArea = textArea;

        this.workingData = null;

        //enter edit mode on change to the data
        this.textArea.addEventListener("input",() => this.checkStartEditMode());
    }
    
    getContent() {
        return this.textArea;
    }
    
    getContentType() {
        return apogeeapp.ui.RESIZABLE;
    }

    getData() {
        return this.textArea.value;
    }
    
    setData(text) {
        this.uneditedValue = text;
        this.textArea.value = text;

        //set the background color
        if(this.editOk) {
            this.textArea.style.backgroundColor = "";
            this.textArea.readOnly = false;
        }
        else {
            this.textArea.style.backgroundColor = apogeeapp.app.EditWindowComponentDisplay.NO_EDIT_BACKGROUND_COLOR;
            this.textArea.readOnly = true;
        }
    }
 
    endEditMode() {
        super.endEditMode();
    }
    
    startEditMode() {
        super.startEditMode();
    }
    
    checkStartEditMode() {
        if(!this.displayContainer.isInEditMode()) {
            if(this.getData() != this.uneditedValue) {
                this.onTriggerEditMode();
            }
        }
    }
}


