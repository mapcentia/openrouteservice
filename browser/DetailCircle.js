var TabHeader = require('./tableHeader');
var ExtraTableFunctions = require('./shared/extraTableFunctions');
var DHPColorPicker = require('./shared/dhpColorPicker');
import {BufferAdjustor} from './Marker/BufferAdjustorComponent';
var SocioeconomicTableComponent = require('../../detailhandelsportalen/browser/SocioeconomicTableComponent');
var ForbrugTable = require('../../detailhandelsportalen/commonFunctions/forbrugTable');
var EconomySummaryComponent = require('./economysummary');
var reproject = require('reproject');

class DetailCircle extends ExtraTableFunctions{
    constructor(parentLayer, marker, radius, reactId, settings){
        super()
        this.parentLayer = parentLayer;
        
        this.layer = new L.GeoJSON(null, {
            "color": "#ff7800",
            "weight": 1,
            "opacity": 1,
            "fillOpacity": 0.1,
            "dashArray": '5,3'
        });
        
        this.settings = settings;
        this.createCircle(marker, radius);
        this.addToMap();
        this.reactContainers = {
            reactId: reactId,
            tabHeader: ".dhp-tab-header ." + reactId,
            tabContent: ".dhp-tab-content ." + reactId
        };
    }

    createCircle(marker, radius){
        if(!typeof this.pointBufferCircle == 'undefined'){
            this.layer.remove();
            this.layer = new L.GeoJSON(null, {
                "color": "#ff7800",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });   
        }

        var crss = {
            "proj": "+proj=utm +zone=" + "32" + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
            "unproj": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
        };
        this.radius = radius;
        this.marker = marker;

        var reader = new jsts.io.GeoJSONReader();
        var writer = new jsts.io.GeoJSONWriter();
        this.pointJsts = reader.read(reproject.reproject(this.marker.toGeoJSON(), "unproj", "proj", crss));
        this.pointBufferCircle = reproject.reproject(writer.write(this.pointJsts.geometry.buffer(radius)), "proj", "unproj", crss);
        this.bufferJsts = reader.read(this.pointBufferCircle);

        this.layer.addData(this.pointBufferCircle);
        this.layer.eachLayer((e) => {
            e._vidi_type = 'query_draw';
        })
        //this.updateData();
    }

    getTableDataForbrug(){
        var self = this;
        var db = "dhp";
        var data = {
            catchment: this.jstsObject.geometry.toText()
        }
        //console.log(this.jstsObject.geometry.toText());
        return $.ajax({
            method: "POST",
            url: `/api/extension/detailhandel/isochrone/${db}`,
            data: {
                    q: data,
                    srs: 4326,
                    lifetime: 0,
                    client_encoding: "UTF8",
                    key: null
            },
            success: function(e){
                self.data = e.features[0].properties;
                self.getEconomyData("isochrone", "dhp", {catchment: self.jstsObject.geometry.toText()}).then(function(){
                    console.log('settings.enabled', self.settings.enabled)
                    if(self.settings && self.settings.enabled){
                        self.addReactComponent();
                    }
                });
            },
            error: function(e){
                console.log('Isochrone Ajax failed', e)
            }
        })
    }

    updateData(){
        var self = this;
        var geometry = {
            catchment: this.bufferJsts.toText()
        };

        var db = "dhp"
        return $.ajax({
            method: "POST",
            url: `/api/extension/detailhandel/isochrone/${db}`,
            data: {
                    q: geometry,
                    srs: 4326,
                    lifetime: 0,
                    client_encoding: "UTF8",
                    key: null
            },
            success: function(e){
                self.data = e.features[0].properties;
                self.getEconomyData("buffer", "dhp", geometry).then(() => {
                    //console.log('.settings.enabled', self.settings)
                    if(self.settings && self.settings.enabled){
                        self.addReactComponent();
                    }
                });
            },
            error: function(e){
                console.log('Isochrone Ajax failed', e)
            }
        })        
    }

    addReactComponent(){      
        try{
            ReactDOM.render(
                <TabHeader title={"Buffer " + this.radius +"m"} id={this.reactContainers.reactId} />,
                document.querySelector(this.reactContainers.tabHeader)
            )
        }catch(err){
            console.log(err)
        }

        //console.log('detailmarker.js, detailCircle',this.economyData, this.sortedEconomyData, this.data)

        try {
            let socioeconomySum = this.sortedEconomyData;
            //static data
            let houseInSum = {
                ant_hus_in: 0,
                ant_hus__1: 0,
                ant_hus__2: 0,
                ant_hus__3: 0,
                ant_hus__4: 0,
                ant_hus__5: 0,
            }
            //assign true values from socioeconomy to static data;
            Object.keys(houseInSum).forEach((key) => {
                houseInSum[key] = socioeconomySum[key];
            });

            let householdData = null;
            
            if(Object.keys(socioeconomySum).length > 0 && socioeconomySum.husinksum > 0){
                let difference = (socioeconomySum.hussum - socioeconomySum.husinksum) + socioeconomySum.ant_hus__5;
                let difference_percentage = ((difference / socioeconomySum.hussum)* 100).toFixed(1);
                householdData = {
                    husinksum: socioeconomySum.husinksum,
                    diff: difference,
                    diff_percent: difference_percentage
                }
            }

            console.log({economyData: this.economyData, sortedEconomyData: this.sortedEconomyData, data: this.data, houseInSum: houseInSum})
            console.log('hussum sortedEconomyData', this.sortedEconomyData.hussum, )

            ReactDOM.render(
                <React.Fragment>
                    {/* <BufferAdjustor></BufferAdjustor> */}
                    <DHPColorPicker changeOpacity={this.changeOpacity.bind(this)} toggle={this.toggle.bind(this)} changeColor={this.changeColor.bind(this)}  />
                    <ForbrugTable houseInSum={houseInSum} householdDifference={householdData}></ForbrugTable>
                    <EconomySummaryComponent economy={this.economyData} calculatedEconomy={this.sortedEconomyData} data={this.data} />
                    {this.economyData.length > 0 ? 'Ingen ekonomi data' : <SocioeconomicTableComponent economy={socioeconomySum} />}
                </React.Fragment>,
                document.querySelector(this.reactContainers.tabContent)
            );
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = DetailCircle;
