class NameComponent extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            name : this.props.name,
            id: this.props.id,
            dirty:false
        }
        this.nameContainer = null;
    }

    componentDidMount(){
        this.setState({name: this.props.name});
    }

    componentDidUpdate(prevProps){
        if(this.props.name !== prevProps.name){
            this.setState({name: this.props.name, dirty: false});
        }
    }

    onChangeName = (name) => {
        this.setState({name: name.target.value, dirty: true}, () => {
            this.props.updateName(this.state.name);
        });
    }

    render(){
        return(
            <React.Fragment>
            <div className="panel panel-default tab-pane" style={{minHeight: "200px"}}>
                <div  className="panel-heading">
                    <h4 className="panel-title">Stamoplysninger - Opland</h4>
                </div>
                <table className="table tableContainer" >
                    <tbody>
                        <tr>
                            <td><p>Navn</p></td>
                            <td>
                                <div className="input-group">
                                    <div className="form-group">
                                        <input value={this.state.name} className="form-control"  onChange={this.onChangeName} ref={(ref) => {this.nameContainer = ref;}} />
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
                        <tr>
                            <td><p>Kommunekode</p></td>
                            <td className="dar-komkode">
                                {this.props.komkode ? this.props.komkode.map((feature, index) => {
                                    if(index > 0){
                                        return ", "+feature.properties.komkode;
                                    }else{
                                        return feature.properties.komkode;
                                    }
                                }) : '-'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            </React.Fragment>
        )
    }
}

module.exports = NameComponent;