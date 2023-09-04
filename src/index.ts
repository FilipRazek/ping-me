import {
  catchError,
  combineLatest,
  debounceTime,
  filter,
  fromEvent,
  map,
  merge,
  mergeAll,
  mergeMap,
  of,
  startWith,
  switchMap,
  timer,
} from "rxjs";
import { ajax } from "rxjs/ajax";
import "./index.css";

const tableBody = document.getElementById("requests-table-body");
const urlInput = document.getElementById("url");
const frequencySlider = document.getElementById("period");
const frequencyLabel = document.getElementById("period-label");
const proxyUrl = "https://cors-here-mdeb.onrender.com";

function addRowToTable(time: string, url: string, response: string) {
  const row = document.createElement("tr");
  row.innerHTML = `<td>${time}</td><td>${url}</td><td>${response}</td>`;
  tableBody.appendChild(row);
  return row;
}

function updateRow(row: HTMLTableRowElement, response: string) {
  row.children[2].textContent = response;
}

const frequency$ = fromEvent(frequencySlider, "input").pipe(
  debounceTime(500),
  map(
    (event: Event & { target: HTMLInputElement }) =>
      parseInt(event.target.value, 10) * 1000
  ),
  startWith(5000)
);

frequency$.subscribe((frequency) => {
  const frequencyInSec = frequency / 1000;
  frequencyLabel.innerText = `${frequencyInSec} seconds`;
});

const url$ = fromEvent(urlInput, "input").pipe(
  debounceTime(1000),
  map((event: Event & { target: HTMLInputElement }) => event.target.value),
  filter((url) => url.length > 0)
);

combineLatest([url$, frequency$])
  .pipe(
    switchMap(([url, frequency]) =>
      timer(0, frequency).pipe(
        map(() => {
          const newRow = addRowToTable(
            new Date().toLocaleTimeString(),
            url,
            "Pending..."
          );
          return ajax.get(`${proxyUrl}/${url}`).pipe(
            catchError((error) => of({ status: error.message })),
            map((response) => updateRow(newRow, response.status.toString()))
          );
        }),
        mergeAll()
      )
    )
  )
  .subscribe();
