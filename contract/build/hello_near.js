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

function internalGetAccountStorageUsage(contract, accountLength) {
  const initialStorageUsage = storageUsage();
  const tempAccountId = "a".repeat(64);
  contract.accounts.set(tempAccountId, BigInt(0));
  const len64StorageUsage = storageUsage() - initialStorageUsage;
  const len1StorageUsage = len64StorageUsage / BigInt(64);
  const lenAccountStorageUsage = len1StorageUsage * BigInt(accountLength);
  contract.accounts.remove(tempAccountId);
  log(`${len1StorageUsage} | ${storageByteCost()}`);
  return lenAccountStorageUsage * BigInt(3); // * 3 maps
}

//Reg account
function internalRegisterAccount(contract, registrantAccountId, accountId, amount) {
  assert(!contract.accounts.containsKey(accountId), "Account is already registered");
  contract.accounts.set(accountId, BigInt(0));
  contract.accountRegistrants.set(accountId, registrantAccountId);
  contract.accountDeposits.set(accountId, BigInt(amount));
}

//Send near
function internalSendNEAR(receiverId, amount) {
  assert(amount > 0, "Sending amount must greater than 0");
  assert(accountBalance() > amount, `Not enough balance ${accountBalance()} to send ${amount}`);
  const promise = promiseBatchCreate(receiverId);
  promiseBatchActionTransfer(promise, amount);
  promiseReturn(promise);
}
function internalGetBalance(contract, accountId) {
  assert(contract.accounts.containsKey(accountId), `Account ${accountId} is not registered`);
  return contract.accounts.get(accountId).toString();
}

