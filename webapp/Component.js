jQuery.sap.declare("hcm.myleaverequest.hcmmyleaverequestExtension.Component");
// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "hcm.myleaverequest",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on cloud
	url: jQuery.sap.getModulePath("hcm.myleaverequest.hcmmyleaverequestExtension") + "/parent" // we use a URL relative to our own component
		// extension application is deployed with customer namespace
});
this.hcm.myleaverequest.Component.extend("hcm.myleaverequest.hcmmyleaverequestExtension.Component", {
	metadata: {
		version: "1.0",
		config: {
			"sap.ca.i18Nconfigs": {
				"bundleName": "hcm.myleaverequest.hcmmyleaverequestExtension.i18n.i18n"
			}
		},
		customizing: {
			"sap.ui.viewExtensions": {},
			"sap.ui.viewReplacements": {
				"hcm.myleaverequest.view.S1": {
					"viewName": "hcm.myleaverequest.hcmmyleaverequestExtension.view.S1Custom",
					"type": "XML"
				}
			},
			"sap.ui.controllerExtensions": {
				"hcm.myleaverequest.view.S1": {
					"controllerName": "hcm.myleaverequest.hcmmyleaverequestExtension.view.S1Custom"
				}
			}
		}
	}
});