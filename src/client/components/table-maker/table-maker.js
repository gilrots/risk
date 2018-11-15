import React, {Fragment} from 'react';
import _ from 'lodash';
import {Container, Row, Col, Input, DropdownMenu, DropdownItem, DropdownToggle,UncontrolledDropdown, ButtonGroup,Button} from "reactstrap";
import PropTypes from "prop-types";

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
        this.fields = ['syn_diff', 'name', 'spread', 'amount', 'value'];
        this.actions = ['Bigger Than', 'Contains', 'Smaller Than', 'Starts With', 'Ends With'];
        this.operators = ['None', 'And', 'Or'];
        this.state = {name:'New table', cols:[], risk:[]};
    }

    componentDidMount() {
        //fetch(config.api.getTableFilterData).then(res=> res.json()).then(json =>{});
        this.addCol(this.operators[1]);
    }

    componentWillReceiveProps(nextProps) {
    }

    setName(newName){
        this.setState({newName})
    }

    setColData(predicateIndex, predicateField, value){
        console.log("pred change:",{"pred:":this.state.predicates[0],"index:":predicateIndex,"field:":predicateField,"value:":value});

        this.setState(pervState => ({
            predicates: pervState.predicates.map((predicate, index) => (index === predicateIndex ? Object.assign({}, predicate, {[predicateField]:value}) : predicate))
        }));
    }

    addCol(shouldAdd){
        if(shouldAdd !== this.operators[0]) {
            const newCol = {
                name: 'New Col',
                func: {
                    exp: '',
                    arguments: {
                        stock: [],
                        bank: [],
                        ace: []
                    },
                    aggregations: []
                },
                format: undefined
            };
            this.setState(pervState => ({
                cols: [...pervState.cols, newCol]
            }));
        }
    }

    deleteCol(predicateIndex){
        this.setState(pervState => {
            let predicates = [...pervState.predicates];
            if(predicates.length > 1) {
                predicates.splice(predicateIndex,1);
            }
            return {predicates};
        });
    }

    render() {
        const {name, cols} = this.state;
        const fields = this.fields;
        const actions = this.actions;
        const operators = this.operators;
        return (
            <Container>
                <Row>
                    <Col>
                        Name
                        <Input value={name} onChange={e => this.setName(e.target.value)}/>
                    </Col>
                </Row>
                {cols.map((col, index) => (
                <Fragment key={index}>
                    <Row>
                        <Col>
                            Column Name
                            <Input value={name} onChange={e => this.setName(e.target.value)}/>
                            <UncontrolledDropdown color="primary">
                                <DropdownToggle caret>
                                    {predicate.field}
                                </DropdownToggle>
                                <DropdownMenu>
                                    {fields.map(field => (
                                        <DropdownItem key={field} onClick={()=>this.setColData(index,'field',field)}>{field}</DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </Col>
                        <Col>
                            Action
                            <UncontrolledDropdown color="primary">
                                <DropdownToggle caret>
                                    {predicate.action}
                                </DropdownToggle>
                                <DropdownMenu>
                                    {actions.map(action => (
                                        <DropdownItem key={action} onClick={()=>this.setColData(index,'action',action)}>{action}</DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </Col>
                        <Col>
                            Value
                            <Input value={predicate.value} onChange={e => this.setColData(index,'value',e.target.value)}/>
                        </Col>
                        <Col>
                            <div>Operator</div>
                            <ButtonGroup>
                                { operators.map(operator => (
                                    <Button color="primary" key={operator} onClick={() => {this.setColData(index,'operator',operator); this.addCol(operator)}} active={predicate.operator === operator}>{operator}</Button>
                                ))}
                            </ButtonGroup>
                        </Col>
                        <Col xs="auto" className="align-self-center">
                            <Button close onClick={() => this.deleteCol(index)}></Button>
                        </Col>
                    </Row>
                </Fragment>))}
            </Container>
        );
    }
}

export default TableMaker;
