<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1E1B4B,100:22D3EE&height=200&section=header&text=Smart%20Meter%20API&fontSize=46&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Express%20%C2%B7%20MongoDB%20%C2%B7%20Gemini&descAlignY=58&descSize=18" width="100%" alt="Smart Meter API banner"/>

<a href="#-api"><img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1200&color=22D3EE&center=true&vCenter=true&width=720&lines=Receives+meter+readings+from+an+ESP32+LoRa+gateway;Stores+voltage%2C+current%2C+power+and+RSSI+in+MongoDB;Serves+live+data%2C+anomalies+and+forecasts;Gemini+writes+the+plain-English+summary+%C2%B7+Sep+2025" alt="Typing summary"/></a>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-CommonJS-339933?logo=nodedotjs&logoColor=white)](server.js)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)](models)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-generative--ai-8E75B2?logo=googlegemini&logoColor=white)](services/geminiService.js)
[![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black)](https://render.com)
<br/>
[![Status](https://img.shields.io/badge/Status-Prototype%20%C2%B7%20offline-F97316)](#-status-and-known-limitations)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

</div>

---

## <img src="https://api.iconify.design/lucide/target.svg?color=%2322D3EE" width="26" align="top" alt=""/> Project Overview

The backend of a smart-meter proof of concept (September 2025). A LoRa gateway posts each meter reading to this server, which stores it in MongoDB. The dashboard in [SM-POC-Frontend](https://github.com/mukesh-dev-git/SM-POC-Frontend) reads the data back, plus two analytics feeds (anomalies and a power forecast) and a short energy summary written by Google Gemini.

### Key Features

- <img src="https://api.iconify.design/lucide/radio.svg?color=%2322D3EE" width="18" align="top" alt=""/> **Reading ingest**: `POST /lora` stores `deviceId`, voltage, current, power, energy, RSSI and the device tick, and stamps the server receive time.
- <img src="https://api.iconify.design/lucide/activity.svg?color=%2310B981" width="18" align="top" alt=""/> **Live data**: `GET /data` returns the 50 newest readings.
- <img src="https://api.iconify.design/lucide/triangle-alert.svg?color=%23EF4444" width="18" align="top" alt=""/> **Anomalies**: the latest 50 stored anomalies plus the last 24 hours of readings for context.
- <img src="https://api.iconify.design/lucide/trending-up.svg?color=%23F59E0B" width="18" align="top" alt=""/> **Forecast**: the most recent stored power forecast plus the last 6 hours of readings.
- <img src="https://api.iconify.design/lucide/sparkles.svg?color=%238E75B2" width="18" align="top" alt=""/> **AI summary**: `GET /api/summary` sends the 10 latest anomalies and the forecast to Gemini and returns its text (overall status, key observations, one recommendation).

## <img src="https://api.iconify.design/lucide/network.svg?color=%2322D3EE" width="26" align="top" alt=""/> How It Works

```mermaid
flowchart LR
    M[Meter node<br/>PowerMET] -->|433 MHz LoRa<br/>text packet| G[ESP32 gateway<br/>LoRa-ESP32]
    G -->|HTTP POST /lora<br/>JSON| E[Express server<br/>server.js]
    E --> DB[(MongoDB<br/>readings, anomalies, forecasts)]
    FE[React dashboard<br/>SM-POC-Frontend] -->|GET /data, /api/*| E
    E -->|prompt| AI[Gemini<br/>gemini-1.5-flash]

    classDef dev fill:#F1EFE8,stroke:#888780,color:#222
    classDef api fill:#EEEDFE,stroke:#7F77DD,color:#222
    classDef ext fill:#22D3EE,stroke:#1E1B4B,color:#111
    class M,G,FE dev
    class E api
    class DB,AI ext
```

The `anomalies` and `forecasts` collections are only **read** here. Nothing in this repository creates those documents, so they were meant to be filled by a separate analytics job that is not part of the repo.

## <img src="https://api.iconify.design/lucide/plug.svg?color=%2322D3EE" width="26" align="top" alt=""/> API

| Method | Endpoint | What it does |
|---|---|---|
| POST | `/lora` | Body `{ deviceId, timestamp, voltage, current, power, energy, rssi }`, all required. Saves one reading; `201` on success, `500` if a field is missing or the save fails |
| GET | `/data` | The 50 newest readings, newest first (sorted by `receivedAt`) |
| GET | `/api/anomalies` | `{ anomalies, contextReadings }`: latest 50 anomalies and the readings from the last 24 hours, oldest first |
| GET | `/api/forecast` | `{ forecast, recentReadings }`: newest forecast (`null` if none) and the readings from the last 6 hours |
| GET | `/api/summary` | `{ summary }`: Gemini text, or `"Not enough data to generate a summary."` when there is no forecast |

There is no authentication on any route, and CORS allows every origin.

## <img src="https://api.iconify.design/lucide/database.svg?color=%2322D3EE" width="26" align="top" alt=""/> Data Model

| Collection | Fields |
|---|---|
| `readings` | `deviceId`, `timestamp` (device tick in ms, from the STM32), `voltage`, `current`, `power`, `energy`, `rssi`, `receivedAt` (server time, indexed) |
| `anomalies` | `timestamp`, `power`, `voltage`, `type`, `detectedAt` (indexed on `timestamp`) |
| `forecasts` | `createdAt`, `startTime`, `forecast.timestamps[]`, `forecast.power_watts[]` (indexed on `createdAt`) |

## <img src="https://api.iconify.design/lucide/zap.svg?color=%2322D3EE" width="26" align="top" alt=""/> Quick Start

You need Node.js and a MongoDB database (Atlas free tier or a local `mongod`). A Gemini API key is only needed for `/api/summary`.

```bash
git clone https://github.com/mukesh-dev-git/SM-POC-Backend.git
cd SM-POC-Backend
npm install
cp .env.example .env      # set MONGO_URI and GEMINI_API_KEY
node server.js            # http://localhost:3001, or PORT
```

`package.json` has no `start` script, so run `node server.js` directly. The server exits at start-up if the MongoDB connection fails.

Send a test reading and read it back:

```bash
curl -X POST http://localhost:3001/lora \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"PM001","timestamp":120000,"voltage":230.4,"current":1.25,"power":288,"energy":12.5,"rssi":-72}'

curl http://localhost:3001/data
```

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%2322D3EE" width="26" align="top" alt=""/> Project Structure

```
SM-POC-Backend/
├── server.js                  # Express app, Mongo connection, all routes
├── models/
│   ├── reading.js             # Reading schema
│   ├── anomaly.js             # Anomaly schema
│   └── forecast.js            # Forecast schema
├── services/
│   └── geminiService.js       # builds the prompt and calls Gemini
├── .env.example
└── package.json
```

## <img src="https://api.iconify.design/lucide/gauge.svg?color=%2322D3EE" width="26" align="top" alt=""/> Status and Known Limitations

A proof of concept that was deployed on Render and is now offline.

| Area | State |
|---|---|
| Reading ingest and `/data` | Working |
| `/api/anomalies`, `/api/forecast` | Work, but return empty results unless something writes to the `anomalies` and `forecasts` collections; no such code is in this repo |
| `/api/summary` | Needs a forecast document. Uses `gemini-1.5-flash`, a model Google has since retired, so set a current model name in `services/geminiService.js`. Failures return a plain error string with HTTP 200 |
| Summary prompt | Says "last 24 hours" but passes the 10 newest anomalies regardless of age |
| Validation | A missing field gives `500`, not `400` |
| Security | No authentication, no rate limiting, open CORS: anyone can post readings |
| Run script, tests | No `start` script (and `main` points to a missing `index.js`); no tests |

### External services

| Service | Used for | State |
|---|---|---|
| Render (`sm-poc-backend.onrender.com`) | Hosting | Gone: the URL returns 404 with `x-render-routing: no-server` |
| MongoDB Atlas | Database | The connection string was never committed (it is read from `MONGO_URI`), so the cluster could not be checked; bring your own |
| Google Gemini API | `/api/summary` | Needs your own `GEMINI_API_KEY`; the model name in the code is retired |

## <img src="https://api.iconify.design/lucide/link.svg?color=%2322D3EE" width="26" align="top" alt=""/> Related Repositories

- [SM-POC-Frontend](https://github.com/mukesh-dev-git/SM-POC-Frontend): the React dashboard that calls this API.
- [LoRa-ESP32](https://github.com/mukesh-dev-git/LoRa-ESP32): the ESP32 gateway that receives LoRa packets and posts them to `/lora`.
- [PowerMET](https://github.com/mukesh-dev-git/PowerMET): the STM32 meter node that sends the packets.
- [SM-Dev1](https://github.com/mukesh-dev-git/SM-Dev1): a later STM32L432 + Wio-E5 LoRaWAN bring-up for the same smart-meter idea. It does not talk to this API.

## <img src="https://api.iconify.design/lucide/scale.svg?color=%2322D3EE" width="26" align="top" alt=""/> License

MIT. See [LICENSE](LICENSE).

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:22D3EE,100:1E1B4B&height=110&section=footer&animation=fadeIn" width="100%" alt=""/>

</div>
