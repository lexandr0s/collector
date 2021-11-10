const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const protobuf = require('protobufjs')
const {BTTtoUBTT} = require('./utils.js')
const {PrivateKey, PublicKey, processKey} = require('./keys.js')

const grpcAdress = 'ledger.bt.co:443'
const ledgerProtoPath = './protos/ledger.proto'
const packageDefinition = protoLoader.loadSync(ledgerProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
})
const root = new protobuf.Root()
const ledgerProto = root.loadSync(ledgerProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
}).nested.ledger
const ledgerGrpc = grpc.loadPackageDefinition(packageDefinition).ledger
const ledgerClient =  new ledgerGrpc.Channels(grpcAdress, grpc.credentials.createSsl())

const createAccount = ({key}) => new Promise((resolve, reject) => {
    const keyObject = processKey(key)
    const publicKeyUncompressed = keyObject instanceof PublicKey ? keyObject.uncompressed : keyObject.public.uncompressed
    const request = {key: publicKeyUncompressed}

    ledgerClient.CreateAccount(request, function(error, response) {
        if (error) reject(error)
        else resolve(response)
    })
})

const transfer = ({payerPrivateKey, recipientKey, amount}) => new Promise((resolve, reject) => {
    const payerPrivateKeyObject = new PrivateKey(payerPrivateKey)
    const recipientKeyObject = processKey(recipientKey)

    const transferRequest = {
        payer: {key: payerPrivateKeyObject.public.uncompressed},
        recipient: {key: recipientKeyObject instanceof PublicKey ? recipientKeyObject.uncompressed : recipientKeyObject.public.uncompressed},
        amount
    }

    const TransferRequestMessageType = ledgerProto.lookupType("ledger.TransferRequest")
    const TransferRequestMessage = TransferRequestMessageType.create(transferRequest)
    const serializedTransferRequestMessage = TransferRequestMessageType.encode(TransferRequestMessage).finish()
    const signature = payerPrivateKeyObject.hashAndSign(serializedTransferRequestMessage)
    
    const request = {
        transfer_request: transferRequest,
        signature: signature
    }

    ledgerClient.Transfer(request, function(error, response) {
        if (error) reject(error)
        else resolve(response)
    })
})

const createChannel = ({payerPrivateKey, recipientKey, amount = 0, withdrawId = 0}) => new Promise((resolve, reject) => {
    const payerPrivateKeyObject = new PrivateKey(payerPrivateKey)
    const recipientKeyObject = processKey(recipientKey)

    const channelCommit = {
        payer: {key: payerPrivateKeyObject.public.uncompressed.toString('base64')},
        recipient: {key: recipientKeyObject instanceof PublicKey ? recipientKeyObject.uncompressed.toString('base64') : recipientKeyObject.public.uncompressed.toString('base64')},
        amount: BTTtoUBTT(amount),
        payer_id: Date.now() * 1000000 + parseInt(withdrawId),
    }

    const ChannelCommitMessageType = ledgerProto.lookupType("ledger.ChannelCommit")
    const ChannelCommitMessage = ChannelCommitMessageType.create(channelCommit)
    const serializedChannelCommitMessage = ChannelCommitMessageType.encode(ChannelCommitMessage).finish()
    const signature = payerPrivateKeyObject.hashAndSign(serializedChannelCommitMessage)
    
    const signedChannelCommit = {
        channel: channelCommit,
        signature: signature
    }

    log.debug('signedChannelCommit', signedChannelCommit)

    ledgerClient.CreateChannel(signedChannelCommit, function(error, response) {
        if (error) reject(error)
        else resolve(response)
    })
})

const closeChannel = ({channelId, payerPrivateKey, recipientPrivateKey, amount = 0}) => new Promise((resolve, reject) => {
    const payerPrivateKeyObject = new PrivateKey(payerPrivateKey)
    const recipientPrivateKeyObject = new PrivateKey(recipientPrivateKey)

    const channelState = {
        id: {id: parseInt(channelId )},
        sequence: 1,
        from: {
            address: {key: payerPrivateKeyObject.public.uncompressed.toString('base64')},
            balance: 0
        },
        to: {
            address: {key: recipientPrivateKeyObject.public.uncompressed.toString('base64')},
            balance: BTTtoUBTT(amount)
        }
    }

    const ChannelStateMessageType = ledgerProto.lookupType("ledger.ChannelState")
    const ChannelStateMessage = ChannelStateMessageType.create(channelState)
    const serializedChannelStateMessage = ChannelStateMessageType.encode(ChannelStateMessage).finish()
    const fromSignature = payerPrivateKeyObject.hashAndSign(serializedChannelStateMessage)
    const toSignature = recipientPrivateKeyObject.hashAndSign(serializedChannelStateMessage)
    
    const signedChannelState = {
        channel: channelState,
        from_signature: fromSignature,
        to_signature: toSignature
    }

    log.debug('signedChannelState:', signedChannelState)

    ledgerClient.CloseChannel(signedChannelState, function(error, response) {
        if (error) reject(error)
        else resolve(response)
    })
})

module.exports = {
    createAccount,
    transfer,
    createChannel,
    closeChannel
}
