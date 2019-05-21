import {Formatters,FormattersFuncs} from "./formatters";
const ReactDataGrid = require('react-data-grid');
const React = require('react');
import {UncontrolledCollapse, Button, Card, CardBody,CardSubtitle, CardTitle, Badge} from 'reactstrap';
import _ from 'lodash';
import PropTypes from "prop-types";
import RiskLoader from "../loader/loader";
import BankViewer from "./bank-viewer";

const sd = {
    none: "NONE",
    asc: "ASC",
    desc: "DESC",
}
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
        this.getCellActions = props.onRowActionClicked ? this.getCellActions : undefined;
        this.state = {
            cols: this.createColumns(props),
            ...this.changeState(props)
        };
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
        this.lastSort = undefined;
    }

    changeCallback(rowActions,args) {
        return rowActions ? rowActions.map(rowAction =>
            ({icon: rowAction.icon, callback: () => rowAction.callback(args)})) :
            rowActions;
    }

    componentWillReceiveProps(nextProps) {
        const state = {};
        let callback = undefined;
        const exclude = nextProps.excludeMode !== this.props.excludeMode;
        if(!_.isEqual(nextProps.stocks.cols, this.props.stocks.cols) || exclude) {
           state.cols = this.createColumns(nextProps);
        }
        if (!_.isEqual(nextProps.stocks.data, this.props.stocks.data) || exclude) {
            Object.assign(state,this.changeState(nextProps));
            if(!_.isNil(this.lastSort) ){
                callback = () => {     
                    const {sortColumn,sortDirection} = this.lastSort;
                    this.handleGridSort(sortColumn, sortDirection);
                };
            }

        }
        if(!_.isEmpty(state)) {
            if(state.cols && state.rows) {
                 this.setState({cols:state.cols},() => this.setState({rows:state.rows, originalRows: state.originalRows},callback));
            }
            else {
                this.setState(state,callback);
            }
        }
    }

    formatRow = row => row.value = row.format !== undefined ? FormattersFuncs[row.format](row.value) : row.value;

    changeState(props){
        const originalRows = props.stocks.dataKey ?
            _.map(props.stocks.data, props.stocks.dataKey) :
            props.stocks.data;
        if(this.props.formatsCells){
            _.forEach(originalRows,this.formatRow);
        }
        const rows = originalRows.slice(0);
        return { originalRows, rows };
    }

    createColumns(props) {
        let res =  _.filter(props.stocks.cols,'visible').map(col => ({
            key: col.key,
            name: col.name,
            sortable: true,
            resizable: true,
            formatter: !_.isNil(col.format) ? Formatters[col.format] : undefined
        }));
        this.cellActions = props.excludeMode && res.length > 0 ? {
            [res[0].key]: this.rowActions
        } : {};
        return props.reverse ? res.reverse() : res;
    }

    handleGridSort = (sortColumn, sortDirection) => {
        const shouldSort = sortDirection === sd.none;
        this.lastSort = shouldSort ? undefined : {sortColumn, sortDirection};
        const {originalRows} = this.state;
        const rows = shouldSort ? 
            originalRows.slice(0) :
            _.orderBy(originalRows, sortColumn, sortDirection.toLowerCase());
        this.setState({rows});
    };

    rowGetter = rowIdx => this.state.rows[rowIdx];

    //TODO: make this efficient
    getCellActions = (col,row) => this.changeCallback(this.cellActions[col.key],{col,row});
 
    rowRenderer = ({ renderBaseRow, ...props }) => 
        <div className={`${props.row.origin}-ROW`}>
            {console.log(props)}
            <div id={`ROW-ID-${props.row.id}`}>{renderBaseRow(props)}</div>
            <UncontrolledCollapse toggler={`ROW-ID-${props.row.id}`}>
                <Card>
                    <CardBody>
                        <CardTitle>{props.row.name}</CardTitle>
                        <CardSubtitle>{`ID: ${props.row.id}`}</CardSubtitle>
                        {props.row.banks && <BankViewer value={props.row.banks}></BankViewer>}
                    </CardBody>
                </Card>
            </UncontrolledCollapse>
        </div>;

    render() {
        const {cols,rows} = this.state;
        const can = _.isEmpty(cols);
        return <RiskLoader loading={can}>
                    <ReactDataGrid
                    columns={cols}
                    onGridSort={this.handleGridSort}
                    rowGetter={this.rowGetter}
                    rowsCount={rows.length}
                    getCellActions={this.getCellActions}
                    rowRenderer={this.rowRenderer}
                    rowHeight={20}/>
              </RiskLoader>;
    }
}
//minHeight={800}

export default StockViewer;
