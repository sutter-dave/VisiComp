/** Editor that uses the Ace text editor.
 * 
 * @param {type} viewMode - the apogee view mode
 * @param {type} callbacks - {getData,getEditOk,setData}; format for data is text
 * @param {type} aceMode - the display format, such as "ace/mode/json"
 */
apogeeapp.app.AceTextEditor = class extends apogeeapp.app.EditorDataDisplay {
    
    constructor(viewMode,callbacks,aceMode) {
        super(viewMode,callbacks,apogeeapp.app.EditorDataDisplay.NON_SCROLLING);
        
        var containerDiv = this.getElement();

        this.editorDiv = apogeeapp.ui.createElement("div",null,{
            "position":"absolute",
            "top":"0px",
            "left":"0px",
            "bottom":"0px",
            "right":"0px",
            "overflow":"auto"
        });
        containerDiv.appendChild(this.editorDiv);

        this.workingData = null;

        var editor = ace.edit(this.editorDiv);
        editor.renderer.setShowGutter(true);
        editor.setReadOnly(true);
        editor.setTheme("ace/theme/eclipse"); //good
        editor.getSession().setMode(aceMode); 
        editor.$blockScrolling = Infinity;
        this.editor = editor;

        //add click handle to enter edit mode
        containerDiv.addEventListener("click",() => this.onTriggerEditMode());
    }

    getEditorData() {
        return this.editor.getSession().getValue();
    }
    
    setEditorData(text) {
        this.editor.getSession().setValue(text);

        //set the background color
        if(this.editOk) {
            this.editorDiv.style.backgroundColor = "";
        }
        else {
            this.editorDiv.style.backgroundColor = apogeeapp.app.EditWindowComponentDisplay.NO_EDIT_BACKGROUND_COLOR;
        }
    }
    
    onLoad() {
        if(this.editor) this.editor.resize();
    }

    onResize() {
        if(this.editor) this.editor.resize();
    }

    destroy() {
        if(this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
    }
    
    endEditMode() {
        this.editor.setReadOnly(true);
        super.endEditMode();
    }
    
    startEditMode() {
        super.startEditMode();
        this.editor.setReadOnly(false);
    }
}