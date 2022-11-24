function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;
  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }
  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);
  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }
  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }
  return desc;
}

// make PromiseIndex a nominal typing
var PromiseIndexBrand;
(function (PromiseIndexBrand) {
  PromiseIndexBrand[PromiseIndexBrand["_"] = -1] = "_";
})(PromiseIndexBrand || (PromiseIndexBrand = {}));
const TYPE_KEY = "typeInfo";
var TypeBrand;
(function (TypeBrand) {
  TypeBrand["BIGINT"] = "bigint";
  TypeBrand["DATE"] = "date";
})(TypeBrand || (TypeBrand = {}));
const ACCOUNT_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
/**
 * Asserts that the expression passed to the function is truthy, otherwise throws a new Error with the provided message.
 *
 * @param expression - The expression to be asserted.
 * @param message - The error message to be printed.
 */
function assert(expression, message) {
  if (!expression) {
    throw new Error("assertion failed: " + message);
  }
}
function getValueWithOptions(value, options = {
  deserializer: deserialize
}) {
  const deserialized = deserialize(value);
  if (deserialized === undefined || deserialized === null) {
    return options?.defaultValue ?? null;
  }
  if (options?.reconstructor) {
    return options.reconstructor(deserialized);
  }
  return deserialized;
}
function serializeValueWithOptions(value, {
  serializer
} = {
  serializer: serialize
}) {
  return serializer(value);
}
function serialize(valueToSerialize) {
  return JSON.stringify(valueToSerialize, function (key, value) {
    if (typeof value === "bigint") {
      return {
        value: value.toString(),
        [TYPE_KEY]: TypeBrand.BIGINT
      };
    }
    if (typeof this[key] === "object" && this[key] !== null && this[key] instanceof Date) {
      return {
        value: this[key].toISOString(),
        [TYPE_KEY]: TypeBrand.DATE
      };
    }
    return value;
  });
}
function deserialize(valueToDeserialize) {
  return JSON.parse(valueToDeserialize, (_, value) => {
    if (value !== null && typeof value === "object" && Object.keys(value).length === 2 && Object.keys(value).every(key => ["value", TYPE_KEY].includes(key))) {
      switch (value[TYPE_KEY]) {
        case TypeBrand.BIGINT:
          return BigInt(value["value"]);
        case TypeBrand.DATE:
          return new Date(value["value"]);
      }
    }
    return value;
  });
}
/**
 * Validates the Account ID according to the NEAR protocol
 * [Account ID rules](https://nomicon.io/DataStructures/Account#account-id-rules).
 *
 * @param accountId - The Account ID string you want to validate.
 */
function validateAccountId(accountId) {
  return accountId.length >= 2 && accountId.length <= 64 && ACCOUNT_ID_REGEX.test(accountId);
}

/**
 * A Promise result in near can be one of:
 * - NotReady = 0 - the promise you are specifying is still not ready, not yet failed nor successful.
 * - Successful = 1 - the promise has been successfully executed and you can retrieve the resulting value.
 * - Failed = 2 - the promise execution has failed.
 */
var PromiseResult;
(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
/**
 * A promise error can either be due to the promise failing or not yet being ready.
 */
var PromiseError;
(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}
function chain(...args) {
  const wrap = (a, b) => c => a(b(c));
  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}
function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}
function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');
      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);
      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}
function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);
      while (data.length * bits % 8) data.push(chr);
      return data;
    },
    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);
      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');
      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }
      return input.slice(0, end);
    }
  };
}
function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}
function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;
      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }
      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }
    res.push(carry);
    if (done) break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);
  return res.reverse();
}
const gcd = (a, b) => !b ? a : gcd(b, a % b);
const radix2carry = (from, to) => from + (to - gcd(from, to));
function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);
  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];
  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);
    carry &= 2 ** pos - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}
function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}
function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));
const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));
const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';
    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }
    return res;
  },
  decode(str) {
    let res = [];
    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);
      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }
      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }
    return Uint8Array.from(res);
  }
};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;
  for (let v of words) chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}
