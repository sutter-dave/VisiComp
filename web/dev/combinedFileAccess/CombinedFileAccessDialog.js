import {uiutil, dialogMgr}  from "/apogeeui/apogeeUiLib.js";

export default class CombinedAccessDialog {
    constructor(action,fileMetadata,fileData,sourceGeneratorList,onComplete) {
        this.action = action;
        this.initialFileMetadata = fileMetadata;
        this.fileData = fileData;
        this.sourceGeneratorList = sourceGeneratorList;
        this.onComplete = (errorMsg,result,fileMetadata) => {
            //close this dialog
            this.closeDialog();
            //call the base on complete
            onComplete(errorMsg,result,fileMetadata);
        }


        this.mainContainer = null;
        this.actionElement = null;
        this.selectListElement = null;
        this.selectedSourceCell = null;
        this.dialog = null;

        this.selectionElementMap = {};
        this.sourceList = [];
    }

    /** Only call this once! (per instance) */
    showDialog() {

        if(this.dialog) {
            alert("Show dialog shoudl only be called once on a given instance");
            return;
        }

        this._createLayout();
        this._populateLayout();

        this.dialog = dialogMgr.createDialog();
        this.dialog.setContent(this.mainContainer);
        dialogMgr.showDialog(this.dialog);
    }

    closeDialog() {
        //close dialog
        dialogMgr.closeDialog(this.dialog);
        //clean up all sources
        this.sourceList.forEach(source => source.close());

        //add other cleanup?
    }

    //===========================
    // Private Functions
    //===========================

    /** This method creates the main dom elements. */
    _createLayout() {
        this.mainContainer = document.createElement("table");
        this.mainContainer.className = "combinedFileAccess_mainContainer";
    
        let titleRow = document.createElement("tr");
        this.mainContainer.appendChild(titleRow);
        let sourceRow = document.createElement("tr");
        this.mainContainer.appendChild(sourceRow);
        let bodyRow = document.createElement("tr");
        this.mainContainer.appendChild(bodyRow);
    
        //title
        let title = (this.action == "save") ? "Save Workspace" : "Open Workspace";
        let dialogTitleElement = document.createElement("td");
        dialogTitleElement.colSpan = 2;
        dialogTitleElement.className = "combinedFileAccess_dialogTitleElement";
        dialogTitleElement.innerHTML = title;
        titleRow.appendChild(dialogTitleElement);
    
        //source selection title
        let selectTitleCell = document.createElement("td");
        selectTitleCell.className = "combinedFileAccess_selectTitleCell";
        selectTitleCell.innerHTML = "File Source:";
        sourceRow.appendChild(selectTitleCell);
    
        //selected source
        this.selectedSourceCell = document.createElement("td");
        this.selectedSourceCell.className = "combinedFileAccess_selectedSourceTitle";
        sourceRow.appendChild(this.selectedSourceCell);
    
        //body
        let selectListCell = document.createElement("td");
        selectListCell.className = "combinedFileAccess_sourceListCell";
        bodyRow.appendChild(selectListCell);
    
        this.selectListElement = document.createElement("div");
        this.selectListElement.className = "combinedFileAccess_selectList";
        selectListCell.appendChild(this.selectListElement);
    
        //action element
        this.actionElement = document.createElement("td");
        this.actionElement.className = "combinedFileAccess_actionElement";
        bodyRow.appendChild(this.actionElement);
    
    }

    /** This method populates the layout with the source specific data. */
    _populateLayout() {
        let initialActiveSource;

        //create the sources and elements
        this.sourceGeneratorList.forEach(sourceGenerator => {
            let source = sourceGenerator.getInstance(this.action,this.initialFileMetadata,this.fileData,this.onComplete);
            
            let sourceElement = this._getSelectionElement(source);
            this.selectListElement.appendChild(sourceElement);

            //save these objects for future use
            this.sourceList.push(source);
            this.selectionElementMap[sourceGenerator.getSourceId()] = sourceElement;
            if((this.initialFileMetadata)&&(this.initialFileMetadata.sourceId == sourceGenerator.getSourceId())) {
                initialActiveSource = source;
            }
        });

        //set an initial source
        if((!initialActiveSource)&&(this.sourceList.length > 0)) initialActiveSource = this.sourceList[0];
        if(initialActiveSource) this._selectSource(initialActiveSource);
    }

    /** This function sets of the source selection items */
    _getSelectionElement(source) {
        let wrapperElement = document.createElement("div");
        wrapperElement.className = "combinedFileAccess_selectionWrapper";

        let titleElement = document.createElement("div");
        titleElement.className = "combinedFileAccess_selectionTitleWrapper";

        let titleLabel = document.createElement("span");
        titleLabel.className = "combinedFileAccess_selectionTitle";
        titleLabel.innerHTML = source.getGenerator().getDisplayName();
        titleElement.appendChild(titleLabel);

        let iconUrl = source.getIconUrl();
        if(iconUrl) {
            let titleIcon = document.createElement("img");
            titleIcon.className = "combinedFileAccess_selectionIcon";
            titleElement.appendChild(titleIcon);
        }
        
        wrapperElement.appendChild(titleElement);
        wrapperElement.onclick = () => this._selectSource(source);

        let sourceConfigElement = source.getConfigElement();
        if(sourceConfigElement) {
            let configWrapperElement = document.createElement("div");
            configWrapperElement.className = "combinedFileAccess_selectionConfigWrapper";
            configWrapperElement.appendChild(sourceConfigElement);
            wrapperElement.appendChild(configWrapperElement);
        }

        return wrapperElement;
    }

    /** This function changes the active source */
    _selectSource(newActiveSource) {
        if(this.activeSource == newActiveSource) return;

        //old selection
        let oldActiveSource = this.activeSource;
        if(oldActiveSource) {
            let oldSelectionElement = this.selectionElementMap[oldActiveSource.getGenerator().getSourceId()];
            oldSelectionElement.classList.remove("combinedFileAccess_selectionWrapperActive");
            oldActiveSource.makeActive(false);
        }

        //new selection
        newActiveSource.makeActive(true);
        this.activeSource = newActiveSource;
        let newSelectionElement = this.selectionElementMap[newActiveSource.getGenerator().getSourceId()];
        newSelectionElement.classList.add("combinedFileAccess_selectionWrapperActive");

        uiutil.removeAllChildren(this.actionElement);
        this.actionElement.appendChild(newActiveSource.getActionElement());
        this.selectedSourceCell.innerHTML = newActiveSource.getGenerator().getDisplayName() + " File Source";
    }

}







