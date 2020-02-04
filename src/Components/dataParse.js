import graphLabels from "./graphLabels";
import getIndex from '../DataParseHelpers/getIndex'
import removeMultiple from './removeMultiple'


const dataParse = (
  indexBy,
  data,
  crossFilter,
  startDate,
  endDate,
  additionalFilter,
  queryType
) => {
  try{
  let dataStructure = [];
  console.log('data at beginning', data)

  //when single filtering "Most Requested" graph
  if (queryType === "Sessions" && crossFilter === "") {
    data = filterByDate(data, startDate, endDate);
    data = removeMultiple(data)
    dataStructure = getIndex(data, indexBy);
    return getMostRequested(data, dataStructure, indexBy);
  }
  //when cross-filtering "Most Requested" as index
  else if (queryType === "Sessions" && crossFilter !== "") {
    data = filterByDate(data, startDate, endDate);
    data = removeMultiple(data)
    dataStructure = getIndex(data, indexBy);
    return setCrossedItems(data, dataStructure, crossFilter, indexBy, additionalFilter);
  } else {
    //telling function how to format data. See "graphLabels.js"
    dataStructure = graphLabels[`${indexBy}`].structure.map(item => item);
    //when cross-filtering and index is Not "Most Requested"
    if (crossFilter !== "") {
      data = removeMultiple(data)
      return setCrossedItems(data, dataStructure, crossFilter, indexBy, additionalFilter);
    } else {
      //when single filtering with index that is not "Most Requested"
      data = removeMultiple(data)
      return setItem(data, dataStructure, indexBy);
    }
  }
} catch (error) {
  alert("There was an error getting the data. This can happen if you select too many filters and there is no data for that subset. The page will automatically refresh.")
  window.location.reload()
}
};

