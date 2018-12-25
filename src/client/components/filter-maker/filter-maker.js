import React from 'react';
import _ from 'lodash';
import {Container, Row, Col, Input, DropdownMenu, DropdownItem, DropdownToggle,UncontrolledDropdown, ButtonGroup,Button} from "reactstrap";
import {get, post, notify} from "../../helpers/client-utils"
import {addElement, deleteElement, changeElement} from "../../helpers/state-utils"
const api = require('../../../common/config').server.api;
import PropTypes from "prop-types";
import { ItemSelect } from '../func-components';
const preds = 'predicates'; 
class FilterMaker extends React.Component {
    static propTypes = {
        tableId: PropTypes.number.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            isActive:true,
            [preds]:[],
            fields:[],
            actions:[],
            operators:[],
            defaultOperator:undefined
        };
    }

    componentDidMount() {
        const tableId = this.props.tableId;
        Promise.all([get(api.getFilterMakerData), get(api.getTableFilter,{tableId})]).then(data => {
            const filterMakerData = data[0];
            const tableFilter = data[1];
            if(filterMakerData.error) {
                notify(this, filterMakerData, 'Table Filter Editor');
            }
            else if(tableFilter.error) {
                notify(this, tableFilter, 'Table Filter Editor');
            }
            else {
                this.setState(Object.assign({},filterMakerData,tableFilter));
            }
        });
    }

    setPredicateData = (predicateIndex, predicateField, value) => 
        changeElement(this,preds,predicateIndex,predicateField,value);

    addPredicate = operator => {
        const {fields, actions, operators, defaultOperator} = this.state;
        if(operator !== defaultOperator) {
            addElement(this,preds, {
                field: fields[0],
                action: actions[0],
                value: 0,
                operator: operators[0]
            });
        }
    }

    deletePredicate = predicateIndex => 
        deleteElement(this,preds,predicateIndex);

    save() {
        
    }

    render() {
        const {predicates, fields, actions, operators} = this.state;
        return <Container>
            {_.isEmpty(predicates) && operators.length > 1 && <Button color="success" onClick={()=> this.addPredicate(operators[1])}>New filter</Button>}
            {predicates.map((predicate, index) => 
                    <Row key={index}>
                        <Col>
                            Field
                            <ItemSelect selected={predicate.field} items={fields}
                                onSelect={field => this.setPredicateData(index,'field',field)}/>
                        </Col>
                        <Col>
                            Action
                            <ItemSelect selected={predicate.action} items={actions}
                                onSelect={action => this.setPredicateData(index,'action',action)}/>
                        </Col>
                        <Col>
                            Value
                            <Input value={predicate.value} onChange={e => this.setPredicateData(index,'value',e.target.value)}/>
                        </Col>
                        <Col>
                            <div>Operator</div>
                            <ItemSelect selected={predicate.operator} items={operators} radios={3}
                                onSelect={operator => {this.setPredicateData(index,'operator',operator); this.addPredicate(operator)}}/>
                        </Col>
                        <Col xs="auto" className="align-self-center">
                            <Button close onClick={() => this.deletePredicate(index)}></Button>
                        </Col>
                    </Row>)}
        </Container>;
    }
}

export default FilterMaker;
