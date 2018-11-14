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
        data:{},
        errors:{ace:false},
        modal: {
            isOpen: false,
            newTable: false}
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.checkTable = this.checkTable.bind(this);
  }

  componentDidMount() {
    const app = this;
    this.getConfig().then(config => {
        setInterval(() => {
            fetch('/api/g')
                .then(res => res.json())
                .then((data) => {
                    console.log(data);
                    app.setState({ data });
                });
        }, config.app.updateInterval);
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


  checkTable(){
      fetch('/api/g')
          .then(res => res.json())
          .then(data => {
              if(typeof data !== 'string') {
                  this.setState({data});

              }
          })
          .catch(error => {
              console.log(error)
          });
  }

  render() {
    const { config, data, modal, errors } = this.state;
    const configInit = !_.isEmpty(config);
    const dataInit = !_.isEmpty(data);
    return (
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
            {configInit && <AppHeader onNewTableClicked={() => this.toggleModal('Create new table', <TableMaker config={config}/>)}>
                <Button color="primary" onClick={this.checkTable}>Check Code</Button>{' '}
                <Button color={errors.ace ? 'danger' : 'success'}>Ace</Button>
            </AppHeader>}
            {dataInit && <Fragment>
                <main className="my-5 py-5">
                    <Container className="max">
                        <Row>
                            <Col xs={{ order: 1 }} md={{ size: 2 }} className="pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                {<StockViewer  className="risk" data={data.risk} id="risk"/>}
                            </Col>
                            <Col xs={{ order: 2 }} md={{ size: 5 }} className="longs pb-5 mb-5 pb-md-0 mb-md-0 mx-auto mx-md-0">
                                {<StockViewer  className="longs" data={data.long} id="longs" reverse/>}
                            </Col>
                            <Col xs={{ order: 3 }} md={{ size: 5 }} className="shorts py-5 mb-5 py-md-0 mb-md-0">
                                {<StockViewer className="shorts" data={data.short} id="shorts"/>}
                            </Col>
                        </Row>
                    </Container>
                </main>
            </Fragment>}
        </Fragment>
    );
  }
}
//noGutters className="pt-2 w-100 px-4 px-xl-0 position-relative"
// className="px-0"
