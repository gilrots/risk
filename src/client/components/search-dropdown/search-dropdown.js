import React from 'react';
import _ from 'lodash';
import {SearchInput} from '../func-components';
import {UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem} from 'reactstrap';
import PropTypes from "prop-types";
const config = require('../../../common/config');
const debTime = config.app.searchDebounce;
const limit = config.app.searchLimit;

class SearchDropdown extends React.Component {

    static propTypes = {
        onSelected: PropTypes.func,
        selectedId: PropTypes.string,
        items: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            id: PropTypes.string
        }))
    };

    constructor(props) {
        super(props);
        this.state = this.initState(this.props);
        this.modifiers = {
            setMaxHeight: {
                enabled: true,
                order: 1030,
                fn: data => ({
                        ...data,
                        styles: {
                            ...data.styles,
                            overflow: 'auto',
                            maxHeight: 300,
                        },
                    })
            },
        };
        //_.debounce(this.searchChanged())
    }

    initState(props) {
        const {items, selectedId} = props;
        return {
            search: '',
            filtered: items.slice(0, 10),
            selected:  !_.isEmpty(selectedId) ? 
                items.find(item => item.id === selectedId) :
                _.get(items,'0', undefined)
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.items && nextProps.items !== this.props.items) {
            this.setState(this.initState(nextProps));
        }
        if (nextProps.selectedId && nextProps.selectedId !== this.props.selectedId) {
            const item = nextProps.items.find(item => item.id === nextProps.selectedId);
            if(item){
                this.selectionChanged(item);
            }
            else {
                console.log(`No such item id: ${nextProps.selectedId}`);
            }
        }
    }

    searchChanged = value => {
        if(value !== this.state.search){
            const search = value;
            const filtered = _.isEmpty(search) ? 
            this.props.items.slice(0, 10) : 
            _.limit(this.props.items, item => (item.name.includes(search) || item.id.includes(search)), limit);
            this.setState({search, filtered});
        }
    }

    selectionChanged = item => {
        if(!this.state.selected || item && item.id !== this.state.selected.id) {
            this.setState({selected:item},() => {
                const delegate = this.props.onSelected;
                if(delegate) {
                    delegate(item);
                }
            })
        }
    }

    render() {
        const {search, filtered,selected} = this.state;
        const {modifiers} = this;
        return (<UncontrolledDropdown>
                    <DropdownToggle className="font-weight-bold">
                        {selected ? selected.name : 'Search field' }
                    </DropdownToggle>
                    <DropdownMenu direction="right" modifiers={modifiers}>
                        <SearchInput value={search} onChange={this.searchChanged}/>
                        <DropdownItem divider/>
                        {filtered.map(item => (
                            <DropdownItem key={item.id} onClick={()=> this.selectionChanged(item)}>{item.name}</DropdownItem>
                        ))}
                    </DropdownMenu>
                </UncontrolledDropdown>
        );
    }
}

export default SearchDropdown;
