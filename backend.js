const crypto = require('crypto');
const request = require('request');
const moment = require('moment');
const { delay, getRotatingIpAddress } = require('./utils');

const API_ENDPOINTS = {
    'SERVER_TIME': 'https://api.binance.com/api/v1/time',
    'EXCHANGE_INFO': 'https://api.binance.com/api/v1/exchangeInfo',
    'GET_ORDER_BOOK': 'https://api.binance.com/api/v3/ticker/bookTicker',
    'PLACE_ORDER': 'https://api.binance.com/api/v3/order',
    'CANCEL_ORDER': 'https://api.binance.com/api/v3/order',
    'TEST_ORDER': 'https://api.binance.com/api/v3/order/test',
    'MARGIN_DETAILS': 'https://api.binance.com/sapi/v1/margin/account',
    'MARGIN_LOAN': 'https://api.binance.com/sapi/v1/margin/loan',
    'MARGIN_REPAY': 'https://api.binance.com/sapi/v1/margin/repay',
    'MARGIN_TRANSFER': 'https://api.binance.com/sapi/v1/margin/transfer',
    'MARGIN_ASSET': 'https://api.binance.com/sapi/v1/margin/asset'
};

const api = (key, secret) => {

    let apiSecret = secret;
    let apiKey = key;
    let requestDelay = 0;

    const sendRequest = async (options) => {
        if (requestDelay > 0 ) {
            await delay(requestDelay);
        }
        
        return new Promise((resolve, reject) => {

            request(options, (error, response, body) => {
                let success = (!error && response.statusCode == 200) ? true : false;

                if (response.statusCode == 429 || response.statusCode == 418) {
                    requestDelay = (response.headers['Retry-After'] || 0) * 1000;
                } else {
                    requestDelay = 0;
                }

                resolve(
                    {
                        success: success,
                        ipAddress: options.localAddress,
                        httpCode: response.statusCode,
                        data: JSON.parse(body)
                    }
                );
            });
        });
    }

    return {
        getExchangeInfo: async () => {
            const options = {
                url: API_ENDPOINTS['EXCHANGE_INFO'],
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true
            };

            return await sendRequest(options);
        },

        /*
            order: {
                symbol: String,
                side: String,
                type: String,
                quantity: String,
                price: String
            }
        */
        placeOrder: async (order, isTest) => {
            const timestamp = moment().valueOf();
            let requestBody = `symbol=${order.symbol}&side=${order.side}&type=${order.type}&quantity=${order.quantity}&price=${order.price}&timeInForce=GTC&timestamp=${timestamp}`;
            const sign = crypto.createHmac('sha256', apiSecret).update(requestBody).digest('hex');

            requestBody = `${requestBody}&signature=${sign}`;
            
            const options = {
                url: isTest ? API_ENDPOINTS['TEST_ORDER'] : API_ENDPOINTS['PLACE_ORDER'],
                method: 'POST',
                localAddress: getRotatingIpAddress(), // local interface to bind for network connections.
                family: 4, // Must be 4 or 6 if this doesn't equal undefined. IPv4 or IPv6
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true,
                form: requestBody
            };

            return await sendRequest(options);
        },

        getOrderBook: async (symbol) => {
            const options = {
                url: `${API_ENDPOINTS['GET_ORDER_BOOK']}?symbol=${symbol}`,
                method: 'GET',
                localAddress: getRotatingIpAddress(), // local interface to bind for network connections.
                family: 4, // Must be 4 or 6 if this doesn't equal undefined. IPv4 or IPv6
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true
            };

            return await sendRequest(options);
        },

        cancelOrder: async (symbol, orderId) => {
            const timestamp = moment().valueOf();
            let requestBody = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
            const sign = crypto.createHmac('sha256', apiSecret).update(requestBody).digest('hex');
            requestBody = `${requestBody}&signature=${sign}`;

            const options = {
                url: API_ENDPOINTS['CANCEL_ORDER'],
                method: 'DELETE',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true,
                form: requestBody
            };
            //console.log(options);
            return await sendRequest(options);
        },

        marginDetails: async() => {
            const options = {
                url: API_ENDPOINTS['MARGIN_DETAILS'],
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true
            };
            return await sendRequest(options);
        },

        marginLoan: async(asset, amount) => {
            const timestamp = moment().valueOf();
            let requestBody = `asset=${asset}&amount=${amount}&timestamp=${timestamp}`;
            const sign = crypto.createHmac('sha256', apiSecret).update(requestBody).digest('hex');
            requestBody = `${requestBody}&signature=${sign}`;

            const options = {
                url: API_ENDPOINTS['MARGIN_LOAN'],
                method: 'POST',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true,
                form: requestBody
            };
            //console.log(options);
            return await sendRequest(options);
        },

        marginRepay: async(asset, amount) => {
            const timestamp = moment().valueOf();
            let requestBody = `asset=${asset}&amount=${amount}&timestamp=${timestamp}`;
            const sign = crypto.createHmac('sha256', apiSecret).update(requestBody).digest('hex');
            requestBody = `${requestBody}&signature=${sign}`;

            const options = {
                url: API_ENDPOINTS['MARGIN_REPAY'],
                method: 'POST',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true,
                form: requestBody
            };
            //console.log(options);
            return await sendRequest(options);
        },

        marginTransfer: async(asset, amount, type) => {
            const timestamp = moment().valueOf();
            let requestBody = `asset=${asset}&amount=${amount}&type=${type}&timestamp=${timestamp}`;
            const sign = crypto.createHmac('sha256', apiSecret).update(requestBody).digest('hex');
            requestBody = `${requestBody}&signature=${sign}`;

            const options = {
                url: API_ENDPOINTS['MARGIN_TRANSFER'],
                method: 'POST',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true,
                form: requestBody
            };
            //console.log(options);
            return await sendRequest(options);
        }

/*
        marginLoanInfo: async(asset, txId) => {

            let startTime = new Date().getTime() - 1000*60*60;
            console.log('startTime', startTime);

            const timestamp = moment().valueOf();
            let parameters = `asset=${asset}&txId=${txId}&startTime=${startTime}&timestamp=${timestamp}`;
            const sign = crypto.createHmac('sha256', apiSecret).update(parameters).digest('hex');
            parameters = `${parameters}&signature=${sign}`;

            const options = {
                url: `${API_ENDPOINTS['MARGIN_LOAN']}?${parameters}`,
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                forever: true
            };
            return await sendRequest(options);
        }
*/

    };
};

module.exports = {
    api: api
};