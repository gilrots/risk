import React from "react";
import { Form, FormGroup, Input, UncontrolledDropdown, DropdownToggle,
    DropdownMenu,DropdownItem, ListGroup, ListGroupItem, Button } from "reactstrap";

export function IconedMenu(props) {
    const { title, items, menuClick, active } = props;
    const click = e => {
        if(menuClick) {
            menuClick();
        }
    } 
    return <UncontrolledDropdown className="d-flex align-items-center" active={active} onClick={click} nav inNavbar>
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

export function SearchInput(props) {
    const { value, onChange } = props;
    const searchChanged = e => {
        e.preventDefault();
        if(onChange) {
            onChange(e.target.value);
        }
    } 

    return <Form inline className="px-2">
                <FormGroup>
                    <Input placeholder="Search for..." value={value} onChange={searchChanged}/>
                </FormGroup>
            </Form>;
}
