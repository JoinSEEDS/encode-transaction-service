const { JsonRpc, Api, Serialize } = require('eosjs')

const fetch = require('node-fetch')
const util = require('util')
const zlib = require('zlib')

const textEncoder = new util.TextEncoder()
const textDecoder = new util.TextDecoder()

const MAINNET_NODE = "https://mainnet.telos.net"
const TESTNET_NODE = "https://testnet.telos.net"

const rpc = new JsonRpc(MAINNET_NODE, {
    fetch
})

const eos = new Api({
    rpc,
    textDecoder,
    textEncoder,
})

const rpc_testnet = new JsonRpc(TESTNET_NODE, {
    fetch
})

const eos_testnet = new Api({
    rpc_testnet,
    textDecoder,
    textEncoder,
})

const { SigningRequest } = require("eosio-signing-request")

const opts = {
    textEncoder,
    textDecoder,
    zlib: {
        deflateRaw: (data) => new Uint8Array(zlib.deflateRawSync(Buffer.from(data))),
        inflateRaw: (data) => new Uint8Array(zlib.inflateRawSync(Buffer.from(data))),
    },
    abiProvider: {
        getAbi: async (account) => (await eos.getAbi(account))
    }
}

const opts_testnet = {
    textEncoder,
    textDecoder,
    zlib: {
        deflateRaw: (data) => new Uint8Array(zlib.deflateRawSync(Buffer.from(data))),
        inflateRaw: (data) => new Uint8Array(zlib.inflateRawSync(Buffer.from(data))),
    },
    abiProvider: {
        getAbi: async (account) => (await eos_testnet.getAbi(account))
    }
}

async function buildTransaction(actions, isTestnet = false) {
    const rpc_active = isTestnet ? rpc_testnet : rpc
    const opts_active = isTestnet ? opts_testnet : opts
    const info = await rpc_active.get_info();
    // const head_block = await rpc_active.get_block(info.last_irreversible_block_num);
    const chainId = info.chain_id;
    // set to an hour from now. this is the max. expiry date. 
    // const expiration = Serialize.timePointSecToDate(Serialize.dateToTimePointSec(head_block.timestamp) + 3600)
    // const transaction = {
    //     expiration,
    //     ref_block_num: head_block.block_num & 0xffff, // 
    //     ref_block_prefix: head_block.ref_block_prefix,
    //     max_net_usage_words: 0,
    //     delay_sec: 0,
    //     context_free_actions: [],
    //     actions: actions,
    //     transaction_extensions: [],
    //     signatures: [],
    //     context_free_data: []
    // };
    const request = await SigningRequest.create({ actions, chainId }, opts_active);
    const uri = request.encode();
    return uri
}

module.exports = buildTransaction