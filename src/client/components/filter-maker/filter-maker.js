import React, {Fragment} from 'react';
import _ from 'lodash';
import {Container, Row, Col, Input, DropdownMenu, DropdownItem, DropdownToggle,UncontrolledDropdown, ButtonGroup,Button} from "reactstrap";

class FilterMaker extends React.Component {
    constructor(props) {
        super(props);
        this.setName = this.setName.bind(this);
        this.addPredicate = this.addPredicate.bind(this);
        this.deletePredicate = this.deletePredicate.bind(this);
        this.setPredicateData = this.setPredicateData.bind(this);
        this.fields = ['syn_diff', 'name', 'spread', 'amount', 'value'];
        this.actions = ['Bigger Than', 'Contains', 'Smaller Than', 'Starts With', 'Ends With'];
        this.operators = ['None', 'And', 'Or'];
        this.state = {name:'New table', predicates:[]};
    }
    componentDidMount() {
        //fetch(config.api.getTableFilterData).then(res=> res.json()).then(json =>{});
        this.addPredicate(this.operators[1]);
    }

    componentWillReceiveProps(nextProps) {
    }

    setName(newName){
        this.setState({newName})
    }

    setPredicateData(predicateIndex, predicateField, value){
        console.log("pred change:",{"pred:":this.state.predicates[0],"index:":predicateIndex,"field:":predicateField,"value:":value});

        this.setState(pervState => ({
            predicates: pervState.predicates.map((predicate, index) => (index === predicateIndex ? Object.assign({}, predicate, {[predicateField]:value}) : predicate))
        }));
    }

    addPredicate(shouldAdd){
        if(shouldAdd !== this.operators[0]) {
            const newPredicate = Object.assign({}, {
                field: this.fields[0],
                action: this.actions[0],
                value: 0,
                operator: this.operators[0]
            });
            this.setState(pervState => ({
                predicates: [...pervState.predicates, newPredicate]
            }));
        }
    }

    deletePredicate(predicateIndex){
        this.setState(pervState => {
            let predicates = [...pervState.predicates];
            if(predicates.length > 1) {
                predicates.splice(predicateIndex,1);
            }
            return {predicates};
        });
    }

    render() {
        const {name, predicates} = this.state;
        const fields = this.fields;
        const actions = this.actions;
        const operators = this.operators;
        return (
            <Container>
                {predicates.map((predicate, index) => (
                    <Fragment key={index}>
                        <Row>
                            <Col>
                                Field
                                <UncontrolledDropdown color="primary">
                                    <DropdownToggle caret>
                                        {predicate.field}
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        {fields.map(field => (
                                            <DropdownItem key={field} onClick={()=>this.setPredicateData(index,'field',field)}>{field}</DropdownItem>
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
                                            <DropdownItem key={action} onClick={()=>this.setPredicateData(index,'action',action)}>{action}</DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            </Col>
                            <Col>
                                Value
                                <Input value={predicate.value} onChange={e => this.setPredicateData(index,'value',e.target.value)}/>
                            </Col>
                            <Col>
                                <div>Operator</div>
                                <ButtonGroup>
                                    { operators.map(operator => (
                                        <Button color="primary" key={operator} onClick={() => {this.setPredicateData(index,'operator',operator); this.addPredicate(operator)}} active={predicate.operator === operator}>{operator}</Button>
                                    ))}
                                </ButtonGroup>
                            </Col>
                            <Col xs="auto" className="align-self-center">
                                <Button close onClick={() => this.deletePredicate(index)}></Button>
                            </Col>
                        </Row>
                    </Fragment>))}
            </Container>
        );
    }
}

export default FilterMaker;
