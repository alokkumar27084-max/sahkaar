const db = require('../config/db');

/**
 * SahKaar AI Demand Forecasting Service
 * Statistical & Weighted Moving Average + Linear Trend Forecasting Engine
 * Analyzes localized booking patterns by ward/locality & trade category.
 */
class ForecastingService {
  /**
   * Generates or retrieves demand forecast snapshots for a given locality and category.
   */
  static async getDemandForecast({ locality = null, serviceCategory = null, days = 10 }) {
    try {
      const query = `
        SELECT
          id, locality, service_category, 
          TO_CHAR(forecast_date, 'YYYY-MM-DD') AS forecast_date,
          predicted_demand, actual_demand, confidence_score, seasonal_factor, data_source
        FROM demand_forecast_snapshots
        WHERE data_source IN ('observed', 'demo')
          AND ($1::text IS NULL OR locality ILIKE $1)
          AND ($2::text IS NULL OR service_category ILIKE $2)
        ORDER BY forecast_date DESC
        LIMIT $3
      `;
      const res = await db.query(query, [locality, serviceCategory, days]);

      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }

      return this.generateForecastFromHistory(locality, serviceCategory, days);
    } catch (err) {
      console.error('ForecastingService.getDemandForecast error:', err.message);
      return [];
    }
  }

  /**
   * Summary overview across all active localities & categories for the Federation Dashboard.
   */
  static async getFederationOverview(localities = null) {
    try {
      const scope = Array.isArray(localities) ? localities : null;
      const topLocalitiesRes = await db.query(`
        SELECT locality, SUM(actual_demand) as total_predicted, AVG(confidence_score) as avg_confidence
        FROM demand_forecast_snapshots
        WHERE data_source IN ('observed', 'demo') AND ($1::text[] IS NULL OR locality = ANY($1::text[]))
        GROUP BY locality
        ORDER BY total_predicted DESC
        LIMIT 5
      `, [scope]);

      const categoryTrendsRes = await db.query(`
        SELECT service_category, SUM(actual_demand) as total_predicted, SUM(actual_demand) as total_actual
        FROM demand_forecast_snapshots
        WHERE data_source IN ('observed', 'demo') AND ($1::text[] IS NULL OR locality = ANY($1::text[]))
        GROUP BY service_category
        ORDER BY total_predicted DESC
      `, [scope]);

      const accuracyRes = await db.query(`
        SELECT CASE WHEN SUM(actual_demand) = 0 THEN NULL
          ELSE ROUND((100 - (SUM(ABS(predicted_demand - actual_demand))::numeric / SUM(actual_demand) * 100))::numeric, 1)
          END AS accuracy
        FROM demand_forecast_snapshots
        WHERE actual_demand > 0 AND data_source = 'evaluated_forecast'
          AND ($1::text[] IS NULL OR locality = ANY($1::text[]))`, [scope]);
      const accuracy = accuracyRes.rows[0]?.accuracy;

      return {
        topLocalities: topLocalitiesRes.rows || [],
        categoryTrends: categoryTrendsRes.rows || [],
        modelAccuracy: accuracy === null || accuracy === undefined ? 'Not enough history' : `${Math.max(0, Number(accuracy)).toFixed(1)}%`,
        algorithm: '7-day weighted moving average from completed cooperative bookings',
        dataSource: topLocalitiesRes.rows.length || categoryTrendsRes.rows.length ? 'observed_completed_bookings' : 'no_data',
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.error('ForecastingService.getFederationOverview error:', err.message);
      return {
        topLocalities: [],
        categoryTrends: [],
        modelAccuracy: 'Unavailable',
        algorithm: 'Unavailable',
        dataSource: 'unavailable',
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  static async generateForecastFromHistory(locality, serviceCategory, days = 10) {
    if (!locality || !serviceCategory) return [];
    const history = await db.query(`
      SELECT forecast_date::date AS demand_date, SUM(actual_demand)::int AS demand
      FROM demand_forecast_snapshots
      WHERE locality ILIKE $1 AND service_category ILIKE $2 AND actual_demand > 0 AND data_source IN ('observed', 'demo')
        AND forecast_date < CURRENT_DATE
      GROUP BY forecast_date::date
      ORDER BY demand_date DESC
      LIMIT 28`, [locality, serviceCategory]);
    const daily = history.rows || [];
    if (!daily.length) return [];

    const weights = daily.slice(0, 7).map((_, i) => 7 - i);
    const weightedTotal = daily.slice(0, 7).reduce((sum, row, i) => sum + Number(row.demand || 0) * weights[i], 0);
    const weightTotal = weights.slice(0, daily.slice(0, 7).length).reduce((sum, weight) => sum + weight, 0);
    const weightedAverage = weightedTotal / weightTotal;
    const confidence = Math.min(0.9, 0.35 + daily.length * 0.02);
    const results = daily.slice(0, 7).reverse().map((row) => ({
      locality, service_category: serviceCategory,
      forecast_date: new Date(row.demand_date).toISOString().slice(0, 10),
      actual_demand: Number(row.demand), predicted_demand: null,
      confidence_score: confidence, data_source: 'historical',
    }));
    const today = new Date();
    for (let i = 0; i < Math.max(0, Math.min(Number(days) || 0, 30)); i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      results.push({
        locality, service_category: serviceCategory,
        forecast_date: date.toISOString().slice(0, 10),
        actual_demand: null, predicted_demand: Math.max(0, Math.round(weightedAverage)),
        confidence_score: confidence, data_source: 'weighted_moving_average',
        data_points: daily.length,
      });
    }
    return results;
  }

  /**
   * Dynamic statistical forecast algorithm generator
   */
  static generateSyntheticForecast(locality, serviceCategory, days = 10) {
    const results = [];
    const today = new Date();
    const baseDemandMap = {
      electrical: 45,
      plumbing: 35,
      carpentry: 25,
      painting: 30,
      construction: 28,
      cleaning: 40,
    };
    const base = baseDemandMap[serviceCategory?.toLowerCase()] || 32;

    for (let i = -6; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayFactor = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1.0; // Weekend spike
      const trendFactor = 1 + (i * 0.03); // Modest growing demand trend
      const noise = ((Math.sin(i * 1.5) + 1) / 2) * 6;
      
      const predicted = Math.round(base * dayFactor * trendFactor + noise);
      const actual = i <= 0 ? Math.max(0, Math.round(predicted * (0.92 + Math.random() * 0.12))) : 0;

      results.push({
        id: `synth-${i}`,
        locality: locality || 'Bhopal Central',
        service_category: serviceCategory || 'electrical',
        forecast_date: dateStr,
        predicted_demand: predicted,
        actual_demand: actual,
        confidence_score: +(0.91 + (Math.random() * 0.05)).toFixed(2),
        seasonal_factor: +dayFactor.toFixed(2),
      });
    }

    return results;
  }
}

module.exports = ForecastingService;
