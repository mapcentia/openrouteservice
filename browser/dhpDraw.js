var ExtraTableFunctions = require('./shared/extraTableFunctions');
var SocioeconomicTableComponent = require('../../detailhandelsportalen/browser/SocioeconomicTableComponent');
var NameComponent = require('./Polygon/nameComponent');
var DHPColorPicker = require('./shared/dhpColorPicker');

var ForbrugTable = require('../../detailhandelsportalen/commonFunctions/forbrugTable');

class DetailDrawPolygon extends ExtraTableFunctions{
    constructor(map, drawLayer, settings){
        super()
        this.title = 'Tegnet opland';
        //settings
        this.settings = settings;
        this.enabled = false;
        if(this.settings.enabled){
            this.enabled = true;
            //this.settings.polygonLayer.addTo(this.layer);
        }
        this.polygonStyleSettings = {
            selectedOpacity: 0.4,
            deselectedOpacity: 0.2,
            selectedColor: "red",
            deselectedColor: '#3388ff'
        }
        this.id = settings.id;
        this.komkode = null;
        this.parentLayer = drawLayer;
        this.userLevel = settings.userLevel ? settings.userLevel : 0;
        this.addDHPLayer(this.settings.polygon);
        this.updateName("Tegnet opland");
        this.addNameComponent();
    }

    addNameComponent(){
        try{
            ReactDOM.unmountComponentAtNode(document.querySelector('.drawn-name-content'));
        }catch(err){
            console.log('Error mounting name component', err);
        }

        ReactDOM.render(
            <NameComponent id={this.id} name={this.name} komkode={this.komkode} updateName={this.updateName.bind(this)}/>,
            document.querySelector('.drawn-name-content')
        )
    }

    updateName(name){
        try{
            this.layer.feature.properties.name = name;
        }catch(err){
            console.log(err);
        };
        this.name = name;
    }

    addDHPLayer(polygon){
        var tempLayer = L.geoJSON(polygon, {style:this.enabled? this.selectedStyle(): this.deselectedStyle()});
        
        this.addNonGroupLayers(tempLayer, this.parentLayer);
        this.updatePolygon();
    }
    updatePolygon(){
        var reader = new jsts.io.GeoJSONReader();
        this.jstsObject = reader.read(this.layer.toGeoJSON());

        this.getTableDataForbrug().done(() => {
            //console.log('DONE!', this.data, this.economyData, this.sortedEconomyData);
        }).then(() => {
            this.getKomKode(this.jstsObject.geometry.toText());
        })
    }

    addNonGroupLayers(sourceLayer, targetGroup) {
        var self = this;
        if (sourceLayer instanceof L.LayerGroup) {
            sourceLayer.eachLayer(function(layer) {
                self.addNonGroupLayers(layer, targetGroup);
            });
        } else {
            sourceLayer.options.editing = {};
            this.onGeometryClick(sourceLayer);
            sourceLayer.dhpLayer = true;
            self.layer = sourceLayer;
            sourceLayer._vidi_type = "query_result";
            targetGroup.addLayer(sourceLayer);
        }
    }

    removePolygon(){
        this.layer.removeFrom(this.parentLayer);
        this.layer.remove();
    }

    deletePolygon(){
        this.removePolygon();
        window.DHPDrawnPolygonArray.forEach((polygon, index) => {
            if(polygon.id == this.id){
                window.DHPDrawnPolygonArray.splice(index, 1);
            }
        });
        window.DHPSnapshotData.drawn.forEach((polygon, index) => {
            if(polygon.id == this.id){
                window.DHPSnapshotData.drawn.splice(index, 1);
            }
        });

        if(this.enabled){
            this.removeReactComponent();
        }
    }

    onSelect(){
        //Deselect all
        DHPDrawnPolygonArray.forEach((layer, index) => {
            layer.onDeselect();
        });

        //Enable current selection
        this.enabled = true;
        this.layer.setStyle(this.selectedStyle());

        //Mount react components
        this.addNameComponent();
        this.addReactComponent();

        //click on container to show data
        if(!$('a[href="#openrouteservice-content"]').parent().hasClass("active")){
            $('a[href="#openrouteservice-content"]').trigger('click');
        }

        setTimeout(() => {
            $('#dhp-drawnPolygon-tab').trigger('click');
        }, 500)


        
    }
    onDeselect(){
        this.enabled = false;
        this.layer.setStyle(this.deselectedStyle());
    }
    //https://leafletjs.com/reference-1.6.0.html#path
        selectedStyle(){
        return{
            stroke: true,
			color: this.polygonStyleSettings.selectedColor,
			weight: 4,
            opacity: 0.5,
			fill: true,
			fillOpacity: this.polygonStyleSettings.selectedOpacity
        }
    }

