/** This is an text field element configurable element.
 * 
 * @class 
 */
apogeeapp.ui.PanelElement = class extends apogeeapp.ui.ConfigurableElement {
    constructor(form,elementInitData) {
        super(form,elementInitData,apogeeapp.ui.ConfigurableElement.CONTAINER_CLASS_NO_MARGIN);
        
        var containerElement = this.getElement();
        //update the container class
        containerElement.className = "apogee_configurablePanelPanelLine";
        
        var formInitData = elementInitData.formData;
        this.panel = new apogeeapp.ui.ConfigurablePanel();
        this.panel.configureForm(formInitData);
        var panelElement = this.panel.getElement();
        panelElement.className = "apogee_configurablePanelPanelLine";
        containerElement.appendChild(panelElement);  
        
        this._postInstantiateInit(elementInitData);
    }
    
    /** This method returns value for this given element, if applicable. If not applicable
     * this method returns undefined. */
    getValue() {
        return this.panel.getValue();
    }   

    /** This method updates the value for a given element. See the specific element
     * to see if this method is applicable. */
    setValue(value) {
        this.panel.setValue(value);
    }
    
    /** This will call the handler is this panel changes value. */
    addOnChange(onChange) {
        var childOnChange = (value,childForm) => {
            onChange(this.getValue(),this.getForm());
        }
        //add this to each element in the panel
        this.panel.getChildElements().forEach( elementObject => {if(elementObject.addOnChange) elementObject.addOnChange(onChange);} );
    }
    
    //===================================
    // internal Methods
    //==================================
    
    _setDisabled(isDisabled) { 
        this.panel.setDisabled(isDisabled);
    }
}

apogeeapp.ui.PanelElement.TYPE_NAME = "panel";

apogeeapp.ui.ConfigurablePanel.addConfigurableElement(apogeeapp.ui.PanelElement);
