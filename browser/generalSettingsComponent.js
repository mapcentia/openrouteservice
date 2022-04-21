var OpenRouteSettingsComponent = require('./ORSSettingsComponent');

class GeneralSettings extends React.Component{
    constructor(props){
        super(props);
        //console.log('inside general settings',props)
    }
    
    render(){
        // console.log('generalSettingsComponent, ')
        return(
            <React.Fragment>
                <OpenRouteSettingsComponent settings={this.props.orsSettings} updateSettings={this.props.updateSettings}/>
            </React.Fragment>
        )
    }
}

module.exports = GeneralSettings;