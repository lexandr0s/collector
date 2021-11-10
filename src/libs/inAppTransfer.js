const ledgerRPC = require('./ledgerRPC.js')

module.exports = async function({payerPrivateKey, recipientKey, amount}){
    const payerBalance = (await ledgerRPC.createAccount({
        key: payerPrivateKey
    })).account.balance;

    const processTransfer = async (paymentAmount) => {
        const transactions = [];
        if (paymentAmount) transactions.push(ledgerRPC.transfer({
            payerPrivateKey: payerPrivateKey,
            recipientKey: recipientKey,
            amount: paymentAmount
        }));

        const result = await Promise.all(transactions);
        return {
            paymentAmount,
            payerNewBalance: result[0].balance
        };
    }

    if (payerBalance <= 0) throw new Error('empty balance');
    else if (typeof amount === 'string' && amount === 'all') {
        const paymentAmount = payerBalance;
        return await processTransfer(paymentAmount);
    } else if (typeof amount === 'number') {
        const requestedAmount = amount;
        if (payerBalance < requestedAmount) throw new Error(`not enough balance`);
        else return await processTransfer(paymentAmount);
    } else throw new Error(`wrong amount specified`);
}