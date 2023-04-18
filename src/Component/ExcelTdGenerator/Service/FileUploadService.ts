
import * as xlsx from "xlsx"
import MonopoleInputTdGenerator from "./MonopoleInputTdGenerator";
import TowerInputTdGenerator from "./TowerInputTdGenerator";


class FileUploadService {
    private sections: any;
    constructor() {
        console.log("inside FileUploadService")
        this.sections = {
            "legs": [],
            "bracings": [],
            "horizontals": [],
            "redundants": [],
            "plan_bracings": [],
            "hip_bracings": [],
        }
    }

    uploadFileHandler(file: any): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            try {
                // let fileContent: any = ""
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    const data = e.target.result;
                    const workbook = xlsx.read(data, { type: "array" });
                    this.processInputSheet(workbook)
                        .then((response: any) => {
                            console.log("onload");
                            console.log(response);
                            resolve(response);
                        })
                        .catch((error: any) => {
                            reject(error);
                        })
                };
                reader.readAsArrayBuffer(file);
            } catch (e: any) {
                reject(e);
            }
        })
    }

    private processInputSheet(workbook: any): any {

        return new Promise((resolve: any, reject: any) => {
            try {
                let response: any = {
                    towerInputContent: null,
                    monopoleInputContent: null
                }
                console.log("inside processInputSheet")
                console.log('workbook');
                console.log(workbook);
                const monopoleInputIndex = workbook.Workbook.Sheets.findIndex((sheet: any) => {
                    if(sheet.name.toLowerCase() === 'Monopole Input'.toLowerCase() && sheet['Hidden'] == 0) {
                        return true;
                    }
                })
                // console.log(`monopoleInputIndex: ${monopoleInputIndex}`)
                const towerInputIndex = workbook.Workbook.Sheets.findIndex((sheet: any) => {
                    if(sheet.name.toLowerCase() === 'TOWER INPUT'.toLowerCase() && sheet['Hidden'] == 0) {
                        return true;
                    }
                })
                // console.log(`towerInputIndex: ${towerInputIndex}`)

        
                if(towerInputIndex > -1) {
                    // Process Tower Input Data
                    const sheetName = workbook.SheetNames[towerInputIndex];
                    const worksheet = workbook.Sheets[sheetName];
                    // console.log('worksheet data');
                    // console.log(worksheet);
                    const jsonArray: any = xlsx.utils.sheet_to_json(worksheet);
                    console.log("towerinput jsonArray");
                    console.log(jsonArray);
                    
                    // const towerInputContent = this.processTowerInput(jsonArray);
                    const towerInputContent = new TowerInputTdGenerator().processTowerInput(jsonArray);
                    response.towerInputContent = towerInputContent;
                }
        
                if(monopoleInputIndex > -1) {
                    const sheetName = workbook.SheetNames[monopoleInputIndex];
                    const worksheet = workbook.Sheets[sheetName];
                    // console.log('worksheet data');
                    // console.log(worksheet);
                    const jsonArray: any = xlsx.utils.sheet_to_json(worksheet);
                    console.log("monpole jsonArray");
                    console.log(jsonArray);
                    const monopoleInputContent = new MonopoleInputTdGenerator().processMonopoleInput(jsonArray);
                    response.monopoleInputContent = monopoleInputContent;
                }

                resolve(response);
         
            } catch(e: any) {
                reject(`Error while processInputSheet method execution, and error: ${e}`);
            }
            
        })


 

    }
}

export default FileUploadService;