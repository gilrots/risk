import React from "react";
import { UncontrolledDropdown,DropdownToggle,DropdownMenu,DropdownItem, ListGroup, ListGroupItem, Button } from "reactstrap";

export function IconedMenu(props) {
    const { title, items, menuClick } = props;
    const click = e => {
        e.preventDefault();
        if(menuClick) {
            menuClick();
        }
    } 
    return <UncontrolledDropdown className="d-flex align-items-center" onClick={click} nav inNavbar>
        <DropdownToggle className="font-weight-bold" nav caret>{title}</DropdownToggle>
        <DropdownMenu right>
            {items.map(item =>
                <DropdownItem key={item.name} onClick={item.action}>
                    <i className={`fa fa-${item.icon} mr-2`} />{item.name}
                </DropdownItem>
            )}
        </DropdownMenu>
    </UncontrolledDropdown>;
}
