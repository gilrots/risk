import React from "react";
import { Form, FormGroup, Input, UncontrolledDropdown, DropdownToggle,
    DropdownMenu,DropdownItem, ListGroup, ListGroupItem, Button, Label } from "reactstrap";

export function IconedMenu(props) {
    const { title, items, menuClick, active, split } = props;
    const click = e => {
        if(menuClick) {
            menuClick();
        }
    } 
    const labelClass = `${active ? 'font-weight-bold text-primary' : ''} p-1 mb-0`;
    return <UncontrolledDropdown className="d-flex align-items-center mr-2" direction="right" active={active} onClick={click} nav inNavbar>
        {split && <Label className={labelClass}>{title}</Label>}
        <DropdownToggle id="drop-toggle" split={split} nav caret>
            {!split && <Label className={labelClass + ' font-weight-bold'}>{title}</Label>}
        </DropdownToggle>
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
