# Demand Forecasting (Product hooks) — full product page

Purpose
-------
Demand forecasting helps federations plan capacity, training, and targeted worker mobilization ahead of peak seasons.

What it contains
----------------
- Data extraction hooks from bookings and search logs
- Aggregation endpoints (product dashboard to visualize trends)
- Placeholder for ML model integration (seasonal / locality forecasts)

Implementation notes
--------------------
- Historical bookings table is the primary data source. Implement ETL pipeline to feed forecasting models (outside the repo) or add a backend service to compute simple moving averages.
- The product currently includes documentation and placeholders; production ML pipelines are in roadmap.

How to test
-----------
- Export booking aggregates and run a simple moving average analysis locally; include snapshots in reports or dashboards.

