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
const config = require('../common/config');
const api = config.server.api;
const ta = api.tableAction;

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        data: {},
        activeTable: config.app.defaultTable.id,
        tableMakerData: {},
        editedTable: {},
        modal: {
            isOpen: false,
            newTable: false
        },
    };
    this.polling = true;
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleTab = this.toggleTab.bind(this);
    this.tableAction = this.tableAction.bind(this);
    this.modalComponent = this.modalComponent.bind(this);
    this.stockAction = this.stockAction.bind(this);
  }

  componentDidMount() {
    Utils.fetchJson(api.getTableMakerData)
        .then(tableMakerData => this.setState({tableMakerData}));
    this.getData(() =>
        setInterval(() => {
            if (this.polling) {
                this.getData();
            }
        }, config.app.updateInterval));
  }

  getData(callback) {
      const tableId = this.state.activeTable;
      console.log(tableId);

      Utils.fetchJson(api.getData,{tableId})
          .then((data) => {
              console.log(data);
              this.setState({ data });
              if(callback) {
                  callback();
              }
          });
  }

  toggleModal(title,component){
    this.setState(state =>
        state.modal.isOpen ?
            {modal: {isOpen: false, title: '', component: undefined}} :
            {modal: {isOpen: true,  title: title,  component: component}},
        () => { this.polling = !this.state.modal.isOpen});
  }

  toggleTab(activeTable) {
    if (this.state.activeTable !== activeTable) {
        this.setState({activeTable},() => this.getData());
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
        const { tableMakerData, editedTable,activeTable } = this.state;
        switch(component) {
            case 0:
                return (<TableMaker id="table-maker" edited={editedTable} fields={tableMakerData}/>);
            case 1:
                return (<FilterMaker id="filter-maker"/>);
            case 2:
                return (<ExcludeList id="exclude-list" tableId={activeTable}/>);
            default:
                return (<div>---</div>);
        }
    }

    stockAction(stockId, action) {
        const { activeTable } = this.state;
        switch(action) {
            case 'remove':
                Utils.postJson(api.setExcludeList, {tableId:activeTable, exclude:stockId}).then(response => {
                console.log(response);
                this.getData();
            });
        }
    }

  render() {
    const { data, modal, tableMakerData, activeTable } = this.state;
    const hasTableData = !_.isEmpty(tableMakerData);
    const hasData = !_.isEmpty(data);
    return <Fragment>
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
              {hasData && <Button color={data.errors.ace ? 'danger' : 'success'}>Ace</Button>}
          </AppHeader>
          <RiskLoader loading={!hasData}>
              {hasData && <main className="my-5 py-5">
                  <Nav tabs>
                      {data.tables.map((table) =>
                          <NavItem key={table.id}>
                              <ContextMenuTrigger id={`nav-${table.id}`}>
                                  <NavLink className={classnames({active: activeTable === table.id, 'pop-box': true})}
                                           onClick={() => this.toggleTab(table.id)}>
                                      <span>{table.name}</span>
                                  </NavLink>
                              </ContextMenuTrigger>
                              <ContextMenu id={`nav-${table.id}`}
                                           className="nav border border-dark bg-light flex-column p-3">
                                  <MenuItem className="nav-item"
                                            onClick={() => this.tableAction(ta.url, table.id, ta.actions.copy)}>
                                      <a className="nav-link">
                                          <span><i className="fa fa-copy"/>Copy</span>
                                      </a>
                                  </MenuItem>
                                  <MenuItem className="nav-item"
                                            onClick={() => this.toggleModal(`${table.name} Filters`, 1)}>
                                      <a className="nav-link">
                                          <span><i className="fa fa-filter"/>Filter</span>
                                      </a>
                                  </MenuItem>
                                  <MenuItem className="nav-item"
                                            onClick={() => this.toggleModal(`${table.name} Exclude List`, 2)}>
                                      <a className="nav-link">
                                          <span><i className="fa fa-stream"/>Excludes</span>
                                      </a>
                                  </MenuItem>
                                  <MenuItem divider/>
                                  <MenuItem className="nav-item"
                                            onClick={() => this.tableAction(ta.url, table.id, ta.actions.get)}>
                                      <a className="nav-link">
                                          <i className="fa fa-cog"/> Settings
                                      </a>
                                  </MenuItem>
                                  <MenuItem divider/>
                                  <MenuItem className="nav-item"
                                            onClick={() => this.tableAction(ta.url, table.id, ta.actions.remove)}>
                                      <a className="nav-link">
                                          <i className="fa fa-times"/> Delete
                                      </a>
                                  </MenuItem>
                              </ContextMenu>
                          </NavItem>
                      )}
                      {hasTableData &&
                      <NavItem>
                          <NavLink>
                              <Button className="rounded-circle" outline color="primary"
                                      onClick={() => this.toggleModal('Create new table', 'TableMaker')}>
                                  <i className="fa fa-plus"/>
                              </Button>
                          </NavLink>
                      </NavItem>}
                  </Nav>
                  <TabContent activeTab={'0'}>
                      <TabPane tabId={'0'}>
                          <Container className="max">
                              <Row>
                                  <Col xs={{order: 1}} md={{size: 2}} className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                      {<StockViewer className="risk" stocks={data.risk} id="risk"/>}
                                  </Col>
                                  <Col xs={{order: 2}} md={{size: 5}}
                                       className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                      {<StockViewer className="longs" stocks={data.long} id="longs"
                                                    onRowActionClicked={this.stockAction} reverse/>}
                                  </Col>
                                  <Col xs={{order: 3}} md={{size: 5}} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                                      {<StockViewer className="shorts" stocks={data.short} id="shorts"
                                                    onRowActionClicked={this.stockAction}/>}
                                  </Col>
                              </Row>
                          </Container>
                      </TabPane>
                  </TabContent>
              </main>}
          </RiskLoader>
      </Fragment>;
  }
}
