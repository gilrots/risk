import React from 'react';
import _ from 'lodash';
import {Container, Row, Col, Input,InputGroup,InputGroupAddon,InputGroupText, ButtonGroup,Button,Badge} from "reactstrap";
import PropTypes from "prop-types";
import SearchDropdown from "../search-dropdown/search-dropdown";

class TableMaker extends React.Component {
    static propTypes = {
        config: PropTypes.object.isRequired,
    };

    constructor(props, context) {
        super(props, context)
        this.setName = this.setName.bind(this);
        this.addCol = this.addCol.bind(this);
        this.deleteCol = this.deleteCol.bind(this);
        this.setColData = this.setColData.bind(this);
        this.createTable = this.createTable.bind(this);
        this.state = {name:'', cols:[], risk:[] , selectedColIndex:0 };
        this.defaultParam = {source: "ace", item: this.props.fields.ace.find(x=>x.id = "Symbol")};
        this.defaultAgg = {key: '', exp: ''};
        this.defaultCol = {name: '', exp: '', params: [this.defaultParam], aggregations: [], format: undefined};
        this.sources = ['Ace', 'Bank', 'Stock'];
        this.sourcesLower = this.sources.map(x=>x.toLowerCase());
    }

    componentDidMount() {
        //fetch(config.api.getTableFilterData).then(res=> res.json()).then(json =>{});
        this.addCol();
    }

    componentWillReceiveProps(nextProps) {
    }

    setName(newName){
        this.setState({name:newName})
    }

    setColData(colIndex, colField, value, secIndex, secField){
        let assignVal = value;
        if(secIndex !== undefined) {
            const arr = this.state.cols[colIndex][colField];
            assignVal = arr.map((val, index) => (index === secIndex ? (secField !== undefined ? Object.assign({}, val, {[secField]:value}): value) : val));
        }

        this.setState(pervState => ({
            cols: pervState.cols.map((col, index) => (index === colIndex ? Object.assign({}, col, {[colField]:assignVal}) : col))
        }));
    }


    deleteElement(arr, index, keepOne = true){
        let deleted = [...arr];
        if(deleted.length > 1 || !keepOne) {
            deleted.splice(index,1);
        }
        return deleted;
    }

    addCol() {
        this.setState(pervState => ({
            cols: [...pervState.cols, this.defaultCol],
            selectedColIndex: pervState.cols.length
        }));
    }

    deleteCol(colIndex){
        this.setState(pervState => {
            let cols = [...pervState.cols];
            if(cols.length > 1) {
                cols.splice(colIndex,1);
            }
            return {cols: cols, selectedColIndex: Math.max(0,colIndex - 1)};
        });
    }