const setCrossedItems = (data, dataStructure, crossFilter, indexBy, additionalFilter) => {
  //will be used to store all possible values for the index value, which is referring to a column in the database table
  let indexByValues = [];
  //will be used to store all possible values for the cross filter value, which is referring to a column in the database table
  let crossFilterValues = [];
  //will be used to store array of objects, where the key will be what is being cross filtered by / "crossFilter"
  // and the value is every possible value for that cross filter in the database
  let crossFilterKeys = [];

  // IF NOT A "MOST REQUESTED" GRAPH, SETS THE KEYS IN A PREDETERMINED ORDER BASED ON WHAT ORDER LANCE WANTS THEM IN
  // OTHERWISE IT IS GOING TO BE SORTED MOST TO LEAST REQUESTED AT A LATER TIME
  if (graphLabels[`${crossFilter}`]) {
    crossFilterKeys = graphLabels[`${crossFilter}`].structure;
  } else {
    crossFilterKeys = getIndex(data, crossFilter)
  }

  // Puts each value from key:value pair into an array
  // ['Female', 'Male', null]
  dataStructure.forEach(obj => indexByValues.push(Object.values(obj)[0]));
  crossFilterKeys.forEach(obj =>
    Object.values(obj)[0] !== null &&
    crossFilterValues.push(Object.values(obj)[0])
  );

  // Building an array of objects where each object is formatted in this way
  // ex: if indexBy = "gender" and crossFilter = "age"
  // {"gender": "Male", "10-20": 167, "20-30": 237, "30-40": 642, "40-50": 210, "50-60": 123, "60-70": 1}
  // There will be an object like this for each value of the indexByValues ex: ["Male", "Female"]
  indexByValues.forEach((key, index) => {
    const crossFilteredData = [];
    const filtered = data.filter(trader => trader[`${indexBy}`] === key);
    crossFilterValues.forEach((key, index) => {
      const crossFiltered = filtered.filter(
        trader => trader[`${crossFilter}`] === key
      );
      crossFilteredData.push({ [`${key}`]: crossFiltered.length });
    })
    crossFilteredData.forEach(obj => {
      return (dataStructure[index] = {
        ...dataStructure[index],
        [`${Object.keys(obj)[0]}`]: [`${Object.values(obj)[0]}`][0]
      })
    })
  });

  //If graph is "Most Requested" sort from Most to Least requested and provide top 7 objects
  let keyValueArrIndex = [];
  let keyValueArrCross = [];
  let newDataStructure = [];

  if (!graphLabels[`${indexBy}`] && graphLabels[`${crossFilter}`]) {
    dataStructure.map(obj => {
      return keyValueArrIndex.push([
        obj[`${indexBy}`],
        Object.values(obj)
          .slice(1)
          .reduce((a, b) => a + b)
      ]);
    })
    keyValueArrIndex = keyValueArrIndex.sort((a, b) => b[1] - a[1]).slice(0, 7);
    keyValueArrIndex.forEach(arr => {
      for (let i = 0, len = dataStructure.length; i < len; i++) {
        if (arr[0] === dataStructure[i][`${indexBy}`]) {
          newDataStructure.push(dataStructure[i]);
        }
      }
    }
    );
    dataStructure = newDataStructure
  };

  if (!graphLabels[`${crossFilter}`] && graphLabels[`${indexBy}`]) {
    dataStructure.forEach(obj => {
      let crossKeys = Object.keys(obj);
      let crossValues = Object.values(obj);
      let tempCrossArr = [];
      crossKeys.forEach((key, index) => {
        tempCrossArr.push([key, crossValues[index]])
      })
      let slicedCrossArr = tempCrossArr.sort((a, b) => b[1] - a[1]).slice(0, 7)
      crossFilterValues = []
      slicedCrossArr.slice(1).forEach(arr => {
        crossFilterValues.push(arr[0])
      })
      let tempObj = {};
      slicedCrossArr.forEach(arr => {
        tempObj = { ...tempObj, [arr[0]]: arr[1] }
      })
      newDataStructure.push(tempObj)
    })
    dataStructure = newDataStructure
  };

  if (!graphLabels[`${crossFilter}`] && !graphLabels[`${indexBy}`]) {
    //commodityproduct: "Maize", "KEN": 123, "RWA": 200
    //commodityproduct: "Beans", "KEN": 152, "RWA": 478
    dataStructure.map(obj => {
      if (obj[`${indexBy}`] !== null && obj[`${indexBy}`] !== undefined) {
        return keyValueArrIndex.push([
          obj[`${indexBy}`],
          Object.values(obj)
            .slice(1)
            .reduce((a, b) => +a + +b)
        ])
      };
    })
    keyValueArrIndex = keyValueArrIndex.sort((a, b) => b[1] - a[1]).slice(0, 7);
    console.log('keyvalArr', keyValueArrIndex)
    keyValueArrIndex.forEach(arr => {
      newDataStructure.push({ [indexBy]: arr[0] })
    })
    let topSeven = []
    newDataStructure.forEach(item => {
      topSeven.push(item[`${indexBy}`])
    })
    dataStructure = dataStructure.filter(obj => topSeven.includes(obj[`${indexBy}`]))
    let keysToSort = Object.keys(dataStructure[0]).slice(1)
    let tempObj = {}
    keysToSort.forEach(item => {
      return tempObj = { ...tempObj, [`${item}`]: 0 }
    })
    keysToSort = tempObj
    dataStructure.forEach(obj => {
      for (var key in obj) {
        if (Number.isInteger(+obj[key]))
          keysToSort[key] += Number(obj[key])
      }
    })

    let crossKeys = Object.keys(keysToSort).filter(item => item !== undefined && item !== 'undefined');
    let crossValues = Object.values(keysToSort);
    let tempCrossArr = [];
    crossKeys.forEach((key, index) => {
      tempCrossArr.push([key, crossValues[index]])
    })
    let slicedCrossArr = tempCrossArr.sort((a, b) => b[1] - a[1]).slice(0, 7)
    crossFilterValues = []
    slicedCrossArr.forEach(arr => {
      crossFilterValues.push(arr[0])
    })
    let temp = {};
    slicedCrossArr.forEach(arr => {
      temp = { ...temp, [arr[0]]: arr[1] }
    })

    keysToSort = temp

    let keysToKeep = Object.keys(keysToSort)

    //build on new ds from ds
    dataStructure.forEach((obj, index) => {
      let tempObject = { [indexBy]: obj[indexBy] }
      for (var key in obj) {
        if (keysToKeep.includes(key)) {
          tempObject = { ...tempObject, [key]: obj[key] }
        }
      }
      console.log('temp object tho', tempObject)
      dataStructure[index] = tempObject
    })

    console.log('data structer what up', dataStructure)

  }

  /// KEYS TO SORT IS AN ARRAY OF OBJECTS YOU IDIOT


  dataStructure = dataStructure.filter(obj => obj[`${indexBy}`] !== null);


  // GET SAMPLE SIZE
  // For each object, want to add up numbers skipping first key value pair, which is the index and will not have a number as value
  //[{gender: "Male", "10-20": 200, "20-30": 150}, {gender: "Female", "10-20": 140, "20-30": 100}]
  // add values where not indexing by
  // {"Male": 350, "Female": 240}
  let sampleArr = {};
  dataStructure.map(item => {
    let sampleSize = 0;

    //["Male", "130", "100", "34"]
    let valuesArr = Object.values(item);
    valuesArr.forEach(value => {
      if (Number.isInteger(+value)) {
        return sampleSize += Number(value);
      };
    });

    return sampleArr = {
      ...sampleArr,
      [`${valuesArr[0]}`]: sampleSize
    };
  });

  //This is the sampleSize of all responses {"Male": 153, "Female": 124 => totalSampleSize: 277}
  let totalSampleSize = Object.values(sampleArr).reduce((a, b) => a + b);

  //CHANGE VALUES TO PERCENTAGE OF SAMPLE SIZE
  //[{gender: "Male", "10-20": 200, "20-30": 150},{gender: "Female", "10-20": 140, "20-30": 100}]

  // dataStructure becomes data set for a csv file, and percentageData is for nivo chart.
  let percentageData = dataStructure.map(obj => Object.assign({}, obj))

  percentageData.forEach(obj => {
    for (var property in obj) {
      if (Number.isInteger(+obj[property])) {
        obj[property] = +(
          (obj[property] /
            sampleArr[
            obj[`${indexBy}`]
            ]) *
          100
        ).toFixed(1);
      }
    }
  });

  // ABBREVIATE LABELS IF THERE ARE ANY TO ABBREVIATE (SEE BELOW)
  abbreviateLabels(percentageData, indexBy);

  const additionalFilterOptions = getIndex(data, additionalFilter)
    .map(obj => Object.values(obj)[0])
    .filter(str => str !== null)



  console.log('datastructure', dataStructure)
  console.log('crossfiltervalues', crossFilterValues)
  console.log('percentageData', percentageData)
  return { dataStructure, crossFilterValues, indexBy, totalSampleSize, additionalFilterOptions, percentageData };
};

