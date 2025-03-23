const axios = require('axios');

const appClient = axios.create({
  baseURL: process.env.BASE_URL_APP_API,
});

const AppAPI = {
    DONOR_TO_QUALIFIED: '/convert-donor-to-qualified',
    LITERACY_CHECK: '/fetch-donor-literacy-check',
};

module.exports = {
    appClient,
    AppAPI
};
