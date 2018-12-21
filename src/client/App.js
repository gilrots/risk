import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import StockViewer from './components/stock-viewer/stock-viewer';
import {FormattersFuncs} from "./components/stock-viewer/formatters";
import AppHeader from "./components/header/app-header";
import {
    Container, Row, Col, Button, Modal, ModalBody, ModalFooter,
    ModalHeader, NavItem, Nav, TabContent, TabPane, Alert, Badge,
    UncontrolledTooltip
} from 'reactstrap';
import SweetAlert from 'react-bootstrap-sweetalert';
import TableMaker from "./components/table-maker/table-maker";
import FilterMaker from "./components/filter-maker/filter-maker";
import ExcludeList from "./components/exclude-list/exclude-list";
import RiskLoader from "./components/loader/loader";
import IntraDaysList from "./components/intra-days/intra-days-list";
import IPOList from "./components/ipo-list/ipo-list";
import RiskSettings from './components/settings/settings';
import { IconedMenu } from './components/func-components';
import {get,post,exportCSV, setPolling, logout} from "./helpers/client-utils"

const config = require('../common/config');
const api = config.server.api;
const ta = api.tableAction;

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {},
            activeTable: undefined,
            tableMakerData: {},
            editedTable: {},
            excludeMode: false,
            modal: {
                isOpen: false,
                newTable: false,
            },
            alert: {}
        };
        this.polling = true;
        this.toggleModal = this.toggleModal.bind(this);
        this.toggleAlert = this.toggleAlert.bind(this);
        this.toggleTab = this.toggleTab.bind(this);
        this.tableAction = this.tableAction.bind(this);
        this.modalComponent = this.modalComponent.bind(this);
        this.stockAction = this.stockAction.bind(this);
    }

    componentDidMount() {
        this.getTableMakerData();
        this.getData(() => {
            const intId = setInterval(() => {
                if (this.polling) {
                    this.getData();
                }
            }, config.app.updateInterval);
            setPolling(intId);
        });
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
                if(!tableId){
                    const activeTable = _.get(data, "tables[0].id", undefined);
                    this.setState({activeTable});
                }
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

    toggleAlert(alert = {}){
        this.setState({alert});
    }

    toggleTab(activeTable) {
        if (this.state.activeTable !== activeTable) {
            this.setState({activeTable}, () => this.getData());
        }
    }

    tableAction(url, tableId, action, title) {
        get(url, {tableId, action})
            .then(result => {
                console.log(result);
                if(_.isEmpty(result.error)){
                    switch(action){
                        case ta.actions.get:
                        case ta.actions.copy:
                            if(result.id){
                                this.setState({editedTable: result, activeTable: result.id},
                                    () => this.toggleModal(title, 0));
                            }
                            break;
                        case ta.actions.remove:
                            this.setState({editedTable: {}, activeTable: _.get(this.state,"data.tables[0].id",undefined)});
                            break;
                    }
                }
            });
    }

    modalComponent(component) {
        const {tableMakerData, editedTable, activeTable} = this.state;
        const res = {
            child: undefined,
            component: undefined
        };
        const onAlert = this.toggleAlert;
        const ref = c => res.child = c;
        switch (component) {
            case 0:
                res.component = <TableMaker id="table-maker" ref={ref} edited={editedTable} fields={tableMakerData} onAlert={onAlert}/>;
                break;
            case 1:
                res.component = <FilterMaker id="filter-maker" ref={ref} onAlert={onAlert}/>;
                break;
            case 2:
                res.component = <ExcludeList id="exclude-list" ref={ref} tableId={activeTable} onAlert={onAlert}/>;
                break;
            case 3:
                res.component = <IntraDaysList id="intradays" ref={ref} tableId={activeTable} onAlert={onAlert}/>;
                break;
            case 4:
                res.component = <IPOList id="ipos" ref={ref} tableId={activeTable} onAlert={onAlert}/>;
                break;
            case 5:
                res.component = <RiskSettings id="risk-settings" ref={ref} onAlert={onAlert}/>;
                break;
            default:
                res.component = <div>---</div>;
        }

        return res;
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
                name: 'Edit',
                icon: 'edit',
                action: () => this.tableAction(ta.url, table.id, ta.actions.get, 'Table editor')
            },
            {
                name: 'Delete',
                icon: 'times',
                action: () => this.toggleAlert({ title: 'Delete table?',
                    message: ' ', type: 'warning', showCancel: true,
                    onConfirm: () => this.tableAction(ta.url, table.id, ta.actions.remove) })
            },
            {
                name: 'Export',
                icon: 'file-excel',
                action: () => { 
                    if(this.hasData(this.state.data)) {
                        const {risk,long,short,tables} = this.state.data;
                        const name = tables.find(t=>t.id === this.state.activeTable).name
                        exportCSV(name,
                                  [{name:'RISK', table:risk},
                                   {name:'LONGS', table:long},
                                   {name:'SHORTS', table:short}], FormattersFuncs);
                    }
                }
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
            },
            {
                name: 'Sign out',
                icon: 'sign-out-alt',
                action: () => logout()
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

    hasData = (data) => {
        return !_.isEmpty(data) && data.tables && data.short && data.long && data.risk;
    };

    render() {
        const {data, modal, tableMakerData, excludeMode, activeTable, alert} = this.state;
        const hasTableData = !_.isEmpty(tableMakerData);
        const hasData = this.hasData(data);
        const hasLatency = !_.isEmpty(data) && data.latency;
        const navItems = this.getNavMenuActions();
        const modalBody = this.modalComponent(modal.component);
        return <Fragment>
            {!_.isEmpty(alert.message) && 
            <SweetAlert title={alert.title} type={alert.type} showCancel={alert.showCancel}
            onConfirm={() => {_.invoke(alert, 'onConfirm'); this.toggleAlert();}} 
            onCancel={this.toggleAlert}>
                {alert.message}
            </SweetAlert>}
            <Modal isOpen={modal.isOpen} toggle={this.toggleModal} className="max">
                <ModalHeader toggle={this.toggleModal}>{modal.title}</ModalHeader>
                <ModalBody id="risk-modal-body">
                    {modalBody.component}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => modalBody.child.save()}>Save</Button>{' '}
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
                <IconedMenu items={navItems} title="Menu" split={false}/>
            </AppHeader>
            <RiskLoader loading={!hasData}>
                {hasData && <main className="my-5 py-5">
                    <Nav tabs>
                        {data.tables.map((table) =>
                        <IconedMenu key={table.id} items={this.getTableActions(table)} 
                        title={table.name} active={table.id === activeTable} split={true}
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
                                        {<StockViewer className="risk" formatsCells={true} 
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
