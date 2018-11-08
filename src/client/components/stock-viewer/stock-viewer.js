import {Formatters} from "./formatters";

const ReactDataGrid = require('react-data-grid');
const React = require('react');
import _ from 'lodash';

class StockViewer extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.sortRef = React.createRef();
        let originalRows = this.props.data;
        let rows = this.props.data.slice(0);
        this.state = { originalRows, rows };
        this.lastSort = {};
    }

    componentWillReceiveProps(nextProps) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        //if (nextProps.data !== this.state.originalRows) {
            this.setState({ originalRows: nextProps.data, rows: nextProps.data.slice(0)});
            if(this.sortRef.current && !_.isEmpty(this.lastSort))
            {
                //this.sortRef.current;
                this.sortRef.current.setState({sortColumn:this.lastSort.sortColumn, sortDirection:this.lastSort.sortDirection})
                this.sortRef.current.handleSort(this.lastSort.sortColumn, this.lastSort.sortDirection);
            }
        //}
    }

    createColumns() {
        const cols = _.get(this,'props.cols',{});
        const res =  _.keys(cols).map(header => ({
            key: cols[header].key,
            name: header.toUpperCase(),
            sortable: cols[header].sortable || true,
            resizable: true,
            formatter: cols[header].format != undefined ? Formatters[cols[header].format] : undefined
        }));
        return res;
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

        const rows = sortDirection === 'NONE' ? this.state.originalRows.slice(0) : this.state.originalRows.sort(comparer);
        console.log('im sorting!',{sortColumn, sortDirection});

        this.setState({rows });
    };

    rowGetter = rowIdx => this.state.rows[rowIdx];

    render() {
        window.dispatchEvent(new Event('resize'));

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
