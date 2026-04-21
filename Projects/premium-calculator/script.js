const fullNameInput = document.getElementById("fullName");
const ageInput = document.getElementById("age");
const insuranceTypeInput = document.getElementById("insuranceType");
const coverageAmountInput = document.getElementById("coverageAmount");
const yearsInput = document.getElementById("years");
const smokingInput = document.getElementById("smoking");
const riskLevelInput = document.getElementById("riskLevel");
const discountInput = document.getElementById("discount");

const calculateBtn = document.getElementById("calculateBtn");
const sampleBtn = document.getElementById("sampleBtn");
const resetBtn = document.getElementById("resetBtn");

const message = document.getElementById("message");
const resultSection = document.getElementById("resultSection");

const resultName = document.getElementById("resultName");
const resultInsurance = document.getElementById("resultInsurance");
const resultRisk = document.getElementById("resultRisk");
const resultCoverage = document.getElementById("resultCoverage");
const resultDiscount = document.getElementById("resultDiscount");
const resultStatus = document.getElementById("resultStatus");

const monthlyPremium = document.getElementById("monthlyPremium");
const yearlyPremium = document.getElementById("yearlyPremium");
const summaryList = document.getElementById("summaryList");

const STORAGE_KEY = "premiumCalculatorData";

calculateBtn.addEventListener("click", calculatePremium);
sampleBtn.addEventListener("click", fillSampleData);
resetBtn.addEventListener("click", resetForm);

window.addEventListener("DOMContentLoaded", loadSavedFormData);

function calculatePremium() {
  const fullName = fullNameInput.value.trim();
  const age = Number(ageInput.value);
  const insuranceType = insuranceTypeInput.value;
  const coverageAmount = Number(coverageAmountInput.value);
  const years = Number(yearsInput.value);
  const smoking = smokingInput.value;
  const riskLevel = riskLevelInput.value;
  const discount = Number(discountInput.value) || 0;

  resetMessage();

  if (
    fullName === "" ||
    ageInput.value === "" ||
    insuranceType === "" ||
    coverageAmountInput.value === "" ||
    yearsInput.value === "" ||
    smoking === "" ||
    riskLevel === ""
  ) {
    showMessage("יש למלא את כל שדות החובה לפני חישוב הפרמיה.", "error");
    resultSection.classList.add("hidden");
    return;
  }

  if (age < 18 || age > 100) {
    showMessage("יש להזין גיל תקין בין 18 ל-100.", "error");
    resultSection.classList.add("hidden");
    return;
  }

  if (coverageAmount <= 0 || years <= 0) {
    showMessage("סכום כיסוי ותקופת ביטוח חייבים להיות גדולים מ-0.", "error");
    resultSection.classList.add("hidden");
    return;
  }

  if (discount < 0 || discount > 50) {
    showMessage("אחוז ההנחה חייב להיות בין 0 ל-50.", "error");
    resultSection.classList.add("hidden");
    return;
  }

  let basePrice = 0;
  let insuranceLabel = "";

  if (insuranceType === "life") {
    basePrice = 120;
    insuranceLabel = "ביטוח חיים";
  } else if (insuranceType === "health") {
    basePrice = 150;
    insuranceLabel = "ביטוח בריאות";
  } else if (insuranceType === "apartment") {
    basePrice = 100;
    insuranceLabel = "ביטוח דירה";
  } else if (insuranceType === "car") {
    basePrice = 180;
    insuranceLabel = "ביטוח רכב";
  }

  let ageAddition = 0;

  if (age >= 18 && age <= 30) {
    ageAddition = 20;
  } else if (age <= 45) {
    ageAddition = 50;
  } else if (age <= 60) {
    ageAddition = 90;
  } else {
    ageAddition = 140;
  }

  let smokingAddition = 0;
  let smokingText = "לא מעשן/ת";

  if (smoking === "yes") {
    smokingAddition = 80;
    smokingText = "מעשן/ת";
  }

  let riskMultiplier = 1;
  let riskText = "";

  if (riskLevel === "low") {
    riskMultiplier = 1;
    riskText = "נמוכה";
  } else if (riskLevel === "medium") {
    riskMultiplier = 1.2;
    riskText = "בינונית";
  } else if (riskLevel === "high") {
    riskMultiplier = 1.5;
    riskText = "גבוהה";
  }

  const coverageAddition = (coverageAmount / 10000) * 8;
  const yearsAddition = years * 3;

  const totalBeforeDiscount =
    (basePrice + ageAddition + smokingAddition + coverageAddition + yearsAddition) *
    riskMultiplier;

  const finalMonthlyPremium =
    totalBeforeDiscount - (totalBeforeDiscount * discount) / 100;

  const finalYearlyPremium = finalMonthlyPremium * 12;

  resultName.textContent = fullName;
  resultInsurance.textContent = insuranceLabel;
  resultRisk.textContent = riskText;
  resultCoverage.textContent = `₪${coverageAmount.toLocaleString()}`;
  resultDiscount.textContent = `${discount}%`;
  resultStatus.textContent = "חושב בהצלחה";

  monthlyPremium.textContent = `₪${finalMonthlyPremium.toFixed(2)}`;
  yearlyPremium.textContent = `₪${finalYearlyPremium.toFixed(2)}`;

  summaryList.innerHTML = `
    <li>💠 מחיר בסיס לפי סוג הביטוח: ₪${basePrice}</li>
    <li>👤 תוספת גיל: ₪${ageAddition}</li>
    <li>🚭 מצב עישון (${smokingText}): ₪${smokingAddition}</li>
    <li>💰 תוספת סכום כיסוי: ₪${coverageAddition.toFixed(2)}</li>
    <li>📆 תוספת תקופת ביטוח: ₪${yearsAddition}</li>
    <li>📈 מכפיל רמת סיכון (${riskText}): x${riskMultiplier}</li>
    <li>🏷️ הנחה שניתנה: ${discount}%</li>
  `;

  resultSection.classList.remove("hidden");
  showMessage("החישוב בוצע בהצלחה.", "success");

  saveFormData({
    fullName,
    age: ageInput.value,
    insuranceType,
    coverageAmount: coverageAmountInput.value,
    years: yearsInput.value,
    smoking,
    riskLevel,
    discount: discountInput.value
  });
}

