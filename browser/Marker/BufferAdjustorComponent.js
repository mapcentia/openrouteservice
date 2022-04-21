class BufferAdjustor extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            obj:{min: 500, max: 1000},
            limit: {
                min: 100,
                max:1000
            }
        }
    }

    handleChange = (values) =>{
        console.log('change', values);
        this.setState({obj: values});
    }

    render(){
        let style = {
            clear:"both",
            padding: "20px 0"
        }
        return(
            <div style={style}>
                <InputRange
                    formatLabel={(value, field) => { 
                        if(field == "min" || field == "max") return value;
                        else{ return value + " meter"}
                    }}
                    minValue={this.state.limit.min}
                    maxValue={this.state.limit.max}
                    value={this.state.obj}
                    onChange={this.handleChange}/>
                <button className="btn btn-raised isochrone-disabled-button btn-xs" onClick={(e) => {console.log('bufferadjustor clicked', e)}}> Juster buffer </button>
            </div>
        )
    }
}

export {BufferAdjustor};