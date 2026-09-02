const LAT = -6.2747;
const LON = 106.8706;

const prayerMap = {
  Imsak: "imsak",
  Fajr: "fajr",
  Sunrise: "sunrise",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha"
};

const prayerNames = {
  Imsak: "Imsak",
  Fajr: "Subuh",
  Sunrise: "Terbit",
  Dhuhr: "Dzuhur",
  Asr: "Ashar",
  Maghrib: "Maghrib",
  Isha: "Isya"
};

let prayerData = null;

/* =========================
   WAKTU JAKARTA
========================= */

function nowJakarta() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    })
  );
}

/* =========================
   CLOCK + DATE
========================= */

function updateClock() {
  const d = nowJakarta();

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  document.getElementById("clock").textContent =
    `${hh}.${mm}.${ss}`;

  const fullDate = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  document.getElementById("date").textContent = fullDate;
  document.getElementById("dayNumber").textContent = d.getDate();
  document.getElementById("fullDate").textContent = fullDate;

  /* Kalender Hijriah */
  try {
    const hijri = new Intl.DateTimeFormat(
      "id-ID-u-ca-islamic",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(d);

    document.getElementById("hijri").textContent = hijri;
  } catch (error) {
    document.getElementById("hijri").textContent =
      "Kalender Hijriah tidak tersedia";
  }

  updateNext();
}

setInterval(updateClock, 1000);
updateClock();

/* =========================
   PRAYER TIME HELPERS
========================= */

function minutes(time) {
  if (!time) return 9999;

  const [hours, mins] = time
    .split(":")
    .map(Number);

  return hours * 60 + mins;
}

function clean(time) {
  return (time || "--:--").split(" ")[0];
}

/* =========================
   LOAD PRAYER TIMES
========================= */

async function loadPrayerTimes() {
  const d = nowJakarta();

  const date = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

  const url =
    `https://api.aladhan.com/v1/timings/${date}` +
    `?latitude=${LAT}` +
    `&longitude=${LON}` +
    `&method=20`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Gagal mengambil data");
    }

    const json = await response.json();

    if (
      !json.data ||
      !json.data.timings
    ) {
      throw new Error("Format data tidak sesuai");
    }

    prayerData = json.data.timings;

    Object.entries(prayerMap).forEach(
      ([key, id]) => {
        const element =
          document.getElementById(id);

        if (element) {
          element.textContent =
            clean(prayerData[key]);
        }
      }
    );

    updateNext();

  } catch (error) {
    console.error(
      "Prayer API Error:",
      error
    );

    document.getElementById(
      "nextName"
    ).textContent = "Data belum tersedia";

    document.getElementById(
      "countdown"
    ).textContent = "--:--:--";
  }
}

loadPrayerTimes();

/* Update setiap 30 menit */
setInterval(
  loadPrayerTimes,
  30 * 60 * 1000
);

/* =========================
   NEXT PRAYER
========================= */

function updateNext() {
  if (!prayerData) return;

  const d = nowJakarta();

  const current =
    d.getHours() * 60 +
    d.getMinutes() +
    d.getSeconds() / 60;

  const keys = [
    "Fajr",
    "Dhuhr",
    "Asr",
    "Maghrib",
    "Isha"
  ];

  let next = null;
  let diff = 0;

  /* Cari salat berikutnya */
  for (const key of keys) {
    const prayerTime =
      minutes(clean(prayerData[key]));

    if (prayerTime > current) {
      next = key;
      diff = prayerTime - current;
      break;
    }
  }

  /* Kalau sudah lewat Isya,
     next = Subuh besok */
  if (!next) {
    next = "Fajr";

    diff =
      1440 -
      current +
      minutes(clean(prayerData.Fajr));
  }

  document.getElementById(
    "nextName"
  ).textContent = prayerNames[next];

  /* Countdown */
  const totalSeconds = Math.max(
    0,
    Math.floor(diff * 60)
  );

  const hours = String(
    Math.floor(totalSeconds / 3600)
  ).padStart(2, "0");

  const minutesLeft = String(
    Math.floor(
      (totalSeconds % 3600) / 60
    )
  ).padStart(2, "0");

  const seconds = String(
    totalSeconds % 60
  ).padStart(2, "0");

  document.getElementById(
    "countdown"
  ).textContent =
    `${hours}:${minutesLeft}:${seconds}`;

  /* =========================
     ACTIVE PRAYER
  ========================= */

  document
    .querySelectorAll(".prayer")
    .forEach(item => {
      item.classList.remove("active");
    });

  const activePrayer = keys.find(
    (key, index) => {
      const start =
        minutes(clean(prayerData[key]));

      const end =
        index < keys.length - 1
          ? minutes(
              clean(
                prayerData[
                  keys[index + 1]
                ]
              )
            )
          : 1440;

      return (
        current >= start &&
        current < end
      );
    }
  );

  if (activePrayer) {
    const activeElement =
      document.querySelector(
        `.prayer[data-key="${activePrayer}"]`
      );

    if (activeElement) {
      activeElement.classList.add("active");
    }
  }
}

/* =========================
   AYAT & HIKMAH
========================= */

