import express from "express";
import axios from "axios";

const app = express();
const port = 3300;
const API_URL = "https://secrets-api.appbrewery.com/";

//TODO 1: Fill in your values for the 3 types of auth.
const yourUsername = "ChinaCatherine.Zhang";
const yourPassword = "987066#Zry";
const yourAPIKey = "ba8d3d19-4230-4a61-b71b-ead2db8fdea1";
const yourBearerToken = "5d3b4d25-f4d0-4d61-85c6-4b76692d5c57";

app.get("/", (req, res) => {
  res.render("index.ejs", { content: "API Response." });
});

app.get("/noAuth", async (req, res) => {
  let message = "No data.";
  try {
    console.log('url:', `${API_URL}random`)
    const response = await axios.get(`${API_URL}random`);
    console.log('response:', "response");
    message = JSON.stringify(response.data);
    res.render("index.ejs", { content: message });
  } catch (error) {
    if (error.response?.status === 404) {
      message = 'Not found.'
    } else {
      message = error.message;
    }
    res.render("index.ejs", { content: message });
  }
  //TODO 2: Use axios to hit up the /random endpoint
  //The data you get back should be sent to the ejs file as "content"
  //Hint: make sure you use JSON.stringify to turn the JS object from axios into a string.
});

app.get("/basicAuth", async (req, res) => {
  let data = '';
  try {
    const response = await axios.get(`${API_URL}all`, {
      auth: {
        username: yourUsername,
        password: yourPassword,
      },
    });
    data = JSON.stringify(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      data = 'Not found.'
    } else {
      data = error.message;
    }
  }
  res.render("index.ejs", { content: data });
  //TODO 3: Write your code here to hit up the /all endpoint
  //Specify that you only want the secrets from page 2
  //HINT: This is how you can use axios to do basic auth:
  // https://stackoverflow.com/a/74632908
  /*
   axios.get(URL, {
      auth: {
        username: "abc",
        password: "123",
      },
    });
  */
});

app.get("/apiKey", async (req, res) => {
  let data = '';
  try {
    const response = await axios.get(`${API_URL}filter?score=${req.query?.score || 5}&apiKey=${yourAPIKey}`);
    data = JSON.stringify(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      data = 'Not found.'
    } else {
      data = error.message;
    }
  }
  res.render("index.ejs", { content: data });
  //TODO 4: Write your code here to hit up the /filter endpoint
  //Filter for all secrets with an embarassment score of 5 or greater
  //HINT: You need to provide a query parameter of apiKey in the request.
});

app.get("/bearerToken", async (req, res) => {
  let data = '';
  try {
    const response = await axios.get(`${API_URL}secrets/${req.query?.id || 3}`, {
      headers: {
        Authorization: `Bearer ${yourBearerToken}`
      },
    });
    data = JSON.stringify(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      data = 'Not found.'
    } else {
      data = error.message;
    }
  }
  res.render("index.ejs", { content: data });
  //TODO 5: Write your code here to hit up the /secrets/{id} endpoint
  //and get the secret with id of 42
  //HINT: This is how you can use axios to do bearer token auth:
  // https://stackoverflow.com/a/52645402
  /*
  axios.get(URL, {
    headers: { 
      Authorization: `Bearer <YOUR TOKEN HERE>` 
    },
  });
  */
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
