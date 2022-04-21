import {GithubPicker, AlphaPicker} from 'react-color';

class ColorPicker extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            displayColorPicker: false,
            color: 'white',
            alpha: "black",
            polygon: this.props.polygon ? true: false
        }
    }

    handeClick = () =>{
        this.setState({displayColorPicker : !this.state.displayColorPicker})
    }
    
    handleClose = () => {
        this.setState({displayColorPicker : false});
    }

    onChange = (color) => {
        this.setState({color:color.hex})
    }
    onChangeComplete = (color) => {
        this.setState({color:color.hex});
        this.props.changeColor(color.hex, this.state.polygon);
    }

    onAlphaChange = (alpha) =>{
        //console.log('alpha', alpha);
        this.setState({alpha: alpha.rgb});
        this.props.changeOpacity(this.state.alpha.a);
    }
    
    render(){
        let style = {
            cursor: 'pointer'
        }
        const popover = {
            position: 'absolute',
            zIndex: '2',
            padding:"10px",
            background: "white",
            border: "2px solid rgb(238, 238, 238)",

        }
        const cover = {
            position: 'fixed',
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px',
        }

        let colorPickerContainer = (
            <div  style={popover} className="dhp-colorpicker-container">
                <div style={cover} onClick={this.handleClose}></div>
                <GithubPicker color={this.state.color} onChangeComplete={this.onChangeComplete} triangle="hide" onChange={this.onChange} />
                <AlphaPicker color={this.state.alpha} className="alpha-picker-tab" width={200} onChange={this.onAlphaChange} />
            </div>
        )

        return (
            <div className="tab-pane pull-right hide-print" id="">
              {/*   <div className="badge" style={style} onClick={this.handeClick} ><i className="fa fa-palette" aria-hidden="true"></i> Vælg farve</div>
                <div className="badge" style={style} onClick={this.props.toggle}><i className="fa fa-eye" aria-hidden="true"></i> Vis/skjul opland</div>*/}
                <button className="btn btn-default btn-raised btn-xs" style={style} onClick={this.handeClick} alt="Vælg farve og gennemsigtighed"> <i className="fa fa-palette" aria-hidden="true"></i> Juster farve og gennemsigtighed </button>
                <button className="btn btn-default btn-raised btn-xs" style={style} onClick={this.props.toggle} alt="Vis/skjul overlap"><i className="fa fa-eye" aria-hidden="true"></i> Juster synlighed </button>
                {this.state.displayColorPicker ? colorPickerContainer: ''}
             </div>
        )
    }
}

module.exports = ColorPicker;