    deselectedStyle(){
        return{
            stroke: true,
			color: this.polygonStyleSettings.deselectedColor,
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillOpacity: this.polygonStyleSettings.deselectedOpacity
        }
    }

    removeReactComponent(){
        ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-drawnPolygon'));
        ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-drawnPolygon'));
    }

    addReactComponent(){
        class DrawnTableHeader extends React.Component{
            constructor(props){
                super(props)
            }
            render(){
                return(
                    <a className="nav-link" id={this.props.id + '-tab'} data-toggle="tab" href={'#'+this.props.id} role="tab">
                        {this.props.title}
                    </a>
                )
            }
        }

        try{
            ReactDOM.render(
                <DrawnTableHeader title={"Tegnet Opland"} id={"dhp-drawnPolygon"} />,
                document.querySelector(".dhp-drawnPolygon")
            )
        }catch(err){
            console.log(err)
        }

        try {
            //Calculate socioeconomy values
            let socioeconomySum = this.sumEconomyValues(this.economyData.features);
            console.log('socioeconomy!', socioeconomySum);
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
                let difference_percentage =  ((difference / socioeconomySum.hussum)* 100).toFixed(1);
                householdData = {
                    husinksum: socioeconomySum.husinksum,
                    diff: difference,
                    diff_percent: difference_percentage
                }
            }
            /*
                HH_diff = (hussum  - husinksum) +  economy.ant_hus_indk9_
                HH_diff_percent = HH_diff / hussum
                Spendings_max = ( 32787 + 4055 + 9365 ) * HH_diff
                spending_min =( 91277 + 27073 + 63804 ) *HH_diff
            */

            console.log({economyData: this.economyData, sortedEconomyData: this.sortedEconomyData, data: this.data, houseInSum: houseInSum})

            //let houseInSum = socioeconomySum.filter()

            ReactDOM.render(
                <React.Fragment>
                    <DHPColorPicker changeOpacity={this.changeOpacity.bind(this)} toggle={this.toggle.bind(this)} changeColor={this.changeColor.bind(this)} polygon={true}  />
                    <ForbrugTable houseInSum={houseInSum} householdDifference={householdData}></ForbrugTable>
                    <EconomySummaryComponent economy={this.economyData} calculatedEconomy={this.sortedEconomyData} data={this.data} />
                    {this.economyData.length > 0 ? 'Ingen socioøkonomisk data' : <SocioeconomicTableComponent economy={socioeconomySum} />}

                </React.Fragment>,
                document.querySelector("#dhp-drawnPolygon")
            );
        } catch (e) {
            console.log(e);
        }
    }

    findDuplicateOverlaps(overlap){
        let intersectionDifference = [];

        overlap.forEach((element, index) =>{
            var polyElement = element;
            let geojson = polyElement.geometry;
            overlap.forEach((cElement, cIndex) => {
                var cPolyElement = cElement;
                let cGeojson = cPolyElement.geometry;
                
                if(index != cIndex && turf.intersect(geojson, cGeojson)){
                    intersectionDifference.push(turf.intersect(geojson, cGeojson));
                    intersectionDifference.push(turf.difference(geojson, cGeojson));
                }
            })
        });
        
        console.log('intersectionDifference',intersectionDifference)
        return intersectionDifference;
    }

    splitMultipolygon(features){
        let polygonCollection = [];
        features.forEach((e, i) => {
            if(e.geometry.type == 'MultiPolygon'){
                let unkinkedPolygon = turf.unkinkPolygon(e.geometry);
                console.log(polygonCollection.push(...unkinkedPolygon.features));
            }else{
                polygonCollection.push(e);
            }
        })
        return polygonCollection;
    }

    calculateIntersectsOLD(type){
        //combine all layers into single variable and FILTER OUT CURRENT LAYER FROM SELECTION
        var remainingLayers = [...window.DHPDrawnPolygonArray].filter((value, index) => { return value.id != this.id;}).map((value) => {return value.layer.toGeoJSON()});
        console.log({'remainingLayers': remainingLayers})
        var intersections = [];

        remainingLayers.forEach((layer, index) => {
            let calculatedIntersection = null;
            if(type == 'drawn'){
                let targetLayer = this.layer.toGeoJSON().geometry;
                let selectedLayer = layer.geometry;
                calculatedIntersection = turf.intersect(targetLayer, selectedLayer);
            }
            if(calculatedIntersection != null){
                intersections.push(calculatedIntersection)       
            }
        });
        console.log('intersections',intersections)
        
        /*var geoms = this.splitMultipolygon(intersections);
        if(intersections.length > 1){
            geoms = this.findDuplicateOverlaps(geoms);
        }*/

        window.intersectionArray = [...intersections];

        console.log(intersections);

        //this.clearIntersectionArray();
        /*
        var intersectionDifference = [];

        intersections.forEach((e, i) => {
            if(e.geometry.type == 'MultiPolygon'){
                let test = turf.unkinkPolygon(e.geometry);
                intersections.splice(i,1);
                console.log(intersections.push(...test.features));
                
            }
        })
        
        intersections.forEach((element, index) =>{
            var polyElement = element;
            let geojson = polyElement.geometry;
            intersections.forEach((cElement, cIndex) => {
                var cPolyElement = cElement;
                let cGeojson = cPolyElement.geometry;
                
                if(index != cIndex && turf.intersect(geojson, cGeojson)){
                    intersectionDifference.push(turf.intersect(geojson, cGeojson));
                    intersectionDifference.push(turf.difference(geojson, cGeojson));
                }
            })
        });
        */
        //if no intersections OR difference are found, then set intersections as intersectionDifference
        
        //use unkinkpolygon to split each polygon


        //force update react component when intersection object updates
        window.IntersectTree.updateData(intersections);
        $('a[href="#dhp-intersection-content"]').click();
    }
    clearIntersectionArray(){
        if(typeof window.uniqueGeometry != 'undefined' &&  window.uniqueGeometry.length > 0){
            window.uniqueGeometry.forEach(e => {
                e.layer.remove();
            })
            window.uniqueGeometry = [];
        }
    }

    calculateIntersects(type){
        //combine all layers into single variable and FILTER OUT CURRENT LAYER FROM SELECTION
        var remainingLayers = [...window.DHPDrawnPolygonArray].filter((value, index) => { return value.id != this.id;}).map((value) => {return value.layer.toGeoJSON()});
        var intersections = [];

        remainingLayers.forEach((layer, index) => {
            let calculatedIntersection = null;
            if(type == 'drawn'){
                let targetLayer = this.layer.toGeoJSON().geometry;
                let selectedLayer = layer.geometry;
                calculatedIntersection = turf.intersect(targetLayer, selectedLayer);
            }
            if(calculatedIntersection != null){
                calculatedIntersection.properties.selectedLayer = {id: this.id, name: this.name};
                calculatedIntersection.properties.targetLayer = {...layer.properties};
                console.log('calculatedIntersection',calculatedIntersection)
                intersections.push(calculatedIntersection)       
            }
        });
        
        if(intersections.length == 0){
            alert("Fejl opstod. Ingen overlap fundet, prøv igen");
            return;
        }

        window.intersectionArray = [...intersections];
        //force update react component when intersection object updates
        window.IntersectTree.updateData(intersections);
        $('a[href="#dhp-intersection-content"]').trigger("click");
    }

    onGeometryClick(layer){
        var self = this;
        layer.on('click', function(currentLayer) {
            self.onSelect()
        });
        layer.bindPopup(function(){
            var toggleIsoGroup = L.DomUtil.create('div', 'btn-group btn-group-justified btn-group-raised')

            var idContainer = L.DomUtil.create("div");
            idContainer.innerHTML = ` Navn: ${self.name} (${self.id})`;

            var popupAddProperties = L.DomUtil.create("button", "dhp-show-tablecontent");
            popupAddProperties.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            popupAddProperties.innerText = "Vis data";
            popupAddProperties.onclick = function(){
                self.onSelect();
            }

            var popupRemoveMarker = L.DomUtil.create("button", "dhp-remove-marker");
            popupRemoveMarker.classList.add("btn", "btn-default", "btn-raised", "btn-xs");
            popupRemoveMarker.innerText = "Fjern tegnet opland";
            popupRemoveMarker.onclick = function(){
                self.deletePolygon();
            }

            var intersectButton = L.DomUtil.create("button", "dhp-intersect-button");
            intersectButton.classList.add("btn", "btn-success", "btn-raised", "btn-xs");
            intersectButton.innerText = "Beregn overlap";
            intersectButton.onclick = function(){
                self.calculateIntersects('drawn');
            }
            
            var container = L.DomUtil.create("div", "dhp-popup-container");
            container.appendChild(idContainer);
            //container.appendChild(popupAddProperties);
            if(window.DHPDrawnPolygonArray.length > 1 && self.userLevel == 3){
                container.appendChild(L.DomUtil.create('br'));
                container.appendChild(intersectButton); 
            }
            container.appendChild(L.DomUtil.create('br'));
            container.appendChild(popupRemoveMarker);

            return container;
        });

        //layer.bindTooltip(this.id, {permanent: true, direction:"center"});
    }

    

    getTableDataForbrug(){
        if(!$('a[href="#detailhandel-content"]').parent().hasClass("active")){
            $('a[href="#detailhandel-content"]').trigger("click");
        }
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
                    if(self.settings && self.settings.enabled){
                        self.addReactComponent();
                        setTimeout(() => {
                            $('#dhp-drawnPolygon-tab').click();
                        }, 500)
                    }
                });
            },
            error: function(e){
                console.log('Isochrone Ajax failed', e)
            }
        })
    }
}


module.exports = DetailDrawPolygon;
