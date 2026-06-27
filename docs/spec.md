# Spec: Documenting the Backend & the Desktop Agent

A practical specification for writing the **Backend** and **Desktop Agent**
chapters of the graduation-project book. It defines *what* to show, *how* to
explain it, and ships **ready-to-paste LaTeX** that styles the code, separates
code from prose, and compiles as-is.

The goal is a **good representation of the project, not an exhaustive code
dump.** Show a few carefully chosen segments well; describe the rest in prose
and diagrams.

---

## 1. The two systems (the through-line)

Both subsystems are the **same Clean Architecture told twice, in two languages.**
That parallel is the narrative spine of these two chapters.

- **Backend (`api/`)** — .NET 8 Web API. Clean Architecture in four layers
  (`Domain`, `Application`, `Infrastructure`, `Web.Api`) organized as
  **vertical slices**: each feature is a folder of `Command / Handler /
  Validator` plus a thin `IEndpoint`. Errors flow through an explicit
  `Result<T>` instead of exceptions. Cross-cutting concerns live in decorators
  (`ValidationDecorator`, `LoggingDecorator`); side-effects are decoupled via
  domain events.
- **Desktop Agent (`desktop-agent/`)** — Python. The *same* layering
  (`domain / application / infrastructure / presentation`). Boundaries are
  declared as `Protocol` ports. A thread-safe `PynputKeyboardMonitor`
  aggregates **six keystroke-timing features** per batch window (never the keys
  themselves) and submits them to the backend.

---

## 2. Selection rule — what earns a place in the book

A code segment is included **only** if it demonstrates one of:

1. **An architectural decision** (e.g. `Result<T>`, the `Protocol` ports).
2. **A non-obvious algorithm** (e.g. the keystroke feature aggregation).
3. **A contract between two systems** (e.g. the agent → API → ML endpoint).

Everything else is prose or a diagram. Target **3–6 segments per subsystem**,
each trimmed to **10–25 lines**.

### Backend shortlist

| Segment | Why it earns a page |
|---|---|
| `SharedKernel/Result.cs` | The error-handling philosophy — no exceptions for control flow. |
| One full vertical slice (`Surveys/SubmitSurveyResponse`: Command/Handler/Validator) | The repeating shape readers meet ~60 times. Show it **once**. |
| `Web.Api/Endpoints/Stress/SubmitMetrics.cs` | The contract: desktop agent → API → ML service (the 6 features). |
| `ValidationDecorator` or `HighStressDetectedDomainEvent` | Cross-cutting concerns & decoupled side-effects (alerts). |
| `Infrastructure/StressDetection/BackgroundServices/AbandonedSessionCleanupService.cs` | Shows real-world failure handling (sessions that never end). |

### Desktop-agent shortlist

| Segment | Why |
|---|---|
| `application/ports.py` (`ApiGateway` Protocol) | The clean-architecture boundary; mirrors the backend's interfaces. |
| `PynputKeyboardMonitor` aggregation | The novel signal-processing core — the 6 features. **Spend the most space here.** |
| `auth_service` / `session_service` | The lifecycle: login → device → session → batch submit. |

---

## 3. Per-segment recipe (use it identically every time)

The fixed rhythm is **how the reader tells code from explanation** — code is
always a gray, line-numbered, banner-topped block; explanation is always a
blue-bordered box labeled *Explanation*. They never blur.

1. **Lead-in sentence** (1 line) — the problem this code solves, *before* the
   code appears.
2. **Code listing** — trimmed to the essence, with a **filename banner** so its
   origin is unambiguous.
3. **Explanation box** — 2–4 sentences on *what it does* and **why it's built
   this way**. Never restate the code line-by-line; explain intent and
   trade-offs.

---

## 4. Chapter shape

**Introduction (one paragraph per system):** state *responsibility, technology,
and architecture in one breath*, then a layer diagram, *then* the segments.
Lead with the shape, not the code.

**Body:** the curated segments, each via the recipe in §3.

**Conclusion (3–4 sentences):** restate that both systems share one architecture
in two languages; name the payoff (testability, framework-free domain,
independent evolution behind typed contracts); hand off to the next chapter
(ML service / evaluation). **No new code in the conclusion.**

---

## 5. LaTeX — preamble (paste once, before `\begin{document}`)

