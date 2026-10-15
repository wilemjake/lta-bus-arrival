# User Prompts History

This document collates all prompts submitted throughout the development of the Singapore LTA Bus Arrival & Transit Tracker application.

---

### Prompt 1: Initial App Specification & Frontend Build
```text
build a singapore based bus arrival time application that tracks real time bus location data and provides accurate wait time predications for all LTA bus stops. 

Build just the front end for now, i will include the backend connection later.
```

---

### Prompt 2: GitHub Repository Setup & Push
```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/wilemjake/lta-bus-arrival.git
```

---

### Prompt 3: Serverless Backend Connection (/api)
```text
add a serverless connection that pulls live data from LTA datamall using the following endpoints: 

- store this in /api folder (project root level) not the src folder
- include /health.ts and /busarrival.ts within that subfolder
- do not hardcode any key, i will include them later

GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

---

### Prompt 4: Collate Prompts
```text
collate prompt thus far and store them prompt.mdfile
```
