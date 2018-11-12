import React, {Component, Fragment} from 'react';
import _ from 'lodash';
import './app.css';
import StockViewer from './components/stock-viewer/stock-viewer';
import AppHeader from "./components/header/app-header";
import {
    Container, Row, Col, Button, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';
import TableMaker from "./components/table-maker/table-maker";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        config: {},
        longs: [],
        shorts: [],
        risk: [],
        errors:{ace:false},
        modal: {
            isOpen: false,
            newTable: false}
    };
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    const app = this;
    this.getConfig().then(config => {
        setInterval(() => {
            fetch('/api/getData')
                .then(res => res.json())
                .then((data) => {
                    app.setState({ longs: _.values(data.longs.data), shorts: _.values(data.shorts.data), risk: data.riskData, errors: data.errors });
                });
        }, config.deborah.updateInterval);
    });
  }

  getConfig(){
      return new Promise((resolve, reject) => {
          fetch('/api/getConfig')
              .then(res => res.json())
              .then(config => {
                  //console.log(config);
                  this.setState({config},()=>resolve(config));
              })
              .catch(error => {
                  console.log(error)
                  reject();
              });
      });
  }

  toggleModal(title,component){
    this.setState(state =>{
        return state.modal.isOpen ? {modal: {isOpen: false, title: '', component: undefined}} : {
            modal: {
                isOpen: true,
                title: title,
                component: component
            }
        };
    });
  }

  render() {
    const { config, longs, shorts, risk, modal, errors } = this.state;
    const initialized = !_.isEmpty(config);
    return ( initialized &&
        <Fragment>
            <Modal isOpen={modal.isOpen} toggle={this.toggleModal} className="max">
                <ModalHeader toggle={this.toggleModal}>{modal.title}</ModalHeader>
                <ModalBody>
                    {modal.component}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.toggleModal}>Do Something</Button>{' '}
                    <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
            <AppHeader onNewTableClicked={() => this.toggleModal('Create new table', <TableMaker config={config}/>)} config={config} ace={errors.ace} />
            <main className="my-5 py-5">
                <Container className="max">
                    <Row>
                        <Col xs={{ order: 1 }} md={{ size: 2 }} className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                            {risk && <StockViewer  className="risk" data={risk} cols={config.cols.risk} id="risk"/>}
                        </Col>
                        <Col xs={{ order: 2 }} md={{ size: 5 }} className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                            {longs && <StockViewer  className="longs" data={longs} cols={config.cols.longs} id="longs"/>}
                        </Col>
                        <Col xs={{ order: 3 }} md={{ size: 5 }} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                            {shorts && <StockViewer className="shorts" data={shorts} cols={config.cols.shorts} id="shorts"/>}
                        </Col>
                    </Row>
                </Container>
            </main>
        </Fragment>
    );
  }
}
//noGutters className="pt-2 w-100 px-4 px-xl-0 position-relative"
// className="px-0"
