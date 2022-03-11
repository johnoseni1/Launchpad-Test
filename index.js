const moment = require('moment');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const { api } = require('./backend');
const { delay, log, displayCountdown } = require('./utils');


const maxRetries = 3;

let state = {
	marginLoanRetries: 0,
	marginTransferRetries: 0,
	marginRepayRetries: 0,
	marginLoanTranId: 0,
	marginTransferTranId: 0,
	marginmarginRepayTranId: 0
};


// -------------------------------
const loanBNB = async (api, amount) => {

	//Loan BNB
	log(chalk.inverse.yellow(`Loaning ${amount} BNB | Retry ${state.marginLoanRetries}`));
	response = await api.marginLoan('BNB', amount);
	console.log('marginLoan', response);
	if (!response.success && state.marginLoanRetries < maxRetries) {
		// Error, retry again
		log(chalk.inverse.red(`Error loaning BNB. Error: ${response.data.code}`));
		state.marginLoanRetries++;
		let promise = new Promise(function(resolve, reject) {
			setTimeout(function() {
			  resolve(loanBNB(api, amount));
			},
			2000);
		});
		return await promise;
	} else {
		state.marginLoanTranId = response.data.tranId;
		log(chalk.inverse.green(`Success. tranId: ${state.marginLoanTranId}`));
		return response;
	}
}

// -------------------------------
const transferBNB = async (api, amount, type) => {

	// Transfer between accounts
	log(chalk.inverse.yellow(`Transfering ${amount} BNB between accounts | Retry ${state.marginTransferRetries}`));
	response = await api.marginTransfer('BNB', amount, type);
	console.log('marginTransfer', response);
	if (!response.success && state.marginTransferRetries < maxRetries) {
		// Error, retry again
		log(chalk.inverse.red(`Error transfering BNB. Error: ${response.data.code}`));
		state.marginTransferRetries++;
		let promise = new Promise(function(resolve, reject) {
			setTimeout(function() {
			  resolve(transferBNB(api, amount, type));
			},
			2000);
		});
	} else {
		state.marginTransferTranId = response.data.tranId;
		state.marginTransferRetries = 0;
		log(chalk.inverse.green(`Success. tranId: ${state.marginTransferTranId}`));
		return response;
	}
}

// -------------------------------
const repayBNB = async (api, amount) => {

	// Transfer between accounts
	log(chalk.inverse.yellow(`Repaying ${amount} BNB loan | Retry ${state.marginRepayRetries}`));
	response = await api.marginRepay('BNB', amount);
	console.log('marginRepay', response);
	if (!response.success && state.marginRepayRetries < maxRetries) {
		// Error, retry again
		log(chalk.inverse.red(`Error repaying BNB. Error: ${response.data.code}`));
		state.marginRepayRetries++;
		let promise = new Promise(function(resolve, reject) {
			setTimeout(function() {
			  resolve(repayBNB(api, amount));
			},
			2000);
		});
	} else {
		state.marginRepayTranId = response.data.tranId;
		state.marginRepayRetries = 0;
		log(chalk.inverse.green(`Success. tranId: ${state.marginRepayTranId}`));
		return response;
	}
}

// -------------------------------
(async function main(configFile) {

	console.clear();
	console.log('configFile', configFile);

	// Load the config file
	let CONFIG = JSON.parse(fs.readFileSync(configFile, 'utf8'));

	let binanceApi = api(CONFIG.apiKey, CONFIG.apiSecret);

	// Get margin account details
	marginDetails = await binanceApi.marginDetails();
	//console.log(marginDetails);

	let marginBnbBalance = 0;
    marginDetails.data.userAssets.forEach(function(element) {
         //console.log(element);
        if (element.asset == 'BNB')
            marginBnbBalance = parseFloat(element.free, 0);
    });
	console.log("Margin BNB Balance", marginBnbBalance);


/*
	marginLoanInfo = await binanceApi.marginLoanInfo('BNB', '');
	console.log('marginLoanInfo', marginLoanInfo.data);
    marginLoanInfo.data.rows.forEach(function(element) {
		//console.log(element);
	   if (element.asset == 'BNB' || element.status == 'PENDING')
		   marginBnbBalance = parseFloat(element.free, 0);
   });

	return;
*/

	let dateLoan = new Date();
	dateLoan.setUTCHours(23);
	dateLoan.setUTCMinutes(45);
	
	let dateRepay = new Date(dateLoan.getTime() + (1000*60*20)); // Add 20 minutes
	
	loanHourlyRate = 0.0125 / 100;
	// Test mode
	if (CONFIG.testMode) {
		loanHours = 1;
		dateLoan = new Date(new Date().getTime() + 10000);
		dateRepay = new Date(new Date().getTime() + 60000);
		loanAmount = 1;
		loanHours = 1;
	} else {
		loanAmount = CONFIG.loanAmount;
		loanHours = 2;
	}
	interest = loanAmount * loanHourlyRate * loanHours;
	repayAmount = loanAmount + interest;

	console.log('loanAmount', loanAmount);
	console.log('repayAmount', repayAmount);
	console.log('Interest', interest);

	if (marginBnbBalance < interest) {
		console.log(chalk.inverse.red('ERROR. BNB balance not sufficient to repay.'));
		return false;
	}
	
	let msRemainingLoan = dateLoan - moment().valueOf();
	
	// Display countdown to trade start
	log(`Executing loan at: ${chalk.blue(moment(dateLoan).format())}`);
	log(`Repaying loan at: ${chalk.blue(moment(dateRepay).format())}`);
	displayCountdown(dateLoan.getTime() - 1000); // stop countdown at 1s before start time.

	setTimeout( async () => {
	
		// Clear countdown timer
		readline.clearLine(process.stdout, 0);
		readline.cursorTo(process.stdout, 0);
	
		//Loan BNB
		response = await loanBNB(binanceApi, loanAmount);
		if (!response.success) {
			throw `Unable to loan BNB. Error: ${response.data.msg}`;
		} else {
			// Transfer to exchange account
			response = await transferBNB(binanceApi, loanAmount, 2);
			if (!response.success) {
				throw `Unable to transfer BNB. Error: ${response.data.msg}`;
			} else {
		
				// Wait until it's time to repay
				let msRemainingRepay = dateRepay - moment().valueOf();
				log(`Repaying loan at: ${chalk.blue(moment(dateRepay).format())}`);
				displayCountdown(dateRepay.getTime() - 1000); // stop countdown at 1s before start time.
				setTimeout( async () => {
				
					// Transfer back to margin account
					response = await transferBNB(binanceApi, loanAmount, 1);
					if (!response.success) {
						throw `Unable to transfer BNB. Error: ${response.data.msg}`;
					} else {
						// Repay loan
						repayBNB(binanceApi, repayAmount);
					}
	
				}, Math.max(0, msRemainingRepay));
			}
		}
	}, Math.max(0, msRemainingLoan));
	
})(process.argv[2]);