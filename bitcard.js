// === CONFIG (una sola vez) ===
const apiUrl = "https://script.google.com/macros/s/AKfycbw31uafsBx6ozuZrJhS0v00t0cICTZpUvDcbv4OVeSNaJJqMqeeo1LyDJm4d-frR1Yn7w/exec";
const secret = "111";

// === UTILS ===
const qs = new URLSearchParams(location.search);
const rawId = qs.get("id");
const authParam = qs.get("auth");
const id = rawId ? rawId.toString().padStart(3, "0") : "";

const fmt = n => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString("es-UY") : "0";
};
const safeNum = (v, def=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// === MAIN ===
(async function init(){
  if (!id) {
    document.getElementById("nombre").textContent = "Falta ?id";
    return;
  }
  document.getElementById("clienteId").textContent = `ID: ${id}`;

  // fetch con cache-buster
  let data;
  try {
    const res = await fetch(`${apiUrl}?id=${encodeURIComponent(id)}&_=${Date.now()}`, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    document.getElementById("nombre").textContent = "No se pudo obtener datos";
    return;
  }

  // redirección (misma lógica original: si está activa, salir)
  if (data?.redireccion && data?.url) {
    location.href = data.url;
    return;
  }

  const c = Array.isArray(data) ? data[0] : data;
  if (!c || !c.ID) {
    document.getElementById("nombre").textContent = "NO ENCONTRADO";
    return;
  }

  // Identidad
  document.getElementById("nombre").textContent  = `SUJETO: ${c.Nombre || "-"}`;
  document.getElementById("Ranking").textContent = c.Ranking ?? "-";

  // CÍRCULO (1–5)
  const varianteCirculo = {
    "CÍRCULO 1":"1","PRIMER CÍRCULO":"1","1":"1",
    "CÍRCULO 2":"2","SEGUNDO CÍRCULO":"2","2":"2",
    "CÍRCULO 3":"3","TERCER CÍRCULO":"3","3":"3",
    "CÍRCULO 4":"4","CUARTO CÍRCULO":"4","4":"4",
    "CÍRCULO 5":"5","QUINTO CÍRCULO":"5","5":"5"
  };
  const nombresCirculo = {
    "1":"CÍRCULO 1","2":"CÍRCULO 2","3":"CÍRCULO 3","4":"CÍRCULO 4","5":"CÍRCULO 5"
  };
  const imagenesPorCirculo = {
    "1":"https://cdn.shopify.com/s/files/1/0550/5001/0810/files/descarga1.svg?v=1751840844",
    "2":"https://cdn.shopify.com/s/files/1/0550/5001/0810/files/descarga2.svg?v=1751840844",
    "3":"https://cdn.shopify.com/s/files/1/0550/5001/0810/files/descarga3.svg?v=1751840844",
    "4":"https://cdn.shopify.com/s/files/1/0550/5001/0810/files/descarga4.svg?v=1751840844",
    "5":"https://cdn.shopify.com/s/files/1/0550/5001/0810/files/descarga5.svg?v=1751840844"
  };

  const key = varianteCirculo[(c.Círculo || "").toString().toUpperCase().trim()] || "1";
  document.getElementById("circulo").textContent = `CÍRCULO: ${nombresCirculo[key]}`;
  const imgEl = document.getElementById("circuloImagen");
  imgEl.src = imagenesPorCirculo[key] || "";
  imgEl.classList.toggle("circulo-posthuman", key === "3"); // mantenemos tu efecto para 3

  // Valores base (con fallback)
  let bitsDisponibles = safeNum(c.bits_disponibles, safeNum(c.Bits, 0));
  let bitsHistoricos  = safeNum(c.bits_totales_historicos, safeNum(c.bits_totales, safeNum(c.Bits, 0)));

  document.getElementById("Bits").textContent           = fmt(bitsDisponibles);
  document.getElementById("BitsHistoricos").textContent = fmt(bitsHistoricos);
  document.getElementById("Visitas").textContent        = fmt(c.Visitas);

  // Acreditación +50 si auth=111 y no se hizo en las últimas 2 horas
  const lastUpdateKey = `ultimaAcreditacion_${id}`;
  const lastUpdate = localStorage.getItem(lastUpdateKey);
  const now = Date.now();
  const canUpdate = !lastUpdate || (now - Date.parse(lastUpdate)) > 2*60*60*1000;

  if (canUpdate && authParam === secret) {
    const nuevasVisitas = safeNum(c.Visitas, 0) + 1;
    bitsDisponibles += 50;
    bitsHistoricos  += 50;

    // UI inmediata
    document.getElementById("Visitas").textContent        = fmt(nuevasVisitas);
    document.getElementById("Bits").textContent           = fmt(bitsDisponibles);
    document.getElementById("BitsHistoricos").textContent = fmt(bitsHistoricos);

    // UPDATE hoja
    const upd = new URLSearchParams({
      action:"update",
      ID:c.ID, Nombre:c.Nombre || "",
      Bits:bitsDisponibles,
      Visitas:nuevasVisitas,
      Ranking:c.Ranking ?? "",
      Círculo:c.Círculo ?? ""
    });
    fetch(`${apiUrl}?${upd}`).catch(()=>{});

    // LOG +50
    const logp = new URLSearchParams({ action:"log", ID:c.ID, Nombre:c.Nombre || "", Incremento:50 });
    fetch(`${apiUrl}?${logp}`).catch(()=>{});

    // Feedback
    document.getElementById("mensajeVisita").classList.add("visible");
    document.getElementById("mensajeBits").classList.add("visible");
    setTimeout(() => {
      document.getElementById("mensajeVisita").classList.remove("visible");
      document.getElementById("mensajeBits").classList.remove("visible");
    }, 3000);

    localStorage.setItem(lastUpdateKey, new Date().toISOString());
  }

  // Link info (igual que antes)
  if (authParam !== secret) {
    document.getElementById("linkFeiqui").style.display = "inline-block";
  } else {
    setTimeout(() => location.href = "scan.html", 15000);
  }
})();
