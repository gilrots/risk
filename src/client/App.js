import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import './app.css';
import StockViewer from './components/stock-viewer/stock-viewer';
import AppHeader from "./components/header/app-header";
import {Container, Row, Col, Button, Modal, ModalBody, ModalFooter, ModalHeader, NavItem, Nav, TabContent, TabPane, NavLink } from 'reactstrap';
import TableMaker from "./components/table-maker/table-maker";
import classnames from 'classnames';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        config: {},
        data: {},
        activeTable: '0',
        modal: {
            isOpen: false,
            newTable: false
        },
        tableMakerData: {}
    };
    this.polling = true;
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleTab = this.toggleTab.bind(this);
  }

  componentDidMount() {
    const app = this;
    this.getConfig().then( () => {
        const {config, activeTable} = app.state;
        fetch(config.server.api.getTableMakerData).then(res => res.json()).then(tableMakerData => {
            app.setState({tableMakerData});
            console.log(tableMakerData);
        });
        app.getData(activeTable,() => {
            setInterval(() => {
                if(app.polling) {
                    const table = app.state.activeTable;
                    app.getData(table);
                }
            }, config.app.updateInterval);
        });
    });
  }

  setUrl(link,params){
      const url = link + "?";///new URL(link);
      const keys = Object.keys(params);
      return _.reduce(keys,(acc,key,index) => acc.concat(`${key}=${params[key]}${index === (keys.length - 1)? '' : '&'}`), url);
  }

  getData(tableId, callback) {
      const app = this;
      const {config} = this.state;
      const  url = this.setUrl(config.server.api.getData, {tableId});
      fetch(url)
          .then(res => res.json())
          .then((data) => {
              console.log(data);
              app.setState({ data });
              if(callback) {
                  callback();
              }
          });
  }

  getConfig(){
      return new Promise((resolve, reject) => {
          fetch('/api/getConfig')
              .then(res => res.json())
              .then(config => {

                  console.log(config);
                  const activeTable = config.app.defaultTable.id;
                  this.setState({config,activeTable},() => resolve());
              })
              .catch(error => {
                  console.log(error);
                  reject();
              });
      });
  }

  toggleModal(title,component){
    this.setState(state => {
        return state.modal.isOpen ? {modal: {isOpen: false, title: '', component: undefined}} : {
            modal: {
                isOpen: true,
                title: title,
                component: component
            }
        };
    }, () => {
        this.polling = !this.state.modal.isOpen

    });
  }

  toggleTab(tab) {
    if (this.state.activeTable !== tab) {
        this.setState({
            activeTable: tab
        }, this.getData(tab));
    }
  }

  newTable(tab) {
    if (this.state.activeTable !== tab) {
        this.setState({
            activeTable: tab
        }, this.getData(tab));
    }
  }

  render() {
    const { config, data, modal, tableMakerData, activeTable } = this.state;
    const configInit = !_.isEmpty(config);
    const tableInit = !_.isEmpty(tableMakerData);
    const dataInit = !_.isEmpty(data);
    const modalComponent = (component) => {
        switch(component) {
            case 'TableMaker':
                return (<TableMaker id="table-maker"  config={config} fields={tableMakerData}/>);
            default:
                return (<div>---</div>);
        }
    }

    return (
        <Fragment>
            <Modal isOpen={modal.isOpen} toggle={this.toggleModal} className="max">
                <ModalHeader toggle={this.toggleModal}>{modal.title}</ModalHeader>
                <ModalBody>
                    {modalComponent(modal.component)}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.toggleModal}>Do Something</Button>{' '}
                    <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
            {configInit && <AppHeader>
                {dataInit && <Button color={data.errors.ace ? 'danger' : 'success'}>Ace</Button>}
            </AppHeader>}
            {dataInit &&
            <Fragment>
                <main className="my-5 py-5">
                    <Nav tabs>
                        { data.tables.map((table)=>{
                            return (<NavItem key={table.id}>
                                        <NavLink className={classnames({ active: activeTable === table.id })}
                                                 onClick={() => { this.toggleTab(table.id); }}>
                                            {table.name}
                                        </NavLink>
                                    </NavItem>)
                        })}
                        {configInit && tableInit &&
                        <NavItem>
                            <NavLink>
                                <Button color="primary" onClick={() => this.toggleModal('Create new table', 'TableMaker')}>
                                    <i className="fa fa-plus"></i>
                                </Button>
                            </NavLink>
                        </NavItem>}
                    </Nav>
                    <TabContent activeTab={'0'}>
                        <TabPane tabId={'0'}>
                            <Container className="max">
                                <Row>
                                    <Col xs={{ order: 1 }} md={{ size: 2 }} className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                        {<StockViewer  className="risk" data={data.risk} id="risk"/>}
                                    </Col>
                                    <Col xs={{ order: 2 }} md={{ size: 5 }} className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                        {<StockViewer  className="longs" data={data.long} id="longs" reverse/>}
                                    </Col>
                                    <Col xs={{ order: 3 }} md={{ size: 5 }} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                                        {<StockViewer className="shorts" data={data.short} id="shorts"/>}
                                    </Col>
                                </Row>
                            </Container>
                        </TabPane>
                    </TabContent>
                </main>
            </Fragment>}
        </Fragment>
    );
  }
}
//noGutters className="pt-2 w-100 px-4 px-xl-0 position-relative"
// className="px-0"