function fillSampleData() {
  fullNameInput.value = "נעמה בן חמו";
  ageInput.value = "27";
  insuranceTypeInput.value = "life";
  coverageAmountInput.value = "500000";
  yearsInput.value = "15";
  smokingInput.value = "no";
  riskLevelInput.value = "medium";
  discountInput.value = "10";

  showMessage("נתוני דוגמה מולאו בהצלחה.", "success");
}

function resetForm() {
  fullNameInput.value = "";
  ageInput.value = "";
  insuranceTypeInput.value = "";
  coverageAmountInput.value = "";
  yearsInput.value = "";
  smokingInput.value = "";
  riskLevelInput.value = "";
  discountInput.value = "";

  resultName.textContent = "-";
  resultInsurance.textContent = "-";
  resultRisk.textContent = "-";
  resultCoverage.textContent = "-";
  resultDiscount.textContent = "0%";
  resultStatus.textContent = "מוכן";
  monthlyPremium.textContent = "₪0.00";
  yearlyPremium.textContent = "₪0.00";
  summaryList.innerHTML = "";

  resultSection.classList.add("hidden");
  localStorage.removeItem(STORAGE_KEY);
  resetMessage();
}

function showMessage(text, type) {
  message.textContent = text;
  message.style.color = type === "success" ? "#2c7a57" : "#c95151";
}

function resetMessage() {
  message.textContent = "";
  message.style.color = "#c95151";
}

function saveFormData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSavedFormData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return;
  }

  try {
    const parsedData = JSON.parse(savedData);

    fullNameInput.value = parsedData.fullName || "";
    ageInput.value = parsedData.age || "";
    insuranceTypeInput.value = parsedData.insuranceType || "";
    coverageAmountInput.value = parsedData.coverageAmount || "";
    yearsInput.value = parsedData.years || "";
    smokingInput.value = parsedData.smoking || "";
    riskLevelInput.value = parsedData.riskLevel || "";
    discountInput.value = parsedData.discount || "";

    showMessage("הנתונים האחרונים נטענו מהשמירה המקומית.", "success");
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}