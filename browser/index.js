'use strict';

var utils;
var backboneEvents;
//var exId = "languages";
require("../../../public/js/leaflet-easybutton/easy-button");
var React = require('react');
var ReactDOM = require('react-dom');
var cloud;

var DetailMarker = require('./detailMarker');
var DetailPolygon = require('./dhpDraw');
var FeedbackComponent = require('./shared/Feedback')
var DHPID = require('./shared/DHPid');

var userLevel = 0;
window.DHPSnapshotData = {
    markers: [],
    drawn: []
}

const MODULE_NAME = `openrouteservice`;

let drawnItems = new L.FeatureGroup();
let drawControl, embedDrawControl, measurementControlButton;
let drawOn = false;
let _self = false;
var vidiState = null;
var tabsAdded = false;
window.DHPMarkerArray = [];
window.DHPDrawnPolygonArray = [];
window.polygonID = new DHPID();
window.markerID = new DHPID();
var printModule;

var showLayers = true;

var firstInitialization = false;

/**
 *
 * @type {L.FeatureGroup}
 */
module.exports = {
    set: function (o) {
        //console.log('OpenRouteService Module',{o: o, this: this});
        utils = o.utils;
        vidiState = o.state;
        backboneEvents = o.backboneEvents;
        cloud = o.cloud;
        printModule = o.print;
        _self = this;
        return this;
    },
    init: function (o) {
        try{
            $("#start-print-btn").unbind();
            $("#start-print-btn").on("click", function () {
                $('.dar-search-content').show();
                $('#openrouteservice-settings').hide();
                $('.help-btn').hide();
                let html = $('#openrouteservice-content').html();
                if($('.intersect-container').length > 0){
                    html += $('.intersect-container').html(); 
                }
                var customData = JSON.stringify(html);

                setTimeout(() => {
                    if (printModule.print("end:print", customData)) {
                        $(this).button('loading');
                        $("#get-print-fieldset").prop("disabled", true);
                    }
                }, 500)
            });
        }catch(err){
            console.log(err)
        }

        try{
            console.log('print:index');
            if($('#dhp-print-mode').length > 0){
                console.log('print:index2');
                $('#dhp-print-mode').html(JSON.parse(window.customData));
                setTimeout(() => {
                    $('.dhp-tab-header > .nav > li a').each((index, element) => {
                        var id = element.id.slice(0, -4);
                        var title = element.innerText;
                        $('.dhp-tab-content #'+ id).prepend('<a href="#" class="social-economy-header" style="display:block; text-align:left; margin-top:20px">'+title+'</a>');

                        $('.intersect-socioeconomy-table').each((i, e) => {
                            $(e).removeClass("collapse in");
                        })
                        if($('#dhp-isochrone0').children().length == 0){
                            $('#dhp-isochrone0').remove();
                            $('#dhp-isochrone1').remove();
                            $('#dhp-buffer0').remove();
                            $('#dhp-buffer1').remove();
                        }
                        if($('#dhp-drawnPolygon').children().length == 0){
                            $('#dhp-drawnPolygon').remove();
                        }else{
                            $('.drawn-name-content').prependTo('#dhp-drawnPolygon');
                        }
                    });
                }, 500)
            }
        }
        catch(err){
            console.erro('error DHP', err)
        }
        
        backboneEvents.get().on("session:DHPauth", (data) => {
            //console.log('session started', data)
            if(data == false){
                userLevel = 0;
            }else if(data.properties.dhp.userLevel){
                userLevel = data.properties.dhp.userLevel
            }
        });

        backboneEvents.get().on(`on:${MODULE_NAME}`, () => { _self.toggleIsochroneDraw(true) });
        backboneEvents.get().on(`off:${MODULE_NAME} off:all`, () => { _self.toggleIsochroneDraw(false) });

        

        /**@todo remove quickfix and make a proper one */
        $(".navbar-brand").children(".material-icons").remove();
        $(".navbar-brand").prepend('<img src="/img/dhp-logo.png" style="width: 40px; margin-left: -5px;padding: 0;display: initial; margin-right: 14px;"></img>');

        utils.createMainTab("openrouteservice", __("Oplande"), __("Opland indstillinger"), require('../../../browser/modules/height')().max, "public", false, MODULE_NAME);

        $(".isochrone-disabled-button").attr("disabled", true);
        
        /*State functions*/
        
        // ### ! ###
        // state.listenTo() is called in init() method and
        // prepares demo module to be used with the state snapshots API 
        vidiState.listenTo(MODULE_NAME, _self);

        // ### ! ###
        // state.listen() makes state module to listen for base-layer-was-set
        // event of the demo module
        vidiState.listen(MODULE_NAME, `OSRupdate`);
        

        // ### ! ###
        // state.getModuleState() returns the latest available state of
        // the demo module, for example, after page refresh
        /*vidiState.getModuleState(MODULE_NAME).then((data) => {
            if(data){
                _self.setResumeState(data);
            }
        });
        */
        

        //remove all dhpLayer from map, resets the map
        backboneEvents.get().on(`reset:infoClick`, () => {
            _self.resetStateToInitial();
        });

        backboneEvents.get().on("detailhandelsportalen:ready", (e) => {
            backboneEvents.get().trigger(`${MODULE_NAME}:initialized`);
        });

        drawnItems.addTo(cloud.get().map)
        window.drawnItems = drawnItems;

    },
    resetStateToInitial: () => {
        window.polygonID.id = null;
        window.markerID.id = null;

        $('.drawn-name-content').remove();
        $('.dar-search-content').remove();
        $('.dhp-panel').remove();
        let map = cloud.get().map;
        map.eachLayer(function(layer){
            if(layer.dhpLayer == true){
                layer.remove();
            }
        });
        drawnItems.eachLayer(function(layer){
            if(layer.dhpLayer == true){
                drawnItems.removeLayer(layer);
            }
        });

        _self.resetIsochroneReact();
        _self.resetDrawnPolygonReact();
        _self.addReactTab(true);
        //_self.off();
        window.DHPMarkerArray = [];
        window.DHPDrawnPolygonArray = [];
        window.DHPSnapshotData = {
            markers: [],
            drawn: []
        }
        //reset drawing tools if current tab is active
        if($("a[data-module-id=openrouteservice]").parent().hasClass("active")){
            $($("#main-tabs > li > a ")[0]).trigger('click');
            setTimeout(() => {
                $("a[data-module-id=openrouteservice]").trigger('click');
            }, 500)
        }
    },
    addReactTab: (reset) => {
        if(firstInitialization == true && reset){
            return;
        }else{
            firstInitialization = true;
        }

        var DHPReactTab = `
        <div class="dar-search-content"></div>
        <div class="drawn-name-content"></div>

        <div class="dhp-panel panel panel-default tab-pane">
            <div  class="panel-heading hide-print">
                <h4 class="panel-title">
                    Oplande
                    <!--  <div class="badge pull-right hide-all-layers" style="cursor: pointer;"><i class="fa fa-eye" aria-hidden="true"></i> Vis/skjul opland</div>-->
                </h4>  
                <span class="pull-right hide-all-layers" style="margin-top: -30px; margin-right: -9px;">
                </span>
                 
                
            </div>
           
            <div class="dhp-tab-header" style="padding-top: 5px;">
                <ul  class="nav nav-tabs">
                    <li class="nav-item dhp-isochrone0" ></li>
                    <li class="nav-item dhp-isochrone1" ></li>
                    <li class="nav-item dhp-buffer0" ></li>
                    <li class="nav-item dhp-buffer1" ></li>
                    <li class="nav-item dhp-drawnPolygon" ></li>
                </ul>
            </div>
            <div id="openrouteservice-settings"></div>

            <div class="dhp-tab-content tab-content">
                <div class="tab-pane fade dhp-isochrone0" id="dhp-isochrone0" ></div>
                <div class="tab-pane fade dhp-isochrone1" id="dhp-isochrone1" ></div>
                <div class="tab-pane fade dhp-buffer0" id="dhp-buffer0"></div>
                <div class="tab-pane fade dhp-buffer1" id="dhp-buffer1" ></div>
                <div class="tab-pane fade dhp-drawnPolygon" id="dhp-drawnPolygon" ></div>
            </div>
        </div>`;
        if($("#openrouteservice-content .dar-search-content").length == 0){
            $("#openrouteservice-content").append(DHPReactTab);
        }

        $('.dhp-drawnPolygon').on('click', () => {
            $('#openrouteservice-settings').fadeOut(200);
            $('.dar-search-content').hide();
            $('.drawn-name-content').show();
        })

        $('.dhp-buffer0, .dhp-buffer1').on('click', () => {
            $('#openrouteservice-settings').fadeOut(200);
            $('.dar-search-content').show();
            $('.drawn-name-content').hide();
        })

        $('.dhp-isochrone0, .dhp-isochrone1').on('click', () => {
            $('.dar-search-content').show();
            $('.drawn-name-content').hide();
            $('#openrouteservice-settings').fadeIn(200);
        })

        class ToggleLayers extends React.Component{
            constructor(props){
                super(props)
                this.state = {
                    show: false
                }
            }

            toggleLayers = () =>{
                window.DHPDrawnPolygonArray.forEach((e) => {
                    // console.log('showlayer', {state: this.state.show, e})
                    if(this.state.show == true){
                        e.addToMap();
                    }else{
                        e.removeFromMap();
                    }
                });
    
                window.DHPMarkerArray.forEach(e => {
                    // console.log('showlayer2', {state:this.state.show, e})
                    if(this.state.show){
                        //e.addToMap();
                        e.addAllLayers();
                    }else{
                        //e.removeFromMap();
                        e.removeAllLayers();
                    }
                })
                this.setState({show: !this.state.show})
            }

            render(){
                return(
                    <button className="btn btn-default btn-raised btn-xs hide-all-layers float-right" alt="Vis/Skjul - Alle oplande" onClick={this.toggleLayers}>
                        <i className="fa fa-eye" aria-hidden="true"></i> Vis/Skjul <br /> Alle oplande
                        <div className="ripple-container"></div>
                    </button>
                )
            }

        }

        ReactDOM.render(
            <ToggleLayers></ToggleLayers>,
            document.querySelector('.hide-all-layers')
        )
    },
    setResumeState: (arg) => {
        _self.resetStateToInitial();
        _self.addReactTab();
        console.log(arg)
        if(typeof arg.data.marker == 'object'){
            alert('Old version of Snapshot, please remove this snapshot and re-add the data');
            return;
        }
        if(arg.data.markers.length > 0){
            arg.data.markers.forEach((settings) => {
                console.log('settings', settings);
                settings.userLevel = userLevel;
                let dhpMarker = new DetailMarker(cloud.get().map, drawnItems, settings);
                window.DHPMarkerArray.push(dhpMarker);
                window.DHPSnapshotData.markers.push(dhpMarker);
            })
        }
        if(arg.data.drawn.length > 0){
            arg.data.drawn.forEach((settings) => {
                settings.userLevel = userLevel;
                var dhpPolygon = new DetailDrawPolygon(cloud.get().map, drawnItems, settings);
                window.DHPDrawnPolygonArray.push(dhpPolygon);
                window.DHPSnapshotData.drawn.push(dhpPolygon);
            })
        }
        console.log('new resume state', arg);
    },
    
    getState: () => {
        return { data: window.DHPSnapshotData };
    },
    applyState: (data ) => {
        console.log('applying state!', data)
        if(data){
            _self.setResumeState(data);
        } 
    },

    toggleIsochroneDraw: (activate = false, triggerEvents = true) => {
        //activate draw module
        if(activate && drawOn != true){
            backboneEvents.get().trigger(`off:all`);
            //$('.leaflet-control-custom').find('.js-measurements-control').html('<span class="fa fa-ban"></span>');
            if (triggerEvents) backboneEvents.get().trigger(`${MODULE_NAME}:turnedOn`);
            _self.on();
        }
        //else remove draw
        if(activate == false && drawOn == true){
            drawOn = false;
            _self.off();
        }

    },
    off: () => {
        // Unbind events
        cloud.get().map.off('draw:created');
        cloud.get().map.off('draw:drawstart');
        cloud.get().map.off('draw:drawstop');
        cloud.get().map.off('draw:editstart');
        cloud.get().map.off('draw:editstop');
        cloud.get().map.off('draw:deletestart');
        cloud.get().map.off('draw:deletestop');
        cloud.get().map.off('draw:deleted');
        cloud.get().map.off('draw:created');
        cloud.get().map.off('draw:edited');
        cloud.get().map.off('draw:editvertex');
        if (drawControl) {
            cloud.get().map.removeControl(drawControl);
        }
        drawOn = false;
        drawControl = false;
    },
    on: () => {
        window.utils = utils;
        var map = cloud.get().map;

        var dict = {
            "Place retail": {
                "da_DK": "Beregn opland",
                "en_US": "Place retail"
            },
            "Draw catchment": {
                "da_DK": "Tegn opland",
                "en_US": "Draw catchment"
            }
        };
        L.drawLocal = require('./drawLocale.js');
        L.drawLocal.draw.toolbar.buttons.polygon = utils.__("Draw catchment", dict);
        L.drawLocal.draw.toolbar.buttons.marker = utils.__("Place retail", dict);

        drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polyline: false,
                circle: false,
                rectangle:false,
                marker: true,
                polygon: {
                    allowIntersection: false,
                    drawError: {
                        color: '#b00b00',
                        timeout: 1000
                    },
                    shapeOptions: {
                        color: '#662d91',
                        fillOpacity: 0,
                        editing: {
                            className: ""
                        }
                    },
                    showArea: true
                },
                circlemarker: false
            },
            edit: {
                featureGroup: drawnItems,
                remove: false,
                edit: true
            }
        });
        
        map.addControl(drawControl);

        // Bind events
        //add layer to map if it's a vidi type layer
        map.on('draw:created', function (e) {
            backboneEvents.get().trigger(`${MODULE_NAME}:OSRupdate`);
            // console.log('handleDrawEvent', e);
            // console.log('handleDrawEvent', drawnItems);
            _self.handleDrawEvent(e);
            //handle isochrone
        });

        map.on('draw:drawstart', function (e) {
            // Clear all SQL query layers
            //backboneEvents.get().trigger("sqlQuery:clear");
            
        });
        map.on('draw:drawstop', function (e) {
            //_self.handleDrawEvent(e);
        });
        map.on('draw:editstop', function (e) {

        });
        map.on('draw:edited', function (e) {
            var layers = e.layers.getLayers();
            
            layers.forEach(element => {
                if(element instanceof L.Polygon){
                    //_self.off();
                    _self.handlePolygonEdit(element);
                }else if(element instanceof L.Marker){
                    //_self.off();
                    _self.handleMarkerEdit(element);
                }
            });
        });
        map.on('draw:editstart', function (e) {
            console.log('draw:editstart',e);
            drawnItems.eachLayer((layer) => {
                console.log('in each layer', layer);
                if(layer instanceof L.Polygon){
                    layer.options.editing = {};
                    layer.options.editing.className = '';
                }
            })
        });
        
        drawOn = true;
        //Show tooltip
        localforage.getItem("DHPTooltip").then(function(key){
            if(key == null){
                _self.handlePopoverHelper();
                localforage.setItem("DHPTooltip", true);
            }
        })
        

    },
    resetIsochroneReact: () => {
        if(DHPMarkerArray.length > 0){
            try{
                ReactDOM.unmountComponentAtNode(document.querySelector('#openrouteservice-settings'));
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-isochrone0'));
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-isochrone0'));
                
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-isochrone1'));
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-isochrone1'));
    
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-buffer0'));
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-buffer0'));
    
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-buffer1'));
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-buffer1'));
    
                ReactDOM.unmountComponentAtNode(document.querySelector('.dar-search-content'));
            }catch(err){
                console.log(err);
            }
        }
    },
    resetDrawnPolygonReact: () => {
        if(DHPDrawnPolygonArray.length > 0){
            try{
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-header .dhp-drawnPolygon'));
                ReactDOM.unmountComponentAtNode(document.querySelector('.dhp-tab-content .dhp-drawnPolygon'));
            }catch(err){
                console.log(err);
            }
        }
        
    },
    handlePolygonEdit: (layer) => {
        var editedPolygon = DHPDrawnPolygonArray.filter((e) => { return e.id == layer.feature.properties.id})[0];
        console.log('handling polygon edit', editedPolygon);
        editedPolygon.updatePolygon();
    },
    handleMarkerEdit(layer){
        var editedMarker = DHPMarkerArray.filter((e) => { return e.id == layer.id})[0];
        setTimeout(() => {editedMarker.updatePosition();}, 500)
    },
    handleDrawEvent: (e) => {
        /**
         * @todo Remove existing marker if one is placed
         * @todo Remove geometry if existing one is already added
         * @todo add function to add isochrone layer
         */
        //remove any existing marker or polygons
        _self.isoEnabled = true;
        _self.addReactTab();
        if(e.layerType == "marker" && e.layer){
            //remove existing Marker
            /*
            drawnItems.eachLayer((e) => { 
                if(e instanceof L.Marker){
                    drawnItems.removeLayer(e);
                }
            });
            */
            //Add new marker
            e.layer._vidi_type = "query_draw";
            if (e.layerType === 'marker') {
                e.layer._vidi_marker = true;
            }

            var detailSettings = {
                markerPosition: e.layer.getLatLng(),
                userLevel: userLevel,
                id: window.markerID.createID(),//Math.random().toString(36).substr(2, 5),
                ORSSettings: {
                    mode : "driving-car",
                    max : 600,
                    min : 300
                },
                enabled: true
            };

            _self.resetIsochroneReact();

            if(window.DHPMarkerArray.length > 0){
                window.DHPMarkerArray.forEach((marker) => {
                    console.log('deselecting!', marker);
                    marker.onDeselect();
                })
            }
            
            var dhpMarker = new DetailMarker(cloud.get().map, drawnItems, detailSettings);
            //dhpMarker.getAllData();

            window.DHPMarkerArray.push(dhpMarker);
            DHPSnapshotData.markers.push({
                markerPosition: e.layer.getLatLng(),
                id: detailSettings.id,
                ORSSettings: detailSettings.ORSSettings
            });
            
        }
        else if(e.layerType == "polygon" && e.layer){

            DHPDrawnPolygonArray.forEach((layer, index) => {
                layer.onDeselect();
            });

            _self.resetDrawnPolygonReact();
            e.layer._vidi_type = "query_draw";

            var detailSettings = {
                polygon: e.layer.toGeoJSON(),
                userLevel: userLevel,
                id: window.polygonID.createID(), //Math.random().toString(36).substr(2, 5),
                enabled: true
            };
            //console.log('detailsettings',detailSettings)
            detailSettings.polygon.properties.id = detailSettings.id;
            var dhpPolygon = new DetailPolygon(cloud.get().map, drawnItems, detailSettings);

            DHPDrawnPolygonArray.push(dhpPolygon);
            window.DHPSnapshotData.drawn.push({
                polygon: e.layer.toGeoJSON(),
                id: detailSettings.id
            });
        }


        $(".isochrone-disabled-button").removeAttr("disabled");
    },
    handlePopoverHelper: () => {
        var isochroneHelper = $(".leaflet-draw-section:first-child").popover({content:__("Placere en butik eller tegn et opland for at begynde at bruge detailhandelsportalens oplandsanalyse"), placement: "left"});
        isochroneHelper.popover("show");
        setTimeout(() => {
            isochroneHelper.popover("hide");
        }, 3000)
    }
};