const quotes = [
  [
    "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    "Sesungguhnya bersama kesulitan ada kemudahan.",
    "QS. Al-Insyirah: 6"
  ],
  [
    "فَاذْكُرُونِي أَذْكُرْكُمْ",
    "Maka ingatlah kepada-Ku, niscaya Aku akan mengingatmu.",
    "QS. Al-Baqarah: 152"
  ],
  [
    "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    "Ya Tuhanku, tambahkanlah kepadaku ilmu.",
    "QS. Taha: 114"
  ],
  [
    "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    "Sesungguhnya Allah bersama orang-orang yang sabar.",
    "QS. Al-Baqarah: 153"
  ],
  [
    "وَعَلَى اللَّهِ فَتَوَكَّلُوا",
    "Dan hanya kepada Allah hendaklah kamu bertawakal.",
    "QS. Al-Ma'idah: 23"
  ],
  [
    "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    "Mohonlah pertolongan dengan sabar dan salat.",
    "QS. Al-Baqarah: 45"
  ],
  [
    "إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ",
    "Sesungguhnya Allah mencintai orang-orang yang berbuat baik.",
    "QS. Al-Baqarah: 195"
  ],
  [
    "وَقُولُوا لِلنَّاسِ حُسْنًا",
    "Ucapkanlah kata-kata yang baik kepada manusia.",
    "QS. Al-Baqarah: 83"
  ],
  [
    "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    "Barang siapa bertawakal kepada Allah, niscaya Dia akan mencukupinya.",
    "QS. At-Talaq: 3"
  ],
  [
    "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
    "Tidak ada taufik bagiku melainkan dengan pertolongan Allah.",
    "QS. Hud: 88"
  ],
  [
    "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ",
    "Sesungguhnya Allah tidak mengubah keadaan suatu kaum.",
    "QS. Ar-Ra'd: 11"
  ],
  [
    "وَلَذِكْرُ اللَّهِ أَكْبَرُ",
    "Dan mengingat Allah itu lebih besar keutamaannya.",
    "QS. Al-Ankabut: 45"
  ],
  [
    "وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    "Bersyukurlah kepada-Ku dan janganlah kamu mengingkari-Ku.",
    "QS. Al-Baqarah: 152"
  ],
  [
    "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    "Barang siapa bertakwa kepada Allah, niscaya Dia akan membukakan jalan keluar.",
    "QS. At-Talaq: 2"
  ],
  [
    "وَاللَّهُ خَيْرٌ حَافِظًا",
    "Dan Allah adalah sebaik-baik penjaga.",
    "QS. Yusuf: 64"
  ],
  [
    "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ",
    "Sesungguhnya Allah mencintai orang-orang yang bertaubat.",
    "QS. Al-Baqarah: 222"
  ],
  [
    "وَلَا تَهِنُوا وَلَا تَحْزَنُوا",
    "Janganlah kamu merasa lemah dan jangan pula bersedih.",
    "QS. Ali 'Imran: 139"
  ],
  [
    "وَقُلْ رَبِّ ارْحَمْهُمَا",
    "Wahai Tuhanku, sayangilah keduanya.",
    "QS. Al-Isra: 24"
  ],
  [
    "إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا",
    "Sesungguhnya Allah bersama orang-orang yang bertakwa.",
    "QS. An-Nahl: 128"
  ],
  [
    "فَاذْكُرُوا اللَّهَ قِيَامًا وَقُعُودًا",
    "Ingatlah Allah ketika berdiri, duduk, dan berbaring.",
    "QS. An-Nisa: 103"
  ]
];

let quoteIndex = 0;

const dotsContainer =
  document.getElementById("dots");

/* Buat indikator */
quotes.forEach((_, index) => {
  const dot =
    document.createElement("span");

  dot.className = "dot";

  if (index === 0) {
    dot.classList.add("on");
  }

  dot.addEventListener(
    "click",
    () => {
      quoteIndex = index;
      showQuote(quoteIndex);
    }
  );

  dotsContainer.appendChild(dot);
});

/* Tampilkan quote */
function showQuote(index) {
  const quote = quotes[index];

  document.getElementById(
    "quoteNo"
  ).textContent =
    `${String(index + 1).padStart(2, "0")} / ${quotes.length}`;

  document.getElementById(
    "quoteArabic"
  ).textContent = quote[0];

  document.getElementById(
    "quoteMeaning"
  ).textContent = quote[1];

  document.getElementById(
    "quoteSource"
  ).textContent = quote[2];

  document
    .querySelectorAll(".dot")
    .forEach((dot, i) => {
      dot.classList.toggle(
        "on",
        i === index
      );
    });
}

showQuote(0);

/* Ganti ayat setiap 6 detik */
setInterval(() => {
  quoteIndex =
    (quoteIndex + 1) % quotes.length;

  showQuote(quoteIndex);
}, 6000);

/* =========================
   KOMPAS KIBLAT
========================= */

const needle =
  document.getElementById("needle");

/* Posisi default: 295° */
needle.style.transform =
  "rotate(295deg)";

/* Sensor HP */
window.addEventListener(
  "deviceorientationabsolute",
  event => {
    if (
      typeof event.alpha === "number"
    ) {
      const qibla = 295;

      needle.style.transform =
        `rotate(${qibla - event.alpha}deg)`;
    }
  },
  true
);

/* =========================
   REFRESH BUTTON
========================= */

const refreshButton =
  document.querySelector(".refresh");

if (refreshButton) {
  refreshButton.addEventListener(
    "click",
    loadPrayerTimes
  );
}
