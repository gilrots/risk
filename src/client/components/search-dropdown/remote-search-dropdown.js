import React from 'react';
import _ from 'lodash';
import {
    Input,  UncontrolledDropdown,
    DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import PropTypes from "prop-types";
const Utils = require('../../../common/utils');

class RemoteSearchDropdown extends React.Component {

    static propTypes = {
        query:PropTypes.string.isRequired,
        searchParam:PropTypes.string.isRequired,
        onSelected: PropTypes.func,
        debounceTime: PropTypes.number,
        //selectedId: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.state = this.initState();
        this.remoteSearch = _.debounce(this.remoteSearch, props.debounceTime ? props.debounceTime : 150);
    }

    initState() {
        return {
            search: '',
            items: [],
        };
    }

    // componentWillReceiveProps(nextProps) {
    //     if (nextProps.items && nextProps.items !== this.props.items) {
    //         this.setState(this.initState(nextProps));
    //     }
    //     if (nextProps.selectedId && nextProps.selectedId !== this.props.selectedId) {
    //         const item = nextProps.items.find(item => item.id === nextProps.selectedId);
    //         if(item){
    //             this.selectionChanged(item);
    //         }
    //         else {
    //             console.log(`No such item id:${nextProps.selectedId}`);
    //         }
    //     }
    // }

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
        return (<UncontrolledDropdown className="d-flex align-items-center">
                <DropdownToggle className="font-weight-bold">
                    {selected ? selected.name : 'Search...' }
                </DropdownToggle>
                <DropdownMenu right style={{maxHeight: 300}}>
                    <Input placeholder="Search for..." value={search} onChange={e => this.searchChanged(e.target.value)}/>
                    <DropdownItem divider/>
                    {items.map(item => (
                        <DropdownItem key={item.id} onClick={()=> this.selectionChanged(item)}>{item.name}</DropdownItem>
                    ))}
                </DropdownMenu>
            </UncontrolledDropdown>
        );
    }
}

export default RemoteSearchDropdown;
