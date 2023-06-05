const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertMovieNamePascalCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getAllStateQuery = `
         SELECT 
         * 
         FROM 
         state;`;
  const statesArray = await database.all(getAllStateQuery);
  response.send(
    statesArray.map((stateObject) => convertMovieNamePascalCase(stateObject))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieQuery = `
         SELECT 
         * 
         FROM 
         state
         WHERE 
         state_id = ${stateId};`;
  const state = await database.get(getMovieQuery);
  response.send(convertMovieNamePascalCase(state));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
         INSERT INTO
         district (district_name,state_id,cases,cured,active,deaths) 
         VALUES 
         (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths});`;

  const databaseResponse = await database.run(addDistrictQuery);
  response.send("District Successfully Added");
});

const convertDistrictPascalCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
         SELECT 
         * 
         FROM 
         district
         WHERE 
         district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictPascalCase(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
          
         DELETE 
         FROM 
         district
         WHERE 
         district_id = ${districtId};`;
  await database.get(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = ` 
        UPDATE 
        district
        SET 
            district_name = '${districtName}'  
            state_id= ${stateId},
            cases= ${cases},
            cured=${cured},
            active= ${active},
            deaths=${deaths}
           
        WHERE 
            district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getDistrictQuery = `
         SELECT 
             SUM(cases) AS totalCases,  
             SUM(cured) AS totalCured, 
             SUM(active) AS totalActive, 
             SUM(deaths) AS totalDeaths  
         FROM
         district 
         
         WHERE 
         state_id = ${stateId};`;
  const district = await database.get(getDistrictQuery);
  response.send(district);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictsQuery = `
         SELECT 
         state_name AS stateName
         FROM 
         district  
         INNER JOIN ON district.state_id=state.state_id
         WHERE 
         district_id = ${districtId};`;
  const stateName = await database.get(getDistrictsQuery);
  response.send(stateName);
});

module.exports = app;
