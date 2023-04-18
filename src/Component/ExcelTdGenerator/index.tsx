import React, { useCallback, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ExcelUploader from "./ExcelUploader";
import FileUploadService from "./Service/FileUploadService";
import { saveAs } from "file-saver";

const ExcelTdGenerator = () => {
    const [excelFile, setExcelFile] = useState(null);

    const onFilaChangeHandler = useCallback((event: any) => {
        console.log("onFilaChangeHandler event");
        console.log(event)
        event.preventDefault();
        console.log(event.target.files);
        setExcelFile(event.target.files);
        if (event.target.files) {
            const file = event.target.files[0];
            const fileNameWithExtension = file.name;
            let spliValue = fileNameWithExtension.split(".");
            spliValue.pop();
            const fileName = spliValue.join(".")
            const fileUploadService = new FileUploadService();
            fileUploadService.uploadFileHandler(file)
                .then((fileContentResponse: any) => {
                    if(fileContentResponse.towerInputContent) {
                        console.log("promise fileContentResponse  towerInputContent");
                        console.log(fileContentResponse.towerInputContent);
                        var blob = new Blob([fileContentResponse.towerInputContent], { type: "text/plain;charset=utf-8" });
                        saveAs(blob, fileName+"_tower_input.td");
                    }
                    if(fileContentResponse.monopoleInputContent) {
                        console.log("promise fileContentResponse  monopoleInputContent");
                        console.log(fileContentResponse.monopoleInputContent);
                        var blob = new Blob([fileContentResponse.monopoleInputContent], { type: "text/plain;charset=utf-8" });
                        saveAs(blob, fileName+"_monopole_input.td");
                    }
                })
                .catch((e: any) => {
                    console.log(`Error occured`);
                    console.log(e);
                })
        }
    }, [excelFile])
    return <Container fluid style={{ paddingTop: '15px' }}>
        <ExcelUploader fileChangeHandler={onFilaChangeHandler}/>
    </Container>
}

export default ExcelTdGenerator;