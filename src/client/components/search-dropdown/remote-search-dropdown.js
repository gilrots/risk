import React from 'react';
import _ from 'lodash';
import {
    Input,  UncontrolledDropdown,
    DropdownToggle, DropdownMenu, DropdownItem, Form,FormGroup
} from 'reactstrap';
import PropTypes from "prop-types";
const Utils = require('../../../common/utils');

class RemoteSearchDropdown extends React.Component {

    static propTypes = {
        query:PropTypes.string.isRequired,
        searchParam:PropTypes.string.isRequired,
        onSelected: PropTypes.func,
        debounceTime: PropTypes.number,
        selected: PropTypes.shape({
            name: PropTypes.string.isRequired,
            id: PropTypes.string.isRequired
        }),
    };

    constructor(props) {
        super(props);
        this.state = {
            search: '',
            items: [],
            selected: props.selected
        };
        this.remoteSearch = _.debounce(this.remoteSearch, props.debounceTime ? props.debounceTime : 150);
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
    }

    componentWillReceiveProps(nextProps) {
        const {selected} = nextProps;
        if (selected && selected !== this.props.selected) {
            this.setState({selected});
        }
    }

    searchChanged = value => {
        if( _.isEmpty(value)){
            this.setState({items:[], search:''});
        }
        else{
            const {query, searchParam} = this.props
            const search = value;
            this.setState({search}, () => this.remoteSearch(query,searchParam));
        }
    };

    remoteSearch = (query,param) => Utils.fetchJson(query,{[param]: this.state.search}).then(({items}) => {
        this.setState({items});
    });

    selectionChanged = item => {
        if(!this.state.selected || item.id !== this.state.selected.id) {
            this.setState({selected:item},()=>{
                const delegate = this.props.onSelected;
                if(delegate) {
                    delegate(item);
                }
            })
        }
    }

    render() {
        const {search, items, selected} = this.state;
        const {modifiers} = this;
        return (<UncontrolledDropdown>
                <DropdownToggle className="font-weight-bold">
                    {selected ? selected.name : 'Search...' }
                </DropdownToggle>
                <DropdownMenu right modifiers={modifiers}>
                    <Form inline className="px-2">
                        <FormGroup>
                            <Input placeholder="Search for..." value={search} onChange={e => this.searchChanged(e.target.value)}/>
                        </FormGroup>
                    </Form>
                    <DropdownItem divider/>
                    {items.map((item,i) => (
                        <DropdownItem key={i} onClick={()=> this.selectionChanged(item)}>{item.name}</DropdownItem>
                    ))}
                </DropdownMenu>
            </UncontrolledDropdown>
        );
    }
}

export default RemoteSearchDropdown;
