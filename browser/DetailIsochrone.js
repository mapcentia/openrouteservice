var GeneralSettingsComponent = require('./generalSettingsComponent');
var IsochroneDataContainer = require('./IsochroneData');

class DetailIsochrone{
    constructor(parentLayer, settings){
        //console.log('outerscope!', utils)
        this.parentLayer = parentLayer;
        this.isochrone = {isochrone1: {}, isochrone2: {}};
        this.settings = settings;
        this.updateIsochrone();
    }
    
    updateIsochrone(){
        this.addReactComponent();
        //this.settings.prettyMode = this.translateMode(this.ORSSettings.mode);
        return this.getOpenRouteServiceData(this.openRouteServiceSettings());
    }

    updateSettings = (newSettings) => {
        //console.log('updating isochrone',newSettings)
        window.DHPSnapshotData.markers.forEach((e, i) => {
            if(e.id == this.settings.id){
                e.ORSSettings =  newSettings
            }
        })
        this.settings.ORSSettings = newSettings;
        
        this.updateIsochrone().then(() => {
            this.isochrone.isochrone1.getTableDataForbrug().then(() => {
                this.isochrone.isochrone2.getTableDataForbrug();
            })
        });
    }

    activate(){ 
        this.addReactComponent();
        if(this.isochrone.isochrone1){
            this.isochrone.isochrone1.activate(); 
        }

        if(this.isochrone.isochrone2){
            this.isochrone.isochrone2.activate();
        }
        
    }

    addReactComponent(){
        try {
            ReactDOM.render(
                <GeneralSettingsComponent orsSettings={this.settings.ORSSettings} updateSettings={this.updateSettings} />, document.getElementById("openrouteservice-settings")
            );
        } catch (e) {
            console.log(e);
        }
    }

    getOpenRouteServiceData(data){
        //Remove older layers
        this.remove();

        console.log('getOpenRouteServiceData(data):',data)
        
        var self = this;
        return $.ajax({
            url:'/api/extension/cowiDetail/OpenRouteServiceIsochrone',
            method:'POST',
            data: data,
            error: function(e){
                console.log('Could not get isochrone', e)
            },
            success: function(data){

                console.log('got isochrone data: ',data);

                /* Place isochrone range data into objects along with JSTS object to be able to easily create sql string */
                var iso1title = self.settings.ORSSettings.min/60 +' min '+ self.translateMode(self.settings.ORSSettings.mode)
                var iso2title = self.settings.ORSSettings.max/60 +' min '+ self.translateMode(self.settings.ORSSettings.mode);

                 console.log('detailMarker.js, getOpenRouteServiceData GETTING DATA', self.settings, iso1title, iso2title)

                self.isochrone.isochrone1 = new IsochroneDataContainer(self.parentLayer, data.features[0], iso1title, 'dhp-isochrone0', self.settings);
                self.isochrone.isochrone2 = new IsochroneDataContainer(self.parentLayer, data.features[1], iso2title, 'dhp-isochrone1', self.settings);
                
                console.log('got isochrone data: ',data);
            }
        })
    }

    remove(){
        if(Object.keys(this.isochrone.isochrone1).length > 0){
            //console.log("%c Removing isochrone",
            //"color:red;font-family:system-ui;font-size:4rem;-webkit-text-stroke: 1px black;font-weight:bold");
            this.isochrone.isochrone1.layer.remove();
            this.isochrone.isochrone1 = {};
            this.isochrone.isochrone2.layer.remove();
            this.isochrone.isochrone2 = {};
        }
    }

    openRouteServiceSettings(){
        //console.log('this.settings.markerPosition', this.settings.markerLayer)
        var p = {
            x: this.settings.markerPosition.lng,
            y: this.settings.markerPosition.lat
        };
    
        var data = {
            "attributes":["area","reachfactor","total_pop"],
            "location_type": "start",
            "locations": [[p.x,p.y]],
            "profile": this.settings.ORSSettings.mode,
            "range": [this.settings.ORSSettings.max, this.settings.ORSSettings.min],
            "interval":0,
            "range_type": "time",
            "area_units":"km"
        }
        return data;
    }

    translateMode(mode){
        var result;
        switch (mode) {
            case "driving-car":
                result = "kørsel"
                break;
            case "cycling-regular":
                result = "cykeltid"
                break;
            case "foot-walking":
                result = "gangtid"
                break;
            default:
                result = "kørsel"
                break;
        }
        return result;
    }
}
module.exports = DetailIsochrone;