    createTable(){
        fetch(this.props.config.server.api.createTable, {
            method: 'POST', // or 'PUT'
            body: JSON.stringify(this.state), // data can be `string` or {object}!
            headers:{
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
            .then(response => console.log('Success:', JSON.stringify(response)))
            .catch(error => console.error('Error:', error));
    }

    render() {
        const {name, cols, selectedColIndex} = this.state;
        const col = cols[selectedColIndex];
        if(col === undefined)
            return ('');

        const index = selectedColIndex;
        const {bank, ace} = this.props.fields;
        const {defaultParam,defaultAgg, sources, sourcesLower} = this;
        const getItems = (source, colName) => {
            switch (source) {
                case sourcesLower[0]: return ace;
                case sourcesLower[1]: return bank;
                case sourcesLower[2]: return cols.filter(c => c.name !== colName).map(c => ({name:c.name, id:c.name}));
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
                            <Input value={name} placeholder="New Table..." onChange={e => this.setName(e.target.value)}/>
                        </InputGroup>
                    </Col>
                </Row>
                <Row className="my-2">
                    <Col className="align-self-center">
                        {cols.map((col, colIndex) => (
                            <Button key={colIndex} className="mr-2 pop-box" color="primary" active={colIndex === selectedColIndex}
                                    onClick={() => this.setState({selectedColIndex:colIndex})}>{col.name ? col.name : `Col${colIndex}`}
                                <Badge className="ml-2 pop-item" color="danger" onClick={() => this.deleteCol(colIndex)} disabled={cols.length < 2}><i className="fa fa-times"></i></Badge>
                            </Button>
                        ))}
                    </Col>
                    <Col xs="auto" className="align-self-center">
                        <Button color="primary" onClick={() => this.addCol()}><i className="fa fa-plus"></i></Button>
                    </Col>
                </Row>
                <Row className="group-box p-2">
                    <Col>
                        <Container>
                            <Row className="my-3">
                                <Col>
                                    <InputGroup>
                                        <InputGroupAddon addonType="prepend">
                                            <InputGroupText>Column's name</InputGroupText>
                                        </InputGroupAddon>
                                        <Input value={col.name} placeholder="New Column..." onChange={e => this.setColData(index,'name',e.target.value)}/>
                                    </InputGroup>
                                </Col>
                            </Row>
                            <Row className="my-1">
                                <Col>
                                    <Button color="success">Params</Button>{' '}
                                </Col>
                                <Col xs="auto">
                                    <Button color="success" onClick={() => this.setColData(index, 'params', [...col.params, defaultParam])}>
                                        <i className="fa fa-plus"></i>
                                    </Button>
                                </Col>
                            </Row>
                            {col.params.map((param, parIndex) => (
                                <Row  key={parIndex} className="my-1 hover-box">
                                    <Col xs="auto"  className="align-self-center">
                                        X{parIndex}:
                                    </Col> {' '}
                                    <Col xs="auto">
                                        <ButtonGroup>
                                            {sources.map((source, srcIndex) => (
                                                <Button color="success" key={source}
                                                        onClick={() => this.setColData(index, 'params', {source:sourcesLower[srcIndex], item:getItems(sourcesLower[srcIndex], col.name)[0]}, parIndex)}
                                                        disabled={getItems(sourcesLower[srcIndex], col.name).length === 0}
                                                        active={param.source === sourcesLower[srcIndex]}>{source}</Button>
                                            ))}
                                        </ButtonGroup>
                                    </Col>
                                    <Col>
                                        <SearchDropdown id="items-dropdown" items={getItems(param.source, col.name)} selected={param.item}
                                                        onSelected={item => this.setColData(index, 'params', item, parIndex,'item')}/>
                                    </Col>
                                    <Col xs="auto" className="align-self-center">
                                        <Button color="danger" className="hover-item" disabled={col.params.length < 2}
                                                onClick={() => this.setColData(index, 'params', this.deleteElement(col.params, parIndex))} >
                                            <i className="fa fa-trash"></i>
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Row className="my-3">
                                <Col className="align-self-center">
                                    <Button color={col.aggregations.length > 0 ? 'info':'secondary'}
                                            disabled={col.aggregations.length > 0} onClick={()=>this.setColData(index, 'aggregations', [defaultAgg])}>Aggregations</Button>
                                </Col>
                                <Col xs="auto" className="align-self-center">
                                    <Button  disabled={col.aggregations.length === 0} color="info"
                                             onClick={() => this.setColData(index, 'aggregations', [...col.aggregations, defaultAgg])}>
                                        <i className="fa fa-plus"></i>
                                    </Button>
                                </Col>
                            </Row>
                            {col.aggregations.map((agg, aggIndex) => (
                                <Row  key={aggIndex} className="my-1 hover-box">
                                    <Col xs="auto"  className="align-self-center">
                                        Y{aggIndex}:
                                    </Col> {' '}
                                    <Col>
                                        <Input value={agg.key} placeholder="Aggregation's key"
                                               onChange={e => this.setColData(index,'aggregations',e.target.value, aggIndex, 'key')}/>
                                    </Col>
                                    <Col>
                                        <InputGroup>
                                            <InputGroupAddon addonType="prepend">ACC</InputGroupAddon>
                                            <Input value={agg.exp} placeholder="Aggregation's expression"
                                                   onChange={e => this.setColData(index,'aggregations',e.target.value, aggIndex, 'exp')}/>
                                        </InputGroup>
                                    </Col>
                                    <Col xs="auto" className="align-self-center">
                                        <Button className="hover-item" color="danger" onClick={() => this.setColData(index, 'aggregations', this.deleteElement(col.aggregations, aggIndex, false))}>
                                            <i className="fa fa-trash"></i>
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
                                        <Input value={col.exp} placeholder="Expression..." onChange={e => this.setColData(index,'exp',e.target.value)}/>
                                    </InputGroup>
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button color="primary" onClick={this.createTable}>Create</Button>{' '}
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default TableMaker;
