import React, { Fragment } from 'react';
import _ from 'lodash';
import { Container, Row, Col, Input, InputGroup, InputGroupAddon, InputGroupText, ButtonGroup, Button, Badge } from "reactstrap";
import PropTypes from "prop-types";
import SearchDropdown from "../search-dropdown/search-dropdown";
import {post} from "../../helpers/client-utils"
const api = require('../../../common/config').server.api;

const defaults = {
    param: { source: "ace", item: { id: "name" } },
    agg: { key: '', exp: '' },
    cols: undefined,
    risk: undefined
};
defaults.cols = { name: '', exp: '', params: [defaults.param], aggregations: [], format: undefined };
defaults.risk = { ...defaults.cols, isGeneral: true, order: 0 };

class TableMaker extends React.Component {
    static propTypes = {
        edited: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        const data = _.isEmpty(props.edited) ? { name: '', id: '', cols: [], risk: [] } : props.edited;
        this.state = { ...data, riskMode: false, selectedColIndex: 0 };
        this.sources = ['ace', 'bank', 'stock'];
    }

    componentDidMount() {
        console.log(this.props.edited);
        if (_.isEmpty(this.props.edited)) {
            this.addCol();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEmpty(nextProps.edited)) {
            const { id, name, cols, risk } = nextProps.edited;
            this.setState({id, name, cols, risk });
        }
    }

    whichCols = () => this.state.riskMode ? "risk" : "cols";

    setColData = (colIndex, colField, value, secIndex, secField) => {
        let assignVal = value;
        const cols = this.whichCols();
        if (secIndex !== undefined) {
            const arr = this.state[cols][colIndex][colField];
            assignVal = arr.map((val, index) => (index === secIndex ? (secField !== undefined ? Object.assign({}, val, { [secField]: value }) : value) : val));
        }

        this.setState(pervState => ({
            [cols]: pervState[cols].map((col, index) => (index === colIndex ? Object.assign({}, col, { [colField]: assignVal }) : col))
        }));
    }

    deleteElement = (arr, index, keepOne = true) => {
        let deleted = [...arr];
        if (deleted.length > 1 || !keepOne) {
            deleted.splice(index, 1);
        }
        return deleted;
    }

    addCol = () => {
        const cols = this.whichCols();
        this.setState(pervState => ({
            [cols]: [...pervState[cols], defaults[cols]],
            selectedColIndex: pervState[cols].length
        }));
    }

    deleteCol = (e, colIndex) => {
        e.stopPropagation();
        const cols = this.whichCols();
        this.setState(pervState => {
            let deleted = [...pervState[cols]];
            if (deleted.length > 1) {
                deleted.splice(colIndex, 1);
            }
            const selectedColIndex = Math.max(0, colIndex - 1);
            return { selectedColIndex, [cols]: deleted };
        });
    }

    createTable = () => {
        const {id, name, cols, risk} = this.state
        post(api.createTable, {data:{id, name, cols, risk}}).
            then(result => console.log('Success:', result));
    }

    save() {
       this.createTable();
    }

