const config = require('../../config');
const { PromisedDatabase } = require("promised-sqlite3");
const express = require("express");
const host=config.host
const port=config.port
const base=config.base;
const db = new PromisedDatabase();
const api = express();

api.use(express.static(`${__dirname}/public`));
api.use('/payers', express.static(`${__dirname}/public/payers`));

function filterById (arr, id) {
    return arr.filter(function(item, i, arr) {
        return (item.id == id);
    });
  };

const queryCollectors = async () => {
	try {
	await db.open(base);
	let sql=`SELECT transfer.collector as id, collectors.name, MAX(transfer.ts) as last_ts
			FROM transfer INNER JOIN collectors ON transfer.collector=collectors.id
			GROUP BY transfer.collector`;
	const res_all=await db.all(sql);
	sql=`SELECT collector as id, ROUND(SUM(amount),2) as hour
			FROM transfer
			WHERE ts > ${Date.now()/1000 - 60*60}
			GROUP BY collector`;
	const res_hour=await db.all(sql);
	sql=`SELECT collector as id, ROUND(SUM(amount),2) as day
			FROM transfer
			WHERE ts > ${Date.now()/1000 - 24*60*60}
			GROUP BY collector`;
	const res_day=await db.all(sql);
	sql=`SELECT collector as id, ROUND(SUM(amount),2) as total
			FROM transfer
			GROUP BY collector`;
	const res_total=await db.all(sql);
	await db.close;
	let res=res_all;
	res.forEach(item => {
			let hour = filterById (res_hour,item.id);
			let day = filterById (res_day,item.id);
			let total = filterById (res_total,item.id);
			item.hour=0;
			if (hour.length >0 ) item.hour=hour[0].hour;
			item.day=0;
            if (day.length >0 )item.day=day[0].day;
			item.total=0;
			if (total.length >0 ) item.total=total[0].total;
        });
	return res;
	}
	catch (error) {
		return error;
	}
}	

const queryPayers = async (collectorId) => {
	try {
	await db.open(base);
	let sql=`SELECT transfer.payer as id, payers.name, MAX(transfer.ts) as last_ts
			FROM transfer INNER JOIN payers ON transfer.payer=payers.id
			WHERE transfer.collector = ${collectorId}
			GROUP BY transfer.payer`;
	const res_all=await db.all(sql);
	sql=`SELECT payer as id, ROUND(SUM(amount),2) as hour
			FROM transfer
			WHERE collector = ${collectorId} AND ts > ${Date.now()/1000 - 60*60}
			GROUP BY payer`;
	const res_hour=await db.all(sql);
	sql=`SELECT payer as id, ROUND(SUM(amount),2) as day
			FROM transfer
			WHERE collector = ${collectorId} AND ts > ${Date.now()/1000 - 24*60*60} 
			GROUP BY payer`;
	const res_day=await db.all(sql);
	sql=`SELECT payer as id, ROUND(SUM(amount),2) as total
			FROM transfer
			WHERE collector = ${collectorId}
			GROUP BY payer`;
	const res_total=await db.all(sql);
	await db.close;
	let res=res_all;
	res.forEach(item => {
			let hour = filterById (res_hour,item.id);
			let day = filterById (res_day,item.id);
			let total = filterById (res_total,item.id);
			item.hour=0;
			if (hour.length >0 ) item.hour=hour[0].hour;
			item.day=0;
            if (day.length >0 )item.day=day[0].day;
			item.total=0;
			if (total.length >0 ) item.total=total[0].total;
        });
	return res;
	}
	catch (error) {
		return error;
	}
}	


api.get("/api/collectors", async function(req, res){
       
 	const collectors=await queryCollectors ();
	res.send(collectors);
});

api.get("/api/payers", async function(req, res){
    api.use(express.static(__dirname + "/public"));
 	const payers=await queryPayers (req.query.collector,req.query.sort);
    res.send(payers);
});

   
api.listen(port, host, function(){
    console.log(`Server ready to connect on http:\\\\${host}:${port}`);
});