// Sets single filter index
// Puts each value from key:value pair into an array
// ['Female', 'Male', null]
const setItem = (data, dataStructure, indexBy) => {

  let arr = [];
  dataStructure.forEach(obj => arr.push(Object.values(obj)[0]));

  // For each object get every trader at the index where it equals the value in the arr
  arr.forEach((key, index) => {
    const filtered = data.filter(trader => trader[`${indexBy}`] === key).length;
    dataStructure[index] = {
      ...dataStructure[index],
      [`${arr[index]}`]: filtered
    };
  });

  // This block of code transforms from raw numbers to rounded percentages
  let numberValues = [];
  let sampleSize = 0;

  dataStructure.map(item => {
    const keyValue = item[`${indexBy}`];
    numberValues.push(Number(item[keyValue]));
    return sampleSize += Number(item[keyValue]);
  });

  let percentageData = dataStructure.map(obj => Object.assign({}, obj))

  percentageData.forEach(obj => {
    const keyValue = obj[`${indexBy}`];
    obj[keyValue] = ((obj[keyValue] / sampleSize) * 100).toFixed(1);
  });

  return {
    dataStructure,
    percentageData,
    keys: graphLabels[`${indexBy}`].labels,
    indexBy,
    sampleSize
  };
};

//Builds data for Nivo when single filtering by "Most Requested"
const getMostRequested = (data, dataStructure, indexBy) => {

  let arr = [];

  // Puts each value from key:value pair into an array
  // ['Maize', 'Clothes', 'Bananas']
  dataStructure.forEach(obj => arr.push(Object.values(obj)[0]));

  // For each object get every trader at the index where it equals the value in the arr
  arr.forEach((key, index) => {
    const filtered = data.filter(value => value[`${indexBy}`] === key)
      .length;

    dataStructure[index] = {
      ...dataStructure[index],
      [`${arr[index]}`]: filtered
    };
  });

  dataStructure = dataStructure.filter(obj =>
    obj[`${indexBy}`] !== null
  );

  // This block of code transforms from raw numbers to percentages
  let sampleSize = 0;

  dataStructure.map(item => {
    let keyValue = item[`${indexBy}`];
    return sampleSize += Number(item[keyValue]);
  });
  const csvKeys = dataStructure.map(obj => obj[`${indexBy}`]);
  let percentageData = dataStructure.map(obj => Object.assign({}, obj));

  percentageData.forEach(obj => {
    const keyValue = obj[`${indexBy}`];
    obj[keyValue] = ((obj[keyValue] / sampleSize) * 100)
  });

  // dataStructure used for csv, percentage for graph
  percentageData = percentageData.sort((a, b) => Object.values(a)[1] > Object.values(b)[1] ? -1 : 1);
  dataStructure = dataStructure.sort((a, b) => Object.values(a)[1] > Object.values(b)[1] ? -1 : 1);


  let combinedNondisplayedEntries = percentageData.slice(6, percentageData.length - 1);
  let count = 0;

  combinedNondisplayedEntries.forEach(obj => {
    let tempVar = obj[`${indexBy}`]
    count += +obj[tempVar]
  })

  percentageData = percentageData.slice(0, 6)
  
  percentageData.forEach(obj => {
    let tempVar = obj[`${indexBy}`]
    obj[tempVar] = obj[tempVar].toFixed(0)
  });
  
  percentageData.push({ [indexBy]: "Other", "Other": count.toFixed(0) })

  const keys = percentageData.map(obj => obj[`${indexBy}`]);

  //Function abbreviates graph labels
  if (
    indexBy === "procedurerelevantagency" ||
    indexBy === "procedurerequireddocument" ||
    indexBy === "procedurecommodity" ||
    indexBy === "procedureorigin"
  ) {
    abbreviateLabels(percentageData, indexBy);
  }

  return { dataStructure, keys: keys.reverse(), csvKeys, indexBy, sampleSize, percentageData };
};

