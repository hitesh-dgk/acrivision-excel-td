
import * as xlsx from "xlsx"

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
                let fileContent: any = ""
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    const data = e.target.result;
                    const workbook = xlsx.read(data, { type: "array" });
                    fileContent = this.processTowerInputSheet(workbook);
                    console.log("onload");
                    console.log(fileContent);
                    resolve(fileContent);

                };
                reader.readAsArrayBuffer(file);
            } catch (e: any) {
                reject(e);
            }
        })
    }

    private processTowerInputSheet(workbook: any): any {
        console.log("inside processTowerInputSheet")
        console.log('workbook');
        console.log(workbook);
        const towerInputIndex = workbook.SheetNames.findIndex((sheetname: string) => sheetname === 'TOWER INPUT')
        console.log(`towerInputIndex: ${towerInputIndex}`)
        const sheetName = workbook.SheetNames[towerInputIndex];
        const worksheet = workbook.Sheets[sheetName];
        console.log('worksheet data');
        console.log(worksheet);
        const jsonArray: any = xlsx.utils.sheet_to_json(worksheet);
        console.log(jsonArray);

        let headerCollector: any = {}
        const titleCollector: any[] = [];
        let headerCollectionDataFound = false;
        let panelInfoTypes: string[] = ["panel", "face", "hip", "bolt", "plan"];
        let panelInfoTypesBoundryCollector: any = []
        let panelInfoHeaderCollector: any[] = [];
        let panelInfoHeaderCollectionDataFound = false;

        let infoKeyBucketMapping: any = {};

        const rowData: any[] = [];



        const firstRowFirstKey = Object.keys(jsonArray[0])[0];
        jsonArray.map((jsonData: any, index: number) => {

            // console.log('jsonData');
            // console.log(jsonData);
            const jsonDataKeys = Object.keys(jsonData);
            // console.log('jsonDataKeys');
            // console.log(jsonDataKeys);
            if (jsonDataKeys.includes(firstRowFirstKey)) {
                // console.log(`first if case __rowNum__: ${jsonData['__rowNum__']}`);
                // data to read
                if (!headerCollectionDataFound) {
                    // console.log(`headerCollectionDataFound not found case __rowNum__: ${jsonData['__rowNum__']}`);
                    // process title collector and profile collector
                    if (titleCollector.length == 0) {
                        let headerValue: any = {};
                        headerValue[jsonDataKeys[0]] = jsonDataKeys[1];
                        titleCollector.push(headerValue);
                    }

                    let valueObject: any = {};
                    valueObject[jsonData[jsonDataKeys[0]]] = jsonData[jsonDataKeys[1]]
                    titleCollector.push(valueObject);
                } else {
                    // console.log(`headerCollectionDataFound found case __rowNum__: ${jsonData['__rowNum__']}`);

                    if (!panelInfoHeaderCollectionDataFound) {
                        const firstKeyValue: any = jsonData[firstRowFirstKey];
                        // console.log(`firstKeyValue => ${firstKeyValue}`)
                        if (typeof firstKeyValue === 'string') {
                            jsonDataKeys.map((dataKey: string) => {
                                const dataValueLowerCase = jsonData[dataKey].toLowerCase();
                                // console.log(`dataValueLowerCase -> ${dataValueLowerCase}`);
                                let processType = '';
                                panelInfoTypes.map((type: string) => {
                                    // console.log(`type => ${type}`);
                                    if (dataValueLowerCase.includes(type)) {
                                        processType = type;
                                    }
                                })
                                // console.log(`processType => ${processType}`)

                                const keyExists = panelInfoTypesBoundryCollector.find((element: any) => {
                                    const elementKey = Object.keys(element)[0];
                                    if (elementKey === processType) {
                                        return true
                                    }
                                });
                                // console.log(`keyExists => ${keyExists}`)
                                // console.log(keyExists);
                                if (!keyExists && processType) {
                                    if (panelInfoTypesBoundryCollector.length > 0) {
                                        const prevObject = { ...panelInfoTypesBoundryCollector[panelInfoTypesBoundryCollector.length - 1] }
                                        const prevObjectKeys = Object.keys(prevObject);
                                        let updatePrevObject = { ...prevObject[prevObjectKeys[0]] }
                                        updatePrevObject["endIndex"] = dataKey;
                                        let updatedObject = {
                                            [prevObjectKeys[0]]: updatePrevObject
                                        }

                                        panelInfoTypesBoundryCollector[panelInfoTypesBoundryCollector.length - 1] = updatedObject
                                    }
                                    let objStrucutre = {
                                        [processType]: {
                                            "startIndex": dataKey
                                        }
                                    }
                                    panelInfoTypesBoundryCollector.push(objStrucutre);
                                }

                            });

                            if (panelInfoTypesBoundryCollector.length > 0) {
                                panelInfoTypesBoundryCollector.map((dataObject: any) => {
                                    const dataObjectKeys = Object.keys(dataObject);
                                    const infoKey = dataObjectKeys[0];
                                    const dataObjectValue = dataObject[infoKey];
                                    let keyInfoObject: any = {};

                                    let startIndex = jsonDataKeys.indexOf(dataObjectValue.startIndex);
                                    let endIndex = jsonDataKeys.indexOf(dataObjectValue.endIndex);
                                    const collectorBucketKeys = jsonDataKeys.slice(startIndex, endIndex);
                                    collectorBucketKeys.map((key: string) => {
                                        keyInfoObject[key] = jsonData[key].replace(/[\W_]/g, '');
                                        infoKeyBucketMapping[key] = infoKey;
                                    })

                                    panelInfoHeaderCollector.push({ [infoKey]: keyInfoObject })

                                })
                            }

                            panelInfoHeaderCollectionDataFound = true;

                        }

                        // console.log('panelInfoTypesBoundryCollector');
                        // console.log(panelInfoTypesBoundryCollector);
                    } else {
                        // console.log(" process jsonData");

                        let rowObj: any = {}
                        jsonDataKeys.map((value: any, key: any) => {
                            // get bucket info
                            // console.log(`value => ${value}`)
                            const bucketType = infoKeyBucketMapping[value];
                            // console.log(`bucketType => ${bucketType}`);

                            const bucketHeaderInfo = panelInfoHeaderCollector.find((elementObj: any) => {
                                const elementObjKey = Object.keys(elementObj)[0];
                                if (elementObjKey === bucketType) {
                                    return elementObj[elementObjKey]
                                }

                            });

                            // console.log(`bucketHeaderInfo`);
                            // console.log(bucketHeaderInfo)

                            if (bucketHeaderInfo) {
                                if (!rowObj[bucketType]) {
                                    let infoObj: any = {};
                                    let currentCellValue = ""
                                    Object.keys(bucketHeaderInfo[bucketType]).map((key: string) => {
                                        // console.log(`key => ${key}`)
                                        infoObj[bucketHeaderInfo[bucketType][key]] = ""
                                        if (key === value) {
                                            currentCellValue = jsonData[key]
                                        }
                                    });
                                    infoObj[bucketHeaderInfo[bucketType][value]] = currentCellValue;
                                    // console.log(`infoObj`);
                                    // console.log(infoObj)
                                    rowObj[bucketType] = {...infoObj};
                                    // if(bucketType == 'plan') {
                                    //     console.log("if case")
                                    //     console.log(rowObj);
                                    // }
                                } else {
                                    // console.log("----")
                                    if(jsonData[value]) {
                                        const key = bucketHeaderInfo[bucketType][value]
                                        // if(bucketType == 'plan') {
                                        //     console.log("else block")
                                        //     console.log('rowObj');
                                        //     console.log(rowObj);
                                        //     console.log(`key => ${key}`)
                                        //     console.log(`value => ${value}`);
                                        //     console.log('jsonData[value]');
                                        //     console.log(jsonData[value]);
                                        //     console.log(`rowObj[bucketType][key]`);
                                        //     console.log(rowObj[bucketType][key])
                                        // }
                                        if(rowObj[bucketType][key]) {
                                            if(jsonData[value]) {
                                                rowObj[bucketType][key] = jsonData[value]
                                            }
    
                                        } else {
                                            console.log("here");
                                            rowObj[bucketType][key] = jsonData[value]
                                        }
                                    }
                                    // console.log('rowObj[bucketType]');
                                    // console.log(rowObj[bucketType]);
                                }
                            }
                        })
                        // console.log('rowObj');
                        // console.log(rowObj);

                        if (rowObj && Object.keys(rowObj).length > 0) {
                            this.collectSection(rowObj);
                            rowData.push(rowObj)
                        }
                    }
                }

            } else {
                // console.log(`first else case __rowNum__: ${jsonData['__rowNum__']}`);
                // Empty key collections
                if (!headerCollectionDataFound) {
                    headerCollector = jsonData;
                    headerCollectionDataFound = true;
                }
            }
        })

        // console.log('titleCollector');
        // console.log(titleCollector);
        // console.log('rowData');
        // console.log(rowData);
        // console.log('infoKeyBucketMapping');
        // console.log(infoKeyBucketMapping);
        // console.log('panelInfoTypesBoundryCollector');
        // console.log(panelInfoTypesBoundryCollector);
        // console.log('panelInfoHeaderCollector');
        // console.log(panelInfoHeaderCollector);
        // console.log('this.sections');
        // console.log(this.sections);

        this.processSectionCollection();



        const panelCollector: any = {};
        rowData.map((row: any, index: number) => {
            const panelObj = row['panel'];
            const panelID = panelObj[Object.keys(panelObj)[0]];

            if (!panelCollector[panelID]) {
                panelCollector[panelID] = [];
            }
            panelCollector[panelID].push(row);
        })

        // console.log('panelCollector');
        // console.log(panelCollector);
        // return "Done";
        return this.geneateTdFile(titleCollector, panelCollector);

    }

    private collectSection = (rowObj: any) => {

        Object.keys(rowObj).map((rowObjKey: string) => {
            if(['face', 'plan', 'hip'].includes(rowObjKey)) {
                // console.log("inside collectSection rowObjKey: ", rowObjKey);
                const rowTypeData = rowObj[rowObjKey];
                if(rowObjKey == 'face') {
                    // process face row obj 
                    Object.keys(rowTypeData).map((key: string) => {
                        const rowTypeDataValue = rowTypeData[key];
                        // console.log(`key => ${key}`)
                        // console.log(`rowTypeDataValue => ${rowTypeDataValue}`)
                        if(rowTypeDataValue) {
                            if( !key.includes("Type") ) {
                                if(key.includes("BR")) {
                                    // bracing
                                    // console.log("inside bracing case");
                                    if(!this.sections.bracings.includes(rowTypeDataValue)) {
                                        this.sections.bracings.push(rowTypeDataValue)
                                    }
                                } else if (key.includes("H")) {
                                    // Horizontal

                                    // console.log("inside Horizontal case");
                                    if(!this.sections.horizontals.includes(rowTypeDataValue)) {
                                        this.sections.horizontals.push(rowTypeDataValue)
                                    }

                                } else if (key.includes("R")) {
                                    // Redundant
                                    // console.log("inside Redundant case");
                                    if(!this.sections.redundants.includes(rowTypeDataValue)) {
                                        this.sections.redundants.push(rowTypeDataValue)
                                    }
                                } else if (key.includes("LEG")) {
                                    // Leg
                                    // console.log("inside legs case");
                                    if(!this.sections.legs.includes(rowTypeDataValue)) {
                                        this.sections.legs.push(rowTypeDataValue)
                                    }
                                }
    
                            }
                        }
                    })
                } else if (rowObjKey == 'plan') {

                    Object.keys(rowTypeData).map((key: string) => {
                        const rowTypeDataValue = rowTypeData[key];
                        // console.log(`key => ${key}`)
                        // console.log(`rowTypeDataValue => ${rowTypeDataValue}`)
                        if(rowTypeDataValue) {
                            if( key !== 'PlanType' && key !== 'Plan Type') {
                                // console.log("inside plan bracing case");
                                if(!this.sections.plan_bracings.includes(rowTypeDataValue)) {
                                    this.sections.plan_bracings.push(rowTypeDataValue)
                                }
                            }
                        }
                    })

                } else if (rowObjKey == 'hip') {

                    Object.keys(rowTypeData).map((key: string) => {
                        const rowTypeDataValue = rowTypeData[key];
                        // console.log(`key => ${key}`)
                        // console.log(`rowTypeDataValue => ${rowTypeDataValue}`)
                        if(rowTypeDataValue) {
                            if( key !== 'HipType' && key !== 'Hip Type') {
                                // console.log("inside hip bracing case");
                                if(!this.sections.hip_bracings.includes(rowTypeDataValue)) {
                                    this.sections.hip_bracings.push(rowTypeDataValue)
                                }
                            }
                        }
                    })

                }
            }
        });
        return rowObj;

    }

    private processSectionCollection = () => {

        let legsObject: any= {};
        let bracingsObject: any= {};
        let horizontalsObject: any= {};
        let redundantsObject: any= {};
        let plan_bracingsObject: any= {};
        let hip_bracingsObject: any= {};
        let currentId = 1;

        if(this.sections.legs.length > 0){
            this.sections.legs.map((value: string) => {
                legsObject[value] = currentId;
                currentId++;
            })

            this.sections.legs = legsObject;
        }
        if(this.sections.bracings.length > 0){
            this.sections.bracings.map((value: string) => {
                bracingsObject[value] = currentId;
                currentId++;
            })
            this.sections.bracings = bracingsObject;
        }
        if(this.sections.horizontals.length > 0){
            this.sections.horizontals.map((value: string) => {
                horizontalsObject[value] = currentId;
                currentId++;
            })
            this.sections.horizontals = horizontalsObject;
        }
        if(this.sections.redundants.length > 0){
            this.sections.redundants.map((value: string) => {
                redundantsObject[value] = currentId;
                currentId++;
            })
            this.sections.redundants = redundantsObject;
        }
        if(this.sections.plan_bracings.length > 0){
            this.sections.plan_bracings.map((value: string) => {
                plan_bracingsObject[value] = currentId;
                currentId++;
            })
            this.sections.plan_bracings = plan_bracingsObject;
        }
        if(this.sections.hip_bracings.length > 0){
            this.sections.hip_bracings.map((value: string) => {
                hip_bracingsObject[value] = currentId;
                currentId++;
            })
            this.sections.hip_bracings = hip_bracingsObject;
        }
    }

    private geneateTdFile = (titleCollector: any, panelCollector: any): string => {

        const todoNotes = `\n$ TODO:\n$ Remove '$' and replace '?' with appropriate\n$  section numbers in following PANEL blocks.\n\n`;

        let firstRowValue = titleCollector[0][Object.keys(titleCollector[0])[0]];
        let towerType: string = "";
        let towerHeight = "";
        let towerWidth = "";
        titleCollector.map((element: any) => {
            const eleObj = Object.keys(element);
            const lowerCasedValue = eleObj[0].toLowerCase();
            if (lowerCasedValue.includes("type")) {
                towerType = element[eleObj[0]]
            } else if (lowerCasedValue.includes("height")) {
                towerHeight = element[eleObj[0]]
            } else if (lowerCasedValue.includes("width")) {
                towerWidth = element[eleObj[0]]
            }
        })
        // console.log(`towerType: ${towerType}`);
        // console.log(`towerHeight: ${towerHeight}`);
        // console.log(`towerWidth: ${towerWidth}`);

        // add Title
        let fileContent = `TITL1 ${firstRowValue}\nTITL2 ${towerHeight} m ${towerType} ${firstRowValue}`;
        fileContent += `\n[UNITS] 1 $ 1=metric, 4=US\n\n`;

        let faces = 0;
        if (towerType) {
            const matches: any = towerType.match(/(\d+)/);
            if (matches) {
                faces = matches[0];
            }
        }
        // add Profile
        fileContent += `PROFILE\nFACES ${faces}\nWBASE ${towerWidth}\nRLBAS 0.0000\n`;

        // add todo note
        fileContent += todoNotes;


        // Add Panel info
        Object.keys(panelCollector).map((panelCollectorKey: any) => {
            console.log(`panelCollectorKey => ${panelCollectorKey}`)
            const collectionCount = panelCollector[panelCollectorKey].length;
            if (collectionCount > 1) {
                fileContent += `\n$ Panel ${panelCollectorKey} ${collectionCount} Bays\n`;
            }
            // console.log(`panelCollectorKey => ${panelCollectorKey}`)
            // console.log('panelCollector[panelCollectorKey]');
            // console.log(panelCollector[panelCollectorKey]);
            panelCollector[panelCollectorKey].map((panelInfo: any, index: number) => {

                if (panelInfo['panel']) {
                    const panelcontent = this.processPanelTd(panelInfo['panel'], collectionCount, index);
                    fileContent += panelcontent;
                }
                if(panelInfo['face']) {
                    const facecontent = this.processFaceTd(panelInfo['face']);
                    fileContent += facecontent;
                }
                if(panelInfo['plan']) {
                    const plancontent = this.processPlanTd(panelInfo['plan']);
                    fileContent += plancontent;
                }
                if(panelInfo['hip']) {
                    const hipcontent = this.processHipTd(panelInfo['hip']);
                    fileContent += hipcontent;
                }
            });
            // console.log('fileContent');
            // console.log(fileContent);
        })

        fileContent += `\nEND`;

        // Add section
        const sectionContent = this.processSectionId();
        fileContent += sectionContent;

        // 
        console.log('final fileContent');
        console.log(fileContent);
        return fileContent;
    }

    private processPanelTd = (panelData: any, collectionCount: any, index: any) => {

        let fileContent = "";
        let panelID = "";
        let panelHeight = "";
        let panelWidth = "";
        Object.keys(panelData).map((key: string) => {
            const value = panelData[key];
            if (key.toLowerCase().includes("height")) {
                panelHeight = value;
            } else if (key.toLowerCase().includes("width")) {
                panelWidth = value;
            } else {
                if (collectionCount > 1) {
                    panelID = value + '0' + (index + 1)
                } else {
                    panelID = value;
                }
            }
        })
        if (collectionCount == 1) {
            fileContent += '\n'
        }
        fileContent += `PANEL ${panelID} HT ${panelHeight}`;
        if (panelWidth) {
            fileContent += ` TW ${panelWidth}\n`;
        } else {
            fileContent += '\n';
        }
        return fileContent;
    }
    private processFaceTd = (faceData: any) => {
        let faceType = faceData['FaceType'];
        let leg = faceData['LEG'] ? faceData['LEG'] : faceData['Leg'];
        let fileContent = `\tFACE ${faceType} `;
        Object.keys(faceData).map((key: string) => {
            const value = faceData[key];
            if(value) {
                let id = '';
                if(key.includes("BR")) {
                    // bracing
                    id = this.sections.bracings[value];
                } else if (key.includes("H")) {
                    // Horizontal
                    id = this.sections.horizontals[value];


                } else if (key.includes("R")) {
                    // Redundant
                    id = this.sections.redundants[value];
                } else if (key.includes("LEG")) {
                    // Leg
                    id = this.sections.legs[value];
                }
                if(!key.includes("FaceType")) {
                    fileContent += `${key} ${id} `;
                }
            }
        })

        fileContent += '\n';

        return fileContent;
        // let faceType
    }

    private processPlanTd = (planData: any) => {
        let planType = planData['PlanType'];
        let fileContent = `\tPLAN ${planType} `;
        Object.keys(planData).map((key: string) => {
            const value = planData[key];
            if(value && key !== 'PlanType') {
                const id = this.sections.plan_bracings[value]
                fileContent += `${key} ${id} `;
            }
        });
        fileContent += '\n';
        return fileContent;
    }
    
    private processHipTd = (hipData: any) => {
        let hipType = hipData['HipType'];
        let fileContent = `\tHIP ${hipType} `;
        Object.keys(hipData).map((key: string) => {
            const value = hipData[key];
            if(value && key !== 'HipType') {
                const id = this.sections.hip_bracings[value]
                fileContent += `${key} ${id} `;
            }
        });
        fileContent += '\n';
        return fileContent;
    }

    private processSectionId = () => {
        let fileContent = `\nSECTIONS\n\tLIBR P:UK IFACT 1`;
        let defaultString = "FY 245 CONNECT C"
        if(this.sections.legs) {
            fileContent += "\n$ LEG";
            Object.keys(this.sections.legs).map((value: string) => {
                fileContent += `\n\t${this.sections.legs[value]} ${value} ` + defaultString;
            })
        }
        if(this.sections.bracings) {
            fileContent += "\n$ Bracings";
            Object.keys(this.sections.bracings).map((value: string) => {
                fileContent += `\n\t${this.sections.bracings[value]} ${value} ` + defaultString;
            })
        }
        if(this.sections.horizontals) {
            fileContent += "\n$ Horizontals";
            Object.keys(this.sections.horizontals).map((value: string) => {
                fileContent += `\n\t${this.sections.horizontals[value]} ${value} ` + defaultString;
            })
        }
        if(this.sections.redundants) {
            fileContent += "\n$ Redundants";
            Object.keys(this.sections.redundants).map((value: string) => {
                fileContent += `\n\t${this.sections.redundants[value]} ${value} ` + defaultString;
            })
        }
        if(this.sections.plan_bracings) {
            fileContent += "\n$ Plan Bracing";
            Object.keys(this.sections.plan_bracings).map((value: string) => {
                fileContent += `\n\t${this.sections.plan_bracings[value]} ${value} ` + defaultString;
            })
        }
        if(this.sections.hip_bracings) {
            fileContent += "\n$ Hip Bracing";
            Object.keys(this.sections.hip_bracings).map((value: string) => {
                fileContent += `\n\t${this.sections.hip_bracings[value]} ${value} ` + defaultString;
            })
        }

        return fileContent;

    }
}

export default FileUploadService;