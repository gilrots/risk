import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import './app.css';
import StockViewer from './components/stock-viewer/stock-viewer';
import AppHeader from "./components/header/app-header";
import {
    Container, Row, Col, Form, Input, Button, Navbar, Nav,
    NavbarBrand, NavLink, NavItem, UncontrolledDropdown,
    DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import TableMaker from "./components/table-maker/table-maker";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { longs: [], shorts: [], risk: [], isDialogOpen: false, isNewTableOpen: false, errors:{} };
    this.config = {};
    this.openNewTable = this.openNewTable.bind(this);
  }

  componentDidMount() {
    const app = this;
    this.getConfig().then(config => {
        setInterval(() => {
            fetch('/api/getData')
                .then(res => res.json())
                .then((data) => {
                    //console.log("app data", {data: data.riskTable});
                    app.config = config
                    app.setState({ longs: _.values(data.longs.data), shorts: _.values(data.shorts.data), risk: data.riskData, errors: data.errors });
                });
        }, config.deborah.updateInterval);
    });
  }

  getConfig(){
      return new Promise((resolve, reject) => {
          fetch('/api/getConfig')
              .then(res => res.json())
              .then(config => {
                  //console.log(config);
                  resolve(config);
              })
              .catch(error => {
                  console.log(error)
                  reject();
              });
      });
  }

  openNewTable(){
    this.setState({isDialogOpen: true, isNewTableOpen: true});
  }

  render() {
    const { longs, shorts, risk, isDialogOpen, isNewTableOpen, errors } = this.state;
    const cols = this.config.cols || { longs:{}, shorts:{} };

    return (
        <Fragment>
            {isDialogOpen && <div className="modalScreen" id="modalScreen">
                {isNewTableOpen && <TableMaker/>}
            </div>}
            <AppHeader onNewTableClicked={this.openNewTable} ace={errors.ace} />
            <main className="my-5 py-5">
                <Container className="max">
                    <Row>
                        <Col xs={{ order: 1 }} md={{ size: 2 }} className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                            {risk && <StockViewer  className="risk" data={risk} cols={cols.risk}  id="risk"/>}
                        </Col>
                        <Col xs={{ order: 2 }} md={{ size: 5 }} className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                            {longs && <StockViewer  className="longs" data={longs} cols={cols.longs} reverse={true}  id="longs"/>}
                        </Col>
                        <Col xs={{ order: 3 }} md={{ size: 5 }} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                            {shorts && <StockViewer className="shorts" data={shorts} cols={cols.shorts} id="shorts"/>}
                        </Col>
                    </Row>
                </Container>
            </main>
        </Fragment>
    );
  }
}
//noGutters className="pt-2 w-100 px-4 px-xl-0 position-relative"
// className="px-0"
