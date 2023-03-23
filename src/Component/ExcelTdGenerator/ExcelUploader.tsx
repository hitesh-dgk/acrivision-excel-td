import React from "react";
import "./scss/ExcelUploader.scss"
import { Col, Row } from "react-bootstrap";
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';

const ExcelUploader = (props: any) => {
    return <Card className="excel-uploader-container">
        <Card.Body>
            <Row>
                <Col sm={4} md={6}>
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label>Upload Excel File</Form.Label>
                        <Form.Control type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={props.fileChangeHandler}/>
                    </Form.Group>
                </Col>
            </Row>
        </Card.Body>
    </Card>
}

export default ExcelUploader;