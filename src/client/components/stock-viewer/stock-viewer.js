import {Formatters} from "./formatters";

const ReactDataGrid = require('react-data-grid');
const React = require('react');
import _ from 'lodash';

class StockViewer extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.sortRef = React.createRef();
        this.state = this.mapResult();
        this.data = this.props.data.data;
        this.lastSort = {};
    }

    mapResult(){
        let originalRows = this.props.data.dataKey ?
            _.map(this.props.data.data, this.props.data.dataKey) :
            this.props.data.data;
        let rows = originalRows.slice(0);
        return { originalRows, rows };
    }

    componentWillReceiveProps(nextProps) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        if (nextProps.data !== this.data) {
            this.data = nextProps.data;
            this.setState(this.mapResult());
            if(this.sortRef.current && !_.isEmpty(this.lastSort))
            {
                //this.sortRef.current;
                this.sortRef.current.setState({sortColumn:this.lastSort.sortColumn, sortDirection:this.lastSort.sortDirection})
                this.sortRef.current.handleSort(this.lastSort.sortColumn, this.lastSort.sortDirection);
            }
        }
    }

    createColumns() {
        let res =  this.props.data.cols.map(col => ({
            key: col.key,
            name: col.name,
            sortable: true,
            resizable: true,
            formatter: col.format != undefined ? Formatters[col.format] : undefined
        }));
        return this.props.reverse ? res.reverse() : res;
    }

    handleGridSort = (sortColumn, sortDirection) => {
        if(sortColumn && sortDirection) {
            this.lastSort = {sortColumn, sortDirection};
        }

        const comparer = (a, b) => {
            if (sortDirection === 'ASC') {
                return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
            } else if (sortDirection === 'DESC') {
                return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
            }
        };

        //TODO: function clled when sort = none
        const rows = sortDirection === 'NONE' ? this.state.originalRows.slice(0) : this.state.originalRows.sort(comparer);
        console.log('im sorting!',{sortColumn, sortDirection});
        //TODO: SORT this out - hihi
        this.setState({rows },()=>{window.dispatchEvent(new Event('resize'))});
    };

    rowGetter = rowIdx => this.state.rows[rowIdx];

    render() {
        const columns = this.createColumns();
        const can = !_.isEmpty(columns);
        return (
            can && <ReactDataGrid
                ref={this.sortRef}
                enableCellSelect
                columns={columns}
                onGridSort={this.handleGridSort}
                rowGetter={this.rowGetter}
                rowsCount={this.state.rows.length}
                minHeight={800}
                rowHeight={20}
            /> || null);
    }
}

export default StockViewer;
