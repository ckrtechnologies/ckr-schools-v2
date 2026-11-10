const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const TEENS = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const ORDINAL_DAYS = [
  "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
  "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth",
  "Twenty First", "Twenty Second", "Twenty Third", "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", "Twenty Seventh", "Twenty Eighth", "Twenty Ninth", "Thirtieth", "Thirty First"
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

const CLASS_WORDS_MAP = {
  "NUR": "NURSERY",
  "NURSERY": "NURSERY",
  "LKG": "LOWER KINDERGARTEN",
  "UKG": "UPPER KINDERGARTEN",
  "KG": "KINDERGARTEN",
  "1": "FIRST",
  "2": "SECOND",
  "3": "THIRD",
  "4": "FOURTH",
  "5": "FIFTH",
  "6": "SIXTH",
  "7": "SEVENTH",
  "8": "EIGHTH",
  "9": "NINTH",
  "10": "TENTH",
  "11": "ELEVENTH",
  "12": "TWELFTH",
  "I": "FIRST",
  "II": "SECOND",
  "III": "THIRD",
  "IV": "FOURTH",
  "V": "FIFTH",
  "VI": "SIXTH",
  "VII": "SEVENTH",
  "VIII": "EIGHTH",
  "IX": "NINTH",
  "X": "TENTH",
  "XI": "ELEVENTH",
  "XII": "TWELFTH"
};

function numberToWordsBelowThousand(n) {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 20)] + " ";
    n %= 20;
  } else if (n >= 10) {
    str += TEENS[n - 10] + " ";
    n = 0;
  }
  if (n > 0) {
    str += ONES[n] + " ";
  }
  return str.trim();
}

function yearToWords(year) {
  if (year >= 2000 && year < 2100) {
    const remainder = year - 2000;
    if (remainder === 0) return "Two Thousand";
    return `Two Thousand ${numberToWordsBelowThousand(remainder)}`;
  }
  const century = Math.floor(year / 100);
  const rem = year % 100;
  return `${numberToWordsBelowThousand(century)} Hundred ${rem ? numberToWordsBelowThousand(rem) : ""}`.trim();
}

export function formatDateToWords(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();

  const dayWord = ORDINAL_DAYS[day] || `${day}`;
  const yearWord = yearToWords(year);

  return `${dayWord} ${month} ${yearWord}`;
}

export function formatClassToWords(className) {
  if (!className) return "";
  const clean = String(className).trim().toUpperCase();
  return CLASS_WORDS_MAP[clean] || clean;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateHyphen(dateStr) {
  if (!dateStr) return "";
  // If already in DD-MM-YYYY format, return as is
  if (typeof dateStr === "string" && /^\d{2}-\d{2}-\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

