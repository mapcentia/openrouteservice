
const sumEconomyDataFunc = require('../../../detailhandelsportalen/commonFunctions/sumEconomyValuesFunction')

class AdditionalLeafletFunctions{
    constructor(){
        this.economyData = null;
        this.enabled = true;
    }

    toggle(){
        if(this.enabled){
            this.layer.removeFrom(this.parentLayer);
            this.enabled = false;
        }else{
            this.layer.addTo(this.parentLayer);
            this.enabled = true;
        }
    }

    addToMap(){
        this.enabled = true;
        this.layer.addTo(this.parentLayer);
    }

    removeFromMap(){
        this.enabled = false;
        this.layer.removeFrom(this.parentLayer);
    }

    destroy(){
        this.layer.remove();
    }

    activate(){
        this.addReactComponent();
    }

    sumEconomyValues(values){
        return sumEconomyDataFunc(values);
    }

    changeColor(color){
        let settings = {"color": color,"fillColor": color};

        if(this.polygonStyleSettings){
            this.polygonStyleSettings.selectedColor = color;
            this.polygonStyleSettings.deselectedColor = color;
        }

        this.layer.setStyle(settings);
    }

    changeOpacity(opacity){
        if(this.polygonStyleSettings){
            this.polygonStyleSettings.selectedOpacity = opacity;
        }
        this.layer.setStyle({
            fillOpacity:opacity
        })
    }

    getKomKode(jstsLocation){
        //.log('jstsLocation',jstsLocation)
        const self = this;
        return $.ajax({
            method: "POST",
            url: `/api/extension/detailhandel/komkode`,
            data: {
                q: Base64.encode(jstsLocation),
                Base64: true
            },
            success: function(e){
                if(e.features && e.features.length > 0){
                    self.komkode = e.features;
                    self.addNameComponent();
                }else{
                    self.komkode = null;
                }
                //console.log('success', e);
            },
            error: function(e){
                console.log('Isochrone Ajax failed', e)
            }
        })
    }

    getEconomyData(type, db, geometry){
        var self = this;
        return $.ajax({
            method:"POST",
            url: `/api/extension/economyData`,
            data: {
                type: type,
                q: geometry,
                db: db,
                srs: 4326,
                lifetime: 0,
                client_encoding: "UTF8",
                key: null
            },
            success: function(data){
                self.economyData = data;
                self.sortedEconomyData = self.sumEconomyValues(data.features);
                // console.log(self.sortedEconomyData);
                //console.log('data!', type, data);
            },
            error: function(data){
                console.log('error!', data);
            }
        })
    }

}

module.exports = AdditionalLeafletFunctions;