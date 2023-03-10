var InputRange = require('react-input-range');
class OpenRouteServiceSettings extends React.Component{
    constructor(props) {
        super(props);
        
        this.state = this.initSettings(this.props.settings);
        this.state.limit = {
            "driving-car": {
                min: 1,
                max: 45
            },
            "cycling-regular": {
                min: 1,
                max: 30
            },
            "foot-walking": {
                min: 1,
                max: 45
            }
        }

        this.dict = {
            "Calculate catchment area": {
                "da_DK": "Beregn oplande",
                "en_US": "Calculate catchment area"
            },
            "Use one of the tools to left to get started": {
                "da_DK": "Vælg et værktøj til venstre for at komme i gang",
                "en_US": "Use one of the tools to left to get started"
            }
        };
    }

    confirmSettings = (e) =>{
        var settings = {
            min: this.state.values.min*60,
            max: this.state.values.max*60,
            mode: this.state.values.mode
        }
        this.props.updateSettings(settings);
    }
    initSettings(settings){
        return {
            values:{
                mode: settings.mode,
                min: settings.min/60,
                max: settings.max/60
            }
            
        }
    }

    componentWillReceiveProps(props){
        /**
         * @todo Compare with older settings if the component needs to be updated or not.
         *  */
        this.setState(this.initSettings(props.settings))
    }

    normalizeLimitations(obj){
        let limitValues = this.state.limit[obj.mode];
        if(obj.min < limitValues.min){
            obj.min = limitValues.min;
        }
        if(obj.max > limitValues.max){
            obj.max = limitValues.max;
        }

        return obj;
    }

    getCurrentLimits = () =>{
        return this.state.limit[this.state.values.mode];
    }

    updateInputMode = (e) => {
        var modeUpdate = {...this.state.values};
        modeUpdate.mode = e.target.value;
        modeUpdate = this.normalizeLimitations(modeUpdate);
        this.setState({values: modeUpdate});
    }

    handleChange = (values) => {
        var minMax = {...this.state.values};
        minMax.min = values.min;
        minMax.max = values.max;
        this.setState({ values: minMax });
    }

    render(){
        return (
            <React.Fragment>
                {/* 
                <p>Props values: {JSON.stringify(this.props.settings)}</p>
                <p>State values: {JSON.stringify(this.state)}</p>
                */}
                <div style={{marginTop:"5px"}}>
                    <fieldset>
                        <form className="form-horizontal">
                            <div className="radio col-md-4">
                                <label>
                                    <input type="radio" name="optionsRadios" id="optionsRadios1" value="driving-car" onChange={this.updateInputMode} checked={this.state.values.mode == "driving-car"}/>
                                    Bil
                                </label>
                            </div>
                            <div className="radio col-md-4">
                                <label>
                                    <input type="radio" name="optionsRadios" id="optionsRadios2" value="cycling-regular" onChange={this.updateInputMode} checked={this.state.values.mode == "cycling-regular"}/>
                                    Cykel
                                </label>
                            </div>
                            <div className="radio col-md-4">
                                <label>
                                    <input type="radio" name="optionsRadios" id="optionsRadios3" value="foot-walking" onChange={this.updateInputMode} checked={this.state.values.mode == "foot-walking"}/>
                                    Gang
                                </label>
                            </div>
                        </form>
                        </fieldset>
                    <div className="col" style={{margin: '25px 10px 10px'}}>
                            
                    <InputRange
                        formatLabel={(value, field) => { 
                            if(field == "min" || field == "max") return value;
                            else{ return value + " min"}
                        }}
                        minValue={this.getCurrentLimits().min}
                        maxValue={this.getCurrentLimits().max}
                        value={this.state.values}
                        onChange={this.handleChange} 
                    />
                    </div>
                    <div className="row text-center">
                        <button className="btn btn-raised isochrone-disabled-button btn-xs" onClick={this.confirmSettings}><i className="fa fa-play" aria-hidden="true"></i> {utils.__("Calculate catchment area",this.dict)}</button>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

module.exports = OpenRouteServiceSettings;
