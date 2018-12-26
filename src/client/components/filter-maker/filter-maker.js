import React from 'react';
import _ from 'lodash';
import {Container,Table, Input, Button, Label} from "reactstrap";
import ToggleButton from 'react-toggle-button'
import {get, post, notify} from "../../helpers/client-utils"
import {addElement, deleteElement, changeElement} from "../../helpers/state-utils"
const api = require('../../../common/config').server.api;
import PropTypes from "prop-types";
import { ItemSelect, SymbolAmount } from '../func-components';
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
                field: fields[0].id,
                action: actions[0].id,
                value: 0,
                operator: operators[0].id,
                left:0,
                right:0,
            });
        }
    }

    deletePredicate = predicateIndex => 
        deleteElement(this,preds,predicateIndex);

    save() {
        const {isActive, predicates} = this.state;
        const {tableId} = this.props;
        post(api.setTableFilter, {tableId, filter:{isActive, predicates}}).then(res =>
            notify(this, res, 'Update Table Filter'));
    }

    render() {
        const { isActive, predicates, fields, actions, operators } = this.state;
        const hasFilter = !_.isEmpty(predicates);
        return <Container>
            {!hasFilter && operators.length > 1 && <Button color="success" onClick={() => this.addPredicate(operators[1])}>New filter</Button>}
            {hasFilter &&
                <Label>
                    Filter
                <ToggleButton value={isActive} onToggle={() => { this.setState({ isActive: !isActive }) }} />
                </Label>}
            {hasFilter && <Table responsive striped>
                <thead>
                    <tr>
                        <th></th>
                        <th>Field</th>
                        <th>Action</th>
                        <th>Value</th>
                        <th></th>
                        <th>Operator</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {predicates.map((predicate, index) =>
                        <tr className="pop-box" key={index}>
                            <td><SymbolAmount symbol="(" value={predicate.left} 
                            onChange={left => this.setPredicateData(index, 'left', left)}/></td>
                            <td>
                                <ItemSelect selectedId={predicate.field} items={fields}
                                    onSelect={field => this.setPredicateData(index, 'field', field.id)} />
                            </td>
                            <td>
                                <ItemSelect selectedId={predicate.action} items={actions}
                                    onSelect={action => this.setPredicateData(index, 'action', action.id)} />
                            </td>
                            <td>
                                <Input value={predicate.value}
                                    onChange={e => this.setPredicateData(index, 'value', e.target.value)} />
                            </td>
                            <td><SymbolAmount symbol=")" value={predicate.right} 
                            onChange={right => this.setPredicateData(index, 'right', right)}/></td>
                            <td>
                                <ItemSelect selectedId={predicate.operator} items={operators} radios={3}
                                    onSelect={operator => { this.setPredicateData(index, 'operator', operator.id); this.addPredicate(operator) }} />
                            </td>
                            <td>
                                <Button outline className="rounded-circle ml-2 pop-item" color="danger"
                                    onClick={() => this.deletePredicate(index)}>
                                    <i className="fa fa-times" />
                                </Button>
                            </td>
                        </tr>)}
                </tbody>
            </Table>}
        </Container>;
    }
}

export default FilterMaker;
