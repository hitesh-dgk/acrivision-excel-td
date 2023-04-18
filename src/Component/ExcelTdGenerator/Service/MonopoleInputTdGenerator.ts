

class MonopoleInputTdGenerator {

    constructor() {}

    public processMonopoleInput(jsonArray: any) {

        let headerCollector: any = {}
        const titleCollector: any[] = [];
        let headerCollectionDataFound = false;
        let panelHeader: any = {};
        let panelCollector: any = [];

        const firstRowFirstKey = Object.keys(jsonArray[0])[0];
        // console.log('firstRowFirstKey')
        // console.log(firstRowFirstKey)
        jsonArray.map((jsonData: any, index: number) => {
            // console.log('jsonData');
            // console.log(jsonData);
            const jsonDataKeys = Object.keys(jsonData);
            // console.log('jsonDataKeys');
            // console.log(jsonDataKeys);
            if (jsonDataKeys.includes(firstRowFirstKey)) {

                if (!headerCollectionDataFound) {
                    if (titleCollector.length == 0) {
                        let headerValue: any = {};
                        headerValue[jsonDataKeys[0]] = jsonDataKeys[1];
                        titleCollector.push(headerValue);
                    }
                    const firstColumnValue = jsonData[jsonDataKeys[0]].toLowerCase();
                    if(firstColumnValue.includes("panel")) {
                        panelHeader = jsonData;
                        headerCollectionDataFound = true;
                    } else {
                        let valueObject: any = {};
                        valueObject[jsonData[jsonDataKeys[0]]] = jsonData[jsonDataKeys[1]]
                        titleCollector.push(valueObject);
                    }
                } else {
                    let newObj: any = {};
                    jsonDataKeys.map((key: string) => {
                        const objKey = panelHeader[key].replace(/[\W_]/g, '');
                        newObj[objKey] = jsonData[key]  
                    })
                    panelCollector.push(newObj);
                }
            }

        })
        // console.log("titleCollector");
        // console.log(titleCollector)
        // console.log("panelCollector");
        // console.log(panelCollector)

        return this.geneateMonopoleInputTdFile(titleCollector, panelCollector);
    }

    private geneateMonopoleInputTdFile(titleCollector: any, panelCollector: any) {

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

        // console.log("firstRowValue: ", firstRowValue)
        // console.log(`towerType: ${towerType}`);
        // console.log(`towerHeight: ${towerHeight}`);
        // console.log(`towerWidth: ${towerWidth}`);

        let fileContent = `TITL1 ${firstRowValue}\nTITL2 ${towerHeight} m ${towerType}\n`;
        fileContent += `\nUNITS   1\nPROFILE\nFACES  1\n\n`;
        if(towerWidth) {
            fileContent += `WBASE ${towerWidth} \n`;
        }
        fileContent += `RLBAS 0.000\n\n`;

        panelCollector.map((panelInfo: any, index: number) => {

            fileContent += this.providePanelContentString(panelInfo, index)
        })

        console.log(fileContent);
        return fileContent;

    }

    private providePanelContentString = (panelInfo: any, index: any) => {
        let fileContent = "";
        let panelID = index + 1;
        let panelHeight = "";
        let panelWidth = "";
        Object.keys(panelInfo).map((key: string) => {
            const value = panelInfo[key];
            if (key.toLowerCase().includes("height")) {
                panelHeight = value;
            } else if (key.toLowerCase().includes("width")) {
                panelWidth = value;
            }
        })

        fileContent += `PANEL ${panelID} HT ${panelHeight}`;
        if (panelWidth) {
            fileContent += ` TW ${panelWidth}\n\n`;
        } else {
            fileContent += '\n\n';
        }
        return fileContent;

    }
} 

export default MonopoleInputTdGenerator;