
class EconomySummaryComponent extends React.Component{
    localeFilter(input){
        return parseInt(input).toLocaleString("da-DK");
    }

    localeFilterCurrency(input){
        return (Math.round(parseInt(input) / 5000) * 5000).toLocaleString("da-DK")
    }

    render(){
        return(
            <React.Fragment>
                <table className={`table tableContainer`}>
                    <tbody>
                        {/* <tr>
                            <td colSpan="2"><b>Forbrug</b></td>
                        </tr>
                        <tr>
                            <td width="50%">Dagligvare</td>
                            <td className="text-right">{this.localeFilter(this.props.data ? this.props.data.fb_dagligv: '')} kr/år</td>
                        </tr>
                        <tr>
                            <td width="50%">Beklædning</td>
                            <td className="text-right">{this.localeFilter(this.props.data ? this.props.data.fb_beklaed: '')} kr/år</td>
                        </tr>
                        <tr>
                            <td width="50%">Øvrige</td>
                            <td className="text-right">{this.localeFilter(this.props.data ? this.props.data.fb_oevrige: '')} kr/år</td>
                        </tr>
                        <tr>
                            <td width="50%">I alt</td>
                            <td className="text-right">{this.localeFilter(this.props.data ? this.props.data.fb_total: '')} kr/år</td>
                        </tr> */}

                        <tr>
                            <td colSpan="2"><b>Demografi</b></td>
                        </tr>
                        <tr>
                            <td width="50%">Antal personer</td>
                            <td className="text-right">{this.localeFilter(this.props.calculatedEconomy ? this.props.calculatedEconomy.antpersh_4: '')}</td>
                        </tr>
                        <tr>
                            <td width="50%">Antal husstande</td>
                            <td className="text-right">{this.localeFilter(this.props.calculatedEconomy ? this.props.calculatedEconomy.anthust_4: '')}</td>
                        </tr>
                        

                        <tr>
                            <td colSpan="2"><b>Konkurrenter (Dagligvarebutikker)</b></td>
                        </tr>
                        <tr>
                            <td width="50%">Konkurrenternes omsætning </td>
                            <td className="text-right">{this.props.data ? this.props.data.oms_min: ''} - {this.props.data ? this.props.data.oms_maks : ''} mio. kr/år</td>
                        </tr>
                    </tbody>
                </table>
            </React.Fragment>
        )
    }
}

module.exports = EconomySummaryComponent;