// ─────────────────────────────────────────────────────────────────
// QRIS EMVCo payload builder + data-URL generator (client-side).
// Mock payload — merchant ID palsu — cuma buat DEMO visual di kasir.
// Kalau nanti pindah production, replace buildQrisPayload() dengan
// call ke Midtrans/Xendit dynamic-QR API.
// ─────────────────────────────────────────────────────────────────

import QRCode from "qrcode";

function tlv(tag: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${tag}${len}${value}`;
}

// CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF) — algoritma resmi QRIS
function crc16(str: string): string {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildQrisPayload({
    merchantName,
    merchantCity = "PURWOKERTO",
    amount,
    referenceId,
}: {
    merchantName: string;
    merchantCity?: string;
    amount: number;
    referenceId: string;
}): string {
    const cleanName = merchantName.toUpperCase().slice(0, 25);
    const cleanCity = merchantCity.toUpperCase().slice(0, 15);

    // Merchant Account Info (Tag 26) - ID.CO.QRIS.WWW format (dynamic)
    const merchantInfo =
        tlv("00", "ID.CO.QRIS.WWW") +
        tlv("01", "936000141" + Math.floor(Math.random() * 1e10).toString().padStart(10, "0")) +
        tlv("02", "ID" + Math.floor(Math.random() * 1e13).toString().padStart(13, "0"));

    let payload =
        tlv("00", "01") + //                       Payload Format Indicator
        tlv("01", "12") + //                       Point of Initiation (12 = dynamic)
        tlv("26", merchantInfo) + //               Merchant Account Info
        tlv("52", "5411") + //                     MCC (5411 = grocery)
        tlv("53", "360") + //                      Currency (360 = IDR)
        tlv("54", amount.toString()) + //          Transaction Amount
        tlv("58", "ID") + //                       Country
        tlv("59", cleanName) + //                  Merchant Name
        tlv("60", cleanCity) + //                  Merchant City
        tlv("62", tlv("05", referenceId.slice(0, 25))); // Additional Data (Bill Number)

    payload += "6304"; // CRC16 tag + length placeholder
    const crc = crc16(payload);
    return payload + crc;
}

export async function generateQrisDataUrl({
    merchantName,
    amount,
    referenceId,
}: {
    merchantName: string;
    amount: number;
    referenceId: string;
}): Promise<{ dataUrl: string; payload: string }> {
    const payload = buildQrisPayload({ merchantName, amount, referenceId });
    const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "H",
        width: 400,
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
    });
    return { dataUrl, payload };
}
