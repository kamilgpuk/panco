import Link from 'next/link'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-1.5">{title}</h3>
      <div className="space-y-2 text-gray-700">{children}</div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed">{children}</p>
}

function Callout({ color = 'blue', children }: { color?: 'blue' | 'amber' | 'green' | 'gray'; children: React.ReactNode }) {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <div className={`text-sm border rounded-lg px-4 py-3 ${styles[color]}`}>
      {children}
    </div>
  )
}

function Badge({ children, variant = 'blue' }: { children: React.ReactNode; variant?: 'blue' | 'green' | 'slate' | 'orange' }) {
  const styles = {
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    slate: 'bg-slate-200 text-slate-700 border-l-4 border-blue-400',
    orange: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${styles[variant]}`}>
      {children}
    </span>
  )
}

function ActionRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="font-medium text-gray-800 w-36 flex-shrink-0">{label}</span>
      <span className="text-gray-600">{desc}</span>
    </div>
  )
}

const TOC = [
  { id: 'overview', label: 'Co to jest Panco?' },
  { id: 'queue', label: 'Jak działa kolejka' },
  { id: 'views', label: 'Widoki kalendarza' },
  { id: 'tasks', label: 'Zadania — wygląd' },
  { id: 'actions', label: 'Akcje na zadaniach' },
  { id: 'drag', label: 'Przeciąganie i zmiana rozmiaru' },
  { id: 'hours', label: 'Godziny pracy' },
  { id: 'settings', label: 'Ustawienia' },
]

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
          ← Harmonogram
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Pomoc</h1>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex gap-10">

        {/* Table of contents */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-20">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Spis treści</p>
            <nav className="space-y-1">
              {TOC.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-0.5 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-10 min-w-0">

          <Section id="overview" title="Co to jest Panco?">
            <P>
              Panco to narzędzie do planowania i zarządzania kolejką zadań produkcyjnych
              dla dwóch maszyn CNC. Pokazuje, kiedy każde zadanie zostanie zrealizowane,
              i automatycznie przelicza harmonogram po każdej zmianie.
            </P>
            <Callout color="blue">
              <strong>Kluczowa zasada:</strong> harmonogram jest zawsze wyliczany na bieżąco
              po stronie przeglądarki — żadne daty nie są zapisywane w bazie. Zmiana godzin pracy
              lub przestawienie kolejności natychmiast aktualizuje cały plan.
            </Callout>
            <P>
              Aplikacja obsługuje dwie maszyny niezależnie: każda ma własną kolejkę zadań,
              własne godziny pracy i własny zespół. Wszyscy użytkownicy widzą ten sam widok
              w czasie rzeczywistym — zmiany jednej osoby są od razu widoczne u pozostałych.
            </P>
          </Section>

          <Section id="queue" title="Jak działa kolejka">
            <P>
              Każda maszyna ma uporządkowaną listę zadań. Zadania są realizowane jedno po drugim,
              bez przerw — gdy jedno się kończy, następne zaczyna się automatycznie na początku
              najbliższego dostępnego okna roboczego.
            </P>

            <Sub title="Pozycja w kolejce">
              <P>
                Każde zadanie ma numer pozycji. Pozycja <strong>0</strong> oznacza zadanie
                aktualnie realizowane lub pierwsze do realizacji. Kolejne zadania mają pozycje
                1, 2, 3…
              </P>
            </Sub>

            <Sub title="Zadanie w toku">
              <P>
                Zadanie jest oznaczone jako <Badge variant="blue">W toku</Badge> tylko wtedy,
                gdy bieżąca godzina mieści się w jego wyliczonym oknie czasowym.
                Poza godzinami pracy zadanie na pozycji 0 wygląda jak zwykłe zadanie w kolejce
                i można je przestawiać.
              </P>
            </Sub>

            <Sub title="Automatyczne planowanie">
              <P>
                Algorytm układa zadania kolejno w dostępnych godzinach pracy. Jeśli zadanie
                nie mieści się w bieżącym dniu, jego reszta przechodzi na następny dzień roboczy.
                Weekendy i dni wolne są automatycznie pomijane.
              </P>
            </Sub>

            <Callout color="amber">
              <strong>Ważne:</strong> zadanie na pozycji 0, które jest aktualnie realizowane
              (W toku), nie może być przeciągane ani przestawiane. Wszystkie pozostałe zadania —
              w tym pierwsze w kolejce poza godzinami pracy — można swobodnie reorganizować.
            </Callout>
          </Section>

          <Section id="views" title="Widoki kalendarza">
            <P>
              Przyciski w prawym górnym rogu pozwalają przełączać się między trzema widokami:
            </P>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="font-medium w-20 flex-shrink-0">Dzień</span>
                <span className="text-gray-600">Jeden dzień, pełna szerokość dla każdej maszyny. Najczytelniejszy widok do pracy bieżącej.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium w-20 flex-shrink-0">3 dni</span>
                <span className="text-gray-600">Trzy kolejne dni. Domyślny widok — pozwala zobaczyć zadania, które przechodzą przez zmianę dnia.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium w-20 flex-shrink-0">Tydzień</span>
                <span className="text-gray-600">Siedem dni. Przydatny do planowania i oceny obciążenia w dłuższej perspektywie.</span>
              </div>
            </div>
            <P>
              Strzałki ← → przesuwają widok o liczbę dni równą aktywnemu widokowi.
              Przycisk <strong>Dziś</strong> wraca do bieżącego dnia.
            </P>
            <Callout color="gray">
              Zakres godzin osi pionowej jest dopasowywany automatycznie do godzin pracy
              i zaplanowanych zadań — nie jest stały.
            </Callout>
          </Section>

          <Section id="tasks" title="Zadania — wygląd">
            <Sub title="Kolory">
              <P>
                Kolor identyfikuje maszynę i pozycję w kolejce:
              </P>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-8 rounded bg-blue-600 flex-shrink-0" />
                  <span><strong>Router 1 — W toku</strong>: pełny niebieski</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-8 rounded bg-blue-50 border-l-4 border-blue-300 flex-shrink-0" />
                  <span><strong>Router 1 — nieparzyste</strong> w kolejce: jasny niebieski pasek</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-8 rounded bg-blue-100 border-l-4 border-blue-500 flex-shrink-0" />
                  <span><strong>Router 1 — parzyste</strong> w kolejce: ciemniejszy niebieski pasek</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-8 rounded bg-green-600 flex-shrink-0" />
                  <span><strong>Router 2 — W toku</strong>: pełny zielony</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-8 rounded bg-green-50 border-l-4 border-green-300 flex-shrink-0" />
                  <span><strong>Router 2</strong> — analogicznie zielone paski</span>
                </div>
              </div>
              <P>
                Naprzemienne jasny/ciemny pasek po lewej stronie kafelka ułatwia odróżnienie
                sąsiednich zadań na osi czasu.
              </P>
            </Sub>

            <Sub title="Zadanie wielodniowe">
              <P>
                Jeśli zadanie nie mieści się w jednym dniu roboczym, jest podzielone na odcinki.
                Na kafelku pojawia się wtedy etykieta <em>→ jutro</em> lub <em>← wczoraj</em>
                informująca, że zadanie kontynuuje się na sąsiednim dniu.
              </P>
            </Sub>

            <Sub title="Godziny pracy — szare tło">
              <P>
                Obszary poza godzinami pracy (przed zmianą i po zmianie) są wyróżnione
                szarym tłem — podobnie jak w Google Calendar. Dni wolne mają całą kolumnę szarą.
                Zadania nigdy nie są planowane w tych strefach.
              </P>
            </Sub>
          </Section>

          <Section id="actions" title="Akcje na zadaniach">
            <P>
              Kliknięcie kafelka otwiera panel szczegółów. Prawy przycisk myszy (lub ikona ⋮
              widoczna po najechaniu) otwiera menu kontekstowe.
            </P>

            <Sub title="Zadanie W toku">
              <div className="space-y-2 mt-1">
                <ActionRow label="Zakończ teraz" desc="Usuwa zadanie — maszyna przechodzi do następnego." />
                <ActionRow label="Przedłuż" desc="Wydłuża czas trwania zadania. Wszystkie kolejne zadania przesuwają się automatycznie." />
                <ActionRow label="Podziel" desc="Dzieli zadanie na dwie części. Podajesz czas pierwszej — reszta staje się nowym zadaniem zaraz po niej." />
              </div>
            </Sub>

            <Sub title="Zadanie w kolejce (nie W toku)">
              <div className="space-y-2 mt-1">
                <ActionRow label="Zmień czas" desc="Zmienia łączny czas trwania zadania." />
                <ActionRow label="Podziel" desc="Jak wyżej — dostępne też dla zadań jeszcze nie rozpoczętych." />
                <ActionRow label="↑ W górę / ↓ W dół" desc="Przesuwa zadanie o jedną pozycję w górę lub w dół kolejki." />
                <ActionRow label="Usuń" desc="Usuwa zadanie z kolejki. Następne zadania wypełniają lukę." />
              </div>
            </Sub>

            <Callout color="gray">
              Akcje <strong>↑ W górę</strong> i <strong>↓ W dół</strong> są wyszarzone,
              gdy zadanie jest już na skraju kolejki lub gdy zadanie na pozycji 0 jest aktualnie W toku.
            </Callout>
          </Section>

          <Section id="drag" title="Przeciąganie i zmiana rozmiaru">
            <Sub title="Przestawianie kolejności (drag & drop)">
              <P>
                Każde zadanie, które nie jest aktualnie W toku, można przeciągnąć w inne miejsce
                na tej samej maszynie lub na drugą maszynę.
              </P>
              <P>
                Podczas przeciągania pojawia się niebieska linia wskaźnikowa pokazująca,
                gdzie zadanie zostanie wstawione. Upuszczenie nad lub pod innym zadaniem
                wstawia je w to miejsce; pozostałe zadania przesuwają się odpowiednio.
              </P>
            </Sub>

            <Sub title="Przenoszenie na inną maszynę">
              <P>
                Przeciągnięcie zadania do kolumny drugiej maszyny przenosi je na koniec
                jej kolejki. Harmonogram obu maszyn jest aktualizowany natychmiast.
              </P>
            </Sub>

            <Sub title="Usuwanie przez przeciągnięcie na kosz">
              <P>
                Podczas przeciągania w prawym dolnym rogu ekranu pojawia się ikona kosza.
                Upuszczenie zadania na kosz usuwa je bez potwierdzenia.
              </P>
            </Sub>

            <Sub title="Zmiana czasu trwania (resize)">
              <P>
                Na dole każdego kafelka (z wyjątkiem zadania W toku) znajduje się uchwyt
                zmiany rozmiaru — widoczny jako szara linia po najechaniu kursorem.
                Przeciągnięcie go w górę lub w dół zmienia czas trwania zadania.
                Sąsiednie zadania automatycznie przesuwają się po puszczeniu uchwytu.
              </P>
            </Sub>

            <Callout color="amber">
              Zadanie oznaczone jako <Badge variant="blue">W toku</Badge> nie może być
              przeciągane ani skalowane — jest zablokowane na czas realizacji.
            </Callout>
          </Section>

          <Section id="hours" title="Godziny pracy">
            <Sub title="Domyślny tygodniowy harmonogram">
              <P>
                Każda maszyna ma własny harmonogram tygodniowy (np. Pon–Pt 6:00–14:00).
                Zmiana ustawień w <Link href="/settings" className="text-blue-600 hover:underline">Ustawieniach</Link> wpływa
                na wszystkie przyszłe obliczenia harmonogramu.
              </P>
            </Sub>

            <Sub title="Wyjątki na konkretny dzień">
              <P>
                Bezpośrednio z widoku kalendarza można zmienić godziny pracy dla dowolnego
                dnia i maszyny:
              </P>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 mt-1">
                <li>W widoku <strong>Dzień</strong>: kliknij godziny wyświetlone obok nazwy maszyny (np. <em>06:00–14:00 ✎</em>)</li>
                <li>W widoku <strong>3 dni / Tydzień</strong>: kliknij ikonę ✎ w nagłówku kolumny danego dnia</li>
              </ul>
              <P>
                Otworzy się okno pozwalające ustawić inne godziny lub oznaczyć dzień jako wolny.
                Wyjątek oznaczony jest symbolem <Badge variant="orange">*</Badge> przy dacie.
                Można go w każdej chwili zresetować do ustawień domyślnych.
              </P>
            </Sub>

            <Callout color="green">
              Zmiany godzin pracy są widoczne dla wszystkich użytkowników natychmiast —
              harmonogram jest przeliczany w czasie rzeczywistym przez każdą przeglądarkę.
            </Callout>
          </Section>

          <Section id="settings" title="Ustawienia">
            <P>
              Strona <Link href="/settings" className="text-blue-600 hover:underline">Ustawienia</Link> (ikona ⚙ w górnym menu)
              pozwala zarządzać harmonogramem tygodniowym dla każdej maszyny osobno.
            </P>

            <Sub title="Domyślne godziny pracy">
              <P>
                Tabela z siedmioma wierszami (Poniedziałek–Niedziela). Dla każdego dnia można:
              </P>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 mt-1">
                <li>Zaznaczyć/odznaczyć checkbox <strong>Pracujący</strong></li>
                <li>Ustawić godzinę rozpoczęcia i zakończenia zmiany</li>
              </ul>
              <P>
                Zmiany są zapisywane automatycznie po każdej modyfikacji checkboxa lub po
                opuszczeniu pola godziny.
              </P>
            </Sub>

            <Sub title="Wyjątki">
              <P>
                Sekcja <em>Wyjątki (święta, przestoje)</em> pokazuje listę dni z niestandardowymi
                godzinami pracy. Można je usuwać lub edytować — wygodniej jednak robić to
                bezpośrednio z widoku kalendarza (patrz sekcja <em>Godziny pracy</em> powyżej).
              </P>
            </Sub>

            <Callout color="amber">
              <strong>Uwaga:</strong> upewnij się, że Niedziela i Sobota mają odznaczony
              checkbox <em>Pracujący</em>. Błędne ustawienie spowoduje planowanie zadań
              w weekendy.
            </Callout>
          </Section>

        </div>
      </div>
    </main>
  )
}
