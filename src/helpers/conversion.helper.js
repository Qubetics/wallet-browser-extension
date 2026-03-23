import BigNumber from 'bignumber.js';

export function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d))
    .toFixed(d)
    .toLocaleString();
}

export function addCommasToNumber(number) {
  var parts = number.toString().split('.');
  var integerPart = parts[0];
  var decimalPart = parts[1] || ''; // Handle cases where there is no decimal part

  // Add commas to the integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine the integer and decimal parts
  if (decimalPart !== '') {
    return integerPart + '.' + decimalPart;
  } else {
    return integerPart;
  }
}

export const balanceToFiatConversion = (price, userBalance) => {
  // Convert the numbers to BigNumber instances
  const myPrice = new BigNumber(price);
  const balance = new BigNumber(userBalance);

  // Perform the multiplication
  const result = myPrice.times(balance);

  // Get the result as a string with the desired precision
  const formattedResult = getFlooredFixed(result, 2);
  return addCommasToNumber(formattedResult);
};

export const newBalanceToFiatConversion = (price, userBalance) => {
  // Convert the numbers to BigNumber instances
  const myPrice = new BigNumber(price);
  const balance = new BigNumber(userBalance);

  // Perform the multiplication
  const result = myPrice.times(balance);

  // Get the result as a string with the desired precision
  const formattedResult = getFlooredFixed(result, 2);
  return formattedResult;
};

export function capitalize(s) {
  if (typeof s !== 'string') {
    throw new Error('Input must be a string.');
  }

  const string = s
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return string;
}

export function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = '0.' + new Array(e).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join('0');
    }
  }
  return x;
}

function showFullDecimal(num) {
  if (num == undefined) {
    return '0.0';
  }
  const subscripts = [
    '\u2080',
    '\u2081',
    '\u2082',
    '\u2083',
    '\u2084',
    '\u2085',
    '\u2086',
    '\u2087',
    '\u2088',
    '\u2089',
    '\u2081\u2080',
    '\u2081\u2081',
    '\u2081\u2082',
    '\u2081\u2083',
    '\u2081\u2084',
    '\u2081\u2085',
    '\u2081\u2086',
    '\u2081\u2087',
    '\u2081\u2088',
    '\u2081\u2089',
    '\u2082\u2080', // 20
    '\u2082\u2081',
    '\u2082\u2082',
    '\u2082\u2083',
    '\u2082\u2084',
    '\u2082\u2085',
    '\u2082\u2086',
    '\u2082\u2087',
    '\u2082\u2088',
    '\u2082\u2089',
    '\u2083\u2080', // 30
    '\u2083\u2081',
    '\u2083\u2082',
    '\u2083\u2083',
    '\u2083\u2084',
    '\u2083\u2085',
    '\u2083\u2086',
    '\u2083\u2087',
    '\u2083\u2088',
    '\u2083\u2089',
    '\u2084\u2080', // 40
    '\u2084\u2081',
    '\u2084\u2082',
    '\u2084\u2083',
    '\u2084\u2084',
    '\u2084\u2085',
    '\u2084\u2086',
    '\u2084\u2087',
    '\u2084\u2088',
    '\u2084\u2089',
    '\u2085\u2080', // 50
  ];

  let a = null;

  let abc = num;
  abc = abc.toString();

  let abcSplit = abc.split('.');
  if (abcSplit.length < 2) {
    return abc;
  }
  let newString = `${abcSplit[0]}.`;

  let decCount = 0;
  for (var i = 0; i < abcSplit[1].length; i++) {
    if (abcSplit[1].charAt(i) == '0' && a == null) {
      a = 'count';
      let count = 1;
      for (var j = i + 1; j < abcSplit[1].length; j++) {
        if (abcSplit[1].charAt(j) == '0') {
          count = count + 1;
        } else {
          i = j;
          break;
        }
      }

      newString = `${newString}(<span class='sub'>${subscripts[count]}</span>)`;
      newString = `${newString}${abcSplit[1].charAt(j)}`;
    } else {
      decCount = decCount + 1;
      //to show two decimal value after zeros
      if (decCount < 4) {
        newString = `${newString}${abcSplit[1].charAt(i)}`;
      }
    }
  }
  return newString;
}

export const formatSmallNumber = (price) => {
  if (price == undefined) {
    price = 0;
  }
  price = getFlooredFixed(price, 50);
  if (price.startsWith('0.000')) {
    price = showFullDecimal(`${price}`, 2);
  } else if (price.startsWith('0.00')) {
    price = getFlooredFixed(price, 5);
  } else {
    price = addCommasToNumber(getFlooredFixed(price, 2));
  }
  return price;
};

export const exponential_to_decimal = (exponential) => {
  try {
    let decimal = exponential?.toString()?.toLowerCase();
    if (decimal.includes('e+')) {
      const exponentialSplitted = decimal.split('e+');
      let postfix = '';

      for (
        let i = 0;
        i <
        +exponentialSplitted[1] -
          (exponentialSplitted[0].includes('.')
            ? exponentialSplitted[0].split('.')[1].length
            : 0);
        i++
      ) {
        postfix += '0';
      }
      const addCommas = (text) => {
        let j = 3;
        let textLength = text.length;
        while (j < textLength) {
          text = `${text.slice(0, textLength - j)}${text.slice(
            textLength - j,
            textLength
          )}`;
          textLength++;
          j += 3 + 1;
        }
        return text;
      };
      decimal = addCommas(exponentialSplitted[0].replace('.', '') + postfix);
    }
    if (decimal.toLowerCase().includes('e-')) {
      const exponentialSplitted = decimal.split('e-');
      let prefix = '0.';
      for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
        prefix += '0';
      }
      decimal = prefix + exponentialSplitted[0].replace('.', '');
    }
    return decimal;
  } catch (err) {
    throw err;
  }
};

export const formatNumber = (number = 0) => {
  if (Number.isInteger(number)) {
    return number.toString(); // No decimal places
  } else {
    return Number(number).toFixed(6); // 4 decimal places
  }
};
