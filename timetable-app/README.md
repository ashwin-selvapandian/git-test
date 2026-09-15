# My Timetable

A simple weekly calendar app for your class/timetable schedule. No build step, no dependencies — just static HTML/CSS/JS.

## Running it

Open `index.html` directly in a browser, or serve the folder locally:

```
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

## Features

- Weekly calendar grid (7 AM – 10 PM)
- Click any empty slot to add a class (title, day, start/end time, location, color)
- Click an existing class to edit or delete it
- Data is saved automatically in your browser (`localStorage`) — no account or server needed
- Export your timetable to a JSON file, or import one back in
