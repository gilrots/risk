import {Formatters,FormattersFuncs} from "./formatters";
const ReactDataGrid = require('react-data-grid');
const React = require('react');
import _ from 'lodash';
import PropTypes from "prop-types";
import RiskLoader from "../loader/loader";

class StockViewer extends React.Component {
    static propTypes = {
        stocks: PropTypes.object.isRequired,
        excludeMode: PropTypes.bool,
        reverse: PropTypes.bool,
        formatsCells: PropTypes.bool,
        onRowActionClicked: PropTypes.func,
    };

    constructor(props) {
        super(props);
        this.sortRef = React.createRef();
        this.getCellActions = props.onRowActionClicked ? this.getCellActions : undefined;
        this.state = this.changeState(props);
        this.state.cols = this.createColumns(props);
        this.state.selectedIndexes = [];
        this.lastSort = {};
        this.rowActions = [
            {
                icon: <span className="fa fa-times" />,
                callback: args => {
                    const delegate = this.props.onRowActionClicked;
                    if(delegate){
                        delegate(args.row.id,"remove");
                    }
                }
            }
        ];
    }

    changeCallback(rowActions,args) {
        return rowActions ? rowActions.map(rowAction =>
            ({icon: rowAction.icon, callback: () => rowAction.callback(args)})) :
            rowActions;
    }

    componentWillReceiveProps(nextProps) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        if (nextProps.stocks.data !== this.props.stocks.data) {
            this.setState(this.changeState(nextProps));
            if(this.sortRef.current && !_.isEmpty(this.lastSort))
            {
                this.sortRef.current.setState({sortColumn:this.lastSort.sortColumn, sortDirection:this.lastSort.sortDirection})
                //TODO: check if even needs sorting
                this.sortRef.current.handleSort(this.lastSort.sortColumn, this.lastSort.sortDirection);
            }
        }
        if(nextProps.stocks.cols !== this.props.stocks.cols || 
           nextProps.excludeMode !== this.props.excludeMode) {
            this.setState({cols: this.createColumns(nextProps)});
        }
    }

    formatRow = row => row.value = row.format !== undefined ? FormattersFuncs[row.format](row.value) : row.value;

    changeState(props){
        let originalRows = props.stocks.dataKey ?
            _.map(props.stocks.data, props.stocks.dataKey) :
            props.stocks.data;
        if(this.props.formatsCells){
            _.forEach(originalRows,this.formatRow);
        }
        let rows = originalRows.slice(0);
        return { originalRows, rows };
    }

    createColumns(props) {
        let res =  props.stocks.cols.map(col => ({
            key: col.key,
            name: col.name,
            sortable: true,
            resizable: true,
            formatter: col.format != undefined ? Formatters[col.format] : undefined
        }));
        this.cellActions = props.excludeMode ? {
            [res[0].key]: this.rowActions
        } : {};
        return props.reverse ? res.reverse() : res;
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

    //TODO: make this efficient
    getCellActions = (col,row) => this.changeCallback(this.cellActions[col.key],{col,row});

    onRowsSelected = rows => {
        this.setState({
            selectedIndexes: this.state.selectedIndexes.concat(
                rows.map(r => r.rowIdx)
            )
        });
    };

    onRowsDeselected = rows => {
        let rowIndexes = rows.map(r => r.rowIdx);
        this.setState({
            selectedIndexes: this.state.selectedIndexes.filter(
                i => rowIndexes.indexOf(i) === -1
            )
        });
    };

    rowRenderer = ({ renderBaseRow, ...props }) => <div className={`${props.row.origin}-ROW`}>{renderBaseRow(props)}</div>;


    render() {
        const {cols,rows} = this.state;
        const can = _.isEmpty(cols);
        return <RiskLoader loading={can}>
                    <ReactDataGrid
                    ref={this.sortRef}
                    columns={cols}
                    onGridSort={this.handleGridSort}
                    rowGetter={this.rowGetter}
                    rowsCount={rows.length}
                    getCellActions={this.getCellActions}
                    rowRenderer={this.rowRenderer}
                    minHeight={800}
                    rowHeight={20}
                    rowSelection={{
                        showCheckbox: false,
                        enableShiftSelect: true,
                        onRowsSelected: this.onRowsSelected,
                        onRowsDeselected: this.onRowsDeselected,
                        selectBy: {
                            indexes: this.state.selectedIndexes
                        }
                    }}/>
              </RiskLoader>;
    }
}

export default StockViewer;
