const PHONE_REGEX = /\b(1[3-9]\d{9})\b/g;
const ID_CARD_REGEX = /\b([1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx])\b/g;

const LOG_PREFIX_REGEX = /^(\s*\[?\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?\]?\s*(?:[A-Z]+)\s*[-:|]?\s*)/;

function maskPhone(phone) {
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

function maskIdCard(idCard) {
  return idCard.slice(0, 6) + '********' + idCard.slice(14);
}

function maskKeyword(word) {
  if (word.length <= 1) return '*';
  if (word.length <= 2) return word[0] + '*'.repeat(word.length - 1);
  const headLen = Math.ceil(word.length * 0.3);
  const tailLen = Math.ceil(word.length * 0.3);
  const midLen = word.length - headLen - tailLen;
  return word.slice(0, headLen) + '*'.repeat(Math.max(midLen, 1)) + word.slice(word.length - tailLen);
}

function maskContent(text, keywords) {
  let masked = text.replace(ID_CARD_REGEX, (match) => maskIdCard(match));
  masked = masked.replace(PHONE_REGEX, (match) => maskPhone(match));
  if (keywords && keywords.length > 0) {
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    for (const kw of sorted) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'g');
      masked = masked.replace(re, () => maskKeyword(kw));
    }
  }
  return masked;
}

function maskSensitiveData(text, keywords) {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => {
    const match = line.match(LOG_PREFIX_REGEX);
    if (match) {
      const prefix = match[1];
      const content = line.slice(prefix.length);
      return prefix + maskContent(content, keywords);
    }
    return maskContent(line, keywords);
  }).join('\n');
}

module.exports = {
  maskPhone,
  maskIdCard,
  maskKeyword,
  maskSensitiveData,
  maskContent,
  PHONE_REGEX,
  ID_CARD_REGEX,
  LOG_PREFIX_REGEX
};