//This function is invoked when filtering by certain categories where the keys may be too long for Nivo to display
const abbreviateLabels = (dataStructure, indexBy) => {
  let replaceValues = {
    //Agencies
    "Ministry of Agriculture Animal Industry & Fisheries (MAAIF)": "MAAIF",
    "Kenya Revenue Authority (KRA)": "KRA",
    "COMESA Trade Information Desk Office (TIDO)": "TIDO",
    "Uganda National Bureau of Standards (UNBS)": "UNBS",
    "PORT Health": "PORT Health",
    "Kenya Plant Health Inspectorate Service (KEPHIS)": "KEPHIS",
    "Uganda Revenue Authority (URA)": "URA",
    "Kenya Bureau of Standards (KEBS)": "KEBS",
    "National Biosafety Authority (NBA)": "NBA",
    "Kenya National Chamber of Commerce & Industry (KNCCI)": "KNCCI",
    "Clearing Agent": "Clearing Agent",
    "Uganda Police Dpts": "UPD",
    //Documents
    "Import Permit": "Import Permit",
    "Valid Invoice": "Valid Invoice",
    "Simplified Certificate Of Origin (SCOO)": "SCOO",
    "National ID Card/Passport": "Passport/ID",
    "Yellow Fever Card": "YF Card",
    "Certificate of Origin": "Cert of Origin",
    "Phytosanitary Certificate": "Phyto Cert",
    "Import Entry Declaration Form (SAD)": "SAD",
    "Fumigation Certificate": "Fumigation Cert",
    "Bill of Lading": "Bill of Lading",
    //Procedure Commodity
    "Clothes and Shoes (New)": "Clothes/Shoes (New)",
    "Clothes and Shoes (Used)": "Clothes/Shoes (Used)",
    //
    OutsideEAC: "Outside EAC"
  };
  dataStructure.forEach(obj => {
    let longValue = obj[`${indexBy}`];
    if (replaceValues[`${longValue}`]) {
      obj[`${indexBy}`] = replaceValues[`${longValue}`];
    }
  });

  return dataStructure;
};

const filterByDate = (data, startDate, endDate) => {
  startDate = startDate.replace(/-/g, "");
  endDate = endDate.replace(/-/g, "");


  const filteredData = data.filter(obj => {
    const objectDate = +obj.created_date.split("T")[0].replace(/-/g, "");
    return objectDate > startDate && objectDate < endDate;
  });

  return filteredData;
};

export default dataParse;