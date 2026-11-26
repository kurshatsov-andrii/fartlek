// Official Ukrainian national transliteration (KMU 2010) for display of place names in English.
const MAP: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia","'":"","’":"","ʼ":"",ы:"y",э:"e",ё:"io",ъ:"",
};
const START: Record<string, string> = { є:"ye", ї:"yi", й:"y", ю:"yu", я:"ya" };
const KNOWN: Record<string, string> = { "Київ":"Kyiv","Харків":"Kharkiv","Одеса":"Odesa","Львів":"Lviv","Дніпро":"Dnipro","Запоріжжя":"Zaporizhzhia","Онлайн":"Online" };

export function translitCity(name: string): string {
  if (!name) return name;
  if (KNOWN[name]) return KNOWN[name];
  let out = "";
  let wordStart = true;
  for (let i = 0; i < name.length; i++) {
    const ch = name[i]!;
    const lower = ch.toLowerCase();
    const upper = ch !== lower;
    if (lower === "з" && name[i + 1]?.toLowerCase() === "г") { out += upper ? "Zgh" : "zgh"; i++; wordStart = false; continue; }
    const t = wordStart && START[lower] !== undefined ? START[lower]! : MAP[lower];
    if (t === undefined) { out += ch; wordStart = !/[\p{L}'’ʼ]/u.test(ch); continue; }
    out += upper && t ? t[0]!.toUpperCase() + t.slice(1) : t;
    wordStart = false;
  }
  return out;
}