```latex
% ---- packages for code documentation ----
\usepackage[T1]{fontenc}
\usepackage{xcolor}
\usepackage{listings}
\usepackage[most]{tcolorbox}
\tcbuselibrary{listingsutf8}

% ---- palette ----
\definecolor{codebg}{HTML}{F7F8FA}
\definecolor{codeframe}{HTML}{D9DEE4}
\definecolor{kw}{HTML}{0B5FFF}
\definecolor{str}{HTML}{0A7D38}
\definecolor{cmt}{HTML}{7A8794}
\definecolor{num}{HTML}{9AA4AF}
\definecolor{accent}{HTML}{3578FF}   % Subl blue
\definecolor{banner}{HTML}{1F2933}

% ---- base listing style ----
\lstdefinestyle{subl}{
  backgroundcolor=\color{codebg},
  basicstyle=\ttfamily\footnotesize\color{black!88},
  keywordstyle=\color{kw}\bfseries,
  stringstyle=\color{str},
  commentstyle=\color{cmt}\itshape,
  numberstyle=\tiny\color{num},
  numbers=left, numbersep=10pt,
  frame=single, rulecolor=\color{codeframe},
  framesep=6pt, xleftmargin=16pt, xrightmargin=4pt,
  breaklines=true, breakatwhitespace=true,
  showstringspaces=false, tabsize=2,
  columns=fullflexible, keepspaces=true,
  upquote=true,
}
\lstdefinestyle{csharp}{style=subl,language=[Sharp]C,
  morekeywords={record,var,async,await,sealed,internal,Result}}
\lstdefinestyle{python}{style=subl,language=Python,
  morekeywords={Protocol,Optional,self}}

% ---- filename banner shown above each listing ----
% If you don't use fontawesome, delete "\faFileCode\," below.
\newcommand{\codefile}[1]{%
  \par\noindent
  \colorbox{banner}{\makebox[\linewidth][l]{%
    \ttfamily\footnotesize\color{white}\hspace{2pt}\faFileCode\,#1}}%
  \par\vspace{-2pt}}

% ---- the Explanation box: keeps prose visibly separate from code ----
\newtcolorbox{explain}{
  enhanced, breakable,
  colback=accent!4, colframe=accent,
  boxrule=0pt, leftrule=3pt,
  arc=2pt, left=10pt, right=8pt, top=6pt, bottom=6pt,
  fonttitle=\bfseries\small\color{accent},
  title={Explanation},
  before skip=4pt, after skip=14pt,
}
```

---

## 6. LaTeX — the reusable pattern (one segment)

Repeat this exact rhythm for every highlighted segment.

```latex
The backend never throws exceptions for expected failures; every operation
returns an explicit \texttt{Result} that the caller must inspect.

\codefile{api/src/SharedKernel/Result.cs}
\begin{lstlisting}[style=csharp]
public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error Error { get; }

    public static Result Success() => new(true, Error.None);
    public static Result<TValue> Success<TValue>(TValue value) =>
        new(value, true, Error.None);
    public static Result Failure(Error error) => new(false, error);
}
\end{lstlisting}

\begin{explain}
\texttt{Result} makes success and failure first-class values rather than
control flow. A handler returns \texttt{Result.Failure(error)} instead of
throwing, and the API layer maps it to the right HTTP status in one place.
This keeps the domain free of HTTP concerns and makes every failure path
explicit and testable.
\end{explain}
```

---

## 7. LaTeX — second worked segment (the desktop-agent boundary)

```latex
The agent depends only on \emph{interfaces}, never concrete classes. Every
boundary the application layer needs is declared as a Python \texttt{Protocol}.

\codefile{desktop-agent/subl\_agent/application/ports.py}
\begin{lstlisting}[style=python]
class ApiGateway(Protocol):
    def login(self, email: str, password: str) -> Tokens: ...
    def register_device(self, profile: DeviceProfile) -> str: ...
    def start_session(self, device_id: str, notes: Optional[str]) -> str: ...
    def submit_metrics(self, session_id: str, features: dict) -> Reading: ...
\end{lstlisting}

\begin{explain}
\texttt{ApiGateway} is the seam between the agent's logic and the network.
Services depend on this protocol, so the HTTP client can be swapped for a
fake in tests without touching business code. This mirrors the backend's use
of interfaces and keeps the two systems' architecture identical despite being
written in different languages.
\end{explain}
```

---

## 8. LaTeX — chapter skeleton (the surrounding structure)

```latex
\section{Backend Service}
The backend is a .NET~8 Web API built on Clean Architecture and organised as
\emph{vertical slices}: each feature lives in its own folder containing a
command, a handler, and a validator. The solution is split into four layers---
\textbf{Domain} (entities and rules, framework-free), \textbf{Application}
(use cases), \textbf{Infrastructure} (database, email, ML and real-time
adapters), and \textbf{Web.Api} (HTTP endpoints).

\begin{figure}[h]\centering
  % \includegraphics[width=.8\linewidth]{figures/backend-layers.pdf}
  \caption{Backend layers and dependency direction (inward only).}
\end{figure}

% --- highlighted segments here, each using the pattern in section 6 ---
% 1. Result.cs   2. one vertical slice   3. SubmitMetrics endpoint
% 4. a decorator or domain event   5. AbandonedSessionCleanupService

\section{Desktop Agent}
The desktop agent is a Python application that follows the same Clean
Architecture layout (\texttt{domain}, \texttt{application}, \texttt{infrastructure},
\texttt{presentation}). It captures keystroke \emph{timing}---never the keys
themselves---aggregates six statistical features per batch window, and submits
them to the backend.

% --- highlighted segments: ports.py, PynputKeyboardMonitor, session lifecycle ---

\section{Summary}
The backend and the desktop agent share a single architectural blueprint
expressed in two languages. Typed contracts---\texttt{Result} and explicit
errors on the server, \texttt{Protocol} ports on the client---keep each layer
replaceable and independently testable, while the domain in both systems stays
free of framework and transport concerns. The next chapter describes the
machine-learning service that turns these keystroke features into a stress
prediction.
```

---

## 9. Checklist before submitting the chapter

- [ ] Each subsystem opens with one architecture paragraph + a layer diagram.
- [ ] 3–6 segments per subsystem, none longer than ~25 lines.
- [ ] Every segment follows **sentence → banner-topped code → Explanation box**.
- [ ] No Explanation box restates the code line-by-line.
- [ ] The vertical-slice shape is shown **once**, then referenced, not repeated.
- [ ] The agent's feature-aggregation gets the most space (it's the novel part).
- [ ] Conclusion is 3–4 sentences and introduces no new code.
```
