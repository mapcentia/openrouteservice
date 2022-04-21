class DHPTableHeader extends React.Component{
    constructor(props){
        super(props)
    }
    render(){
        return(
            <a className="nav-link" id={this.props.id + '-tab'} data-toggle="tab" href={'#'+this.props.id} role="tab">
                {this.props.title}
            </a>
        )
    }
}

module.exports = DHPTableHeader;