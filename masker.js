const PHONE_REGEX = /\b(1[3-9]\d{9})\b/g;
const ID_CARD_REGEX = /\b([1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx])\b/g;

const LOG_PREFIX_REGEX = /^(\s*\[?\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?\]?\s*(?:[A-Z]+)\s*[-:|]?\s*)/;

function maskPhone(phone) {
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

function maskIdCard(idCard) {
  return idCard.slice(0, 6) + '********' + idCard.slice(14);
}

function maskContent(text) {
  let masked = text.replace(ID_CARD_REGEX, (match) => maskIdCard(match));
  masked = masked.replace(PHONE_REGEX, (match) => maskPhone(match));
  return masked;
}

function maskSensitiveData(text) {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => {
    const match = line.match(LOG_PREFIX_REGEX);
    if (match) {
      const prefix = match[1];
      const content = line.slice(prefix.length);
      return prefix + maskContent(content);
    }
    return maskContent(line);
  }).join('\n');
}

module.exports = {
  maskPhone,
  maskIdCard,
  maskSensitiveData,
  maskContent,
  PHONE_REGEX,
  ID_CARD_REGEX,
  LOG_PREFIX_REGEX
};
