import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import './app.css';
import StockViewer from './components/stock-viewer/stock-viewer';
import AppHeader from "./components/header/app-header";
import {Container, Row, Col, Button, Modal, ModalBody, ModalFooter, ModalHeader, NavItem, Nav, TabContent, TabPane, NavLink } from 'reactstrap';
import TableMaker from "./components/table-maker/table-maker";
import classnames from 'classnames';
import * as Utils from '../common/utils';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import FilterMaker from "./components/filter-maker/filter-maker";
import ExcludeList from "./components/exclude-list/exclude-list";
import RiskLoader from "./components/loader/loader";


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
        tableMakerData: {},
        editedTable: {}
    };
    this.polling = true;
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleTab = this.toggleTab.bind(this);
    this.tableAction = this.tableAction.bind(this);
    this.modalComponent = this.modalComponent.bind(this);
    this.stockAction = this.stockAction.bind(this);
  }

  componentDidMount() {
    const app = this;
    this.getConfig().then( () => {
        const {config, activeTable} = app.state;
        Utils.fetchJson(config.server.api.getTableMakerData)
            .then(tableMakerData => {
                app.setState({tableMakerData});
                console.log(tableMakerData);
        });
        app.getData(activeTable,() => {
            setInterval(() => {
                if(app.polling) {
                    app.getData(app.state.activeTable);
                }
            }, config.app.updateInterval);
        });
    });
  }

  getData(id, callback) {
      const app = this;
      const tableId = id ? id : app.state.activeTable;
      Utils.fetchJson(this.state.config.server.api.getData,{tableId})
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
          Utils.fetchJson('/api/getConfig')
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

  tableAction(url,tableId, action){
        Utils.fetchJson(url,{tableId, action})
            .then(response => {
                if(typeof response !== 'string' && response.id !== ''){
                    this.setState({editedTable:response, activeTable: response.id});
                    this.toggleModal(action,0);
                }
            });
  }

    modalComponent(component) {
        const { config, tableMakerData, editedTable,activeTable } = this.state;
        switch(component) {
            case 0:
                return (<TableMaker id="table-maker" edited={editedTable} config={config} fields={tableMakerData}/>);
            case 1:
                return (<FilterMaker id="filter-maker" config={config}/>);
            case 2:
                return (<ExcludeList id="exclude-list" tableId={activeTable} api={config.server.api}/>);
            default:
                return (<div>---</div>);
        }
    }

    stockAction(stockId, action) {
        const { config,activeTable } = this.state;
        switch(action) {
            case 'remove':
                Utils.postJson(config.server.api.setExcludeList, {tableId:activeTable, exclude:stockId}).then(response => {
                console.log(response);
                this.getData();
            });
        }
    }

  render() {
    const { config, data, modal, tableMakerData, activeTable } = this.state;
    const configInit = !_.isEmpty(config);
    const tableInit = !_.isEmpty(tableMakerData);
    const dataInit = !_.isEmpty(data);

    return (
        <RiskLoader loading={!configInit}>
            <Modal isOpen={modal.isOpen} toggle={this.toggleModal} className="max">
                <ModalHeader toggle={this.toggleModal}>{modal.title}</ModalHeader>
                <ModalBody>
                    {this.modalComponent(modal.component)}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.toggleModal}>Do Something</Button>{' '}
                    <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
            <AppHeader>
                {dataInit && <Button color={data.errors.ace ? 'danger' : 'success'}>Ace</Button>}
            </AppHeader>
            {dataInit &&
            <main className="my-5 py-5">
                <Nav tabs>
                    { data.tables.map((table)=>{
                        const ta = config.server.api.tableAction;
                        return (<NavItem key={table.id}>
                                    <ContextMenuTrigger id={`nav-${table.id}`}>
                                            <NavLink className={classnames({ active: activeTable === table.id, 'pop-box': true})}
                                                     onClick={() => this.toggleTab(table.id)}>
                                                    <span>{table.name}</span>
                                            </NavLink>
                                    </ContextMenuTrigger>
                                    <ContextMenu id={`nav-${table.id}`} className="nav border border-dark bg-light flex-column p-3">
                                        <MenuItem className="nav-item"
                                                  onClick={() => this.tableAction(ta.url, table.id, ta.actions.copy)}>
                                            <a className="nav-link">
                                                <span><i className="fa fa-copy"/>Copy</span>
                                            </a>
                                        </MenuItem>
                                        <MenuItem className="nav-item"
                                                  onClick={() => this.toggleModal(`${table.name} Filters`,1)}>
                                            <a className="nav-link">
                                                <span><i className="fa fa-filter"/>Filter</span>
                                            </a>
                                        </MenuItem>
                                        <MenuItem className="nav-item"
                                                  onClick={() => this.toggleModal(`${table.name} Exclude List`,2)}>
                                            <a className="nav-link">
                                                <span><i className="fa fa-stream"/>Excludes</span>
                                            </a>
                                        </MenuItem>
                                        <MenuItem divider />
                                        <MenuItem className="nav-item"
                                                  onClick={() => this.tableAction(ta.url, table.id, ta.actions.get)}>
                                            <a className="nav-link">
                                                <i className="fa fa-cog"/> Settings
                                            </a>
                                        </MenuItem>
                                        <MenuItem divider />
                                        <MenuItem className="nav-item"
                                                  onClick={() => this.tableAction(ta.url, table.id, ta.actions.remove)}>
                                            <a className="nav-link">
                                                <i className="fa fa-times"/> Delete
                                            </a>
                                        </MenuItem>
                                    </ContextMenu>
                                </NavItem>)
                    })}
                    {configInit && tableInit &&
                    <NavItem>
                        <NavLink>
                            <Button className="rounded-circle" outline color="primary" onClick={() => this.toggleModal('Create new table', 'TableMaker')}>
                                <i className="fa fa-plus"/>
                            </Button>
                        </NavLink>
                    </NavItem>}
                </Nav>
                <TabContent activeTab={'0'}>
                    <TabPane tabId={'0'}>
                        <Container className="max">
                            <Row>
                                <Col xs={{ order: 1 }} md={{ size: 2 }} className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                    {<StockViewer  className="risk" stocks={data.risk} id="risk"/>}
                                </Col>
                                <Col xs={{ order: 2 }} md={{ size: 5 }} className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                    {<StockViewer  className="longs" stocks={data.long} id="longs"
                                                   onRowActionClicked={this.stockAction} reverse/>}
                                </Col>
                                <Col xs={{ order: 3 }} md={{ size: 5 }} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                                    {<StockViewer className="shorts" stocks={data.short} id="shorts"
                                                  onRowActionClicked={this.stockAction}/>}
                                </Col>
                            </Row>
                        </Container>
                    </TabPane>
                </TabContent>
            </main>}
        </RiskLoader>
    );
  }
}
