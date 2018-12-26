import React from "react";
import { Form, FormGroup, Input, UncontrolledDropdown, DropdownToggle,
    DropdownMenu,DropdownItem, ButtonGroup, Button, Label, Badge } from "reactstrap";

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

export function ItemSelect(props) {
    const { selectedId, items, onSelect, radios} = props;
    if(radios !== undefined && items.length <= radios) {
        return <ButtonGroup>
            {items.map(item => 
                <Button color="primary" key={item.id} active={item.id === selectedId}
                onClick={() => onSelect(item)}>{item.name}</Button>
            )}
        </ButtonGroup>;
    }
    const selectedItem = _.find(items,item=> item.id === selectedId) || {name:"---"};
    return <UncontrolledDropdown >
            <ButtonGroup>
                <Button color="primary">{selectedItem.name}</Button>
                <DropdownToggle color="primary" caret split />
            </ButtonGroup>
            <DropdownMenu>
                {items.map(item =>
                    <DropdownItem key={item.id} onClick={() => onSelect(item)}>{item.name}</DropdownItem>
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

export function SymbolAmount(props) {
    const { symbol,value, onChange, numeric } = props;
    const text = numeric  || value < 2? symbol : _.chain(Array(value)).fill(symbol).join('').value();
    return <Button color={value? "primary" : "secondary"} className="pop-box position-relative"
            outline onClick={() => onChange(value+1)}>
                <strong>{text}</strong>
                {numeric && value !== 0 && <Badge color="secondary" pill>{value}</Badge>}
                {value > 0 && <Badge pill className="pop-item position-absolute"
                    color="danger" style={{left:-10,top:-10}}
                    onClick={e =>{e.stopPropagation(); onChange(Math.max(value-1, 0));}}>-</Badge>}
           </Button>;
}
