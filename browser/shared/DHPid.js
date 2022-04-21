class DHPID{
    constructor(id){
        //Charcode A: 65 and Z: 90

        //set ID as A by default
        let preID = 64;
        //If ID exists previously, use that instead.
        if(window.MarkerPolygonID){
            if(window.MarkerPolygonID >= 64 && window.MarkerPolygonID <= 91){
                preID = window.MarkerPolygonID;
            }            
        }
        this.id = id ? id : preID;
    }
    checkGlobalID(){
        if(window.MarkerPolygonID ){
            if(window.MarkerPolygonID >= 65 && window.MarkerPolygonID <= 90){
                this.id = window.MarkerPolygonID;
            }
        }
    }
    createID(){
        if(this.id != null && this.id >= 64 && this.id <= 91){
            this.id = this.id + 1;
            if(this.id == 91){
                this.id = 65;
            }
            if(this.id == 64){
                this.id = 65;
            }
        }
        if(this.id == null){
            this.id = 65;
        }
        return String.fromCharCode(this.id);
    }
}

module.exports = DHPID;