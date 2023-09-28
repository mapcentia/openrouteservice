var DARInfo = require('./AddressSearchComponent');
var DetailCircle = require('./DetailCircle');
var DetailIsochrone = require('./DetailIsochrone');
var turf = require('@turf/turf');

let DARRef = null;
var _self = null;

class DetailMarker{

    /**
     * 
     * @param {*} map 
     * @param {*} drawLayer 
     * @param { markerPosition: MARKER_LATLNG_OBJECT,
                drawMarkerLayer: MARKER_LAYER
            } settings 
     */

    constructor(map, drawLayer, settings){
        this.name = 'Butik';
        this.id = settings.id;
        this.drawLayer = drawLayer;
        this.map = map;
        this.layer = L.layerGroup();
        this.layer.dhpLayer = true;
        this.layer._vidi_type = 'query_draw';

        this.layer.addTo(this.map);
        this.userLevel = settings.userLevel ? settings.userLevel : 0;
        this.settings = settings;
        if(this.settings.enabled){
            this.enabled = true;
        }else{
            this.enabled = false;
        }

        this.updateMarker(settings);
        _self = this;
    }

    onSelect(){
        //re-enable react and add data
        this.enabled = true;
        this.markerSelected(true);
        this.isochrone.activate();
        this.circle1.activate();
        this.circle2.activate();
        this.addDAR();
        if(!$("a[data-module-id=openrouteservice]").parent().hasClass("active")){
            $("a[data-module-id=openrouteservice]").trigger('click');
        }
        setTimeout(() => {
            $('.dar-search-content').show();
            $('.dhp-isochrone0 a').trigger('click');
        }, 500);
    }

    addToMap(){
        this.layer.addTo(this.map);
    }

    removeFromMap(){
        this.layer.removeFrom(this.map);
    }

    addAllLayers(){
        console.log(this.isochrone.isochrone.isochrone1);
        this.isochrone.isochrone.isochrone1.addToMap();
        this.isochrone.isochrone.isochrone2.addToMap();
        this.circle1.addToMap();
        this.circle2.addToMap();
    }

    removeAllLayers(){
        if(this.isochrone.isochrone.isochrone2){
            this.isochrone.isochrone.isochrone1.removeFromMap();
            this.isochrone.isochrone.isochrone2.removeFromMap();
        }
        if(this.circle2){
            this.circle1.removeFromMap();
            this.circle2.removeFromMap();
        }
    }

    onDeselect(){
        this.enabled = false;
        this.markerSelected(false);
    }

    markerSelectedIcon(){
        return L.AwesomeMarkers.icon({
            icon: 'shopping-cart',
            markerColor: '#f04e23',
            prefix: 'fa'
        });
    }

    markerDeselectedIcon(){
        return L.AwesomeMarkers.icon({
            icon: 'shopping-cart',
            markerColor: 'blue',
            prefix: 'fa'
        });
    }

    markerSelected(selected){
        var selectedIcon = this.markerSelectedIcon();
        var deselectedIcon = this.markerDeselectedIcon();

        if(selected == true){
            this.settings.enabled = true;
            //Deselect all other icons
            this.map.eachLayer((layer) => {
                if(layer instanceof L.Marker && layer.dhptype == 'marker'){
                    layer.setIcon(deselectedIcon);
                }
            }) 
            this.marker.setIcon(selectedIcon);
        }else{
            this.settings.enabled = false;
            this.marker.setIcon(deselectedIcon);
        }
    }

    updateMarker(settings){
        if(this.marker != null){
            //Removes Isochrone and buffer only;
            this.removeIsoBuffer();
        }

        this.position = settings.markerPosition;
        if(this.marker == null){
            this.marker = this.createMarker(this.position, settings.id);
            this.drawLayer.addLayer(this.marker);
        }
        this.addDAR();

        this.isochrone = new DetailIsochrone(this.layer, settings);
        this.circle1 = new DetailCircle(this.layer, this.marker, 500, "dhp-buffer0", settings);
        this.circle2 = new DetailCircle(this.layer, this.marker, 1000, "dhp-buffer1", settings);

        this.getAllData();
    }