    render() {
        const { name, selectedColIndex, riskMode } = this.state;
        const tabAct = _.isEmpty(this.state.id) ? 'Create Table' : 'Update Table';
        const cols = this.state[this.whichCols()];
        let col = _.get(cols, selectedColIndex.toString(), undefined);
        let index = selectedColIndex;
        if (!col) {
            col = _.get(cols, '0', undefined);
            index = 0;
        }

        const { bank, ace } = this.props.fields;
        const { sources } = this;
        const getItems = (source, colName) => {
            switch (source) {
                case sources[0]: return ace;
                case sources[1]: return bank;
                case sources[2]: return this.state.cols.map(c => ({ name: c.name, id: c.name })).filter(c => c.name !== colName);
                default: return [];
            }
        };
        return (
            <Container>
                <Row className="my-2">
                    <Col>
                        <InputGroup>
                            <InputGroupAddon addonType="prepend">
                                <InputGroupText>Table's name</InputGroupText>
                            </InputGroupAddon>
                            <Input value={name} placeholder="New Table..." onChange={e => this.setState({ name: e.target.value })} />
                        </InputGroup>
                    </Col>
                </Row>
                <h6 className="align-self-center">Columns:</h6>
                <Row className="group-box p-2 mb-2">
                    <Col>
                        <Container>
                            <Row>
                                <Col>
                                    <h6 className="mr-3 align-self-center">Type:</h6>
                                    <ButtonGroup>
                                        <Button color="success" active={!riskMode} onClick={() => this.setState({ riskMode: false })}>Table</Button>
                                        <Button color="success" active={riskMode} onClick={() => this.setState({ riskMode: true })}>Risk</Button>
                                    </ButtonGroup>
                                </Col>
                            </Row>
                            <Row className="my-2">
                                <Col>
                                    {cols.map((col, colIndex) =>
                                        <Button key={colIndex} className="mr-2 pop-box" color="primary" active={colIndex === index}
                                            onClick={() => this.setState({ selectedColIndex: colIndex })}>{col.name ? col.name : `Col ${colIndex}`}
                                            <Badge className="ml-2 pop-item" color="danger" onClick={(e) => this.deleteCol(e, colIndex)} disabled={cols.length < 2}><i className="fa fa-times" /></Badge>
                                        </Button>)}
                                </Col>
                                <Col xs="auto">
                                    <Button color="primary" outline className="rounded-circle" onClick={() => this.addCol()}><i className="fa fa-plus" /></Button>
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
                <h6 className="align-self-center">Selected Column:</h6>
                <Row className="group-box p-2">
                    <Col>
                        {col ? <Container>
                            <Row className="my-3">
                                <Col>
                                    <InputGroup>
                                        <InputGroupAddon addonType="prepend">
                                            <InputGroupText>Name</InputGroupText>
                                        </InputGroupAddon>
                                        <Input value={col.name} placeholder="New Column..." onChange={e => this.setColData(index, 'name', e.target.value)} />
                                    </InputGroup>
                                </Col>
                                {riskMode &&
                                    <Col xs="auto">
                                        <InputGroup>
                                            <InputGroupAddon addonType="prepend">
                                                <InputGroupText>Order</InputGroupText>
                                            </InputGroupAddon>
                                            <Input value={col.order} type="number"
                                             onChange={e => this.setColData(index, 'order', e.target.value)} />
                                        </InputGroup>
                                    </Col>
                                }
                            </Row>
                            <Row className="my-1">
                                <Col>
                                    <Button color="success">Params</Button>{' '}
                                </Col>
                                <Col xs="auto">
                                    <Button color="success" outline className="rounded-circle"
                                        onClick={() => this.setColData(index, 'params', [...col.params, defaults.param])}>
                                        <i className="fa fa-plus" />
                                    </Button>
                                </Col>
                            </Row>
                            {col.params.map((param, parIndex) => (
                                <Row key={parIndex} className="my-1 hover-box">
                                    <Col xs="auto" className="align-self-center">
                                        X{parIndex}:
                                    </Col> {' '}
                                    <Col xs="auto">
                                        <ButtonGroup>
                                            {sources.map(source => (
                                                <Button color="success" key={source}
                                                    onClick={() => this.setColData(index, 'params', { source: source, item: getItems(source, col.name)[0] }, parIndex)}
                                                    disabled={getItems(source, col.name).length === 0}
                                                    active={param.source === source}>{_.startCase(source)}</Button>
                                            ))}
                                        </ButtonGroup>
                                    </Col>
                                    <Col>
                                        <SearchDropdown id={`items-dropdown-${parIndex}`} items={getItems(param.source, col.name)} selectedId={param.item.id}
                                            onSelected={item => this.setColData(index, 'params', item, parIndex, 'item')} />
                                    </Col>
                                    <Col xs="auto" className="align-self-center">
                                        <Button color="danger" className="hover-item rounded-circle" outline disabled={col.params.length < 2}
                                            onClick={() => this.setColData(index, 'params', this.deleteElement(col.params, parIndex))} >
                                            <i className="fa fa-times" />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Row className="my-3">
                                <Col className="align-self-center">
                                    <Button color={col.aggregations.length > 0 ? 'info' : 'secondary'}
                                        disabled={col.aggregations.length > 0} onClick={() => this.setColData(index, 'aggregations', [defaults.agg])}>Aggregations</Button>
                                </Col>
                                <Col xs="auto" className="align-self-center">
                                    <Button disabled={col.aggregations.length === 0} color="info" outline className="rounded-circle"
                                        onClick={() => this.setColData(index, 'aggregations', [...col.aggregations, defaults.agg])}>
                                        <i className="fa fa-plus" />
                                    </Button>
                                </Col>
                            </Row>
                            {col.aggregations.map((agg, aggIndex) => (
                                <Row key={aggIndex} className="my-1 hover-box">
                                    <Col xs="auto" className="align-self-center">
                                        Y{aggIndex}:
                                    </Col> {' '}
                                    <Col>
                                        <Input value={agg.key} placeholder="Aggregation's key"
                                            onChange={e => this.setColData(index, 'aggregations', e.target.value, aggIndex, 'key')} />
                                    </Col>
                                    <Col>
                                        <InputGroup>
                                            <InputGroupAddon addonType="prepend">SUM</InputGroupAddon>
                                            <Input value={agg.exp} placeholder="Aggregation's expression"
                                                onChange={e => this.setColData(index, 'aggregations', e.target.value, aggIndex, 'exp')} />
                                        </InputGroup>
                                    </Col>
                                    <Col xs="auto" className="align-self-center">
                                        <Button className="hover-item rounded-circle" color="danger" outline
                                            onClick={() => this.setColData(index, 'aggregations', this.deleteElement(col.aggregations, aggIndex, false))}>
                                            <i className="fa fa-times" />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Row className="my-3">
                                <Col>
                                    <InputGroup>
                                        <InputGroupAddon addonType="prepend">
                                            <InputGroupText>Final Expression</InputGroupText>
                                        </InputGroupAddon>
                                        <Input value={col.exp} placeholder="Expression..." onChange={e => this.setColData(index, 'exp', e.target.value)} />
                                    </InputGroup>
                                </Col>
                            </Row>
                        </Container> : "Choose column to view or edit"}
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default TableMaker;
