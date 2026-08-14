# Saper

Mały Saper zrobiony w React + TypeScript jako zadanie rekrutacyjne.

Logikę gry trzymam osobno od Reacta w `src/logic/board.ts`, żeby dało się ją normalnie testować bez odpalania całego interfejsu.

## Jak uruchomić

Potrzebny jest Node.js 20 lub nowszy.

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

Po ostatniej komendzie aplikacja odpali się pod adresem podanym przez Vite, domyślnie `http://localhost:5173`.

## Co zrobiłem, a czego nie

Zrobiłem cały wymagany zakres: wybór planszy, restart, odkrywanie pól, bezpieczny pierwszy ruch, kaskadowe odkrywanie pól z zerem, flagi, licznik min, wygraną, przegraną, pokazanie min po przegranej i chording po kliknięciu odkrytej cyfry.

Lewy przycisk odkrywa pole, prawy stawia flagę. Dodałem też możliwość postawienia flagi klawiszem `F`.

Nie dodawałem rzeczy typu timer, punkty, backend czy dodatkowe tryby gry. Nie było tego w zadaniu, więc wolałem poświęcić ten czas na logikę, przypadki brzegowe i testy.

## Co znalazłem w danych

Pliku z planszami nie zmieniałem. Przy tworzeniu planszy sprawdzam dane wejściowe, usuwam powtórzone miny i pomijam współrzędne, które wychodzą poza planszę.

W danych znalazłem kilka ciekawych przypadków:

* **„Pomyłka rachmistrza”** deklaruje 10 min, ale ma 12 poprawnych i unikalnych pozycji.
* **„Bliźnięta”** deklarują 8 min, ale jedna pozycja jest podana dwa razy, więc realnie min jest 7.
* **„Za płotem”** deklaruje 6 min, ale jedna z pozycji znajduje się poza planszą, więc poprawnych min zostaje 5.

Uznałem, że faktyczny układ planszy powinien wynikać z poprawnych pozycji w `mines`, a nie z samego `mineCount`.

Nie chciałem na podstawie `mineCount` samemu dodawać albo usuwać min, bo musiałbym wtedy zgadywać, gdzie powinny się znaleźć.

Te przypadki są też pokryte testami.

## Jakich bibliotek użyłem i po co

* **React 18** — do interfejsu i obsługi stanu gry.
* **TypeScript** w trybie strict — żeby możliwie dużo problemów wyłapać już na poziomie typów.
* **Vite** — do postawienia projektu i builda.
* **Vitest** — do testowania logiki gry.
* **Sass** — do stylowania zgodnie z wymaganiami zadania.

Nie używałem żadnej biblioteki UI, gotowego Sapera, CSS-in-JS ani canvasa.

## Co zrobiłbym dalej

Gdyby ten projekt miał być dalej rozwijany, dorzuciłbym przede wszystkim testy działania całej gry w przeglądarce i sprawdzenie dostępności.

Można byłoby też zapamiętywać ostatnio wybrany poziom albo dodać kilka drobnych usprawnień UX, ale na potrzeby tego zadania nie chciałem rozszerzać zakresu.

## Gdzie korzystałem z AI

Przed pisaniem kodu rozpisałem sobie problem, wymagania i miejsca, które mogą być bardziej problematyczne.

Do części tej analizy wykorzystałem własny workflow zrobiony w Mastrze. Modele OpenAI i Anthropic najpierw niezależnie analizowały zadanie, a później wzajemnie próbowały znaleźć błędy albo rzeczy pominięte w swoich odpowiedziach.

Użyłem tego głównie do szukania edge case'ów, niejasnych miejsc w specyfikacji i pomysłów na testy. Kod i ostateczne decyzje dotyczące tego, jak zachowuje się gra, sprawdzałem już sam na podstawie treści zadania.

Mastra nie jest częścią projektu ani jego zależnością. Potraktowałem ją po prostu jako dodatkowe narzędzie podczas analizy.

Podobny mechanizm testuję też w swoim prywatnym projekcie i podoba mi się samo podejście, w którym modele nie tylko dają odpowiedź, ale też wzajemnie próbują ją podważyć. Uznałem więc, że to zadanie będzie całkiem dobrym miejscem, żeby sprawdzić taki workflow w praktyce.

<img width="1030" height="901" alt="Zrzut ekranu 2026-08-14 o 02 55 25" src="https://github.com/user-attachments/assets/662fb2d4-8341-43c0-a282-74fddfc6fe79" />
