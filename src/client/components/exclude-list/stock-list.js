import React, {Fragment} from "react";
import {ListGroup, ListGroupItem, Button} from "reactstrap";

export function StockList(props) {
    const {title, stocks, icon, color, func} = props;
    return <Fragment>
        <h3>{title}</h3>
        <ListGroup style={{maxHeight:'30rem',overflowY:'scroll'}}>
            {stocks.map((stock, index) =>
                <ListGroupItem key={stock.id} className="pop-box d-flex py-1" style={{minHeight:'3rem'}}>
                    <span className="flex-fill">{stock.name}</span>
                    <Button className="rounded-circle pop-item" outline
                            color={color} onClick={() => func(stock, index)}>
                        <i className={icon}/>
                    </Button>
                </ListGroupItem>)}
        </ListGroup>
    </Fragment>;
}
