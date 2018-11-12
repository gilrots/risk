import React from 'react';
import PropTypes from 'prop-types';
const logo = require('../../assests/logo.jpg');

import {
    Container, Row, Col, Form, Input, Button, Navbar, Nav,
    NavbarBrand, NavLink, NavItem, UncontrolledDropdown,
    DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';

const AVATAR = 'https://www.gravatar.com/avatar/429e504af19fc3e1cfa5c4326ef3394c?s=240&d=mm&r=pg';

class AppHeader extends React.Component {
    static propTypes = {
        config: PropTypes.object.isRequired,
        ace: PropTypes.bool.isRequired,
        onNewTableClicked: PropTypes.func.isRequired
    };

    constructor(props, context) {
        super(props, context)
        this.state = {ace:false};
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.ace !== this.props.ace){
            this.setState({ace:nextProps.ace});
        }
    }

    newTable = (evt) => {
        evt.preventDefault();
        const delegate = this.props.onNewTableClicked;
        if(delegate) {
            delegate();
        }
    }

    render() {
        const {ace} = this.state;

        return (
            <header>
                <Navbar fixed="top" color="light" light expand="xs" className="border-bottom border-gray bg-white"
                        style={{height: 80}}>
                    <Container>
                        <Row noGutters className="position-relative w-100 align-items-center">
                            <Col className="d-none d-lg-flex justify-content-start">
                                <Nav className="mrx-auto" navbar>
                                    <NavItem className="d-flex align-items-center">
                                        <NavLink className="font-weight-bold" href="/">
                                            <img src={AVATAR} alt="avatar" className="img-fluid rounded-circle"
                                                 style={{width: 36}}/>
                                        </NavLink>
                                    </NavItem>

                                    <NavItem className="d-flex align-items-center">
                                        <NavLink className="font-weight-bold" href="/">Position Report</NavLink>
                                    </NavItem>

                                    <NavItem className="d-flex align-items-center">
                                        <NavLink className="font-weight-bold" href="/">Intra</NavLink>
                                    </NavItem>

                                    <UncontrolledDropdown className="d-flex align-items-center" nav inNavbar>
                                        <DropdownToggle className="font-weight-bold" nav caret>Tables</DropdownToggle>
                                        <DropdownMenu right>
                                            <DropdownItem className="font-weight-bold text-secondary text-uppercase"
                                                          header disabled>Search tables</DropdownItem>
                                            <DropdownItem divider/>
                                            <DropdownItem>Table 1</DropdownItem>
                                            <DropdownItem>Table 2</DropdownItem>
                                            <DropdownItem onClick={e => this.newTable(e)}>Add Table</DropdownItem>
                                        </DropdownMenu>
                                    </UncontrolledDropdown>

                                    <Button color={ace ? 'danger' : 'success'}>Ace</Button>
                                </Nav>
                            </Col>

                            <Col className="d-flex justify-content-xs-start justify-content-lg-center">
                                <NavbarBrand className="d-inline-block p-0" href="/" style={{width: 80}}>
                                    <img src={logo} alt="logo" className="position-relative img-fluid"/>
                                </NavbarBrand>
                            </Col>

                            <Col className="d-none d-lg-flex justify-content-end">
                                <Form inline>
                                    <Input type="search" className="mr-3" placeholder="Search bonds"/>
                                    <Button type="submit" color="info" outline>Search</Button>
                                </Form>
                            </Col>

                        </Row>
                    </Container>

                </Navbar>
            </header>
        );
    }
}

export default AppHeader;