function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
  const _words = radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }
  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);
    const _words = str.slice(sepIndex + 1);
    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }
  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;
(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));
var DataLength;
(function (DataLength) {
  DataLength[DataLength["ED25519"] = 32] = "ED25519";
  DataLength[DataLength["SECP256K1"] = 64] = "SECP256K1";
})(DataLength || (DataLength = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
/**
 * Logs parameters in the NEAR WASM virtual machine.
 *
 * @param params - Parameters to log.
 */
function log(...params) {
  env.log(params.reduce((accumulated, parameter, index) => {
    // Stringify undefined
    const param = parameter === undefined ? "undefined" : parameter;
    // Convert Objects to strings and convert to string
    const stringified = typeof param === "object" ? JSON.stringify(param) : `${param}`;
    if (index === 0) {
      return stringified;
    }
    return `${accumulated} ${stringified}`;
  }, ""));
}
/**
 * Returns the account ID of the account that signed the transaction.
 * Can only be called in a call or initialize function.
 */
function signerAccountId() {
  env.signer_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the account ID of the account that called the function.
 * Can only be called in a call or initialize function.
 */
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the account ID of the current contract - the contract that is being executed.
 */
function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the amount of NEAR attached to this function call.
 * Can only be called in payable functions.
 */
function attachedDeposit() {
  return env.attached_deposit();
}
/**
 * Returns the current account's account balance.
 */
function accountBalance() {
  return env.account_balance();
}
/**
 * Reads the value from NEAR storage that is stored under the provided key.
 *
 * @param key - The key to read from storage.
 */
function storageRead(key) {
  const returnValue = env.storage_read(key, 0);
  if (returnValue !== 1n) {
    return null;
  }
  return env.read_register(0);
}
/**
 * Checks for the existance of a value under the provided key in NEAR storage.
 *
 * @param key - The key to check for in storage.
 */
function storageHasKey(key) {
  return env.storage_has_key(key) === 1n;
}
/**
 * Get the last written or removed value from NEAR storage.
 */
function storageGetEvicted() {
  return env.read_register(EVICTED_REGISTER);
}
/**
 * Returns the current accounts NEAR storage usage.
 */
function storageUsage() {
  return env.storage_usage();
}
/**
 * Writes the provided bytes to NEAR storage under the provided key.
 *
 * @param key - The key under which to store the value.
 * @param value - The value to store.
 */
function storageWrite(key, value) {
  return env.storage_write(key, value, EVICTED_REGISTER) === 1n;
}
/**
 * Removes the value of the provided key from NEAR storage.
 *
 * @param key - The key to be removed.
 */
function storageRemove(key) {
  return env.storage_remove(key, EVICTED_REGISTER) === 1n;
}
/**
 * Returns the cost of storing 0 Byte on NEAR storage.
 */
function storageByteCost() {
  return 10000000000000000000n;
}
/**
 * Returns the arguments passed to the current smart contract call.
 */
function input() {
  env.input(0);
  return env.read_register(0);
}
/**
 * Create a NEAR promise which will have multiple promise actions inside.
 *
 * @param accountId - The account ID of the target contract.
 */
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
/**
 * Attach a function call promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a function call action to.
 * @param methodName - The name of the method to be called.
 * @param args - The arguments to call the method with.
 * @param amount - The amount of NEAR to attach to the call.
 * @param gas - The amount of Gas to attach to the call.
 */
function promiseBatchActionFunctionCall(promiseIndex, methodName, args, amount, gas) {
  env.promise_batch_action_function_call(promiseIndex, methodName, args, amount, gas);
}
/**
 * Attach a transfer promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a transfer action to.
 * @param amount - The amount of NEAR to transfer.
 */
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
/**
 * Executes the promise in the NEAR WASM virtual machine.
 *
 * @param promiseIndex - The index of the promise to execute.
 */
function promiseReturn(promiseIndex) {
  env.promise_return(promiseIndex);
}

/**
 * Tells the SDK to use this function as the initialization function of the contract.
 *
 * @param _empty - An empty object.
 */
function initialize(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
/**
 * Tells the SDK to expose this function as a view function.
 *
 * @param _empty - An empty object.
 */
function view(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, descriptor) {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw new Error("Function is private");
      }
      if (!payableFunction && attachedDeposit() > 0n) {
        throw new Error("Function is not payable");
      }
      return originalMethod.apply(this, args);
    };
  };
}
function NearBindgen({
  requireInit = false,
  serializer = serialize,
  deserializer = deserialize
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }
      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }
      static _saveToStorage(objectToSave) {
        storageWrite("STATE", this._serialize(objectToSave));
      }
      static _getArgs() {
        return JSON.parse(input() || "{}");
      }
      static _serialize(value, forReturn = false) {
        if (forReturn) {
          return JSON.stringify(value, (_, value) => typeof value === "bigint" ? `${value}` : value);
        }
        return serializer(value);
      }
      static _deserialize(value) {
        return deserializer(value);
      }
      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          const reconstructor = classObject[item].constructor?.reconstruct;
          classObject[item] = reconstructor ? reconstructor(plainObject[item]) : plainObject[item];
        }
        return classObject;
      }
      static _requireInit() {
        return requireInit;
      }
    };
  };
}

