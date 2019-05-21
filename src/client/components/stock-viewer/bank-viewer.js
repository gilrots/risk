import React from 'react';
import _ from 'lodash';
import {Card, CardBody, CardTitle, Badge} from 'reactstrap';
const config = require('../../../common/config').bank;
const bankToColor = config.colors;
const bankToName = config.banks;

class BankViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {banks:_.keys(props.value), selected: undefined};
    }

    toggle = bank => {
        if(!this.props.readonly){
            this.setState(state => ({ selected: state.selected === bank ? undefined : bank}));
        }
    }

    render() {
        const {banks, selected} = this.state;
        const {value} = this.props;

        return banks && <div>
                {banks.map(bank =>
                bank && bankToName[bank] &&
                <Badge key={bank}
                        color={bankToColor[bank]}
                        onClick={()=>this.toggle(bank)}>{bankToName[bank][0]}</Badge>)}
                {selected && <div  >
                   <Card>
                    <CardBody>
                        <CardTitle>{bankToName[selected]}</CardTitle>
                        {value[selected].map(accnt => <div key={accnt}>
                            <Badge color={bankToColor[selected]} >{accnt}</Badge>
                        </div>)}
                    </CardBody>
                  </Card>
                </div>}
              </div>;
    }
}

export default BankViewer;
