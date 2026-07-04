# Aldanat Care — Staff Quality Performance Dashboard
## Power BI Build Guide

Scope: quality domain (incidents, complaints, client feedback), monitored at organisation, team, and individual staff level over a rolling 12 months.

---

## 1. Load the data

1. Open Power BI Desktop, choose Get Data, then Excel, and select `Aldanat_Care_Quality_Sample_Data.xlsx`.
2. Tick the five tables: Staff, Clients, Incidents, Complaints, Feedback. Do not load README.
3. In Power Query, confirm data types: all date columns as Date, Score as Whole Number, everything else as Text. Click Close and Apply.

## 2. Create a Date table

In the Modelling ribbon, choose New Table and paste:

```
DimDate =
ADDCOLUMNS(
    CALENDAR(DATE(2025,7,1), DATE(2026,6,30)),
    "Year", YEAR([Date]),
    "Month Number", MONTH([Date]),
    "Month", FORMAT([Date], "MMM YYYY"),
    "Quarter", "Q" & FORMAT([Date], "Q YYYY")
)
```

Mark it as a date table (Table tools, Mark as date table, using the Date column). Sort the Month column by Month Number.

## 3. Build the model (star schema)

Create these single-direction, one-to-many relationships:

| From (one side) | To (many side) |
|---|---|
| Staff[StaffID] | Incidents[StaffID] |
| Staff[StaffID] | Complaints[StaffID] |
| Staff[StaffID] | Feedback[StaffID] |
| Clients[ClientID] | Incidents[ClientID] |
| Clients[ClientID] | Complaints[ClientID] |
| Clients[ClientID] | Feedback[ClientID] |
| DimDate[Date] | Incidents[IncidentDate] |
| DimDate[Date] | Complaints[DateReceived] |
| DimDate[Date] | Feedback[FeedbackDate] |

Staff and Clients are shared dimensions; the three fact tables never link to each other directly. This is what lets one staff slicer filter all three domains at once.

## 4. Core DAX measures

Create a blank table called `_Measures` (Enter Data, no rows) to hold these.

### Incidents
```
Incident Count = COUNTROWS(Incidents)

High Severity Incidents =
CALCULATE([Incident Count], Incidents[Severity] = "High")

CQC Notifiable Incidents =
CALCULATE([Incident Count], Incidents[CQCNotifiable] = "Yes")

% Reported Within 24h =
DIVIDE(
    CALCULATE([Incident Count], Incidents[ReportedWithin24h] = "Yes"),
    [Incident Count]
)

Open Incidents =
CALCULATE([Incident Count], Incidents[Status] = "Open")

Avg Days to Close Incident =
AVERAGEX(
    FILTER(Incidents, NOT ISBLANK(Incidents[DateClosed])),
    DATEDIFF(Incidents[IncidentDate], Incidents[DateClosed], DAY)
)

Incidents per 1000 Contracted Hours =
DIVIDE([Incident Count], SUM(Staff[ContractedHours]) * 52 / 1000)
```

### Complaints
```
Complaint Count = COUNTROWS(Complaints)

Upheld Complaints =
CALCULATE([Complaint Count],
    Complaints[Outcome] IN {"Upheld", "Partially upheld"})

% Complaints Upheld = DIVIDE([Upheld Complaints], [Complaint Count])

Avg Resolution Days =
AVERAGEX(
    FILTER(Complaints, NOT ISBLANK(Complaints[DateResolved])),
    DATEDIFF(Complaints[DateReceived], Complaints[DateResolved], DAY)
)

% Resolved Within 28 Days =
VAR Resolved = FILTER(Complaints, NOT ISBLANK(Complaints[DateResolved]))
RETURN
DIVIDE(
    COUNTROWS(FILTER(Resolved,
        DATEDIFF(Complaints[DateReceived], Complaints[DateResolved], DAY) <= 28)),
    COUNTROWS(Resolved)
)
```

### Feedback
```
Avg Feedback Score = AVERAGE(Feedback[Score])

Feedback Count = COUNTROWS(Feedback)

% Would Recommend =
DIVIDE(
    CALCULATE([Feedback Count], Feedback[WouldRecommend] = "Yes"),
    [Feedback Count]
)

Low Scores (1-2) =
CALCULATE([Feedback Count], Feedback[Score] <= 2)
```

### Trend and composite
```
Incidents Prior Month =
CALCULATE([Incident Count], DATEADD(DimDate[Date], -1, MONTH))

Incident MoM Change = [Incident Count] - [Incidents Prior Month]

Quality Risk Score =
// Simple weighted composite per staff member; tune weights with management
    ([Incident Count] * 2)
  + ([High Severity Incidents] * 5)
  + ([Upheld Complaints] * 4)
  + ([Low Scores (1-2)] * 1)

Quality RAG =
SWITCH(TRUE(),
    [Quality Risk Score] >= 25, "Red",
    [Quality Risk Score] >= 12, "Amber",
    "Green")
```

## 5. Report pages

### Page 1 — Quality Overview
- KPI cards across the top: Incident Count, High Severity Incidents, Complaint Count, % Complaints Upheld, Avg Feedback Score, % Would Recommend.
- Line chart: Incident Count and Complaint Count by Month.
- Stacked column: incidents by Category, split by Severity.
- Slicers: Month, Team, Care Package.

### Page 2 — Incidents
- Cards: Open Incidents, % Reported Within 24h, CQC Notifiable Incidents, Avg Days to Close.
- Matrix: Staff on rows, incident Category on columns, values Incident Count, with conditional formatting (colour scale).
- Table of open incidents sorted by age, for management follow-up.

### Page 3 — Complaints and Feedback
- Donut: complaints by Source. Bar: complaints by Category.
- Column chart: Avg Feedback Score by Month, with a constant line at target 4.0.
- Bar chart: Low Scores (1-2) by Theme to show what drives dissatisfaction.

### Page 4 — Staff Drill-through
- Set StaffName as a drill-through field so right-clicking any staff member from other pages lands here.
- Cards for that individual: Quality Risk Score, Quality RAG, Incident Count, Upheld Complaints, Avg Feedback Score.
- Timeline of their incidents and complaints, and a feedback score trend.
- Add a table on the Overview page listing StaffName, Team, Quality Risk Score, Quality RAG, sorted descending, so the highest-risk staff surface immediately.

## 6. Suggested RAG thresholds (adjust with management)

| Metric | Green | Amber | Red |
|---|---|---|---|
| % Reported Within 24h | >= 95% | 85–95% | < 85% |
| % Resolved Within 28 Days | >= 90% | 75–90% | < 75% |
| Avg Feedback Score | >= 4.2 | 3.5–4.2 | < 3.5 |
| % Complaints Upheld | < 25% | 25–40% | > 40% |

## 7. Governance and interpretation notes

- Normalise before judging individuals. A carer with more visits will mechanically log more incidents. When real data is available, add visit or hours-worked volumes and rate all counts per 100 visits. High raw incident counts can also indicate good reporting culture, not poor care; interpret alongside severity and feedback.
- Use the dashboard for supervision conversations, not automated sanctions. Pair Red flags with a documented review before any performance process.
- CQC alignment. Notifiable incidents and complaint handling evidence map to the Safe and Well-led key questions; keep the 24-hour reporting and 28-day resolution measures visible for inspection readiness.
- Data protection. Restrict the published report to managers via a Power BI workspace with row-level security if team leaders should only see their own team (RLS rule: `[Team] = USERPRINCIPALNAME()` lookup against a manager mapping table). Never include client names.
- Refresh. Point Power Query at a maintained Excel or SharePoint source with the same column names, and schedule refresh in the Power BI Service.
