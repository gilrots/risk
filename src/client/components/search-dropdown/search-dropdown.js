import React from 'react';
import _ from 'lodash';
import {
    Input,  UncontrolledDropdown,
    DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import PropTypes from "prop-types";

class SearchDropdown extends React.Component {

    static propTypes = {
        onSelected: PropTypes.func,
        items: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            id: PropTypes.string
        }))
    };

    constructor(props, context) {
        super(props, context)
        this.selectionChanged =  this.selectionChanged.bind(this);
        this.searchChanged =  this.searchChanged.bind(this);//_.debounce(this.searchChanged())
        this.state = this.initState(this.props);
    }

    initState(props) {
        return {
            search: '',
            filtered: props.items.slice(0),
            //selected:  _.get(props,'selected', _.get(props.items,'[0]', undefined))
            selected:  _.get(props.items,'[0]', undefined)
        };
    }

    componentDidMount() {
        //this.selectionChanged(_.get(this.props.items,'[0]', undefined));
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.items !== this.props.items) {
            this.setState(this.initState(nextProps));
        }
    }

    searchChanged(value){
        if(value !== this.state.search){
            const search = value;
            const filtered = search === '' ? this.props.items.slice(0) : _.filter(this.props.items, item => (item.name.includes(search) || item.id.includes(search)));
            this.setState({search, filtered});
        }
    }

    selectionChanged(item) {
        if(!this.state.selected || item.id !== this.state.selected.id) {
            this.setState({selected:item},()=>{
                if(this.onSelected) {
                    this.onSelected(item);
                }
            })
        }
    }

    render() {
        const {search, filtered,selected} = this.state;
        return (<UncontrolledDropdown className="d-flex align-items-center">
                    <DropdownToggle className="font-weight-bold">
                        {selected ? selected.name : 'Search field' }
                    </DropdownToggle>
                    <DropdownMenu right style={{maxHeight: 300}}>
                        <Input placeholder="Search for..." value={search} onChange={e => this.searchChanged(e.target.value)}/>
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
