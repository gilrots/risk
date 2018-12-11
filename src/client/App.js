import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import './app.css';
import StockViewer from './components/stock-viewer/stock-viewer';
import AppHeader from "./components/header/app-header";
import {
    Container, Row, Col, Button, Modal, ModalBody, ModalFooter,
    ModalHeader, NavItem, Nav, TabContent, TabPane, Alert, Badge,
    UncontrolledTooltip
} from 'reactstrap';
import TableMaker from "./components/table-maker/table-maker";
import * as Utils from '../common/utils';
import FilterMaker from "./components/filter-maker/filter-maker";
import ExcludeList from "./components/exclude-list/exclude-list";
import RiskLoader from "./components/loader/loader";
import IntraDaysList from "./components/intra-days/intra-days-list";
import IPOList from "./components/ipo-list/ipo-list";
import RiskSettings from './components/settings/settings';
import { IconedMenu } from './components/func-components';
import {get,post} from "./helpers/client-utils"

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
            excludeMode: false,
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
        this.getTableMakerData();
        this.getData(() =>
            setInterval(() => {
                if (this.polling) {
                    this.getData();
                }
            }, config.app.updateInterval));
    }

    getTableMakerData = () => {
        get(api.getTableMakerData).then(tableMakerData => this.setState({tableMakerData}));
    };

    getData(callback) {
        const tableId = this.state.activeTable;
        console.log(tableId);
        get(api.getData, {tableId})
            .then((data) => {
                console.log(data);
                this.setState({data});
                if (callback) {
                    callback();
                }
            });
    }

    toggleModal(title, component) {
        this.setState(state =>
                state.modal.isOpen ?
                    {modal: {isOpen: false, title: '', component: undefined}} :
                    {modal: {isOpen: true, title: title, component: component}},
            () => {
                this.polling = !this.state.modal.isOpen
                if(this.polling){
                    this.getData();
                }
            });
    }

    toggleTab(activeTable) {
        if (this.state.activeTable !== activeTable) {
            this.setState({activeTable}, () => this.getData());
        }
    }

    tableAction(url, tableId, action, title) {
        get(url, {tableId, action})
            .then(response => {
                if (typeof response !== 'string' && response.id !== '') {
                    this.setState({editedTable: response, activeTable: response.id});
                    this.toggleModal(title, 0);
                }
            });
    }

    modalComponent(component) {
        const {tableMakerData, editedTable, activeTable} = this.state;
        switch (component) {
            case 0:
                return (<TableMaker id="table-maker" edited={editedTable} fields={tableMakerData}/>);
            case 1:
                return (<FilterMaker id="filter-maker"/>);
            case 2:
                return (<ExcludeList id="exclude-list" tableId={activeTable}/>);
            case 3:
                return (<IntraDaysList id="intradays" tableId={activeTable}/>);
            case 4:
                return (<IPOList id="ipos" tableId={activeTable}/>);
            case 5:
                return (<RiskSettings id="risk-settings"/>);
            default:
                return (<div>---</div>);
        }
    }

    stockAction(stockId, action) {
        const {activeTable} = this.state;
        switch (action) {
            case 'remove':
                post(api.setExcludeList, {tableId: activeTable, exclude: stockId}).then(response => {
                    console.log(response);
                    this.getData();
                });
        }
    }

    getTableActions = (table) => {
        return [{
            name: 'Duplicate',
            icon: 'copy',
            action: () => this.tableAction(ta.url, table.id, ta.actions.copy)
            },
            {
                name: 'Filter',
                icon: 'filter',
                action: () => this.toggleModal(`${table.name} Filters`, 1)
            },
            {
                name: 'Excludes',
                icon: 'stream',
                action: () => this.toggleModal(`${table.name} Exclude List`, 2)
            },
            {
                name: 'Settings',
                icon: 'cog',
                action: () => this.tableAction(ta.url, table.id, ta.actions.get, 'Table editor')
            },
            {
                name: 'Delete',
                icon: 'times',
                action: () => this.tableAction(ta.url, table.id, ta.actions.remove)
            },
            {
                name: 'Export',
                icon: 'file-excel',
                action: () => {}
            },
        ];
    };

    getNavMenuActions = () => {
        return [{
                name: 'IntraDay',
                icon: 'phone',
                action: () => this.toggleModal("IntraDay", 3)
            },
            {
                name: 'IPO',
                icon: 'plus',
                action: () => this.toggleModal("IPO", 4)
            },
            {
                name: 'Exclude Mode',
                icon: 'ban',
                action: () => this.setState(ps => ({excludeMode:!ps.excludeMode}))
            },
            {
                name: 'User Settings',
                icon: 'user-cog',
                action: () => this.toggleModal("Settings", 5)
            }
        ];
    };

    openTableMaker = (hasTableData) => {
        if(hasTableData) {
            this.toggleModal('Create new table', 0);
        }
        else {
            this.getTableMakerData();
        }
    };

    render() {
        const {data, modal, tableMakerData, excludeMode, activeTable} = this.state;
        const hasTableData = !_.isEmpty(tableMakerData);
        const hasData = !_.isEmpty(data) && data.tables && data.short && data.long && data.risk;
        const hasLatency = !_.isEmpty(data) && data.latency;
        const navItems = this.getNavMenuActions();
        return <Fragment>
            <Modal isOpen={modal.isOpen} toggle={this.toggleModal} className="max">
                <ModalHeader toggle={this.toggleModal}>{modal.title}</ModalHeader>
                <ModalBody id="risk-modal-body">
                    {this.modalComponent(modal.component)}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.toggleModal}>Do Something</Button>{' '}
                    <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
        <AppHeader>
                <Fragment>
                    {hasLatency && data.latency.map(badge =>
                        <NavItem key={badge.name} className="d-flex align-items-center mr-1">
                            <Badge id={`${badge.name}-indication`} color={badge.error ? 'danger' : 'success'}>{badge.name}</Badge>
                           {badge.message && <UncontrolledTooltip placement="bottom" target={`${badge.name}-indication`}>
                                {badge.message}
                            </UncontrolledTooltip>}
                        </NavItem>
                    )}
                </Fragment>
                <IconedMenu items={navItems} title="Menu"/>
            </AppHeader>
            <RiskLoader loading={!hasData}>
                {hasData && <main className="my-5 py-5">
                    <Nav tabs>
                        {data.tables.map((table) =>
                        <IconedMenu key={table.id} items={this.getTableActions(table)} 
                        title={table.name} active={table.id === activeTable}
                        menuClick={() => {this.setState({activeTable:table.id});this.toggleTab(table.id)}} />)}
                        <NavItem>
                            <Button className="rounded-circle mx-2" outline color="primary"
                                    onClick={() => this.openTableMaker(hasTableData)}>
                                <i className={`fa fa-${hasTableData ? 'plus' : 'sync-alt'}`}/>
                            </Button>
                        </NavItem>
                    </Nav>
                    <TabContent activeTab={'0'} className="jumbo">
                        <TabPane tabId={'0'}>
                            <Container className="max">
                                <Row className="justify-content-center">
                                    <Alert color="warning" className="m-2" isOpen={excludeMode}>Exclude Mode On</Alert>
                                </Row>
                                <Row>
                                    <Col xs={{order: 1}} md={{size: 2}}
                                         className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                        {<StockViewer className="risk" 
                                         stocks={data.risk} id="risk"/>}
                                    </Col>
                                    <Col xs={{order: 2}} md={{size: 5}}
                                         className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                        {<StockViewer id="longs" className="longs"
                                                      stocks={data.long}
                                                      excludeMode={excludeMode} 
                                                      onRowActionClicked={this.stockAction} reverse/>}
                                    </Col>
                                    <Col xs={{order: 3}} md={{size: 5}} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                                        {<StockViewer id="shorts" className="shorts"
                                                      stocks={data.short}
                                                      excludeMode={excludeMode} 
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
