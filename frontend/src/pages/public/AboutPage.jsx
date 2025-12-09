import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaCoffee, FaAward, FaUsers, FaLeaf } from 'react-icons/fa';

const AboutPage = () => {
  return (
    <div>
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="hero-title">About Arbiter Coffee</h1>
              <p className="hero-subtitle">
                Crafting exceptional coffee experiences since our founding
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <Row className="mb-5">
          <Col lg={10} className="mx-auto">
            <h2 className="text-center mb-4">Our Story</h2>
            <p className="lead text-center">
              Arbiter Coffee began with a simple mission: to bring the finest coffee experience to 
              our community. What started as a small passion project has grown into a thriving business 
              dedicated to sourcing, roasting, and serving exceptional coffee.
            </p>
            <p className="text-center">
              We believe that great coffee brings people together. Every bean is carefully selected 
              from sustainable farms around the world, roasted to perfection, and served with care. 
              Our commitment to quality and sustainability drives everything we do.
            </p>
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col md={6} lg={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="mb-3">
                  <FaCoffee size={48} className="text-primary" />
                </div>
                <Card.Title>Premium Quality</Card.Title>
                <Card.Text>
                  Hand-selected beans from the world's finest coffee regions
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="mb-3">
                  <FaLeaf size={48} className="text-success" />
                </div>
                <Card.Title>Sustainability</Card.Title>
                <Card.Text>
                  Committed to ethical sourcing and environmental responsibility
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="mb-3">
                  <FaAward size={48} className="text-warning" />
                </div>
                <Card.Title>Excellence</Card.Title>
                <Card.Text>
                  Award-winning roasts and brewing techniques
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="mb-3">
                  <FaUsers size={48} className="text-info" />
                </div>
                <Card.Title>Community</Card.Title>
                <Card.Text>
                  Building connections one cup at a time
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="py-5 bg-light-green rounded-lg">
          <Col lg={10} className="mx-auto">
            <h2 className="text-center mb-4">Our Values</h2>
            <Row>
              <Col md={4} className="mb-4">
                <h4 className="text-primary">Quality First</h4>
                <p>
                  We never compromise on quality. Every cup of coffee we serve meets our highest 
                  standards of excellence.
                </p>
              </Col>
              <Col md={4} className="mb-4">
                <h4 className="text-primary">Sustainability</h4>
                <p>
                  We partner with farms that practice sustainable agriculture and fair trade, 
                  ensuring a better future for all.
                </p>
              </Col>
              <Col md={4} className="mb-4">
                <h4 className="text-primary">Community</h4>
                <p>
                  We're more than a coffee shop – we're a gathering place where relationships 
                  are built and memories are made.
                </p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AboutPage;
