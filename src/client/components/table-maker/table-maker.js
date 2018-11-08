import React from 'react';
import _ from 'lodash';
import {Container, Row, Col, Input} from "reactstrap";

class TableMaker extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.togglePredicates = this.togglePredicates.bind(this);
        this.state = {
            predicatesOpen: false
        };
    }

    componentWillReceiveProps(nextProps) {
    }

    togglePredicates() {
        this.setState(prevState => ({
            predicatesOpen: !prevState.predicatesOpen
        }));
    }

    render() {
        return (
            <Container>
                <Row>
                    <Col>Name</Col>
                    <Col><Input placeholder="Table Name"/></Col>
                </Row>
                <Row>
                    <Col>Action</Col>
                    <Col>
                        <Dropdown isOpen={this.state.predicatesOpen} toggle={this.togglePredicates}>
                            <DropdownToggle caret>
                                Dropdown
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem header>Header</DropdownItem>
                                <DropdownItem disabled>Contains</DropdownItem>
                                <DropdownItem>Bigger Than</DropdownItem>
                                <DropdownItem>Smaller Than</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                    <Col>Value</Col>
                    <Col><Input placeholder="Check it out"/></Col>
                </Row>
            </Container>
        );
    }
}

export default StockViewer;