// Transfer tokens
function internalTransfer(contract, senderId, receiverId, amount, memo = null) {
  assert(senderId != receiverId, "Sender and receiver must be different");
  assert(BigInt(amount) > BigInt(0), "Transfer amount must greater than 0");
  internalWithdraw(contract, senderId, amount);
  internalDeposit(contract, receiverId, amount);
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

function assertOneYocto() {
  const deposited = attachedDeposit();
  assert(deposited == BigInt(1), "Requires 1 yoctoNEAR");
}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2;
const FT_METADATA_SPEC = "ft-1.0.0";
const FT_STANDARD_NAME = "nep141";
BigInt(1_000_000_000_000_000_000_000_000); // 1 Near
const GAS_FOT_FT_ON_TRANSFER = 35_000_000_000_000;
let FTContract = (_dec = NearBindgen({
  requireInit: true
}), _dec2 = initialize(), _dec3 = call({
  payableFunction: true
}), _dec4 = call({
  payableFunction: true
}), _dec5 = call({
  payableFunction: true
}), _dec6 = view(), _dec7 = view(), _dec8 = view(), _dec(_class = (_class2 = class FTContract {
  // Token creator
  //1 token to Near

  // <AccountId, tokenAmount>
  //<AccountId, registrant>
  //<AccountId, deposit>
  //Total tokens in the contract

  constructor() {
    // this.owner_id = ""
    this.tokenMetadata = {
      spec: FT_METADATA_SPEC,
      name: "PTIT TOKEN",
      symbol: "ptitNEAR",
      icon: "https://cdn-icons-png.flaticon.com/512/272/272525.png",
      decimals: 8
    };
    // this.tokenNearRate = BigInt(0);
    this.accounts = new LookupMap("a");
    this.accountRegistrants = new LookupMap("r");
    this.accountDeposits = new LookupMap("d");
    // this.totalSupply = BigInt("0");
  }

  init({
    owner_id,
    token_near_rate,
    total_supply
  }) {
    assert(BigInt(total_supply) > BigInt(0), "Total supply must greater than 0");
    assert(BigInt(token_near_rate) > BigInt(0), "Token rate must greater than 0");
    validateAccountId(owner_id);
    //Contract's owner will get all newly created tokens
    this.owner_id = owner_id;
    // this.tokenMetadata = metadata;
    this.tokenNearRate = BigInt(token_near_rate);
    this.totalSupply = BigInt(total_supply);
    this.accounts.set(owner_id, this.totalSupply);

    //Logging
    const mintLog = [{
      owner_id,
      amount: total_supply
    }];
    const log$1 = {
      standard: FT_STANDARD_NAME,
      version: FT_METADATA_SPEC,
      event: "ft_mint",
      data: mintLog
    };
    log(`EVENT_JSON:${JSON.stringify(log$1)}`);
  }

  // Using for creating new sub account
  // @call({ payableFunction: true })
  // create({ prefix }: { prefix: String }) {
  //     const account_id = `${prefix}.${near.currentAccountId()}`;
  //     NearPromise.new(account_id).createAccount().transfer(MIN_STORAGE);
  // }

  // Register new account
  // Allow a user pays for a different user to register
  storage_deposit({
    account_id
  }) {
    const accountId = account_id || predecessorAccountId();
    validateAccountId(accountId);
    //Deposit for data storage
    const attachedDeposit$1 = attachedDeposit();
    //Account registered
    if (this.accounts.containsKey(accountId)) {
      //Refund if deposited
      if (attachedDeposit$1 > 0) {
        internalSendNEAR(predecessorAccountId(), attachedDeposit$1);
        return {
          message: "Account is already registered, deposit refunded to predecessor"
        };
      }
      return {
        message: "Account is already registered"
      };
    }
    //New account registration
    const storageCost = internalGetAccountStorageUsage(this, accountId.length);
    //Deposit enough for data storage
    if (attachedDeposit$1 < storageCost) {
      internalSendNEAR(predecessorAccountId(), attachedDeposit$1);
      return {
        message: `Not enough attached deposit to cover storage cost. Required: ${storageCost.toString()}`
      };
    }
    //Register
    internalRegisterAccount(this, predecessorAccountId(), accountId, storageCost.toString());
    //Register is done then refund over deposited
    const refund = attachedDeposit$1 - storageCost;
    if (refund > 0) {
      log("Storage registration refunding " + refund + " yoctoNEAR to " + predecessorAccountId());
      internalSendNEAR(predecessorAccountId(), refund);
    }
    return {
      message: `Account ${accountId} registered with storage deposit of ${storageCost.toString()}`
    };
  }

  //Called by sender and transfer to a receiver
  ft_transfer({
    receiver_id,
    amount,
    memo
  }) {
    assertOneYocto();
    const senderId = predecessorAccountId();
    internalTransfer(this, senderId, receiver_id, amount, memo);
    //Logging
    const transferLog = [{
      amount,
      old_owner_id: senderId,
      new_owner_id: receiver_id,
      memo
    }];
    const log$1 = {
      standard: FT_STANDARD_NAME,
      version: FT_METADATA_SPEC,
      event: "ft_transfer",
      data: transferLog
    };
    log(`EVENT_JSON:${JSON.stringify(log$1)}`);
  }

  // Transfer token and call a method on receiver contract
  ft_transfer_call({
    receiver_id,
    amount,
    memo,
    msg
  }) {
    assertOneYocto();
    const senderId = predecessorAccountId();
    internalTransfer(this, senderId, receiver_id, amount, memo);
    const promise = promiseBatchCreate(receiver_id);
    //Logging
    const transferLog = [{
      amount,
      old_owner_id: senderId,
      new_owner_id: receiver_id,
      memo
    }];
    const log$1 = {
      standard: FT_STANDARD_NAME,
      version: FT_METADATA_SPEC,
      event: "ft_transfer",
      data: transferLog
    };
    log(`EVENT_JSON:${JSON.stringify(log$1)}`);
    const params = {
      sender_id: senderId,
      amount,
      msg,
      receiver_id
    };
    promiseBatchActionFunctionCall(promise, "ft_on_transfer", JSON.stringify(params), 0, GAS_FOT_FT_ON_TRANSFER);
    return promiseReturn(promise);
  }

  // @call({ payableFunction: true })
  // ft_resolve_transfer({
  //     sender_id,
  //     receiver_id,
  //     amount,
  // }: {
  //     sender_id: string;
  //     receiver_id: string;
  //     amount: string;
  // }) {}

  // @call({ privateFunction: true })
  // ft_on_transfer({
  //     sender_id,
  //     amount,
  //     msg,
  // }: {
  //     sender_id: string;
  //     amount: string;
  //     msg: string;
  // }) {}

  ft_total_supply() {
    return this.totalSupply;
  }
  ft_balance_of({
    account_id
  }) {
    validateAccountId(account_id);
    return internalGetBalance(this, account_id);
  }
  ft_metadata() {
    return this.tokenMetadata;
  }
}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "storage_deposit", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "storage_deposit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_transfer", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_transfer"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_transfer_call", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_transfer_call"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_total_supply", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_total_supply"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_balance_of", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_balance_of"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "ft_metadata", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "ft_metadata"), _class2.prototype)), _class2)) || _class);
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
function storage_deposit() {
  const _state = FTContract._getState();
  if (!_state && FTContract._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = FTContract._create();
  if (_state) {
    FTContract._reconstruct(_contract, _state);
  }
  const _args = FTContract._getArgs();
  const _result = _contract.storage_deposit(_args);
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

export { FTContract, ft_balance_of, ft_metadata, ft_total_supply, ft_transfer, ft_transfer_call, init, storage_deposit };
//# sourceMappingURL=hello_near.js.map
