let jsts = require('jsts');
var ExtraTableFunctions = require('./shared/extraTableFunctions');
var EconomySummaryComponent = require('./economysummary');
var DHPTableHeader = require('./tableHeader');

var SocioeconomicTableComponent = require('../../detailhandelsportalen/browser/SocioeconomicTableComponent');
var ForbrugTable = require('../../detailhandelsportalen/commonFunctions/forbrugTable')


class IsochroneDataContainer extends ExtraTableFunctions{
    constructor(parentLayer, isochroneData, title, reactId, settings){
        super();
        this.parentLayer = parentLayer;
        this.settings = settings;
        var reader = new jsts.io.GeoJSONReader();
        
        this.jstsObject = reader.read(isochroneData);
        this.layer = L.geoJSON(isochroneData, {onEachFeature: this.onEachFeature, style: this.style()});
        this.range = isochroneData.properties.value;

        this.title = title;
        
        this.data = null;
        //this.getTableDataForbrug();
        this.addToMap();

        this.reactContainers = {
            reactId: reactId,
            tabHeader: ".dhp-tab-header ." + reactId,
            tabContent: ".dhp-tab-content ." + reactId
        };
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
                //console.log('GOT NEW DATA', e.features[0].properties)
                self.data = e.features[0].properties;
                self.getEconomyData("isochrone", "dhp", {catchment: self.jstsObject.geometry.toText()}).then(function(){
                    if(self.settings && self.settings.enabled){
                        self.addReactComponent();
                    }
                    if(self.reactContainers && self.reactContainers.reactId == 'dhp-isochrone0'){
                        
                        setTimeout(()=>{
                            //$('.dhp-tab-header > .nav-tabs .dhp-isochrone0 a').tab('show');
                            $('.dhp-isochrone0 a').click()
                        }, 1000)
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
                <DHPTableHeader title={this.title} id={this.reactContainers.reactId} />,
                document.querySelector(this.reactContainers.tabHeader)
            )
        }catch(err){
            console.log(err)
        }

        //console.log('detailMarker.js IsochroneDataContainer',this.economyData, this.sortedEconomyData, this.data)
        //console.log('this.data.features', this.data)
        try {
            let socioeconomySum = this.sumEconomyValues(this.economyData.features);
            //static data
            let houseInSum = {
                ant_hus_indk1_: 0,
                ant_hus_indk2_: 0,
                ant_hus_indk3_: 0,
                ant_hus_indk4_: 0,
                ant_hus_indk5_: 0,
                ant_hus_indk9_: 0,
            }
            //assign true values from socioeconomy to static data;
            Object.keys(houseInSum).forEach((key) => {
                houseInSum[key] = socioeconomySum[key];
            });

            let householdData = null;
            
            if(Object.keys(socioeconomySum).length > 0 && socioeconomySum.husinksum > 0){

                let difference = (socioeconomySum.hussum - socioeconomySum.husinksum) + socioeconomySum.ant_hus_indk9_;
                let difference_percentage =  parseFloat(((difference / socioeconomySum.hussum)* 100).toFixed(1));

                householdData = {
                    husinksum: socioeconomySum.husinksum,
                    diff: difference,
                    diff_percent: difference_percentage
                }
                //console.log('changing household data', householdData)
            }

            // console.log({economyData: this.economyData, sortedEconomyData: this.sortedEconomyData, data: this.data, houseInSum: houseInSum})

            ReactDOM.render(
                <div>
                    <DHPColorPicker changeOpacity={this.changeOpacity.bind(this)} toggle={this.toggle.bind(this)} changeColor={this.changeColor.bind(this)}  />
                    <ForbrugTable houseInSum={houseInSum} householdDifference={householdData} reactId={this.reactContainers.reactId}></ForbrugTable>
                    <EconomySummaryComponent economy={this.economyData} calculatedEconomy={this.sortedEconomyData} data={this.data}/>
                    {this.economyData.length > 0 ? 'Ingen ekonomi data' : <SocioeconomicTableComponent economy={socioeconomySum} />}
                </div>,
                document.querySelector(this.reactContainers.tabContent)
            );
        } catch (e) {
            console.log(e);
        }
    }

    style(){
        return {
            fillColor: '#00aaFF',
            color: "#00aaFF",
            weight: 1,
            opacity: 0.3,
            fillOpacity: "0.1"
        };
    }
    
    onEachFeature(feature, layer){
        layer._vidi_type = "query_result";
    }
}

module.exports = IsochroneDataContainer;
