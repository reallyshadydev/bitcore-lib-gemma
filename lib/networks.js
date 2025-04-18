// Start of Selection
'use strict';
var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');
var networks = [];
var networkMaps = {};

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each Gemma network. Currently supporting "livenet" (a.k.a. "mainnet"),
 * "testnet", and "regtest".
 * @constructor
 */
function Network() {}

Network.prototype.toString = function toString() {
  return this.name;
};

/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
function removeNetwork(network) {
  if (typeof network !== 'object') {
    network = get(network);
  }
  for (var i = 0; i < networks.length; i++) {
    if (networks[i] === network) {
      networks.splice(i, 1);
    }
  }
  for (var key in networkMaps) {
    if (networkMaps[key].length) {
      const index = networkMaps[key].indexOf(network);
      if (index >= 0) {
        networkMaps[key].splice(index, 1);
      }
      if (networkMaps[key].length === 0) {
        delete networkMaps[key];
      }
    } else if (networkMaps[key] === network) {
      delete networkMaps[key];
    }
  }
}

/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @return Network
 */
function get(arg, keys) {
  if (~networks.indexOf(arg)) {
    return arg;
  }
  if (keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }
    var containsArg = function(key) {
      return networks[index][key] === arg;
    };
    for (var index in networks) {
      if (_.some(keys, containsArg)) {
        return networks[index];
      }
    }
    return undefined;
  }
  if(networkMaps[arg] && networkMaps[arg].length >= 1) {
    return networkMaps[arg][0];
  } else {
    return networkMaps[arg];
  }
}

/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash prefix
 * @param {Number} data.privatekey - The privatekey prefix
 * @param {Number} data.scripthash - The scripthash prefix
 * @param {Number} data.xpubkey - The extended public key magic
 * @param {Number} data.xprivkey - The extended private key magic
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return Network
 */
function addNetwork(data) {
  var network = new Network();
  JSUtil.defineImmutable(network, {
    name: data.name,
    alias: data.alias,
    pubkeyhash: data.pubkeyhash,
    privatekey: data.privatekey,
    scripthash: data.scripthash,
    xpubkey: data.xpubkey,
    xprivkey: data.xprivkey
  });
  if (data.networkMagic) {
    JSUtil.defineImmutable(network, {
      networkMagic: BufferUtil.integerAsBuffer(data.networkMagic)
    });
  }
  if (data.port) {
    JSUtil.defineImmutable(network, {
      port: data.port
    });
  }
  if (data.dnsSeeds) {
    JSUtil.defineImmutable(network, {
      dnsSeeds: data.dnsSeeds
    });
  }
  _.each(network, function(value) {
    if (!_.isUndefined(value) && !_.isObject(value)) {
      if(!networkMaps[value]) {
        networkMaps[value] = [];
      }
      networkMaps[value].push(network);
    }
  });
  networks.push(network);
  return network;
}

addNetwork({
  name: 'livenet',
  alias: 'mainnet',
  pubkeyhash: 0x26, // 38 in decimal, corresponds to 'G'
  privatekey: 0x80, // 128 in decimal
  scripthash: 0x62, // 98 in decimal
  xpubkey: 0x0488b21e,
  xprivkey: 0x0488ade4,
  networkMagic: 0x47454d53, // 'GEMS' in ASCII
  port: 4682,
  dnsSeeds: [
    'seed1.gemmacoin.io',
    'seed2.gemmacoin.io',
    'seed3.gemmacoin.io'
  ]
});

/**
 * @instance
 * @member Networks#livenet
 */
var livenet = get('livenet');

addNetwork({
  name: 'testnet',
  alias: 'test',
  pubkeyhash: 0x6f, // 111 in decimal
  privatekey: 0xef, // 239 in decimal
  scripthash: 0xc4, // 196 in decimal
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  networkMagic: 0x31412e5a, // '1A.Z' in ASCII
  port: 12750,
  dnsSeeds: [
    'seed-testnet.gemmacoin.io',
    'seed2-testnet.gemmacoin.io',
    'seed3-testnet.gemmacoin.io'
  ]
});

/**
 * @instance
 * @member Networks#testnet
 */
var testnet = get('testnet');

addNetwork({
  name: 'regtest',
  alias: 'dev',
  pubkeyhash: 0x6f, // 111 in decimal
  privatekey: 0xef,
  scripthash: 0xc4,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  networkMagic: 0x4b3a1f37, // 'K:1' in ASCII
  port: 12444,
  dnsSeeds: []
});

var regtest = get('regtest');

// Add configurable values for testnet/regtest

var TESTNET = {
  PORT: 12750,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0x31412e5a),
  DNS_SEEDS: [
    'seed-testnet.gemmacoin.io',
    'seed2-testnet.gemmacoin.io',
    'seed3-testnet.gemmacoin.io'
  ]
};

for (var key in TESTNET) {
  if (!_.isObject(TESTNET[key])) {
    networkMaps[TESTNET[key]] = testnet;
  }
}

var REGTEST = {
  PORT: 12444,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0x4b3a1f37),
  DNS_SEEDS: []
};

for (var key in REGTEST) {
  if (!_.isObject(REGTEST[key])) {
    networkMaps[REGTEST[key]] = regtest;
  }
}

Object.defineProperty(testnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.PORT;
    } else {
      return TESTNET.PORT;
    }
  }
});

Object.defineProperty(testnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.NETWORK_MAGIC;
    } else {
      return TESTNET.NETWORK_MAGIC;
    }
  }
});

Object.defineProperty(testnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.DNS_SEEDS;
    } else {
      return TESTNET.DNS_SEEDS;
    }
  }
});

Object.defineProperty(regtest, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function() {
    return REGTEST.NETWORK_MAGIC;
  }
});
Object.defineProperty(regtest, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function() {
    return REGTEST.DNS_SEEDS;
  }
});
Object.defineProperty(regtest, 'port', {
  enumerable: true,
  configurable: false,
  get: function() {
    return REGTEST.PORT;
  }
});

/**
 * @function
 * @member Networks#enableRegtest
 * Will enable regtest features for testnet
 */
function enableRegtest() {
  testnet.regtestEnabled = true;
}

/**
 * @function
 * @member Networks#disableRegtest
 * Will disable regtest features for testnet
 */
function disableRegtest() {
  testnet.regtestEnabled = false;
}

/**
 * @namespace Networks
 */
module.exports = {
  add: addNetwork,
  remove: removeNetwork,
  defaultNetwork: livenet,
  livenet: livenet,
  mainnet: livenet,
  testnet: testnet,
  regtest: regtest,
  get: get,
  enableRegtest: enableRegtest,
  disableRegtest: disableRegtest
};
