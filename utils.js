const os = require('os');
const moment = require('moment');
const readline = require('readline');
const chalk = require('chalk');

const delay = ms => new Promise((r, j) => setTimeout(r, ms));

const log = (msg) => console.log(`[${moment().format('HH:mm:ss.SSS')}]`, msg);


// startTime is the start time of the event in milliseconds.
const displayCountdown = startTime => {

    const formatNumber = number => {
        if (number < 10) {
            return `0${number}`;
        } else {
            return number;
        }
    }

    let interval = setInterval(() => {
        if (moment().valueOf() >= startTime) {
            clearInterval(interval);
        } else {
            let secondsToGo = Math.round((startTime / 1000)) - moment().unix();
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);

            process.stdout.write(chalk.inverse(
                `${formatNumber(Math.floor(secondsToGo/(60*60)))}:` +
                `${formatNumber(Math.floor((secondsToGo/60) % 60 ))}:` +
                `${formatNumber(Math.floor(secondsToGo % 60))}`
            ));
        }
    },
    1000);
}

const getIPv4Addresses = () => {
    
    const interfaces = os.networkInterfaces();
  
      let addresses = [];
      // Get all IP addresses for the "default" network interface
      interfaceName = interfaces.eth0;
      var platform = os.platform();
      if (platform === 'darwin') {
        interfaceName = interfaces.en0;
      } else if (platform === 'win32') {
        interfaceName = interfaces.Ethernet;
      }
      
      interfaceName.forEach(function (interface) {
        if ('IPv4' !== interface.family || interface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }
        //console.log(interface.address);
        addresses.push(interface.address);
      });
      
      return addresses;
}
  
var indexIp = 0;
var arrayIp = getIPv4Addresses();
//var arrayIp = ['1', '2', '3'];
  
const getRotatingIpAddress = () => {
    indexIp++;
    if (indexIp >= arrayIp.length) { indexIp = 0 }
    if (arrayIp[indexIp] === '') { throw('Empty IP address!') };
    return arrayIp[indexIp];    
}


module.exports = {
    delay,
    log,
    displayCountdown,
    getIPv4Addresses,
    getRotatingIpAddress
};