    getAllData() {
        return this.circle1.updateData().then(() => {
            this.circle2.updateData().then(() => {
                setTimeout(()=> { // Fixes race condition
                    this.isochrone.isochrone.isochrone1.getTableDataForbrug().then(() => {
                        this.isochrone.isochrone.isochrone2.getTableDataForbrug().then(() => {
                            DHPDrawnPolygonArray.forEach((e) => {
                                e.layer.bringToFront()
                            })
                        });
                    })
                }, 500);
            })
        });
    }

    updatePosition(){
        this.settings.markerPosition = this.marker._latlng;
        this.updateMarker(this.settings);
    }

    deleteMarker(){
        if(this.enabled){
            //Remove all react components
            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-isochrone0'));
            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-isochrone0'));
            
            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-isochrone1'));
            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-isochrone1'));

            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-buffer0'));
            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-buffer0'));

            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-buffer1'));
            ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-buffer1'));

            ReactDOM.unmountComponentAtNode(document.querySelector('.dar-search-content'));

            ReactDOM.unmountComponentAtNode(document.querySelector('.dar-search-content'));

            ReactDOM.unmountComponentAtNode(document.querySelector('#openrouteservice'));
        }

        this.removeMarker();
        
        window.DHPMarkerArray.forEach((marker, index) => {
            if(marker.id == this.id){
                window.DHPMarkerArray.splice(index, 1)
            }
        });
        
        window.DHPSnapshotData.markers.forEach((marker, index) => {
            if(marker.id == this.id){
                //remove this from array;
                window.DHPSnapshotData.markers.splice(index, 1);
            };
        });
        
    }
    changeName(newName){
        //console.log('new name got!', name);
        //console.log('thisname', this.name);
        _self.name = newName;
    }

    addDAR(){
        if(this.settings.enabled == true){
            ReactDOM.render(
                <DARInfo location={this.settings.markerPosition} userLevel={this.settings.userLevel} name={this.name} id={this.id} changeName={this.changeName} />,
                document.querySelector('.dar-search-content')
            )
        }
    }

    removeMarker(){
        //console.log('removeMarker data', {marker:this.marker, isochrone: this.isochrone, circle: {circle1: this.circle1, circle2: this.circle2}})
        this.removeIsoBuffer();
        if(this.marker != null){
            this.marker.remove();
            this.marker = null;
            this.position = null;
        }
    }
    removeIsoBuffer(){
        if(this.isochrone != null){
            this.isochrone.remove();
            this.isochrone = null;
        }
        if(this.circle1 != null && this.circle2 != null){
            this.circle1.layer.remove();
            this.circle1 = null;

            this.circle2.layer.remove();
            this.circle2 = null;
        }
    }

