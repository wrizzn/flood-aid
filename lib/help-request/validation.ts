export const NEED_OPTIONS = [
  { value: "food", label: "อาหาร" },
  { value: "water", label: "น้ำดื่ม" },
  { value: "boat", label: "เรือ" },
  { value: "medical", label: "การแพทย์" },
  { value: "shelter", label: "ที่พักพิง" },
] as const;

export const URGENCY_OPTIONS = [
  { value: "normal", label: "ทั่วไป" },
  { value: "urgent", label: "เร่งด่วน" },
  { value: "critical", label: "วิกฤต / เสี่ยงชีวิต" },
] as const;

export type HelpRequestValues = {
  requester_name: string;
  phone: string;
  address_note: string;
  lat: string;
  lng: string;
  people_count: string;
  has_elderly: boolean;
  has_children: boolean;
  has_patient_or_disabled: boolean;
  need_types: string[];
  urgency: string;
  details: string;
};

export type ValidationErrors = Partial<Record<keyof HelpRequestValues, string>>;

export const INITIAL_VALUES: HelpRequestValues = {
  requester_name: "", phone: "", address_note: "", lat: "", lng: "",
  people_count: "1", has_elderly: false, has_children: false,
  has_patient_or_disabled: false, need_types: [], urgency: "normal", details: "",
};

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, "");
}

function validCoordinate(value: string, max: number): boolean {
  const trimmed = value.trim();
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed) &&
    Number.isFinite(Number(trimmed)) && Math.abs(Number(trimmed)) <= max;
}

export function validateHelpRequest(values: HelpRequestValues): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!values.requester_name.trim()) errors.requester_name = "กรุณากรอกชื่อผู้แจ้ง";
  // Domestic Thai mobile (10 digits) or landline (9 digits); spaces/hyphens allowed.
  if (!/^0(?:[689]\d{8}|[2-7]\d{7})$/.test(normalizePhone(values.phone))) {
    errors.phone = "กรุณากรอกเบอร์โทรไทยที่ขึ้นต้นด้วย 0: มือถือ 10 หลัก หรือโทรศัพท์บ้าน 9 หลัก";
  }
  if (!validCoordinate(values.lat, 90)) errors.lat = "กรุณากรอกละติจูดเป็นตัวเลขตั้งแต่ -90 ถึง 90";
  if (!validCoordinate(values.lng, 180)) errors.lng = "กรุณากรอกลองจิจูดเป็นตัวเลขตั้งแต่ -180 ถึง 180";
  const count = Number(values.people_count);
  if (!/^\d+$/.test(values.people_count.trim()) || !Number.isInteger(count) || count < 1 || count > 2147483647) {
    errors.people_count = "กรุณากรอกจำนวนคนเป็นจำนวนเต็มตั้งแต่ 1 ถึง 2,147,483,647";
  }
  if (!values.need_types.length || values.need_types.some(v => !NEED_OPTIONS.some(o => o.value === v))) {
    errors.need_types = "กรุณาเลือกสิ่งที่ต้องการอย่างน้อย 1 อย่างจากรายการ";
  }
  if (!URGENCY_OPTIONS.some(o => o.value === values.urgency)) errors.urgency = "กรุณาเลือกระดับความเร่งด่วนจากรายการ";
  return errors;
}

/** Only columns supplied by this public form; status/assignee use DB defaults. */
export function toHelpRequestInsert(values: HelpRequestValues) {
  if (Object.keys(validateHelpRequest(values)).length) throw new Error("ข้อมูลคำขอไม่ถูกต้อง");
  return {
    requester_name: values.requester_name.trim(),
    phone: normalizePhone(values.phone),
    address_note: values.address_note.trim() || null,
    lat: Number(values.lat), lng: Number(values.lng),
    people_count: Number(values.people_count),
    has_elderly: values.has_elderly, has_children: values.has_children,
    has_patient_or_disabled: values.has_patient_or_disabled,
    need_types: [...new Set(values.need_types)], urgency: values.urgency,
    details: values.details.trim() || null,
  };
}
