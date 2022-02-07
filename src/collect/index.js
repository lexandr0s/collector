const config = require('../../config');
const {log, UBTTtoBTT} = require('../libs/utils.js');
const inAppTransfer = require('../libs/inAppTransfer.js');
const ledgerRPC = require('../libs/ledgerRPC.js');
const fs = require('fs');
const path = require('path');
const { PromisedDatabase } = require("promised-sqlite3");

const collect=config.collectors;
const base=config.base;
const pause=config.pause;

const db = new PromisedDatabase();


const createBase = async () => {
	fs.existsSync(path.dirname(base)) || fs.mkdirSync(path.dirname(base));
	
	const sqlstr1 = 'CREATE TABLE IF NOT EXISTS collectors ( \
		id INTEGER PRIMARY KEY AUTOINCREMENT, \
		name TEXT, \
		key TEXT, \
		active INTEGER)';

	const sqlstr2 = 'CREATE TABLE IF NOT EXISTS payers ( \
		id INTEGER PRIMARY KEY AUTOINCREMENT, \
		name TEXT, \
		key TEXT, \
		active INTEGER)';

	const sqlstr3 = 'CREATE TABLE IF NOT EXISTS transfer ( \
		id INTEGER PRIMARY KEY AUTOINCREMENT, \
		ts INTEGER, \
		payer INTEGER, \
		collector INTEGER, \
		amount REAL)';
	
	  
	await db.open(base);
	await db.run(sqlstr1);
	await db.run(sqlstr2);
	await db.run(sqlstr3);
	await db.close();
	const sqlstr4 = 'UPDATE collectors SET active = 0';
	const sqlstr5 = 'UPDATE payers SET active = 0';
	await db.open(base);
	await db.run(sqlstr4);
	await db.run(sqlstr5);
	await db.close();
}


const addAddress = async (table, name, key) => {

	let sql = `SELECT *
           FROM ${table}
           WHERE key = "${key}"`;

	await db.open(base);
	const query = await db.get (sql);
	if (typeof query == 'undefined')
	{
		let insSql = `INSERT INTO ${table} (name,key,active)
					VALUES ("${name}", "${key}", 1)`;
		await db.run(insSql);
	}
	else {
		let updSql = `UPDATE ${table}
					SET name = "${name}", active = 1
					WHERE key = "${key}"`;
		await db.run(updSql);
	}
	await db.close();
	
}


const prepDB = async () => {
	log.info ("DataBase preparation");
	await createBase();
	for (let i = 0; i < collect.length; i++){
		const collectAdr=collect[i].address;
		const collectName=collect[i].name;
		await addAddress ('collectors',collectName,collectAdr);
		const payers=collect[i].payers;
		for (let y = 0; y < payers.length; y++){
			await addAddress ('payers',payers[y].name,payers[y].key);
		}
	}
	log.info("The DataBase is ready to go");
}



const transfer = async () => {

	for (let i = 0; i < collect.length; i++){
		const collectAdr=collect[i].address;
		const collectName=collect[i].name;
		const payers=collect[i].payers;
		for (let y = 0; y < payers.length; y++){
			try {
				const transferResult = await inAppTransfer({
					payerPrivateKey: payers[y].key,
					recipientKey: collectAdr,
					amount: 'all'
				});
				const recipientBalance = (await ledgerRPC.createAccount({
					key: collectAdr
				})).account.balance
				await db.open(base);
				const collectorID = await db.get (`SELECT id, name FROM collectors WHERE key = "${collectAdr}"`);
				const payerID = await db.get (`SELECT id FROM payers WHERE key = "${payers[y].key}"`);
				let sql=`INSERT INTO transfer (ts, payer, collector, amount)
					VALUES (${Math.floor(Date.now()/1000)}, ${payerID.id}, ${collectorID.id}, ${UBTTtoBTT(transferResult.paymentAmount)})`;
				await db.run(sql);
				db.close();
				log.info(`Payer "${payers[y].name}": ` + UBTTtoBTT(transferResult.paymentAmount).toLocaleString().green + ` BTT -> collector "${collectorID.name}" ` + UBTTtoBTT(recipientBalance).toLocaleString().brightGreen + ' BTT');
			}
			catch (error) {
				//if (error.message === 'empty balance') log.debug(`Payer ${payers[y].name}: ${error.message}`)
				//else log.error(error);
				log.error (`"${payers[y].name}" ${error}`);
			}
		}
	}
};

const run = async () => {
    try {
        await transfer ();
    } catch (error) {
        log.info(error);
    } finally {
        setTimeout(run, pause);
    }
};

const prep = async () => {
	try {
		await prepDB();
		require('../api');
		run ();
    }
	catch (error) {
		log.info(error);
	}
}

prep();