    //this whole function is rushed, I got fired and I have to figure this whole thing out, send help.
    calculateIntersects(type){
        //combine all layers into single variable and FILTER OUT CURRENT LAYER FROM SELECTION
        var combinedLayers = [...window.DHPMarkerArray].filter((value, index) => { return value.id != this.id;});
        var intersections = [];

        if(combinedLayers.length == 0){
            alert('Tilføj flere detailhandel')
            return;
        }
        combinedLayers.forEach((layer, index) => {
            if(layer instanceof DetailMarker){
                let calculatedIntersection = null;
                if(type == 'isochrone1'){
                    calculatedIntersection = turf.intersect(this.isochrone.isochrone.isochrone1.layer.toGeoJSON().features[0].geometry, layer.isochrone.isochrone.isochrone1.layer.toGeoJSON().features[0].geometry);
                    
                }else if(type == 'isochrone2'){
                    calculatedIntersection = turf.intersect(this.isochrone.isochrone.isochrone2.layer.toGeoJSON().features[0].geometry, layer.isochrone.isochrone.isochrone2.layer.toGeoJSON().features[0].geometry);
                }else if(type == 'buffer1'){
                    calculatedIntersection = turf.intersect(this.circle1.layer.toGeoJSON().features[0].geometry, layer.circle1.layer.toGeoJSON().features[0].geometry);

                }else if (type == 'buffer2'){
                    calculatedIntersection = turf.intersect(this.circle2.layer.toGeoJSON().features[0].geometry, layer.circle2.layer.toGeoJSON().features[0].geometry);
                }
                if(calculatedIntersection != null){
                 intersections.push(calculatedIntersection)       
                }

            }
            //move this to drawn polygon
            else if (layer instanceof DetailDrawPolygon){
                console.log('found drawn polygon!', layer)
                if(type == 'drawnpolygon'){
                    
                }
            }
        });
        console.log('intersections', intersections)
        //this.clearIntersectionArray();

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
            /*if(polyElement.geometry.type == 'MultiPolygon'){
                polyElement = turf.polygonize(element);
            }*/
            let geojson = polyElement.geometry;
            intersections.forEach((cElement, cIndex) => {
                var cPolyElement = cElement;
                /*if(cPolyElement.geometry.type == 'MultiPolygon'){
                    cPolyElement = turf.polygonize(cElement);
                }*/
                let cGeojson = cPolyElement.geometry;
                
                if(index != cIndex && turf.intersect(geojson, cGeojson)){
                    intersectionDifference.push(turf.intersect(geojson, cGeojson));
                    intersectionDifference.push(turf.difference(geojson, cGeojson));
                }
            })
        });
        //if no intersections OR difference are found, then set intersections as intersectionDifference
        if(intersectionDifference.length == 0){
            intersectionDifference = intersections;
        }
        //use unkinkpolygon to split each polygon

        window.uniqueGeometry = [];

        /*
        var polygonsOnly = []

        testy.forEach((e, i) => {
            if(e.geometry.type == 'MultiPolygon'){
                let test = turf.unkinkPolygon(e.geometry);
                console.log(polygonsOnly.push(...test.features));
            }else{
                polygonsOnly.push(e);
            }
        })

        console.log('polygons only!',polygonsOnly);

        var emptyList = [];
        emptyList.push(polygonsOnly[0])

        polygonsOnly.forEach((el, index) => {
            var res = emptyList.filter((el2, index2)=> {
                console.log({element1: el, element2: el2})
                if(typeof el2 == 'undefined'){
                    return false;
                }
                return !turf.booleanEqual(el.geometry, el2.geometry);
            })

            console.log('res',res);
            emptyList.push(...res);
        })

        console.log('empty list!', emptyList)
        */


        
        /*intersectionDifference.forEach((el, index) => {
            let intersectObj = {
                data: null,
                economyData: null,
                layer: L.geoJSON(findUniqueResult),
                enabled: true,
                map:this.map
            };

            if(uniqueGeometry.length == 0){
                uniqueGeometry.push(el);
            }else{
                var findUniqueResult = uniqueGeometry.find((el2, index2) => {
                        console.log('el2', {el2: el2, match: !turf.booleanEqual(el.geometry, el2.geometry)});
                        return !turf.booleanEqual(el.geometry, el2.geometry);
                })
                console.log('results', findUniqueResult)
                if(typeof findUniqueResult != 'undefined' && Object.keys(findUniqueResult).length > 0){
                    uniqueGeometry.push(el);
                }
            }
                //console.log('test',test);
        })*/

        if(intersections.length == 1){
            uniqueGeometry.push(intersections[0]);
        }

        console.log('uniqueGeometry', uniqueGeometry)

        //force update react component when intersection object updates
        window.IntersectTree.forceUpdate();
        console.log(uniqueGeometry);

    }
    clearIntersectionArray(){
        if(typeof window.uniqueGeometry != 'undefined' &&  window.uniqueGeometry.length > 0){
            window.uniqueGeometry.forEach(e => {
                e.layer.remove();
            })
            window.uniqueGeometry = [];
        }
    }

    createMarker(position, id){
        var self =  this;

        let marker = L.marker([position.lat, position.lng],{
            icon: this.settings.enabled ? this.markerSelectedIcon() : this.markerDeselectedIcon()
        }).on('click', function(layer){
            self.onSelect();
        }).bindPopup(function(){
            //Show data - Vis Data
            var popupAddProperties = L.DomUtil.create("button", "dhp-show-tablecontent");
            popupAddProperties.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            popupAddProperties.innerText = "VIS DATA";
            popupAddProperties.onclick = function(){
                self.onSelect();
            } 
            //Toggle ALL
            var toggleAll = L.DomUtil.create("button", "dhp-toggle-isochrone");
            toggleAll.classList.add("btn", "btn-secondary", "btn-raised", "btn-xs");
            toggleAll.innerHTML = "<i class='fa fa-eye'></i> Alle oplande";
            toggleAll.onclick = function(){
                if(self.isochrone.isochrone.isochrone1.parentLayer.hasLayer(self.isochrone.isochrone.isochrone1.layer)
                && self.isochrone.isochrone.isochrone2.parentLayer.hasLayer(self.isochrone.isochrone.isochrone2.layer)
                && self.circle1.parentLayer.hasLayer(self.circle1.layer)
                && self.circle2.parentLayer.hasLayer(self.circle2.layer)
                ){
                    self.isochrone.isochrone.isochrone1.layer.removeFrom(self.isochrone.isochrone.isochrone1.parentLayer);
                    self.isochrone.isochrone.isochrone2.layer.removeFrom(self.isochrone.isochrone.isochrone2.parentLayer);
                    self.circle1.layer.removeFrom(self.circle1.parentLayer);
                    self.circle2.layer.removeFrom(self.circle2.parentLayer);
                }else{
                    self.isochrone.isochrone.isochrone1.layer.addTo(self.isochrone.isochrone.isochrone1.parentLayer);
                    self.isochrone.isochrone.isochrone2.layer.addTo(self.isochrone.isochrone.isochrone2.parentLayer);
                    self.circle1.layer.addTo(self.circle1.parentLayer);
                    self.circle2.layer.addTo(self.circle2.parentLayer);
                }
            }
            //Toggle Isochrone 1
            var toggleIsochrone1 = L.DomUtil.create("button", "dhp-toggle-isochrone");
            toggleIsochrone1.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            toggleIsochrone1.innerHTML = "<i class='fa fa-eye'></i> Lokalt opland";
            toggleIsochrone1.onclick = function(){                
                if(self.isochrone.isochrone.isochrone1.parentLayer.hasLayer(self.isochrone.isochrone.isochrone1.layer)){
                    self.isochrone.isochrone.isochrone1.layer.removeFrom(self.isochrone.isochrone.isochrone1.parentLayer);
                }else{
                    self.isochrone.isochrone.isochrone1.layer.addTo(self.isochrone.isochrone.isochrone1.parentLayer);
                }
            }
            //Toggle Isochrone 2
            var toggleIsochrone2 = L.DomUtil.create("button", "dhp-toggle-isochrone");
            toggleIsochrone2.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            toggleIsochrone2.innerHTML = "<i class='fa fa-eye'></i> Regionalt opland";
            toggleIsochrone2.onclick = function(){                
                if(self.isochrone.isochrone.isochrone2.parentLayer.hasLayer(self.isochrone.isochrone.isochrone2.layer)){
                    self.isochrone.isochrone.isochrone2.layer.removeFrom(self.isochrone.isochrone.isochrone2.parentLayer);
                }else{
                    self.isochrone.isochrone.isochrone2.layer.addTo(self.isochrone.isochrone.isochrone2.parentLayer);
                }
            }
            ////Toggle buffer 1
            var toggleBuffer1 = L.DomUtil.create("button", "dhp-toggle-buffer");
            toggleBuffer1.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            toggleBuffer1.innerHTML = "<i class='fa fa-eye'></i> 500m buffer";
            toggleBuffer1.onclick = function(){
                if(self.circle1.parentLayer.hasLayer(self.circle1.layer)){
                    self.circle1.layer.removeFrom(self.circle1.parentLayer);
                }else{
                    self.circle1.layer.addTo(self.circle1.parentLayer);
                }
            }
            //Toggle buffer 2
            var toggleBuffer2 = L.DomUtil.create("button", "dhp-toggle-buffer");
            toggleBuffer2.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            toggleBuffer2.innerHTML = "<i class='fa fa-eye'></i> 1.000m buffer";
            toggleBuffer2.onclick = function(){
                if(self.circle2.parentLayer.hasLayer(self.circle2.layer)){
                    self.circle2.layer.removeFrom(self.circle2.parentLayer);
                }else{
                    self.circle2.layer.addTo(self.circle2.parentLayer);
                }
            }
            //Check intersections
            /*var intersectDropdown = L.DomUtil.create("select", "dhp-intersect-select form-control");
            intersectDropdown.classList.add("btn", "btn-primary", "btn-raised", "btn-xs");
            intersectDropdown.innerText = "Vis/skjul 1.000m buffer";
            intersectDropdown.onclick = function(){
                if(self.circle2.parentLayer.hasLayer(self.circle2.layer)){
                    self.circle2.layer.removeFrom(self.circle2.parentLayer);
                }else{
                    self.circle2.layer.addTo(self.circle2.parentLayer);
                }
            }

            intersectDropdown.innerHTML = `<option value="isochrone1">Lokal opland</option>
            <option value="isochrone2">Regional opland</option>
            <option value="buffer1">Buffer 500m</option>
            <option value="buffer2">Buffer 1000m</option>`;

            var intersectButton = L.DomUtil.create("button", "dhp-intersect-button");
            intersectButton.classList.add("btn", "btn-success", "btn-raised", "btn-xs");
            intersectButton.innerText = "Beregn overlap";
            intersectButton.onclick = function(){
                let value = $('.dhp-intersect-select').val();
                self.calculateIntersects(value);
            }*/
            //Remove Marker
            var popupRemoveMarker = L.DomUtil.create("button", "dhp-remove-marker");
            popupRemoveMarker.classList.add("btn", "btn-default", "btn-raised", "btn-xs");
            popupRemoveMarker.innerText = "Fjern butik";
            popupRemoveMarker.onclick = function(){
                self.removeMarker();
                self.deleteMarker();
            }
            
            var container = L.DomUtil.create("div", "dhp-popup-container");
            //Name
            /*var inputGroup = L.DomUtil.create('div', 'input-group');
            
            var nameContainer = L.DomUtil.create('input', "store-name-input form-control");
            nameContainer.value = self.name;

            var changeNameButton = L.DomUtil.create('button', "change-store-name btn btn-success btn-raised btn-sm");
            changeNameButton.innerHTML = `<i class="fa fa-floppy-o"></i>`
            changeNameButton.onclick = () => {
                self.name = $('.store-name-input').val();
                self.addDAR();
            }
            var changeNameButtonContainer = L.DomUtil.create('span', "input-group-btn");
            changeNameButtonContainer.appendChild(changeNameButton);

            inputGroup.appendChild(nameContainer);
            inputGroup.appendChild(changeNameButtonContainer);
            container.appendChild(inputGroup);
            container.appendChild(L.DomUtil.create('br'));*/
            //Title
            /*var containerTitle = L.DomUtil.create('DIV');
            containerTitle.innerHTML = 'Skift synlighed på oplande:'
            container.appendChild(containerTitle)
            container.appendChild(toggleAll)
            //container.appendChild(popupAddProperties);
            container.appendChild(L.DomUtil.create('br'));
            container.appendChild(toggleIsochrone1);
            container.appendChild(toggleIsochrone2);
            container.appendChild(L.DomUtil.create('br'));
            container.appendChild(toggleBuffer1);
            container.appendChild(toggleBuffer2);
            */
            /*if(window.DHPMarkerArray.length > 1){
                container.appendChild(L.DomUtil.create('br'));
                container.appendChild(intersectDropdown);
                container.appendChild(intersectButton);
            }*/
            container.appendChild(L.DomUtil.create('br'));
            container.appendChild(popupRemoveMarker);

            return container;
        });

        marker._vidi_type= "query_draw";
        marker._vidi_marker = true;
        marker.dhptype = "marker";
        marker.dhpLayer = true;
        marker.id = id;
        return marker;
    }
}
module.exports = DetailMarker;
