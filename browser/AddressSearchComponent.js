var reproject = require('reproject');

class AddressSearchComponent extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            location: null,
            loading: true,
            error: false,
            data: {},
            darData: {},
            name: this.props.name,
            dirty: false
        }
        this.getData(this.props.location);
        this.nameContainer = null;
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        if(this.props.location != prevProps.location){
            this.setState({
                loading: true,
                error:false,
                data: {},
                darData: {},
                name: this.props.name,
                dirty:false
            });
            this.getData(this.props.location);
        }   
    }

    /*
    componentWillUpdate(nextProps, nextState){
        console.log('DAR got props! outside IF',{currentState:this.state, currentProps: this.props, nextProps: nextProps, nextState:nextState});
        if(nextProps.location.lat != this.props.location.lat && nextProps.location.lng != this.props.location.lng){
            this.setState({
                loading: true,
                error:false,
                data: {},
                darData: {}
            });
            console.log('DAR got props! UPDATE!',this.props, nextProps, nextState);
            this.getData();
            return true;
        }
        return false;
    }*/

    getData = (location) => {

        var reader = new jsts.io.GeoJSONReader();
        var crss = {
            "proj": "+proj=utm +zone=" + "32" + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
            "unproj": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
        };

        var point = reader.read(reproject.reproject(L.marker(location).toGeoJSON(), "unproj", "proj", crss));
        var jstsObject = reader.read(L.marker(location).toGeoJSON()).geometry.toText();
        
        let pointText = point.geometry.toText().toLowerCase();
        
        var data = {
            q: Base64.encode(`SELECT *, round(ST_Distance(ST_Transform(the_geom, 25832), ST_GeomFromText('${pointText}', 25832))) d
            FROM dar.adgangsadresser
            WHERE round(ST_Distance (ST_Transform(the_geom, 25832), ST_GeomFromText('${pointText}', 25832))) < 50
            ORDER BY d`),
            base64: true,
            srs: 25832,
            lifetime: 0,
            client_encoding: 'UTF8',
            key: null,
        }

        $.ajax({
            url:'https://gc2.io/api/v1/sql/dk',
            data: data,
            contentType: "application/json; charset=utf-8",
            scriptCharset: "utf-8",
            dataType: 'json',
            type: "POST",
            jsonp: false,
            success: (data) => {
                //console.log('DAR DATA!', data);
                if(data.features[0]){
                    this.setState({data: data.features[0]});
                    var darQuery = {
                        "from": 0,"size": 20,"query": {"bool": {"must": {"query_string": {"default_field": "properties.gid","query": ""+data.features[0].properties.id+"","default_operator": "AND"}}}}
                    }
                    $.ajax({
                        url: 'https://gc2.io/api/v2/elasticsearch/search/dk/dar/adgangsadresser_view',
                        data: JSON.stringify(darQuery),
                        contentType: "application/json; charset=utf-8",
                        scriptCharset: "utf-8",
                        dataType: 'json',
                        type: "POST",
                        jsonp: false,
                        success: (darResponse) => {
                            //console.log('darResponse', darResponse)
                            if(darResponse.hits.hits.length > 0){
                                //console.log('made it here 1')
                                try{
                                    this.setState({loading: false, error: false, darData: darResponse.hits.hits[0]._source.properties});
                                    //console.log('made it here 2', this.state);
                                }catch(err){
                                    this.setState({loading: false, error: false});
                                }
                            }else{
                                this.setState({loading: false, error: false});
                            }
                        },
                        error:() => {
                            this.setState({loading: false, error: false});
                        }
                    })
                }else{
                    this.getKomKode(jstsObject).then((e) => {
                        if(e.features.length > 0){
                            this.setState({data: e.features[0].properties});
                        }
                        this.setState({loading: false, error: false});
                    });
                    
                }
            },
            error: (e) => {
                console.log('error!', {error: e, reactState: this.state, reactProps: this.props});
                this.setState({loading: false, error: false});
            }
        })
    }

    prodetails = (dar) => {
        if(this.props.userLevel != null && this.props.userLevel >= 3){
            return (<tr>
                <td>Link til BBR</td>
                {/*<td><a href={"https://boligejer.dk/ejendomsdata?kommuneId="+dar.kommunekode+"&ejendomId="+dar.esrejendomsnr} target="_blank">Link</a></td>*/}
                {/*<td><a href={"https://boligejer.dk/ejendomsdata/0/10/0/0"+dar.esrejendomsnr+"%7C0"+ dar.kommunekode} target="_blank">Link</a></td>*/}
                {/*<td><a href={"https://boligejer.dk/pls/wwwdata/get_ois_pck.show_bbr_meddelelse_pdf?i_municipalitycode="+dar.kommunekode+"&i_realpropertyidentifier="+dar.esrejendomsnr} target="_blank">Link</a></td>*/}
            </tr>);
        }else if(this.state.userLevel == null){
            return null;
        }
        return null;
    }
    
    updateName = () => {
        this.setState({name:this.nameContainer.value});
        this.props.changeName(this.nameContainer.value);
    }

    onNameChange = (name) => {
        //console.log('event', name)
        this.setState({name: name.target.value, dirty:true}, () => {
            this.props.changeName(this.nameContainer.value);
        });
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
            }
        })
    }

    render(){
        let renderDAR = () => {
            //console.log(this.state);
            if(this.state.loading == true){
                return <React.Fragment><tr><td colSpan="2">Indlæser...</td></tr></React.Fragment>
            }else if (this.state.error == true){
                return <React.Fragment><tr><td colSpan="2">Sket en fejl, prøv igen</td></tr></React.Fragment>
            }else if (Object.keys(this.state.data).length > 0 && Object.keys(this.state.darData).length > 0){
                return <React.Fragment>
                        {/*<tr>
                            <td>Koordinat</td>
                            <td>{this.props.location.lat}, {this.props.location.lng}</td>
                        </tr>
                        <tr>
                            <td>Ejedomdsnummer</td>
                            <td>{this.state.darData.esrejendomsnr}</td>
                        </tr>
                        <tr>
                            <td>Adresse ID</td>
                            <td>{this.state.darData.gid}</td>
                        </tr>
                        */}
                        <tr>
                            <td>Adresse</td>
                            <td>{this.state.darData.string4}</td>
                        </tr>
                        <tr>
                            <td>Ejendomsnummer (ESR)</td>
                            <td>{this.state.darData.esrejendomsnr}</td>
                        </tr>
                        <tr>
                            <td>Kommunekode</td>
                            <td className="dar-komkode">{this.state.darData.kommunekode}</td>
                        </tr>
                        {this.prodetails(this.state.darData)
                    }
                </React.Fragment>
                                
            }else if (Object.keys(this.state.data).length > 0){
                return <React.Fragment>
                        <tr>
                            <td className="dar-komkode">Kommunekode</td>
                            <td>{this.state.data.komkode}</td>
                        </tr>
                </React.Fragment>
            }else{
                return <tr><td colSpan="2">Ingen adresseoplysninger tilgængelige for den valgte placering.</td></tr>
            }
        }
        let nameContainer = () => {
            return (
                <React.Fragment>
                <tr>
                    <td>Navn</td>
                    <td>
                        <div className="input-group">
                            <div className="form-group">
                                <input value={this.state.name} className="form-control"  onChange={this.onNameChange} ref={(ref) => {this.nameContainer = ref;}} />
                            </div>
                            {/* <span className="input-group-btn">
                                <button className={`btn btn-raised btn-xs ${this.state.dirty? 'btn-primary':''}`} onClick={this.updateName}>Gem</button>
                            </span> */}
                        </div>
                    </td>
                </tr>
                <tr>
                    <td><p>ID</p></td>
                    <td>
                        {this.props.id ? this.props.id : ''}
                    </td>
                </tr>
                </React.Fragment>
            )
        }

        let style= {
            //backgroundColor: "red", 
            //color: "white", 
            //padding: "8px",
            //textAlign: "center"
        }

        return(
            <React.Fragment>
            <div className="panel panel-default tab-pane" style={{minHeight: "200px"}}>
                <div  className="panel-heading">
                    <h4 style={style} className="panel-title">Stamoplysninger - Butik</h4>
                </div>
                <table className="table tableContainer" >
                    <tbody>
                        {nameContainer()}
                        {renderDAR()}
                    </tbody>
                </table>
            </div>
            </React.Fragment>
        )
    }
}

module.exports = AddressSearchComponent;
