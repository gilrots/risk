import React from 'react';
const logo = require('../../assests/logo.jpg');

import {
    Container, Row, Col, Navbar, Nav,
    NavbarBrand, NavLink, NavItem, Button
} from 'reactstrap';

class AppHeader extends React.Component {
    render() {
        console.log(this.props.role);
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
                                            <Button className="rounded-circle font-weight-bold" disabled color="primary" title={this.props.role}>
                                                {this.props.role[0]}
                                            </Button>
                                        </NavLink>
                                    </NavItem>
                                    {this.props.children.slice(1)}
                                </Nav>
                            </Col>

                            <Col className="d-flex justify-content-xs-start justify-content-lg-center">
                                <NavbarBrand className="d-inline-block p-0" href="/" style={{width: 80}}>
                                    <img src={logo} alt="logo" className="position-relative img-fluid"/>
                                </NavbarBrand>
                            </Col>

                            <Col className="d-none d-lg-flex justify-content-end">
                                {this.props.children[0]}
                            </Col>
                        </Row>
                    </Container>

                </Navbar>
            </header>
        );
    }
}

export default AppHeader;
