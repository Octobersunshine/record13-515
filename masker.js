const PHONE_REGEX = /(?<!\d)(1[3-9]\d{9})(?!\d)/g;
const ID_CARD_REGEX = /(?<!\d)([1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx])(?!\d)/g;

function maskPhone(phone) {
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

function maskIdCard(idCard) {
  return idCard.slice(0, 6) + '********' + idCard.slice(14);
}

function maskSensitiveData(text) {
  let masked = text.replace(ID_CARD_REGEX, (match) => maskIdCard(match));
  masked = masked.replace(PHONE_REGEX, (match) => maskPhone(match));
  return masked;
}

module.exports = {
  maskPhone,
  maskIdCard,
  maskSensitiveData,
  PHONE_REGEX,
  ID_CARD_REGEX
};
