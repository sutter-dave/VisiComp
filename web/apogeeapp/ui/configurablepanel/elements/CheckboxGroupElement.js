/** This is an text field element configurable element.
 * 
 * @class 
 */
apogeeapp.ui.CheckboxGroupElement = class extends apogeeapp.ui.ConfigurableElement {
    constructor(form,elementInitData) {
        super(form,elementInitData);
        
        var containerElement = this.getElement();
        
        //label
        if(elementInitData.label) {
            this.labelElement = document.createElement("span");
            this.labelElement.className = "apogee_configurablePanelLabel";
            this.labelElement.innerHTML = elementInitData.label;
            containerElement.appendChild(this.labelElement);
            
            if(!elementInitData.horizontal) containerElement.appendChild(document.createElement("br"));
        }
        else {
            this.labelElement = null;
        }
        
        //check boxes
        this.checkboxList = [];
        var addCheckbox = checkboxInfo => {
            var checkbox = apogeeapp.ui.createElement("input");
            checkbox.type = "checkbox";
            
            var label;
            var value;
            if(apogee.util.getObjectType(checkboxInfo) == "Array") {
                label = checkboxInfo[0]
                value = checkboxInfo[1];     
            }
            else {
                label = checkboxInfo;
                value = checkboxInfo; 
            }
            checkbox.value = value;
            this.checkboxList.push(checkbox);
            containerElement.appendChild(checkbox);
            containerElement.appendChild(document.createTextNode(label));
            if(!elementInitData.horizontal) containerElement.appendChild(document.createElement("br"));
            
            if(elementInitData.disabled) checkbox.disabled = true;
        };
        elementInitData.entries.forEach(addCheckbox);   
        
        this._postInstantiateInit(elementInitData);
    }
    
    /** This method returns value for this given element, if applicable. If not applicable
     * this method returns undefined. */
    getValue() {
        return this.checkboxList.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
    }   

    /** This method updates the list of checked entries. */
    setValue(valueList) {
        this.checkboxList.forEach(checkbox => checkbox.checked = (valueList.indexOf(checkbox.value) >= 0));
    }
    
    /** This should be extended in elements to handle on change listeners. */
    addOnChange(onChange) {
        var onChangeImpl = () => {
            onChange(this.getForm(),this.getValue());
        }
        this.checkboxList.forEach(checkbox => checkbox.addEventListener("change",onChangeImpl));
    }
    
    //===================================
    // internal Methods
    //==================================
    
    _setDisabled(isDisabled) { 
        this.checkboxList.forEach(checkbox => checkbox.disabled = isDisabled);
    }
}

apogeeapp.ui.CheckboxGroupElement.TYPE_NAME = "checkboxGroup";

apogeeapp.ui.ConfigurablePanel.addConfigurableElement(apogeeapp.ui.CheckboxGroupElement);