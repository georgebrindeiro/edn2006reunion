// PIX EMV QR Code payload generator (BR.GOV.BCB.PIX static QR)

function crc16(payload: string): string {
  let crc = 0xffff;
  for (const char of payload) {
    crc ^= char.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

export function generatePixPayload(
  pixKey: string,
  recipientName: string,
  city: string,
  amount: number,
  description?: string  // sub-tag 02 of tag 26 — shown as payment description in bank receipts
): string {
  const merchantAccountInner =
    tlv("00", "BR.GOV.BCB.PIX") +
    tlv("01", pixKey) +
    (description ? tlv("02", description.slice(0, 72)) : "");

  const merchantAccountInfo = tlv("26", merchantAccountInner);

  let payload =
    tlv("00", "01") +
    merchantAccountInfo +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", recipientName.slice(0, 25)) +
    tlv("60", city.slice(0, 15)) +
    tlv("62", tlv("05", "***")) +
    "6304";

  return payload + crc16(payload);
}