/**
 * A lookup map that stores data in NEAR storage.
 */
class LookupMap {
  /**
   * @param keyPrefix - The byte prefix to use when storing elements inside this collection.
   */
  constructor(keyPrefix) {
    this.keyPrefix = keyPrefix;
  }
  /**
   * Checks whether the collection contains the value.
   *
   * @param key - The value for which to check the presence.
   */
  containsKey(key) {
    const storageKey = this.keyPrefix + key;
    return storageHasKey(storageKey);
  }
  /**
   * Get the data stored at the provided key.
   *
   * @param key - The key at which to look for the data.
   * @param options - Options for retrieving the data.
   */
  get(key, options) {
    const storageKey = this.keyPrefix + key;
    const value = storageRead(storageKey);
    return getValueWithOptions(value, options);
  }
  /**
   * Removes and retrieves the element with the provided key.
   *
   * @param key - The key at which to remove data.
   * @param options - Options for retrieving the data.
   */
  remove(key, options) {
    const storageKey = this.keyPrefix + key;
    if (!storageRemove(storageKey)) {
      return options?.defaultValue ?? null;
    }
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Store a new value at the provided key.
   *
   * @param key - The key at which to store in the collection.
   * @param newValue - The value to store in the collection.
   * @param options - Options for retrieving and storing the data.
   */
  set(key, newValue, options) {
    const storageKey = this.keyPrefix + key;
    const storageValue = serializeValueWithOptions(newValue, options);
    if (!storageWrite(storageKey, storageValue)) {
      return options?.defaultValue ?? null;
    }
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Extends the current collection with the passed in array of key-value pairs.
   *
   * @param keyValuePairs - The key-value pairs to extend the collection with.
   * @param options - Options for storing the data.
   */
  extend(keyValuePairs, options) {
    for (const [key, value] of keyValuePairs) {
      this.set(key, value, options);
    }
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    return new LookupMap(data.keyPrefix);
  }
}

const FT = {
  METADATA_SPEC: "ft-1.0.0",
  STANDARD_NAME: "nep141"
};
const METADATA_SPEC = "ft-1.0.0";
const STANDARD_NAME = "nep141";
// export enum STORAGE {
//     MIN = 1_000_000_000_000_000_000_000_000, // 1 Near
// }

const GAS = {
  FOR_FT_ON_TRANSFER: 35_000_000_000_000
};

//Send near
function internalSendNEAR(receiverId, amount) {
  assert(amount > 0, "Sending amount must greater than 0");
  assert(accountBalance() > amount, `Not enough balance ${accountBalance()} to send ${amount}`);
  const promise = promiseBatchCreate(receiverId);
  promiseBatchActionTransfer(promise, amount);
  promiseReturn(promise);
}
function internalGetBalance(contract, accountId) {
  assert(validateAccountId(accountId), "Invalid account ID");
  assert(contract.accounts.containsKey(accountId), `Account ${accountId} is not registered`);
  return contract.accounts.get(accountId).toString();
}

function assertOneYocto() {
  const deposited = attachedDeposit();
  assert(deposited == BigInt(1), "Requires 1 yoctoNEAR");
}
function assertCrossContractCall() {
  assert(signerAccountId() != predecessorAccountId(), "Only for cross-contract call");
}

// Transfer tokens
function internalTransfer(contract, senderId, receiverId, amount, memo = null) {
  assertOneYocto();
  assert(senderId != receiverId, "Sender and receiver must be different");
  assert(BigInt(amount) > BigInt(0), "Transfer amount must greater than 0");
  internalWithdraw(contract, senderId, amount);
  internalDeposit(contract, receiverId, amount);
  //Logging
  const transferLog = [{
    amount,
    old_owner_id: senderId,
    new_owner_id: receiverId,
    memo
  }];
  const log$1 = {
    standard: STANDARD_NAME,
    version: METADATA_SPEC,
    event: "ft_transfer",
    data: transferLog
  };
  log(`EVENT_JSON:${JSON.stringify(log$1)}`);
}
function internalTransferCall(contract, senderId, receiverId, amount, memo = null, msg = null) {
  internalTransfer(contract, senderId, receiverId, amount, memo);
  const promise = promiseBatchCreate(receiverId);
  const params = {
    sender_id: senderId,
    amount,
    msg,
    receiver_id: receiverId
  };
  promiseBatchActionFunctionCall(promise, "ft_on_transfer", JSON.stringify(params), 0, GAS.FOR_FT_ON_TRANSFER);
  return promiseReturn(promise);
}

//Subtract sender's balance
function internalWithdraw(contract, accountId, amount) {
  const balance = internalGetBalance(contract, accountId);
  const newBalance = BigInt(balance) - BigInt(amount);
  const newSupply = BigInt(contract.totalSupply) - BigInt(amount);
  assert(newBalance >= 0, `Account ${accountId} doesn't have enough balance`);
  assert(newSupply >= 0, "Total supply overflow");
  contract.accounts.set(accountId, newBalance);
  contract.totalSupply = newSupply;
}

//Add to receiver's balance
function internalDeposit(contract, accountId, amount) {
  const balance = internalGetBalance(contract, accountId);
  const newBalance = BigInt(balance) + BigInt(amount);
  contract.accounts.set(accountId, newBalance);
  const newSupply = BigInt(contract.totalSupply) + BigInt(amount);
  contract.totalSupply = newSupply;
}
function internalFtOnPurchase(contract) {
  assertCrossContractCall();
  const receiverId = signerAccountId();
  const senderId = currentAccountId();
  const nearAmount = attachedDeposit();
  assert(nearAmount >= contract.rate, "Must buy at least 1 token");
  const tokenAmount = (nearAmount / contract.rate).toString();
  internalWithdraw(contract, senderId, tokenAmount);
  internalDeposit(contract, receiverId, tokenAmount);
  log(`${receiverId} bought ${tokenAmount} successfully`);
  //Refund over deposited
  const refundAmount = nearAmount % contract.rate;
  if (refundAmount > 0) {
    internalSendNEAR(receiverId, refundAmount);
    log(`Refund ${refundAmount} NEAR to ${receiverId}`);
  }
  return `${receiverId} bought ${tokenAmount} successfully`;
}
function internalFtPurchase(contract) {
  const receiverId = predecessorAccountId();
  const senderId = currentAccountId();
  const nearAmount = attachedDeposit();
  assert(nearAmount >= contract.rate, "Must buy at least 1 token");
  const tokenAmount = (nearAmount / contract.rate).toString();
  internalWithdraw(contract, senderId, tokenAmount);
  internalDeposit(contract, receiverId, tokenAmount);
  log(`${receiverId} bought ${tokenAmount} successfully`);
  //Refund over deposited
  const refundAmount = nearAmount % contract.rate;
  if (refundAmount > 0) {
    internalSendNEAR(receiverId, refundAmount);
    log(`Refund ${refundAmount} NEAR to ${receiverId}`);
  }
}
function internalOnPurchase(contract, amount, memo) {
  assertCrossContractCall();
  const senderId = signerAccountId();
  const receiverId = currentAccountId();
  internalTransfer(contract, senderId, receiverId, amount, memo);
  return `Send ${amount} PTIT TOKEN to ${receiverId} successfully`;
}
function internalOnRefund(contract, amount, memo) {
  assertCrossContractCall();
  const receiverId = signerAccountId();
  const senderId = currentAccountId();
  internalTransfer(contract, senderId, receiverId, amount, memo);
  return `Refund ${amount} PTIT TOKEN to ${receiverId} successfully`;
}

const icon = "data:image/jpeg;base64,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zzzzzzzzzzz0IHzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzy7ZQ3zzzzzzzzzzzzzzzzywkXzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz569bzzzzzzzzzzzzzzzzzzygLzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzygYjzzzzzzzzzzzzzzzzzzzyJXzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzyRd3/AM8888888888888888888KT8888888888888888888888888888888887D+c888888888888888888888rY888888888888888888888888888888884CT/8888888888888888888888J888888888888888888888888888888888mF188888888888888888888887C98888888888888888888888888888888pgH88888888888888888888888tB98888888888888888888888888888888gE+88888888888888888888888uX8888888888888888888888888888888+CI888888888888888888888888q08888888888888888888888888888888qHV888888888888888888888888Lf8APPPPPPPPPPPPPPPPPPPPPPPPPPPPPNQmfPPPPPPPPPPPPPPPPPPPPPO/POPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPOIAt/PPPPPPPPPPPPPPPPPPPPPC/PDPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPQk/PPPPPPPPPPPPPPPPPPPPPLQPLtfPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAAnPPPPPPPPPPPPPPPPPPPPPPMQvNfPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPYhtPPPPPPPPPPPPPPPPPPPPPO49/NvPPPPPPPPPPPPPPPPPPPPPPPPPPPPPMwgfPPPPPPPPPPPPPPPPPPPPPGAXvPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPiApfPPPPPPPPPPPPPPPPPPPPLoQdvPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPIQgn6oA04MNdPPIkMIAAABe+cIgQcsD+cMAAAAFvPPPPPPPPPPPPPPPPPPPPIAkXKgggggggHfKAggggglvGwQQQRLvAgggggglPPPPPPPPPPPPPPPPPPPPLIwh/KgghPSTQkHHrjQgr3j/LgQQRvPPH7zwgnzr/PPPPPPPPPPPPPPPPPPPIwgr/Kggv8Azz8IJzzzwJTzzzqMEEETzzzzyoILTzzzzzzzzzzzzzzzzzzzzzwgIJfyoILTzyoILTzzwIXzzygE1wgXzzzzyoIJzzzzzzzzzzzzzzzzzzzzzzmkIL/yoILMAMMIX3zzwJDzyYJukrxnzzzzz4IJ/wA88888888888888888888+CCG88qCCCCCCBv8APPPAlfPHnABYlbfPPPPPggt/PPPPPPPPPPPPPPPPPPPPIwglfPKggrzv3XPPPPPAlfPIAgkiglvPPPPOQgl/PPPPPPPPPPPPPPPPPPPPKQggvPKggv8AzzzzzzzzwJTzgIINyoJbzzzzykILTzzzzzzzzzzzzzzzzzzzzyEIJLzyoILzzzzzzzzzwJDrAIJzyIJfzzzzz4IL3zzzzzzzzzzzzzzzzzzzz4IIJPzyoIJzzzzzzzzzwJAAIInzysJfzzzzy8IL3zzzzzzzzzzzzzzzzzzzygIIIXzy4g1fzzzzzzzzgAMIJX3zyQ5/zzzzzgIL/wA8888888888888888888/CCCU8888888888888882CCCc88888888888888888888888888888888888pCCCU88888888888888uiCAe888888888888888888888888888888888888pCCCCc888888888888sCCCN8888888888888888888888888888888888888/CCCCQ888888888886CCC188888888888888888888888888888888888888pKCCCQ8888888884qiCCW8888888888888888888888888888888888888888iCCCCR38888886rCCGW88888888888888888888888888888888888888888oCCCCChRw8884zCCDn8888888888888888888888888888888888888888889MKCCCCCSJgCgCCCW88888888888888888888888888888888888888888888SSGKNHCEwSCCGSc888888888888888888888888888888888888888888888vIwiwjzCCCCB1888888888888888888888888888888888888888888888888+OOCCCCIWsc8888888888888888888888888888888888888888888888888888fcMs988888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888448z+6++266301080teQDC6HTLGaFNNNd/8A/wD/AP8A/wD/AP8A/wBbzzzzzzzzzzzzzzyEEHABDDBBBDAEEFHDAFGEsmUoEHHHEFHFEEGHDDDAEEHzzzzzzzzzzzzzzzyoIIIIIIIIIIIIIIIIIIIIIoIIIIIIIIIIIIIIIIIIIIJTzzzzzzzzzzzzzzyIAgcoY8888888888YIIM0MMksMIIIIIIIIIIIIIII445/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzw9zzzzzzzzzzzzzzzzzzzzzzzzzzzzz/xAArEQABAgMFCQEBAQEAAAAAAAABABEhMfAQQVFx4SBAUGGBkaGx0cEw8WD/2gAIAQIRAT8Q4GA8Ao/A5/FfcqXvZAASRAzUiUbE25FNIbicaQxfEMhjjf8Awam4WICkeIMRcq98+NbAbmyhwko6RXZcodtUBIKggt5Qh1xaUyyjrhw0pLym0PVOgZQoGGN6OuOdp5DJqSwWw1P04aRdCkkHDYK+rwCey5/iBHiEND1zsABBkUczdwshf7llwE4w/I/0hhlB8tbcY9cKLdDzyTggATWlg/s/s77H8IffCC3nmQ/T+Jo3CZTnMAFd8uH955n9/LMgN74O8SHk4LmM+BogOVHkq75cNwzNCwHyeDHjyT+JrloBGk6/4nGZXDceTBFnjn1wUQULTT61Qe0fURuRL7ubTiC8c+uCDQIlFEy/mcEcypn4hFcPOm6G5+Q9ImyeCQ7iZcghiIB7Tx43mqbdfBTHQ98DgrB5Kg8ynRB1yssUQnM91BskJoBieBCCm8gAhkkaA6/UY7tAw+Q9KDncCjEyfxMEwzyRIhcG7gyOSbcA4DgsJZ6IzlBFE47uw4jY8efqHABC8QTKCl5h/N4YPNDKdwRJJc8Ax2PrVFcoIznHeG04A/E/jGHAGQpCaAYMFCAZn83mLlhPiXR4BEjMxKEYpBGI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";

function internalMint(contract, amount) {
  assert(amount > BigInt(0), "New supply must greater than 0");
  const contractOwner = currentAccountId();
  const ownerSupply = contract.accounts.containsKey(contractOwner) ? contract.accounts.get(contractOwner) : BigInt(0);
  contract.accounts.set(contractOwner, ownerSupply + amount);
  contract.totalSupply += amount;

  //Logging
  const mintLog = [{
    owner_id: contractOwner,
    amount: amount.toString()
  }];
  const log$1 = {
    standard: STANDARD_NAME,
    version: METADATA_SPEC,
    event: "ft_mint",
    data: mintLog
  };
  log(`EVENT_JSON:${JSON.stringify(log$1)}`);
}

function internalUpdateRate(contract, rate) {
  assert(BigInt(rate) > BigInt(0), "Rate must greater than 0");
  contract.rate = BigInt(rate);
}

//Reg account
function internalOnRegister(contract) {
  const accountId = signerAccountId();
  const registrantId = predecessorAccountId();
  const attachedDeposit$1 = attachedDeposit();
  //Account existed
  if (contract.accounts.containsKey(accountId)) {
    //Refund directly to signer
    internalSendNEAR(accountId, attachedDeposit$1);
    return {
      success: true,
      msg: `Account ${accountId} is already registered`
    };
  }
  //Calculate storage usage
  const initialStorage = storageUsage();
  contract.accounts.set(accountId, BigInt(0));
  contract.accountRegistrants.set(accountId, registrantId);
  contract.accountDeposits.set(accountId, BigInt(0));
  const requiredDeposit = (storageUsage() - initialStorage) * storageByteCost();
  contract.accountDeposits.set(accountId, requiredDeposit);
  //Not enough deposit
  if (requiredDeposit > attachedDeposit$1) {
    //Revert
    contract.accounts.remove(accountId);
    contract.accountRegistrants.remove(accountId);
    contract.accountDeposits.remove(accountId);
    //Refund to caller
    internalSendNEAR(registrantId, attachedDeposit$1);
    return {
      success: false,
      msg: "Not enough deposit for ft_on_register"
    };
  }
  //Refund over deposited to signer
  if (requiredDeposit < attachedDeposit$1) {
    internalSendNEAR(accountId, attachedDeposit$1 - requiredDeposit);
  }
  return {
    success: true,
    msg: `Account ${accountId} registered successfully`
  };
}
function internalRegister(contract, registerId) {
  const accountId = registerId || predecessorAccountId();
  assert(validateAccountId(accountId), "Invalid account");
  const attachedDeposit$1 = attachedDeposit();
  //Account registered
  assert(!contract.accounts.containsKey(accountId), "Account is already registered");
  //New account registration
  const initialStorage = storageUsage();
  contract.accounts.set(accountId, BigInt(0));
  contract.accountRegistrants.set(accountId, predecessorAccountId());
  contract.accountDeposits.set(accountId, BigInt(0));
  const requiredDeposit = (storageUsage() - initialStorage) * storageByteCost();
  contract.accountDeposits.set(accountId, requiredDeposit);
  //Deposit enough for data storage
  assert(attachedDeposit$1 >= requiredDeposit, `Not enough attached deposit. Required: ${requiredDeposit.toString()}`);
  //Register is done then refund over deposited
  const refund = attachedDeposit$1 - requiredDeposit;
  if (refund > 0) {
    log(`Refunding ${refund} yoctoNEAR to ${predecessorAccountId()}`);
    internalSendNEAR(predecessorAccountId(), refund);
  }
  return {
    success: true,
    message: `Account ${accountId} registered with storage deposit of ${requiredDeposit.toString()}`
  };
}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2;
let FTContract = (_dec = NearBindgen({
  requireInit: true
}), _dec2 = initialize(), _dec3 = call({
  payableFunction: true
}), _dec4 = call({
  payableFunction: true
}), _dec5 = call({
  payableFunction: true
}), _dec6 = call({
  payableFunction: true
}), _dec7 = call({
  privateFunction: true
}), _dec8 = call({
  privateFunction: true
}), _dec9 = call({
  payableFunction: true
}), _dec10 = call({
  payableFunction: true
}), _dec11 = call({
  privateFunction: true
}), _dec12 = view(), _dec13 = view(), _dec14 = view(), _dec15 = view(), _dec16 = call({
  privateFunction: true
}), _dec17 = call({
  privateFunction: true
}), _dec(_class = (_class2 = class FTContract {
  // Token creator
  //1 token to yoctoNear

  // <AccountId, tokenAmount>
  //<AccountId, registrant>
  //<AccountId, deposit>
  //Total tokens in the contract

  constructor() {
    this.owner_id = "";
    this.rate = BigInt(0);
    this.tokenMetadata = {
      spec: FT.METADATA_SPEC,
      name: "PTIT TOKEN",
      symbol: "ptitNEAR",
      icon,
      decimals: 0
    };
    this.accounts = new LookupMap("a");
    this.accountRegistrants = new LookupMap("r");
    this.accountDeposits = new LookupMap("d");
    this.totalSupply = BigInt(0);
  }
  init({
    owner_id,
    rate,
    total_supply
  }) {
    assert(validateAccountId(owner_id), "Invalid account ID");
    this.owner_id = owner_id;
    internalUpdateRate(this, rate);
    internalMint(this, BigInt(total_supply));
  }

  //Register new account
  //Allow a user pays for a different user to register
  ft_register({
    account_id
  }) {
    return internalRegister(this, account_id);
  }

  //Register
  ft_on_register() {
    return internalOnRegister(this);
  }
  on_buy_ft() {
    return internalFtOnPurchase(this);
  }
  buy_ft() {
    return internalFtPurchase(this);
  }

  //Called by contract's owner and transfer to a receiver
  ft_transfer({
    receiver_id,
    amount,
    memo
  }) {
    const senderId = predecessorAccountId();
    internalTransfer(this, senderId, receiver_id, amount, memo);
  }

  //Transfer token and call a method on receiver contract
  ft_transfer_call({
    receiver_id,
    amount,
    memo,
    msg
  }) {
    const senderId = predecessorAccountId();
    internalTransferCall(this, senderId, receiver_id, amount, memo, msg);
  }
  ft_on_purchase({
    amount,
    memo
  }) {
    return internalOnPurchase(this, amount, memo);
  }
  ft_on_refund({
    amount,
    memo
  }) {
    return internalOnRefund(this, amount, memo);
  }

  //Mint token
  ft_mint({
    amount
  }) {
    internalMint(this, BigInt(amount));
  }

  //Burn token
  // @call({ privateFunction: true })
  // ft_burn({ amount, memo }: { amount: string; memo?: string }) {
  //     internalBurn(this, BigInt(amount), memo);
  // }

  //Total supply
  ft_total_supply() {
    return this.totalSupply;
  }

  //Balance of an account
  ft_balance_of({
    account_id
  }) {
    return internalGetBalance(this, account_id);
  }

  //Token metadata
  ft_metadata() {
    return this.tokenMetadata;
  }

  //Near rate
  ft_rate() {
    return this.rate.toString();
  }

  //Update near rate
  ft_update_rate({
    rate
  }) {
    internalUpdateRate(this, rate);
  }
  clean() {
    storageRemove("a");
    storageRemove("r");
    storageRemove("d");
  }
}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_register", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_register"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_on_register", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_on_register"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "on_buy_ft", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "on_buy_ft"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "buy_ft", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "buy_ft"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_transfer", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_transfer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_transfer_call", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_transfer_call"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_on_purchase", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_on_purchase"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_on_refund", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_on_refund"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_mint", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_mint"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_total_supply", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_total_supply"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_balance_of", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_balance_of"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_metadata", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_metadata"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_rate", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_rate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_update_rate", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_update_rate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clean", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "clean"), _class2.prototype)), _class2)) || _class);
function clean() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.clean(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_update_rate() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_update_rate(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_rate() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_rate(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_metadata() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_metadata(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_balance_of() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_balance_of(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_total_supply() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_total_supply(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_mint() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_mint(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_on_refund() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_on_refund(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_on_purchase() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_on_purchase(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_transfer_call() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_transfer_call(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_transfer() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_transfer(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function buy_ft() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.buy_ft(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function on_buy_ft() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.on_buy_ft(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_on_register() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_on_register(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function ft_register() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.ft_register(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}
function init() {
  const _state = FTContract._getState();
  if (_state) {
    throw new Error("Contract already initialized");
  }
  const _contract = FTContract._create();
  const _args = FTContract._getArgs();
  const _result = _contract.init(_args);
  FTContract._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(FTContract._serialize(_result, true));
}

export { FTContract, buy_ft, clean, ft_balance_of, ft_metadata, ft_mint, ft_on_purchase, ft_on_refund, ft_on_register, ft_rate, ft_register, ft_total_supply, ft_transfer, ft_transfer_call, ft_update_rate, init, on_buy_ft };
//# sourceMappingURL=coin.js.map
