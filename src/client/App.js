import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import './app.css';
import StockViewer from './components/stock-viewer/stock-viewer';
import AppHeader from "./components/header/app-header";
import {
    Container, Row, Col, Button, Modal, ModalBody, ModalFooter,
    ModalHeader, NavItem, Nav, TabContent, TabPane, NavLink, Badge,
    UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import TableMaker from "./components/table-maker/table-maker";
import * as Utils from '../common/utils';
import FilterMaker from "./components/filter-maker/filter-maker";
import ExcludeList from "./components/exclude-list/exclude-list";
import RiskLoader from "./components/loader/loader";
import IntraDaysList from "./components/intra-days/intra-days-list";
import IPOList from "./components/ipo-list/ipo-list";

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
        this.getTableMakerData();
        this.getData(() =>
            setInterval(() => {
                if (this.polling) {
                    this.getData();
                }
            }, config.app.updateInterval));
    }

    getTableMakerData = () => {
        Utils.fetchJson(api.getTableMakerData).then(tableMakerData => this.setState({tableMakerData}));
    };

    getData(callback) {
        const tableId = this.state.activeTable;
        console.log(tableId);

        Utils.fetchJson(api.getData, {tableId})
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
            });
    }

    toggleTab(activeTable) {
        if (this.state.activeTable !== activeTable) {
            this.setState({activeTable}, () => this.getData());
        }
    }

    tableAction(url, tableId, action) {
        Utils.fetchJson(url, {tableId, action})
            .then(response => {
                if (typeof response !== 'string' && response.id !== '') {
                    this.setState({editedTable: response, activeTable: response.id});
                    this.toggleModal(action, 0);
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
            default:
                return (<div>---</div>);
        }
    }

    stockAction(stockId, action) {
        const {activeTable} = this.state;
        switch (action) {
            case 'remove':
                Utils.postJson(api.setExcludeList, {tableId: activeTable, exclude: stockId}).then(response => {
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
                action: () => this.tableAction(ta.url, table.id, ta.actions.get)
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

    getSystemIndication = (data) => {
        return data && data.errors ? [{
            name: 'Ace',
            ok: data.errors.ace,
            tooltip: ''
            },{
            name: 'U-Bank',
            ok: data.errors.ubank,
            tooltip: ''
            },{
            name: 'פועלים',
            ok: data.errors.poalim,
            tooltip: ''
            },{
            name: 'איגוד',
            ok: data.errors.igud,
            tooltip: ''
            },
        ] : [];
    };

    openTableMaker = (hasTableData) => {
        if(hasTableData) {
            this.toggleModal('Create new table', 'TableMaker');
        }
        else {
            this.getTableMakerData();
        }
    };

    render() {
        const {data, modal, tableMakerData} = this.state;
        const hasTableData = !_.isEmpty(tableMakerData);
        const hasData = !_.isEmpty(data) && data && data.errors && data.errors.ace !== true;
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
                {this.getSystemIndication(data).map(badge =>
                    <NavItem key={badge.name} className="d-flex align-items-center mr-1">
                        <Badge color={badge.ok ? 'danger' : 'success'}>{badge.name}</Badge>
                    </NavItem>
                )}
                <NavItem className="d-flex align-items-center" onClick={() => this.toggleModal("IntraDay", 3)}>
                    <NavLink className="font-weight-bold">IntraDay</NavLink>
                </NavItem>
                <NavItem className="d-flex align-items-center" onClick={() => this.toggleModal("IPO", 4)}>
                    <NavLink className="font-weight-bold">IPO</NavLink>
                </NavItem>
            </AppHeader>
            <RiskLoader loading={!hasData}>
                {hasData && <main className="my-5 py-5">
                    <Nav tabs>
                        {data.tables.map((table) =>
                            <UncontrolledDropdown key={table.id} className="d-flex align-items-center" nav inNavbar
                                                  onClick={() => this.toggleTab(table.id)}>
                                <DropdownToggle className="font-weight-bold" nav caret>{table.name}</DropdownToggle>
                                <DropdownMenu right>
                                    {this.getTableActions(table).map(item =>
                                        <DropdownItem key={item.name} onClick={item.action}>
                                            <i className={`fa fa-${item.icon} mr-2`}/>{item.name}
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        )}
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
                                <Row>
                                    <Col xs={{order: 1}} md={{size: 2}}
                                         className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
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
