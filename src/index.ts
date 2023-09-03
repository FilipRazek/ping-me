import {
  catchError,
  combineLatest,
  debounceTime,
  fromEvent,
  map,
  mergeMap,
  of,
  startWith,
  switchMap,
  tap,
  timer,
} from "rxjs";
import { ajax } from "rxjs/ajax";

const tableBody = document.getElementById("requests-body");
const urlInput = document.getElementById("url");
const frequencySlider = document.getElementById("frequency");
const frequencyLabel = document.getElementById("frequency-label");

function addRowToTable(time: string, url: string, response: string) {
  const row = document.createElement("tr");
  row.innerHTML = `<td>${time}</td><td>${url}</td><td>${response}</td>`;
  tableBody.appendChild(row);
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
  debounceTime(500),
  map((event: Event & { target: HTMLInputElement }) => event.target.value)
);

combineLatest([url$, frequency$]).pipe(
  tap(([url, frequency]) => {
    console.log(url, frequency);
  })
);

combineLatest([url$, frequency$])
  .pipe(
    tap(console.log),
    switchMap(([url, frequency]) =>
      timer(0, frequency).pipe(
        mergeMap(() =>
          ajax
            .get(`https://cors-anywhere.herokuapp.com/${url}`)
            .pipe(map((response) => [url, response.status]))
        ),
        catchError((error) => of([url, error.message]))
      )
    )
  )
  .subscribe(([url, status]) => {
    const time = new Date().toLocaleTimeString();
    addRowToTable(time, url, status);
  });
